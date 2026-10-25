import React from "react";
import type { SimulationEvent } from "../types/network";
import { Activity, AlertTriangle, CheckCircle, RefreshCw, Zap } from "lucide-react";

interface EventTimelineProps {
  events: SimulationEvent[] | undefined;
}

export const EventTimeline: React.FC<EventTimelineProps> = ({ events }) => {
  if (!events || events.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800/60 rounded-xl p-4 text-xs text-slate-500 italic">
        No simulation events logged yet. Trigger link failures or load scenarios to record events.
      </div>
    );
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case "link_failure":
        return <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />;
      case "link_restoration":
        return <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />;
      case "scenario_loaded":
        return <RefreshCw className="w-4 h-4 text-blue-400 shrink-0" />;
      default:
        return <Zap className="w-4 h-4 text-amber-400 shrink-0" />;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800/60 rounded-xl p-4 shadow-lg">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-800">
        <Activity className="w-4 h-4 text-indigo-400" />
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          Simulation Event Timeline
        </h3>
      </div>

      <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
        {events.slice().reverse().map((ev) => (
          <div
            key={ev.step}
            className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs"
          >
            {getEventIcon(ev.event_type)}
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono mb-0.5">
                <span>Step #{ev.step}</span>
                <span>{new Date(ev.timestamp * 1000).toLocaleTimeString()}</span>
              </div>
              <p className="text-slate-200 text-xs leading-snug">{ev.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
