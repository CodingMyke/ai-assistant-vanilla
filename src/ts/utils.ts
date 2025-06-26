// utils.ts - Funzioni di utilità generali

import type { Chat } from "./types";

/**
 * Genera un ID univoco utilizzando crypto.randomUUID()
 * @returns {string} Un ID univoco
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Formatta il contenuto markdown in HTML semplificato
 * @param {string} content - Il contenuto da formattare
 * @returns {string} Il contenuto formattato in HTML
 */
export function formatMarkdownToHtml(content: string): string {
  // Implementazione semplificata, in un'app reale si userebbe una libreria come marked.js
  return content
    .replace(/```(\w*)(\n[\s\S]*?\n)```/g, "<pre><code>$2</code></pre>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\n/g, "<br>");
}

/**
 * Tronca un testo alla lunghezza specificata aggiungendo "..." se necessario
 * @param {string} text - Il testo da troncare
 * @param {number} maxLength - La lunghezza massima
 * @returns {string} Il testo troncato
 */
export function truncateText(text: string, maxLength: number): string {
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
}

/**
 * Ordina un array di chat per timestamp (più recenti prima)
 * @param {Chat[]} chats - L'array di chat da ordinare
 * @returns {Chat[]} L'array di chat ordinato
 */
export function sortChatsByTimestamp(chats: Chat[]): Chat[] {
  return [...chats].sort((a, b) => b.timestamp - a.timestamp);
}
