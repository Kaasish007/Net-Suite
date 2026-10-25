from pydantic import BaseModel
from typing import List, Dict, Optional
from .topology import NetworkTopology
from .traffic import TrafficDemand

class PriorityMetricBreakdown(BaseModel):
    requested: float = 0.0
    delivered: float = 0.0
    dropped: float = 0.0
    delivery_rate: float = 0.0

class SimulationEvent(BaseModel):
    step: int
    timestamp: float
    event_type: str # "link_failure", "link_restoration", "demand_routed", "demand_dropped", "failover_triggered"
    description: str
    affected_demands: List[str] = []

class SimulationMetrics(BaseModel):
    total_requested_traffic: float = 0.0
    total_delivered_traffic: float = 0.0
    total_dropped_traffic: float = 0.0
    delivery_ratio: float = 0.0 # Percentage 0-100%
    average_latency: Optional[float] = None
    demand_weighted_latency: Optional[float] = None
    network_utilization: float = 0.0
    max_link_utilization: float = 0.0
    operational_links: int = 0
    failed_links: int = 0
    affected_demands: int = 0
    critical_delivery_rate: float = 0.0
    high_delivery_rate: float = 0.0
    normal_delivery_rate: float = 0.0
    critical_breakdown: PriorityMetricBreakdown = PriorityMetricBreakdown()
    high_breakdown: PriorityMetricBreakdown = PriorityMetricBreakdown()
    normal_breakdown: PriorityMetricBreakdown = PriorityMetricBreakdown()
    physical_disconnections: int = 0
    capacity_blocked_demands: int = 0
    sla_violations: int = 0
    algorithm_runtime_ms: float = 0.0

class StrategyComparisonResult(BaseModel):
    strategy: str
    metrics: SimulationMetrics
    demands: List[TrafficDemand]

class SimulationState(BaseModel):
    topology: NetworkTopology
    demands: List[TrafficDemand]
    metrics: SimulationMetrics
    strategy: str = "capacity_k_shortest" # "dijkstra", "congestion_aware", "capacity_k_shortest", "mcf_lp"
    events: List[SimulationEvent] = []
    comparison_results: Dict[str, SimulationMetrics] = {}

