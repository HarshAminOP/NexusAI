// components/ChatMessage.tsx
// This component renders an individual chat message, including user and assistant messages.
// It handles displaying text, thoughts, images, sources, and incomplete status.

import React from "react";
import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { Bot, User, Image as ImageIcon, Link as LinkIcon, AlertTriangle } from "lucide-react";
import { Message } from "../../types";
import { ThinkingDots } from "./ThinkingDots";

interface ChatMessageProps {
  message: Message;
  isDark: boolean;
  setSelectedImage: (url: string | null) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, isDark, setSelectedImage }) => {
  return (
    <div className={`flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300 ${message.role === "user" ? "justify-end" : "justify-start"}`}>

      {message.role === "assistant" && (
        <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${isDark ? "from-blue-600 to-cyan-600" : "from-blue-500 to-cyan-500"} flex items-center justify-center shrink-0 shadow-lg ${isDark ? "shadow-blue-500/20" : "shadow-blue-400/30"} border ${isDark ? "border-blue-400/30" : "border-blue-300/50"}`}>
          <Bot className="h-5 w-5 text-white" />
        </div>
      )}

      <div className={`flex flex-col gap-2 max-w-[75%] ${message.role === "user" ? "items-end" : "items-start"}`}>
        <div className={`p-4 rounded-2xl shadow-lg transition-all ${message.role === "user" ? (isDark ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-blue-500/20" : "bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-blue-500/30") : (isDark ? "bg-slate-800/60 border border-slate-700/50 text-slate-100 shadow-slate-950/40" : "bg-slate-100 border border-slate-200 text-slate-900 shadow-slate-200/40")}`}>

          {message.thought && (
            <Accordion type="single" collapsible className="mb-4">
              <AccordionItem value="thought" className={isDark ? "border-slate-700/30" : "border-slate-300/30"}>
                <AccordionTrigger className={`py-1 text-[10px] uppercase tracking-tighter ${isDark ? "text-slate-400 hover:text-cyan-400" : "text-slate-500 hover:text-blue-600"} transition-colors`}>💭 System Reasoning</AccordionTrigger>
                <AccordionContent className={`text-xs italic p-3 rounded-lg mt-2 font-mono leading-relaxed ${isDark ? "text-slate-300 bg-black/30 border border-slate-700/30" : "text-slate-700 bg-slate-100/50 border border-slate-200"}`}>
                  {message.thought}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}

          {message.images && message.images.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {message.images.map((imgUrl, i) => (
                <div key={i} className="relative group cursor-pointer" onClick={() => setSelectedImage(imgUrl)}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imgUrl} alt="Generated visual" className={`h-32 w-48 object-cover rounded-lg border ${isDark ? "border-slate-700 group-hover:border-cyan-500" : "border-slate-300 group-hover:border-cyan-600"} transition-all`} />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-lg transition-opacity">
                    <ImageIcon className="h-6 w-6 text-white" />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="whitespace-pre-wrap leading-relaxed text-sm">
            {message.content ? message.content : <div className="flex items-center gap-2 text-sm font-medium"><span>Thinking</span><ThinkingDots /></div>}
          </div>

          {message.sources && message.sources.length > 0 && (
            <div className={`mt-4 pt-3 border-t flex flex-wrap gap-2 ${isDark ? "border-slate-700/50" : "border-slate-300/50"}`}>
              {message.sources.map((src, i) => (
                <div key={i} className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium border transition-colors cursor-pointer ${isDark ? "bg-slate-900/50 border-slate-700 text-slate-300 hover:border-blue-500/50 hover:text-blue-400" : "bg-white border-slate-200 text-slate-600 hover:border-blue-400/50 hover:text-blue-600"}`}>
                  <LinkIcon className="h-3 w-3" />
                  {src.title}
                </div>
              ))}
            </div>
          )}

          {message.isIncomplete && (
            <div className={`mt-3 flex items-center gap-2 text-xs font-semibold p-2 rounded ${isDark ? "text-red-400 bg-red-900/20 border border-red-900/50" : "text-red-600 bg-red-50 border border-red-200"}`}>
              <AlertTriangle className="h-4 w-4" /> Stream Disconnected Unexpectedly
            </div>
          )}

        </div>
      </div>

      {message.role === "user" && (
        <div className={`h-10 w-10 rounded-full ${isDark ? "bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600/50" : "bg-gradient-to-br from-slate-300 to-slate-400 border border-slate-400"} flex items-center justify-center shrink-0`}>
          <User className={`h-5 w-5 ${isDark ? "text-slate-300" : "text-slate-700"}`} />
        </div>
      )}
    </div>
  );
};