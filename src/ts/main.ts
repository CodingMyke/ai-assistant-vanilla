// src/main.ts - File principale che coordina l'applicazione

// Importa i tipi e le funzioni dagli altri moduli
import type { Chat, Message, OpenAIModel } from "./types";
import { loadChats, saveChat, deleteChat, getChat } from "./storage";
import { getAIResponse } from "./api";
import {
  updateMessagesView,
  updateChatHistory,
  createLoadingElement,
  setSelectedModel,
  getSelectedModel,
} from "./ui";
import { generateId, truncateText, sortChatsByTimestamp } from "./utils";

// Elementi DOM
const messagesContainer = document.getElementById("messages") as HTMLDivElement;
const userInput = document.getElementById("user-input") as HTMLTextAreaElement;
const sendButton = document.getElementById("send-btn") as HTMLButtonElement;
const newChatButton = document.getElementById(
  "new-chat-btn"
) as HTMLButtonElement;
const chatHistoryContainer = document.getElementById(
  "chat-history"
) as HTMLDivElement;

// Stato dell'applicazione
let currentChat: Chat | null = null;
let isWaitingForResponse = false;

// Inizializzazione
function init() {
  // Carica le chat salvate
  const chats = loadChats();

  // Aggiorna la visualizzazione della cronologia
  updateChatHistory(chats, chatHistoryContainer);

  // Se ci sono chat, carica l'ultima
  if (chats.length > 0) {
    const lastChat = sortChatsByTimestamp(chats)[0];
    loadChat(lastChat.id);
  } else {
    // Altrimenti crea una nuova chat
    createNewChat();
  }

  // Aggiungi event listeners
  setupEventListeners();
}

// Configurazione degli event listeners
function setupEventListeners() {
  // Invio del messaggio
  sendButton.addEventListener("click", sendMessage);
  userInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Auto-resize della textarea
  userInput.addEventListener("input", () => {
    userInput.style.height = "auto";
    userInput.style.height = Math.min(userInput.scrollHeight, 200) + "px";
  });

  // Nuova chat
  newChatButton.addEventListener("click", createNewChat);

  // Click su una chat nella cronologia
  chatHistoryContainer.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    const chatItem = target.closest(".chat-item") as HTMLDivElement;

    if (chatItem && chatItem.dataset.id) {
      loadChat(chatItem.dataset.id);
    }
  });

  // Cambio del modello
  document.querySelectorAll('input[name="model"]').forEach((input) => {
    input.addEventListener("change", () => {
      if (currentChat) {
        currentChat.model = getSelectedModel();
        saveChat(currentChat);
      }
    });
  });
}

// Funzione per creare una nuova chat
function createNewChat() {
  const newChat: Chat = {
    id: generateId(),
    title: "",
    messages: [],
    model: getSelectedModel(),
    timestamp: Date.now(),
  };

  currentChat = newChat;
  saveChat(newChat);

  // Aggiorna l'interfaccia
  updateMessagesView([], messagesContainer);
  updateChatHistory(loadChats(), chatHistoryContainer, newChat.id);
}

// Funzione per caricare una chat esistente
function loadChat(chatId: string) {
  const chat = getChat(chatId);

  if (chat) {
    currentChat = chat;
    updateMessagesView(chat.messages, messagesContainer);
    updateChatHistory(loadChats(), chatHistoryContainer, chatId);
    setSelectedModel(chat.model as any);
  }
}

// Funzione per inviare un messaggio
async function sendMessage() {
  const content = userInput.value.trim();

  if (!content || isWaitingForResponse || !currentChat) return;

  // Crea il messaggio dell'utente
  const userMessage: Message = {
    id: generateId(),
    role: "user",
    content,
    timestamp: Date.now(),
  };

  // Aggiorna la chat corrente
  currentChat.messages.push(userMessage);

  // Se è il primo messaggio, imposta il titolo della chat
  if (!currentChat.title && currentChat.messages.length === 1) {
    currentChat.title = truncateText(content, 30);
  }

  currentChat.timestamp = Date.now();
  saveChat(currentChat);

  // Aggiorna l'interfaccia
  updateMessagesView(currentChat.messages, messagesContainer);
  updateChatHistory(loadChats(), chatHistoryContainer, currentChat.id);

  // Resetta l'input
  userInput.value = "";
  userInput.style.height = "auto";

  // Mostra l'indicatore di caricamento
  isWaitingForResponse = true;
  const loadingEl = createLoadingElement();
  messagesContainer.appendChild(loadingEl);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  try {
    // Ottieni la risposta dall'AI
    const aiResponse = await getAIResponse(
      currentChat.messages,
      currentChat.model as any
    );

    // Crea il messaggio dell'assistente
    const assistantMessage: Message = {
      id: generateId(),
      role: "assistant",
      content: aiResponse,
      timestamp: Date.now(),
    };

    // Aggiorna la chat corrente
    currentChat.messages.push(assistantMessage);
    currentChat.timestamp = Date.now();
    saveChat(currentChat);

    // Aggiorna l'interfaccia
    updateMessagesView(currentChat.messages, messagesContainer);
  } catch (error) {
    // Gestione degli errori
    console.error("Errore nell'ottenere la risposta:", error);

    const errorMessage: Message = {
      id: generateId(),
      role: "assistant",
      content: `Mi dispiace, si è verificato un errore: ${
        error instanceof Error ? error.message : "Errore sconosciuto"
      }. Assicurati di aver configurato correttamente la chiave API di OpenAI nel file .env.`,
      timestamp: Date.now(),
    };

    currentChat.messages.push(errorMessage);
    saveChat(currentChat);
    updateMessagesView(currentChat.messages, messagesContainer);
  } finally {
    isWaitingForResponse = false;
  }
}

// Avvia l'applicazione quando il DOM è caricato
document.addEventListener("DOMContentLoaded", init);
