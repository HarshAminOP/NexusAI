"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { 
  MessageSquare, Trash2, Settings, Network, TerminalSquare, 
  PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, 
  Send, Bot, User, ChevronLeft, ChevronRight, Moon, Sun, Plus
} from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  thought?: string; 
}

// Animated thinking dots component
const ThinkingDots = () => {
  const dots = ["●", "●", "●"];
  const [activeIndex, setActiveIndex] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % dots.length);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-1">
      {dots.map((dot, idx) => (
        <span
          key={idx}
          className={`transition-all ${
            idx === activeIndex ? "opacity-100 scale-100" : "opacity-40 scale-75"
          }`}
        >
          {dot}
        </span>
      ))}
    </div>
  );
};

export default function NexusDashboard() {
  const [isMounted, setIsMounted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [isDark, setIsDark] = useState(true);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
    // Apply theme
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    const fetchHistory = async () => {
      try {
        const response = await fetch("http://localhost:8000/chat/history/test_session_1");
        if (response.ok) {
          const data = await response.json();
          setMessages(data.messages);
        }
      } catch (error) {
        console.error("Failed to load chat history:", error);
      }
    };
    fetchHistory();
  }, [isDark]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input;
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setInput("");
    setIsLoading(true);
    setMessages((prev) => [...prev, { role: "assistant", content: "", thought: "" }]);

    try {
      const response = await fetch("http://localhost:8000/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, thread_id: "test_session_1" }),
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
            try {
              const data = JSON.parse(jsonStr);
              console.log("Parsed stream data:", data);
              
              // Enhanced parsing to handle various response structures
              let newContent = "";
              let newThought = "";
              
              // Try different response structures
              if (data.messages && Array.isArray(data.messages) && data.messages.length > 0) {
                const lastMsg = data.messages[data.messages.length - 1];
                if (typeof lastMsg === 'object') {
                  newContent = lastMsg.content || lastMsg.message || JSON.stringify(lastMsg);
                } else {
                  newContent = String(lastMsg);
                }
              } else if (data.content) {
                newContent = data.content;
              } else if (data.message) {
                newContent = data.message;
              } else if (typeof data === 'string') {
                newContent = data;
              }
              
              // Extract thinking/reasoning if present
              if (newContent.includes("<think>")) {
                const splitParts = newContent.split("</think>");
                newThought = splitParts[0].replace("<think>", "").trim();
                newContent = splitParts[1] ? splitParts[1].trim() : newContent;
              }
              
              if (newContent) {
                setMessages((prev) => {
                  const newMessages = [...prev];
                  const lastIndex = newMessages.length - 1;
                  newMessages[lastIndex] = {
                    role: "assistant",
                    content: newMessages[lastIndex].content + newContent,
                    thought: newThought || newMessages[lastIndex].thought
                  };
                  return newMessages;
                });
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
        newMessages[newMessages.length - 1] = { role: "assistant", content: "Error connecting to NexusAI Brain." };
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isMounted) return null;

  const bgClass = isDark 
    ? "bg-gradient-to-br from-slate-900 via-slate-950 to-slate-950" 
    : "bg-gradient-to-br from-slate-50 via-white to-slate-100";
  
  const textClass = isDark ? "text-slate-50" : "text-slate-900";
  
  const sidebarBg = isDark
    ? "bg-gradient-to-b from-slate-900/95 to-slate-950 border-slate-800/50"
    : "bg-gradient-to-b from-white to-slate-50 border-slate-200/50";
  
  const headerBg = isDark
    ? "bg-gradient-to-r from-slate-900/50 to-slate-950/50 border-slate-800/50"
    : "bg-gradient-to-r from-slate-100/50 to-white/50 border-slate-200/50";
  
  const messageBubbleBg = isDark
    ? "bg-slate-800/60 border border-slate-700/50"
    : "bg-slate-100 border border-slate-200";
  
  const inputBg = isDark
    ? "bg-slate-900/60 border-slate-700/50"
    : "bg-slate-100 border-slate-300/50";

  return (
    <div className={`flex h-screen w-full ${bgClass} ${textClass} overflow-hidden`}>
      
      {/* ================= LEFT PANE ================= */}
      <aside 
        className={`relative transition-all duration-300 ease-in-out ${sidebarBg} backdrop-blur-md flex flex-col ${
          leftOpen ? "w-64" : "w-0"
        }`}
      >
        {/* Header with Close Button */}
        <div className={`p-4 flex items-center justify-between border-b ${headerBg} h-16 shrink-0 overflow-hidden`}>
          <div className="flex items-center gap-2">
            <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${isDark ? "from-blue-500 to-cyan-500" : "from-blue-600 to-cyan-600"} flex items-center justify-center`}>
              <Bot className="h-5 w-5 text-white" />
            </div>
            <h2 className={`font-bold text-base bg-gradient-to-r ${isDark ? "from-blue-400 to-cyan-400" : "from-blue-600 to-cyan-600"} bg-clip-text text-transparent`}>NexusAI</h2>
          </div>
          {leftOpen && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setLeftOpen(false)} 
              className={`h-8 w-8 ${isDark ? "hover:bg-slate-800/50" : "hover:bg-slate-200/50"} transition-colors`}
            >
              <PanelLeftClose className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* History Section */}
        <ScrollArea className="flex-1 overflow-hidden">
          <div className="p-4 space-y-3">
            {/* New Chat Button */}
            <Button 
              onClick={() => setMessages([])}
              className={`w-full justify-start gap-2 ${isDark ? "bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30" : "bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-300"} transition-all group`}
              variant="outline"
            >
              <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform" />
              New Chat
            </Button>
            
            <Separator className={isDark ? "bg-slate-800/30" : "bg-slate-300/30"} />
            
            <p className={`text-xs font-semibold ${isDark ? "text-slate-400" : "text-slate-500"} px-2 uppercase tracking-widest`}>Sessions</p>
            <div className={`flex items-center gap-3 px-3 py-3 text-sm rounded-lg ${isDark ? "bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-500/30 hover:border-blue-500/50" : "bg-gradient-to-r from-blue-100/50 to-cyan-100/50 border border-blue-300/50 hover:border-blue-400/50"} cursor-pointer transition-all group`}>
              <MessageSquare className={`h-4 w-4 ${isDark ? "text-blue-400 group-hover:text-blue-300" : "text-blue-600 group-hover:text-blue-700"} transition-colors`} />
              <span className={`truncate font-medium ${isDark ? "group-hover:text-blue-200" : "group-hover:text-blue-800"} transition-colors`}>test_session_1</span>
            </div>
            
            {/* Quick Actions */}
            <Separator className={isDark ? "my-4 bg-slate-800/30" : "my-4 bg-slate-300/30"} />
            <p className={`text-xs font-semibold ${isDark ? "text-slate-400" : "text-slate-500"} px-2 uppercase tracking-widest`}>Quick Actions</p>
            <div className="space-y-2">
              <Button 
                variant="ghost" 
                className={`w-full justify-start gap-2 ${isDark ? "text-slate-300 hover:text-blue-400 hover:bg-slate-800/50" : "text-slate-600 hover:text-blue-600 hover:bg-slate-200/50"} transition-all group`}
              >
                <Trash2 className="h-4 w-4 group-hover:scale-110 transition-transform" />
                Clear History
              </Button>
              <Button 
                variant="ghost" 
                className={`w-full justify-start gap-2 ${isDark ? "text-slate-300 hover:text-blue-400 hover:bg-slate-800/50" : "text-slate-600 hover:text-blue-600 hover:bg-slate-200/50"} transition-all group`}
              >
                <Settings className="h-4 w-4 group-hover:scale-110 transition-transform" />
                Settings
              </Button>
            </div>
          </div>
        </ScrollArea>
      </aside>

      {/* Toggle Button - Top Left (when collapsed) */}
      {!leftOpen && (
        <button 
          onClick={() => setLeftOpen(true)}
          className={`absolute left-0 top-4 z-50 p-2.5 ${isDark ? "bg-slate-900/90 border-slate-800/50 hover:bg-slate-800 hover:border-blue-500/50" : "bg-white/90 border-slate-200/50 hover:bg-slate-100 hover:border-blue-500/50"} backdrop-blur-sm border rounded-r-xl shadow-lg transition-all group`}
          title="Open sidebar"
        >
          <PanelLeftOpen className={`h-4 w-4 ${isDark ? "text-slate-400 group-hover:text-blue-400" : "text-slate-500 group-hover:text-blue-600"} transition-colors`} />
        </button>
      )}

      {/* ================= CENTER PANE ================= */}
      <main className="flex-1 flex flex-col min-w-0 h-full relative">
        {/* Header */}
        <header className={`h-16 border-b ${headerBg} backdrop-blur-sm flex items-center px-6 justify-between shrink-0 z-10`}>
          <div className="flex items-center gap-3">
            <div className={`h-2 w-2 rounded-full ${isDark ? "bg-green-500" : "bg-green-600"} animate-pulse`}></div>
            <h1 className={`font-semibold text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}>Active Architecture Session</h1>
          </div>
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsDark(!isDark)}
            className={`h-9 w-9 ${isDark ? "hover:bg-slate-800/50 text-slate-400 hover:text-yellow-400" : "hover:bg-slate-200/50 text-slate-600 hover:text-blue-600"} transition-all`}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </header>

        {/* Messages Area */}
        <div className={`flex-1 overflow-y-auto ${isDark ? "bg-gradient-to-b from-black/20 to-black/40" : "bg-gradient-to-b from-slate-100/50 to-slate-50"}`} ref={scrollRef}>
          <div className="max-w-3xl mx-auto space-y-6 p-6 md:p-10">
            {messages.length === 0 ? (
              <div className={`flex flex-col items-center justify-center h-[60vh] ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                <div className="relative mb-4">
                  <div className={`absolute inset-0 ${isDark ? "bg-gradient-to-r from-blue-600/20 to-cyan-600/20" : "bg-gradient-to-r from-blue-300/20 to-cyan-300/20"} rounded-full blur-2xl animate-pulse`}></div>
                  <Bot className={`h-16 w-16 relative ${isDark ? "text-slate-600" : "text-slate-400"}`} />
                </div>
                <p className="text-sm font-medium">Initializing NexusAI Brain...</p>
                <p className={`text-xs ${isDark ? "text-slate-600" : "text-slate-500"} mt-2`}>Ready for your queries</p>
              </div>
            ) : (
              messages.map((msg, index) => (
                <div 
                  key={index} 
                  className={`flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${isDark ? "from-blue-600 to-cyan-600" : "from-blue-500 to-cyan-500"} flex items-center justify-center shrink-0 shadow-lg ${isDark ? "shadow-blue-500/20" : "shadow-blue-400/30"} border ${isDark ? "border-blue-400/30" : "border-blue-300/50"}`}>
                      <Bot className="h-5 w-5 text-white" />
                    </div>
                  )}
                  
                  <div className={`flex flex-col gap-2 max-w-[75%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                    <div className={`p-4 rounded-2xl shadow-lg transition-all ${
                      msg.role === "user" 
                        ? isDark 
                          ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-blue-500/20" 
                          : "bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-blue-500/30"
                        : isDark
                        ? `${messageBubbleBg} text-slate-100 shadow-slate-950/40 hover:bg-slate-800/80`
                        : `${messageBubbleBg} text-slate-900 shadow-slate-200/40 hover:bg-slate-200`
                    }`}>
                      {msg.thought && (
                        <Accordion type="single" collapsible className="mb-4">
                          <AccordionItem value="thought" className={isDark ? "border-slate-700/30" : "border-slate-300/30"}>
                            <AccordionTrigger className={`py-1 text-[10px] uppercase tracking-tighter ${isDark ? "text-slate-400 hover:text-cyan-400" : "text-slate-500 hover:text-blue-600"} transition-colors`}>
                              💭 System Reasoning
                            </AccordionTrigger>
                            <AccordionContent className={`text-xs italic ${isDark ? "text-slate-300 bg-black/30 border border-slate-700/30" : "text-slate-700 bg-slate-100/50 border border-slate-200"} p-3 rounded-lg mt-2 font-mono leading-relaxed`}>
                              {msg.thought}
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      )}
                      <div className="whitespace-pre-wrap leading-relaxed text-sm">
                        {msg.content ? msg.content : (
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <span>Thinking</span>
                            <ThinkingDots />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {msg.role === "user" && (
                    <div className={`h-10 w-10 rounded-full ${isDark ? "bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600/50" : "bg-gradient-to-br from-slate-300 to-slate-400 border border-slate-400"} flex items-center justify-center shrink-0`}>
                      <User className={`h-5 w-5 ${isDark ? "text-slate-300" : "text-slate-700"}`} />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className={`p-4 border-t ${isDark ? "bg-gradient-to-t from-black/40 to-transparent border-slate-800/50" : "bg-gradient-to-t from-white/40 to-transparent border-slate-200/50"} shrink-0`}>
          <div className={`max-w-3xl mx-auto flex gap-3 items-center ${inputBg} backdrop-blur-sm p-1.5 rounded-2xl focus-within:ring-2 ${isDark ? "focus-within:ring-blue-500/40 focus-within:border-blue-500/50 shadow-lg shadow-blue-500/5" : "focus-within:ring-blue-400/40 focus-within:border-blue-500/50 shadow-lg shadow-blue-400/10"} transition-all`}>
            <Input 
              placeholder="Query the Graph Database..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()} 
              disabled={isLoading}
              className={`border-0 focus-visible:ring-0 shadow-none bg-transparent h-11 ${isDark ? "text-slate-100 placeholder-slate-500" : "text-slate-900 placeholder-slate-400"}`}
            />
            <Button 
              onClick={handleSend} 
              disabled={isLoading || !input.trim()} 
              size="icon" 
              className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all group"
            >
              <Send className="h-4 w-4 text-white group-hover:scale-110 transition-transform" />
            </Button>
          </div>
        </div>
      </main>

      {/* Toggle Button - Top Right (when collapsed) */}
      {!rightOpen && (
        <button 
          onClick={() => setRightOpen(true)}
          className={`absolute right-0 top-4 z-50 p-2.5 ${isDark ? "bg-slate-900/90 border-slate-800/50 hover:bg-slate-800 hover:border-cyan-500/50" : "bg-white/90 border-slate-200/50 hover:bg-slate-100 hover:border-cyan-500/50"} backdrop-blur-sm border rounded-l-xl shadow-lg transition-all group`}
          title="Open sidebar"
        >
          <PanelRightOpen className={`h-4 w-4 ${isDark ? "text-slate-400 group-hover:text-cyan-400" : "text-slate-500 group-hover:text-cyan-600"} transition-colors`} />
        </button>
      )}

      {/* ================= RIGHT PANE ================= */}
      <aside 
        className={`relative transition-all duration-300 ease-in-out ${sidebarBg} backdrop-blur-md flex flex-col ${
          rightOpen ? "w-80" : "w-0"
        }`}
      >
        {/* Header with Close Button */}
        <div className={`p-4 h-16 flex items-center justify-between border-b ${headerBg} shrink-0`}>
          <h2 className={`font-semibold text-sm bg-gradient-to-r ${isDark ? "from-cyan-400 to-blue-400" : "from-cyan-600 to-blue-600"} bg-clip-text text-transparent uppercase tracking-widest`}>Context</h2>
          {rightOpen && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setRightOpen(false)} 
              className={`h-8 w-8 ${isDark ? "hover:bg-slate-800/50" : "hover:bg-slate-200/50"} transition-colors`}
            >
              <PanelRightClose className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 overflow-hidden">
          <div className="p-6 space-y-8">
            {/* Graph Engine Section */}
            <div className="space-y-4">
              <div className={`flex items-center gap-2 ${isDark ? "text-cyan-400" : "text-cyan-600"}`}>
                <Network className="h-4 w-4" />
                <h3 className="font-bold text-[11px] uppercase tracking-tighter">Graph Engine</h3>
              </div>
              <Card className={`h-48 ${isDark ? "bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-dashed border-slate-700/50 hover:border-cyan-500/30" : "bg-gradient-to-br from-slate-200/40 to-slate-100/40 border-dashed border-slate-300/50 hover:border-cyan-400/50"} backdrop-blur-sm flex flex-col items-center justify-center transition-colors group`}>
                <div className="relative mb-3">
                  <div className={`absolute inset-0 ${isDark ? "bg-cyan-500/20 group-hover:bg-cyan-500/40" : "bg-cyan-400/20 group-hover:bg-cyan-400/40"} rounded-full blur-lg transition-colors`}></div>
                  <Network className={`h-8 w-8 relative ${isDark ? "opacity-40 group-hover:opacity-60" : "opacity-50 group-hover:opacity-70"} transition-opacity`} />
                </div>
                <p className={`text-[10px] text-center px-6 leading-relaxed font-mono ${isDark ? "text-slate-500" : "text-slate-600"}`}>
                  <span className={isDark ? "text-cyan-400" : "text-cyan-600"}>NEO4J_INSTANCE</span>
                  <br />
                  <span className={isDark ? "text-slate-400" : "text-slate-500"}>AWAITING_QUERIES</span>
                </p>
              </Card>
            </div>

            <Separator className={isDark ? "bg-slate-800/30" : "bg-slate-300/30"} />

            {/* Observability Section */}
            <div className="space-y-4">
              <div className={`flex items-center gap-2 ${isDark ? "text-blue-400" : "text-blue-600"}`}>
                <TerminalSquare className="h-4 w-4" />
                <h3 className="font-bold text-[11px] uppercase tracking-tighter">Observability</h3>
              </div>
              <Card className={`${isDark ? "bg-black/60 border border-slate-800/50 hover:border-blue-500/30" : "bg-white/60 border border-slate-200/50 hover:border-blue-400/30"} backdrop-blur-sm p-4 shadow-inner transition-colors`}>
                <div className={`font-mono text-[10px] space-y-2 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                  <p>{"[0.00]"} <span className={isDark ? "text-blue-400 font-semibold" : "text-blue-600 font-semibold"}>SYS_INIT</span></p>
                  <p>{"[0.01]"} <span className={isDark ? "text-green-400 font-semibold" : "text-green-600 font-semibold"}>MEMORY_MOUNTED</span></p>
                  <p>{"[0.02]"} <span className={isDark ? "text-cyan-400 font-semibold" : "text-cyan-600 font-semibold"}>GRAPH_CONNECTED</span></p>
                  {isLoading && (
                    <p className="animate-pulse">
                      {"[...] "} <span className={`uppercase tracking-tighter font-bold ${isDark ? "text-yellow-400 bg-yellow-400/20" : "text-yellow-600 bg-yellow-300/30"} px-1.5 py-0.5 rounded`}>Orchestrator_Think</span>
                    </p>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </ScrollArea>
      </aside>

    </div>
  );
}
