import { useEffect, useState } from "react";
import { NetworkGraph } from "./components/NetworkGraph";
import { NetworkMetrics } from "./components/NetworkMetrics";
import { SimulationControls } from "./components/SimulationControls";
import { TrafficTable } from "./components/TrafficTable";
import { NetworkDetails } from "./components/NetworkDetails";
import { ExplanationDrawer } from "./components/ExplanationDrawer";
import { ComparisonModal } from "./components/ComparisonModal";
import { EventTimeline } from "./components/EventTimeline";
import type { SimulationState, TrafficDemand, SimulationMetrics } from "./types/network";
import {
  getSimulationState,
  runSimulation,
  resetSimulation,
  loadSampleTopology,
  loadScenario,
  runComparison
} from "./services/api";
import { Network, Sparkles, Trophy } from "lucide-react";

function App() {
  const [simulationState, setSimulationState] = useState<SimulationState | null>(null);
  const [loading, setLoading] = useState(true);
  const [strategy, setStrategy] = useState("capacity_k_shortest");

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [selectedDemandId, setSelectedDemandId] = useState<string | null>(null);

  const [inspectDemand, setInspectDemand] = useState<TrafficDemand | null>(null);
  const [comparisonResults, setComparisonResults] = useState<Record<string, SimulationMetrics> | null>(null);
  const [showComparisonModal, setShowComparisonModal] = useState(false);

  const fetchState = async () => {
    try {
      const state = await getSimulationState();
      setSimulationState(state);
      if (state.strategy) {
        setStrategy(state.strategy);
      }
    } catch (err) {
      console.error("Error fetching state", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchState();
  }, []);

  const handleRunSimulation = async (strat: string) => {
    setLoading(true);
    try {
      const state = await runSimulation(strat);
      setSimulationState(state);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setLoading(true);
    try {
      const state = await resetSimulation();
      setSimulationState(state);
      setSelectedDemandId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSample = async () => {
    setLoading(true);
    try {
      await loadSampleTopology();
      await fetchState();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadScenario = async (scenarioId: string) => {
    setLoading(true);
    try {
      const state = await loadScenario(scenarioId);
      setSimulationState(state);
      setSelectedDemandId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunComparison = async () => {
    setLoading(true);
    try {
      const results = await runComparison();
      setComparisonResults(results);
      setShowComparisonModal(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const activeRoute = selectedDemandId
    ? simulationState?.demands.find((d) => d.id === selectedDemandId)?.route
    : undefined;

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 p-4 md:p-6 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Header */}
      <header className="mb-6 flex justify-between items-center bg-slate-900/90 backdrop-blur-2xl border border-slate-800/80 p-4 rounded-2xl shadow-2xl shadow-indigo-950/20">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-indigo-600 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-500"></div>
            <div className="relative bg-slate-950 p-3 rounded-xl border border-slate-800">
              <Network className="w-7 h-7 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-indigo-200 to-purple-300">
                NetResQ
              </h1>
              <span className="px-3 py-0.5 text-[10px] font-extrabold rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center gap-1.5 shadow-[0_0_10px_rgba(99,102,241,0.3)]">
                <Sparkles className="w-3 h-3 text-amber-400" /> K-CSPR Strategy Engine
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-semibold tracking-widest uppercase mt-0.5 flex items-center gap-2">
              <span>Intelligent Failure Recovery</span>
              <span className="w-1 h-1 rounded-full bg-slate-600"></span>
              <span className="text-cyan-400">SciPy LP Optimized</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleRunComparison}
            disabled={loading}
            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 via-indigo-500/20 to-purple-500/20 hover:from-amber-500/30 hover:to-purple-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition-all shadow-lg hover:shadow-amber-500/10 active:scale-95"
          >
            <Trophy className="w-4 h-4 text-amber-400" /> Benchmark Suite
          </button>

          <div className="flex items-center gap-3 bg-slate-950/90 py-1.5 px-4 rounded-full border border-slate-800">
            <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest">Engine Status</span>
            <div
              className={`flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                loading ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  loading ? "bg-amber-400 animate-pulse" : "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]"
                }`}
              ></div>
              {loading ? "SIMULATING..." : "ONLINE"}
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="space-y-6 max-w-[1650px] mx-auto">
        <section>
          <NetworkMetrics metrics={simulationState?.metrics || null} />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 flex flex-col gap-6">
            <section className="h-[560px] relative">
              {simulationState ? (
                <NetworkGraph
                  topology={simulationState.topology}
                  onNodeSelect={setSelectedNodeId}
                  onEdgeSelect={setSelectedEdgeId}
                  activeRoute={activeRoute}
                />
              ) : (
                <div className="w-full h-full bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-3">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Topology State...</span>
                </div>
              )}
            </section>

            <section className="flex-1 min-h-[320px]">
              {simulationState && (
                <TrafficTable
                  demands={simulationState.demands}
                  selectedDemandId={selectedDemandId}
                  onDemandSelect={setSelectedDemandId}
                  onInspectExplanation={(demand) => setInspectDemand(demand)}
                />
              )}
            </section>

            <section>
              <EventTimeline events={simulationState?.events} />
            </section>
          </div>

          <aside className="lg:col-span-1 flex flex-col gap-6">
            <SimulationControls
              onRunSimulation={handleRunSimulation}
              onResetSimulation={handleReset}
              onLoadSample={handleLoadSample}
              onLoadScenario={handleLoadScenario}
              onRunComparison={handleRunComparison}
              strategy={strategy}
              setStrategy={setStrategy}
              loading={loading}
            />

            <NetworkDetails
              topology={simulationState?.topology || null}
              selectedNodeId={selectedNodeId}
              selectedEdgeId={selectedEdgeId}
              onStateChange={fetchState}
            />
          </aside>
        </div>
      </main>

      {/* Modals & Drawers */}
      <ExplanationDrawer demand={inspectDemand} onClose={() => setInspectDemand(null)} />
      {showComparisonModal && (
        <ComparisonModal
          comparisonResults={comparisonResults}
          onClose={() => setShowComparisonModal(false)}
        />
      )}
    </div>
  );
}

export default App;
