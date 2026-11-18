// Veille concurrents : posts publics des comptes pros de la niche (API officielle « Business Discovery »),
// repérage des « outliers » (posts qui font bien plus que la moyenne du compte) et analyse de l'accroche / CTA.
import { createAdminClient } from "@/lib/supabase/admin";
import { igToken, igAccount } from "@/lib/instagram/publish";

export type WatchAccount = { username: string; market: "FR" | "US"; theme: string };
export type WatchPost = { id: string; username: string; caption: string; likes: number; comments: number; type: string; permalink: string; timestamp: string; img?: string; ratio: number };
export type Outlier = Omit<WatchPost, "likes" | "comments" | "ratio"> & { likes?: number; comments?: number; ratio?: number; why?: string; hook?: string; structure?: string; cta?: string; idea?: string };
export type WatchData = { at: string; source?: "web" | "api"; accounts: { username: string; ok: boolean; name?: string; followers?: number; posts?: number; error?: string }[]; outliers: Outlier[] };

const DEFAULT: WatchAccount[] = [
  { username: "danmartell", market: "US", theme: "Business IA" },
  { username: "awakpenn", market: "US", theme: "Business IA" },
  { username: "builtbyprajwal", market: "US", theme: "SaaS" },
  { username: "farhannrakhangi", market: "US", theme: "Business IA" },
  { username: "chrisdonnellyofficial", market: "US", theme: "Business IA" },
  { username: "ayushman.pandita", market: "US", theme: "Business IA" },
  { username: "itstylergermain", market: "US", theme: "Marketing IA" },
  { username: "imanoubou", market: "US", theme: "Marketing IA" },
  { username: "justinemorin", market: "FR", theme: "Business IA" },
  { username: "jolan.ai", market: "FR", theme: "Outils IA" },
  { username: "carolinemignaux", market: "FR", theme: "Marketing digital" },
  { username: "paulineclavelloux", market: "FR", theme: "SaaS" },
  { username: "defendintelligence", market: "FR", theme: "IA" },
];

const db = () => createAdminClient();
async function get<T>(key: string, fallback: T): Promise<T> {
  const { data } = await db().from("app_settings").select("value").eq("key", key).maybeSingle();
  try { return data?.value ? (JSON.parse(data.value as string) as T) : fallback; } catch { return fallback; }
}
const put = (key: string, v: unknown) => db().from("app_settings").upsert({ key, value: JSON.stringify(v), updated_at: new Date().toISOString() }, { onConflict: "key" });

export const watchAccounts = () => get<WatchAccount[]>("ig_watch_accounts", DEFAULT);
export const watchData = () => get<WatchData | null>("ig_watch_data", null);
export const customHooks = () => get<string[]>("ugc_hooks_custom", []);

export async function setWatchAccounts(list: WatchAccount[]) { await put("ig_watch_accounts", list); }
export async function addCustomHook(h: string) {
  const list = await customHooks();
  if (!list.includes(h)) await put("ugc_hooks_custom", [h, ...list].slice(0, 30));
}

const median = (a: number[]) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : 0; };

/** Récupère les posts de chaque compte, repère les outliers et analyse les nouveaux. */
export async function runWatch(): Promise<WatchData> {
  const token = (await igToken())?.trim();
  const acc = await igAccount();
  const accounts = await watchAccounts();
  const prev = await watchData();
  const result: WatchData = { at: new Date().toISOString(), accounts: [], outliers: [] };
  if (!token || !acc.ok || !acc.id) { result.accounts = accounts.map((a) => ({ username: a.username, ok: false, error: "Instagram non connecté" })); return result; }
  const all: WatchPost[] = [];
  for (const a of accounts) {
    const fields = `business_discovery.username(${a.username}){username,name,followers_count,media_count,media.limit(30){id,caption,like_count,comments_count,media_type,media_product_type,permalink,timestamp,media_url,thumbnail_url}}`;
    try {
      const r = await fetch(`https://graph.facebook.com/v21.0/${acc.id}?fields=${encodeURIComponent(fields)}&access_token=${encodeURIComponent(token)}`);
      const j = await r.json();
      if (!r.ok || j.error) throw new Error(j.error?.error_user_msg || j.error?.message || `Erreur ${r.status}`);
      const bd = j.business_discovery;
      const media = (bd.media?.data ?? []) as Record<string, unknown>[];
      const eng = (m: Record<string, unknown>) => Number(m.like_count ?? 0) + 2 * Number(m.comments_count ?? 0);
      const med = Math.max(1, median(media.map(eng)));
      for (const m of media) {
        all.push({
          id: String(m.id), username: bd.username, caption: String(m.caption ?? ""), likes: Number(m.like_count ?? 0), comments: Number(m.comments_count ?? 0),
          type: m.media_product_type === "REELS" ? "Réel" : m.media_type === "CAROUSEL_ALBUM" ? "Carrousel" : m.media_type === "VIDEO" ? "Vidéo" : "Photo",
          permalink: String(m.permalink), timestamp: String(m.timestamp), img: (m.thumbnail_url || m.media_url) as string | undefined, ratio: Math.round((eng(m) / med) * 10) / 10,
        });
      }
      result.accounts.push({ username: a.username, ok: true, name: bd.name, followers: bd.followers_count, posts: bd.media_count });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      result.accounts.push({ username: a.username, ok: false, error: /not be found|Invalid user|does not exist|cannot be found/i.test(msg) ? "Compte introuvable ou pas en mode professionnel" : msg.slice(0, 140) });
    }
  }
  // Outliers : au moins 3× la moyenne du compte, sur les 90 derniers jours
  const since = Date.now() - 90 * 86400_000;
  const outs = all.filter((p) => p.ratio >= 3 && new Date(p.timestamp).getTime() > since).sort((a, b) => b.ratio - a.ratio).slice(0, 24);
  const known = new Map((prev?.outliers ?? []).map((o) => [o.id, o]));
  const toAnalyse = outs.filter((o) => !known.get(o.id)?.hook).slice(0, 8);
  const analysed = new Map<string, Partial<Outlier>>();
  if (toAnalyse.length && process.env.ANTHROPIC_API_KEY) {
    try {
      const { askClaude } = await import("@/lib/anthropic");
      const list = toAnalyse.map((o, i) => `#${i} @${o.username} (${o.type}, ×${o.ratio}) :\n${o.caption.slice(0, 900)}`).join("\n\n");
      const out = await askClaude(
        `Tu analyses des posts Instagram qui ont explosé (bien plus d'engagement que d'habitude) dans la niche business IA / SaaS / marketing IA.
Pour chacun, à partir de la légende : l'accroche (la première phrase ou idée qui arrête le scroll, reformulée en français), la structure (en 1 phrase), l'appel à l'action utilisé, puis UNE accroche adaptée pour IdeaForge (catalogue d'idées de business chiffrées et notées, ideaforges.io) qui reprend la même mécanique sans copier la phrase, en français, tutoiement, 12 mots maximum, avec un « | » à l'endroit où la 2e ligne commence.
Réponds UNIQUEMENT en JSON : [{"i":0,"hook":"...","structure":"...","cta":"...","idea":"..."}]. Pas de tiret cadratin.

${list}`,
        1800,
      );
      const arr = JSON.parse(out.slice(out.indexOf("["), out.lastIndexOf("]") + 1)) as { i: number; hook: string; structure: string; cta: string; idea: string }[];
      for (const x of arr) { const o = toAnalyse[x.i]; if (o) analysed.set(o.id, { hook: x.hook, structure: x.structure, cta: x.cta, idea: x.idea }); }
    } catch {}
  }
  result.outliers = outs.map((o) => ({ ...o, ...(known.get(o.id) ? { hook: known.get(o.id)!.hook, structure: known.get(o.id)!.structure, cta: known.get(o.id)!.cta, idea: known.get(o.id)!.idea } : {}), ...(analysed.get(o.id) ?? {}) }));
  await put("ig_watch_data", result);
  return result;
}
