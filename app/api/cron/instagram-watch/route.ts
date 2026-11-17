import { NextResponse } from "next/server";
import { runWatch } from "@/lib/instagram/watch";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

// Chaque matin : veille des comptes concurrents (posts qui explosent + analyse des accroches).
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const r = await runWatch();
  return NextResponse.json({ accounts: r.accounts.length, outliers: r.outliers.length });
}
