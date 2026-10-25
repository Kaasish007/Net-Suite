import networkx as nx
from typing import List, Dict, Tuple, Any
from scipy.optimize import linprog

class MultiCommodityFlowLPRouter:
    @staticmethod
    def solve_mcf(topology_service, demands: List[Any]) -> Dict[str, Any]:
        """
        Solves joint Multi-Commodity Flow (MCF) using Linear Programming (scipy.optimize.linprog).
        Protects priority traffic using objective weights:
          Critical = 1000.0, High = 100.0, Normal = 1.0
        Returns dictionary mapping demand_id -> {allocated_rate, route, path_latency, explanation}.
        """
        G = topology_service.graph

        def filter_edge(u, v):
            return G.edges[u, v].get("status") == "operational"
            
        def filter_node(n):
            return G.nodes[n].get("status") == "operational"
            
        subgraph = nx.subgraph_view(G, filter_node=filter_node, filter_edge=filter_edge)

        # 1. Collect candidate paths for each demand
        demand_paths = {}
        path_variables = [] # List of tuples: (demand_id, path, priority_weight, max_rate)
        
        priority_weights = {"Critical": 1000.0, "High": 100.0, "Normal": 1.0}

        for d in demands:
            if d.source not in subgraph or d.target not in subgraph or not nx.has_path(subgraph, d.source, d.target):
                demand_paths[d.id] = []
                continue

            # Find top-5 simple paths for demand d
            paths = []
            try:
                gen = nx.shortest_simple_paths(subgraph, d.source, d.target, weight="latency")
                for _ in range(5):
                    paths.append(next(gen))
            except (StopIteration, nx.NetworkXNoPath):
                pass

            demand_paths[d.id] = paths
            p_weight = priority_weights.get(d.priority, 1.0)
            
            for p in paths:
                path_variables.append({
                    "demand_id": d.id,
                    "demand_rate": d.rate,
                    "priority_weight": p_weight,
                    "path": p
                })

        if not path_variables:
            # No feasible paths for any demand
            results = {}
            for d in demands:
                results[d.id] = {
                    "allocated_rate": 0.0,
                    "route": [],
                    "path_latency": -1.0,
                    "explanation": f"Global MCF LP: No physical operational path available for demand '{d.id}'."
                }
            return results

        num_vars = len(path_variables)
        
        # Objective: Minimize - sum(priority_weight * x_i)  [Maximizing priority-weighted flow]
        c = [-var["priority_weight"] for var in path_variables]

        # 2. Build inequality matrix A_ub * x <= b_ub
        # Link capacity constraints: sum of flow across path variables using link e <= capacity(e)
        operational_edges = [(u, v, data) for u, v, data in subgraph.edges(data=True)]
        
        A_ub = []
        b_ub = []

        for u, v, data in operational_edges:
            edge_id = data.get("id", f"{u}->{v}")
            bandwidth = data.get("bandwidth", 0.0)
            
            row = [0.0] * num_vars
            for idx, var in enumerate(path_variables):
                p = var["path"]
                # Check if edge (u,v) is in path p
                is_in_path = any(p[i] == u and p[i+1] == v for i in range(len(p)-1))
                if is_in_path:
                    row[idx] = 1.0
                    
            A_ub.append(row)
            b_ub.append(bandwidth)

        # Demand capacity upper bounds: sum(x_i for path in demand d) <= d.rate
        for d in demands:
            d_indices = [idx for idx, var in enumerate(path_variables) if var["demand_id"] == d.id]
            if d_indices:
                row = [0.0] * num_vars
                for idx in d_indices:
                    row[idx] = 1.0
                A_ub.append(row)
                b_ub.append(d.rate)

        # Variable bounds: 0 <= x_i <= infinity
        bounds = [(0.0, None) for _ in range(num_vars)]

        # 3. Solve LP
        res = linprog(c, A_ub=A_ub, b_ub=b_ub, bounds=bounds, method="highs")

        results = {}
        if not res.success:
            for d in demands:
                results[d.id] = {
                    "allocated_rate": 0.0,
                    "route": [],
                    "path_latency": -1.0,
                    "explanation": f"Global MCF LP solver failed: {res.message}"
                }
            return results

        # 4. Extract solution flows
        x_sol = res.x
        demand_flows = {d.id: [] for d in demands}

        for idx, var in enumerate(path_variables):
            flow = x_sol[idx]
            if flow > 1e-4:
                demand_flows[var["demand_id"]].append((var["path"], flow))

        for d in demands:
            flows = demand_flows[d.id]
            if not flows:
                results[d.id] = {
                    "allocated_rate": 0.0,
                    "route": [],
                    "path_latency": -1.0,
                    "explanation": f"Global MCF LP: Allocated 0 Mbps due to network saturation or priority competition."
                }
            else:
                # Select primary route with maximum flow share
                primary_path, max_flow = max(flows, key=lambda f: f[1])
                total_allocated = sum(f[1] for f in flows)
                
                # Compute path latency of primary path
                lat = 0.0
                for i in range(len(primary_path) - 1):
                    u = primary_path[i]
                    v = primary_path[i+1]
                    lat += subgraph.edges[u, v].get("latency", 1.0)
                    
                results[d.id] = {
                    "allocated_rate": round(total_allocated, 2),
                    "route": primary_path,
                    "path_latency": lat,
                    "explanation": f"Global MCF LP Optimal: Allocated {total_allocated:.1f} Mbps across path {primary_path}."
                }

        return results
