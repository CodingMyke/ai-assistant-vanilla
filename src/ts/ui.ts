// ui.ts - Gestione dell'interfaccia utente

import type { Chat, Message } from "./types";
import {
  formatMarkdownToHtml,
  truncateText,
  sortChatsByTimestamp,
} from "./utils";

// Funzione per creare un elemento messaggio
export function createMessageElement(message: Message): HTMLDivElement {
  const messageEl = document.createElement("div");
  messageEl.classList.add("message");
  messageEl.classList.add(
    message.role === "user" ? "user-message" : "ai-message"
  );

  // Per i messaggi dell'assistente, convertiamo il markdown in HTML
  if (message.role === "assistant") {
    const formattedContent = formatMarkdownToHtml(message.content);
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

// Funzione per mostrare il menu contestuale
export function showChatContextMenu(
  event: MouseEvent,
  chatId: string,
  onDelete: (chatId: string) => void,
  onRename?: (chatId: string) => void
): void {
  // Rimuovi eventuali menu esistenti
  const existingMenu = document.querySelector(".chat-context-menu");
  if (existingMenu) {
    existingMenu.remove();
  }

  // Crea il menu contestuale
  const menu = document.createElement("div");
  menu.classList.add("chat-context-menu");

  // Opzione rinomina
  if (onRename) {
    const renameOption = document.createElement("button");
    renameOption.classList.add("context-menu-item", "rename-option");
    renameOption.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
        <path d="m18.5 2.5 a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
      </svg>
      Rinomina
    `;

    renameOption.addEventListener("click", () => {
      menu.remove();
      onRename(chatId);
    });

    menu.appendChild(renameOption);
  }

  // Opzione elimina
  const deleteOption = document.createElement("button");
  deleteOption.classList.add("context-menu-item", "delete-option");
  deleteOption.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="3,6 5,6 21,6"></polyline>
      <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
      <line x1="10" y1="11" x2="10" y2="17"></line>
      <line x1="14" y1="11" x2="14" y2="17"></line>
    </svg>
    Elimina
  `;

  deleteOption.addEventListener("click", () => {
    menu.remove();
    showDeleteConfirmModal(
      chatId,
      onDelete,
      "Sei sicuro di voler eliminare questa chat? Questa azione non può essere annullata."
    );
  });

  menu.appendChild(deleteOption);

  // Posiziona il menu
  const rect = (event.target as HTMLElement).getBoundingClientRect();
  menu.style.position = "fixed";
  menu.style.left = `${rect.right + 5}px`;
  menu.style.top = `${rect.top}px`;
  menu.style.zIndex = "1000";

  // Aggiungi il menu al documento temporaneamente per calcolare le dimensioni
  document.body.appendChild(menu);

  // Calcola le dimensioni del menu e della finestra
  const menuRect = menu.getBoundingClientRect();
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  // Aggiusta la posizione orizzontale se il menu esce dalla finestra
  if (menuRect.right > windowWidth) {
    menu.style.left = `${rect.left - menuRect.width - 5}px`;
  }

  // Aggiusta la posizione verticale se il menu esce dalla finestra
  if (menuRect.bottom > windowHeight) {
    menu.style.top = `${rect.bottom - menuRect.height}px`;
  }

  // Chiudi il menu quando si clicca altrove
  const closeMenu = (e: MouseEvent) => {
    if (!menu.contains(e.target as Node)) {
      menu.remove();
      document.removeEventListener("click", closeMenu);
    }
  };

  // Aggiungi il listener dopo un breve delay per evitare la chiusura immediata
  setTimeout(() => {
    document.addEventListener("click", closeMenu);
  }, 10);
}

// Funzione per mostrare la modale di conferma eliminazione
export function showDeleteConfirmModal(
  chatId: string,
  onConfirm: (chatId: string) => void,
  message: string
): void {
  // Crea l'overlay della modale
  const overlay = document.createElement("div");
  overlay.classList.add("modal-overlay");

  // Crea la modale
  const modal = document.createElement("div");
  modal.classList.add("delete-confirm-modal");

  // Contenuto della modale
  modal.innerHTML = `
    <div class="modal-header">
      <h3>Conferma eliminazione</h3>
    </div>
    <div class="modal-body">
      <p>${message}</p>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary cancel-btn">Annulla</button>
      <button class="btn btn-danger confirm-btn">Elimina</button>
    </div>
  `;

  // Event listeners per i pulsanti
  const cancelBtn = modal.querySelector(".cancel-btn") as HTMLButtonElement;
  const confirmBtn = modal.querySelector(".confirm-btn") as HTMLButtonElement;

  cancelBtn.addEventListener("click", () => {
    overlay.remove();
  });

  confirmBtn.addEventListener("click", () => {
    overlay.remove();
    onConfirm(chatId);
  });

  // Chiudi la modale cliccando sull'overlay
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      overlay.remove();
    }
  });

  // Chiudi la modale con ESC
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      overlay.remove();
      document.removeEventListener("keydown", handleEscape);
    }
  };
  document.addEventListener("keydown", handleEscape);

  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}

// Funzione per attivare la modalità di rinomina di una chat
export function enableChatRename(
  chatId: string,
  currentTitle: string,
  onSave: (chatId: string, newTitle: string) => void
): void {
  const chatItem = document.querySelector(
    `[data-id="${chatId}"]`
  ) as HTMLDivElement;
  if (!chatItem) return;

  const chatContent = chatItem.querySelector(".chat-content") as HTMLDivElement;
  if (!chatContent) return;

  // Salva il contenuto originale
  const originalContent = chatContent.textContent || "";

  // Crea l'input per la rinomina
  const input = document.createElement("input");
  input.type = "text";
  input.classList.add("chat-rename-input");
  input.value = currentTitle || originalContent;
  input.maxLength = 30; // Lunghezza massima uguale a quella attuale
  input.placeholder = "Nome della chat...";

  // Sostituisci il contenuto con l'input
  chatContent.innerHTML = "";
  chatContent.appendChild(input);

  // Focus sull'input e seleziona tutto il testo
  input.focus();
  input.select();

  // Funzione per salvare la rinomina
  const saveRename = () => {
    const newTitle = input.value.trim();

    if (newTitle && newTitle !== currentTitle) {
      onSave(chatId, newTitle);
    }

    // Ripristina il contenuto normale
    chatContent.textContent = newTitle || originalContent;
  };

  // Funzione per annullare la rinomina
  const cancelRename = () => {
    chatContent.textContent = originalContent;
  };

  // Event listeners
  input.addEventListener("blur", saveRename);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveRename();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelRename();
    }
  });

  // Previeni la propagazione del click per evitare di selezionare la chat
  input.addEventListener("click", (e) => {
    e.stopPropagation();
  });
}

// Funzione per creare un elemento della cronologia chat
export function createChatHistoryItem(
  chat: Chat,
  isActive: boolean = false,
  onDelete: (chatId: string) => void,
  onRename?: (chatId: string) => void
): HTMLDivElement {
  const chatEl = document.createElement("div");
  chatEl.classList.add("chat-item");
  if (isActive) chatEl.classList.add("active");
  chatEl.dataset.id = chat.id;

  // Container per il contenuto della chat
  const chatContent = document.createElement("div");
  chatContent.classList.add("chat-content");

  // Mostra il titolo o la prima domanda come titolo della chat
  const firstUserMessage = chat.messages.find((msg) => msg.role === "user");
  chatContent.textContent =
    chat.title ||
    (firstUserMessage
      ? truncateText(firstUserMessage.content, 30)
      : "Nuova chat");

  // Pulsante menu con 3 puntini
  const menuButton = document.createElement("button");
  menuButton.classList.add("chat-menu-btn");
  menuButton.innerHTML = "⋯";
  menuButton.setAttribute("aria-label", "Menu opzioni chat");

  // Previeni la propagazione del click per evitare di selezionare la chat
  menuButton.addEventListener("click", (e) => {
    e.stopPropagation();
    showChatContextMenu(e, chat.id, onDelete, onRename);
  });

  chatEl.appendChild(chatContent);
  chatEl.appendChild(menuButton);

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
  activeId?: string,
  onDelete?: (chatId: string) => void,
  onRename?: (chatId: string) => void
): void {
  container.innerHTML = "";

  // Ordina le chat per timestamp (più recenti prima)
  const sortedChats = sortChatsByTimestamp(chats);

  sortedChats.forEach((chat) => {
    const chatEl = createChatHistoryItem(
      chat,
      chat.id === activeId,
      onDelete || (() => {}),
      onRename
    );
    container.appendChild(chatEl);
  });
}
