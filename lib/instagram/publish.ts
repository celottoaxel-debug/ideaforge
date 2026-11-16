// Publication sur Instagram via l'API officielle (graph.instagram.com ou graph.facebook.com selon le jeton).
// Réglages : INSTAGRAM_TOKEN (jeton longue durée) dans Vercel. Le jeton est ensuite renouvelé
// automatiquement et rangé dans la table app_settings (il expire au bout de 60 jours sinon).
import { createAdminClient } from "@/lib/supabase/admin";
import { SITE } from "@/lib/seo";
import { buildDraft, kindForToday, type Kind, type Slide } from "@/lib/instagram/content";
import type { StoryData } from "@/lib/instagram/render";
import { allIdeas, ideaFacts, clip } from "@/lib/seo";
import { scoreIdea } from "@/lib/score";

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
  return (await setting("ig_token")) || process.env.INSTAGRAM_TOKEN || process.env.INSTGRAM_TOKEN || null;
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

/** Tâche du jour : lundi, mercredi, vendredi → un carrousel créé et publié. Chaque jour → une story.
 *  Le dimanche : renouvellement du jeton. */
export async function runInstagram(): Promise<{ ran: boolean; id?: number; ok?: boolean; error?: string; story?: { ok: boolean; error?: string } }> {
  const parisDay = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Paris" })).getDay();
  if (parisDay === 0) await refreshIgToken();
  const kind = kindForToday();
  let res: { ran: boolean; id?: number; ok?: boolean; error?: string } = { ran: false };
  if (kind) {
    const slot = new Date().toISOString().slice(0, 10);
    const admin = createAdminClient();
    const { data: existing } = await admin.from("ig_posts").select("id, status").eq("slot", slot).maybeSingle();
    if (existing?.status === "published") res = { ran: false, id: existing.id as number };
    else {
      const id = (existing?.id as number) ?? (await createPost(kind, slot));
      if (!(await igToken())) res = { ran: true, id, ok: false, error: "Instagram non connecté : brouillon prêt dans le panel" };
      else { const r = await publishPost(id); res = { ran: true, id, ok: r.ok, error: r.error }; }
    }
  }
  let story: { ok: boolean; error?: string } | undefined;
  try { story = await runStory(); } catch (e) { story = { ok: false, error: e instanceof Error ? e.message : String(e) }; }
  return { ...res, story };
}

// ───────── Stories (une par jour) ─────────
type StoryRow = { story: StoryData; status: "draft" | "published" | "error"; idea?: string; media_id?: string; error?: string; at?: string };
const todayKey = () => new Date().toISOString().slice(0, 10);
async function getStory(date: string): Promise<StoryRow | null> {
  const v = await setting(`ig_story:${date}`);
  try { return v ? (JSON.parse(v) as StoryRow) : null; } catch { return null; }
}
const putStory = (date: string, row: StoryRow) => saveSetting(`ig_story:${date}`, JSON.stringify(row));

/** Contenu de la story : le carrousel du jour s'il existe, sinon « l'idée du jour » du catalogue. */
export async function buildStory(date = todayKey()): Promise<StoryRow> {
  const admin = createAdminClient();
  const { data: post } = await admin.from("ig_posts").select("kind, slides").eq("slot", date).maybeSingle();
  const slides = (post?.slides ?? []) as Slide[];
  const cover = slides[0];
  if (post && cover?.t === "cover") {
    const items: StoryData["items"] = [];
    if (post.kind === "top5") slides.filter((x) => x.t === "rank").slice(0, 3).forEach((x) => x.t === "rank" && items.push({ num: x.rank, v: clip(x.title, 48) }));
    else {
      const st = slides.find((x) => x.t === "stats");
      if (st?.t === "stats") st.tiles.slice(0, 3).forEach((t, i) => items.push({ k: t.k, v: t.v, icon: ["coin", "chart", "clock"][i], amber: i === 2 }));
    }
    return { status: "draft", story: { badge: "Nouveau post", kicker: cover.kicker, title: cover.title, sub: cover.sub, items, cta: "Le carrousel est sur le profil" } };
  }
  const usedRaw = await setting("ig_story_used");
  const used = new Set<string>(usedRaw ? (JSON.parse(usedRaw) as string[]) : []);
  const { data: prev } = await admin.from("ig_posts").select("ideas").limit(300);
  (prev ?? []).forEach((p) => ((p.ideas as string[]) ?? []).forEach((i) => used.add(i)));
  const ideas = (await allIdeas()).sort((a, b) => scoreIdea(b).score - scoreIdea(a).score);
  const it = ideas.find((i) => !used.has(i.id)) ?? ideas[Math.floor(Math.random() * Math.min(30, ideas.length))];
  const f = ideaFacts(it);
  return {
    status: "draft", idea: it.id,
    story: {
      badge: "Idée du jour", kicker: "Idée de business chiffrée", title: clip(it.title, 80), sub: it.pitch ? clip(it.pitch, 110) : undefined,
      items: [
        { k: "Mise de départ", v: it.budget || f.budget, icon: "coin" },
        { k: "Potentiel", v: it.revenue || f.mrr12Txt, icon: "chart" },
        { k: "Score IdeaForge", v: `${scoreIdea(it).score}/100`, icon: "star", amber: true },
      ],
      cta: "Fiche complète : lien en bio",
    },
  };
}

/** Publie la story d'une date (déjà préparée). */
export async function publishStory(date = todayKey()): Promise<{ ok: boolean; error?: string }> {
  const row = await getStory(date);
  if (!row) return { ok: false, error: "Story introuvable" };
  if (row.status === "published") return { ok: true };
  const token = (await igToken())?.trim();
  if (!token) return { ok: false, error: "Instagram non connecté" };
  try {
    const acc = await igAccount();
    if (!acc.ok || !acc.id) throw new Error(acc.error || "Compte Instagram introuvable");
    const c = await ig(`${acc.id}/media`, { image_url: `${SITE}/api/ig/story/${date}.jpg`, media_type: "STORIES", access_token: token });
    await waitReady(c.id, token);
    const pub = await ig(`${acc.id}/media_publish`, { creation_id: c.id, access_token: token });
    await putStory(date, { ...row, status: "published", media_id: pub.id, error: undefined, at: new Date().toISOString() });
    if (row.idea) {
      const usedRaw = await setting("ig_story_used");
      const list = usedRaw ? (JSON.parse(usedRaw) as string[]) : [];
      await saveSetting("ig_story_used", JSON.stringify([row.idea, ...list.filter((x) => x !== row.idea)].slice(0, 120)));
    }
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await putStory(date, { ...row, status: "error", error: msg });
    return { ok: false, error: msg };
  }
}

/** Story du jour : préparée une fois, puis publiée (si Instagram est connecté). */
export async function runStory(date = todayKey()): Promise<{ ok: boolean; error?: string }> {
  let row = await getStory(date);
  if (row?.status === "published") return { ok: true };
  if (!row) { row = await buildStory(date); await putStory(date, row); }
  return publishStory(date);
}

/** (Re)prépare la story du jour sans la publier, tant qu'elle n'est pas en ligne. */
export async function prepareStory(date = todayKey()) {
  const row = await getStory(date);
  if (row?.status === "published") return;
  await putStory(date, await buildStory(date));
}

/** Les dernières stories (pour le panel). */
export async function recentStories(n = 7): Promise<{ date: string; row: StoryRow }[]> {
  const { data } = await createAdminClient().from("app_settings").select("key, value").like("key", "ig_story:%").order("key", { ascending: false }).limit(n);
  return (data ?? []).flatMap((d) => { try { return [{ date: (d.key as string).slice(9), row: JSON.parse(d.value as string) as StoryRow }]; } catch { return []; } });
}
