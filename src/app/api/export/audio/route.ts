import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Route intentionally disabled for security/cost control (F-04).
// Keep endpoint non-discoverable and avoid processing any request payload.
export async function POST() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
