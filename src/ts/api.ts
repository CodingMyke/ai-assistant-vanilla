// api.ts - Gestione delle chiamate API a OpenAI

import type { Message } from "./types";

// In un'applicazione reale, questa chiave dovrebbe essere gestita lato server
// per motivi di sicurezza. Qui la prendiamo dall'ambiente per semplicità.
const API_KEY = import.meta.env.VITE_OPENAI_API_KEY || "";

interface OpenAIMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface OpenAIResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

export async function getAIResponse(messages: Message[]): Promise<string> {
  try {
    // Converti i messaggi nel formato richiesto da OpenAI
    const openAIMessages: OpenAIMessage[] = [
      {
        role: "system",
        content:
          "Sei un assistente virtuale AI utile, rispettoso e onesto. Rispondi alle domande dell'utente in modo chiaro e conciso.",
      },
      ...messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    ];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: openAIMessages,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Errore API OpenAI: ${errorData.error?.message || response.statusText}`
      );
    }

    const data: OpenAIResponse = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Errore nella chiamata API:", error);
    throw error;
  }
}
