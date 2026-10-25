# NetResQ — Baseline Audit & System Analysis

## 1. Executive Summary & Existing Features
NetResQ is a network failure recovery and simulation platform built with Python (FastAPI, NetworkX, Pydantic) on the backend and React (TypeScript, Vite, Cytoscape.js, Lucide) on the frontend. 

### Current Components & Stack:
- **Backend**: FastAPI framework running on `http://localhost:8000`.
  - Topology Service (`app/services/topology_service.py`): NetworkX `DiGraph` wrapping router nodes and directed link edges. Supports loading sample topology, updating link status (`operational` vs `failed`).
  - Simulation Engine (`app/services/simulation_engine.py`): Executes sequential demand processing using selected strategy. Manages state reset, demand sorting, metric calculations.
  - Algorithms (`app/algorithms/`):
    - `DijkstraRouter`: Calculates shortest path on operational subgraph using link latency as weight. Capacity is checked *post-hoc* along the path to set `allocated_rate = min(demand.rate, bottleneck)`.
    - `CongestionAwareRouter`: Filters out edges where `traffic_load + demand_rate > bandwidth`. Computes path using dynamic weight $w_e = \text{latency} \cdot \left(1 + \frac{u}{1-u}\right)$ with utilization $u = \min(\text{load}/\text{bandwidth}, 0.99)$. If full demand cannot fit, drops demand completely (0 allocated).
  - Models (`app/models/`): Pydantic schemas for `Router`, `Link`, `TrafficDemand`, `SimulationState`, `SimulationMetrics`.
- **Frontend**: Single-page application rendering an interactive Cytoscape graph canvas, traffic demand table, simulation controls (strategy selector, run, reset, sample load), topology details sidebar, and metrics overview grid.

---

## 2. Baseline Test Results
Current backend tests are located in `backend/tests/`:
1. `test_dijkstra.py`: 3 tests (`test_shortest_path`, `test_failed_link_excluded`, `test_unreachable`) — PASSED.
2. `test_congestion_routing.py`: 1 test (`test_congestion_aware_avoids_bottleneck`) — PASSED.
3. `test_topology.py`: 3 tests (`test_load_topology`, `test_add_router_and_link`, `test_link_status_toggle`) — PASSED.

Total Baseline Test Status: **7 / 7 Passed** (Execution time ~2.91s).

---

## 3. Current Limitations & Problems Addressed

1. **Greedy Sequential Order Dependency**:
   - Demands are sorted by priority and rate, then processed one by one. First demand consumes residual bandwidth on shortest links, potentially dropping subsequent demands that could have been accommodated if routes were searched across alternative paths or split.
2. **All-or-Nothing Congestion Rerouting**:
   - `CongestionAwareRouter` filters out any edge where `traffic_load + demand_rate > bandwidth`. If a demand requires 100 Mbps and residual bandwidth is 95 Mbps, the router rejects the path entirely and drops the demand (0 Mbps delivered), ignoring partial delivery opportunities.
3. **Single Shortest-Path Limitation**:
   - Both Dijkstra and Congestion-Aware routers inspect only a single path. If the primary path lacks capacity, they do not search candidate alternative paths (e.g., Yen's K-Shortest Paths).
4. **Lack of Detailed Routing Explanations**:
   - Backend metrics provide aggregate numbers, but do not supply per-demand routing traces detailing evaluated candidate paths, bottleneck links, rejection reasons, or counterfactual explanations.
5. **No Event Timeline or Restoration Tracking**:
   - Link failures and restorations reset simulation state immediately without tracking historical event steps, recovery time, service continuity, or restoration route changes.
6. **No Side-by-Side Strategy Comparison or Reproducible Scenarios**:
   - UI only runs one strategy at a time. No dedicated scenario benchmark suite comparing Dijkstra vs Congestion-Aware vs Enhanced Capacity-Aware K-Shortest Path routing under identical initial states.

---

## 4. Files Targeted for Modification & Expansion

- `backend/app/models/traffic.py`: Add candidate paths, routing explanation, SLA fields.
- `backend/app/models/simulation.py`: Add event timeline, detailed recovery metrics, strategy comparison schema.
- `backend/app/algorithms/dijkstra_router.py`: Enhance baseline correctness & explanation tracking.
- `backend/app/algorithms/capacity_k_shortest_router.py` **[NEW]**: Implement Yen's K-Shortest Path capacity-aware router with candidate ranking.
- `backend/app/algorithms/mcf_lp_router.py` **[NEW]**: Multi-commodity flow LP solver using `scipy.optimize.linprog` for theoretical global baseline.
- `backend/app/services/simulation_engine.py`: Integrate capacity-aware router, critical-service allocation policies, event tracking, state isolation.
- `backend/app/services/scenario_service.py` **[NEW]**: Provide 10 deterministic test scenarios.
- `backend/app/api/`: Add routes for scenarios, strategy comparisons, counterfactual explanations.
- `backend/tests/`: Add tests for K-Shortest paths, scenario suite, critical demand protection, state isolation, explainability.
- `frontend/src/`: Update Cytoscape styling, add Decision Explanation drawer, Event Timeline, Side-by-Side Comparison view, Scenario Selector.
- `docs/ALGORITHM_DESIGN.md` **[NEW]**: Comprehensive mathematical formulations & routing logic specifications.
- `docs/EXPERIMENT_RESULTS.md` **[NEW]**: Detailed benchmark results across 10 deterministic scenarios.
