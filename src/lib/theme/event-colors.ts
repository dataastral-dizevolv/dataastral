export type EventColorType = "tensao" | "harmonia" | "portal" | "neutro";

export const EVENT_TYPE_COLORS: Record<
  EventColorType,
  {
    primary: string;
    surface: string;
    text: string;
    activeText: string;
  }
> = {
  tensao: {
    primary: "#C0392B",
    surface: "#3B0F0D",
    text: "#F87171",
    activeText: "#0B0B10",
  },
  harmonia: {
    primary: "#27AE60",
    surface: "#0D2B1A",
    text: "#4ADE80",
    activeText: "#0B0B10",
  },
  portal: {
    primary: "#6B7280",
    surface: "#1A1A24",
    text: "#D1D5DB",
    activeText: "#0B0B10",
  },
  neutro: {
    primary: "#4B5563",
    surface: "#1A1A24",
    text: "#9CA3AF",
    activeText: "#E5E7EB",
  },
};
