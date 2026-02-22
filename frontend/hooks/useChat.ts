// hooks/useChat.ts
// This custom hook manages the chat functionality, including sending messages, handling streaming responses,
// and managing related states like loading, graph data, logs, and selected images.

import { useState, useEffect, useRef } from "react";
import { Message, LogEvent } from "../types";

export function useChat(activeSessionId: string, setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void, sessions: any[], setSessions: any) {
  // Chat input and loading state
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Real-time backend states
  const [graphData, setGraphData] = useState<{nodes: any[], links: any[]} | null>(null);
  const [graphWarning, setGraphWarning] = useState<string | null>(null);
  const [observabilityLogs, setObservabilityLogs] = useState<LogEvent[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Effect to scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [setMessages]);

  // Handler for sending a message and handling the streaming response
  const handleSend = async () => {
    if (!input.trim() || !activeSessionId) return;

    const userMsg = input;
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setInput("");
    setIsLoading(true);
    setGraphWarning(null);

    setMessages((prev) => [...prev, { role: "assistant", content: "", thought: "", images: [], sources: [] }]);
    setObservabilityLogs([{ id: Date.now().toString(), timestamp: new Date().toISOString().substring(11,19), step: "SYS_INIT", status: "INFO" }]);
    setGraphData(null);

    // Update title of "New Conversation" automatically based on first query
    const currentSession = sessions.find(s => s.id === activeSessionId);
    if (currentSession && currentSession.title === "New Conversation") {
      // Generate a meaningful title from the first few words of the query
      const words = userMsg.trim().split(/\s+/).slice(0, 4);
      let autoTitle = words.join(' ');
      if (userMsg.length > 30) {
        autoTitle = words.slice(0, 3).join(' ') + '...';
      }
      // Capitalize first letter
      autoTitle = autoTitle.charAt(0).toUpperCase() + autoTitle.slice(1);
      setSessions(sessions.map(s => s.id === activeSessionId ? { ...s, title: autoTitle } : s));
    }

    try {
      const response = await fetch("http://localhost:8000/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, thread_id: activeSessionId }),
      });

      if (!response.body) throw new Error("No stream found");

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() || "";

        for (const part of parts) {
          const dataLine = part.split("\n").find(line => line.startsWith("data: "));
          if (dataLine) {
            const jsonStr = dataLine.replace("data: ", "").trim();
            if (jsonStr === "[DONE]") break;

            try {
              const data = JSON.parse(jsonStr);

              if (data.type === "text" || !data.type) {
                let newContent = data.content || data.message || "";
                let newThought = "";

                if (newContent.includes("<think>")) {
                  const splitParts = newContent.split("</think>");
                  newThought = splitParts[0].replace("<think>", "").trim();
                  newContent = splitParts[1] ? splitParts[1].trim() : newContent;
                }

                if (newContent || newThought) {
                  setMessages((prev) => {
                    const newMsgs = [...prev];
                    const idx = newMsgs.length - 1;
                    newMsgs[idx] = { ...newMsgs[idx], content: newMsgs[idx].content + newContent, thought: newThought || newMsgs[idx].thought };
                    return newMsgs;
                  });
                }
              }
              else if (data.type === "graph" && data.payload) {
                const nodes = data.payload.nodes || [];
                const links = data.payload.links || [];

                if (nodes.length === 0) {
                  setGraphWarning("Zero connections found in Neo4j.");
                } else if (nodes.length > 50) {
                  setGraphData({ nodes: nodes.slice(0, 50), links: links });
                  setGraphWarning(`Graph optimized. Showing top 50 of ${nodes.length} nodes.`);
                } else {
                  setGraphData({ nodes, links });
                }
              }
              else if (data.type === "image" && data.url) {
                setMessages((prev) => {
                  const newMsgs = [...prev];
                  const idx = newMsgs.length - 1;
                  newMsgs[idx].images = [...(newMsgs[idx].images || []), data.url];
                  return newMsgs;
                });
              }
              else if (data.type === "sources" && data.payload) {
                setMessages((prev) => {
                  const newMsgs = [...prev];
                  const idx = newMsgs.length - 1;
                  newMsgs[idx].sources = data.payload;
                  return newMsgs;
                });
              }
              else if (data.type === "log") {
                setObservabilityLogs((prev) => [...prev, {
                  id: Date.now().toString() + Math.random(),
                  timestamp: new Date().toISOString().substring(11, 19),
                  step: data.step,
                  status: data.status || "INFO",
                  duration: data.duration
                }]);
              }
            } catch (e) {
              console.error("Error parsing stream chunk:", e);
            }
          }
        }
      }
    } catch (error) {
      console.error("Stream error:", error);
      setMessages((prev) => {
        const newMessages = [...prev];
        const lastIdx = newMessages.length - 1;
        newMessages[lastIdx] = { ...newMessages[lastIdx], isIncomplete: true };
        return newMessages;
      });
      setObservabilityLogs((prev) => [...prev, { id: "err", timestamp: new Date().toISOString().substring(11,19), step: "STREAM_INTERRUPTED", status: "ERROR" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    input,
    setInput,
    isLoading,
    graphData,
    setGraphData,
    graphWarning,
    setGraphWarning,
    observabilityLogs,
    setObservabilityLogs,
    selectedImage,
    setSelectedImage,
    scrollRef,
    handleSend,
  };
}