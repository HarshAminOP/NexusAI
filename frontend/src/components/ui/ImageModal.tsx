"use client";

import React from "react";
import { X, ZoomIn } from "lucide-react";

interface ImageModalProps {
  url: string;
  alt?: string;
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
}

export default function ImageModal({ url, alt = "Retrieved document", isOpen, onClose, isDark }: ImageModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 transition-opacity ${isDark ? "bg-black/80" : "bg-slate-900/60"} backdrop-blur-sm`}
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className={`relative z-10 max-w-5xl w-full max-h-[90vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl ${isDark ? "bg-slate-900 border border-slate-700" : "bg-white border border-slate-200"}`}>
        <div className={`flex justify-between items-center p-4 border-b ${isDark ? "border-slate-800" : "border-slate-100"}`}>
          <div className="flex items-center gap-2">
            <ZoomIn className={`h-4 w-4 ${isDark ? "text-slate-400" : "text-slate-500"}`} />
            <h3 className={`text-sm font-medium ${isDark ? "text-slate-200" : "text-slate-800"}`}>Document Viewer</h3>
          </div>
          <button 
            onClick={onClose}
            className={`p-1 rounded-md transition-colors ${isDark ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-500"}`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-black/5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={url} 
            alt={alt} 
            className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-sm"
          />
        </div>
      </div>
    </div>
  );
}