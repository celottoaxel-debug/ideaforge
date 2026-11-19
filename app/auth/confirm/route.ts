import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { onSignIn } from "@/lib/email/flows";
import { cookies } from "next/headers";
import { attachReferral, REF_COOKIE } from "@/lib/referral";

// Lien de connexion envoyé par IdeaForge : vérifie le jeton puis ouvre la session.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") === "email" ? "email" : "magiclink";
  const saved = cookies().get("if_next")?.value;
  let next = saved ? decodeURIComponent(saved) : "/";
  if (!next.startsWith("/") || next.startsWith("//")) next = "/";

  if (token_hash) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.verifyOtp({ token_hash, type });
    if (!error && data?.user) {
      await onSignIn(data.user.id, "email");
      const ref = cookies().get(REF_COOKIE)?.value;
      if (ref) await attachReferral(data.user.id, ref);
      const res = NextResponse.redirect(`${origin}${next}`);
      if (saved) res.cookies.set("if_next", "", { maxAge: 0, path: "/" });
      return res;
    }
  }
  return NextResponse.redirect(`${origin}/login?error=lien`);
}
