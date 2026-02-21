// frontend/lib/types.ts

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  thought?: string; // For R1 Reasoning
  node?: string;    // To track which agent is active
}

export interface ChatRequest {
  message: string;
  thread_id: string;
}