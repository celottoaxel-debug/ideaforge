import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { onPayment, onReferralReward } from "@/lib/email/flows";
import { onReferralPaid } from "@/lib/referral";

export type PaidPlan = "lifetime" | "monthly";

// Donne le plan à l'utilisateur. Upsert : marche même si la ligne profiles n'existe pas encore.
// Renvoie le plan précédent (pour savoir si c'est un nouveau paiement).
export async function grantPlan(userId: string, plan: PaidPlan | "free", email?: string | null, customerId?: string | null): Promise<{ plan: string | null; locale: string | null }> {
  const admin = createAdminClient();
  const { data: prev } = await admin.from("profiles").select("plan, locale").eq("id", userId).maybeSingle();
  const row: Record<string, string> = { id: userId, plan };
  if (email) row.email = email;
  if (customerId) row.stripe_customer_id = customerId;
  const { error } = await admin.from("profiles").upsert(row, { onConflict: "id" });
  if (error) {
    console.error("[grantPlan] échec", userId, plan, error.message);
    throw new Error(error.message);
  }
  return { plan: (prev?.plan as string | undefined) ?? null, locale: (prev?.locale as string | undefined) ?? null };
}

// Vérifie une session Checkout auprès de Stripe et débloque le plan si elle est payée.
// Renvoie le plan accordé, ou null si la session n'est pas (encore) payée.
export async function grantFromCheckoutSession(
  sessionOrId: string | Stripe.Checkout.Session,
  expectedUserId?: string
): Promise<PaidPlan | null> {
  const session =
    typeof sessionOrId === "string" ? await stripe.checkout.sessions.retrieve(sessionOrId) : sessionOrId;

  const userId = session.client_reference_id || session.metadata?.user_id;
  if (!userId) return null;
  if (expectedUserId && userId !== expectedUserId) return null;

  const paid = session.payment_status === "paid" || session.payment_status === "no_payment_required";
  if (session.status !== "complete" || !paid) return null;

  const plan: PaidPlan = session.metadata?.plan === "monthly" ? "monthly" : "lifetime";
  const email = session.customer_details?.email ?? session.customer_email;
  const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;
  const previous = await grantPlan(userId, plan, email, customerId);

  // Alerte « nouveau paiement » une seule fois (la page succès et le webhook passent tous deux ici).
  if (previous.plan !== plan) {
    try { await onPayment(email, plan, session.amount_total, session.currency, previous.locale); } catch (e) { console.error("[email] onPayment", e); }
  }
  // Parrainage : premier paiement d'un filleul -> paliers du parrain (ne s'exécute qu'une fois par filleul)
  if (previous.plan !== "lifetime" && previous.plan !== "monthly") {
    try {
      const r = await onReferralPaid(userId, plan, session.amount_total);
      if (r) await onReferralReward(email, r);
    } catch (e) { console.error("[referral] paid", e); }
  }
  return plan;
}
