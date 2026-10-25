<<<<<<< HEAD
# NetResQ — Intelligent Network Failure Recovery & Strategy Engine

**NetResQ** is an advanced network failure recovery, capacity-aware routing, and simulation platform. It models network topologies (routers and directed links), traffic demands with SLA constraints and priorities, and evaluates alternative path routing strategies against global theoretical optimization bounds.

---

## 🌟 Key Innovations & Features

1. **NetResQ K-CSPR Router (Capacity-Constrained K-Shortest Path)**:
   - Uses Yen's algorithm ($O(K \cdot |V| \cdot (|E| + |V| \log |V|))$) to generate loopless candidate paths.
   - Evaluates residual link capacity ($C_e - f_e$) and Latency SLA constraints ($L(P) \le L_{\max}$).
   - Ranks candidate paths using a non-linear M/M/1 queueing delay penalty: $\text{cost}(P) = L(P) \cdot \left(1 + \frac{\bar{u}}{1 - \bar{u}}\right)$.
2. **Global Multi-Commodity Flow (MCF) LP Solver**:
   - Solves joint network multi-commodity flow using SciPy HiGHS Linear Programming (`scipy.optimize.linprog`) to compute theoretical global throughput bounds.
3. **Critical-Service Priority Protection**:
   - Deterministic demand allocation prioritizing Critical, High, and Normal traffic streams.
   - Tracks Critical SLA delivery rates independently from overall aggregate throughput.
4. **Explainable Failure Recovery & Decision Traces**:
   - Detailed decision drawer explaining candidate path choices, bottleneck link capacities, SLA checks, and rejection reasons.
   - Real-time event timeline logging link failures, restorations, and failover events.
5. **10 Deterministic Benchmark Scenarios**:
   - Pre-packaged scenarios covering bottleneck contention, emergency failures, network partitions, equal-cost ties, and control baselines.
6. **Side-by-Side Strategy Comparison Suite**:
   - One-click benchmark comparing Dijkstra, Congestion-Aware, NetResQ K-CSPR, and Global MCF LP under identical initial conditions.

---

## 🛠️ Technology Stack

- **Backend**: Python 3.13, FastAPI, NetworkX, SciPy (`linprog`), Pydantic v2, Pytest, Uvicorn
- **Frontend**: React, TypeScript, Vite, Cytoscape.js, Tailwind CSS, Lucide React Icons

---

## 🚀 Running the Application

### 1. Backend Setup
```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```
*Run backend test suite:*
```bash
cd backend
python -m pytest
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open your browser at `http://localhost:5173`.

---

## 📚 Documentation
- **Audit Baseline**: [`docs/BASELINE_AUDIT.md`](file:///f:/network/network/docs/BASELINE_AUDIT.md)
- **Algorithm Design**: [`docs/ALGORITHM_DESIGN.md`](file:///f:/network/network/docs/ALGORITHM_DESIGN.md)
- **Experimental Results**: [`docs/EXPERIMENT_RESULTS.md`](file:///f:/network/network/docs/EXPERIMENT_RESULTS.md)

---

## 📊 Routing Algorithm Comparison

| Strategy Name | Algorithm Family | Feasibility Check | Objective / Cost Model | Global Optimality |
|---|---|---|---|---|
| **Dijkstra Baseline** | Single Shortest Path | Post-hoc bottleneck allocation | Latency minimization | Local greedy |
| **Congestion-Aware** | Edge Reweighting | Hard rate filtering per link | $c(e) = \text{lat} \cdot (1 + \frac{u}{1-u})$ | Local greedy |
| **NetResQ K-CSPR** | Yen's K-Shortest Paths | K-Candidate residual & SLA | M/M/1 queueing delay penalty | Near-Optimal |
| **Global MCF LP** | SciPy Linear Programming | Joint LP constraints | Priority-weighted total flow | **Globally Optimal** |
=======
# Net-Suite
A lightweight, production‑ready JavaScript library offering modular networking utilities—IP/subnet calculations, DNS lookups, and packet helpers—compatible with Node.js and browsers. Includes type‑safe APIs, full Jest test coverage, and GitHub Actions CI for linting, testing and automated releases.
>>>>>>> dddba44a2773d965de2ec978ad56b8757d244b2b
