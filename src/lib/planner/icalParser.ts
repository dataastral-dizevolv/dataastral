export interface ParsedICalEvent {
  uid: string;
  summary: string;
  start: Date;
  end: Date;
  allDay: boolean;
}

function unfold(text: string): string {
  return text.replace(/\r?\n[ \t]/g, "");
}

function parseICalDate(raw: string): { date: Date; allDay: boolean } {
  const clean = raw.replace(/[^0-9TZ]/g, "");
  if (/^\d{8}$/.test(clean)) {
    const y = Number(clean.slice(0, 4));
    const m = Number(clean.slice(4, 6)) - 1;
    const d = Number(clean.slice(6, 8));
    return { date: new Date(y, m, d), allDay: true };
  }

  const match = clean.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)$/);
  if (match) {
    const [, y, mo, d, h, mi, s, z] = match;
    if (z === "Z") {
      return {
        date: new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s))),
        allDay: false,
      };
    }
    return {
      date: new Date(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s)),
      allDay: false,
    };
  }

  return { date: new Date(Number.NaN), allDay: false };
}

export function parseICal(ics: string): ParsedICalEvent[] {
  const text = unfold(ics);
  const events: ParsedICalEvent[] = [];
  const blocks = text.split("BEGIN:VEVENT").slice(1);

  for (const block of blocks) {
    const body = block.split("END:VEVENT")[0] ?? "";
    const lines = body.split(/\r?\n/);
    let uid = "";
    let summary = "";
    let startRaw = "";
    let endRaw = "";
    let allDayHint = false;

    for (const line of lines) {
      if (line.startsWith("UID:")) uid = line.slice(4).trim();
      else if (line.startsWith("SUMMARY")) {
        const idx = line.indexOf(":");
        summary = line.slice(idx + 1).replace(/\\,/g, ",").replace(/\\n/g, " ").trim();
      } else if (line.startsWith("DTSTART")) {
        if (/VALUE=DATE\b/i.test(line)) allDayHint = true;
        startRaw = line.slice(line.indexOf(":") + 1).trim();
      } else if (line.startsWith("DTEND")) {
        endRaw = line.slice(line.indexOf(":") + 1).trim();
      }
    }

    if (!startRaw) continue;
    const start = parseICalDate(startRaw);
    const end = endRaw ? parseICalDate(endRaw) : { date: new Date(start.date.getTime() + 3600_000), allDay: start.allDay };
    if (Number.isNaN(start.date.getTime())) continue;

    events.push({
      uid: uid || `${startRaw}-${summary}`,
      summary: summary || "(sem título)",
      start: start.date,
      end: Number.isNaN(end.date.getTime()) ? new Date(start.date.getTime() + 3600_000) : end.date,
      allDay: allDayHint || start.allDay,
    });
  }

  return events;
}
