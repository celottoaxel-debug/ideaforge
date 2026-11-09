import { createAdminClient } from "@/lib/supabase/admin";
import { askClaude, extractJsonArray } from "@/lib/anthropic";


// Moteur de découverte "24/7" : appelé par Vercel Cron (voir vercel.json).
// Demande à l'IA de nouvelles idées SaaS à fort potentiel et les insère dans Supabase (is_ai=true).
// Nécessite : CRON_SECRET, ANTHROPIC_API_KEY, SUPABASE_SERVICE_ROLE_KEY.

const SECTORS = ["Micro-SaaS / IA", "Tech / SaaS", "E-commerce", "Services", "Bien-être", "Éducation", "Écologie"];

function slug(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
}


export type DiscoverResult = { ok: boolean; added?: number; ids?: string[]; error?: string };

// Génère 3 nouvelles idées par IA et les ajoute au catalogue (Supabase, is_ai=true).
export async function runDiscover(): Promise<DiscoverResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { ok: false, error: "ANTHROPIC_API_KEY ou SUPABASE_SERVICE_ROLE_KEY absente dans Vercel" };
  }

  const prompt = `Propose 3 idées de SaaS/outils en ligne à FORT POTENTIEL à lancer en ${new Date().getFullYear()}, inédites et actionnables (idéalement des agents IA, verticaux, ou micro-SaaS en plein essor).
Réponds UNIQUEMENT avec un tableau JSON de 3 objets, chacun :
{"sector":string (parmi: ${SECTORS.join(", ")}),"title":string,"pitch":string,"budget":string (ex "0,5–2,5 k€"),"budget_min":number (euros),"revenue":string (ex "3–30 k€/mois"),"delai":string,"difficulty":1|2|3,"market":string,"model":string,"competition":string,"steps":[string,string,string,string],"risks":[string,string],"tags":[string,string,string],"benchmark":string (acteur réel + ordre de grandeur public),"markets":string (ex "US · FR · ESP")}
Français, chiffres réalistes. Aucun texte hors du JSON.`;

  let ideas: Record<string, unknown>[] = [];
  try {
    ideas = extractJsonArray(await askClaude(prompt, 8000)) as Record<string, unknown>[];
  } catch (e) {
    return { ok: false, error: `Génération IA échouée : ${e instanceof Error ? e.message : String(e)}` };
  }

  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rows = ideas.filter((o) => o && typeof o === "object" && o.title).map((o) => ({
    id: `auto-${slug(String(o.title))}-${today}`,
    sector: SECTORS.includes(String(o.sector)) ? String(o.sector) : "Micro-SaaS / IA",
    title: String(o.title).slice(0, 120),
    pitch: o.pitch ? String(o.pitch).slice(0, 300) : null,
    budget: o.budget ? String(o.budget) : null,
    budget_min: Number.isFinite(Number(o.budget_min)) ? Number(o.budget_min) : null,
    revenue: o.revenue ? String(o.revenue) : null,
    delai: o.delai ? String(o.delai) : null,
    difficulty: [1, 2, 3].includes(Number(o.difficulty)) ? Number(o.difficulty) : 2,
    market: o.market ? String(o.market) : null,
    model: o.model ? String(o.model) : null,
    competition: o.competition ? String(o.competition) : null,
    steps: Array.isArray(o.steps) ? o.steps.map(String).slice(0, 6) : [],
    risks: Array.isArray(o.risks) ? o.risks.map(String).slice(0, 4) : [],
    tags: Array.isArray(o.tags) ? o.tags.map(String).slice(0, 5) : [],
    benchmark: o.benchmark ? String(o.benchmark) : null,
    markets: o.markets ? String(o.markets) : null,
    featured: false, is_ai: true, locale: "fr",
  }));

  try {
    const admin = createAdminClient();
    const { error } = await admin.from("ideas").upsert(rows, { onConflict: "id", ignoreDuplicates: true });
    if (error) throw error;
  } catch (e) {
    return { ok: false, error: `Enregistrement échoué : ${e instanceof Error ? e.message : String(e)}` };
  }

  return { ok: true, added: rows.length, ids: rows.map((r) => r.id) };
}
