import { NextResponse } from "next/server";
import { runDiscover } from "@/lib/discover";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Moteur de découverte « 24/7 » : appelé chaque jour par Vercel Cron (voir vercel.json).
// Nécessite : CRON_SECRET, ANTHROPIC_API_KEY, SUPABASE_SERVICE_ROLE_KEY.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const r = await runDiscover();
  return NextResponse.json(r, { status: r.ok ? 200 : 500 });
}
