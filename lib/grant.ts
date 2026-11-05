import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export type PaidPlan = "lifetime" | "monthly";

// Donne le plan à l'utilisateur. Upsert : marche même si la ligne profiles n'existe pas encore.
export async function grantPlan(userId: string, plan: PaidPlan | "free", email?: string | null) {
  const admin = createAdminClient();
  const row: Record<string, string> = { id: userId, plan };
  if (email) row.email = email;
  const { error } = await admin.from("profiles").upsert(row, { onConflict: "id" });
  if (error) {
    console.error("[grantPlan] échec", userId, plan, error.message);
    throw new Error(error.message);
  }
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
  await grantPlan(userId, plan, session.customer_details?.email ?? session.customer_email);
  return plan;
}
