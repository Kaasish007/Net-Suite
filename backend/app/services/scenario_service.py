from typing import Dict, List
from ..models.topology import NetworkTopology, Router, Link
from ..models.traffic import TrafficDemand, TrafficScenario

class ScenarioService:
    @staticmethod
    def get_all_scenarios() -> Dict[str, Dict]:
        return {
            "healthy_network": {
                "id": "healthy_network",
                "name": "1. Healthy Network Baseline",
                "description": "All links operational with ample bandwidth. Verifies standard shortest-path routing.",
                "topology": ScenarioService._build_sample_topology(),
                "demands": [
                    TrafficDemand(id="d1", source="r3", target="r2", rate=100, priority="Critical", label="DB Sync", max_latency_sla=30.0),
                    TrafficDemand(id="d2", source="r4", target="r1", rate=50, priority="High", label="API Gateway", max_latency_sla=40.0),
                    TrafficDemand(id="d3", source="r3", target="r4", rate=80, priority="Normal", label="User Media", max_latency_sla=60.0),
                ],
                "failed_links": []
            },
            "direct_bottleneck": {
                "id": "direct_bottleneck",
                "name": "2. Direct Path Bottleneck",
                "description": "Direct shortest path has low latency (10ms) but small bandwidth (50 Mbps). Alternative path has higher latency (30ms) but 1000 Mbps capacity.",
                "topology": ScenarioService._build_bottleneck_topology(),
                "demands": [
                    TrafficDemand(id="d1", source="r1", target="r4", rate=80, priority="High", label="Bulk Transfer", max_latency_sla=50.0)
                ],
                "failed_links": []
            },
            "shared_link_contention": {
                "id": "shared_link_contention",
                "name": "3. Shared Link Contention",
                "description": "Three demands competing for a single 200 Mbps aggregation link.",
                "topology": ScenarioService._build_sample_topology(),
                "demands": [
                    TrafficDemand(id="d1", source="r3", target="r5", rate=120, priority="Critical", label="Voice Stream"),
                    TrafficDemand(id="d2", source="r3", target="r5", rate=100, priority="High", label="Web Traffic"),
                    TrafficDemand(id="d3", source="r3", target="r5", rate=80, priority="Normal", label="File Backup"),
                ],
                "failed_links": []
            },
            "critical_emergency": {
                "id": "critical_emergency",
                "name": "4. Critical-Service Emergency",
                "description": "Core Link l1 fails. Critical DB replication must preempt Normal traffic for remaining backup bandwidth.",
                "topology": ScenarioService._build_sample_topology(),
                "demands": [
                    TrafficDemand(id="d1", source="r1", target="r2", rate=400, priority="Critical", label="Emergency Sync"),
                    TrafficDemand(id="d2", source="r1", target="r2", rate=300, priority="Normal", label="Background Analytics"),
                ],
                "failed_links": ["l1", "l2"]
            },
            "disconnected_network": {
                "id": "disconnected_network",
                "name": "5. Disconnected Network Partition",
                "description": "All links to Router r4 fail. Demands targeting r4 must report physical disconnection.",
                "topology": ScenarioService._build_sample_topology(),
                "demands": [
                    TrafficDemand(id="d1", source="r1", target="r4", rate=100, priority="Critical", label="Core to Edge 2")
                ],
                "failed_links": ["l9", "l10", "l13", "l14"]
            },
            "multiple_link_failure": {
                "id": "multiple_link_failure",
                "name": "6. Multiple Simultaneous Link Failures",
                "description": "Multiple primary links fail, forcing traffic through a 4-hop alternative path.",
                "topology": ScenarioService._build_sample_topology(),
                "demands": [
                    TrafficDemand(id="d1", source="r3", target="r2", rate=150, priority="High", label="Re-routed Stream")
                ],
                "failed_links": ["l1", "l2", "l7", "l8"]
            },
            "restoration": {
                "id": "restoration",
                "name": "7. Link Restoration Scenario",
                "description": "Evaluates routing adjustment when a previously failed core link is restored.",
                "topology": ScenarioService._build_sample_topology(),
                "demands": [
                    TrafficDemand(id="d1", source="r1", target="r2", rate=200, priority="Critical", label="Restored Core Flow")
                ],
                "failed_links": []
            },
            "insufficient_capacity": {
                "id": "insufficient_capacity",
                "name": "8. Insufficient Total Network Capacity",
                "description": "Total requested traffic (1500 Mbps) exceeds entire network throughput (500 Mbps).",
                "topology": ScenarioService._build_sample_topology(),
                "demands": [
                    TrafficDemand(id="d1", source="r3", target="r2", rate=500, priority="Critical", label="Heavy Core 1"),
                    TrafficDemand(id="d2", source="r4", target="r1", rate=500, priority="High", label="Heavy Core 2"),
                    TrafficDemand(id="d3", source="r6", target="r5", rate=500, priority="Normal", label="Heavy Aggregation"),
                ],
                "failed_links": []
            },
            "tie_case": {
                "id": "tie_case",
                "name": "9. Parallel Equal-Cost Path Tie",
                "description": "Two parallel paths have identical latency (15ms) and bandwidth (200 Mbps) to test deterministic tie-breaking.",
                "topology": ScenarioService._build_tie_topology(),
                "demands": [
                    TrafficDemand(id="d1", source="r1", target="r3", rate=150, priority="High", label="Equal Path Flow")
                ],
                "failed_links": []
            },
            "no_failure_control": {
                "id": "no_failure_control",
                "name": "10. No-Failure Control Baseline",
                "description": "Verifies that enhanced algorithms do not introduce unnecessary latency or route instability on a healthy network.",
                "topology": ScenarioService._build_sample_topology(),
                "demands": [
                    TrafficDemand(id="d1", source="r3", target="r2", rate=100, priority="Critical", label="Baseline Flow A"),
                    TrafficDemand(id="d2", source="r4", target="r1", rate=100, priority="High", label="Baseline Flow B"),
                ],
                "failed_links": []
            }
        }

    @staticmethod
    def _build_sample_topology() -> NetworkTopology:
        routers = [
            Router(id="r1", name="Core Router A", x=100, y=100),
            Router(id="r2", name="Core Router B", x=400, y=100),
            Router(id="r3", name="Edge Router 1", x=100, y=300),
            Router(id="r4", name="Edge Router 2", x=400, y=300),
            Router(id="r5", name="Aggregation 1", x=250, y=200),
            Router(id="r6", name="Aggregation 2", x=250, y=400),
        ]
        links = [
            Link(id="l1", source="r1", target="r2", bandwidth=1000, latency=5),
            Link(id="l2", source="r2", target="r1", bandwidth=1000, latency=5),
            Link(id="l3", source="r1", target="r5", bandwidth=500, latency=10),
            Link(id="l4", source="r5", target="r1", bandwidth=500, latency=10),
            Link(id="l5", source="r2", target="r5", bandwidth=500, latency=10),
            Link(id="l6", source="r5", target="r2", bandwidth=500, latency=10),
            Link(id="l7", source="r3", target="r5", bandwidth=200, latency=15),
            Link(id="l8", source="r5", target="r3", bandwidth=200, latency=15),
            Link(id="l9", source="r4", target="r5", bandwidth=200, latency=15),
            Link(id="l10", source="r5", target="r4", bandwidth=200, latency=15),
            Link(id="l11", source="r3", target="r6", bandwidth=300, latency=20),
            Link(id="l12", source="r6", target="r3", bandwidth=300, latency=20),
            Link(id="l13", source="r4", target="r6", bandwidth=300, latency=20),
            Link(id="l14", source="r6", target="r4", bandwidth=300, latency=20),
            Link(id="l15", source="r6", target="r5", bandwidth=400, latency=12),
            Link(id="l16", source="r5", target="r6", bandwidth=400, latency=12),
        ]
        return NetworkTopology(routers=routers, links=links)

    @staticmethod
    def _build_bottleneck_topology() -> NetworkTopology:
        routers = [
            Router(id="r1", name="Source R1", x=100, y=100),
            Router(id="r2", name="Direct Mid R2", x=250, y=100),
            Router(id="r3", name="HighCap Mid R3", x=250, y=300),
            Router(id="r4", name="Target R4", x=400, y=100),
        ]
        links = [
            # Direct low-latency (5ms + 5ms = 10ms) but low bandwidth (50 Mbps)
            Link(id="l1", source="r1", target="r2", bandwidth=50, latency=5),
            Link(id="l2", source="r2", target="r4", bandwidth=50, latency=5),
            # Alternative high-latency (15ms + 15ms = 30ms) but high bandwidth (1000 Mbps)
            Link(id="l3", source="r1", target="r3", bandwidth=1000, latency=15),
            Link(id="l4", source="r3", target="r4", bandwidth=1000, latency=15),
        ]
        return NetworkTopology(routers=routers, links=links)

    @staticmethod
    def _build_tie_topology() -> NetworkTopology:
        routers = [
            Router(id="r1", name="Source R1", x=100, y=200),
            Router(id="r2a", name="Path A Mid", x=250, y=100),
            Router(id="r2b", name="Path B Mid", x=250, y=300),
            Router(id="r3", name="Target R3", x=400, y=200),
        ]
        links = [
            Link(id="l1a", source="r1", target="r2a", bandwidth=200, latency=10),
            Link(id="l2a", source="r2a", target="r3", bandwidth=200, latency=5),
            Link(id="l1b", source="r1", target="r2b", bandwidth=200, latency=10),
            Link(id="l2b", source="r2b", target="r3", bandwidth=200, latency=5),
        ]
        return NetworkTopology(routers=routers, links=links)
