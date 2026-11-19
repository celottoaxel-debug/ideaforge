import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { afterSignIn } from "@/lib/supabase/after-sign-in";

const TYPES: EmailOtpType[] = ["email", "magiclink", "signup", "invite", "recovery", "email_change"];

function params(request: Request) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash") || "";
  const t = searchParams.get("type") as EmailOtpType | null;
  return { searchParams, tokenHash, type: t && TYPES.includes(t) ? t : ("email" as EmailOtpType) };
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

// Lien magique reçu par e-mail : {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
// Marche dans n'importe quel navigateur (appli Gmail, autre téléphone...), contrairement au code PKCE.
// GET n'affiche qu'un bouton : les robots qui vérifient les liens des e-mails ne consomment pas le lien.
export async function GET(request: Request) {
  const { origin, search } = new URL(request.url);
  const { tokenHash } = params(request);
  if (!tokenHash) return NextResponse.redirect(`${origin}/login?error=auth`);
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Connexion · IdeaForge</title>
<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0b0f0c;color:#eef3ef;font-family:system-ui,-apple-system,sans-serif;padding:16px}
.c{max-width:360px;width:100%;text-align:center;background:#121915;border:1px solid #233028;border-radius:20px;padding:32px 24px}
h1{font-size:22px;margin:0 0 8px}p{color:#9fb0a5;font-size:14px;margin:0 0 20px}
button{width:100%;padding:14px;border:0;border-radius:12px;background:#22c55e;color:#06120a;font-size:16px;font-weight:700;cursor:pointer}</style></head>
<body><form class="c" method="post" action="/auth/confirm${esc(search)}"><h1>IdeaForge</h1><p>Appuie sur le bouton pour terminer ta connexion.</p><button type="submit">Me connecter</button></form></body></html>`;
  return new NextResponse(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
}

export async function POST(request: Request) {
  const { origin } = new URL(request.url);
  const { searchParams, tokenHash, type } = params(request);
  if (tokenHash) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) return afterSignIn(data?.user, origin, searchParams);
  }
  return NextResponse.redirect(`${origin}/login?error=expired`, 303);
}
