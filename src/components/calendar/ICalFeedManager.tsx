"use client";

import { useCallback, useEffect, useState } from "react";
import { Link as LinkIcon, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { USER_MESSAGES, toUserFacingMessage } from "@/lib/errors/user-facing";
import type { ICalFeed } from "@/types/calendar";

interface ICalFeedManagerProps {
  onFeedsChange?: (feeds: ICalFeed[]) => void;
}

export const ICAL_PRESET_COLORS = [
  "hsl(211 45% 53%)",
  "hsl(330 20% 40%)",
  "hsl(155 25% 62%)",
  "hsl(35 68% 58%)",
  "hsl(10 55% 50%)",
  "hsl(210 30% 58%)",
];

export function ICalFeedManager({ onFeedsChange }: ICalFeedManagerProps) {
  const [feeds, setFeeds] = useState<ICalFeed[]>([]);
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [color, setColor] = useState(ICAL_PRESET_COLORS[0]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch("/api/calendar/feeds", { credentials: "include" });
    if (!response.ok) {
      toast.error(USER_MESSAGES.calendarLoad);
      return;
    }
    const list = (await response.json()) as ICalFeed[];
    setFeeds(list);
    onFeedsChange?.(list);
  }, [onFeedsChange]);

  useEffect(() => {
    void load();
  }, [load]);

  async function add(event: React.FormEvent) {
    event.preventDefault();
    if (!label.trim() || !url.trim()) return;
    setLoading(true);
    try {
      const response = await fetch("/api/calendar/feeds", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: label.trim(), url: url.trim(), color }),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        toast.error(toUserFacingMessage(payload, USER_MESSAGES.calendarSave));
        return;
      }
      setLabel("");
      setUrl("");
      toast.success("Agenda conectada. Eventos serão carregados no calendário.");
      await load();
    } finally {
      setLoading(false);
    }
  }

  async function remove(id: string) {
    const response = await fetch(`/api/calendar/feeds?id=${id}`, { method: "DELETE", credentials: "include" });
    if (!response.ok) {
      toast.error(USER_MESSAGES.calendarRemove);
      return;
    }
    await load();
  }

  return (
    <div className="border border-border bg-background">
      <div className="border-b border-border px-4 py-4 sm:px-6">
        <h3 className="text-sm font-medium">Agendas conectadas</h3>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Cole o &quot;endereço secreto em formato iCal&quot; do Google Agenda (Configurações → Integrar agenda).
        </p>
      </div>

      <ul className="divide-y divide-border">
        {feeds.length === 0 ? (
          <li className="px-4 py-4 text-xs text-muted-foreground sm:px-6">Nenhuma agenda conectada ainda.</li>
        ) : null}
        {feeds.map((feed) => (
          <li key={feed.id} className="flex items-center gap-3 px-4 py-3 sm:px-6">
            <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: feed.color }} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm">{feed.label}</div>
              <div className="flex items-center gap-1 truncate text-[10px] text-muted-foreground">
                <LinkIcon className="size-3" /> {feed.url}
              </div>
            </div>
            <button
              type="button"
              onClick={() => void remove(feed.id)}
              aria-label="Remover"
              className="p-1 text-muted-foreground transition-colors hover:text-destructive"
            >
              <Trash2 className="size-4" />
            </button>
          </li>
        ))}
      </ul>

      <form onSubmit={(event) => void add(event)} className="space-y-3 border-t border-border px-4 py-4 sm:px-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            type="text"
            placeholder="Rótulo (ex: Minha agenda)"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            className="h-10 rounded-none"
          />
          <Input
            type="url"
            placeholder="https://calendar.google.com/calendar/ical/.../basic.ics"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            className="h-10 rounded-none"
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {ICAL_PRESET_COLORS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setColor(preset)}
                aria-label={`Cor ${preset}`}
                className="size-5 rounded-full border border-border transition-transform"
                style={{
                  backgroundColor: preset,
                  transform: color === preset ? "scale(1.2)" : "scale(1)",
                  outline: color === preset ? "1px solid hsl(var(--foreground))" : "none",
                  outlineOffset: 2,
                }}
              />
            ))}
          </div>
          <Button type="submit" disabled={loading || !label.trim() || !url.trim()} className="h-10 text-xs tracking-wider uppercase">
            <Plus className="size-3.5" /> Adicionar
          </Button>
        </div>
      </form>
    </div>
  );
}
