import React from "react";
import type { NetworkTopology } from "../types/network";
import { failLink, restoreLink } from "../services/api";
import { Activity, Power, PowerOff, ShieldAlert, Network } from "lucide-react";

interface NetworkDetailsProps {
  topology: NetworkTopology | null;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  onStateChange: () => void;
}

export const NetworkDetails: React.FC<NetworkDetailsProps> = ({ 
  topology, selectedNodeId, selectedEdgeId, onStateChange 
}) => {
  if (!topology) return null;

  if (selectedNodeId) {
    const router = topology.routers.find(r => r.id === selectedNodeId);
    if (!router) return null;
    return (
      <div className="bg-slate-900 border border-slate-800/60 rounded-xl shadow-lg p-5">
        <div className="flex items-center gap-3 mb-4 border-b border-slate-800/60 pb-3">
          <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
            <Activity className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100">{router.name}</h3>
            <p className="text-xs text-slate-400 uppercase tracking-widest">Router: {router.id}</p>
          </div>
        </div>
        
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Status</span>
            <span className="text-emerald-400 font-medium capitalize">{router.status}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Position</span>
            <span className="text-slate-300 font-mono">({router.x}, {router.y})</span>
          </div>
        </div>
      </div>
    );
  }

  if (selectedEdgeId) {
    const link = topology.links.find(l => l.id === selectedEdgeId);
    if (!link) return null;
    
    const utilization = link.bandwidth > 0 ? (link.traffic_load / link.bandwidth) * 100 : 0;
    
    const handleToggleStatus = async () => {
      try {
        if (link.status === "operational") {
          await failLink(link.id);
        } else {
          await restoreLink(link.id);
        }
        onStateChange();
      } catch (err) {
        console.error("Failed to toggle link status", err);
      }
    };
    
    return (
      <div className="bg-slate-900 border border-slate-800/60 rounded-xl shadow-lg p-5">
         <div className="flex items-center gap-3 mb-4 border-b border-slate-800/60 pb-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${link.status === 'operational' ? 'bg-emerald-500/20 border-emerald-500/30' : 'bg-red-500/20 border-red-500/30'}`}>
            {link.status === 'operational' ? <Activity className="w-5 h-5 text-emerald-400" /> : <ShieldAlert className="w-5 h-5 text-red-400" />}
          </div>
          <div>
            <h3 className="font-bold text-slate-100">Link {link.id}</h3>
            <p className="text-xs text-slate-400 font-mono uppercase tracking-widest">{link.source} &rarr; {link.target}</p>
          </div>
        </div>
        
        <div className="space-y-4 text-sm mb-5">
          <div className="flex justify-between">
            <span className="text-slate-500">Bandwidth</span>
            <span className="text-slate-200 font-medium">{link.bandwidth} Mbps</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Latency</span>
            <span className="text-slate-200 font-medium">{link.latency} ms</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Traffic Load</span>
            <span className="text-slate-200 font-medium">{link.traffic_load} Mbps</span>
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-slate-500">Utilization</span>
              <span className="text-slate-200 font-medium">{utilization.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${utilization >= 90 ? 'bg-red-500' : utilization >= 60 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                style={{ width: `${Math.min(100, utilization)}%` }}
              ></div>
            </div>
          </div>
        </div>
        
        <button
          onClick={handleToggleStatus}
          className={`w-full py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
            link.status === "operational" 
              ? "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.1)] hover:shadow-[0_0_15px_rgba(239,68,68,0.2)]" 
              : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)] hover:shadow-[0_0_15px_rgba(16,185,129,0.2)]"
          }`}
        >
          {link.status === "operational" ? (
            <><PowerOff className="w-4 h-4" /> Fail Link</>
          ) : (
            <><Power className="w-4 h-4" /> Restore Link</>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800/60 rounded-xl shadow-lg p-5 flex flex-col items-center justify-center text-center h-[250px]">
      <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-4">
        <Network className="w-8 h-8 text-slate-500" />
      </div>
      <h4 className="text-slate-300 font-medium mb-1">No Selection</h4>
      <p className="text-slate-500 text-sm">Select a router or link on the map to view detailed information.</p>
    </div>
  );
};
