const PRIVATE_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"]);

function isPrivateIpv4(hostname: string) {
  const parts = hostname.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return false;
  }

  const [a, b] = parts;
  if (a === 10 || a === 127 || a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  return false;
}

export function normalizeIcalUrl(raw: string): URL | null {
  const trimmed = raw.trim();
  if (trimmed.length < 12 || trimmed.length > 2000) {
    return null;
  }

  const withScheme = trimmed.replace(/^webcal:\/\//i, "https://");

  let parsed: URL;
  try {
    parsed = new URL(withScheme);
  } catch {
    return null;
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return null;
  }

  const hostname = parsed.hostname.toLowerCase();
  if (PRIVATE_HOSTS.has(hostname) || hostname.endsWith(".local") || hostname.endsWith(".internal")) {
    return null;
  }

  if (isPrivateIpv4(hostname) || hostname.includes(":")) {
    return null;
  }

  return parsed;
}
