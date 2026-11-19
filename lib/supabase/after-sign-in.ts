import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import type { User } from "@supabase/supabase-js";
import { onSignIn } from "@/lib/email/flows";
import { attachReferral, REF_COOKIE } from "@/lib/referral";

// Page où revenir après la connexion (?next= ou cookie if_next posé par /login).
export function nextPath(searchParams: URLSearchParams): { next: string; saved: boolean } {
  const saved = cookies().get("if_next")?.value;
  let next = searchParams.get("next") ?? (saved ? decodeURIComponent(saved) : "/");
  if (!next.startsWith("/") || next.startsWith("//")) next = "/";
  return { next, saved: !!saved };
}

// Après une connexion réussie : e-mail de bienvenue, parrainage, puis redirection.
export async function afterSignIn(user: User | null | undefined, origin: string, searchParams: URLSearchParams) {
  const { next, saved } = nextPath(searchParams);
  // Première connexion : e-mail de bienvenue + alerte admin (ne fait rien les fois suivantes).
  if (user) await onSignIn(user.id, user.app_metadata?.provider as string | undefined);
  // Venu par un lien de parrainage : on rattache le compte à son parrain.
  const ref = cookies().get(REF_COOKIE)?.value;
  if (user && ref) await attachReferral(user.id, ref);
  const res = NextResponse.redirect(`${origin}${next}`, 303);
  if (saved) res.cookies.set("if_next", "", { maxAge: 0, path: "/" });
  return res;
}
