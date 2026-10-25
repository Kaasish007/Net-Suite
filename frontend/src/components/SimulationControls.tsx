import React, { useEffect, useState } from "react";
import { Play, RotateCcw, Route, Network, Layers, Trophy, Sparkles } from "lucide-react";
import { getScenarios } from "../services/api";
import type { ScenarioInfo } from "../types/network";

interface SimulationControlsProps {
  onRunSimulation: (strategy: string) => void;
  onResetSimulation: () => void;
  onLoadSample: () => void;
  onLoadScenario: (scenarioId: string) => void;
  onRunComparison: () => void;
  strategy: string;
  setStrategy: (strategy: string) => void;
  loading: boolean;
}

export const SimulationControls: React.FC<SimulationControlsProps> = ({
  onRunSimulation,
  onResetSimulation,
  onLoadSample,
  onLoadScenario,
  onRunComparison,
  strategy,
  setStrategy,
  loading
}) => {
  const [scenarios, setScenarios] = useState<ScenarioInfo[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<string>("healthy_network");

  useEffect(() => {
    getScenarios().then(setScenarios).catch(console.error);
  }, []);

  const handleScenarioChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const scId = e.target.value;
    setSelectedScenario(scId);
    onLoadScenario(scId);
  };

  return (
    <div className="bg-slate-900/90 backdrop-blur-2xl border border-slate-800/80 rounded-2xl shadow-2xl p-5 flex flex-col gap-5">
      <h3 className="font-black text-slate-100 flex items-center gap-2 text-xs uppercase tracking-widest text-indigo-300">
        <Sparkles className="w-4 h-4 text-indigo-400" />
        Simulation & Strategy Controls
      </h3>

      {/* Scenario Selection Dropdown */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] text-slate-400 uppercase tracking-widest font-black flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-amber-400" /> Deterministic Scenario Suite
        </label>
        <select
          value={selectedScenario}
          onChange={handleScenarioChange}
          disabled={loading}
          className="bg-slate-950/90 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 font-bold focus:outline-none focus:border-indigo-500 transition shadow-inner"
        >
          {scenarios.map((sc) => (
            <option key={sc.id} value={sc.id} className="bg-slate-950 text-slate-200">
              {sc.name}
            </option>
          ))}
        </select>
      </div>

      {/* Routing Strategy Grid */}
      <div className="flex flex-col gap-2">
        <label className="text-[10px] text-slate-400 uppercase tracking-widest font-black">
          Algorithm Strategy Selection
        </label>
        <div className="grid grid-cols-2 gap-2.5 text-xs">
          <button
            onClick={() => setStrategy("capacity_k_shortest")}
            className={`p-3 rounded-xl font-extrabold transition-all flex flex-col items-center justify-center gap-1.5 ${
              strategy === "capacity_k_shortest"
                ? "bg-indigo-600/30 text-indigo-200 border border-indigo-500/60 shadow-[0_0_15px_rgba(99,102,241,0.25)] ring-1 ring-indigo-500/40"
                : "bg-slate-950/70 border border-slate-800/80 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
            }`}
          >
            <Sparkles className="w-4 h-4 text-indigo-400" />
            NetResQ K-CSPR
          </button>

          <button
            onClick={() => setStrategy("dijkstra")}
            className={`p-3 rounded-xl font-extrabold transition-all flex flex-col items-center justify-center gap-1.5 ${
              strategy === "dijkstra"
                ? "bg-blue-600/30 text-blue-200 border border-blue-500/60 shadow-[0_0_15px_rgba(59,130,246,0.25)]"
                : "bg-slate-950/70 border border-slate-800/80 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
            }`}
          >
            <Route className="w-4 h-4 text-blue-400" />
            Baseline Dijkstra
          </button>

          <button
            onClick={() => setStrategy("congestion_aware")}
            className={`p-3 rounded-xl font-extrabold transition-all flex flex-col items-center justify-center gap-1.5 ${
              strategy === "congestion_aware"
                ? "bg-amber-600/30 text-amber-200 border border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.25)]"
                : "bg-slate-950/70 border border-slate-800/80 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
            }`}
          >
            <Network className="w-4 h-4 text-amber-400" />
            Congestion Aware
          </button>

          <button
            onClick={() => setStrategy("mcf_lp")}
            className={`p-3 rounded-xl font-extrabold transition-all flex flex-col items-center justify-center gap-1.5 ${
              strategy === "mcf_lp"
                ? "bg-emerald-600/30 text-emerald-200 border border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.25)]"
                : "bg-slate-950/70 border border-slate-800/80 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
            }`}
          >
            <Trophy className="w-4 h-4 text-emerald-400" />
            Global MCF LP
          </button>
        </div>
      </div>

      {/* Primary Action Trigger Buttons */}
      <div className="flex flex-col gap-2.5">
        <button
          onClick={() => onRunSimulation(strategy)}
          disabled={loading}
          className="w-full bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-600 hover:from-indigo-500 hover:to-blue-500 text-white font-extrabold py-3 rounded-xl transition-all shadow-lg shadow-indigo-950/50 hover:shadow-indigo-500/30 flex items-center justify-center gap-2 disabled:opacity-50 text-xs active:scale-95"
        >
          <Play className="w-4 h-4" /> Run {strategy === "capacity_k_shortest" ? "NetResQ K-CSPR" : strategy}
        </button>

        <button
          onClick={onRunComparison}
          disabled={loading}
          className="w-full bg-gradient-to-r from-amber-500/20 via-indigo-500/20 to-purple-500/20 hover:from-amber-500/30 hover:to-purple-500/30 border border-amber-500/40 text-amber-300 font-extrabold py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 text-xs active:scale-95"
        >
          <Trophy className="w-4 h-4 text-amber-400" /> Compare All 4 Strategies
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onResetSimulation}
            disabled={loading}
            className="bg-slate-950/60 border border-slate-800 hover:bg-slate-800 text-slate-300 font-bold py-2 rounded-xl transition flex items-center justify-center gap-1.5 text-xs disabled:opacity-50 active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" /> Reset State
          </button>

          <button
            onClick={onLoadSample}
            disabled={loading}
            className="bg-slate-950/60 border border-slate-800 hover:bg-slate-800 text-slate-300 font-bold py-2 rounded-xl transition flex items-center justify-center gap-1.5 text-xs disabled:opacity-50 active:scale-95"
          >
            <Network className="w-3.5 h-3.5 text-cyan-400" /> Sample Topology
          </button>
        </div>
      </div>
    </div>
  );
};
