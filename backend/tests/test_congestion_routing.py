import pytest
from app.models.topology import Router, Link
from app.models.traffic import TrafficDemand
from app.services.topology_service import TopologyService
from app.services.simulation_engine import SimulationEngine

def test_congestion_aware_avoids_bottleneck():
    service = TopologyService()
    service.add_router(Router(id="r1", name="R1"))
    service.add_router(Router(id="r2", name="R2"))
    service.add_router(Router(id="r3", name="R3"))
    service.add_router(Router(id="r4", name="R4"))
    
    # Path 1: r1 -> r2 -> r4 (Low latency, but low bandwidth)
    service.add_link(Link(id="l1", source="r1", target="r2", bandwidth=50, latency=5))
    service.add_link(Link(id="l2", source="r2", target="r4", bandwidth=50, latency=5))
    
    # Path 2: r1 -> r3 -> r4 (High latency, high bandwidth)
    service.add_link(Link(id="l3", source="r1", target="r3", bandwidth=1000, latency=20))
    service.add_link(Link(id="l4", source="r3", target="r4", bandwidth=1000, latency=20))
    
    engine = SimulationEngine(service)
    
    # Demand 1: 40 Mbps. Should take Path 1 (lower latency)
    demands = [TrafficDemand(id="d1", source="r1", target="r4", rate=40, priority="Normal")]
    engine.load_demands(demands)
    engine.set_strategy("congestion_aware")
    engine.run_simulation()
    
    assert engine.demands[0].route == ["r1", "r2", "r4"]
    assert engine.demands[0].allocated_rate == 40
    
    # Demand 2: another 20 Mbps. Path 1 only has 10 Mbps left, so Path 1 is full. Should take Path 2.
    demands = [
        TrafficDemand(id="d1", source="r1", target="r4", rate=40, priority="High"), # Processed first
        TrafficDemand(id="d2", source="r1", target="r4", rate=20, priority="Normal")
    ]
    engine.load_demands(demands)
    engine.run_simulation()
    
    assert engine.demands[0].route == ["r1", "r2", "r4"]
    assert engine.demands[1].route == ["r1", "r3", "r4"]
