import React from "react";
import type { TrafficDemand } from "../types/network";
import { X, CheckCircle, AlertTriangle, XCircle, Info, Zap } from "lucide-react";

interface ExplanationDrawerProps {
  demand: TrafficDemand | null;
  onClose: () => void;
}

export const ExplanationDrawer: React.FC<ExplanationDrawerProps> = ({ demand, onClose }) => {
  if (!demand) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-xl bg-slate-900 border-l border-slate-800 text-slate-100 h-full overflow-y-auto p-6 shadow-2xl flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex justify-between items-start pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${
                  demand.priority === "Critical" ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                  demand.priority === "High" ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" :
                  "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                }`}>
                  {demand.priority} Priority
                </span>
                <span className="text-xs text-slate-400 font-mono">ID: {demand.id}</span>
              </div>
              <h2 className="text-xl font-bold text-white mt-1">
                {demand.label || `Demand ${demand.source} → ${demand.target}`}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Allocation Summary Card */}
          <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">Route Status:</span>
              <span className={`font-bold px-2 py-0.5 rounded ${
                demand.status === "routed" ? "bg-emerald-500/20 text-emerald-400" :
                demand.status === "partial" ? "bg-amber-500/20 text-amber-400" :
                "bg-rose-500/20 text-rose-400"
              }`}>
                {demand.status.toUpperCase()}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/60 text-xs">
              <div>
                <span className="text-slate-500 block">Requested Rate</span>
                <span className="text-sm font-semibold text-slate-200">{demand.rate} Mbps</span>
              </div>
              <div>
                <span className="text-slate-500 block">Delivered Rate</span>
                <span className="text-sm font-semibold text-emerald-400">{demand.allocated_rate} Mbps</span>
              </div>
              <div>
                <span className="text-slate-500 block">Path Latency</span>
                <span className="text-sm font-semibold text-slate-200">
                  {demand.path_latency ? `${demand.path_latency.toFixed(1)} ms` : "N/A"}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Max SLA Allowed</span>
                <span className="text-sm font-semibold text-slate-200">
                  {demand.max_latency_sla ? `${demand.max_latency_sla} ms` : "None"}
                </span>
              </div>
            </div>
          </div>

          {/* Explanation Text */}
          <div className="mt-4 p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/20">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Info className="w-4 h-4" /> Routing Decision Analysis
            </div>
            <p className="text-xs text-indigo-200/90 leading-relaxed font-mono">
              {demand.explanation || "No decision explanation recorded for this demand."}
            </p>
          </div>

          {/* Bottleneck Link Indicator */}
          {demand.bottleneck_link && (
            <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              <div className="text-xs">
                <span className="font-semibold text-amber-300">Constraining Bottleneck Link:</span>
                <span className="text-slate-300 ml-1 font-mono">'{demand.bottleneck_link}'</span>
                <span className="text-slate-400 block mt-0.5">
                  Residual Capacity: {(demand.bottleneck_capacity !== undefined && demand.bottleneck_capacity !== null) ? `${demand.bottleneck_capacity.toFixed(1)} Mbps` : "0 Mbps"}
                </span>
              </div>
            </div>
          )}

          {/* Candidate Paths Evaluation Table */}
          <div className="mt-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" /> Candidate Paths Evaluated (Yen's K-Shortest)
            </h3>
            {demand.candidate_paths && demand.candidate_paths.length > 0 ? (
              <div className="space-y-2">
                {demand.candidate_paths.map((cand, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border text-xs transition ${
                      cand.feasible
                        ? "bg-slate-950 border-emerald-500/30 hover:border-emerald-500/60"
                        : "bg-slate-950/60 border-slate-800 opacity-80"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-2">
                        {cand.feasible ? (
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-400" />
                        )}
                        <span className="font-bold font-mono text-slate-200">
                          Candidate #{idx + 1}: {cand.path.join(" → ")}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                        cand.feasible ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
                      }`}>
                        {cand.feasible ? "FEASIBLE" : "REJECTED"}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                      <div>Latency: <span className="text-slate-200 font-semibold">{cand.latency} ms</span></div>
                      <div>Bottleneck: <span className="text-slate-200 font-semibold">{cand.bottleneck_capacity.toFixed(1)} Mbps</span></div>
                      <div>Queue Cost: <span className="text-slate-200 font-semibold">{cand.cost.toFixed(1)}</span></div>
                    </div>

                    {cand.rejection_reason && (
                      <div className="mt-2 text-[11px] text-rose-300 bg-rose-950/30 p-1.5 rounded border border-rose-500/20 font-mono">
                        Reason: {cand.rejection_reason}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No candidate paths were recorded for this strategy.</p>
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 mt-6">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-800 text-slate-200 font-semibold hover:bg-slate-700 transition"
          >
            Close Decision Analysis
          </button>
        </div>
      </div>
    </div>
  );
};
