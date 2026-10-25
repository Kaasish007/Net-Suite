import React from "react";
import type { TrafficDemand } from "../types/network";
import { Info, Activity } from "lucide-react";

interface TrafficTableProps {
  demands: TrafficDemand[];
  onDemandSelect: (demandId: string | null) => void;
  onInspectExplanation: (demand: TrafficDemand) => void;
  selectedDemandId: string | null;
}

export const TrafficTable: React.FC<TrafficTableProps> = ({
  demands,
  onDemandSelect,
  onInspectExplanation,
  selectedDemandId
}) => {
  return (
    <div className="bg-slate-900/80 backdrop-blur-2xl border border-slate-800/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-slate-800/80 flex justify-between items-center bg-slate-950/40">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-100 text-sm tracking-tight">Active Traffic Streams & Path Traces</h3>
            <p className="text-[11px] text-slate-400">Click a demand row to highlight its path on the map or inspect decision logic.</p>
          </div>
        </div>
        <span className="text-xs font-black text-indigo-300 bg-indigo-500/15 border border-indigo-500/30 py-1 px-3 rounded-xl shadow-[0_0_10px_rgba(99,102,241,0.2)]">
          {demands.length} Demands
        </span>
      </div>

      <div className="overflow-auto flex-1">
        <table className="w-full text-xs text-left text-slate-300">
          <thead className="text-[10px] text-slate-400 uppercase tracking-widest font-black bg-slate-950/80 sticky top-0 z-10 border-b border-slate-800">
            <tr>
              <th className="px-4 py-3 font-black">Demand Label</th>
              <th className="px-4 py-3 font-black">Allocated Path Route</th>
              <th className="px-4 py-3 font-black">Priority</th>
              <th className="px-4 py-3 font-black">Delivered / Rate</th>
              <th className="px-4 py-3 font-black">Status</th>
              <th className="px-4 py-3 font-black text-right">Analysis</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {demands.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500 italic">
                  No traffic demands configured in current scenario.
                </td>
              </tr>
            )}
            {demands.map((demand) => {
              const isSelected = selectedDemandId === demand.id;

              let statusBadge = "bg-slate-500/10 text-slate-400 border-slate-500/20";
              if (demand.status === "routed") statusBadge = "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.15)]";
              else if (demand.status === "dropped") statusBadge = "bg-rose-500/15 text-rose-400 border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.15)]";
              else if (demand.status === "partial") statusBadge = "bg-amber-500/15 text-amber-400 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.15)]";

              let priorityBadge = "bg-blue-500/10 text-blue-400 border-blue-500/20";
              if (demand.priority === "Critical") priorityBadge = "bg-rose-500/15 text-rose-400 border-rose-500/30 font-black shadow-[0_0_10px_rgba(244,63,94,0.2)]";
              else if (demand.priority === "High") priorityBadge = "bg-amber-500/15 text-amber-400 border-amber-500/30 font-bold";

              return (
                <tr
                  key={demand.id}
                  onClick={() => onDemandSelect(isSelected ? null : demand.id)}
                  className={`hover:bg-slate-800/50 cursor-pointer transition-all ${
                    isSelected ? "bg-indigo-950/40 border-l-4 border-l-indigo-500 shadow-lg" : "border-l-4 border-l-transparent"
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="font-extrabold text-slate-100">{demand.label || demand.id}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{demand.id}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {demand.route && demand.route.length > 0 ? (
                      <span className="text-emerald-400 font-extrabold tracking-tight">{demand.route.join(" → ")}</span>
                    ) : (
                      <span className="text-slate-500 italic font-sans text-[11px]">No path allocated</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold border ${priorityBadge}`}>
                      {demand.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono">
                    <span className="font-black text-white">{demand.allocated_rate}</span>
                    <span className="text-slate-500 text-[10px]"> / {demand.rate} Mbps</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-black tracking-widest border ${statusBadge}`}>
                      {demand.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onInspectExplanation(demand);
                      }}
                      className="px-3 py-1 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 text-xs font-bold border border-indigo-500/30 transition flex items-center gap-1.5 ml-auto shadow-sm active:scale-95"
                    >
                      <Info className="w-3.5 h-3.5 text-indigo-400" /> Explain
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
