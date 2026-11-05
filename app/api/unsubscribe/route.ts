import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkUnsubToken, siteUrl } from "@/lib/email/unsubscribe";

export const dynamic = "force-dynamic";

// Désinscription des e-mails marketing (relances + drop hebdo).
// GET = clic sur le lien dans l'e-mail ; POST = désinscription « en un clic » de Gmail / Apple Mail.
async function unsubscribe(request: Request) {
  const url = new URL(request.url);
  const email = (url.searchParams.get("e") || "").trim().toLowerCase();
  const token = url.searchParams.get("t") || "";
  if (!email || !checkUnsubToken(email, token)) return false;

  const admin = createAdminClient();
  await Promise.all([
    admin.from("profiles").update({ email_opt_out: true }).ilike("email", email),
    admin.from("newsletter_subscribers").update({ unsubscribed_at: new Date().toISOString() }).ilike("email", email),
  ]);
  return true;
}

export async function POST(request: Request) {
  const ok = await unsubscribe(request);
  return NextResponse.json({ ok }, { status: ok ? 200 : 400 });
}

export async function GET(request: Request) {
  const ok = await unsubscribe(request);
  const site = siteUrl();
  const title = ok ? "C'est fait, tu es désabonné" : "Lien invalide";
  const sub = ok
    ? "Tu ne recevras plus nos relances ni le drop hebdo. Les e-mails liés à ton compte (connexion, paiement) continuent d'arriver."
    : "Ce lien de désinscription n'est pas valide. Réponds simplement à un de nos e-mails et on s'en occupe.";
  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} — IdeaForge</title></head>
<body style="margin:0;background:#f4f5f2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0c1512">
<div style="max-width:440px;margin:80px auto;padding:34px 32px;background:#fff;border:1px solid #e9e8e3;border-radius:18px;text-align:center">
<div style="display:inline-block;width:30px;height:30px;border-radius:9px;background:#003d30;color:#fff;font-weight:800;font-size:12.5px;line-height:30px">IF</div>
<h1 style="font-size:22px;margin:16px 0 10px">${title}</h1><p style="color:#44554f;line-height:1.6">${sub}</p>
<a href="${site}" style="display:inline-block;margin-top:10px;padding:12px 22px;border-radius:12px;background:#22a86a;color:#fff;text-decoration:none;font-weight:600">Retour au site</a></div></body></html>`;
  return new NextResponse(html, { status: ok ? 200 : 400, headers: { "content-type": "text/html; charset=utf-8" } });
}
