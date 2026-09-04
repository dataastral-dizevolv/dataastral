"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";

import {
  CHAT_THEMES,
  CHAT_THEME_STORAGE_KEY,
  DEFAULT_CHAT_THEME_ID,
  getChatTheme,
  type ChatTheme,
} from "@/components/iris-chat/chatThemes";

interface ChatThemeContextValue {
  theme: ChatTheme;
  setThemeId: (id: string) => void;
  themes: ChatTheme[];
}

const ChatThemeContext = createContext<ChatThemeContextValue | null>(null);

const CHAT_THEME_LISTENERS = new Set<() => void>();

function subscribe(callback: () => void) {
  CHAT_THEME_LISTENERS.add(callback);
  window.addEventListener("storage", callback);
  return () => {
    CHAT_THEME_LISTENERS.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

function emitThemeChange() {
  CHAT_THEME_LISTENERS.forEach((listener) => listener());
}

function getSnapshot() {
  try {
    return window.localStorage.getItem(CHAT_THEME_STORAGE_KEY) ?? DEFAULT_CHAT_THEME_ID;
  } catch {
    return DEFAULT_CHAT_THEME_ID;
  }
}

function getServerSnapshot() {
  return DEFAULT_CHAT_THEME_ID;
}

export function ChatThemeProvider({ children }: { children: ReactNode }) {
  const id = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setThemeId = useCallback((nextId: string) => {
    try {
      window.localStorage.setItem(CHAT_THEME_STORAGE_KEY, nextId);
      emitThemeChange();
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<ChatThemeContextValue>(
    () => ({ theme: getChatTheme(id), setThemeId, themes: CHAT_THEMES }),
    [id, setThemeId],
  );

  return <ChatThemeContext.Provider value={value}>{children}</ChatThemeContext.Provider>;
}

export function useChatTheme() {
  const context = useContext(ChatThemeContext);
  if (!context) {
    throw new Error("useChatTheme must be used within ChatThemeProvider");
  }
  return context;
}
