// types.ts - Definizione dei tipi utilizzati nell'applicazione

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  model: string;
  timestamp: number;
}

export type OpenAIModel = "gpt-3.5-turbo" | "gpt-4" | "gpt-4-turbo";
