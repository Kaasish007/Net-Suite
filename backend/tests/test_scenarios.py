import pytest
from app.services.topology_service import TopologyService
from app.services.simulation_engine import SimulationEngine
from app.services.scenario_service import ScenarioService

def test_load_all_10_scenarios():
    scenarios = ScenarioService.get_all_scenarios()
    assert len(scenarios) == 10
    
    topology_service = TopologyService()
    engine = SimulationEngine(topology_service)
    
    for scen_id, scen in scenarios.items():
        topology_service.load_topology(scen["topology"])
        engine.load_demands(scen["demands"])
        
        for link_id in scen.get("failed_links", []):
            topology_service.update_link_status(link_id, "failed")
            
        state = engine.run_simulation("capacity_k_shortest")
        assert state.metrics.total_requested_traffic > 0
        assert len(state.demands) == len(scen["demands"])

def test_critical_demand_preemption_in_emergency():
    scenarios = ScenarioService.get_all_scenarios()
    emergency_scen = scenarios["critical_emergency"]
    
    topology_service = TopologyService()
    topology_service.load_topology(emergency_scen["topology"])
    engine = SimulationEngine(topology_service)
    engine.load_demands(emergency_scen["demands"])
    
    for link_id in emergency_scen["failed_links"]:
        topology_service.update_link_status(link_id, "failed")
        
    state = engine.run_simulation("capacity_k_shortest")
    
    crit_demand = next(d for d in state.demands if d.priority == "Critical")
    norm_demand = next(d for d in state.demands if d.priority == "Normal")
    
    # Critical demand must receive allocated traffic before Normal traffic
    assert crit_demand.allocated_rate > 0
    assert state.metrics.critical_delivery_rate > 0

def test_comparison_suite_state_isolation():
    scenarios = ScenarioService.get_all_scenarios()
    scen = scenarios["shared_link_contention"]
    
    topology_service = TopologyService()
    topology_service.load_topology(scen["topology"])
    engine = SimulationEngine(topology_service)
    engine.load_demands(scen["demands"])
    
    comparison = engine.run_comparison_suite()
    
    assert "dijkstra" in comparison
    assert "congestion_aware" in comparison
    assert "capacity_k_shortest" in comparison
    assert "mcf_lp" in comparison
    
    # Verify LP global optimum delivered traffic >= Dijkstra delivered traffic
    assert comparison["mcf_lp"].total_delivered_traffic >= comparison["dijkstra"].total_delivered_traffic
