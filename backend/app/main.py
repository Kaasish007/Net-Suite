from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict

from .models.topology import NetworkTopology, Router, Link
from .models.traffic import TrafficDemand
from .models.simulation import SimulationState, SimulationMetrics, SimulationEvent
from .services.topology_service import TopologyService
from .services.simulation_engine import SimulationEngine
from .services.scenario_service import ScenarioService

app = FastAPI(title="NetResQ API — Intelligent Failure Recovery & Strategy Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

topology_service = TopologyService()
simulation_engine = SimulationEngine(topology_service)

def load_default_network():
    scenarios = ScenarioService.get_all_scenarios()
    default_scen = scenarios["healthy_network"]
    topology_service.load_topology(default_scen["topology"])
    simulation_engine.load_demands(default_scen["demands"])

load_default_network()

@app.get("/")
def root():
    return {"message": "NetResQ API Engine is operational"}

@app.get("/api/topology", response_model=NetworkTopology)
def get_topology():
    return topology_service.get_topology()

@app.post("/api/topology/load-sample", response_model=NetworkTopology)
def load_sample():
    load_default_network()
    return topology_service.get_topology()

@app.post("/api/topology/link/{link_id}/fail")
def fail_link(link_id: str):
    try:
        topology_service.update_link_status(link_id, "failed")
        simulation_engine.add_event(
            event_type="link_failure",
            description=f"Link '{link_id}' failed (status set to FAILED)."
        )
        return {"message": f"Link {link_id} failed"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/topology/link/{link_id}/restore")
def restore_link(link_id: str):
    try:
        topology_service.update_link_status(link_id, "operational")
        simulation_engine.add_event(
            event_type="link_restoration",
            description=f"Link '{link_id}' restored to OPERATIONAL status."
        )
        return {"message": f"Link {link_id} restored"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/simulation/state", response_model=SimulationState)
def get_simulation_state():
    return simulation_engine.get_state()

@app.post("/api/simulation/run", response_model=SimulationState)
def run_simulation(strategy: str = "capacity_k_shortest"):
    try:
        return simulation_engine.run_simulation(strategy)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/simulation/reset", response_model=SimulationState)
def reset_simulation():
    simulation_engine.reset_simulation()
    return simulation_engine.get_state()

@app.post("/api/simulation/compare", response_model=Dict[str, SimulationMetrics])
def run_comparison():
    try:
        return simulation_engine.run_comparison_suite()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/scenarios")
def get_scenarios():
    scenarios = ScenarioService.get_all_scenarios()
    return [
        {
            "id": s["id"],
            "name": s["name"],
            "description": s["description"]
        }
        for s in scenarios.values()
    ]

@app.post("/api/scenarios/{scenario_id}/load", response_model=SimulationState)
def load_scenario(scenario_id: str):
    scenarios = ScenarioService.get_all_scenarios()
    if scenario_id not in scenarios:
        raise HTTPException(status_code=404, detail=f"Scenario '{scenario_id}' not found.")
        
    scen = scenarios[scenario_id]
    topology_service.load_topology(scen["topology"])
    simulation_engine.load_demands(scen["demands"])
    
    # Apply link failure list if specified
    for link_id in scen.get("failed_links", []):
        if link_id in topology_service.links:
            topology_service.update_link_status(link_id, "failed")
            
    simulation_engine.add_event(
        event_type="scenario_loaded",
        description=f"Loaded Scenario '{scen['name']}' with {len(scen['demands'])} demands and {len(scen.get('failed_links', []))} failed links."
    )
    
    return simulation_engine.run_simulation()

@app.post("/api/demands", response_model=List[TrafficDemand])
def update_demands(demands: List[TrafficDemand]):
    simulation_engine.load_demands(demands)
    return simulation_engine.demands

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
