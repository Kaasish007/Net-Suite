export interface Router {
  id: string;
  name: string;
  status: string;
  x: number;
  y: number;
}

export interface Link {
  id: string;
  source: string;
  target: string;
  bandwidth: number;
  latency: number;
  status: string;
  traffic_load: number;
}

export interface NetworkTopology {
  routers: Router[];
  links: Link[];
}

export interface CandidatePathInfo {
  path: string[];
  latency: number;
  bottleneck_capacity: number;
  feasible: boolean;
  rejection_reason?: string | null;
  cost: number;
}

export interface TrafficDemand {
  id: string;
  source: string;
  target: string;
  rate: number;
  priority: "Critical" | "High" | "Normal";
  label?: string;
  allocated_rate: number;
  status: string;
  route: string[];
  max_latency_sla?: number | null;
  min_guaranteed_rate?: number;
  candidate_paths?: CandidatePathInfo[];
  explanation?: string | null;
  bottleneck_link?: string | null;
  bottleneck_capacity?: number | null;
  path_latency?: number | null;
  is_disconnected?: boolean;
}

export interface PriorityMetricBreakdown {
  requested: number;
  delivered: number;
  dropped: number;
  delivery_rate: number;
}

export interface SimulationMetrics {
  total_requested_traffic: number;
  total_delivered_traffic: number;
  total_dropped_traffic: number;
  delivery_ratio: number;
  average_latency: number | null;
  demand_weighted_latency: number | null;
  network_utilization: number;
  max_link_utilization: number;
  operational_links: number;
  failed_links: number;
  affected_demands: number;
  critical_delivery_rate: number;
  high_delivery_rate: number;
  normal_delivery_rate: number;
  critical_breakdown?: PriorityMetricBreakdown;
  high_breakdown?: PriorityMetricBreakdown;
  normal_breakdown?: PriorityMetricBreakdown;
  physical_disconnections: number;
  capacity_blocked_demands: number;
  sla_violations: number;
  algorithm_runtime_ms: number;
}

export interface SimulationEvent {
  step: number;
  timestamp: number;
  event_type: string;
  description: string;
  affected_demands: string[];
}

export interface ScenarioInfo {
  id: string;
  name: string;
  description: string;
}

export interface SimulationState {
  topology: NetworkTopology;
  demands: TrafficDemand[];
  metrics: SimulationMetrics;
  strategy: string;
  events?: SimulationEvent[];
  comparison_results?: Record<string, SimulationMetrics>;
}
