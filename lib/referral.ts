// Système de parrainage IdeaForge.
// Lien : ideaforges.io/?ref=CODE -> cookie 30 jours -> rattaché au compte à l'inscription.
// Quand le filleul paie : -20 % sur sa 1re commande, et le parrain avance vers 3 paliers :
//   1 ami payant  -> 1 mois membre offert
//   3 amis payants -> accès à vie offert
//   10 amis payants -> son SaaS codé en priorité avec -30 % sur le devis (livré à la main par l'admin)
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";

export const REF_COOKIE = "if_ref";
export const REF_COUPON = "PARRAINAGE20";
export const TIERS = [
  { tier: 1 as const, need: 1, emoji: "✨", name: "1 mois membre offert", short: "1 mois offert" },
  { tier: 2 as const, need: 3, emoji: "🔥", name: "Accès à vie offert", short: "Accès à vie" },
  { tier: 3 as const, need: 10, emoji: "🚀", name: "Ton SaaS codé en priorité, -30 % sur le devis", short: "SaaS -30 %" },
];
export type Tier = 1 | 2 | 3;

const PAID = new Set(["lifetime", "monthly"]);
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789"; // sans 0/o, 1/l/i

export function cleanCode(raw: string | null | undefined): string | null {
  const c = (raw || "").trim().toLowerCase();
  return /^[a-z0-9]{4,16}$/.test(c) ? c : null;
}

function randomCode(n = 7) {
  let s = "";
  for (let i = 0; i < n; i++) s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return s;
}

/** Renvoie le code de parrainage de l'utilisateur, en le créant au besoin. */
export async function ensureRefCode(userId: string, email?: string | null): Promise<string> {
  const admin = createAdminClient();
  const { data } = await admin.from("profiles").select("ref_code").eq("id", userId).maybeSingle();
  if (data?.ref_code) return data.ref_code as string;
  for (let i = 0; i < 6; i++) {
    const code = randomCode();
    const row: Record<string, string> = { id: userId, ref_code: code };
    if (email && !data) row.email = email;
    const { error } = data
      ? await admin.from("profiles").update({ ref_code: code }).eq("id", userId).is("ref_code", null)
      : await admin.from("profiles").upsert(row, { onConflict: "id" });
    if (!error) {
      const { data: again } = await admin.from("profiles").select("ref_code").eq("id", userId).maybeSingle();
      if (again?.ref_code) return again.ref_code as string;
    }
  }
  throw new Error("ref_code");
}

/** Rattache un nouvel inscrit à son parrain (une seule fois, jamais à soi-même, jamais un client déjà payant). */
export async function attachReferral(userId: string, rawCode: string | null | undefined): Promise<boolean> {
  const code = cleanCode(rawCode);
  if (!code) return false;
  try {
    const admin = createAdminClient();
    const { data: referrer } = await admin.from("profiles").select("id").eq("ref_code", code).maybeSingle();
    if (!referrer || referrer.id === userId) return false;
    const { data: me } = await admin.from("profiles").select("plan, referred_by").eq("id", userId).maybeSingle();
    if (!me || me.referred_by || PAID.has(me.plan as string)) return false;
    const { data: upd } = await admin.from("profiles").update({ referred_by: referrer.id }).eq("id", userId).is("referred_by", null).select("id");
    if (!upd?.length) return false;
    await admin.from("referrals").upsert({ referrer_id: referrer.id, referred_id: userId }, { onConflict: "referred_id", ignoreDuplicates: true });
    return true;
  } catch (e) {
    console.error("[referral] attach", e);
    return false;
  }
}

/** Vrai si l'utilisateur a été parrainé et n'a encore jamais payé : il a droit à -20 %. */
export async function hasReferralDiscount(userId: string): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const { data } = await admin.from("profiles").select("plan, referred_by").eq("id", userId).maybeSingle();
    if (!data?.referred_by || PAID.has(data.plan as string)) return false;
    const { data: r } = await admin.from("referrals").select("status").eq("referred_id", userId).maybeSingle();
    return r?.status !== "paid";
  } catch { return false; }
}

/** Crée le coupon Stripe -20 % (une seule fois) et renvoie son identifiant. */
export async function ensureReferralCoupon(): Promise<string | null> {
  try {
    await stripe.coupons.retrieve(REF_COUPON);
    return REF_COUPON;
  } catch {
    try {
      await stripe.coupons.create({ id: REF_COUPON, percent_off: 20, duration: "once", name: "Parrainage -20 %" });
      return REF_COUPON;
    } catch (e) {
      console.error("[referral] coupon", e);
      return null;
    }
  }
}

export type RewardResult = { referrerEmail: string | null; referrerLocale: string | null; paidCount: number; newTiers: { tier: Tier; status: string }[] };

/**
 * Le filleul vient de payer : marque le parrainage comme payé (une seule fois),
 * puis débloque les paliers atteints par le parrain.
 */
export async function onReferralPaid(userId: string, plan: string, amountCents: number | null): Promise<RewardResult | null> {
  const admin = createAdminClient();
  const { data: rows } = await admin
    .from("referrals")
    .update({ status: "paid", paid_at: new Date().toISOString(), plan, amount_cents: amountCents })
    .eq("referred_id", userId)
    .eq("status", "signed_up")
    .select("referrer_id");
  const referrerId = rows?.[0]?.referrer_id as string | undefined;
  if (!referrerId) return null;

  const { count } = await admin.from("referrals").select("id", { count: "exact", head: true }).eq("referrer_id", referrerId).eq("status", "paid");
  const paidCount = count ?? 0;
  const { data: ref } = await admin.from("profiles").select("plan, email, locale, bonus_until, stripe_customer_id").eq("id", referrerId).maybeSingle();
  const newTiers: { tier: Tier; status: string }[] = [];

  for (const t of TIERS) {
    if (paidCount < t.need) continue;
    const lifetime = ref?.plan === "lifetime" || newTiers.some((n) => n.tier === 2 && n.status === "granted");
    const status = t.tier === 3 ? "pending" : lifetime ? "included" : "granted";
    // « Réserve » le palier : la contrainte unique empêche de le donner deux fois.
    const { data: claimed } = await admin
      .from("referral_rewards")
      .upsert({ user_id: referrerId, tier: t.tier, status }, { onConflict: "user_id,tier", ignoreDuplicates: true })
      .select("id");
    if (!claimed?.length) continue;
    newTiers.push({ tier: t.tier, status });
    if (status !== "granted") continue;

    if (t.tier === 1) {
      const base = ref?.bonus_until && new Date(ref.bonus_until as string) > new Date() ? new Date(ref.bonus_until as string) : new Date();
      base.setDate(base.getDate() + 30);
      await admin.from("profiles").update({ bonus_until: base.toISOString() }).eq("id", referrerId);
    }
    if (t.tier === 2) {
      await admin.from("profiles").update({ plan: "lifetime" }).eq("id", referrerId);
      // Il passe à vie : on arrête son abonnement mensuel pour qu'il ne paie plus.
      if (ref?.plan === "monthly" && ref.stripe_customer_id) {
        try {
          const subs = await stripe.subscriptions.list({ customer: ref.stripe_customer_id as string, status: "active", limit: 10 });
          for (const s of subs.data) await stripe.subscriptions.cancel(s.id);
        } catch (e) { console.error("[referral] cancel sub", e); }
      }
    }
  }
  return { referrerEmail: (ref?.email as string) ?? null, referrerLocale: (ref?.locale as string) ?? null, paidCount, newTiers };
}

/** Masque un e-mail pour l'afficher au parrain : ju***@gmail.com */
export function maskEmail(e: string | null | undefined) {
  if (!e) return "Compte sans e-mail";
  const [u, d] = e.split("@");
  return `${u.slice(0, 2)}${"*".repeat(Math.max(2, Math.min(5, u.length - 2)))}@${d ?? ""}`;
}
