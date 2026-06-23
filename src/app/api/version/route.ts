import { NextResponse } from "next/server";

// Marcador de versão para validar a cadeia de deploy (Azure -> GitHub -> Vercel).
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ status: "ok", version: "2026.06.23-deploytest" });
}
