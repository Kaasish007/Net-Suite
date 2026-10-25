# NetResQ — Algorithm Design & Theoretical Specifications

## 1. Overview & Architectural Principles

NetResQ addresses the fundamental failure modes of conventional network routing heuristics (e.g. single-path Dijkstra or static utilization penalty routers) under congestion and link failure conditions.

The system decouples **Path Feasibility** from **Path Cost Optimization** and enforces **Global State Isolation**.

---

## 2. Core Routing Algorithms

### A. Capacity-Constrained K-Shortest Path Router (K-CSPR)
- **Primary Method**: Yen's Algorithm ($O(K \cdot |V| \cdot (|E| + |V| \log |V|))$) implemented via NetworkX `nx.shortest_simple_paths`.
- **Candidate Path Generation**: Computes top $K=5$ loopless simple paths on the operational subgraph $G_{\text{op}} \subseteq G$.
- **Path Feasibility Evaluation**:
  For each candidate path $P_i = (v_0, v_1, \dots, v_m)$:
  1. **Bottleneck Residual Capacity**:
     $$B(P_i) = \min_{(u,v) \in P_i} \Big( C(u,v) - f(u,v) \Big)$$
     Where $C(u,v)$ is link bandwidth and $f(u,v)$ is current allocated traffic load.
  2. **Capacity Constraint**:
     $$B(P_i) \ge R_k \quad (\text{or } B(P_i) > 0 \text{ for partial allocation})$$
  3. **Latency SLA Constraint**:
     $$L(P_i) = \sum_{(u,v) \in P_i} \text{latency}(u,v) \le L_{\max, k}$$

- **Path Ranking & Queueing Delay Cost Function**:
  $$\text{cost}(P_i) = L(P_i) \cdot \left( 1 + \frac{\bar{u}(P_i)}{1 - \bar{u}(P_i)} \right)$$
  Where $\bar{u}(P_i) = \min\left(0.99, \frac{1}{|P_i|} \sum_{e \in P_i} \frac{f(e) + R_k}{C(e)}\right)$ reflects non-linear M/M/1 queueing delay escalation.

---

### B. Global Multi-Commodity Flow (MCF) Linear Programming Baseline
To establish a mathematically rigorous global upper bound, NetResQ formulates joint traffic allocation as a Linear Program (LP):

$$\max_{x_{k,P}} \sum_{k \in K} w_k \sum_{P \in \mathcal{P}_k} x_{k,P}$$

**Subject to:**
1. **Link Capacity Bounds**:
   $$\sum_{k \in K} \sum_{P \in \mathcal{P}_k : e \in P} x_{k,P} \le C_e \quad \forall e \in E_{\text{op}}$$
2. **Demand Upper Bounds**:
   $$\sum_{P \in \mathcal{P}_k} x_{k,P} \le R_k \quad \forall k \in K$$
3. **Non-negativity Bounds**:
   $$x_{k,P} \ge 0 \quad \forall k, P$$

**Priority Weights ($w_k$)**:
- Critical Priority: $w_k = 1000.0$
- High Priority: $w_k = 100.0$
- Normal Priority: $w_k = 1.0$

Solved using SciPy's High-Performance Interior Point / HiGHS Linear Programming Solver (`scipy.optimize.linprog`).

---

## 3. Critical-Service Allocation Policy & Priority Preemption

Traffic demands are sorted deterministically prior to sequential allocation:
$$\text{Sort Key}(d) = \big( \text{PriorityOrder}(d.priority), -d.rate, d.id \big)$$
Where $\text{PriorityOrder}(\text{Critical}) = 1, \text{High} = 2, \text{Normal} = 3$.

### Priority Guarantee Properties:
1. **Zero Preemption of Equal/Higher Priority**: Critical demands consume residual bandwidth before Normal demands are evaluated.
2. **Starvation Protection Analytics**: If a Normal demand is dropped or degraded due to Critical demand preemption, the explanation engine explicitly records the preempting bottleneck link and traffic delta.
3. **Physical Partition vs Capacity Blocked Attribution**: Distinguishes whether a demand failed because no graph path exists ($nx.has\_path == False$) versus insufficient residual bandwidth along candidate paths.
