// storage.ts - Gestione della persistenza dei dati con localStorage

import { type Chat } from "./types";

const STORAGE_KEY = "ai-assistant-chats";

export function saveChats(chats: Chat[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
}

export function loadChats(): Chat[] {
  const storedChats = localStorage.getItem(STORAGE_KEY);
  if (!storedChats) return [];

  try {
    return JSON.parse(storedChats);
  } catch (error) {
    console.error("Errore nel caricamento delle chat:", error);
    return [];
  }
}

export function saveChat(chat: Chat): void {
  const chats = loadChats();
  const existingIndex = chats.findIndex((c) => c.id === chat.id);

  if (existingIndex >= 0) {
    chats[existingIndex] = chat;
  } else {
    chats.push(chat);
  }

  saveChats(chats);
}

export function deleteChat(chatId: string): void {
  const chats = loadChats();
  const updatedChats = chats.filter((chat) => chat.id !== chatId);
  saveChats(updatedChats);
}

export function getChat(chatId: string): Chat | undefined {
  const chats = loadChats();
  return chats.find((chat) => chat.id === chatId);
}
