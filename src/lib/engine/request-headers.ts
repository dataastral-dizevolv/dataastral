/**
 * Headers for the astrological engine (Flask or Supabase `iris-predict`).
 * Supabase Functions require a gateway JWT (`Authorization` + `apikey`) in
 * addition to the app's `x-internal-engine-token`.
 */
export function getEngineRequestHeaders(requestId: string): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-request-id": requestId,
    "x-internal-engine-token": process.env.ENGINE_INTERNAL_TOKEN?.trim() || "",
  };

  const engineUrl =
    process.env.PYTHON_ENGINE_URL?.trim() ||
    `${process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""}/functions/v1/iris-predict`;

  if (!engineUrl.includes("/functions/v1/")) {
    return headers;
  }

  const gatewayKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY?.trim() ||
    "";

  if (gatewayKey) {
    headers.Authorization = `Bearer ${gatewayKey}`;
    headers.apikey = gatewayKey;
  }

  return headers;
}
