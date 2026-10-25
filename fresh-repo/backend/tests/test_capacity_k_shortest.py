import pytest
from app.models.topology import Router, Link
from app.models.traffic import TrafficDemand
from app.services.topology_service import TopologyService
from app.algorithms.capacity_k_shortest_router import CapacityKShortestRouter

def setup_bottleneck_service():
    service = TopologyService()
    service.add_router(Router(id="r1", name="R1"))
    service.add_router(Router(id="r2", name="R2"))
    service.add_router(Router(id="r3", name="R3"))
    service.add_router(Router(id="r4", name="R4"))
    
    # Path 1: r1 -> r2 -> r4 (10ms latency, 50 Mbps bandwidth)
    service.add_link(Link(id="l1", source="r1", target="r2", bandwidth=50, latency=5))
    service.add_link(Link(id="l2", source="r2", target="r4", bandwidth=50, latency=5))
    
    # Path 2: r1 -> r3 -> r4 (30ms latency, 1000 Mbps bandwidth)
    service.add_link(Link(id="l3", source="r1", target="r3", bandwidth=1000, latency=15))
    service.add_link(Link(id="l4", source="r3", target="r4", bandwidth=1000, latency=15))
    return service

def test_k_shortest_bypasses_low_capacity_primary():
    service = setup_bottleneck_service()
    
    # Demand rate 80 Mbps > 50 Mbps capacity on Path 1
    # CapacityKShortestRouter should bypass Path 1 and select Path 2 (r1 -> r3 -> r4)
    res = CapacityKShortestRouter.compute_route(
        service, source="r1", target="r4", demand_rate=80, k_paths=5
    )
    
    assert res["route"] == ["r1", "r3", "r4"]
    assert res["allocated_rate"] == 80
    assert res["path_latency"] == 30.0
    assert len(res["candidate_paths"]) >= 2
    assert res["candidate_paths"][0].feasible is False # Path 1 rejected due to capacity

def test_sla_latency_violation_rejection():
    service = setup_bottleneck_service()
    
    # Path 2 latency is 30ms. Set SLA max allowed = 20ms.
    # Path 1 capacity is 50 Mbps. Demand is 80 Mbps. Both candidates should be rejected!
    res = CapacityKShortestRouter.compute_route(
        service, source="r1", target="r4", demand_rate=80, k_paths=5, max_latency_sla=20.0
    )
    
    assert len(res["candidate_paths"]) >= 2
    # Candidate 1 (Path 1) rejected for capacity
    assert "Insufficient capacity" in res["candidate_paths"][0].rejection_reason
    # Candidate 2 (Path 2) rejected for SLA
    assert "SLA violation" in res["candidate_paths"][1].rejection_reason

def test_physical_disconnection_detection():
    service = setup_bottleneck_service()
    service.update_link_status("l2", "failed")
    service.update_link_status("l4", "failed")
    
    res = CapacityKShortestRouter.compute_route(
        service, source="r1", target="r4", demand_rate=10, k_paths=5
    )
    
    assert res["is_disconnected"] is True
    assert res["route"] is None
    assert "No physical path exists" in res["explanation"]
