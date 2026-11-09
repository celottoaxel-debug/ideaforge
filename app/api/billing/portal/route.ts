import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

// « Gérer / résilier mon abonnement » : ouvre l'espace client Stripe (résiliation en quelques clics).
export async function GET(request: Request) {
  const site = (process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin).replace(/\/$/, "");
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${site}/login`);

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("stripe_customer_id").eq("id", user.id).maybeSingle();
  let customer = (profile?.stripe_customer_id as string | null) ?? null;

  // Repli : retrouver le client Stripe via l'abonnement créé par IdeaForge (metadata user_id).
  if (!customer) {
    try {
      const found = await stripe.subscriptions.search({ query: `metadata['user_id']:'${user.id}'`, limit: 1 });
      const c = found.data[0]?.customer;
      customer = typeof c === "string" ? c : c?.id ?? null;
      if (customer) await admin.from("profiles").update({ stripe_customer_id: customer }).eq("id", user.id);
    } catch (e) {
      console.error("[billing] recherche abonnement", e);
    }
  }
  if (!customer) return NextResponse.redirect(`${site}/compte?billing=none`);

  try {
    const portal = await stripe.billingPortal.sessions.create({ customer, return_url: `${site}/` });
    return NextResponse.redirect(portal.url);
  } catch (e) {
    console.error("[billing] portail", e);
    return NextResponse.redirect(`${site}/compte?billing=error`);
  }
}
