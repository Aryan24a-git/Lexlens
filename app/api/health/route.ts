/**
 * Health check — GET /api/health
 * Returns 200 + timestamp. Used by monitoring and demo scripts.
 */

import { NextResponse } from "next/server";

export const runtime = "nodejs";

export function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    app: process.env["NEXT_PUBLIC_APP_NAME"] ?? "LexLens",
  });
}
