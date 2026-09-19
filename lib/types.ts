export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  /** Set when the assistant turn failed; excluded from the history sent to the API. */
  error?: boolean;
}

export interface Conversation {
  id: string;
  title: string; // first 40 chars of the first user message
  messages: ChatMessage[];
  createdAt: number;
}
