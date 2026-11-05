import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

// Crée une session de paiement Stripe.
// body: { plan: "lifetime" | "monthly" }. L'utilisateur doit être connecté.
export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "auth" }, { status: 401 });

  let plan: "lifetime" | "monthly" = "lifetime";
  try {
    const body = await request.json();
    if (body?.plan === "monthly") plan = "monthly";
  } catch {}

  const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const price = plan === "monthly"
    ? process.env.STRIPE_MONTHLY_PRICE_ID
    : process.env.STRIPE_LIFETIME_PRICE_ID;

  if (!price) {
    return NextResponse.json({ error: "price_not_configured" }, { status: 500 });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: plan === "monthly" ? "subscription" : "payment",
      line_items: [{ price, quantity: 1 }],
      client_reference_id: user.id,
      customer_email: user.email ?? undefined,
      metadata: { user_id: user.id, plan },
      success_url: `${site}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${site}/#pricing`,
      allow_promotion_codes: true,
      // Expire au bout de 2 h sans paiement => Stripe envoie checkout.session.expired => e-mail de relance.
      expires_at: Math.floor(Date.now() / 1000) + 2 * 60 * 60,
      // Pour retrouver l'utilisateur quand l'abonnement mensuel est résilié.
      ...(plan === "monthly" ? { subscription_data: { metadata: { user_id: user.id, plan } } } : {}),
    });
    return NextResponse.json({ url: session.url });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "stripe_error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
