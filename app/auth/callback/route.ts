import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { onSignIn } from "@/lib/email/flows";
import { cookies } from "next/headers";
import { attachReferral, REF_COOKIE } from "@/lib/referral";

// Callback OAuth / lien magique : échange le code contre une session.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const saved = cookies().get("if_next")?.value;
  let next = searchParams.get("next") ?? (saved ? decodeURIComponent(saved) : "/");
  if (!next.startsWith("/") || next.startsWith("//")) next = "/";

  if (code) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Première connexion : e-mail de bienvenue + alerte admin (ne fait rien les fois suivantes).
      if (data?.user) await onSignIn(data.user.id, data.user.app_metadata?.provider as string | undefined);
      // Venu par un lien de parrainage : on rattache le compte à son parrain.
      const ref = cookies().get(REF_COOKIE)?.value;
      if (data?.user && ref) await attachReferral(data.user.id, ref);
      const res = NextResponse.redirect(`${origin}${next}`);
      if (saved) res.cookies.set("if_next", "", { maxAge: 0, path: "/" });
      return res;
    }
  }
  return NextResponse.redirect(`${origin}/login?error=auth`);
}
