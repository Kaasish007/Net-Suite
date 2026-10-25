from pydantic import BaseModel
from typing import List, Optional

class Router(BaseModel):
    id: str
    name: str
    status: str = "operational" # "operational" or "failed"
    x: float = 0.0
    y: float = 0.0

class Link(BaseModel):
    id: str
    source: str
    target: str
    bandwidth: float # Mbps
    latency: float # ms
    status: str = "operational" # "operational" or "failed"
    traffic_load: float = 0.0
    
    @property
    def utilization(self) -> float:
        if self.bandwidth == 0:
            return 0.0
        return (self.traffic_load / self.bandwidth) * 100.0

class NetworkTopology(BaseModel):
    routers: List[Router]
    links: List[Link]
