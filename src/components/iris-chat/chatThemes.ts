export interface ChatTheme {
  id: string;
  label: string;
  group: "verde" | "azul" | "claro";
  /** HSL values WITHOUT hsl() wrapper, applied to CSS vars */
  bg: string;
  bubble: string;
  vibrant: string;
  vibrantFg: string;
}

export const CHAT_THEMES: ChatTheme[] = [
  {
    id: "verde-profundo",
    label: "Paleta verde",
    group: "verde",
    bg: "158 30% 92%",
    bubble: "150 28% 86%",
    vibrant: "145 40% 32%",
    vibrantFg: "150 30% 97%",
  },
  {
    id: "azul-profundo",
    label: "Paleta azul",
    group: "azul",
    bg: "215 40% 93%",
    bubble: "215 32% 88%",
    vibrant: "222 46% 32%",
    vibrantFg: "213 70% 97%",
  },
  {
    id: "azul-menta",
    label: "Paleta menta",
    group: "azul",
    bg: "172 30% 93%",
    bubble: "160 28% 90%",
    vibrant: "174 45% 28%",
    vibrantFg: "160 30% 97%",
  },
  {
    id: "claro-offwhite",
    label: "Paleta off white",
    group: "claro",
    bg: "38 22% 94%",
    bubble: "43 33% 96%",
    vibrant: "30 12% 22%",
    vibrantFg: "43 33% 97%",
  },
];

export const DEFAULT_CHAT_THEME_ID = "azul-menta";
export const CHAT_THEME_STORAGE_KEY = "iris-chat-theme";

export const getChatTheme = (id: string | null | undefined): ChatTheme =>
  CHAT_THEMES.find((theme) => theme.id === id) ??
  CHAT_THEMES.find((theme) => theme.id === DEFAULT_CHAT_THEME_ID)!;
