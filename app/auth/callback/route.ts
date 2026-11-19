import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { afterSignIn } from "@/lib/supabase/after-sign-in";

// Callback OAuth (Google, GitHub) et anciens liens magiques : échange le code contre une session.
// Ne marche que dans le navigateur qui a lancé la connexion (le code PKCE y est stocké).
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return afterSignIn(data?.user, origin, searchParams);
  }
  return NextResponse.redirect(`${origin}/login?error=auth`);
}
