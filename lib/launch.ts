// Offre de lancement : l'accès à vie à 99 € au lieu de 129 €, pour les 50 premiers acheteurs.
// Le compteur est réel : il compte les comptes « à vie » ayant payé via Stripe.
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";
import { PRICE_LIFETIME, PRICE_MONTHLY } from "@/lib/admin";

export const LAUNCH = { price: 99, seats: 50, coupon: "LANCEMENT99" };
export type LaunchStatus = { active: boolean; remaining: number; sold: number; price: number; full: number };

export async function launchStatus(): Promise<LaunchStatus> {
  let sold = LAUNCH.seats; // en cas d'erreur, on n'affiche pas d'offre
  try {
    const { count, error } = await createAdminClient().from("profiles").select("id", { count: "exact", head: true }).eq("plan", "lifetime").not("stripe_customer_id", "is", null);
    if (!error) sold = count ?? 0;
  } catch {}
  const remaining = Math.max(0, LAUNCH.seats - sold);
  const active = remaining > 0;
  return { active, remaining, sold, price: active ? LAUNCH.price : PRICE_LIFETIME, full: PRICE_LIFETIME };
}

/** Crée (une seule fois) le coupon Stripe de -30 € et renvoie son identifiant. */
export async function ensureLaunchCoupon(): Promise<string | null> {
  try { await stripe.coupons.retrieve(LAUNCH.coupon); return LAUNCH.coupon; } catch {}
  try {
    await stripe.coupons.create({ id: LAUNCH.coupon, amount_off: (PRICE_LIFETIME - LAUNCH.price) * 100, currency: "eur", duration: "once", name: "Offre de lancement" });
    return LAUNCH.coupon;
  } catch (e) { console.error("[launch] coupon", e); return null; }
}

/** Met les textes du site au prix en vigueur (99 € pendant l'offre, 129 € ensuite). */
export function withLaunch<T extends Record<string, string>>(t: T, st: LaunchStatus, locale: string): T {
  const p = st.price;
  const months = (p / PRICE_MONTHLY).toFixed(1).replace(".", locale === "en" ? "." : ",");
  const L = {
    fr: { hero: `Débloquer toutes les fiches, ${p} € à vie`, compare: `${PRICE_MONTHLY} €/mois = ${PRICE_MONTHLY * 12} €/an. À vie : ${p} € une fois, rentabilisé en ${months} mois.`,
      note: st.active ? `⚡ Offre de lancement : ${p} € au lieu de ${st.full} € pour les ${LAUNCH.seats} premiers, il reste ${st.remaining} place${st.remaining > 1 ? "s" : ""}. Paiement unique, garantie 14 jours.` : `Paiement unique, garantie 14 jours satisfait ou remboursé.` },
    en: { hero: `Unlock every sheet, €${p} lifetime`, compare: `€${PRICE_MONTHLY}/mo = €${PRICE_MONTHLY * 12}/yr. Lifetime: €${p} once, paid off in ${months} months.`,
      note: st.active ? `⚡ Launch offer: €${p} instead of €${st.full} for the first ${LAUNCH.seats}, ${st.remaining} seat${st.remaining > 1 ? "s" : ""} left. One-time payment, 14-day guarantee.` : `One-time payment, 14-day money-back guarantee.` },
    es: { hero: `Desbloquear todas las fichas, ${p} € de por vida`, compare: `${PRICE_MONTHLY} €/mes = ${PRICE_MONTHLY * 12} €/año. De por vida: ${p} € una vez, amortizado en ${months} meses.`,
      note: st.active ? `⚡ Oferta de lanzamiento: ${p} € en lugar de ${st.full} € para los ${LAUNCH.seats} primeros, quedan ${st.remaining} plaza${st.remaining > 1 ? "s" : ""}. Pago único, garantía de 14 días.` : `Pago único, garantía de 14 días.` },
  }[locale as "fr" | "en" | "es"] ?? null;
  if (!L) return t;
  const out: Record<string, string> = { ...t, hero_cta: L.hero, compare: L.compare, places_note: L.note };
  if (out.gate_sub) out.gate_sub = out.gate_sub.replace(/129 ?€|€129/g, locale === "en" ? `€${p}` : `${p} €`);
  if (out.p_l_cta) out.p_l_cta = out.p_l_cta.replace(/129 ?€|€129/g, locale === "en" ? `€${p}` : `${p} €`);
  return out as T;
}
