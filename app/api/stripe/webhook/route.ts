import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

// Webhook Stripe : à l'achat réussi, passe profiles.plan = 'lifetime'.
// Utilise le corps BRUT (text) pour vérifier la signature.
export async function POST(request: Request) {
  const body = await request.text();
  const sig = headers().get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "no_signature" }, { status: 400 });

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "bad_signature";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as { client_reference_id?: string | null; metadata?: Record<string, string> | null };
    const userId = session.client_reference_id || session.metadata?.user_id;
    const plan = session.metadata?.plan === "monthly" ? "monthly" : "lifetime";
    if (userId) {
      const admin = createAdminClient();
      await admin.from("profiles").update({ plan }).eq("id", userId);
    }
  }
  // Fin d'abonnement mensuel : on repasse en free.
  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as { metadata?: Record<string, string> | null };
    const userId = sub.metadata?.user_id;
    if (userId) {
      const admin = createAdminClient();
      await admin.from("profiles").update({ plan: "free" }).eq("id", userId);
    }
  }

  return NextResponse.json({ received: true });
}
