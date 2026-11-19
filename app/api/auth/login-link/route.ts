import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmailDetailed, emailEnabled } from "@/lib/email/resend";
import { loginLinkEmail, lang } from "@/lib/email/templates";
import { SITE } from "@/lib/seo";

export const dynamic = "force-dynamic";

// Envoie le lien de connexion avec l'e-mail IdeaForge (Resend) au lieu de l'e-mail par défaut de Supabase.
// Si l'envoi est impossible, le navigateur repasse par Supabase (fallback: true).
export async function POST(request: Request) {
  let body: { email?: string; locale?: string } = {};
  try { body = await request.json(); } catch {}
  const email = String(body.email ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) return NextResponse.json({ error: "Adresse e-mail invalide" }, { status: 400 });
  if (!emailEnabled()) return NextResponse.json({ fallback: true });

  const admin = createAdminClient();

  // Anti-abus : un lien par adresse et par minute
  const { data: rl } = await admin.from("app_settings").select("value").eq("key", "login_rl").maybeSingle();
  let map: Record<string, number> = {};
  try { map = JSON.parse((rl?.value as string) || "{}"); } catch {}
  const now = Date.now();
  if (map[email] && now - map[email] < 60_000) return NextResponse.json({ error: "Un lien vient d'être envoyé. Patiente une minute avant d'en redemander un." }, { status: 429 });
  map = Object.fromEntries(Object.entries(map).filter(([, t]) => now - t < 3600_000));
  map[email] = now;
  await admin.from("app_settings").upsert({ key: "login_rl", value: JSON.stringify(map), updated_at: new Date().toISOString() });

  // Lien à usage unique (crée le compte s'il n'existe pas encore)
  let gen = await admin.auth.admin.generateLink({ type: "magiclink", email });
  if (gen.error) {
    const created = await admin.auth.admin.createUser({ email, email_confirm: true });
    if (created.error && !/already/i.test(created.error.message)) return NextResponse.json({ fallback: true });
    gen = await admin.auth.admin.generateLink({ type: "magiclink", email });
  }
  const hash = gen.data?.properties?.hashed_token;
  if (gen.error || !hash) return NextResponse.json({ fallback: true });

  const link = `${SITE}/auth/confirm?token_hash=${encodeURIComponent(hash)}&type=magiclink`;
  const m = loginLinkEmail(lang(body.locale), link, SITE);
  const sent = await sendEmailDetailed({ to: email, subject: m.subject, html: m.html, text: m.text, tag: "login" });
  if (!sent.ok) return NextResponse.json({ fallback: true });
  return NextResponse.json({ ok: true });
}
