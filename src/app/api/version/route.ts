import { NextResponse } from "next/server";

// Probe de versão/health do front (Azure -> GitHub -> Vercel).
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ status: "ok", version: "1.0.0" });
}
