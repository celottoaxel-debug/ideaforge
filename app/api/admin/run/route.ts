import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";
import { runDiscover } from "@/lib/discover";
import { runNurture } from "@/lib/email/flows";
import { emailEnabled } from "@/lib/email/resend";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Lance à la main, depuis le panel admin, une tâche normalement exécutée chaque jour par Vercel Cron.
// body: { job: "discover" | "nurture" }
export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email || !isAdminEmail(user.email)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  let job = "";
  try { job = String((await request.json())?.job || ""); } catch {}

  if (job === "discover") return NextResponse.json(await runDiscover());
  if (job === "nurture") {
    if (!emailEnabled()) return NextResponse.json({ ok: false, error: "RESEND_API_KEY absente" });
    return NextResponse.json({ ok: true, sent: await runNurture() });
  }
  return NextResponse.json({ error: "job inconnu" }, { status: 400 });
}
