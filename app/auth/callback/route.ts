import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { onSignIn } from "@/lib/email/flows";

// Callback OAuth / lien magique : échange le code contre une session.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Première connexion : e-mail de bienvenue + alerte admin (ne fait rien les fois suivantes).
      if (data?.user) await onSignIn(data.user.id, data.user.app_metadata?.provider as string | undefined);
      return NextResponse.redirect(`${origin}${next}`);
    }
  }
  return NextResponse.redirect(`${origin}/login?error=auth`);
}
