import { NextResponse } from "next/server";
import { headers } from "next/headers";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { grantFromCheckoutSession, grantPlan } from "@/lib/grant";
import { onCheckoutExpired } from "@/lib/email/flows";

export const dynamic = "force-dynamic";

// Webhook Stripe : à l'achat réussi, passe profiles.plan = 'lifetime' (ou 'monthly').
// Utilise le corps BRUT (text) pour vérifier la signature.
export async function POST(request: Request) {
  const body = await request.text();
  const sig = headers().get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "no_signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "bad_signature";
    console.error("[stripe webhook] signature invalide :", msg);
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  try {
    // Paiement réussi (carte) ou paiement différé finalement réussi (virement, etc.).
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      await grantFromCheckoutSession(event.data.object as Stripe.Checkout.Session);
    }

    // Paiement abandonné : la session Stripe a expiré sans paiement => e-mail de relance.
    if (event.type === "checkout.session.expired") {
      const s = event.data.object as Stripe.Checkout.Session;
      await onCheckoutExpired(s.client_reference_id || s.metadata?.user_id);
    }

    // Fin d'abonnement mensuel : on repasse en free (sauf si la personne a aussi l'accès à vie).
    if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.user_id;
      if (userId) await grantPlan(userId, "free");
    }
  } catch (e) {
    // 500 => Stripe réessaiera automatiquement.
    const msg = e instanceof Error ? e.message : "grant_failed";
    console.error("[stripe webhook]", event.type, msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
