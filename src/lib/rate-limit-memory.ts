const memoryHits = new Map<string, number[]>();

export function consumeMemoryRateLimit(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const recent = (memoryHits.get(key) ?? []).filter((stamp) => now - stamp <= windowMs);

  if (recent.length >= max) {
    memoryHits.set(key, recent);
    return false;
  }

  recent.push(now);
  memoryHits.set(key, recent);
  return true;
}
