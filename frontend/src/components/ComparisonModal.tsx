import React from "react";
import type { SimulationMetrics } from "../types/network";
import { X, Trophy, ShieldCheck, Clock, Gauge } from "lucide-react";

interface ComparisonModalProps {
  comparisonResults: Record<string, SimulationMetrics> | null;
  onClose: () => void;
}

export const ComparisonModal: React.FC<ComparisonModalProps> = ({ comparisonResults, onClose }) => {
  if (!comparisonResults) return null;

  const strategyLabels: Record<string, { name: string; tag: string; badge: string }> = {
    dijkstra: { name: "Baseline Dijkstra", tag: "Shortest Latency Path", badge: "bg-slate-700 text-slate-200" },
    congestion_aware: { name: "Congestion-Aware", tag: "Cost Reweighting", badge: "bg-amber-600/30 text-amber-300 border border-amber-500/30" },
    capacity_k_shortest: { name: "NetResQ K-CSPR (Enhanced)", tag: "Yen's K-Shortest + SLA", badge: "bg-indigo-600/30 text-indigo-300 border border-indigo-500/40" },
    mcf_lp: { name: "Global MCF LP", tag: "Theoretical Upper Bound", badge: "bg-emerald-600/30 text-emerald-300 border border-emerald-500/40" }
  };

  const strategies = ["dijkstra", "congestion_aware", "capacity_k_shortest", "mcf_lp"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">
                Routing Strategy Benchmark Comparison
              </h2>
              <p className="text-xs text-slate-400">
                Side-by-side evaluation across Dijkstra, Congestion-Aware, NetResQ K-CSPR, and Global MCF LP.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          {strategies.map((stratKey) => {
            const metrics = comparisonResults[stratKey];
            const meta = strategyLabels[stratKey] || { name: stratKey, tag: "", badge: "bg-slate-800" };
            const isWinner = stratKey === "capacity_k_shortest";

            if (!metrics) return null;

            return (
              <div
                key={stratKey}
                className={`p-4 rounded-xl border flex flex-col justify-between transition ${
                  isWinner
                    ? "bg-indigo-950/20 border-indigo-500/50 shadow-lg shadow-indigo-950/50 ring-1 ring-indigo-500/30"
                    : "bg-slate-950/60 border-slate-800"
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${meta.badge}`}>
                      {meta.tag}
                    </span>
                    {isWinner && (
                      <span className="text-[10px] font-extrabold text-amber-400 bg-amber-500/20 border border-amber-500/30 px-1.5 py-0.5 rounded flex items-center gap-1">
                        <Trophy className="w-3 h-3" /> BEST
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-white mb-3">{meta.name}</h3>

                  <div className="space-y-2.5 text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80">
                      <div className="text-[11px] text-slate-400">Total Delivered Traffic</div>
                      <div className="text-base font-extrabold text-emerald-400">
                        {metrics.total_delivered_traffic.toFixed(1)} <span className="text-xs font-normal">Mbps</span>
                      </div>
                      <div className="text-[10px] text-slate-500">Delivery Ratio: {metrics.delivery_ratio.toFixed(1)}%</div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80">
                      <div className="text-[11px] text-slate-400 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-red-400" /> Critical Service SLA
                      </div>
                      <div className="text-sm font-bold text-red-400">
                        {metrics.critical_delivery_rate.toFixed(1)}%
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80">
                      <div className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-blue-400" /> Weighted Path Latency
                      </div>
                      <div className="text-sm font-semibold text-slate-200">
                        {metrics.demand_weighted_latency ? `${metrics.demand_weighted_latency.toFixed(1)} ms` : "N/A"}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80">
                      <div className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Gauge className="w-3.5 h-3.5 text-amber-400" /> Max Link Utilization
                      </div>
                      <div className="text-sm font-semibold text-amber-300">
                        {(metrics.max_link_utilization * 100).toFixed(1)}%
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2 text-[11px] text-slate-400 border-t border-slate-800">
                      <span>Runtime:</span>
                      <span className="font-mono text-slate-300">{metrics.algorithm_runtime_ms.toFixed(1)} ms</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action button */}
        <div className="pt-6 border-t border-slate-800 mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition"
          >
            Close Comparison Benchmark
          </button>
        </div>
      </div>
    </div>
  );
};
