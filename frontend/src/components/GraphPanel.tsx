// components/GraphPanel.tsx
// This component renders the graph visualization panel in the right sidebar.
// It displays the graph data using the GraphVisualizer component and shows warnings if applicable.

import React from "react";
import { Card } from "@/components/ui/card";
import { Database, Network } from "lucide-react";
import dynamic from "next/dynamic";

// Dynamic import for GraphVisualizer to avoid SSR issues
const GraphVisualizer = dynamic(() => import("@/components/ui/GraphVisualizer"), {
  ssr: false,
  loading: () => (
    <div className="h-48 w-full flex items-center justify-center text-xs text-slate-500 animate-pulse">
      Initializing Graph Visualization...
    </div>
  )
});

interface GraphPanelProps {
  graphData: { nodes: any[], links: any[] } | null;
  graphWarning: string | null;
  isDark: boolean;
}

export const GraphPanel: React.FC<GraphPanelProps> = ({ graphData, graphWarning, isDark }) => {
  return (
    <div className="space-y-4">
      <div className={`flex items-center gap-2 ${isDark ? "text-cyan-400" : "text-cyan-600"}`}>
        <Database className="h-4 w-4" />
        <h3 className="font-bold text-[11px] uppercase tracking-tighter">Knowledge Graph</h3>
      </div>

      <Card className={`relative overflow-hidden ${isDark ? "bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50" : "bg-gradient-to-br from-slate-200/40 to-slate-100/40 border-slate-300/50"} backdrop-blur-sm transition-colors group`}>
        {graphData ? (
          <div className="flex flex-col">
            <div className="h-48 w-full cursor-grab active:cursor-grabbing">
              <GraphVisualizer data={graphData} isDark={isDark} />
            </div>
            {graphWarning && (
              <div className={`px-3 py-1.5 text-[10px] text-center border-t font-medium ${isDark ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-500" : "bg-yellow-50 border-yellow-200 text-yellow-700"}`}>
                {graphWarning}
              </div>
            )}
          </div>
        ) : (
          <div className="h-48 flex flex-col items-center justify-center border-dashed border-2 border-transparent">
            <div className="relative mb-3">
              <div className={`absolute inset-0 ${isDark ? "bg-cyan-500/20 group-hover:bg-cyan-500/40" : "bg-cyan-400/20 group-hover:bg-cyan-400/40"} rounded-full blur-lg transition-colors`}></div>
              <Network className={`h-8 w-8 relative ${isDark ? "opacity-40 group-hover:opacity-60" : "opacity-50 group-hover:opacity-70"} transition-opacity`} />
            </div>
            <p className={`text-[10px] text-center px-6 leading-relaxed font-mono ${isDark ? "text-slate-500" : "text-slate-600"}`}>
              <span className={isDark ? "text-cyan-400" : "text-cyan-600"}>GRAPH_DATABASE</span><br />
              {graphWarning ? (
                 <span className={isDark ? "text-yellow-500" : "text-yellow-600"}>{graphWarning}</span>
              ) : (
                 <span className={isDark ? "text-slate-400" : "text-slate-500"}>WAITING_FOR_QUERY_RESULTS</span>
              )}
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};