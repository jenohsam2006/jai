import type { Message } from "@/components/ChatMessage";

export type StoredConversation = {
  id: string;
  title: string;
  messages: Message[];
  pdfContext: string;
  updatedAt: number;
};

const STORAGE_KEY = "jaiai-conversations";

function readAll(): StoredConversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeAll(convos: StoredConversation[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(convos));
}

export function getConversations(): StoredConversation[] {
  return readAll().sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getConversation(id: string): StoredConversation | undefined {
  return readAll().find((c) => c.id === id);
}

export function saveConversation(convo: StoredConversation) {
  const all = readAll().filter((c) => c.id !== convo.id);
  all.push(convo);
  writeAll(all);
}

export function deleteConversation(id: string) {
  writeAll(readAll().filter((c) => c.id !== id));
}

export function generateTitle(messages: Message[]): string {
  const first = messages.find((m) => m.role === "user");
  if (!first) return "New Chat";
  const text = first.content.slice(0, 40);
  return text.length < first.content.length ? text + "…" : text;
}
