import networkx as nx
from typing import List, Tuple, Optional
from ..models.topology import NetworkTopology

class CongestionAwareRouter:
    @staticmethod
    def compute_route(topology_service, source: str, target: str, demand_rate: float = 0.0) -> Tuple[Optional[List[str]], float]:
        """
        Compute route considering latency and congestion.
        Cost function: latency + congestion_penalty
        congestion_penalty grows as utilization approaches 100%.
        Skips links that don't have enough capacity for demand_rate.
        """
        G = topology_service.graph
        
        # Create a new temporary graph to hold the custom weights
        H = nx.DiGraph()
        
        for u, v, data in G.edges(data=True):
            if data.get("status") != "operational":
                continue
                
            bandwidth = data.get("bandwidth", 1.0)
            traffic_load = data.get("traffic_load", 0.0)
            
            # Check capacity constraint
            if traffic_load + demand_rate > bandwidth:
                continue # Skip this link as it can't handle the new demand
                
            latency = data.get("latency", 1.0)
            utilization = (traffic_load / bandwidth) if bandwidth > 0 else 1.0
            
            # Congestion penalty: grows non-linearly
            # e.g. latency * (1 / (1 - utilization)) but safely capped
            safe_utilization = min(utilization, 0.99)
            congestion_penalty = latency * (safe_utilization / (1.0 - safe_utilization))
            
            cost = latency + congestion_penalty
            
            H.add_edge(u, v, weight=cost, original_latency=latency)
            
        if source not in H or target not in H:
             # It might be that the nodes have no valid edges
             if source not in G or target not in G:
                 return None, -1
             # If nodes exist in G but not in H, it's unreachable due to capacity/status
             return None, -1
             
        try:
            path = nx.shortest_path(H, source=source, target=target, weight="weight")
            # Calculate total *latency* of the path (not the custom cost)
            total_latency = 0.0
            for i in range(len(path) - 1):
                u = path[i]
                v = path[i+1]
                total_latency += H.edges[u, v]["original_latency"]
            return path, total_latency
        except nx.NetworkXNoPath:
            return None, -1
        except nx.NodeNotFound:
            return None, -1
