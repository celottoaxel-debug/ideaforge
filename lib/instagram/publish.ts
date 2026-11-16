// Publication sur Instagram via l'API officielle (graph.instagram.com ou graph.facebook.com selon le jeton).
// Réglages : INSTAGRAM_TOKEN (jeton longue durée) dans Vercel. Le jeton est ensuite renouvelé
// automatiquement et rangé dans la table app_settings (il expire au bout de 60 jours sinon).
import { createAdminClient } from "@/lib/supabase/admin";
import { SITE } from "@/lib/seo";
import { buildDraft, kindForToday, type Kind, type Slide } from "@/lib/instagram/content";

// Deux sortes de jetons existent : « IGAA… » (connexion Instagram → graph.instagram.com)
// et « EAA… » (connexion unifiée / Facebook → graph.facebook.com). On gère les deux.
const IG_API = "https://graph.instagram.com/v21.0";
const FB_API = "https://graph.facebook.com/v21.0";
// Identifiant du compte @ideasforge.io (pas secret), modifiable via INSTAGRAM_USER_ID.
const IG_USER_ID = process.env.INSTAGRAM_USER_ID || "17841462242150942";
let API = IG_API;
const apiFor = (token: string) => (token.startsWith("IG") ? IG_API : FB_API);

async function setting(key: string): Promise<string | null> {
  try {
    const { data } = await createAdminClient().from("app_settings").select("value").eq("key", key).maybeSingle();
    return (data?.value as string) ?? null;
  } catch { return null; }
}
async function saveSetting(key: string, value: string) {
  await createAdminClient().from("app_settings").upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
}

export async function igToken(): Promise<string | null> {
  return (await setting("ig_token")) || process.env.INSTAGRAM_TOKEN || null;
}

async function ig(path: string, params: Record<string, string>, method: "GET" | "POST" = "POST") {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${API}/${path}${method === "GET" ? `?${qs}` : ""}`, method === "POST" ? { method, headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: qs } : {});
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.error) throw new Error(json.error?.message || `Instagram ${res.status}`);
  return json;
}

/** Compte connecté (vérifie aussi que le jeton marche). */
export async function igAccount(): Promise<{ ok: boolean; id?: string; username?: string; error?: string }> {
  const token = (await igToken())?.trim();
  if (!token) return { ok: false, error: "INSTAGRAM_TOKEN absent" };
  API = apiFor(token);
  try {
    if (API === IG_API) {
      const me = await ig("me", { fields: "user_id,username", access_token: token }, "GET");
      return { ok: true, id: String(me.user_id || me.id), username: me.username };
    }
    const me = await ig(IG_USER_ID, { fields: "id,username", access_token: token }, "GET");
    return { ok: true, id: String(me.id), username: me.username };
  } catch (e) { return { ok: false, error: e instanceof Error ? e.message : String(e) }; }
}

/** Renouvelle le jeton (valable 60 jours de plus). Appelé chaque semaine par la tâche quotidienne. */
export async function refreshIgToken(): Promise<boolean> {
  const token = await igToken();
  if (!token || !token.startsWith("IG")) return false; // les jetons « EAA… » système n'expirent pas
  API = IG_API;
  try {
    const r = await ig("../refresh_access_token", { grant_type: "ig_refresh_token", access_token: token }, "GET");
    if (r.access_token) { await saveSetting("ig_token", r.access_token); return true; }
  } catch (e) { console.error("[ig] refresh", e); }
  return false;
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function waitReady(id: string, token: string) {
  for (let i = 0; i < 20; i++) {
    const s = await ig(id, { fields: "status_code", access_token: token }, "GET");
    if (s.status_code === "FINISHED") return;
    if (s.status_code === "ERROR" || s.status_code === "EXPIRED") throw new Error(`Conteneur ${s.status_code}`);
    await wait(3000);
  }
  throw new Error("Instagram met trop de temps à traiter les images");
}

/** Crée un brouillon de carrousel (sans publier). */
export async function createPost(kind: Kind, slot?: string) {
  const admin = createAdminClient();
  const { data: prev } = await admin.from("ig_posts").select("ideas, kind").order("created_at", { ascending: false }).limit(200);
  const used = new Set<string>((prev ?? []).flatMap((p) => (p.ideas as string[]) ?? []));
  const themeIndex = (prev ?? []).filter((p) => p.kind === "top5").length;
  const d = await buildDraft(kind, used, themeIndex);
  const { data, error } = await admin.from("ig_posts").insert({ kind: d.kind, slot: slot ?? null, ideas: d.ideas, slides: d.slides, caption: d.caption, theme: d.theme ?? null, status: "draft" }).select("id").single();
  if (error) throw new Error(error.message);
  return data.id as number;
}

/** Publie un brouillon sur Instagram. */
export async function publishPost(id: number): Promise<{ ok: boolean; permalink?: string; error?: string }> {
  const admin = createAdminClient();
  const { data: post } = await admin.from("ig_posts").select("*").eq("id", id).maybeSingle();
  if (!post) return { ok: false, error: "Carrousel introuvable" };
  if (post.status === "published") return { ok: true, permalink: post.permalink };
  const token = (await igToken())?.trim();
  if (!token) return { ok: false, error: "Instagram n'est pas encore connecté (INSTAGRAM_TOKEN)" };
  try {
    const acc = await igAccount();
    if (!acc.ok || !acc.id) throw new Error(acc.error || "Compte Instagram introuvable");
    const slides = (post.slides as Slide[]).slice(0, 10);
    const children: string[] = [];
    for (let n = 1; n <= slides.length; n++) {
      const c = await ig(`${acc.id}/media`, { image_url: `${SITE}/api/ig/jpg/${id}/${n}.jpg`, is_carousel_item: "true", access_token: token });
      children.push(c.id);
    }
    for (const c of children) await waitReady(c, token);
    const parent = await ig(`${acc.id}/media`, { media_type: "CAROUSEL", children: children.join(","), caption: post.caption, access_token: token });
    await waitReady(parent.id, token);
    const pub = await ig(`${acc.id}/media_publish`, { creation_id: parent.id, access_token: token });
    let permalink: string | undefined;
    try { permalink = (await ig(pub.id, { fields: "permalink", access_token: token }, "GET")).permalink; } catch {}
    await admin.from("ig_posts").update({ status: "published", media_id: pub.id, permalink: permalink ?? null, published_at: new Date().toISOString(), error: null }).eq("id", id);
    return { ok: true, permalink };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await admin.from("ig_posts").update({ status: "error", error: msg }).eq("id", id);
    return { ok: false, error: msg };
  }
}

/** Tâche du jour : lundi, mercredi, vendredi → un carrousel créé et publié. Le dimanche : renouvellement du jeton. */
export async function runInstagram(): Promise<{ ran: boolean; id?: number; ok?: boolean; error?: string }> {
  const parisDay = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Paris" })).getDay();
  if (parisDay === 0) await refreshIgToken();
  const kind = kindForToday();
  if (!kind) return { ran: false };
  const slot = new Date().toISOString().slice(0, 10);
  const admin = createAdminClient();
  const { data: existing } = await admin.from("ig_posts").select("id, status").eq("slot", slot).maybeSingle();
  if (existing?.status === "published") return { ran: false, id: existing.id as number };
  const id = (existing?.id as number) ?? (await createPost(kind, slot));
  if (!(await igToken())) return { ran: true, id, ok: false, error: "Instagram non connecté : brouillon prêt dans le panel" };
  const r = await publishPost(id);
  return { ran: true, id, ok: r.ok, error: r.error };
}
