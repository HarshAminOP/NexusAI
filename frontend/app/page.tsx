"use client";

// Main dashboard component for NexusAI, a chat interface with graph visualization and observability.
// This component integrates multiple sub-components and custom hooks for modularity.

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  PanelLeftOpen, PanelRightOpen,
  Send, Bot, Moon, Sun, TerminalSquare, ChevronLeft, ChevronRight, Menu, BarChart3, X
} from "lucide-react";
import ImageModal from "@/components/ui/ImageModal";

// Import custom hooks
import { useLayout } from "../hooks/useLayout";
import { useSessions } from "../hooks/useSessions";
import { useChat } from "../hooks/useChat";

// Import sub-components
import { SessionList } from "../src/components/SessionList";
import { ChatMessage } from "../src/components/ChatMessage";
import { GraphPanel } from "../src/components/GraphPanel";
import { ObservabilityPanel } from "../src/components/ObservabilityPanel";
import { NexusLogo } from "../src/components/NexusLogo";

export default function NexusDashboard() {
  // State to ensure component is mounted (for SSR compatibility)
  const [isMounted, setIsMounted] = useState(false);

  // Use custom hooks for state management
  const layout = useLayout();
  const sessions = useSessions();
  const chat = useChat(sessions.activeSessionId, sessions.setMessages, sessions.sessions, sessions.setSessions);

  // Effect to set mounted state
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Prevent rendering on server-side
  if (!isMounted) return null;

  // Dynamic class names based on theme
  const bgClass = layout.isDark ? "bg-gradient-to-br from-slate-900 via-slate-950 to-slate-950" : "bg-gradient-to-br from-slate-50 via-white to-slate-100";
  const textClass = layout.isDark ? "text-slate-50" : "text-slate-900";
  const sidebarBg = layout.isDark ? "bg-gradient-to-b from-slate-900/95 to-slate-950 border-slate-800/50" : "bg-gradient-to-b from-white to-slate-50 border-slate-200/50";
  const headerBg = layout.isDark ? "bg-gradient-to-r from-slate-900/50 to-slate-950/50 border-slate-800/50" : "bg-gradient-to-r from-slate-100/50 to-white/50 border-slate-200/50";
  const inputBg = layout.isDark ? "bg-slate-900/60 border-slate-700/50" : "bg-slate-100 border-slate-300/50";

  return (
    <div className={`flex h-screen w-full ${bgClass} ${textClass} overflow-hidden`}>

      {/* Image Modal for displaying selected images */}
      <ImageModal url={chat.selectedImage || ""} isOpen={!!chat.selectedImage} onClose={() => chat.setSelectedImage(null)} isDark={layout.isDark} />

      {/* ================= LEFT PANE ================= */}
      <aside className={`relative transition-all duration-300 ease-in-out ${sidebarBg} backdrop-blur-md flex flex-col ${layout.leftOpen ? "w-64" : "w-0"}`}>
        <div className={`p-4 flex items-center justify-between border-b ${headerBg} h-16 shrink-0 overflow-hidden`}>
          <div className="flex items-center gap-2">
            <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${layout.isDark ? "from-blue-500 to-cyan-500" : "from-blue-600 to-cyan-600"} flex items-center justify-center`}>
              <NexusLogo className="h-5 w-5 text-white" size={20} />
            </div>
            <h2 className={`font-bold text-base bg-gradient-to-r ${layout.isDark ? "from-blue-400 to-cyan-400" : "from-blue-600 to-cyan-600"} bg-clip-text text-transparent`}>NexusAI</h2>
          </div>
          {layout.leftOpen && (
            <Button variant="ghost" size="icon" onClick={() => layout.setLeftOpen(false)} className={`h-8 w-8 ${layout.isDark ? "hover:bg-slate-800/50" : "hover:bg-slate-200/50"} transition-colors`}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Session List Component */}
        <SessionList
          sessions={sessions.sessions}
          activeSessionId={sessions.activeSessionId}
          setActiveSessionId={sessions.setActiveSessionId}
          editingSessionId={sessions.editingSessionId}
          editTitle={sessions.editTitle}
          setEditTitle={sessions.setEditTitle}
          handleNewChat={sessions.handleNewChat}
          handleDeleteSession={sessions.handleDeleteSession}
          handleRenameStart={sessions.handleRenameStart}
          handleRenameSave={sessions.handleRenameSave}
          handleRenameCancel={sessions.handleRenameCancel}
          isDark={layout.isDark}
        />
      </aside>

      {/* ================= CENTER PANE ================= */}
      <main className="flex-1 flex flex-col min-w-0 h-full relative">
        <header className={`h-16 border-b ${headerBg} backdrop-blur-sm flex items-center justify-start px-4 md:px-6 gap-4 shrink-0 z-10 relative`}>
          <div className="flex items-center gap-2 shrink-0">
            {/* Left pane toggle button - positioned like hamburger menu */}
            {!layout.leftOpen && (
              <button onClick={() => layout.setLeftOpen(true)} className={`p-2 rounded-md ${layout.isDark ? "hover:bg-slate-800/50 text-slate-400 hover:text-blue-400" : "hover:bg-slate-200/50 text-slate-500 hover:text-blue-600"} transition-colors`} title="Open sessions panel">
                <Menu className="h-4 w-4" />
              </button>
            )}
            {/* Logo and app name - only visible when left pane is closed */}
            {!layout.leftOpen && (
              <>
                <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${layout.isDark ? "from-blue-500 to-cyan-500" : "from-blue-600 to-cyan-600"} flex items-center justify-center`}>
                  <NexusLogo className="h-5 w-5 text-white" size={20} />
                </div>
                <h2 className={`font-bold text-base bg-gradient-to-r ${layout.isDark ? "from-blue-400 to-cyan-400" : "from-blue-600 to-cyan-600"} bg-clip-text text-transparent`}>NexusAI</h2>
              </>
            )}
            {/* Active session indicator - always visible */}
            <div className={`h-2 w-2 rounded-full ${layout.isDark ? "bg-green-500" : "bg-green-600"} animate-pulse shrink-0`}></div>
            <h1 className={`font-semibold text-sm ${layout.isDark ? "text-slate-300" : "text-slate-600"}`}>Active Session</h1>
          </div>

          {/* Spacer to push right elements */}
          <div className="flex-1" />

          <div className="flex items-center gap-2 shrink-0">
            {/* Right pane toggle button - positioned like hamburger menu */}
            {!layout.rightOpen && (
              <button onClick={() => layout.setRightOpen(true)} className={`p-2 rounded-md ${layout.isDark ? "hover:bg-slate-800/50 text-slate-400 hover:text-cyan-400" : "hover:bg-slate-200/50 text-slate-500 hover:text-cyan-600"} transition-colors`} title="Open analysis panel">
                <BarChart3 className="h-4 w-4" />
              </button>
            )}
            <Button variant="ghost" size="icon" onClick={() => layout.setIsDark(!layout.isDark)} className={`h-9 w-9 ${layout.isDark ? "hover:bg-slate-800/50 text-slate-400 hover:text-yellow-400" : "hover:bg-slate-200/50 text-slate-600 hover:text-blue-600"} transition-all`}>
              {layout.isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </header>

        <div className={`flex-1 overflow-y-auto scrollbar-thin ${layout.isDark ? "scrollbar-thumb-slate-600/50 hover:scrollbar-thumb-slate-600/70" : "scrollbar-thumb-slate-400/50 hover:scrollbar-thumb-slate-400/70"} scrollbar-track-transparent ${layout.isDark ? "bg-gradient-to-b from-black/20 to-black/40" : "bg-gradient-to-b from-slate-100/50 to-slate-50"}`} ref={chat.scrollRef}>
          <div className="max-w-3xl mx-auto space-y-6 p-6 md:p-10">

            {/* Display history error if any */}
            {sessions.historyError && (
              <div className={`p-4 rounded-lg flex gap-3 text-sm items-center border ${layout.isDark ? "bg-red-900/20 border-red-900/50 text-red-400" : "bg-red-50 border-red-200 text-red-600"}`}>
                <TerminalSquare className="h-5 w-5 shrink-0" />
                <p>{sessions.historyError}</p>
              </div>
            )}

            {/* Chat messages or initial state */}
            {sessions.messages.length === 0 ? (
              <div className={`flex flex-col items-center justify-center h-[60vh] ${layout.isDark ? "text-slate-500" : "text-slate-400"}`}>
                <div className="relative mb-4">
                  <div className={`absolute inset-0 ${layout.isDark ? "bg-gradient-to-r from-blue-600/20 to-cyan-600/20" : "bg-gradient-to-r from-blue-300/20 to-cyan-300/20"} rounded-full blur-2xl animate-pulse`}></div>
                  <NexusLogo className={`h-16 w-16 relative ${layout.isDark ? "text-slate-600" : "text-slate-400"}`} size={64} />
                </div>
                <p className="text-sm font-medium">Welcome to NexusAI</p>
                <p className={`text-xs ${layout.isDark ? "text-slate-600" : "text-slate-500"} mt-2`}>Start a conversation to explore your knowledge graph</p>
              </div>
            ) : (
              sessions.messages.map((msg, index) => (
                <ChatMessage key={index} message={msg} isDark={layout.isDark} setSelectedImage={chat.setSelectedImage} />
              ))
            )}
          </div>
        </div>

        {/* Input area */}
        <div className={`p-4 border-t ${layout.isDark ? "bg-gradient-to-t from-black/40 to-transparent border-slate-800/50" : "bg-gradient-to-t from-white/40 to-transparent border-slate-200/50"} shrink-0`}>
          <div className={`max-w-3xl mx-auto flex gap-3 items-center ${inputBg} backdrop-blur-sm p-1.5 rounded-2xl focus-within:ring-2 ${layout.isDark ? "focus-within:ring-blue-500/40 focus-within:border-blue-500/50 shadow-lg shadow-blue-500/5" : "focus-within:ring-blue-400/40 focus-within:border-blue-500/50 shadow-lg shadow-blue-400/10"} transition-all`}>
            <Input
              placeholder="Ask about graph relationships, node properties, or complex data patterns..."
              value={chat.input}
              onChange={(e) => chat.setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && chat.handleSend()}
              disabled={chat.isLoading || !sessions.activeSessionId}
              className={`border-0 focus-visible:ring-0 shadow-none bg-transparent h-11 ${layout.isDark ? "text-slate-100 placeholder-slate-500" : "text-slate-900 placeholder-slate-400"}`}
            />
            <Button onClick={chat.handleSend} disabled={chat.isLoading || !chat.input.trim() || !sessions.activeSessionId} size="icon" className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all group">
              <Send className="h-4 w-4 text-white group-hover:scale-110 transition-transform" />
            </Button>
          </div>
        </div>
      </main>

      {/* ================= RIGHT PANE ================= */}
      {layout.rightOpen && <div onMouseDown={layout.handleMouseDownRight} className={`w-1 cursor-col-resize z-50 shrink-0 transition-colors ${layout.isDark ? "bg-slate-800 hover:bg-cyan-500/50 active:bg-cyan-500" : "bg-slate-200 hover:bg-cyan-500/50 active:bg-cyan-500"}`} title="Drag to resize" />}

      <aside style={{ width: layout.rightOpen ? `${layout.rightWidth}px` : "0px" }} className={`relative ${!layout.rightOpen ? "transition-[width] duration-300 ease-in-out" : ""} ${sidebarBg} backdrop-blur-md flex flex-col overflow-hidden shrink-0`}>
        <div className={`p-4 h-16 flex items-center justify-between border-b ${headerBg} shrink-0`}>
          <h2 className={`font-semibold text-sm bg-gradient-to-r ${layout.isDark ? "from-cyan-400 to-blue-400" : "from-cyan-600 to-blue-600"} bg-clip-text text-transparent uppercase tracking-widest`}>Analysis Panel</h2>
          {layout.rightOpen && (
            <Button variant="ghost" size="icon" onClick={() => layout.setRightOpen(false)} className={`h-8 w-8 ${layout.isDark ? "hover:bg-slate-800/50" : "hover:bg-slate-200/50"} transition-colors`}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <ScrollArea className="flex-1 overflow-hidden">
          <div className="p-6 space-y-8 min-w-[250px]">

            {/* Graph Panel Component */}
            <GraphPanel graphData={chat.graphData} graphWarning={chat.graphWarning} isDark={layout.isDark} />

            <Separator className={layout.isDark ? "bg-slate-800/30" : "bg-slate-300/30"} />

            {/* Observability Panel Component */}
            <ObservabilityPanel observabilityLogs={chat.observabilityLogs} isLoading={chat.isLoading} isDark={layout.isDark} />
          </div>
        </ScrollArea>
      </aside>

    </div>
  );
}