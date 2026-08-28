export const DAY_MS = 86400000;

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

export function addDays(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

export function addMonths(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setMonth(next.getMonth() + amount);
  return next;
}

export function addWeeks(date: Date, amount: number): Date {
  return addDays(date, amount * 7);
}

export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseIsoDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1, 12, 0, 0, 0);
}

export function formatWeekday(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", { weekday: "long" }).format(date);
}

export function formatLongDay(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long" }).format(date);
}

export function formatDayMonth(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short" }).format(date);
}

export function formatDayMonthYear(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric" }).format(date);
}

export function formatMonthYear(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(date);
}

export function capitalizeMonth(date: Date): string {
  const raw = new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(date);
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

/** Sunday-start week helpers (planner grid). */
export function startOfWeek(date: Date, weekStartsOn = 0): Date {
  const day = startOfDay(date);
  const diff = (day.getDay() - weekStartsOn + 7) % 7;
  return addDays(day, -diff);
}

export function endOfWeek(date: Date, weekStartsOn = 0): Date {
  return endOfDay(addDays(startOfWeek(date, weekStartsOn), 6));
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date: Date): Date {
  return endOfDay(new Date(date.getFullYear(), date.getMonth() + 1, 0));
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export function differenceInCalendarDays(later: Date, earlier: Date): number {
  const a = startOfDay(later).getTime();
  const b = startOfDay(earlier).getTime();
  return Math.round((a - b) / DAY_MS);
}

export function dayOfMonth(date: Date): number {
  return date.getDate();
}
