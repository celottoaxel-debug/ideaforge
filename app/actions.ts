"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { sendTop10 } from "@/lib/email/flows";

// Enregistre une demande de devis (table quote_requests — insertion ouverte à tous).
export async function submitQuote(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const description = String(formData.get("description") || "").trim();
  if (!description) return { ok: false, error: "empty" };

  const { error } = await supabase.from("quote_requests").insert({
    user_id: user?.id ?? null,
    description,
    sector: String(formData.get("sector") || "") || null,
    budget: String(formData.get("budget") || "") || null,
    email: String(formData.get("email") || "") || null,
    locale: "fr",
  });
  return error ? { ok: false, error: error.message } : { ok: true };
}

// Inscription à la newsletter (table newsletter_subscribers).
export async function subscribeNewsletter(formData: FormData) {
  const supabase = createClient();
  const email = String(formData.get("email") || "").trim();
  if (!email) return { ok: false, error: "empty" };
  const { error } = await supabase
    .from("newsletter_subscribers")
    .insert({ email, locale: "fr", source: "drop" });
  // 23505 = doublon (déjà inscrit) : on considère ça comme un succès, et on réabonne si la personne s'était désinscrite.
  if (error && error.code !== "23505") return { ok: false, error: error.message };
  if (error?.code === "23505" && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    await createAdminClient().from("newsletter_subscribers").update({ unsubscribed_at: null }).ilike("email", email);
  }
  return { ok: true };
}

// Ajoute/retire un favori (table favorites — réservé aux connectés).
export async function toggleFavorite(ideaId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "auth" };

  const { data: existing } = await supabase
    .from("favorites")
    .select("idea_id")
    .eq("user_id", user.id)
    .eq("idea_id", ideaId)
    .maybeSingle();

  if (existing) {
    await supabase.from("favorites").delete().eq("user_id", user.id).eq("idea_id", ideaId);
  } else {
    await supabase.from("favorites").insert({ user_id: user.id, idea_id: ideaId });
  }
  revalidatePath("/");
  return { ok: true, saved: !existing };
}

// Aimant à e-mails : « le Top 10 des idées les mieux notées », envoyé tout de suite par e-mail.
export async function getTop10(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "email" };
  const locale = cookies().get("locale")?.value ?? "fr";
  const src = String(formData.get("source") || "top10").slice(0, 20);
  const supabase = createClient();
  const { error } = await supabase.from("newsletter_subscribers").insert({ email, locale, source: src });
  if (error && error.code !== "23505") return { ok: false, error: error.message };
  if (error?.code === "23505" && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    await createAdminClient().from("newsletter_subscribers").update({ unsubscribed_at: null }).ilike("email", email);
  }
  try { await sendTop10(email, locale); } catch (e) { console.error("[top10]", e); }
  return { ok: true };
}
