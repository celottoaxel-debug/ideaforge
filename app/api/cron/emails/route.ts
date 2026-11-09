import { NextResponse } from "next/server";
import { runNurture, runWeeklyDrop } from "@/lib/email/flows";
import { emailEnabled } from "@/lib/email/resend";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Tous les jours (voir vercel.json) : relances J+1 / J+3 / J+7 des inscrits gratuits.
// Le lundi en plus : drop hebdo aux abonnés de la newsletter.
// Nécessite : CRON_SECRET, RESEND_API_KEY, SUPABASE_SERVICE_ROLE_KEY.
// Test manuel : /api/cron/emails?drop=1 avec l'en-tête Authorization: Bearer <CRON_SECRET>.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  // Statistiques de visite : on ne garde que 13 mois (voir la politique de confidentialité).
  try { await createAdminClient().from("page_views").delete().lt("created_at", new Date(Date.now() - 395 * 86_400_000).toISOString()); } catch {}

  if (!emailEnabled()) return NextResponse.json({ skipped: true, reason: "missing RESEND_API_KEY" });

  const url = new URL(request.url);
  const nurture = await runNurture();
  const isMonday = new Date().getUTCDay() === 1;
  const drop = isMonday || url.searchParams.get("drop") === "1" ? await runWeeklyDrop() : "pas lundi";

  return NextResponse.json({ ok: true, nurture, drop });
}
