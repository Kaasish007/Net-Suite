import React, { useEffect, useState, useRef } from "react";
import CytoscapeComponent from "react-cytoscapejs";
import type { NetworkTopology } from "../types/network";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";

interface NetworkGraphProps {
  topology: NetworkTopology;
  onNodeSelect: (nodeId: string | null) => void;
  onEdgeSelect: (edgeId: string | null) => void;
  activeRoute?: string[];
}

export const NetworkGraph: React.FC<NetworkGraphProps> = ({
  topology,
  onNodeSelect,
  onEdgeSelect,
  activeRoute = [],
}) => {
  const [elements, setElements] = useState<any[]>([]);
  const cyRef = useRef<any>(null);

  useEffect(() => {
    const newElements: any[] = [];

    // Add nodes with enlarged hit target sizes and custom labels
    topology.routers.forEach((router) => {
      newElements.push({
        data: {
          id: router.id,
          label: router.name,
          shortName: router.id.toUpperCase(),
          status: router.status,
        },
        position: { x: router.x * 1.6 + 80, y: router.y * 1.3 + 60 },
      });
    });

    // Add directed edge links
    topology.links.forEach((link) => {
      // Check if both link endpoints are in sequence in activeRoute
      let isRouteActive = false;
      if (activeRoute && activeRoute.length > 1) {
        for (let i = 0; i < activeRoute.length - 1; i++) {
          if (
            (activeRoute[i] === link.source && activeRoute[i + 1] === link.target) ||
            (activeRoute[i] === link.target && activeRoute[i + 1] === link.source)
          ) {
            isRouteActive = true;
            break;
          }
        }
      }

      const isFailed = link.status === "failed";
      const utilization = link.bandwidth > 0 ? (link.traffic_load / link.bandwidth) * 100 : 100;
      const isCongested = utilization >= 85 && !isFailed;

      let edgeClass = "";
      if (isFailed) edgeClass = "failed";
      else if (isCongested) edgeClass = "congested";
      else if (isRouteActive) edgeClass = "active-route";

      newElements.push({
        data: {
          id: link.id,
          source: link.source,
          target: link.target,
          label: `${link.bandwidth}M | ${link.latency}ms`,
          load: `${link.traffic_load.toFixed(0)}M`,
          utilization: utilization.toFixed(0),
        },
        classes: edgeClass,
      });
    });

    setElements(newElements);
  }, [topology, activeRoute]);

  const stylesheet: any = [
    {
      selector: "node",
      style: {
        label: "data(label)",
        "text-valign": "bottom",
        "text-halign": "center",
        "text-margin-y": 8,
        "background-color": "#1e293b",
        "background-gradient-stop-colors": "#0f172a #1e293b",
        "border-width": 3,
        "border-color": "#6366f1",
        color: "#f8fafc",
        width: 48,
        height: 48,
        "font-size": 12,
        "font-weight": 700,
        "font-family": "Inter, system-ui, sans-serif",
        "overlay-padding": 8,
        "overlay-color": "#6366f1",
        "overlay-opacity": 0,
        "transition-property": "background-color, border-color, bounds",
        "transition-duration": "0.2s"
      },
    },
    {
      selector: "node:hover",
      style: {
        "border-color": "#38bdf8",
        "border-width": 4,
        "overlay-opacity": 0.15,
        cursor: "pointer"
      }
    },
    {
      selector: "node:selected",
      style: {
        "border-width": 4,
        "border-color": "#38bdf8",
        "background-color": "#312e81",
        "shadow-blur": 15,
        "shadow-color": "#38bdf8",
        "shadow-opacity": 0.8
      },
    },
    {
      selector: "edge",
      style: {
        width: 3.5,
        "line-color": "#334155",
        "target-arrow-color": "#334155",
        "target-arrow-shape": "triangle",
        "curve-style": "bezier",
        "control-point-step-size": 40,
        "font-size": 10,
        color: "#94a3b8",
        "text-background-opacity": 0.9,
        "text-background-color": "#090d16",
        "text-background-padding": 4,
        "text-background-shape": "roundrect",
        label: "data(label)",
        "font-family": "Inter, sans-serif",
        "font-weight": 600
      },
    },
    {
      selector: "edge.failed",
      style: {
        "line-color": "#f43f5e",
        "target-arrow-color": "#f43f5e",
        "line-style": "dashed",
        "line-dash-pattern": [6, 4],
        width: 3,
        opacity: 0.85
      },
    },
    {
      selector: "edge.congested",
      style: {
        "line-color": "#f59e0b",
        "target-arrow-color": "#f59e0b",
        width: 4
      },
    },
    {
      selector: "edge.active-route",
      style: {
        "line-color": "#10b981",
        "target-arrow-color": "#10b981",
        width: 5.5,
        "z-index": 10,
        "line-style": "solid",
        "shadow-blur": 12,
        "shadow-color": "#10b981",
        "shadow-opacity": 0.8
      },
    },
    {
      selector: "edge:selected",
      style: {
        width: 5,
        "line-color": "#a855f7",
        "target-arrow-color": "#a855f7"
      },
    },
  ];

  const handleZoomIn = () => {
    if (cyRef.current) {
      cyRef.current.zoom({
        level: cyRef.current.zoom() * 1.2,
        renderedPosition: { x: cyRef.current.width() / 2, y: cyRef.current.height() / 2 }
      });
    }
  };

  const handleZoomOut = () => {
    if (cyRef.current) {
      cyRef.current.zoom({
        level: cyRef.current.zoom() / 1.2,
        renderedPosition: { x: cyRef.current.width() / 2, y: cyRef.current.height() / 2 }
      });
    }
  };

  const handleFit = () => {
    if (cyRef.current) {
      cyRef.current.fit(undefined, 40);
    }
  };

  return (
    <div className="w-full h-full min-h-[520px] bg-slate-950/90 rounded-2xl overflow-hidden border border-slate-800/80 shadow-2xl relative">
      <CytoscapeComponent
        elements={elements}
        stylesheet={stylesheet}
        style={{ width: "100%", height: "100%" }}
        layout={{ name: "preset" }}
        wheelSensitivity={0.15}
        minZoom={0.4}
        maxZoom={3.0}
        userZoomingEnabled={true}
        userPanningEnabled={true}
        boxSelectionEnabled={false}
        autoungrabify={false}
        autolock={false}
        cy={(cy) => {
          cyRef.current = cy;
          cy.on("tap", "node", (evt) => {
            onNodeSelect(evt.target.id());
          });
          cy.on("tap", "edge", (evt) => {
            onEdgeSelect(evt.target.id());
          });
          cy.on("tap", (evt) => {
            if (evt.target === cy) {
              onNodeSelect(null);
              onEdgeSelect(null);
            }
          });
        }}
      />

      {/* Canvas Interactive Controls Overlay */}
      <div className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-xl border border-slate-700/60 shadow-xl backdrop-blur-md z-20">
        <button
          onClick={handleZoomIn}
          title="Zoom In"
          className="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-200 transition"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          className="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-200 transition"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleFit}
          title="Fit View"
          className="p-2 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/30 transition flex items-center gap-1 text-xs font-semibold px-2.5"
        >
          <Maximize2 className="w-3.5 h-3.5" /> Fit Graph
        </button>
      </div>

      {/* Topology Legend */}
      <div className="absolute top-4 left-4 bg-slate-900/85 p-3.5 rounded-xl border border-slate-800 text-xs backdrop-blur-md shadow-xl z-20">
        <h4 className="font-extrabold text-slate-200 mb-2.5 tracking-wider uppercase text-[10px] flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400"></span> Topology Legend
        </h4>
        <div className="space-y-1.5 text-[11px]">
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-1 bg-slate-600 rounded-full"></div>
            <span className="text-slate-300">Operational Link</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
            <span className="text-emerald-300 font-bold">Active Route</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-1 bg-amber-500 rounded-full"></div>
            <span className="text-amber-300">Congested (&ge;85%)</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-[2px] bg-rose-500 border-t-2 border-dashed border-rose-500"></div>
            <span className="text-rose-400 font-semibold">Failed Link</span>
          </div>
        </div>
      </div>
    </div>
  );
};
