// types/index.ts
// This file defines all the TypeScript interfaces and types used across the application.
// It helps ensure type safety and makes the code more maintainable by centralizing type definitions.

export interface Source {
  id: string;
  title: string;
  type: string;
}

export interface LogEvent {
  id: string;
  timestamp: string;
  step: string;
  status: "INFO" | "SUCCESS" | "WARNING" | "ERROR";
  duration?: string;
}

export interface Message {
  role: "user" | "assistant";
  content: string;
  thought?: string;
  images?: string[];
  sources?: Source[];
  isIncomplete?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
}