"use client";

import { Check, Palette } from "lucide-react";

import { useChatTheme } from "@/components/iris-chat/ChatThemeContext";
import type { ChatTheme } from "@/components/iris-chat/chatThemes";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const GROUP_LABELS: Record<ChatTheme["group"], string> = {
  verde: "Verde",
  azul: "Azul",
  claro: "Claro",
};

export function ChatThemePicker() {
  const { theme, setThemeId, themes } = useChatTheme();

  const grouped = themes.reduce<Record<string, ChatTheme[]>>((acc, item) => {
    (acc[item.group] ||= []).push(item);
    return acc;
  }, {});

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Cor do chat"
          className="flex items-center justify-center p-1 text-muted-foreground transition-colors hover:text-foreground"
        >
          <Palette className="size-5" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 space-y-4 p-4">
        <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Cores do chat</p>
        {(Object.keys(grouped) as ChatTheme["group"][]).map((group) => (
          <div key={group} className="space-y-2">
            <p className="text-[11px] font-semibold text-foreground">{GROUP_LABELS[group]}</p>
            <div className="grid grid-cols-1 gap-1.5">
              {grouped[group].map((item) => {
                const active = item.id === theme.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setThemeId(item.id)}
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-xl border px-2.5 py-2 text-left transition-colors",
                      active ? "border-foreground/80 bg-muted" : "border-transparent hover:bg-muted",
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-6 w-9 overflow-hidden rounded-md border border-border" aria-hidden>
                        <span className="flex-1" style={{ backgroundColor: item.bgHex }} />
                        <span className="flex-1" style={{ backgroundColor: item.bubbleHex }} />
                        <span className="flex-1" style={{ backgroundColor: item.vibrantHex }} />
                      </div>
                      <span className="text-sm text-foreground">{item.label}</span>
                    </div>
                    {active ? <Check className="size-4 text-iris" /> : null}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </PopoverContent>
    </Popover>
  );
}
