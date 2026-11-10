import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";
import { sendEmailDetailed, fromAddress } from "@/lib/email/resend";
import { siteUrl, unsubUrl } from "@/lib/email/unsubscribe";
import { topIdeas, saasIdeaFor } from "@/lib/email/flows";
import {
  welcomeEmail, saasIdeaEmail, nurtureEmail, abandonedEmail, dropEmail, memberWelcomeEmail, winbackEmail, adminSignupEmail, adminPaymentEmail,
} from "@/lib/email/templates";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Envoie à l'admin connecté un exemplaire de chaque e-mail (préfixé [TEST]) et renvoie le résultat de chacun.
// body: { all?: boolean } — sans « all », un seul e-mail (bienvenue) pour un test rapide.
export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email || !isAdminEmail(user.email)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  let all = false;
  try { all = !!(await request.json())?.all; } catch {}

  const to = user.email;
  const site = siteUrl();
  const u = unsubUrl(to);
  const ideas = topIdeas(3);
  const saas = saasIdeaFor(`${Date.now()}`);
  const list = [
    ["Bienvenue", welcomeEmail("fr", site)],
    ...(saas ? ([["Idée de SaaS rentable", saasIdeaEmail(saas, "fr", site, u)]] as const) : []),
    ...(all ? ([
      ["Relance J+1", nurtureEmail(1, "fr", site, u, ideas)],
      ["Relance J+3", nurtureEmail(2, "fr", site, u)],
      ["Relance J+7", nurtureEmail(3, "fr", site, u)],
      ["Paiement abandonné", abandonedEmail("fr", site, u)],
      ["Bienvenue membre", memberWelcomeEmail("lifetime", "fr", site)],
      ["Abonné qui résilie", winbackEmail("fr", site, u)],
      ["Drop hebdo", dropEmail("fr", site, u, ideas)],
      ["Alerte inscription", adminSignupEmail("exemple@gmail.com", site, "google")],
      ["Alerte paiement", adminPaymentEmail("exemple@gmail.com", "lifetime", "129,00 €", site)],
    ] as const) : []),
  ] as const;

  const results: { name: string; ok: boolean; error?: string }[] = [];
  for (const [name, m] of list) {
    const r = await sendEmailDetailed({ to, subject: `[TEST] ${m.subject}`, html: m.html, text: m.text, tag: "test" });
    results.push({ name, ...r });
    if (!r.ok) break; // inutile d'insister si la configuration bloque
    await new Promise((res) => setTimeout(res, 600)); // limite de débit Resend
  }
  return NextResponse.json({ to, from: fromAddress(), results });
}
