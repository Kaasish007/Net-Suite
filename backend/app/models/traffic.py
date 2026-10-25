from pydantic import BaseModel
from typing import List, Optional, Literal

class CandidatePathInfo(BaseModel):
    path: List[str]
    latency: float
    bottleneck_capacity: float
    feasible: bool
    rejection_reason: Optional[str] = None
    cost: float = 0.0

class TrafficDemand(BaseModel):
    id: str
    source: str
    target: str
    rate: float # Mbps requested
    priority: Literal["Critical", "High", "Normal"]
    label: Optional[str] = None
    allocated_rate: float = 0.0 # Mbps successfully delivered
    status: str = "pending" # "pending", "routed", "dropped", "partial"
    route: List[str] = [] # list of router IDs forming the path
    
    # Enhanced Explainability & SLA fields
    max_latency_sla: Optional[float] = None # Max allowed latency in ms
    min_guaranteed_rate: float = 0.0 # Minimum SLA bandwidth guarantee
    candidate_paths: List[CandidatePathInfo] = []
    explanation: Optional[str] = None
    bottleneck_link: Optional[str] = None
    bottleneck_capacity: Optional[float] = None
    path_latency: Optional[float] = None
    backup_route: List[str] = []
    is_disconnected: bool = False

class TrafficScenario(BaseModel):
    id: str = "default"
    name: str = "Default Scenario"
    description: str = ""
    demands: List[TrafficDemand]

