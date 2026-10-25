import networkx as nx
from typing import List, Dict, Optional
from ..models.topology import NetworkTopology, Router, Link

class TopologyService:
    def __init__(self):
        self.graph = nx.DiGraph()
        self.routers: Dict[str, Router] = {}
        self.links: Dict[str, Link] = {}
        
    def get_topology(self) -> NetworkTopology:
        return NetworkTopology(
            routers=list(self.routers.values()),
            links=list(self.links.values())
        )
        
    def load_topology(self, topology: NetworkTopology):
        self.graph.clear()
        self.routers.clear()
        self.links.clear()
        
        for router in topology.routers:
            self.add_router(router)
            
        for link in topology.links:
            self.add_link(link)
            
    def add_router(self, router: Router):
        self.routers[router.id] = router
        self.graph.add_node(router.id, **router.model_dump())
        
    def add_link(self, link: Link):
        if link.source not in self.routers or link.target not in self.routers:
            raise ValueError(f"Source {link.source} or Target {link.target} not found")
        self.links[link.id] = link
        self.graph.add_edge(link.source, link.target, **link.model_dump())
        
    def update_link_status(self, link_id: str, status: str):
        if link_id in self.links:
            self.links[link_id].status = status
            self.graph.edges[self.links[link_id].source, self.links[link_id].target]["status"] = status
            
    def get_link_by_nodes(self, source: str, target: str) -> Optional[Link]:
        for link in self.links.values():
            if link.source == source and link.target == target:
                return link
        return None
