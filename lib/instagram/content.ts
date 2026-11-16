// Contenu des carrousels Instagram, généré à partir du catalogue IdeaForge.
//   lundi    : « 1 idée chiffrée » (une idée bien notée, jamais publiée)
//   mercredi : « Top 5 » d'un thème (rotation sur les pages thèmes)
//   vendredi : « Nouvelle idée repérée par l'IA » (la plus récente, jamais publiée)
import type { Idea } from "@/lib/types";
import { allIdeas, ideaFacts, shortName, clip } from "@/lib/seo";
import { scoreIdea } from "@/lib/score";
import { COLLECTIONS } from "@/lib/collections";
import { askClaude } from "@/lib/anthropic";

export type Kind = "idea" | "top5" | "new";

export type Slide =
  | { t: "cover"; kicker: string; title: string; sub?: string; stat?: string; statLabel?: string }
  | { t: "text"; kicker: string; title: string; body: string; n: number; total: number }
  | { t: "stats"; kicker: string; title: string; tiles: { k: string; v: string }[]; n: number; total: number }
  | { t: "list"; kicker: string; title: string; items: string[]; n: number; total: number }
  | { t: "rank"; rank: number; title: string; pitch: string; tiles: { k: string; v: string }[]; n: number; total: number }
  | { t: "cta"; title: string; lines: string[] };

export type Draft = { kind: Kind; ideas: string[]; slides: Slide[]; caption: string; theme?: string };

const HASHTAGS = "#ideedebusiness #entrepreneuriat #microsaas #intelligenceartificielle #businessenligne";

const ctaSlide = (title: string): Slide => ({
  t: "cta",
  title,
  lines: ["Budget détaillé, concurrents, plan sur 12 semaines et prompts IA : tout est sur ideaforges.io", "1 fiche complète offerte à l'inscription", "Lien en bio"],
});

function ideaSlides(it: Idea, kicker: string): Slide[] {
  const f = ideaFacts(it);
  const sc = scoreIdea(it).score;
  const total = 6;
  const steps = (it.steps || []).slice(0, 4).map((s) => clip(s, 90));
  const risks = (it.risks || []).slice(0, 3).map((s) => clip(s, 100));
  return [
    { t: "cover", kicker, title: clip(it.title, 80), sub: it.pitch ? clip(it.pitch, 120) : undefined, stat: f.mrr12Txt, statLabel: "de revenu mensuel projeté au bout d'un an" },
    { t: "text", kicker: "Le marché", title: "Pourquoi ça peut marcher", body: clip(it.market || it.pitch || "", 300), n: 2, total },
    { t: "stats", kicker: "Les chiffres", title: "Ce qu'il faut pour se lancer", n: 3, total, tiles: [
      { k: "Mise de départ", v: it.budget || f.budget },
      { k: "Potentiel", v: it.revenue || f.mrr12Txt },
      { k: "Délai", v: it.delai || "·" },
      { k: "Score IdeaForge", v: `${sc}/100` },
    ] },
    { t: "list", kicker: "Le plan", title: "Comment la lancer", items: steps.length ? steps : ["Valider la demande", "Construire une première version", "Trouver 10 premiers clients", "Fixer le prix"], n: 4, total },
    { t: "list", kicker: "Attention", title: "Les risques à surveiller", items: risks.length ? risks : ["Concurrence", "Coût d'acquisition des clients"], n: 5, total },
    ctaSlide("Toute la fiche, gratuitement"),
  ];
}

/** Choisit le contenu du jour. `used` = identifiants d'idées déjà publiées. */
export async function buildDraft(kind: Kind, used: Set<string>, themeIndex = 0): Promise<Draft> {
  const ideas = await allIdeas();
  const fresh = ideas.filter((i) => !used.has(i.id));
  const byScore = (a: Idea, b: Idea) => scoreIdea(b).score - scoreIdea(a).score;

  if (kind === "top5") {
    for (let k = 0; k < COLLECTIONS.length; k++) {
      const c = COLLECTIONS[(themeIndex + k) % COLLECTIONS.length];
      const list = ideas.filter((i) => { try { return c.filter(i); } catch { return false; } }).sort(byScore);
      const pick = [...list.filter((i) => !used.has(i.id)), ...list.filter((i) => used.has(i.id))].slice(0, 5);
      if (pick.length < 5) continue;
      const total = 7;
      const slides: Slide[] = [
        { t: "cover", kicker: "TOP 5", title: `5 idées de ${c.label.toLowerCase()} à lancer en ${new Date().getFullYear()}`, sub: "Classées par score IdeaForge, avec les chiffres. Glisse pour les voir." },
        ...pick.map((it, i): Slide => {
          const f = ideaFacts(it);
          return { t: "rank", rank: i + 1, title: clip(it.title, 70), pitch: clip(it.pitch || "", 130), n: i + 2, total, tiles: [
            { k: "Départ", v: it.budget || f.budget }, { k: "Potentiel", v: it.revenue || f.mrr12Txt }, { k: "Score", v: `${scoreIdea(it).score}/100` },
          ] };
        }),
        ctaSlide("Les fiches complètes sont sur IdeaForge"),
      ];
      return { kind, ideas: pick.map((i) => i.id), slides, caption: await caption(kind, pick, c.label), theme: c.slug };
    }
    kind = "idea"; // aucun thème assez fourni : repli
  }

  let it: Idea | undefined;
  if (kind === "new") it = fresh.filter((i) => i.is_ai).sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""))[0];
  if (!it) it = [...fresh].sort(byScore)[0] ?? [...ideas].sort(byScore)[0];
  const kicker = kind === "new" ? "NOUVELLE IDÉE REPÉRÉE PAR L'IA" : "IDÉE DE BUSINESS CHIFFRÉE";
  return { kind, ideas: [it.id], slides: ideaSlides(it, kicker), caption: await caption(kind, [it]) };
}

/** Légende : écrite par l'IA si disponible, sinon un modèle propre. Toujours avec 5 hashtags de la niche. */
async function caption(kind: Kind, ideas: Idea[], theme?: string): Promise<string> {
  const first = ideas[0];
  const f = ideaFacts(first);
  const fallback =
    kind === "top5"
      ? `5 idées de ${theme?.toLowerCase()} à lancer en ${new Date().getFullYear()}, classées par score 👇\n\n${ideas.map((i, n) => `${n + 1}. ${shortName(i.title)}`).join("\n")}\n\nLaquelle tu lancerais ? Dis-le en commentaire.\n\n👉 Les fiches complètes (budget, concurrents, plan) : lien en bio. 1 fiche offerte à l'inscription.\n\n${HASHTAGS}`
      : `${kind === "new" ? "Nouvelle idée repérée cette semaine" : "Une idée de business chiffrée"} : ${shortName(first.title)} 💡\n\n${clip(first.pitch || "", 180)}\n\n💶 Départ : ${first.budget || f.budget}\n📈 Potentiel : ${first.revenue || f.mrr12Txt}\n\nTu la lancerais ? Dis-moi en commentaire.\n\n👉 La fiche complète (budget détaillé, concurrents, plan) : lien en bio. 1 fiche offerte à l'inscription.\n\n${HASHTAGS}`;
  if (!process.env.ANTHROPIC_API_KEY) return fallback;
  try {
    const facts = ideas.map((i) => `- ${i.title} | ${i.pitch || ""} | départ ${i.budget || ""} | potentiel ${i.revenue || ""}`).join("\n");
    const out = await askClaude(
      `Écris la légende Instagram (en français, tutoiement, ton direct et simple, 600 à 900 caractères) d'un carrousel IdeaForge${kind === "top5" ? ` « 5 idées de ${theme} »` : ""}.
Idée(s) :\n${facts}
Structure : 1 phrase d'accroche forte sur la 1re ligne, 2 à 4 lignes de valeur concrète (chiffres repris tels quels, rien d'inventé), une question pour faire commenter, puis « 👉 La fiche complète : lien en bio. 1 fiche offerte à l'inscription. ».
Termine par exactement ces hashtags sur la dernière ligne : ${HASHTAGS}
Pas de tiret cadratin. Réponds uniquement avec la légende.`,
      700,
    );
    const txt = out.trim().replace(/—/g, ",");
    return txt.length > 80 && txt.length < 2100 ? (txt.includes("#ideedebusiness") ? txt : `${txt}\n\n${HASHTAGS}`) : fallback;
  } catch {
    return fallback;
  }
}

/** Jour de publication selon le calendrier (heure de Paris) : lundi, mercredi, vendredi. */
export function kindForToday(d = new Date()): Kind | null {
  const day = new Date(d.toLocaleString("en-US", { timeZone: "Europe/Paris" })).getDay();
  return day === 1 ? "idea" : day === 3 ? "top5" : day === 5 ? "new" : null;
}
