import { NextResponse } from "next/server";
import { runPoll } from "@/lib/instagram/publish";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

// Deux sondages en story par jour (vers 12 h et 19 h, heure de Paris).
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json(await runPoll());
}
