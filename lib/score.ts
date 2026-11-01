import type { Idea } from "@/lib/types";

const clamp = (n: number) => Math.max(5, Math.min(99, Math.round(n)));

export type Scored = { score: number; demand: number; competition: number; margin: number; speed: number };

// « IdeaForge Score » : note composite déterministe (demande, concurrence, marge, vitesse de vibe-coding).
export function scoreIdea(it: Idea): Scored {
  const tags = (it.tags || []).map((t) => t.toLowerCase());
  const has = (...k: string[]) => k.some((x) => tags.some((t) => t.includes(x)));
  const diff = it.difficulty || 2;

  let speed = diff === 1 ? 90 : diff === 2 ? 66 : 42;
  const bm = it.budget_min || 0;
  if (bm > 0 && bm < 1000) speed += 8; else if (bm >= 15000) speed -= 12;
  if (has("no-code", "vibe coding")) speed += 6;
  speed = clamp(speed);

  let demand = it.featured ? 78 : 62;
  if (it.benchmark) demand += 10;
  if (has("récurrent", "b2b", "récurrent")) demand += 6;
  demand = clamp(demand);

  let margin = 60;
  if (has("récurrent", "saas", "abonnement", "api")) margin += 18;
  if (has("marges fortes")) margin += 10;
  if (has("food", "restauration", "e-commerce", "seconde main", "circuit court")) margin -= 10;
  margin = clamp(margin);

  let competition = 62;
  if (has("niche", "local", "vertical")) competition += 15;
  if (it.benchmark && /(M\$|M€|Md|ARR)/.test(it.benchmark)) competition -= 12;
  competition = clamp(competition);

  const score = clamp(demand * 0.3 + margin * 0.25 + speed * 0.25 + competition * 0.2);
  return { score, demand, competition, margin, speed };
}

// Stack conseillée pour construire l'idée (vibe coding).
export function buildStack(it: Idea): string {
  const tags = (it.tags || []).map((t) => t.toLowerCase());
  if (tags.some((t) => t.includes("no-code"))) return "Lovable / Bolt + Supabase + Stripe";
  if (/SaaS|IA|Tech/.test(it.sector)) {
    const ai = tags.some((t) => t.includes("ia") || t.includes("rag") || t.includes("api"));
    return "Next.js + Supabase + Stripe" + (ai ? " + API LLM (Claude)" : "");
  }
  return "Next.js + CMS + formulaire (site vitrine)";
}
