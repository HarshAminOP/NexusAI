// components/SessionList.tsx
// This component renders the list of chat sessions in the left sidebar.
// It allows users to select, rename, and delete sessions.

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { MessageSquare, Plus, Edit2, Check, X, Trash2, Settings, History } from "lucide-react";
import { SessionActionsMenu } from "./SessionActionsMenu";
import { ChatSession } from "../../types";

interface SessionListProps {
  sessions: ChatSession[];
  activeSessionId: string;
  setActiveSessionId: (id: string) => void;
  editingSessionId: string | null;
  editTitle: string;
  setEditTitle: (title: string) => void;
  handleNewChat: () => void;
  handleDeleteSession: (e: React.MouseEvent, id: string) => void;
  handleRenameStart: (e: React.MouseEvent, session: ChatSession) => void;
  handleRenameSave: (e: React.MouseEvent) => void;
  handleRenameCancel: (e: React.MouseEvent) => void;
  isDark: boolean;
}

export const SessionList: React.FC<SessionListProps> = ({
  sessions,
  activeSessionId,
  setActiveSessionId,
  editingSessionId,
  editTitle,
  setEditTitle,
  handleNewChat,
  handleDeleteSession,
  handleRenameStart,
  handleRenameSave,
  handleRenameCancel,
  isDark,
}) => {
  return (
    <ScrollArea className="flex-1 overflow-hidden">
      <div className="p-4 space-y-3">
        <Button
          onClick={handleNewChat}
          className={`w-full justify-start gap-2 ${isDark ? "bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30" : "bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-300"} transition-all group`}
          variant="outline"
        >
          <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform" />
          New Chat
        </Button>

        <Separator className={isDark ? "bg-slate-800/30" : "bg-slate-300/30"} />

        <p className={`text-xs font-semibold ${isDark ? "text-slate-400" : "text-slate-500"} px-2 uppercase tracking-widest`}>Sessions</p>

        {/* Dynamic Session List */}
        <div className={`space-y-1 max-h-80 overflow-y-auto scrollbar-thin ${isDark ? "scrollbar-thumb-slate-600/50 hover:scrollbar-thumb-slate-600/70" : "scrollbar-thumb-slate-400/50 hover:scrollbar-thumb-slate-400/70"} scrollbar-track-transparent`}>
          {sessions.map((session) => {
            const isActive = activeSessionId === session.id;
            const isEditing = editingSessionId === session.id;

            return (
              <div
                key={session.id}
                onClick={() => !isEditing && setActiveSessionId(session.id)}
                className={`group flex items-center justify-between px-3 py-2.5 text-sm rounded-lg cursor-pointer transition-all ${
                  isActive
                    ? (isDark ? "bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-500/30" : "bg-gradient-to-r from-blue-100/50 to-cyan-100/50 border border-blue-300/50")
                    : (isDark ? "hover:bg-slate-800/50 border border-transparent" : "hover:bg-slate-200/50 border border-transparent")
                }`}
              >
                {isEditing ? (
                  <div className="flex items-center w-full gap-2" onClick={e => e.stopPropagation()}>
                    <MessageSquare className={`h-4 w-4 shrink-0 ${isDark ? "text-blue-400" : "text-blue-600"}`} />
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleRenameSave(e as any)}
                      autoFocus
                      className={`h-7 text-xs px-2 py-0 border-0 focus-visible:ring-1 ${isDark ? "bg-slate-900 text-slate-200 focus-visible:ring-blue-500" : "bg-white text-slate-800 focus-visible:ring-blue-400"}`}
                    />
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={handleRenameSave} className={`p-1 rounded ${isDark ? "hover:bg-green-500/20 text-green-400" : "hover:bg-green-100 text-green-600"}`}><Check className="h-3 w-3" /></button>
                      <button onClick={handleRenameCancel} className={`p-1 rounded ${isDark ? "hover:bg-red-500/20 text-red-400" : "hover:bg-red-100 text-red-600"}`}><X className="h-3 w-3" /></button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 overflow-hidden min-w-0 flex-1">
                      <MessageSquare className={`h-4 w-4 shrink-0 ${isActive ? (isDark ? "text-blue-400" : "text-blue-600") : (isDark ? "text-slate-500 group-hover:text-slate-400" : "text-slate-400 group-hover:text-slate-500")} transition-colors`} />
                      <span className={`truncate font-medium ${isActive ? (isDark ? "text-blue-200" : "text-blue-800") : (isDark ? "text-slate-300 group-hover:text-slate-200" : "text-slate-600 group-hover:text-slate-800")} transition-colors`}>
                        {session.title}
                      </span>
                    </div>
                    <div className={`flex items-center gap-1 shrink-0 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      <SessionActionsMenu
                        onRename={(e) => handleRenameStart(e, session)}
                        onDelete={(e) => handleDeleteSession(e, session.id)}
                        isDark={isDark}
                      />
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        <Separator className={isDark ? "my-4 bg-slate-800/30" : "my-4 bg-slate-300/30"} />
        <p className={`text-xs font-semibold ${isDark ? "text-slate-400" : "text-slate-500"} px-2 uppercase tracking-widest`}>Quick Actions</p>
        <div className="space-y-2">
          <Button variant="ghost" className={`w-full justify-start gap-2 ${isDark ? "text-slate-300 hover:text-blue-400 hover:bg-slate-800/50" : "text-slate-600 hover:text-blue-600 hover:bg-slate-200/50"} transition-all group`}>
            <History className="h-4 w-4 group-hover:scale-110 transition-transform" /> Session History
          </Button>
          <Button variant="ghost" className={`w-full justify-start gap-2 ${isDark ? "text-slate-300 hover:text-blue-400 hover:bg-slate-800/50" : "text-slate-600 hover:text-blue-600 hover:bg-slate-200/50"} transition-all group`}>
            <Settings className="h-4 w-4 group-hover:scale-110 transition-transform" /> Settings
          </Button>
        </div>
      </div>
    </ScrollArea>
  );
};