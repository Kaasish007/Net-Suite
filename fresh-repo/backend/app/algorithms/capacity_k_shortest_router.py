import networkx as nx
from typing import List, Tuple, Optional, Dict, Any
from ..models.traffic import CandidatePathInfo

class CapacityKShortestRouter:
    @staticmethod
    def compute_route(
        topology_service,
        source: str,
        target: str,
        demand_rate: float,
        k_paths: int = 5,
        max_latency_sla: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Computes candidate paths using Yen's algorithm (nx.shortest_simple_paths).
        Evaluates candidate path feasibility against residual bandwidth and latency SLA.
        Returns a dictionary containing:
          - route: List[str] or None
          - path_latency: float
          - allocated_rate: float
          - candidate_paths: List[CandidatePathInfo]
          - explanation: str
          - bottleneck_link: Optional[str]
          - bottleneck_capacity: Optional[float]
          - is_disconnected: bool
        """
        G = topology_service.graph
        
        # 1. Filter operational subgraph
        def filter_edge(u, v):
            return G.edges[u, v].get("status") == "operational"
            
        def filter_node(n):
            return G.nodes[n].get("status") == "operational"
            
        subgraph = nx.subgraph_view(G, filter_node=filter_node, filter_edge=filter_edge)
        
        # Check node existence and connectivity
        if source not in subgraph or target not in subgraph:
            return {
                "route": None,
                "path_latency": -1.0,
                "allocated_rate": 0.0,
                "candidate_paths": [],
                "explanation": f"Source '{source}' or target '{target}' is disabled or non-existent.",
                "bottleneck_link": None,
                "bottleneck_capacity": 0.0,
                "is_disconnected": True
            }

        if not nx.has_path(subgraph, source, target):
            return {
                "route": None,
                "path_latency": -1.0,
                "allocated_rate": 0.0,
                "candidate_paths": [],
                "explanation": f"No physical path exists between '{source}' and '{target}' due to link failure or network partition.",
                "bottleneck_link": None,
                "bottleneck_capacity": 0.0,
                "is_disconnected": True
            }

        # 2. Extract top-K simple paths using Yen's algorithm
        candidates_raw = []
        try:
            generator = nx.shortest_simple_paths(subgraph, source, target, weight="latency")
            for _ in range(k_paths):
                path = next(generator)
                candidates_raw.append(path)
        except (StopIteration, nx.NetworkXNoPath):
            pass

        if not candidates_raw:
            return {
                "route": None,
                "path_latency": -1.0,
                "allocated_rate": 0.0,
                "candidate_paths": [],
                "explanation": f"No simple paths found between '{source}' and '{target}'.",
                "bottleneck_link": None,
                "bottleneck_capacity": 0.0,
                "is_disconnected": True
            }

        # 3. Evaluate each candidate path
        evaluated_candidates: List[CandidatePathInfo] = []
        best_feasible_candidate = None
        best_feasible_cost = float("inf")
        
        max_bottleneck_candidate = None
        max_bottleneck_val = -1.0

        for path in candidates_raw:
            # Calculate latency & bottleneck residual capacity
            total_latency = 0.0
            bottleneck_cap = float("inf")
            bottleneck_edge_id = None
            total_utilization = 0.0
            hop_count = len(path) - 1

            for i in range(hop_count):
                u = path[i]
                v = path[i+1]
                edge_data = subgraph.edges[u, v]
                latency = edge_data.get("latency", 1.0)
                bandwidth = edge_data.get("bandwidth", 1.0)
                traffic_load = edge_data.get("traffic_load", 0.0)
                link_id = edge_data.get("id", f"{u}->{v}")
                
                total_latency += latency
                residual = max(0.0, bandwidth - traffic_load)
                
                if residual < bottleneck_cap:
                    bottleneck_cap = residual
                    bottleneck_edge_id = link_id
                    
                util = traffic_load / bandwidth if bandwidth > 0 else 1.0
                total_utilization += util

            avg_util = total_utilization / hop_count if hop_count > 0 else 0.0
            safe_avg_util = min(avg_util, 0.99)
            
            # Queueing cost factor: latency * (1 + safe_avg_util / (1 - safe_avg_util))
            cost = total_latency * (1.0 + (safe_avg_util / (1.0 - safe_avg_util)))

            # Check feasibility
            is_capacity_feasible = bottleneck_cap >= demand_rate
            is_sla_feasible = True
            rejection_reasons = []

            if not is_capacity_feasible:
                rejection_reasons.append(
                    f"Insufficient capacity (bottleneck '{bottleneck_edge_id}' residual {bottleneck_cap:.1f} Mbps < requested {demand_rate:.1f} Mbps)"
                )
            
            if max_latency_sla is not None and total_latency > max_latency_sla:
                is_sla_feasible = False
                rejection_reasons.append(
                    f"SLA violation (latency {total_latency:.1f} ms > max SLA {max_latency_sla:.1f} ms)"
                )

            is_fully_feasible = is_capacity_feasible and is_sla_feasible
            rejection_text = "; ".join(rejection_reasons) if rejection_reasons else None

            cand_info = CandidatePathInfo(
                path=path,
                latency=total_latency,
                bottleneck_capacity=bottleneck_cap,
                feasible=is_fully_feasible,
                rejection_reason=rejection_text,
                cost=cost
            )
            evaluated_candidates.append(cand_info)

            # Track candidate with highest bottleneck capacity for partial delivery
            if bottleneck_cap > max_bottleneck_val:
                max_bottleneck_val = bottleneck_cap
                max_bottleneck_candidate = (path, total_latency, bottleneck_cap, bottleneck_edge_id, cand_info)

            if is_fully_feasible and cost < best_feasible_cost:
                best_feasible_cost = cost
                best_feasible_candidate = (path, total_latency, bottleneck_cap, bottleneck_edge_id, cand_info)

        # 4. Selection Logic
        if best_feasible_candidate:
            path, total_latency, bottleneck_cap, bottleneck_edge_id, cand_info = best_feasible_candidate
            explanation = (
                f"Selected optimal feasible route {path} (latency: {total_latency:.1f} ms, "
                f"bottleneck residual: {bottleneck_cap:.1f} Mbps, evaluated {len(evaluated_candidates)} candidate paths)."
            )
            return {
                "route": path,
                "path_latency": total_latency,
                "allocated_rate": demand_rate,
                "candidate_paths": evaluated_candidates,
                "explanation": explanation,
                "bottleneck_link": bottleneck_edge_id,
                "bottleneck_capacity": bottleneck_cap,
                "is_disconnected": False
            }

        # 5. No fully feasible path. Evaluate partial allocation on best bottleneck path
        if max_bottleneck_candidate and max_bottleneck_val > 0:
            path, total_latency, bottleneck_cap, bottleneck_edge_id, cand_info = max_bottleneck_candidate
            allocated = min(demand_rate, bottleneck_cap)
            explanation = (
                f"No fully feasible route found for required {demand_rate:.1f} Mbps. "
                f"Allocated partial capacity {allocated:.1f} Mbps along route {path} constrained by bottleneck link '{bottleneck_edge_id}'."
            )
            return {
                "route": path,
                "path_latency": total_latency,
                "allocated_rate": allocated,
                "candidate_paths": evaluated_candidates,
                "explanation": explanation,
                "bottleneck_link": bottleneck_edge_id,
                "bottleneck_capacity": bottleneck_cap,
                "is_disconnected": False
            }

        # 6. Completely bottlenecked (0 Mbps residual on all candidate paths)
        first_cand = evaluated_candidates[0]
        explanation = (
            f"Demand dropped (0.0 Mbps delivered). All {len(evaluated_candidates)} evaluated paths are fully saturated. "
            f"Primary bottleneck link '{first_cand.rejection_reason}' has 0.0 Mbps residual capacity."
        )
        return {
            "route": [],
            "path_latency": -1.0,
            "allocated_rate": 0.0,
            "candidate_paths": evaluated_candidates,
            "explanation": explanation,
            "bottleneck_link": first_cand.path[0] if first_cand.path else None,
            "bottleneck_capacity": 0.0,
            "is_disconnected": False
        }
