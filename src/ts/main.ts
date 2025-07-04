// src/main.ts - File principale che coordina l'applicazione

// Importa i tipi e le funzioni dagli altri moduli
import type { Chat, Message } from "./types";
import { loadChats, saveChat, deleteChat, getChat } from "./storage";
import { getAIResponse } from "./api";
import {
  updateMessagesView,
  updateChatHistory,
  createLoadingElement,
  showDeleteConfirmModal,
  enableChatRename,
} from "./ui";
import { generateId, truncateText, sortChatsByTimestamp } from "./utils";

// Elementi DOM
const messagesContainer = document.getElementById("messages") as HTMLDivElement;
const userInput = document.getElementById("user-input") as HTMLTextAreaElement;
const sendButton = document.getElementById("send-btn") as HTMLButtonElement;
const newChatButton = document.getElementById(
  "new-chat-btn"
) as HTMLButtonElement;
const clearAllButton = document.getElementById(
  "clear-all-btn"
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
  updateChatHistory(
    chats,
    chatHistoryContainer,
    undefined,
    handleDeleteChat,
    handleRenameChat
  );

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

  // Cancella tutte le chat
  clearAllButton.addEventListener("click", clearAllChats);

  // Click su una chat nella cronologia
  chatHistoryContainer.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    const chatItem = target.closest(".chat-item") as HTMLDivElement;

    // Ignora i click sui pulsanti del menu
    if (target.closest(".chat-menu-btn")) {
      return;
    }

    if (chatItem && chatItem.dataset.id) {
      loadChat(chatItem.dataset.id);
    }
  });
}

// Funzione per creare una nuova chat
function createNewChat() {
  const newChat: Chat = {
    id: generateId(),
    title: "",
    messages: [],
    timestamp: Date.now(),
  };

  currentChat = newChat;
  saveChat(newChat);

  // Aggiorna l'interfaccia
  updateMessagesView([], messagesContainer);
  updateChatHistory(
    loadChats(),
    chatHistoryContainer,
    newChat.id,
    handleDeleteChat,
    handleRenameChat
  );
}

// Funzione per caricare una chat esistente
function loadChat(chatId: string) {
  const chat = getChat(chatId);

  if (chat) {
    currentChat = chat;
    updateMessagesView(chat.messages, messagesContainer);
    updateChatHistory(
      loadChats(),
      chatHistoryContainer,
      chatId,
      handleDeleteChat,
      handleRenameChat
    );
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
  updateChatHistory(
    loadChats(),
    chatHistoryContainer,
    currentChat.id,
    handleDeleteChat,
    handleRenameChat
  );

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
    const aiResponse = await getAIResponse(currentChat.messages);

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
    // Rimuovi l'indicatore di caricamento
    const loadingElement = messagesContainer.querySelector(".loading");
    if (loadingElement) {
      loadingElement.remove();
    }
    isWaitingForResponse = false;
  }
}

// Funzione per gestire l'eliminazione di una chat
function handleDeleteChat(chatId: string) {
  // Elimina la chat dal storage
  deleteChat(chatId);

  // Se la chat eliminata era quella corrente, gestisci la transizione
  if (currentChat && currentChat.id === chatId) {
    const remainingChats = loadChats();

    if (remainingChats.length > 0) {
      // Carica la chat più recente
      const lastChat = sortChatsByTimestamp(remainingChats)[0];
      loadChat(lastChat.id);
    } else {
      // Se non ci sono più chat, crea una nuova chat
      createNewChat();
    }
  } else {
    // Se la chat eliminata non era quella corrente, aggiorna solo la cronologia
    updateChatHistory(
      loadChats(),
      chatHistoryContainer,
      currentChat?.id,
      handleDeleteChat,
      handleRenameChat
    );
  }
}

// Funzione per gestire la rinomina di una chat
function handleRenameChat(chatId: string) {
  const chat = getChat(chatId);
  if (!chat) return;

  // Determina il titolo corrente
  const currentTitle =
    chat.title ||
    (chat.messages.length > 0
      ? truncateText(
          chat.messages.find((msg) => msg.role === "user")?.content || "",
          30
        )
      : "Nuova chat");

  enableChatRename(chatId, currentTitle, (id: string, newTitle: string) => {
    // Aggiorna il titolo della chat
    const chatToUpdate = getChat(id);
    if (chatToUpdate) {
      chatToUpdate.title = newTitle;
      chatToUpdate.timestamp = Date.now();
      saveChat(chatToUpdate);

      // Se è la chat corrente, aggiorna anche la variabile locale
      if (currentChat && currentChat.id === id) {
        currentChat.title = newTitle;
      }

      // Aggiorna la cronologia delle chat
      updateChatHistory(
        loadChats(),
        chatHistoryContainer,
        currentChat?.id,
        handleDeleteChat,
        handleRenameChat
      );
    }
  });
}

// Funzione per cancellare tutte le chat
function clearAllChats() {
  showDeleteConfirmModal(
    "all",
    handleClearAllChats,
    "Sei sicuro di voler cancellare tutte le chat? Questa azione non può essere annullata."
  );
}

// Funzione per gestire la cancellazione di tutte le chat
function handleClearAllChats() {
  // Cancella tutte le chat dal localStorage
  localStorage.removeItem("ai-assistant-chats");

  // Crea una nuova chat
  createNewChat();
}

// Avvia l'applicazione quando il DOM è caricato
document.addEventListener("DOMContentLoaded", init);
