import { NextResponse } from "next/server";
import { finishPending } from "@/lib/instagram/publish";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Toutes les 5 minutes : publie les médias qu'Instagram a fini de traiter.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json(await finishPending());
}
