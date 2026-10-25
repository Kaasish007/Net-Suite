import pytest
from app.models.topology import NetworkTopology, Router, Link
from app.services.topology_service import TopologyService

def test_add_router():
    service = TopologyService()
    router = Router(id="r1", name="Router 1")
    service.add_router(router)
    assert "r1" in service.routers
    assert "r1" in service.graph.nodes

def test_add_link():
    service = TopologyService()
    r1 = Router(id="r1", name="Router 1")
    r2 = Router(id="r2", name="Router 2")
    service.add_router(r1)
    service.add_router(r2)
    
    link = Link(id="l1", source="r1", target="r2", bandwidth=100, latency=10)
    service.add_link(link)
    
    assert "l1" in service.links
    assert service.graph.has_edge("r1", "r2")
    
def test_link_status_update():
    service = TopologyService()
    r1 = Router(id="r1", name="Router 1")
    r2 = Router(id="r2", name="Router 2")
    service.add_router(r1)
    service.add_router(r2)
    link = Link(id="l1", source="r1", target="r2", bandwidth=100, latency=10)
    service.add_link(link)
    
    service.update_link_status("l1", "failed")
    assert service.links["l1"].status == "failed"
    assert service.graph.edges["r1", "r2"]["status"] == "failed"
