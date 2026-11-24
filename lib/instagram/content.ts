// Contenu des carrousels Instagram, généré à partir du catalogue IdeaForge, en tunnel TOFU / MOFU / BOFU.
//   lundi    : TOFU (attirer)   : étude du catalogue ou liste d'idées d'un thème, pour un public large
//   mercredi : MOFU (convaincre): étude de cas d'une idée + méthode de notation, ou duel de deux idées
//   vendredi : BOFU (convertir) : ce que contient une fiche complète + l'offre, sur une vraie idée
// Les anciens formats (idea, top5, new) restent disponibles depuis le panel.
import type { Idea } from "@/lib/types";
import { allIdeas, ideaFacts, shortName, clip } from "@/lib/seo";
import { scoreIdea } from "@/lib/score";
import { COLLECTIONS } from "@/lib/collections";
import { askClaude } from "@/lib/anthropic";
import { launchStatus } from "@/lib/launch";
import { PRICE_MONTHLY } from "@/lib/admin";

export type Kind = "idea" | "top5" | "new" | "tofu" | "mofu" | "bofu";

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

const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);
const median = (xs: number[]) => { const v = xs.filter((x) => x > 0).sort((a, b) => a - b); return v.length ? v[Math.floor(v.length / 2)] : 0; };
const eur = (n: number) => `${n.toLocaleString("fr-FR")} €`;
const name = (it: Idea) => shortName(it.title);

/** TOFU : « J'ai analysé N idées » : des chiffres sur tout le catalogue, puis 3 idées à petit budget jamais montrées. */
function tofuStudy(ideas: Idea[], fresh: Idea[], byScore: (a: Idea, b: Idea) => number): Draft {
  const n = ideas.length;
  const small = ideas.filter((i) => (i.budget_min ?? 99_999) <= 1000);
  const ai = ideas.filter((i) => /\bIA\b|agent|GPT|intelligence artificielle/i.test([i.title, i.pitch, ...(i.tags || [])].join(" ")));
  const sectors = Object.entries(ideas.reduce<Record<string, number>>((m, i) => { const k = i.sector || "Autre"; m[k] = (m[k] || 0) + 1; return m; }, {})).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const picks = fresh.filter((i) => (i.budget_min ?? 99_999) <= 1000).sort(byScore).slice(0, 3);
  const three = picks.length === 3 ? picks : [...fresh].sort((a, b) => (a.budget_min ?? 99_999) - (b.budget_min ?? 99_999)).slice(0, 3);
  const total = 6;
  const slides: Slide[] = [
    { t: "cover", kicker: "ÉTUDE IDEAFORGE", title: `J'ai analysé ${n} idées de business|voici ce qu'elles m'ont appris`, sub: "Budget, secteurs, IA : les chiffres de tout le catalogue. Glisse.", stat: `${pct(small.length, n)} %`, statLabel: "se lancent avec moins de 1 000 €" },
    { t: "stats", kicker: "Les chiffres", title: "Ce que dit le catalogue", n: 2, total, tiles: [
      { k: "Idées analysées", v: String(n) },
      { k: "Budget de départ médian", v: eur(median(ideas.map((i) => i.budget_min ?? 0))) },
      { k: "Moins de 1 000 € pour démarrer", v: `${pct(small.length, n)} %` },
      { k: "Utilisent l'IA", v: `${pct(ai.length, n)} %` },
    ] },
    { t: "list", kicker: "Les secteurs", title: "Où se trouvent le plus d'idées", items: sectors.map(([k, v]) => `${k} : ${v} idées (${pct(v, n)} %)`), n: 3, total },
    { t: "text", kicker: "La leçon", title: "Le budget n'est plus l'excuse", body: `${pct(small.length, n)} % des idées du catalogue démarrent avec moins de 1 000 €. Le vrai frein, c'est de choisir quoi lancer : une idée avec une demande réelle, des concurrents qui gagnent déjà de l'argent et un plan clair.`, n: 4, total },
    { t: "list", kicker: "À lancer petit", title: "3 idées qui démarrent avec peu", items: three.map((i) => `${name(i)} : départ ${i.budget || ideaFacts(i).budget}, potentiel ${i.revenue || ideaFacts(i).mrr12Txt}`), n: 5, total },
    { t: "cta", title: "Une idée chiffrée chaque semaine", lines: ["Abonne-toi pour ne rater aucune idée", "Enregistre ce post pour plus tard", "Le catalogue complet : ideaforges.io (lien en bio)"] },
  ];
  return { kind: "tofu", ideas: three.map((i) => i.id), slides, caption: "", theme: "etude" };
}

/** TOFU : liste de 5 idées d'un thème (petit budget, IA, lancement rapide…), pour un public large. */
function tofuList(ideas: Idea[], used: Set<string>, themeIndex: number, byScore: (a: Idea, b: Idea) => number): Draft | null {
  for (let k = 0; k < COLLECTIONS.length; k++) {
    const c = COLLECTIONS[(themeIndex + k) % COLLECTIONS.length];
    const list = ideas.filter((i) => { try { return c.filter(i); } catch { return false; } }).sort(byScore);
    const pick = list.filter((i) => !used.has(i.id)).slice(0, 5);
    if (pick.length < 5) continue;
    const total = 7;
    const slides: Slide[] = [
      { t: "cover", kicker: c.label.toUpperCase(), title: `5 idées de business|à lancer en ${new Date().getFullYear()}`, sub: `Thème « ${c.label} », classées par score et chiffrées. Enregistre-le.` },
      ...pick.map((it, i): Slide => {
        const f = ideaFacts(it);
        return { t: "rank", rank: i + 1, title: clip(it.title, 70), pitch: clip(it.pitch || "", 130), n: i + 2, total, tiles: [
          { k: "Départ", v: it.budget || f.budget }, { k: "Potentiel", v: it.revenue || f.mrr12Txt }, { k: "Score", v: `${scoreIdea(it).score}/100` },
        ] };
      }),
      { t: "cta", title: "Laquelle tu lancerais ?", lines: ["Dis-le en commentaire", "Enregistre ce post pour plus tard", "Toutes les idées : ideaforges.io (lien en bio)"] },
    ];
    return { kind: "tofu", ideas: pick.map((i) => i.id), slides, caption: "", theme: c.slug };
  }
  return null;
}

/** MOFU : étude de cas d'une idée, avec la méthode de notation IdeaForge (confiance). */
function mofuCase(it: Idea): Draft {
  const sc = scoreIdea(it);
  const base = ideaSlides(it, "ÉTUDE DE CAS").slice(0, 5);
  const total = 7;
  const slides: Slide[] = [
    ...base.map((x) => ("total" in x ? { ...x, total } : x)) as Slide[],
    { t: "stats", kicker: "La méthode", title: `Pourquoi elle a ${sc.score}/100`, n: 6, total, tiles: [
      { k: "Demande", v: `${sc.demand}/100` }, { k: "Concurrence", v: `${sc.competition}/100` }, { k: "Marge", v: `${sc.margin}/100` }, { k: "Vitesse de lancement", v: `${sc.speed}/100` },
    ] },
    ctaSlide("Toute la fiche, gratuitement"),
  ];
  return { kind: "mofu", ideas: [it.id], slides, caption: "", theme: "cas" };
}

/** MOFU : duel de deux idées d'un même thème, avec un verdict selon le profil. */
function mofuDuel(a: Idea, b: Idea): Draft {
  const fa = ideaFacts(a), fb = ideaFacts(b);
  const sa = scoreIdea(a).score, sb = scoreIdea(b).score;
  const cheaper = (a.budget_min ?? fa.budgetNum) <= (b.budget_min ?? fb.budgetNum) ? a : b;
  const richer = fa.mrr12 >= fb.mrr12 ? a : b;
  const best = sa >= sb ? a : b;
  const total = 5;
  const tiles = (it: Idea, f: ReturnType<typeof ideaFacts>, s: number) => [
    { k: "Départ", v: it.budget || f.budget }, { k: "Potentiel", v: it.revenue || f.mrr12Txt }, { k: "Délai", v: it.delai || "·" }, { k: "Score", v: `${s}/100` },
  ];
  const slides: Slide[] = [
    { t: "cover", kicker: "LE DUEL", title: `${clip(name(a), 34)}|ou ${clip(name(b), 34)} ?`, sub: "Deux idées, les mêmes critères. Laquelle tu lancerais ?" },
    { t: "stats", kicker: "Idée A", title: clip(a.title, 70), n: 2, total, tiles: tiles(a, fa, sa) },
    { t: "stats", kicker: "Idée B", title: clip(b.title, 70), n: 3, total, tiles: tiles(b, fb, sb) },
    { t: "list", kicker: "Le verdict", title: "Ça dépend de toi", items: [
      `Petit budget : ${name(cheaper)}`, `Plus gros potentiel : ${name(richer)}`, `Meilleur score global : ${name(best)} (${Math.max(sa, sb)}/100)`,
    ], n: 4, total },
    { t: "cta", title: "A ou B ? Dis-le en commentaire", lines: ["Les deux fiches complètes sont sur IdeaForge", "1 fiche complète offerte à l'inscription", "Lien en bio"] },
  ];
  return { kind: "mofu", ideas: [a.id, b.id], slides, caption: "", theme: "duel" };
}

/** BOFU : ce que contient une fiche IdeaForge (sur une vraie idée) + l'offre du moment. */
async function bofuOffer(it: Idea): Promise<Draft> {
  const f = ideaFacts(it);
  const sc = scoreIdea(it).score;
  const launch = await launchStatus();
  const steps = (it.steps || []).slice(0, 3).map((x) => clip(x, 80));
  const comps = (f.competitors || []).slice(0, 3);
  const total = 7;
  const slides: Slide[] = [
    { t: "cover", kicker: "DANS UNE FICHE IDEAFORGE", title: "On a fait le travail|à ta place", sub: `Exemple réel : « ${clip(name(it), 60)} ». Voici tout ce que tu reçois.`, stat: `${sc}/100`, statLabel: "score IdeaForge de cette idée" },
    { t: "stats", kicker: "Les chiffres", title: "La projection sur 12 mois", n: 2, total, tiles: [
      { k: "Mise de départ", v: it.budget || f.budget },
      { k: "Revenu mensuel à 12 mois", v: f.mrr12Txt },
      { k: "Clients à 12 mois", v: String(f.clients12) },
      { k: "Rentable dès", v: f.breakEven ? `le mois ${f.breakEven}` : "à calculer" },
    ] },
    { t: "list", kicker: "La preuve", title: "Ceux qui gagnent déjà de l'argent", items: comps.length ? comps.map((c) => `Concurrent : ${c}`) : [clip(it.benchmark || "Les concurrents et leurs prix sont listés dans la fiche", 110)], n: 3, total },
    { t: "list", kicker: "Le plan", title: "Ton plan de lancement", items: [...(steps.length ? steps : ["Valider la demande", "Construire la première version", "Trouver 10 premiers clients"]), "Le prompt « Lancer avec Claude » pour coder ton MVP"], n: 4, total },
    { t: "list", kicker: "Inclus", title: "Tout ce que contient l'accès", items: [`Toutes les fiches (${(await allIdeas()).length} idées) et les nouvelles chaque semaine`, "Projections sur 24 mois, concurrents, risques", "Le validateur d'idées et le calculateur de revenus", "Le pack de 50 prompts prêts à coller"], n: 5, total },
    { t: "stats", kicker: "L'offre", title: launch.active ? `Offre de lancement : ${launch.remaining} places` : "Un prix simple", n: 6, total, tiles: [
      { k: "Accès à vie", v: launch.active ? `${launch.price} € au lieu de ${launch.full} €` : `${launch.full} €` },
      { k: "Ou par mois", v: `${PRICE_MONTHLY} €` },
      { k: "Garantie", v: "14 jours remboursé" },
      { k: "Pour essayer", v: "1 fiche offerte" },
    ] },
    { t: "cta", title: "Ta première fiche est offerte", lines: ["Inscris-toi en 10 secondes sur ideaforges.io", "Choisis l'idée qui te ressemble", "Lien en bio"] },
  ];
  return { kind: "bofu", ideas: [it.id], slides, caption: "", theme: "offre" };
}

/** Choisit le contenu du jour. `used` = identifiants d'idées déjà publiées. */
export async function buildDraft(kind: Kind, used: Set<string>, themeIndex = 0): Promise<Draft> {
  const ideas = await allIdeas();
  const fresh = ideas.filter((i) => !used.has(i.id));
  const byScore = (a: Idea, b: Idea) => scoreIdea(b).score - scoreIdea(a).score;

  if (kind === "tofu") {
    const d = themeIndex % 2 === 0 ? tofuStudy(ideas, fresh, byScore) : tofuList(ideas, used, themeIndex >> 1, byScore) ?? tofuStudy(ideas, fresh, byScore);
    return { ...d, caption: await caption("tofu", ideas.filter((i) => d.ideas.includes(i.id)), d.theme) };
  }
  if (kind === "mofu") {
    const sorted = [...fresh].sort(byScore);
    let d: Draft | null = null;
    if (themeIndex % 2 === 1) {
      for (const c of COLLECTIONS) {
        const pair = sorted.filter((i) => { try { return c.filter(i); } catch { return false; } }).slice(0, 2);
        if (pair.length === 2) { d = mofuDuel(pair[0], pair[1]); break; }
      }
    }
    if (!d) d = mofuCase(sorted[0] ?? [...ideas].sort(byScore)[0]);
    return { ...d, caption: await caption("mofu", ideas.filter((i) => d!.ideas.includes(i.id)), d.theme) };
  }
  if (kind === "bofu") {
    const it = [...fresh].sort(byScore)[0] ?? [...ideas].sort(byScore)[0];
    const d = await bofuOffer(it);
    return { ...d, caption: await caption("bofu", [it], d.theme) };
  }

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
  const stage: Record<string, string> = {
    tofu: "C'est un post TOFU (haut du tunnel) : il doit attirer des gens qui ne connaissent pas encore IdeaForge, donner de la valeur gratuite et pousser à enregistrer, partager et s'abonner. Pas de vente.",
    mofu: "C'est un post MOFU (milieu du tunnel) : il doit montrer que la méthode IdeaForge est sérieuse (chiffres, notation) et faire commenter.",
    bofu: "C'est un post BOFU (bas du tunnel) : il doit donner envie de s'inscrire sur ideaforges.io (1 fiche offerte), en citant l'offre, la garantie de 14 jours et ce que contient une fiche, sans mentir ni exagérer.",
  };
  const fb2: Record<string, string> = {
    tofu: `Tu veux te lancer mais tu ne sais pas quoi ? 👇\n\n${ideas.map((i, n) => `${n + 1}. ${shortName(i.title)} : départ ${i.budget || ideaFacts(i).budget}`).join("\n")}\n\nEnregistre ce post et abonne-toi : une idée chiffrée chaque semaine.\n\n👉 Tout le catalogue : lien en bio.\n\n${HASHTAGS}`,
    mofu: `${ideas.map((i) => shortName(i.title)).join(" ou ")} ? 🤔\n\nOn compare les chiffres : budget de départ, potentiel, délai et score IdeaForge.\n\nTu choisirais laquelle ? Dis-le en commentaire.\n\n👉 Les fiches complètes : lien en bio. 1 fiche offerte à l'inscription.\n\n${HASHTAGS}`,
    bofu: `On a fait le travail à ta place 🛠️\n\nDans chaque fiche IdeaForge : le budget de départ, la projection sur 12 mois, les concurrents qui gagnent déjà de l'argent, le plan de lancement et le prompt pour coder ton MVP avec l'IA.\n\nExemple : ${shortName(first.title)}.\n\n👉 Ta première fiche est offerte : lien en bio. Garantie 14 jours.\n\n${HASHTAGS}`,
  };
  if (fb2[kind] && !process.env.ANTHROPIC_API_KEY) return fb2[kind];
  if (!process.env.ANTHROPIC_API_KEY) return fallback;
  try {
    const facts = ideas.map((i) => `- ${i.title} | ${i.pitch || ""} | départ ${i.budget || ""} | potentiel ${i.revenue || ""}`).join("\n");
    const out = await askClaude(
      `Écris la légende Instagram (en français, tutoiement, ton direct et simple, 600 à 900 caractères) d'un carrousel IdeaForge${kind === "top5" ? ` « 5 idées de ${theme} »` : ""}.
Idée(s) :\n${facts}${stage[kind] ? `\n${stage[kind]}` : ""}
Structure : 1 phrase d'accroche forte sur la 1re ligne, 2 à 4 lignes de valeur concrète (chiffres repris tels quels, rien d'inventé), une question pour faire commenter, puis « 👉 La fiche complète : lien en bio. 1 fiche offerte à l'inscription. ».
Termine par exactement ces hashtags sur la dernière ligne : ${HASHTAGS}
Pas de tiret cadratin. Réponds uniquement avec la légende.`,
      700,
    );
    const txt = out.trim().replace(/—/g, ",");
    return txt.length > 80 && txt.length < 2100 ? (txt.includes("#ideedebusiness") ? txt : `${txt}\n\n${HASHTAGS}`) : (fb2[kind] ?? fallback);
  } catch {
    return fb2[kind] ?? fallback;
  }
}

/** Jour de publication selon le calendrier (heure de Paris) : lundi TOFU, mercredi MOFU, vendredi BOFU. */
export function kindForToday(d = new Date()): Kind | null {
  const day = new Date(d.toLocaleString("en-US", { timeZone: "Europe/Paris" })).getDay();
  return day === 1 ? "tofu" : day === 3 ? "mofu" : day === 5 ? "bofu" : null;
}
