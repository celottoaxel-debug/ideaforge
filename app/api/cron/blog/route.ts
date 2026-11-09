import { NextResponse } from "next/server";
import { runBlogAutopilot } from "@/lib/blog/autopilot";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Pilote automatique du blog : déclenché chaque jour par la tâche /api/cron/emails.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (process.env.BLOG_AUTOPILOT === "off") return NextResponse.json({ skipped: true });
  return NextResponse.json(await runBlogAutopilot());
}
