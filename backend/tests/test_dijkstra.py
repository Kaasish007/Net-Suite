import pytest
from app.models.topology import Router, Link
from app.services.topology_service import TopologyService
from app.algorithms.dijkstra_router import DijkstraRouter

def setup_service():
    service = TopologyService()
    service.add_router(Router(id="r1", name="R1"))
    service.add_router(Router(id="r2", name="R2"))
    service.add_router(Router(id="r3", name="R3"))
    service.add_link(Link(id="l1", source="r1", target="r2", bandwidth=100, latency=10))
    service.add_link(Link(id="l2", source="r2", target="r3", bandwidth=100, latency=15))
    service.add_link(Link(id="l3", source="r1", target="r3", bandwidth=100, latency=30))
    return service

def test_shortest_path():
    service = setup_service()
    path, latency = DijkstraRouter.compute_route(service, "r1", "r3")
    assert path == ["r1", "r2", "r3"]
    assert latency == 25

def test_failed_link_excluded():
    service = setup_service()
    service.update_link_status("l2", "failed") # r2 to r3 failed
    path, latency = DijkstraRouter.compute_route(service, "r1", "r3")
    assert path == ["r1", "r3"]
    assert latency == 30
    
def test_unreachable():
    service = setup_service()
    service.update_link_status("l2", "failed")
    service.update_link_status("l3", "failed")
    path, latency = DijkstraRouter.compute_route(service, "r1", "r3")
    assert path is None
    assert latency == -1
