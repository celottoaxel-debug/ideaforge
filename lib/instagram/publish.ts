// Publication sur Instagram via l'API officielle (graph.instagram.com ou graph.facebook.com selon le jeton).
// Réglages : INSTAGRAM_TOKEN (jeton longue durée) dans Vercel. Le jeton est ensuite renouvelé
// automatiquement et rangé dans la table app_settings (il expire au bout de 60 jours sinon).
import { createAdminClient } from "@/lib/supabase/admin";
import { SITE } from "@/lib/seo";
import { buildDraft, kindForToday, type Kind, type Slide } from "@/lib/instagram/content";
import type { StoryData } from "@/lib/instagram/render";
import { allIdeas, ideaFacts, clip } from "@/lib/seo";
import { scoreIdea } from "@/lib/score";
import { renderReel, type ReelRow } from "@/lib/instagram/reel";

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

// ───────── Hashtags : 5 différents à chaque publication, choisis dans la niche SaaS / IA ─────────
const TAGS = {
  core: ["#saas", "#microsaas", "#saasbusiness", "#intelligenceartificielle", "#ia", "#ai", "#iagenerative", "#aitools", "#outilsia"],
  business: ["#entrepreneuriat", "#entrepreneur", "#ideedebusiness", "#businessenligne", "#businessideas", "#creerunbusiness", "#startup", "#startupfrance", "#frenchtech", "#solopreneur", "#entrepreneurfrancais"],
  build: ["#indiehacker", "#nocode", "#lowcode", "#buildinpublic", "#sideproject", "#automatisation", "#chatgpt", "#claudeai", "#productivite"],
};
// Hashtag lié au sujet du post (repéré dans la légende), pour coller au contenu
const TOPICS: [RegExp, string[]][] = [
  [/e-?commerce|boutique|shopify|colis|vente en ligne/i, ["#ecommerce", "#shopify"]],
  [/immobili|loyer|locati|airbnb|conciergerie/i, ["#immobilier", "#investissementimmobilier"]],
  [/artisan|btp|chantier|bâtiment|plomb/i, ["#artisan", "#btp"]],
  [/santé|médic|kiné|patient|bien-être/i, ["#esante", "#healthtech"]],
  [/école|cours|élève|formation|éducati|apprend/i, ["#edtech", "#formationenligne"]],
  [/compta|factur|banque|finance|paiement|devis/i, ["#fintech", "#gestionentreprise"]],
  [/marketing|linkedin|réseaux sociaux|contenu|newsletter|seo/i, ["#marketingdigital", "#growthhacking"]],
  [/recrut|rh\b|salarié|emploi/i, ["#rh", "#recrutement"]],
  [/restaurant|cuisine|recette|food|traiteur/i, ["#restauration", "#foodtech"]],
  [/écolo|déchet|rse|esg|climat|durab/i, ["#greentech", "#rse"]],
  [/juridi|avocat|contrat|litige|rgpd/i, ["#legaltech", "#juridique"]],
];
const ALL_TAGS = new Set([...TAGS.core, ...TAGS.business, ...TAGS.build, ...TOPICS.flatMap(([, t]) => t)]);
/** Remplace les hashtags d'une légende par 5 nouveaux, jamais utilisés dans les publications récentes. */
async function withFreshHashtags(caption: string): Promise<string> {
  let recent: string[] = [];
  try { recent = JSON.parse((await setting("ig_hashtags_recent")) || "[]"); } catch {}
  const pick = (list: string[], n: number, taken: string[]) => {
    const fresh = list.filter((t) => !recent.includes(t) && !taken.includes(t));
    const pool = fresh.length >= n ? fresh : list.filter((t) => !taken.includes(t)).sort((a, b) => recent.indexOf(b) - recent.indexOf(a));
    const out = fresh.length >= n ? [...pool].sort(() => Math.random() - 0.5) : pool;
    return out.slice(0, n);
  };
  const chosen: string[] = [];
  chosen.push(...pick(TAGS.core, 2, chosen));
  chosen.push(...pick(TAGS.business, 2, chosen));
  const topic = TOPICS.find(([re]) => re.test(caption))?.[1].filter((t) => !recent.includes(t)) ?? [];
  chosen.push(...(topic.length ? [topic[0]] : pick(TAGS.build, 1, chosen)));
  // On retire les anciens hashtags (lignes ou mots qui commencent par #) puis on ajoute la nouvelle ligne
  const body = caption.split("\n").map((l) => l.split(/\s+/).filter((w) => !(w.startsWith("#") && (ALL_TAGS.has(w.toLowerCase()) || /^#[\p{L}\d_]+$/u.test(w)))).join(" ").replace(/\s+$/, "")).join("\n").replace(/\n{3,}/g, "\n\n").trim();
  await saveSetting("ig_hashtags_recent", JSON.stringify([...chosen, ...recent].slice(0, 25)));
  return `${body}\n\n${chosen.join(" ")}`;
}

// ───────── Conteneurs qu'Instagram n'a pas fini de traiter : publiés plus tard par /api/cron/instagram-finish ─────────
type Pending = { container: string; kind: "ugc" | "poll" | "story" | "reel" | "post"; key: string; at: string };
async function addPending(p: Omit<Pending, "at">) {
  let list: Pending[] = [];
  try { list = JSON.parse((await setting("ig_pending")) || "[]"); } catch {}
  await saveSetting("ig_pending", JSON.stringify([...list.filter((x) => x.container !== p.container), { ...p, at: new Date().toISOString() }]));
}
/** Attend un conteneur ; s'il n'est pas prêt à temps, il est mis en file et l'erreur « PENDING » est levée. */
async function readyOrQueue(container: string, token: string, kind: Pending["kind"], key: string, tries = 20) {
  try { await waitReady(container, token, tries); }
  catch (e) {
    if (e instanceof Error && /trop de temps/.test(e.message)) { await addPending({ container, kind, key }); throw new Error("PENDING"); }
    throw e;
  }
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function waitReady(id: string, token: string, tries = 20) {
  for (let i = 0; i < tries; i++) {
    const s = await ig(id, { fields: "status_code,status", access_token: token }, "GET");
    if (s.status_code === "FINISHED") return;
    if (s.status_code === "ERROR" || s.status_code === "EXPIRED") throw new Error(`Conteneur ${s.status_code} ${s.status ?? ""}`.trim());
    await wait(3000);
  }
  const last = await ig(id, { fields: "status_code,status", access_token: token }, "GET").catch(() => ({}));
  throw new Error(`Instagram met trop de temps à traiter (${last.status_code ?? "?"} ${last.status ?? ""})`.trim());
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
    const caption = await withFreshHashtags(post.caption as string);
    const parent = await ig(`${acc.id}/media`, { media_type: "CAROUSEL", children: children.join(","), caption, access_token: token });
    await waitReady(parent.id, token);
    const pub = await ig(`${acc.id}/media_publish`, { creation_id: parent.id, access_token: token });
    let permalink: string | undefined;
    try { permalink = (await ig(pub.id, { fields: "permalink", access_token: token }, "GET")).permalink; } catch {}
    await admin.from("ig_posts").update({ status: "published", caption, media_id: pub.id, permalink: permalink ?? null, published_at: new Date().toISOString(), error: null }).eq("id", id);
    return { ok: true, permalink };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await admin.from("ig_posts").update({ status: "error", error: msg }).eq("id", id);
    return { ok: false, error: msg };
  }
}

/** Tâche du jour : lun/mer/ven → un carrousel ; mar/jeu/sam → un réel tiré du dernier carrousel ; chaque jour → une story.
 *  Le dimanche : renouvellement du jeton. */
export async function runInstagram(): Promise<{ ran: boolean; id?: number; ok?: boolean; error?: string; reel?: { ok: boolean; id?: number; error?: string }; story?: { ok: boolean; error?: string } }> {
  const parisDay = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Paris" })).getDay();
  if (parisDay === 0) await refreshIgToken();
  let story: { ok: boolean; error?: string } | undefined;
  try { story = await runStory(); } catch (e) { story = { ok: false, error: e instanceof Error ? e.message : String(e) }; }
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
  let reel: { ok: boolean; id?: number; error?: string } | undefined;
  if ([2, 4, 6].includes(parisDay)) {
    try {
      // Mardi et samedi : d'abord le réel « face caméra » préparé dans la nuit ; sinon, le réel animé du carrousel.
      const ugc = [2, 6].includes(parisDay) ? await getUgc(todayKey()) : null;
      if (ugc && ugc.status !== "published") { const r = await publishUgc(todayKey()); reel = { ok: r.ok, error: r.error }; }
      else if (!ugc) reel = await runReel();
    } catch (e) { reel = { ok: false, error: e instanceof Error ? e.message : String(e) }; }
  }
  return { ...res, reel, story };
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
    await readyOrQueue(c.id, token, "story", date);
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
    if (msg === "PENDING") return { ok: true, error: "en cours de traitement" };
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

// ───────── Réels (mardi, jeudi, samedi) ─────────
export async function getReel(postId: number): Promise<ReelRow | null> {
  const v = await setting(`ig_reel:${postId}`);
  try { return v ? (JSON.parse(v) as ReelRow) : null; } catch { return null; }
}
const putReel = (postId: number, row: ReelRow) => saveSetting(`ig_reel:${postId}`, JSON.stringify(row));

/** Monte (si besoin) puis publie le réel du carrousel `postId`. */
export async function publishReel(postId: number): Promise<{ ok: boolean; permalink?: string; error?: string }> {
  const admin = createAdminClient();
  const { data: post } = await admin.from("ig_posts").select("caption").eq("id", postId).maybeSingle();
  if (!post) return { ok: false, error: "Carrousel introuvable" };
  let row = (await getReel(postId)) ?? { status: "draft" as const };
  if (row.status === "published") return { ok: true, permalink: row.permalink };
  try {
    if (!row.url) { row = { ...row, url: await renderReel(postId), error: undefined }; await putReel(postId, row); }
    const token = (await igToken())?.trim();
    if (!token) throw new Error("Instagram non connecté");
    const acc = await igAccount();
    if (!acc.ok || !acc.id) throw new Error(acc.error || "Compte Instagram introuvable");
    const c = await ig(`${acc.id}/media`, { media_type: "REELS", video_url: row.url!, caption: await withFreshHashtags(post.caption as string), share_to_feed: "true", access_token: token });
    await waitReady(c.id, token, 70);
    const pub = await ig(`${acc.id}/media_publish`, { creation_id: c.id, access_token: token });
    let permalink: string | undefined;
    try { permalink = (await ig(pub.id, { fields: "permalink", access_token: token }, "GET")).permalink; } catch {}
    await putReel(postId, { ...row, status: "published", media_id: pub.id, permalink, error: undefined, at: new Date().toISOString() });
    return { ok: true, permalink };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await putReel(postId, { ...row, status: "error", error: msg });
    return { ok: false, error: msg };
  }
}

/** Monte la vidéo seulement (aperçu dans le panel), sans publier. */
export async function prepareReel(postId: number): Promise<{ ok: boolean; url?: string; error?: string }> {
  try {
    const row = (await getReel(postId)) ?? { status: "draft" as const };
    if (row.status === "published") return { ok: true, url: row.url };
    const url = await renderReel(postId);
    await putReel(postId, { ...row, status: "draft", url, error: undefined });
    return { ok: true, url };
  } catch (e) { return { ok: false, error: e instanceof Error ? e.message : String(e) }; }
}

/** Réel du jour : le carrousel publié le plus récent qui n'a pas encore son réel. */
export async function runReel(): Promise<{ ok: boolean; id?: number; error?: string }> {
  const { data } = await createAdminClient().from("ig_posts").select("id").eq("status", "published").order("published_at", { ascending: false }).limit(6);
  for (const p of data ?? []) {
    const r = await getReel(p.id as number);
    if (r?.status === "published") continue;
    const out = await publishReel(p.id as number);
    return { ...out, id: p.id as number };
  }
  return { ok: true };
}

// ───────── Réels « face caméra » (mardi, samedi) ─────────
// Fabriqués chaque nuit par la tâche programmée (bac à sable Higgsfield) puis rangés dans app_settings « ig_ugc:<date> ».
export type UgcRow = { status: "ready" | "published" | "error"; url: string; url_music?: string; caption: string; idea?: string; title?: string; media_id?: string; permalink?: string; error?: string; at?: string };
export async function getUgc(date: string): Promise<UgcRow | null> {
  const v = await setting(`ig_ugc:${date}`);
  try { return v ? (JSON.parse(v) as UgcRow) : null; } catch { return null; }
}
const putUgc = (date: string, row: UgcRow) => saveSetting(`ig_ugc:${date}`, JSON.stringify(row));

export async function publishUgc(date: string): Promise<{ ok: boolean; permalink?: string; error?: string }> {
  const row = await getUgc(date) as (UgcRow & { container?: string; caption_final?: string }) | null;
  if (!row) return { ok: false, error: "Réel introuvable" };
  if (row.status === "published") return { ok: true, permalink: row.permalink };
  try {
    const token = (await igToken())?.trim();
    if (!token) throw new Error("Instagram non connecté");
    const acc = await igAccount();
    if (!acc.ok || !acc.id) throw new Error(acc.error || "Compte Instagram introuvable");
    const caption = row.caption_final || (await withFreshHashtags(row.caption));
    let container = row.container;
    if (container) {
      // Conteneur déjà envoyé lors d'un essai précédent : on vérifie qu'il est toujours valable
      const st = await ig(container, { fields: "status_code", access_token: token }, "GET").catch(() => null);
      if (!st || st.status_code === "ERROR" || st.status_code === "EXPIRED") container = undefined;
    }
    if (!container) {
      container = (await ig(`${acc.id}/media`, { media_type: "REELS", video_url: row.url_music || row.url, caption, share_to_feed: "true", access_token: token })).id as string;
      await putUgc(date, { ...row, container, caption_final: caption, error: undefined } as UgcRow);
    }
    try { await readyOrQueue(container, token, "ugc", date, 40); }
    catch (e) {
      if (e instanceof Error && e.message === "PENDING") {
        await putUgc(date, { ...row, container, caption_final: caption, status: "ready", error: "Instagram traite la vidéo : publication automatique dans quelques minutes" } as UgcRow);
        return { ok: true };
      }
      throw e;
    }
    const pub = await ig(`${acc.id}/media_publish`, { creation_id: container, access_token: token });
    let permalink: string | undefined;
    try { permalink = (await ig(pub.id, { fields: "permalink", access_token: token }, "GET")).permalink; } catch {}
    await putUgc(date, { ...row, caption, status: "published", media_id: pub.id, permalink, error: undefined, at: new Date().toISOString() });
    return { ok: true, permalink };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const cur = await getUgc(date);
    if (!cur || cur.status !== "ready") await putUgc(date, { ...(cur ?? row), status: "error", error: msg });
    return { ok: false, error: msg };
  }
}

export async function recentUgc(n = 8): Promise<{ date: string; row: UgcRow }[]> {
  const { data } = await createAdminClient().from("app_settings").select("key, value").like("key", "ig_ugc:%").order("key", { ascending: false }).limit(n);
  return (data ?? []).flatMap((d) => { try { return [{ date: (d.key as string).slice(7), row: JSON.parse(d.value as string) as UgcRow }]; } catch { return []; } });
}

// ───────── Studio « face caméra » du panel ─────────
export type UgcMedia = { url: string; label: string; duration?: number; path?: string; at?: string };
export type UgcRequest = { status: "pending" | "working" | "done" | "error"; face: string; end?: string; idea?: string; hook: string; at: string; result?: string; error?: string };
const HOOKS = [
  "POV : tu trouves une idée|de business rentable en {s} sec",
  "POV : tu cherches quoi lancer|et tu trouves en {s} sec",
  "Comment je trouve une idée|de SaaS rentable en {s} sec",
  "POV : ton prochain business|trouvé en {s} sec",
];
export const UGC_HOOKS = HOOKS;
async function listSetting<T>(key: string): Promise<T[]> {
  const v = await setting(key);
  try { return v ? (JSON.parse(v) as T[]) : []; } catch { return []; }
}
export const ugcFaces = () => listSetting<UgcMedia>("ugc_facecams");
export const ugcEndings = () => listSetting<UgcMedia>("ugc_endings");
export async function addUgcMedia(kind: "face" | "end", m: UgcMedia) {
  const key = kind === "face" ? "ugc_facecams" : "ugc_endings";
  const list = await listSetting<UgcMedia>(key);
  await saveSetting(key, JSON.stringify([...list, { ...m, at: new Date().toISOString() }]));
}
export async function removeUgcMedia(kind: "face" | "end", url: string) {
  const key = kind === "face" ? "ugc_facecams" : "ugc_endings";
  const list = await listSetting<UgcMedia>(key);
  await saveSetting(key, JSON.stringify(list.filter((x) => x.url !== url)));
}
export async function requestUgc(r: Omit<UgcRequest, "status" | "at">) {
  const at = new Date().toISOString();
  await saveSetting(`ugc_request:${at.replace(/[:.]/g, "-")}`, JSON.stringify({ ...r, status: "pending", at }));
}
export async function recentUgcRequests(n = 6): Promise<{ key: string; row: UgcRequest }[]> {
  const { data } = await createAdminClient().from("app_settings").select("key, value").like("key", "ugc_request:%").order("key", { ascending: false }).limit(n);
  return (data ?? []).flatMap((d) => { try { return [{ key: d.key as string, row: JSON.parse(d.value as string) as UgcRequest }]; } catch { return []; } });
}
/** Adresse d'envoi directe vers Supabase Storage (le fichier ne passe pas par le serveur). */
export async function ugcUploadUrl(kind: "face" | "end", filename: string) {
  const ext = (filename.split(".").pop() || "mp4").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${kind === "face" ? "facecam" : "endings"}/${Date.now()}.${ext === "mov" ? "mov" : "mp4"}`;
  const { data, error } = await createAdminClient().storage.from("ig-media").createSignedUploadUrl(path);
  if (error || !data) throw new Error(error?.message || "Envoi impossible");
  return { path, token: data.token, publicUrl: createAdminClient().storage.from("ig-media").getPublicUrl(path).data.publicUrl };
}

// ───────── Sondages en story (2 par jour, n'importe quel thème) ─────────
const POLL_THEMES = ["Business", "IA", "Productivité", "Vie d'entrepreneur", "Argent", "Tech", "Marketing", "Réseaux sociaux", "Quotidien", "Cuisine", "Motivation", "Voyage", "Sport", "Culture", "Habitudes", "Travail"];
const POLL_BANK: { theme: string; question: string; a: string; b: string }[] = [
  { theme: "Business", question: "Pour te lancer, tu|choisis quoi ?", a: "Un SaaS en ligne", b: "Un business local" },
  { theme: "IA", question: "L'IA va plutôt|t'aider ou te remplacer ?", a: "M'aider", b: "Me remplacer" },
  { theme: "Productivité", question: "Tu bosses mieux|le matin ou le soir ?", a: "Le matin", b: "Le soir" },
  { theme: "Argent", question: "1 000 € de côté :|tu en fais quoi ?", a: "Je lance un projet", b: "J'épargne" },
  { theme: "Vie d'entrepreneur", question: "Plutôt seul|ou avec un associé ?", a: "Seul", b: "Avec un associé" },
  { theme: "Quotidien", question: "Café ou thé|pour démarrer ?", a: "Café", b: "Thé" },
  { theme: "Marketing", question: "Pour trouver tes clients|tu mises sur ?", a: "Instagram / TikTok", b: "Google (SEO)" },
  { theme: "Travail", question: "Télétravail|ou bureau ?", a: "Télétravail", b: "Bureau" },
  { theme: "Cuisine", question: "Plat maison|ou livraison ?", a: "Fait maison", b: "Livraison" },
  { theme: "Motivation", question: "Ce qui te bloque|le plus pour te lancer ?", a: "Pas d'idée", b: "Peur d'échouer" },
  { theme: "Tech", question: "iPhone|ou Android ?", a: "iPhone", b: "Android" },
  { theme: "Habitudes", question: "Tu planifies ta semaine|ou tu improvises ?", a: "Je planifie", b: "J'improvise" },
];

export type PollRow = { theme: string; question: string; a: string; b: string; status: "draft" | "published" | "error"; media_id?: string; error?: string; at?: string };

async function makePoll(recent: string[]): Promise<{ theme: string; question: string; a: string; b: string }> {
  const theme = POLL_THEMES[Math.floor(Math.random() * POLL_THEMES.length)];
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const { askClaude } = await import("@/lib/anthropic");
      const out = await askClaude(
        `Invente un sondage Instagram en story pour le compte @ideasforge.io (audience : jeunes entrepreneurs francophones intéressés par l'IA et les idées de business), sur le thème « ${theme} ».
Une question courte et engageante (8 à 12 mots, tutoiement), deux réponses opposées très courtes (2 à 5 mots chacune), fun ou qui fait réfléchir, sans sujet sensible (politique, religion, santé).
Ne reprends pas ces questions déjà posées : ${recent.slice(0, 20).join(" / ") || "aucune"}.
Réponds UNIQUEMENT en JSON : {"question":"...","a":"...","b":"..."}. Coupe la question en deux avec un « | » à l'endroit où la 2e partie doit passer en vert. Pas de tiret cadratin, pas d'emoji.`,
        200,
      );
      const j = JSON.parse(out.slice(out.indexOf("{"), out.lastIndexOf("}") + 1));
      if (j.question && j.a && j.b && String(j.question).length < 110) return { theme, question: String(j.question), a: String(j.a).slice(0, 32), b: String(j.b).slice(0, 32) };
    } catch {}
  }
  const left = POLL_BANK.filter((p) => !recent.includes(p.question));
  return (left.length ? left : POLL_BANK)[Math.floor(Math.random() * (left.length || POLL_BANK.length))];
}

/** Sondage du créneau en cours (am / pm) : préparé puis publié en story. */
export async function runPoll(): Promise<{ ok: boolean; key: string; error?: string }> {
  const now = new Date();
  const key = `${now.toISOString().slice(0, 10)}-${now.getUTCHours() < 15 ? "am" : "pm"}`;
  const cur = await setting(`ig_poll:${key}`);
  let row: PollRow | null = null;
  try { row = cur ? (JSON.parse(cur) as PollRow) : null; } catch {}
  if (row?.status === "published") return { ok: true, key };
  if (!row) {
    let recent: string[] = [];
    try { recent = JSON.parse((await setting("ig_poll_recent")) || "[]"); } catch {}
    const p = await makePoll(recent);
    row = { ...p, status: "draft" };
    await saveSetting(`ig_poll:${key}`, JSON.stringify(row));
    await saveSetting("ig_poll_recent", JSON.stringify([p.question, ...recent].slice(0, 40)));
  }
  try {
    const token = (await igToken())?.trim();
    if (!token) throw new Error("Instagram non connecté");
    const acc = await igAccount();
    if (!acc.ok || !acc.id) throw new Error(acc.error || "Compte Instagram introuvable");
    const c = await ig(`${acc.id}/media`, { image_url: `${SITE}/api/ig/poll/${key}.jpg`, media_type: "STORIES", access_token: token });
    await readyOrQueue(c.id, token, "poll", key);
    const pub = await ig(`${acc.id}/media_publish`, { creation_id: c.id, access_token: token });
    await saveSetting(`ig_poll:${key}`, JSON.stringify({ ...row, status: "published", media_id: pub.id, error: undefined, at: new Date().toISOString() }));
    return { ok: true, key };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await saveSetting(`ig_poll:${key}`, JSON.stringify({ ...row, status: msg === "PENDING" ? "draft" : "error", error: msg === "PENDING" ? "Instagram traite l'image : publication dans quelques minutes" : msg }));
    return { ok: msg === "PENDING", key, error: msg };
  }
}

export async function recentPolls(n = 6): Promise<{ key: string; row: PollRow }[]> {
  const { data } = await createAdminClient().from("app_settings").select("key, value").like("key", "ig_poll:%").order("key", { ascending: false }).limit(n);
  return (data ?? []).flatMap((d) => { try { return [{ key: (d.key as string).slice(8), row: JSON.parse(d.value as string) as PollRow }]; } catch { return []; } });
}

/** Publie les conteneurs devenus prêts (appelé toutes les 5 minutes). */
export async function finishPending(): Promise<{ done: number; left: number }> {
  let list: Pending[] = [];
  try { list = JSON.parse((await setting("ig_pending")) || "[]"); } catch {}
  if (!list.length) return { done: 0, left: 0 };
  const token = (await igToken())?.trim();
  const acc = await igAccount();
  if (!token || !acc.ok || !acc.id) return { done: 0, left: list.length };
  const keep: Pending[] = []; let done = 0;
  for (const p of list) {
    try {
      const st = await ig(p.container, { fields: "status_code", access_token: token }, "GET");
      if (st.status_code === "IN_PROGRESS" && Date.now() - new Date(p.at).getTime() < 3 * 3600_000) { keep.push(p); continue; }
      if (st.status_code !== "FINISHED") throw new Error(`Instagram a refusé le média (${st.status_code})`);
      const pub = await ig(`${acc.id}/media_publish`, { creation_id: p.container, access_token: token });
      let permalink: string | undefined;
      try { permalink = (await ig(pub.id, { fields: "permalink", access_token: token }, "GET")).permalink; } catch {}
      const now = new Date().toISOString();
      if (p.kind === "ugc") { const r = await getUgc(p.key); if (r) await putUgc(p.key, { ...r, caption: (r as UgcRow & { caption_final?: string }).caption_final || r.caption, status: "published", media_id: pub.id, permalink, error: undefined, at: now }); }
      if (p.kind === "poll") { const v = await setting(`ig_poll:${p.key}`); if (v) await saveSetting(`ig_poll:${p.key}`, JSON.stringify({ ...JSON.parse(v), status: "published", media_id: pub.id, error: undefined, at: now })); }
      if (p.kind === "story") { const r = await getStory(p.key); if (r) await putStory(p.key, { ...r, status: "published", media_id: pub.id, error: undefined, at: now }); }
      done++;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (p.kind === "ugc") { const r = await getUgc(p.key); if (r) await putUgc(p.key, { ...r, status: "error", error: msg }); }
      if (p.kind === "poll") { const v = await setting(`ig_poll:${p.key}`); if (v) await saveSetting(`ig_poll:${p.key}`, JSON.stringify({ ...JSON.parse(v), status: "error", error: msg })); }
      if (p.kind === "story") { const r = await getStory(p.key); if (r) await putStory(p.key, { ...r, status: "error", error: msg }); }
    }
  }
  await saveSetting("ig_pending", JSON.stringify(keep));
  return { done, left: keep.length };
}
