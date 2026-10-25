import React from "react";
import type { SimulationMetrics } from "../types/network";
import { Activity, ArrowUpFromLine, Clock, ShieldCheck, Cpu, Radio } from "lucide-react";

interface NetworkMetricsProps {
  metrics: SimulationMetrics | null;
}

export const NetworkMetrics: React.FC<NetworkMetricsProps> = ({ metrics }) => {
  if (!metrics) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 w-full opacity-40">
        <SkeletonMetricCard title="Delivered Traffic" />
        <SkeletonMetricCard title="Critical SLA" />
        <SkeletonMetricCard title="Weighted Latency" />
        <SkeletonMetricCard title="Network Load" />
        <SkeletonMetricCard title="Link Health" />
        <SkeletonMetricCard title="Execution Time" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 w-full">
      <MetricCard
        title="Delivered Traffic"
        value={`${metrics.total_delivered_traffic.toFixed(0)}`}
        unit="Mbps"
        subtitle={`${metrics.delivery_ratio.toFixed(1)}% of ${metrics.total_requested_traffic.toFixed(0)} Mbps`}
        icon={<ArrowUpFromLine className="w-4 h-4 text-emerald-400" />}
        accentColor="from-emerald-500/15 via-emerald-500/5 to-transparent border-emerald-500/30 text-emerald-400 hover:border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
      />
      <MetricCard
        title="Critical Service SLA"
        value={`${metrics.critical_delivery_rate.toFixed(1)}%`}
        subtitle={`Critical Delivered: ${metrics.critical_breakdown?.delivered.toFixed(0) || 0} Mbps`}
        icon={<ShieldCheck className="w-4 h-4 text-rose-400" />}
        accentColor="from-rose-500/15 via-rose-500/5 to-transparent border-rose-500/30 text-rose-400 hover:border-rose-500/60 shadow-[0_0_20px_rgba(244,63,94,0.1)]"
      />
      <MetricCard
        title="Weighted Latency"
        value={metrics.demand_weighted_latency !== null ? `${metrics.demand_weighted_latency.toFixed(1)}` : "N/A"}
        unit={metrics.demand_weighted_latency !== null ? "ms" : ""}
        subtitle="Demand-weighted path avg"
        icon={<Clock className="w-4 h-4 text-cyan-400" />}
        accentColor="from-cyan-500/15 via-cyan-500/5 to-transparent border-cyan-500/30 text-cyan-400 hover:border-cyan-500/60 shadow-[0_0_20px_rgba(6,182,212,0.1)]"
      />
      <MetricCard
        title="Network Utilization"
        value={`${(metrics.network_utilization * 100).toFixed(1)}%`}
        subtitle={`Max Link: ${(metrics.max_link_utilization * 100).toFixed(1)}%`}
        icon={<Activity className="w-4 h-4 text-indigo-400" />}
        accentColor="from-indigo-500/15 via-indigo-500/5 to-transparent border-indigo-500/30 text-indigo-400 hover:border-indigo-500/60 shadow-[0_0_20px_rgba(99,102,241,0.1)]"
      />
      <MetricCard
        title="Link Health"
        value={`${metrics.operational_links}`}
        unit="Active"
        subtitle={`${metrics.failed_links} link cuts`}
        icon={<Radio className={`w-4 h-4 ${metrics.failed_links > 0 ? "text-amber-400" : "text-emerald-400"}`} />}
        accentColor={metrics.failed_links > 0 ? "from-amber-500/15 via-amber-500/5 to-transparent border-amber-500/30 text-amber-400 hover:border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.1)]" : "from-emerald-500/15 via-emerald-500/5 to-transparent border-emerald-500/30 text-emerald-400 hover:border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.1)]"}
      />
      <MetricCard
        title="Algorithm Speed"
        value={`${metrics.algorithm_runtime_ms.toFixed(1)}`}
        unit="ms"
        subtitle={`SLA Violations: ${metrics.sla_violations}`}
        icon={<Cpu className="w-4 h-4 text-purple-400" />}
        accentColor="from-purple-500/15 via-purple-500/5 to-transparent border-purple-500/30 text-purple-400 hover:border-purple-500/60 shadow-[0_0_20px_rgba(168,85,247,0.1)]"
      />
    </div>
  );
};

const MetricCard = ({ title, value, unit, subtitle, icon, accentColor }: any) => (
  <div className={`relative overflow-hidden bg-slate-900/90 backdrop-blur-2xl border p-4 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl bg-gradient-to-br ${accentColor}`}>
    <div className="flex justify-between items-start mb-2">
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{title}</span>
      <div className="p-1.5 rounded-xl bg-slate-950/80 border border-slate-800 shadow-inner">
        {icon}
      </div>
    </div>
    <div className="flex items-baseline gap-1 mb-0.5 font-mono">
      <span className="text-2xl font-black tracking-tight text-white">{value}</span>
      {unit && <span className="text-xs font-bold text-slate-400 font-sans">{unit}</span>}
    </div>
    <p className="text-[11px] font-medium text-slate-400 tracking-tight">{subtitle}</p>
  </div>
);

const SkeletonMetricCard = ({ title }: { title: string }) => (
  <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
    <span className="text-[10px] font-bold text-slate-500 uppercase">{title}</span>
    <div className="h-7 bg-slate-800 rounded mt-2 animate-pulse"></div>
  </div>
);
