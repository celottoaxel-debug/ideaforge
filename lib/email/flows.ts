import { createAdminClient } from "@/lib/supabase/admin";
import { IDEAS } from "@/lib/ideas";
import { scoreIdea } from "@/lib/score";
import { ADMIN_EMAILS } from "@/lib/admin";
import { sendEmail, sendBatch, emailEnabled, type Email } from "@/lib/email/resend";
import { siteUrl, unsubUrl } from "@/lib/email/unsubscribe";
import {
  lang, welcomeEmail, adminSignupEmail, adminPaymentEmail, abandonedEmail, nurtureEmail, dropEmail, memberWelcomeEmail, winbackEmail, referralRewardEmail, adminReferralEmail, type MailIdea,
} from "@/lib/email/templates";

const DAY = 86_400_000;

function toMail(i: { id: string; title: string; pitch?: string | null; budget?: string | null; revenue?: string | null; sector?: string | null }): MailIdea {
  return { id: i.id, title: i.title, pitch: i.pitch, budget: i.budget, revenue: i.revenue, sector: i.sector };
}

// Les 3 idées les mieux notées parmi celles qu'on peut lancer avec un petit budget.
export function topIdeas(n = 3): MailIdea[] {
  return [...IDEAS]
    .filter((i) => (i.budget_min ?? 0) <= 5000)
    .sort((a, b) => scoreIdea(b).score - scoreIdea(a).score)
    .slice(0, n)
    .map(toMail);
}

// ---------- Inscription : bienvenue + alerte admin (une seule fois par compte) ----------
export async function onSignIn(userId: string, provider?: string) {
  if (!emailEnabled()) return;
  try {
    const admin = createAdminClient();
    // « Réserve » l'envoi de façon atomique : seule la première connexion obtient la ligne.
    const { data } = await admin
      .from("profiles")
      .update({ welcome_sent_at: new Date().toISOString() })
      .eq("id", userId)
      .is("welcome_sent_at", null)
      .select("email, locale")
      .maybeSingle();
    if (!data?.email) return;

    const site = siteUrl();
    const w = welcomeEmail(lang(data.locale), site);
    const a = adminSignupEmail(data.email, site, provider);
    await Promise.all([
      sendEmail({ to: data.email, ...w, tag: "welcome" }),
      ...ADMIN_EMAILS.map((to) => sendEmail({ to, ...a, tag: "admin_signup" })),
    ]);
  } catch (e) {
    console.error("[email] onSignIn", e);
  }
}

// ---------- Paiement : e-mail de bienvenue membre + alerte admin ----------
export async function onPayment(email: string | null | undefined, plan: string, amountCents: number | null, currency: string | null, locale?: string | null) {
  if (!emailEnabled()) return;
  if (email) {
    const w = memberWelcomeEmail(plan, lang(locale), siteUrl());
    await sendEmail({ to: email, ...w, tag: "member_welcome" });
  }
  const amount = amountCents != null
    ? new Intl.NumberFormat("fr-FR", { style: "currency", currency: (currency || "eur").toUpperCase() }).format(amountCents / 100)
    : "?";
  const m = adminPaymentEmail(email || "(e-mail inconnu)", plan, amount, siteUrl());
  await Promise.all(ADMIN_EMAILS.map((to) => sendEmail({ to, ...m, tag: "admin_payment" })));
}

// ---------- Paiement abandonné (session Stripe expirée) ----------
export async function onCheckoutExpired(userId: string | null | undefined) {
  if (!userId || !emailEnabled()) return;
  const admin = createAdminClient();
  const weekAgo = new Date(Date.now() - 7 * DAY).toISOString();
  // Une relance max par semaine, uniquement si la personne n'a toujours pas payé et n'est pas désinscrite.
  const { data } = await admin
    .from("profiles")
    .update({ abandoned_sent_at: new Date().toISOString() })
    .eq("id", userId)
    .eq("plan", "free")
    .eq("email_opt_out", false)
    .or(`abandoned_sent_at.is.null,abandoned_sent_at.lt.${weekAgo}`)
    .select("email, locale")
    .maybeSingle();
  if (!data?.email) return;
  const m = abandonedEmail(lang(data.locale), siteUrl(), unsubUrl(data.email));
  await sendEmail({ to: data.email, ...m, unsubscribeUrl: unsubUrl(data.email), tag: "abandoned" });
}

// ---------- Relances J+1 / J+3 / J+7 des inscrits gratuits ----------
const STEPS: { step: 1 | 2 | 3; days: number }[] = [
  { step: 1, days: 1 },
  { step: 2, days: 3 },
  { step: 3, days: 7 },
];

export async function runNurture() {
  const admin = createAdminClient();
  const site = siteUrl();
  const ideas = topIdeas(3);
  const result: Record<string, number> = {};

  for (const { step, days } of STEPS) {
    const before = new Date(Date.now() - days * DAY).toISOString();
    const { data: rows, error } = await admin
      .from("profiles")
      .select("id, email, locale")
      .eq("plan", "free")
      .eq("email_opt_out", false)
      .eq("nurture_step", step - 1)
      .lte("created_at", before)
      .not("email", "is", null)
      .limit(200);
    if (error) { console.error("[email] nurture", error.message); continue; }
    if (!rows?.length) { result[`J+${days}`] = 0; continue; }

    const mails: Email[] = rows.map((r) => {
      const u = unsubUrl(r.email as string);
      return { to: r.email as string, ...nurtureEmail(step, lang(r.locale), site, u, ideas), unsubscribeUrl: u, tag: `nurture_${step}` };
    });
    const sent = await sendBatch(mails);
    // On avance l'étape même si un envoi isolé échoue, pour ne jamais spammer quelqu'un en boucle.
    if (sent > 0) await admin.from("profiles").update({ nurture_step: step }).in("id", rows.map((r) => r.id));
    result[`J+${days}`] = sent;
  }
  return result;
}

// ---------- Drop hebdo aux abonnés newsletter (le lundi) ----------
export async function runWeeklyDrop() {
  const admin = createAdminClient();
  const site = siteUrl();

  // Idées découvertes cette semaine par l'IA, sinon une sélection du catalogue qui tourne chaque semaine.
  const since = new Date(Date.now() - 7 * DAY).toISOString();
  const { data: fresh } = await admin
    .from("ideas")
    .select("id, title, pitch, budget, revenue, sector")
    .eq("is_ai", true)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(3);
  let ideas: MailIdea[] = (fresh ?? []).map(toMail);
  if (ideas.length < 3) {
    const week = Math.floor(Date.now() / (7 * DAY));
    const pool = IDEAS.filter((i) => !ideas.some((x) => x.id === i.id));
    for (let k = 0; ideas.length < 3 && k < pool.length; k++) ideas.push(toMail(pool[(week * 3 + k) % pool.length]));
  }

  const sixDaysAgo = new Date(Date.now() - 6 * DAY).toISOString();
  const { data: subs, error } = await admin
    .from("newsletter_subscribers")
    .select("id, email, locale")
    .is("unsubscribed_at", null)
    .or(`last_drop_at.is.null,last_drop_at.lt.${sixDaysAgo}`)
    .limit(1000);
  if (error) { console.error("[email] drop", error.message); return 0; }
  if (!subs?.length) return 0;

  const mails: Email[] = subs.map((s) => {
    const u = unsubUrl(s.email);
    return { to: s.email, ...dropEmail(lang(s.locale), site, u, ideas), unsubscribeUrl: u, tag: "drop" };
  });
  const sent = await sendBatch(mails);
  if (sent > 0) await admin.from("newsletter_subscribers").update({ last_drop_at: new Date().toISOString() }).in("id", subs.map((s) => s.id));
  return sent;
}

// ---------- Abonnement mensuel résilié : repasse en gratuit + propose l'accès à vie ----------
// Ne touche pas un compte qui a entre-temps pris l'accès à vie.
export async function onSubscriptionEnded(userId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .update({ plan: "free" })
    .eq("id", userId)
    .eq("plan", "monthly")
    .select("email, locale, email_opt_out")
    .maybeSingle();
  if (!data?.email || data.email_opt_out || !emailEnabled()) return;
  const u = unsubUrl(data.email);
  await sendEmail({ to: data.email, ...winbackEmail(lang(data.locale), siteUrl(), u), unsubscribeUrl: u, tag: "winback" });
}

// ---------- Parrainage : le filleul a payé ----------
export async function onReferralReward(referredEmail: string | null | undefined, r: { referrerEmail: string | null; referrerLocale: string | null; paidCount: number; newTiers: { tier: number; status: string }[] }) {
  if (!emailEnabled()) return;
  const site = siteUrl();
  const jobs: Promise<boolean>[] = [];
  if (r.referrerEmail) jobs.push(sendEmail({ to: r.referrerEmail, ...referralRewardEmail(lang(r.referrerLocale), site, r.paidCount, r.newTiers), tag: "referral_reward" }));
  const a = adminReferralEmail(r.referrerEmail ?? "?", referredEmail ?? "?", r.paidCount, r.newTiers, site);
  ADMIN_EMAILS.forEach((to) => jobs.push(sendEmail({ to, ...a, tag: "admin_referral" })));
  await Promise.all(jobs);
}
