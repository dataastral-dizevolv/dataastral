export interface ChatTheme {
  id: string;
  label: string;
  group: "verde" | "azul" | "claro";
  /** HSL values WITHOUT hsl() wrapper, applied to CSS vars */
  bg: string;
  bubble: string;
  vibrant: string;
  vibrantFg: string;
  /** Hex used only for the picker swatches */
  bgHex: string;
  bubbleHex: string;
  vibrantHex: string;
}

export const CHAT_THEMES: ChatTheme[] = [
  {
    id: "verde-profundo",
    label: "Paleta verde escuro",
    group: "verde",
    bg: "158 60% 12%",
    bubble: "150 28% 72%",
    vibrant: "145 70% 42%",
    vibrantFg: "0 0% 100%",
    bgHex: "#0E3528",
    bubbleHex: "#A8C6B2",
    vibrantHex: "#22B664",
  },
  {
    id: "azul-profundo",
    label: "Paleta azul escuro",
    group: "azul",
    bg: "215 65% 12%",
    bubble: "215 32% 72%",
    vibrant: "222 100% 56%",
    vibrantFg: "0 0% 100%",
    bgHex: "#0B1D3A",
    bubbleHex: "#A6B8D0",
    vibrantHex: "#2563FF",
  },
  {
    id: "azul-menta",
    label: "Paleta azul claro",
    group: "azul",
    bg: "172 45% 28%",
    bubble: "160 38% 78%",
    vibrant: "174 80% 40%",
    vibrantFg: "0 0% 100%",
    bgHex: "#2A6B63",
    bubbleHex: "#A8D8C4",
    vibrantHex: "#14B8A6",
  },
  {
    id: "claro-offwhite",
    label: "Paleta off white",
    group: "claro",
    bg: "38 22% 80%",
    bubble: "43 33% 95%",
    vibrant: "30 12% 18%",
    vibrantFg: "43 33% 97%",
    bgHex: "#D4CCBC",
    bubbleHex: "#F6F1E7",
    vibrantHex: "#2B2620",
  },
];

export const DEFAULT_CHAT_THEME_ID = "azul-menta";
export const CHAT_THEME_STORAGE_KEY = "iris-chat-theme";

export const getChatTheme = (id: string | null | undefined): ChatTheme =>
  CHAT_THEMES.find((theme) => theme.id === id) ??
  CHAT_THEMES.find((theme) => theme.id === DEFAULT_CHAT_THEME_ID)!;
