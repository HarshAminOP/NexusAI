// components/ObservabilityPanel.tsx
// This component renders the observability logs panel in the right sidebar.
// It displays real-time logs from the backend processing.

import React from "react";
import { Card } from "@/components/ui/card";
import { Activity, TerminalSquare } from "lucide-react";
import { LogEvent } from "../../types";

interface ObservabilityPanelProps {
  observabilityLogs: LogEvent[];
  isLoading: boolean;
  isDark: boolean;
}

export const ObservabilityPanel: React.FC<ObservabilityPanelProps> = ({ observabilityLogs, isLoading, isDark }) => {
  return (
    <div className="space-y-4">
      <div className={`flex items-center gap-2 ${isDark ? "text-blue-400" : "text-blue-600"}`}>
        <Activity className="h-4 w-4" />
        <h3 className="font-bold text-[11px] uppercase tracking-tighter">System Traces</h3>
      </div>
      <Card className={`${isDark ? "bg-black/60 border border-slate-800/50 hover:border-blue-500/30" : "bg-white/60 border border-slate-200/50 hover:border-blue-400/30"} backdrop-blur-sm p-4 shadow-inner transition-colors`}>
        <div className={`font-mono text-[10px] space-y-2 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
          {observabilityLogs.length === 0 && !isLoading && (
            <p className="opacity-50">Query processing traces will appear here during analysis.</p>
          )}
          {observabilityLogs.map((log) => (
            <p key={log.id}>
              <span className="opacity-50">[{log.timestamp}]</span>{" "}
              <span className={`font-semibold ${
                log.status === "SUCCESS" ? (isDark ? "text-green-400" : "text-green-600") :
                log.status === "ERROR" ? (isDark ? "text-red-400" : "text-red-600") :
                log.status === "WARNING" ? (isDark ? "text-yellow-400" : "text-yellow-600") :
                (isDark ? "text-blue-400" : "text-blue-600")
              }`}>
                {log.step}
              </span>
              {log.duration && <span className="opacity-50 ml-2">({log.duration})</span>}
            </p>
          ))}
          {isLoading && (
            <p className="animate-pulse">
              <span className="opacity-50">[{new Date().toISOString().substring(11, 19)}]</span>{" "}
              <span className={`uppercase tracking-tighter font-bold ${isDark ? "text-yellow-400 bg-yellow-400/20" : "text-yellow-600 bg-yellow-300/30"} px-1.5 py-0.5 rounded`}>AI_Reasoning</span>
            </p>
          )}
        </div>
      </Card>
    </div>
  );
};