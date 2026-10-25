import time
from typing import List, Dict, Optional, Any
from ..models.topology import NetworkTopology, Link
from ..models.traffic import TrafficDemand
from ..models.simulation import SimulationState, SimulationMetrics, SimulationEvent, PriorityMetricBreakdown
from .topology_service import TopologyService
from ..algorithms.dijkstra_router import DijkstraRouter
from ..algorithms.congestion_aware_router import CongestionAwareRouter
from ..algorithms.capacity_k_shortest_router import CapacityKShortestRouter
from ..algorithms.mcf_lp_router import MultiCommodityFlowLPRouter

class SimulationEngine:
    def __init__(self, topology_service: TopologyService):
        self.topology_service = topology_service
        self.demands: List[TrafficDemand] = []
        self.strategy: str = "capacity_k_shortest"
        self.metrics: SimulationMetrics = SimulationMetrics()
        self.events: List[SimulationEvent] = []
        self.event_step: int = 0

    def load_demands(self, demands: List[TrafficDemand]):
        self.demands = demands

    def set_strategy(self, strategy: str):
        valid_strategies = ["dijkstra", "congestion_aware", "capacity_k_shortest", "mcf_lp"]
        if strategy not in valid_strategies:
            raise ValueError(f"Unknown strategy '{strategy}'. Must be one of {valid_strategies}")
        self.strategy = strategy

    def add_event(self, event_type: str, description: str, affected_demands: List[str] = []):
        self.event_step += 1
        event = SimulationEvent(
            step=self.event_step,
            timestamp=round(time.time(), 3),
            event_type=event_type,
            description=description,
            affected_demands=affected_demands
        )
        self.events.append(event)

    def reset_simulation(self):
        # Reset traffic loads on topology links
        for link in self.topology_service.links.values():
            link.traffic_load = 0.0
            if self.topology_service.graph.has_edge(link.source, link.target):
                self.topology_service.graph.edges[link.source, link.target]["traffic_load"] = 0.0
            
        # Reset demand states
        for demand in self.demands:
            demand.allocated_rate = 0.0
            demand.status = "pending"
            demand.route = []
            demand.candidate_paths = []
            demand.explanation = None
            demand.bottleneck_link = None
            demand.bottleneck_capacity = None
            demand.path_latency = None
            demand.is_disconnected = False
            
        self.metrics = SimulationMetrics()

    def run_simulation(self, strategy: Optional[str] = None) -> SimulationState:
        if strategy:
            self.set_strategy(strategy)
            
        self.reset_simulation()
        start_time = time.perf_counter()

        # Priority map: Critical (1), High (2), Normal (3)
        priority_order = {"Critical": 1, "High": 2, "Normal": 3}
        
        # Deterministic demand sorting: Priority ASC, Rate DESC, ID ASC
        sorted_demands = sorted(
            self.demands,
            key=lambda d: (priority_order.get(d.priority, 3), -d.rate, d.id)
        )

        total_requested = 0.0
        total_delivered = 0.0
        total_dropped = 0.0
        total_latency_weighted = 0.0
        sum_path_latencies = 0.0
        delivered_demand_count = 0
        affected_demands = 0
        physical_disconnections = 0
        capacity_blocked_demands = 0
        sla_violations = 0

        # Priority breakdown counters
        p_stats = {
            "Critical": {"requested": 0.0, "delivered": 0.0, "dropped": 0.0},
            "High":     {"requested": 0.0, "delivered": 0.0, "dropped": 0.0},
            "Normal":   {"requested": 0.0, "delivered": 0.0, "dropped": 0.0}
        }

        for d in sorted_demands:
            p_stats[d.priority]["requested"] += d.rate
            total_requested += d.rate

        # --- ROUTING STRATEGY EXECUTION ---
        if self.strategy == "mcf_lp":
            lp_results = MultiCommodityFlowLPRouter.solve_mcf(self.topology_service, sorted_demands)
            
            for demand in sorted_demands:
                res = lp_results.get(demand.id, {})
                allocated = res.get("allocated_rate", 0.0)
                path = res.get("route", [])
                lat = res.get("path_latency", -1.0)
                explanation = res.get("explanation", "")

                demand.allocated_rate = allocated
                demand.route = path
                demand.path_latency = lat if lat > 0 else None
                demand.explanation = explanation
                
                if allocated >= demand.rate:
                    demand.status = "routed"
                elif allocated > 0:
                    demand.status = "partial"
                else:
                    demand.status = "dropped"
                    affected_demands += 1
                    
                # Update link loads along path
                if path and allocated > 0:
                    for i in range(len(path) - 1):
                        u = path[i]
                        v = path[i+1]
                        link = self.topology_service.get_link_by_nodes(u, v)
                        if link:
                            link.traffic_load += allocated
                            self.topology_service.graph.edges[u, v]["traffic_load"] = link.traffic_load

        else:
            # Sequential Routing Strategies (dijkstra, congestion_aware, capacity_k_shortest)
            for demand in sorted_demands:
                if self.strategy == "dijkstra":
                    path, latency = DijkstraRouter.compute_route(self.topology_service, demand.source, demand.target)
                    
                    if path:
                        # Capacity check along path
                        bottleneck = float('inf')
                        b_link = None
                        for i in range(len(path) - 1):
                            u = path[i]
                            v = path[i+1]
                            link = self.topology_service.get_link_by_nodes(u, v)
                            if link:
                                avail = max(0.0, link.bandwidth - link.traffic_load)
                                if avail < bottleneck:
                                    bottleneck = avail
                                    b_link = link.id
                                    
                        allocated = min(demand.rate, bottleneck)
                        demand.allocated_rate = allocated
                        demand.route = path
                        demand.path_latency = latency
                        demand.bottleneck_link = b_link
                        demand.bottleneck_capacity = bottleneck
                        
                        if allocated >= demand.rate:
                            demand.status = "routed"
                            demand.explanation = f"Dijkstra routed full demand ({allocated:.1f} Mbps) on shortest latency path {path}."
                        elif allocated > 0:
                            demand.status = "partial"
                            demand.explanation = f"Dijkstra allocated partial {allocated:.1f} Mbps constrained by bottleneck '{b_link}'."
                        else:
                            demand.status = "dropped"
                            capacity_blocked_demands += 1
                            affected_demands += 1
                            demand.explanation = f"Dijkstra shortest path {path} is fully saturated at link '{b_link}'."
                            
                        # Update loads
                        if allocated > 0:
                            for i in range(len(path) - 1):
                                u = path[i]
                                v = path[i+1]
                                link = self.topology_service.get_link_by_nodes(u, v)
                                if link:
                                    link.traffic_load += allocated
                                    self.topology_service.graph.edges[u, v]["traffic_load"] = link.traffic_load
                    else:
                        demand.allocated_rate = 0.0
                        demand.status = "dropped"
                        demand.is_disconnected = True
                        physical_disconnections += 1
                        affected_demands += 1
                        demand.explanation = f"Dijkstra: Target '{demand.target}' physically disconnected from '{demand.source}'."

                elif self.strategy == "congestion_aware":
                    path, latency = CongestionAwareRouter.compute_route(
                        self.topology_service, demand.source, demand.target, demand.rate
                    )
                    
                    if path:
                        demand.allocated_rate = demand.rate
                        demand.route = path
                        demand.path_latency = latency
                        demand.status = "routed"
                        demand.explanation = f"Congestion-Aware router assigned full rate ({demand.rate:.1f} Mbps) along path {path}."
                        
                        for i in range(len(path) - 1):
                            u = path[i]
                            v = path[i+1]
                            link = self.topology_service.get_link_by_nodes(u, v)
                            if link:
                                link.traffic_load += demand.rate
                                self.topology_service.graph.edges[u, v]["traffic_load"] = link.traffic_load
                    else:
                        demand.allocated_rate = 0.0
                        demand.status = "dropped"
                        affected_demands += 1
                        capacity_blocked_demands += 1
                        demand.explanation = f"Congestion-Aware router rejected demand: No link path found satisfying rate {demand.rate:.1f} Mbps."

                elif self.strategy == "capacity_k_shortest":
                    res = CapacityKShortestRouter.compute_route(
                        self.topology_service,
                        demand.source,
                        demand.target,
                        demand.rate,
                        k_paths=5,
                        max_latency_sla=demand.max_latency_sla
                    )
                    
                    demand.route = res["route"] or []
                    demand.allocated_rate = res["allocated_rate"]
                    demand.path_latency = res["path_latency"] if res["path_latency"] > 0 else None
                    demand.candidate_paths = res["candidate_paths"]
                    demand.explanation = res["explanation"]
                    demand.bottleneck_link = res["bottleneck_link"]
                    demand.bottleneck_capacity = res["bottleneck_capacity"]
                    demand.is_disconnected = res["is_disconnected"]
                    
                    if demand.is_disconnected:
                        physical_disconnections += 1
                        affected_demands += 1
                        demand.status = "dropped"
                    elif demand.allocated_rate >= demand.rate:
                        demand.status = "routed"
                    elif demand.allocated_rate > 0:
                        demand.status = "partial"
                        affected_demands += 1
                    else:
                        demand.status = "dropped"
                        capacity_blocked_demands += 1
                        affected_demands += 1

                    # Update link loads along selected path
                    if demand.route and demand.allocated_rate > 0:
                        for i in range(len(demand.route) - 1):
                            u = demand.route[i]
                            v = demand.route[i+1]
                            link = self.topology_service.get_link_by_nodes(u, v)
                            if link:
                                link.traffic_load += demand.allocated_rate
                                self.topology_service.graph.edges[u, v]["traffic_load"] = link.traffic_load

        # --- POST-PROCESSING METRICS ---
        elapsed_ms = (time.perf_counter() - start_time) * 1000.0

        for d in sorted_demands:
            p_stats[d.priority]["delivered"] += d.allocated_rate
            dropped_amt = d.rate - d.allocated_rate
            p_stats[d.priority]["dropped"] += dropped_amt
            
            total_delivered += d.allocated_rate
            total_dropped += dropped_amt

            if d.allocated_rate > 0 and d.path_latency and d.path_latency > 0:
                total_latency_weighted += d.path_latency * d.allocated_rate
                sum_path_latencies += d.path_latency
                delivered_demand_count += 1
                
                if d.max_latency_sla and d.path_latency > d.max_latency_sla:
                    sla_violations += 1

        # Utilization metrics
        total_utilization = 0.0
        max_util = 0.0
        op_links = 0
        failed_links = 0
        
        for link in self.topology_service.links.values():
            if link.status == "operational":
                op_links += 1
                util = link.utilization
                total_utilization += util
                if util > max_util:
                    max_util = util
            else:
                failed_links += 1

        avg_net_util = (total_utilization / op_links) if op_links > 0 else 0.0
        weighted_latency = (total_latency_weighted / total_delivered) if total_delivered > 0 else None
        unweighted_latency = (sum_path_latencies / delivered_demand_count) if delivered_demand_count > 0 else None

        # Calculate Priority breakdowns
        def make_breakdown(p_name: str) -> PriorityMetricBreakdown:
            req = p_stats[p_name]["requested"]
            deliv = p_stats[p_name]["delivered"]
            drop = p_stats[p_name]["dropped"]
            rate = (deliv / req * 100.0) if req > 0 else 100.0
            return PriorityMetricBreakdown(
                requested=req, delivered=deliv, dropped=drop, delivery_rate=round(rate, 2)
            )

        crit_breakdown = make_breakdown("Critical")
        high_breakdown = make_breakdown("High")
        norm_breakdown = make_breakdown("Normal")

        overall_deliv_ratio = (total_delivered / total_requested * 100.0) if total_requested > 0 else 100.0

        self.metrics = SimulationMetrics(
            total_requested_traffic=round(total_requested, 2),
            total_delivered_traffic=round(total_delivered, 2),
            total_dropped_traffic=round(total_dropped, 2),
            delivery_ratio=round(overall_deliv_ratio, 2),
            average_latency=round(unweighted_latency, 2) if unweighted_latency else None,
            demand_weighted_latency=round(weighted_latency, 2) if weighted_latency else None,
            network_utilization=round(avg_net_util, 2),
            max_link_utilization=round(max_util, 2),
            operational_links=op_links,
            failed_links=failed_links,
            affected_demands=affected_demands,
            critical_delivery_rate=crit_breakdown.delivery_rate,
            high_delivery_rate=high_breakdown.delivery_rate,
            normal_delivery_rate=norm_breakdown.delivery_rate,
            critical_breakdown=crit_breakdown,
            high_breakdown=high_breakdown,
            normal_breakdown=norm_breakdown,
            physical_disconnections=physical_disconnections,
            capacity_blocked_demands=capacity_blocked_demands,
            sla_violations=sla_violations,
            algorithm_runtime_ms=round(elapsed_ms, 2)
        )

        self.add_event(
            event_type="simulation_run",
            description=f"Executed '{self.strategy}' strategy. Delivered {total_delivered:.1f}/{total_requested:.1f} Mbps ({overall_deliv_ratio:.1f}%)."
        )

        return self.get_state()

    def run_comparison_suite(self) -> Dict[str, SimulationMetrics]:
        """
        Executes all 4 routing strategies on IDENTICAL initial states and returns comparative metrics.
        Ensures strict state isolation.
        """
        strategies = ["dijkstra", "congestion_aware", "capacity_k_shortest", "mcf_lp"]
        original_strategy = self.strategy
        comparison_results = {}

        for strat in strategies:
            self.strategy = strat
            state = self.run_simulation()
            comparison_results[strat] = state.metrics

        self.strategy = original_strategy
        self.run_simulation() # Restore active strategy state
        return comparison_results

    def get_state(self) -> SimulationState:
        return SimulationState(
            topology=self.topology_service.get_topology(),
            demands=self.demands,
            metrics=self.metrics,
            strategy=self.strategy,
            events=self.events
        )
