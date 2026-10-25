import networkx as nx
from typing import List, Tuple, Optional
from ..models.topology import NetworkTopology

class DijkstraRouter:
    @staticmethod
    def compute_route(topology_service, source: str, target: str) -> Tuple[Optional[List[str]], float]:
        """
        Compute shortest path using Dijkstra's algorithm.
        Considers only operational links.
        Uses 'latency' as weight.
        Returns:
            Tuple of (path_as_list_of_nodes, total_latency)
            If unreachable, returns (None, -1)
        """
        G = topology_service.graph
        
        # Create a view of the graph with only operational links
        def filter_edge(u, v):
            return G.edges[u, v].get("status") == "operational"
            
        def filter_node(n):
            return G.nodes[n].get("status") == "operational"
            
        subgraph = nx.subgraph_view(G, filter_node=filter_node, filter_edge=filter_edge)
        
        try:
            path = nx.shortest_path(subgraph, source=source, target=target, weight="latency")
            length = nx.shortest_path_length(subgraph, source=source, target=target, weight="latency")
            return path, length
        except nx.NetworkXNoPath:
            return None, -1
        except nx.NodeNotFound:
            return None, -1
