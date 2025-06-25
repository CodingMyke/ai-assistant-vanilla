// ui.ts - Gestione dell'interfaccia utente

import type { Chat, Message, OpenAIModel } from "./types";

// Funzione per creare un elemento messaggio
export function createMessageElement(message: Message): HTMLDivElement {
  const messageEl = document.createElement("div");
  messageEl.classList.add("message");
  messageEl.classList.add(
    message.role === "user" ? "user-message" : "ai-message"
  );

  // Per i messaggi dell'assistente, convertiamo il markdown in HTML
  if (message.role === "assistant") {
    // Implementazione semplificata, in un'app reale si userebbe una libreria come marked.js
    const formattedContent = message.content
      .replace(/```(\w*)(\n[\s\S]*?\n)```/g, "<pre><code>$2</code></pre>")
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\n/g, "<br>");

    messageEl.innerHTML = formattedContent;
  } else {
    messageEl.textContent = message.content;
  }

  return messageEl;
}

// Funzione per creare un elemento di caricamento
export function createLoadingElement(): HTMLDivElement {
  const loadingEl = document.createElement("div");
  loadingEl.classList.add("loading");

  const dotsContainer = document.createElement("div");
  dotsContainer.classList.add("loading-dots");

  for (let i = 0; i < 3; i++) {
    const dot = document.createElement("span");
    dotsContainer.appendChild(dot);
  }

  loadingEl.appendChild(document.createTextNode("L'AI sta pensando"));
  loadingEl.appendChild(dotsContainer);

  return loadingEl;
}

// Funzione per creare un elemento della cronologia chat
export function createChatHistoryItem(
  chat: Chat,
  isActive: boolean = false
): HTMLDivElement {
  const chatEl = document.createElement("div");
  chatEl.classList.add("chat-item");
  if (isActive) chatEl.classList.add("active");
  chatEl.dataset.id = chat.id;

  // Mostra il titolo o la prima domanda come titolo della chat
  const firstUserMessage = chat.messages.find((msg) => msg.role === "user");
  chatEl.textContent =
    chat.title ||
    (firstUserMessage
      ? firstUserMessage.content.substring(0, 30) + "..."
      : "Nuova chat");

  return chatEl;
}

// Funzione per aggiornare la visualizzazione dei messaggi
export function updateMessagesView(
  messages: Message[],
  container: HTMLElement
): void {
  container.innerHTML = "";

  if (messages.length === 0) {
    const welcomeEl = document.createElement("div");
    welcomeEl.classList.add("welcome-message");

    const welcomeTitle = document.createElement("h2");
    welcomeTitle.textContent = "Benvenuto nell'Assistente Virtuale AI";

    const welcomeText = document.createElement("p");
    welcomeText.textContent =
      "Chiedimi qualsiasi cosa e ti risponderò utilizzando l'intelligenza artificiale.";

    welcomeEl.appendChild(welcomeTitle);
    welcomeEl.appendChild(welcomeText);
    container.appendChild(welcomeEl);
    return;
  }

  messages.forEach((message) => {
    const messageEl = createMessageElement(message);
    container.appendChild(messageEl);
  });

  // Scroll to bottom
  container.scrollTop = container.scrollHeight;
}

// Funzione per aggiornare la cronologia delle chat
export function updateChatHistory(
  chats: Chat[],
  container: HTMLElement,
  activeId?: string
): void {
  container.innerHTML = "";

  // Ordina le chat per timestamp (più recenti prima)
  const sortedChats = [...chats].sort((a, b) => b.timestamp - a.timestamp);

  sortedChats.forEach((chat) => {
    const chatEl = createChatHistoryItem(chat, chat.id === activeId);
    container.appendChild(chatEl);
  });
}

// Funzione per impostare il modello selezionato
export function setSelectedModel(model: OpenAIModel): void {
  const radioInputs = document.querySelectorAll<HTMLInputElement>(
    'input[name="model"]'
  );
  radioInputs.forEach((input) => {
    if (input.value === model) {
      input.checked = true;
    }
  });
}

// Funzione per ottenere il modello selezionato
export function getSelectedModel(): OpenAIModel {
  const selectedInput = document.querySelector<HTMLInputElement>(
    'input[name="model"]:checked'
  );
  return (selectedInput?.value as OpenAIModel) || "gpt-3.5-turbo";
}
