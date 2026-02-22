// hooks/useSessions.ts
// This custom hook manages chat sessions, including creating, deleting, renaming, and switching between sessions.
// It also handles fetching chat history for the active session.

import { useState, useEffect } from "react";
import { ChatSession, Message } from "../types";

export function useSessions() {
  // State for sessions and active session
  const [sessions, setSessions] = useState<ChatSession[]>([
    { id: "session_init_1", title: "Welcome to NexusAI" }
  ]);
  const [activeSessionId, setActiveSessionId] = useState<string>("session_init_1");
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [historyError, setHistoryError] = useState<string | null>(null);

  // Effect to fetch history when active session changes
  useEffect(() => {
    const fetchHistory = async () => {
      if (!activeSessionId) return;
      try {
        setHistoryError(null);
        const response = await fetch(`http://localhost:8000/chat/history/${activeSessionId}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setMessages(data.messages || []);
      } catch (error: any) {
        console.error("Failed to load chat history:", error);
        if (error.message === 'Failed to fetch') {
          setHistoryError("Backend offline: Unable to reach localhost:8000.");
        } else {
          setHistoryError(error.message);
        }
      }
    };
    fetchHistory();
  }, [activeSessionId]);

  // Handler to create a new chat session
  const handleNewChat = () => {
    const newId = `session_${Date.now()}`;
    setSessions([{ id: newId, title: "New Conversation" }, ...sessions]);
    setActiveSessionId(newId);
    setMessages([]);
  };

  // Handler to delete a session
  const handleDeleteSession = (e: React.MouseEvent, idToDelete: string) => {
    e.stopPropagation();
    const updatedSessions = sessions.filter(s => s.id !== idToDelete);
    setSessions(updatedSessions);
    if (activeSessionId === idToDelete) {
      if (updatedSessions.length > 0) {
        setActiveSessionId(updatedSessions[0].id);
      } else {
        handleNewChat();
      }
    }
  };

  // Handler to start renaming a session
  const handleRenameStart = (e: React.MouseEvent, session: ChatSession) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditTitle(session.title);
  };

  // Handler to save the renamed session
  const handleRenameSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editTitle.trim()) {
      setEditingSessionId(null);
      return;
    }
    setSessions(sessions.map(s => s.id === editingSessionId ? { ...s, title: editTitle.trim() } : s));
    setEditingSessionId(null);
  };

  // Handler to cancel renaming
  const handleRenameCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(null);
  };

  return {
    sessions,
    setSessions,
    activeSessionId,
    setActiveSessionId,
    editingSessionId,
    editTitle,
    setEditTitle,
    messages,
    setMessages,
    historyError,
    handleNewChat,
    handleDeleteSession,
    handleRenameStart,
    handleRenameSave,
    handleRenameCancel,
  };
}