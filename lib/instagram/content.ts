// Contenu des carrousels Instagram, généré à partir du catalogue IdeaForge, en tunnel TOFU / MOFU / BOFU.
//   lundi    : TOFU (attirer)   : étude du catalogue ou liste d'idées d'un thème, pour un public large
//   mercredi : MOFU (convaincre): étude de cas d'une idée + méthode de notation, ou duel de deux idées
//   vendredi : BOFU (convertir) : ce que contient une fiche complète + l'offre, sur une vraie idée
// Les anciens formats (idea, top5, new) restent disponibles depuis le panel.
import type { Idea } from "@/lib/types";
import { allIdeas, ideaFacts, shortName, clip } from "@/lib/seo";
import { getDossier } from "@/lib/dossier";
import { scenarios, eurK } from "@/lib/dossier/engine";
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

// ───────── Anti-répétition ─────────
// Chaque bouton (TOFU, MOFU, BOFU, 1 idée chiffrée, Top 5, Nouvelle idée IA) a plusieurs formats.
// On choisit le format le moins utilisé (jamais le même que la dernière fois), le thème le moins utilisé,
// une accroche de couverture jamais vue et uniquement des idées jamais montrées sur Instagram.
export type Hist = { kind: string; theme: string | null; cover: string };
type Ctx = { ideas: Idea[]; fresh: Idea[]; used: Set<string>; hist: Hist[]; mine: Hist[]; byScore: (a: Idea, b: Idea) => number };
type Fmt = { slug: string; build: (c: Ctx) => Promise<Draft | null> | Draft | null };

const YEAR = () => new Date().getFullYear();
/** Format d'un ancien carrousel (les anciens thèmes n'avaient pas encore de préfixe). */
function fmtOf(h: Hist): string {
  const t = h.theme || "";
  if (!t) return h.kind === "idea" || h.kind === "new" ? "fiche" : h.kind;
  if (h.kind === "tofu" && t === "etude") return "etude-budget";
  if (t.startsWith("idees-")) return h.kind === "top5" ? "top5" : "liste";
  return t.split(":")[0];
}
const collUses = (hist: Hist[], slug: string) => hist.filter((h) => (h.theme || "") === slug || (h.theme || "").endsWith(`:${slug}`)).length;
/** Première accroche jamais utilisée, sinon on tourne. */
function cover(c: Ctx, options: string[]) {
  const seen = new Set(c.hist.map((h) => h.cover));
  return options.find((o) => !seen.has(o)) ?? options[c.mine.length % options.length];
}
const inColl = (col: (typeof COLLECTIONS)[number], i: Idea) => { try { return col.filter(i); } catch { return false; } };
/** Thèmes du moins utilisé au plus utilisé, avec au moins `need` idées jamais montrées. */
function collections(c: Ctx, need: number) {
  return COLLECTIONS.map((col, i) => ({ col, i, n: collUses(c.hist, col.slug), pick: c.fresh.filter((it) => inColl(col, it)).sort(c.byScore) }))
    .filter((x) => x.pick.length >= need)
    .sort((a, b) => a.n - b.n || a.i - b.i);
}
function weeks(it: Idea): number {
  const m = (it.delai || "").toLowerCase().match(/(\d+(?:,\d+)?)\s*(?:[–-]\s*\d+(?:,\d+)?)?\s*(sem|mois|jour|j\b)/);
  if (!m) return 99;
  const v = parseFloat(m[1].replace(",", "."));
  return m[2] === "mois" ? v * 4.3 : m[2].startsWith("j") ? v / 7 : v;
}
const pot = (it: Idea) => it.revenue || ideaFacts(it).mrr12Txt;
const dep = (it: Idea) => it.budget || ideaFacts(it).budget;
const isAI = (i: Idea) => /\bIA\b|agent|GPT|intelligence artificielle/i.test([i.title, i.pitch, ...(i.tags || [])].join(" "));

// ───────── TOFU : attirer ─────────
function tofuStudy(c: Ctx, angle: "budget" | "ia" | "vitesse"): Draft | null {
  const { ideas, fresh, byScore } = c;
  const n = ideas.length;
  const total = 6;
  const sectorsOf = (list: Idea[]) => Object.entries(list.reduce<Record<string, number>>((m, i) => { const k = i.sector || "Autre"; m[k] = (m[k] || 0) + 1; return m; }, {})).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const cta: Slide = { t: "cta", title: "Une idée chiffrée chaque semaine", lines: ["Abonne-toi pour ne rater aucune idée", "Enregistre ce post pour plus tard", "Le catalogue complet : ideaforges.io (lien en bio)"] };
  if (angle === "budget") {
    const small = ideas.filter((i) => (i.budget_min ?? 99_999) <= 1000);
    const picks = fresh.filter((i) => (i.budget_min ?? 99_999) <= 1000).sort(byScore).slice(0, 3);
    if (picks.length < 3) return null;
    const slides: Slide[] = [
      { t: "cover", kicker: "ÉTUDE IDEAFORGE", title: cover(c, [`J'ai analysé ${n} idées de business|voici ce qu'elles m'ont appris`, `${pct(small.length, n)} % des idées|démarrent avec moins de 1 000 €`, `Le budget n'est plus une excuse|la preuve avec ${n} idées`]), sub: "Budget, secteurs, IA : les chiffres de tout le catalogue. Glisse.", stat: `${pct(small.length, n)} %`, statLabel: "se lancent avec moins de 1 000 €" },
      { t: "stats", kicker: "Les chiffres", title: "Ce que dit le catalogue", n: 2, total, tiles: [
        { k: "Idées analysées", v: String(n) },
        { k: "Budget de départ médian", v: eur(median(ideas.map((i) => i.budget_min ?? 0))) },
        { k: "Moins de 1 000 € pour démarrer", v: `${pct(small.length, n)} %` },
        { k: "Utilisent l'IA", v: `${pct(ideas.filter(isAI).length, n)} %` },
      ] },
      { t: "list", kicker: "Les secteurs", title: "Où se trouvent le plus d'idées", items: sectorsOf(ideas).map(([k, v]) => `${k} : ${v} idées (${pct(v, n)} %)`), n: 3, total },
      { t: "text", kicker: "La leçon", title: "Le budget n'est plus l'excuse", body: `${pct(small.length, n)} % des idées du catalogue démarrent avec moins de 1 000 €. Le vrai frein, c'est de choisir quoi lancer : une idée avec une demande réelle, des concurrents qui gagnent déjà de l'argent et un plan clair.`, n: 4, total },
      { t: "list", kicker: "À lancer petit", title: "3 idées qui démarrent avec peu", items: picks.map((i) => `${name(i)} : départ ${dep(i)}, potentiel ${pot(i)}`), n: 5, total },
      cta,
    ];
    return { kind: "tofu", ideas: picks.map((i) => i.id), slides, caption: "", theme: "etude-budget" };
  }
  if (angle === "ia") {
    const ai = ideas.filter(isAI);
    const picks = fresh.filter(isAI).sort(byScore).slice(0, 3);
    if (picks.length < 3 || ai.length < 5) return null;
    const slides: Slide[] = [
      { t: "cover", kicker: "ÉTUDE IDEAFORGE", title: cover(c, [`J'ai analysé ${n} idées|voici ce que l'IA change`, `${pct(ai.length, n)} % des idées utilisent l'IA|voici lesquelles`, `L'IA dans ${n} idées de business|ce que montrent les chiffres`]), sub: "Combien coûte une idée avec l'IA, combien elle rapporte, et où elle se trouve. Glisse.", stat: `${pct(ai.length, n)} %`, statLabel: "des idées utilisent l'IA" },
      { t: "stats", kicker: "Les chiffres", title: "Les idées avec l'IA", n: 2, total, tiles: [
        { k: "Idées analysées", v: String(n) },
        { k: "Utilisent l'IA", v: `${ai.length} idées` },
        { k: "Budget de départ médian", v: eur(median(ai.map((i) => i.budget_min ?? 0))) },
        { k: "Revenu mensuel médian à 12 mois", v: eur(Math.round(median(ai.map((i) => ideaFacts(i).mrr12)) / 100) * 100) },
      ] },
      { t: "list", kicker: "Les secteurs", title: "Où l'IA est la plus présente", items: sectorsOf(ai).map(([k, v]) => `${k} : ${v} idées`), n: 3, total },
      { t: "text", kicker: "La leçon", title: "L'IA ne remplace pas l'idée", body: "L'IA rend un produit moins cher à construire, mais elle ne trouve pas les clients à ta place. Les meilleures idées vendent un résultat précis à un métier précis, qui paie déjà pour régler ce problème.", n: 4, total },
      { t: "list", kicker: "À regarder", title: "3 idées avec l'IA", items: picks.map((i) => `${name(i)} : départ ${dep(i)}, potentiel ${pot(i)}`), n: 5, total },
      cta,
    ];
    return { kind: "tofu", ideas: picks.map((i) => i.id), slides, caption: "", theme: "etude-ia" };
  }
  const fast = ideas.filter((i) => weeks(i) <= 4);
  const picks = fresh.filter((i) => weeks(i) <= 4).sort((a, b) => weeks(a) - weeks(b) || byScore(a, b)).slice(0, 3);
  if (picks.length < 3 || fast.length < 5) return null;
  const be = ideas.map((i) => ideaFacts(i).breakEven).filter((x): x is number => !!x);
  const slides: Slide[] = [
    { t: "cover", kicker: "ÉTUDE IDEAFORGE", title: cover(c, [`J'ai analysé ${n} idées|lesquelles se lancent en un mois ?`, `${pct(fast.length, n)} % des idées|se lancent en 4 semaines ou moins`, `Lancer vite :|ce que disent ${n} idées chiffrées`]), sub: "Délai de lancement, rentabilité : les chiffres de tout le catalogue. Glisse.", stat: `${pct(fast.length, n)} %`, statLabel: "se lancent en 4 semaines ou moins" },
    { t: "stats", kicker: "Les chiffres", title: "Le temps pour se lancer", n: 2, total, tiles: [
      { k: "Idées analysées", v: String(n) },
      { k: "Lancement en 4 semaines ou moins", v: `${pct(fast.length, n)} %` },
      { k: "Rentables en 6 mois ou moins", v: `${pct(be.filter((x) => x <= 6).length, n)} %` },
      { k: "Rentables en 12 mois ou moins", v: `${pct(be.filter((x) => x <= 12).length, n)} %` },
    ] },
    { t: "list", kicker: "Les secteurs", title: "Où se trouvent les idées rapides", items: sectorsOf(fast).map(([k, v]) => `${k} : ${v} idées`), n: 3, total },
    { t: "text", kicker: "La leçon", title: "Lancer vite, c'est apprendre vite", body: "Une première version en quelques semaines te dit très vite si des clients paient. Tu évites de passer un an sur un produit que personne n'attend, et tu ajustes avec de vrais retours.", n: 4, total },
    { t: "list", kicker: "À lancer vite", title: "3 idées qui se lancent vite", items: picks.map((i) => `${name(i)} : ${i.delai || "délai court"}, départ ${dep(i)}`), n: 5, total },
    cta,
  ];
  return { kind: "tofu", ideas: picks.map((i) => i.id), slides, caption: "", theme: "etude-vitesse" };
}

/** Liste de 5 idées jamais montrées, dans le thème le moins utilisé. */
function listDraft(c: Ctx, kind: "tofu" | "top5"): Draft | null {
  const x = collections(c, 5)[0];
  if (!x) return null;
  const { col } = x;
  const pick = x.pick.slice(0, 5);
  const total = 7;
  const title = kind === "top5"
    ? cover(c, [`5 idées de ${col.label.toLowerCase()}|à lancer en ${YEAR()}`, `Top 5 ${col.label}|classé par score`, `${col.label} : 5 idées|chiffrées et notées`])
    : cover(c, [`5 idées de business|${col.label.toLowerCase()}`, `${col.label} :|5 idées que personne ne lance`, `5 idées ${col.label.toLowerCase()}|à copier en ${YEAR()}`]);
  const slides: Slide[] = [
    { t: "cover", kicker: kind === "top5" ? "TOP 5" : col.label.toUpperCase(), title, sub: `Thème « ${col.label} », classées par score et chiffrées. Enregistre-le.` },
    ...pick.map((it, i): Slide => ({ t: "rank", rank: i + 1, title: clip(it.title, 70), pitch: clip(it.pitch || "", 130), n: i + 2, total, tiles: [
      { k: "Départ", v: dep(it) }, { k: "Potentiel", v: pot(it) }, { k: "Score", v: `${scoreIdea(it).score}/100` },
    ] })),
    kind === "top5" ? ctaSlide("Les fiches complètes sont sur IdeaForge") : { t: "cta", title: "Laquelle tu lancerais ?", lines: ["Dis-le en commentaire", "Enregistre ce post pour plus tard", "Toutes les idées : ideaforges.io (lien en bio)"] },
  ];
  return { kind, ideas: pick.map((i) => i.id), slides, caption: "", theme: `${kind === "top5" ? "top5" : "liste"}:${col.slug}` };
}

function tofuErrors(c: Ctx): Draft {
  const total = 7;
  const e = [
    ["Coder avant de valider", "Des semaines à construire un produit que personne n'a demandé. Commence par 10 conversations avec ta cible et une page qui présente ton offre."],
    ["Fuir les idées avec des concurrents", "Pas de concurrent, c'est souvent pas de marché. Des concurrents qui gagnent de l'argent, c'est la preuve que des clients paient déjà."],
    ["Fixer un prix trop bas", "À 5 € par mois, il te faut 800 clients pour faire 4 000 €. À 49 €, il en faut 82. Choisis un problème qui coûte cher à ton client."],
    ["Viser tout le monde", "« Pour les PME » ne veut rien dire. « Pour les plombiers qui perdent des devis », si. Une cible précise se trouve et se convainc plus vite."],
    ["Lancer sans plan pour les premiers clients", "Un produit ne se vend pas tout seul. Avant de lancer, note où se trouvent tes 10 premiers clients et comment tu vas leur parler."],
  ];
  const slides: Slide[] = [
    { t: "cover", kicker: "À ÉVITER", title: cover(c, ["5 erreurs qui tuent un business|avant même le lancement", "Pourquoi la plupart des projets|ne passent pas les 3 premiers mois"]), sub: "On les voit encore et encore. Enregistre ce post avant de te lancer." },
    ...e.map(([title, body], i): Slide => ({ t: "text", kicker: `Erreur n°${i + 1}`, title, body, n: i + 2, total })),
    { t: "cta", title: "Tu en as fait une ?", lines: ["Dis-le en commentaire, sans honte", "Enregistre ce post pour plus tard", "Des idées déjà chiffrées : ideaforges.io (lien en bio)"] },
  ];
  return { kind: "tofu", ideas: [], slides, caption: "", theme: "erreurs" };
}

function tofuValidate(c: Ctx): Draft {
  const total = 6;
  const slides: Slide[] = [
    { t: "cover", kicker: "MÉTHODE", title: cover(c, ["Valide ton idée en 7 jours|sans écrire une ligne de code", "Ton idée vaut-elle quelque chose ?|le test en 7 jours"]), sub: "Le plan jour par jour pour savoir si des gens paieraient. Enregistre-le." },
    { t: "list", kicker: "Jours 1 à 3", title: "Comprendre le problème", items: ["Jour 1 : écris le problème en une phrase et ta cible précise", "Jour 2 : trouve 3 concurrents et note leurs prix", "Jour 3 : parle à 5 personnes de ta cible"], n: 2, total },
    { t: "list", kicker: "Jours 4 à 7", title: "Tester l'offre", items: ["Jour 4 : crée une page simple avec ton offre et un prix", "Jour 5 : partage-la là où se trouve ta cible", "Jour 6 : compte les inscriptions et les réponses", "Jour 7 : tu lances, tu ajustes ou tu changes d'idée"], n: 3, total },
    { t: "text", kicker: "Le bon signal", title: "Ce qui compte vraiment", body: "Des gens qui laissent leur e-mail ou demandent le prix, c'est un vrai signal. Des « c'est sympa ton idée », non. Compte les actes, pas les compliments.", n: 4, total },
    { t: "text", kicker: "Le raccourci", title: "L'étape 2 est déjà faite", body: `Sur IdeaForge, chacune des ${c.ideas.length} idées a déjà ses concurrents, leurs prix, un budget de départ et un plan de lancement. Tu passes directement aux conversations avec tes clients.`, n: 5, total },
    { t: "cta", title: "Enregistre ce plan", lines: ["Partage-le à quelqu'un qui hésite à se lancer", "Abonne-toi pour la suite", "Des idées déjà chiffrées : ideaforges.io (lien en bio)"] },
  ];
  return { kind: "tofu", ideas: [], slides, caption: "", theme: "valider" };
}

// ───────── MOFU : convaincre ─────────
function mofuCase(c: Ctx): Draft | null {
  const it = [...c.fresh].sort(c.byScore)[0];
  if (!it) return null;
  const sc = scoreIdea(it);
  const kickers = ["ÉTUDE DE CAS", "À LA LOUPE", "ON DÉCORTIQUE UNE IDÉE"];
  const base = ideaSlides(it, kickers[c.mine.filter((h) => fmtOf(h) === "cas").length % kickers.length]).slice(0, 5);
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

function mofuDuel(c: Ctx): Draft | null {
  const x = collections(c, 2)[0];
  if (!x) return null;
  const [a, b] = x.pick;
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
    { t: "cover", kicker: `LE DUEL · ${x.col.label.toUpperCase()}`, title: `${clip(name(a), 34)}|ou ${clip(name(b), 34)} ?`, sub: "Deux idées, les mêmes critères. Laquelle tu lancerais ?" },
    { t: "stats", kicker: "Idée A", title: clip(a.title, 70), n: 2, total, tiles: tiles(a, fa, sa) },
    { t: "stats", kicker: "Idée B", title: clip(b.title, 70), n: 3, total, tiles: tiles(b, fb, sb) },
    { t: "list", kicker: "Le verdict", title: "Ça dépend de toi", items: [
      `Petit budget : ${name(cheaper)}`, `Plus gros potentiel : ${name(richer)}`, `Meilleur score global : ${name(best)} (${Math.max(sa, sb)}/100)`,
    ], n: 4, total },
    { t: "cta", title: "A ou B ? Dis-le en commentaire", lines: ["Les deux fiches complètes sont sur IdeaForge", "1 fiche complète offerte à l'inscription", "Lien en bio"] },
  ];
  return { kind: "mofu", ideas: [a.id, b.id], slides, caption: "", theme: `duel:${x.col.slug}` };
}

/** MOFU : combien peut rapporter une idée, en 3 scénarios sur 24 mois. */
function mofuCalc(c: Ctx): Draft | null {
  const it = [...c.fresh].sort((a, b) => ideaFacts(b).mrr12 - ideaFacts(a).mrr12)[0];
  if (!it) return null;
  const { dossier: d } = getDossier(it);
  const sc = scenarios(d, it);
  const f = ideaFacts(it);
  const at = (k: number, m: number) => { const arr = sc[k].mrr; return eurK(arr[Math.min(m, arr.length) - 1]); };
  const total = 6;
  const slides: Slide[] = [
    { t: "cover", kicker: "LE CALCUL", title: cover(c, [`Combien peut rapporter|${clip(name(it), 40)} ?`, `${clip(name(it), 40)} :|le calcul sur 2 ans`]), sub: "3 scénarios sur 24 mois, calculés à partir du dossier de l'idée. Glisse.", stat: at(1, 24), statLabel: "par mois au bout de 2 ans (scénario réaliste)" },
    { t: "stats", kicker: "Les hypothèses", title: "D'où partent les calculs", n: 2, total, tiles: [
      { k: "Mise de départ", v: dep(it) }, { k: "Revenu moyen par client", v: `${f.arpuTxt}/mois` }, { k: "Clients à 12 mois", v: String(f.clients12) }, { k: "Rentable dès", v: f.breakEven ? `le mois ${f.breakEven}` : "à calculer" },
    ] },
    { t: "stats", kicker: "Au bout de 12 mois", title: "Revenu mensuel selon le scénario", n: 3, total, tiles: [
      { k: "Prudent", v: at(0, 12) }, { k: "Réaliste", v: at(1, 12) }, { k: "Ambitieux", v: at(2, 12) },
    ] },
    { t: "stats", kicker: "Au bout de 24 mois", title: "Revenu mensuel selon le scénario", n: 4, total, tiles: [
      { k: "Prudent", v: at(0, 24) }, { k: "Réaliste", v: at(1, 24) }, { k: "Ambitieux", v: at(2, 24) },
    ] },
    { t: "text", kicker: "Ce que ça veut dire", title: "Une projection, pas une promesse", body: `Ces chiffres servent à voir si l'idée peut te faire vivre, et combien de clients il te faut : environ ${f.clients12} clients actifs à 12 mois dans le scénario réaliste. Toutes les hypothèses sont affichées dans la fiche.`, n: 5, total },
    ctaSlide("Fais le calcul sur ton idée"),
  ];
  return { kind: "mofu", ideas: [it.id], slides, caption: "", theme: "calcul" };
}

/** MOFU : comment IdeaForge note une idée sur 100, avec un exemple. */
function mofuMethod(c: Ctx): Draft | null {
  const it = [...c.fresh].sort(c.byScore)[0];
  if (!it) return null;
  const sc = scoreIdea(it);
  const total = 5;
  const slides: Slide[] = [
    { t: "cover", kicker: "LA MÉTHODE", title: cover(c, ["Comment on note|une idée sur 100", "Une idée, 4 critères|zéro feeling"]), sub: "Les mêmes règles pour toutes les idées du catalogue. Glisse.", stat: `${c.ideas.length}`, statLabel: "idées notées avec la même méthode" },
    { t: "list", kicker: "Les 4 critères", title: "Ce qu'on mesure", items: ["Demande : des gens cherchent et paient déjà pour ce problème", "Concurrence : assez pour prouver le marché, pas trop pour percer", "Marge : ce qu'il te reste sur chaque vente", "Vitesse : le temps pour lancer une première version"], n: 2, total },
    { t: "stats", kicker: "Exemple", title: clip(it.title, 70), n: 3, total, tiles: [
      { k: "Demande", v: `${sc.demand}/100` }, { k: "Concurrence", v: `${sc.competition}/100` }, { k: "Marge", v: `${sc.margin}/100` }, { k: "Vitesse", v: `${sc.speed}/100` },
    ] },
    { t: "text", kicker: "Pourquoi c'est utile", title: "Comparer sans se mentir", body: `Résultat pour cet exemple : ${sc.score}/100. Un score ne décide pas à ta place, mais il t'évite de passer des mois sur une idée sans demande, et il compare des idées très différentes avec la même règle.`, n: 4, total },
    ctaSlide("Toutes les idées sont notées"),
  ];
  return { kind: "mofu", ideas: [it.id], slides, caption: "", theme: "methode" };
}

// ───────── BOFU : convertir ─────────
async function offerTiles(): Promise<{ title: string; tiles: { k: string; v: string }[] }> {
  const launch = await launchStatus();
  return { title: launch.active ? `Offre de lancement : ${launch.remaining} places` : "Un prix simple", tiles: [
    { k: "Accès à vie", v: launch.active ? `${launch.price} € au lieu de ${launch.full} €` : `${launch.full} €` },
    { k: "Ou par mois", v: `${PRICE_MONTHLY} €` },
    { k: "Garantie", v: "14 jours remboursé" },
    { k: "Pour essayer", v: "1 fiche offerte" },
  ] };
}
const finalCta: Slide = { t: "cta", title: "Ta première fiche est offerte", lines: ["Inscris-toi en 10 secondes sur ideaforges.io", "Choisis l'idée qui te ressemble", "Lien en bio"] };

async function bofuOffer(c: Ctx): Promise<Draft | null> {
  const it = [...c.fresh].sort(c.byScore)[0];
  if (!it) return null;
  const f = ideaFacts(it);
  const sc = scoreIdea(it).score;
  const steps = (it.steps || []).slice(0, 3).map((x) => clip(x, 80));
  const comps = (f.competitors || []).slice(0, 3);
  const o = await offerTiles();
  const total = 7;
  const slides: Slide[] = [
    { t: "cover", kicker: "DANS UNE FICHE IDEAFORGE", title: cover(c, ["On a fait le travail|à ta place", "Ton business plan|est déjà prêt", "Tout ce qu'il y a|dans une fiche IdeaForge"]), sub: `Exemple réel : « ${clip(name(it), 60)} ». Voici tout ce que tu reçois.`, stat: `${sc}/100`, statLabel: "score IdeaForge de cette idée" },
    { t: "stats", kicker: "Les chiffres", title: "La projection sur 12 mois", n: 2, total, tiles: [
      { k: "Mise de départ", v: dep(it) }, { k: "Revenu mensuel à 12 mois", v: f.mrr12Txt }, { k: "Clients à 12 mois", v: String(f.clients12) }, { k: "Rentable dès", v: f.breakEven ? `le mois ${f.breakEven}` : "à calculer" },
    ] },
    { t: "list", kicker: "La preuve", title: "Ceux qui gagnent déjà de l'argent", items: comps.length ? comps.map((x) => `Concurrent : ${x}`) : [clip(it.benchmark || "Les concurrents et leurs prix sont listés dans la fiche", 110)], n: 3, total },
    { t: "list", kicker: "Le plan", title: "Ton plan de lancement", items: [...(steps.length ? steps : ["Valider la demande", "Construire la première version", "Trouver 10 premiers clients"]), "Le prompt « Lancer avec Claude » pour coder ton MVP"], n: 4, total },
    { t: "list", kicker: "Inclus", title: "Tout ce que contient l'accès", items: [`Toutes les fiches (${c.ideas.length} idées) et les nouvelles chaque semaine`, "Projections sur 24 mois, concurrents, risques", "Le validateur d'idées et le calculateur de revenus", "Le pack de 50 prompts prêts à coller"], n: 5, total },
    { t: "stats", kicker: "L'offre", title: o.title, n: 6, total, tiles: o.tiles },
    finalCta,
  ];
  return { kind: "bofu", ideas: [it.id], slides, caption: "", theme: "offre" };
}

async function bofuObjections(c: Ctx): Promise<Draft> {
  const launch = await launchStatus();
  const total = 7;
  const qa: [string, string][] = [
    ["C'est payant ?", launch.active ? `Ta première fiche est offerte. Ensuite, c'est ${PRICE_MONTHLY} € par mois, ou ${launch.price} € une seule fois pendant l'offre de lancement (au lieu de ${launch.full} €).` : `Ta première fiche est offerte. Ensuite, c'est ${PRICE_MONTHLY} € par mois, ou ${launch.full} € une seule fois pour un accès à vie.`],
    ["Et si ça ne me plaît pas ?", "Tu as 14 jours pour être remboursé. Tu peux aussi tester d'abord avec ta fiche offerte, sans rien payer."],
    ["Il faut savoir coder ?", "Non. Chaque fiche contient un plan de lancement et un prompt prêt à coller pour construire ta première version avec l'IA."],
    ["Les chiffres sont fiables ?", "Ce sont des projections, pas des promesses. Les hypothèses (prix, clients, coûts) sont affichées dans chaque fiche pour que tu puisses les vérifier."],
    ["Tout le monde va lancer la même idée ?", "Une idée ne vaut rien sans exécution. Ta cible, ton angle et ta vitesse font la différence. Et de nouvelles idées arrivent chaque semaine."],
  ];
  const slides: Slide[] = [
    { t: "cover", kicker: "TU HÉSITES ?", title: cover(c, ["5 questions avant|de t'inscrire sur IdeaForge", "Tu hésites encore ?|5 réponses honnêtes"]), sub: "Les questions qu'on nous pose le plus, sans langue de bois." },
    ...qa.map(([q, a], i): Slide => ({ t: "text", kicker: `Question ${i + 1}`, title: q, body: a, n: i + 2, total })),
    finalCta,
  ];
  return { kind: "bofu", ideas: [], slides, caption: "", theme: "objections" };
}

async function bofuBeforeAfter(c: Ctx): Promise<Draft> {
  const o = await offerTiles();
  const total = 5;
  const slides: Slide[] = [
    { t: "cover", kicker: "AVANT / APRÈS", title: cover(c, ["Chercher une idée seul|ou avec IdeaForge ?", "Des semaines de recherche|ou 10 minutes ?"]), sub: "Même objectif : trouver quoi lancer. Pas le même chemin." },
    { t: "list", kicker: "Seul", title: "Sans IdeaForge", items: ["Des semaines à chercher sur Google et YouTube", "Des chiffres au feeling", "Aucune idée de ce que font les concurrents", "Pas de plan pour démarrer"], n: 2, total },
    { t: "list", kicker: "Avec IdeaForge", title: "Avec IdeaForge", items: [`${c.ideas.length} idées déjà notées sur 100`, "Budget, revenus et délai chiffrés", "Les concurrents qui gagnent déjà de l'argent", "Un plan de lancement et un prompt prêt à coller"], n: 3, total },
    { t: "stats", kicker: "L'offre", title: o.title, n: 4, total, tiles: o.tiles },
    finalCta,
  ];
  return { kind: "bofu", ideas: [], slides, caption: "", theme: "avant-apres" };
}

async function bofuTools(c: Ctx): Promise<Draft> {
  const o = await offerTiles();
  const total = 5;
  const slides: Slide[] = [
    { t: "cover", kicker: "DANS L'ACCÈS", title: cover(c, ["Pas seulement des idées|les outils pour les lancer", "De l'idée au lancement|tout est au même endroit"]), sub: "Ce que tu débloques en t'inscrivant. Glisse." },
    { t: "list", kicker: "Pour choisir", title: "Trouver la bonne idée", items: [`${c.ideas.length} fiches notées sur 100, et des nouvelles chaque semaine`, "Le comparateur pour mettre deux idées face à face", "Le validateur pour tester ta propre idée"], n: 2, total },
    { t: "list", kicker: "Pour lancer", title: "Passer à l'action", items: ["Le calculateur de revenus sur 24 mois", "Un plan de lancement pour chaque idée", "Le pack de 50 prompts prêts à coller"], n: 3, total },
    { t: "stats", kicker: "L'offre", title: o.title, n: 4, total, tiles: o.tiles },
    finalCta,
  ];
  return { kind: "bofu", ideas: [], slides, caption: "", theme: "outils" };
}

// ───────── 1 idée chiffrée / Nouvelle idée IA ─────────
function single(c: Ctx, kind: "idea" | "new"): Draft | null {
  let it: Idea | undefined;
  if (kind === "new") it = c.fresh.filter((i) => i.is_ai).sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""))[0];
  if (!it) it = [...c.fresh].sort(c.byScore)[0];
  if (!it) return null;
  const kickers = kind === "new" ? ["NOUVELLE IDÉE REPÉRÉE PAR L'IA", "TOUT JUSTE AJOUTÉE AU CATALOGUE", "L'IA A TROUVÉ CETTE IDÉE"] : ["IDÉE DE BUSINESS CHIFFRÉE", "UNE IDÉE, TOUS LES CHIFFRES", "L'IDÉE DU JOUR"];
  return { kind, ideas: [it.id], slides: ideaSlides(it, kickers[c.mine.length % kickers.length]), caption: "", theme: "fiche" };
}

const FORMATS: Record<Kind, Fmt[]> = {
  tofu: [
    { slug: "etude-budget", build: (c) => tofuStudy(c, "budget") },
    { slug: "liste", build: (c) => listDraft(c, "tofu") },
    { slug: "erreurs", build: tofuErrors },
    { slug: "etude-ia", build: (c) => tofuStudy(c, "ia") },
    { slug: "valider", build: tofuValidate },
    { slug: "etude-vitesse", build: (c) => tofuStudy(c, "vitesse") },
  ],
  mofu: [
    { slug: "cas", build: mofuCase },
    { slug: "duel", build: mofuDuel },
    { slug: "calcul", build: mofuCalc },
    { slug: "methode", build: mofuMethod },
  ],
  bofu: [
    { slug: "offre", build: bofuOffer },
    { slug: "objections", build: bofuObjections },
    { slug: "avant-apres", build: bofuBeforeAfter },
    { slug: "outils", build: bofuTools },
  ],
  top5: [{ slug: "top5", build: (c) => listDraft(c, "top5") }],
  idea: [{ slug: "fiche", build: (c) => single(c, "idea") }],
  new: [{ slug: "fiche", build: (c) => single(c, "new") }],
};

/** Choisit le contenu. `used` = idées déjà montrées ; `hist` = carrousels déjà créés (du plus récent au plus ancien). */
export async function buildDraft(kind: Kind, used: Set<string>, hist: Hist[] = []): Promise<Draft> {
  const ideas = await allIdeas();
  const byScore = (a: Idea, b: Idea) => scoreIdea(b).score - scoreIdea(a).score;
  const ctx: Ctx = { ideas, fresh: ideas.filter((i) => !used.has(i.id)), used, hist, mine: hist.filter((h) => h.kind === kind), byScore };
  const last = ctx.mine[0] ? fmtOf(ctx.mine[0]) : "";
  const order = FORMATS[kind]
    .map((f, i) => ({ f, i, n: ctx.mine.filter((h) => fmtOf(h) === f.slug).length }))
    .sort((a, b) => Number(a.f.slug === last && FORMATS[kind].length > 1) - Number(b.f.slug === last && FORMATS[kind].length > 1) || a.n - b.n || a.i - b.i);
  let d: Draft | null = null;
  for (const { f } of order) { d = await f.build(ctx); if (d) break; }
  // Plus aucune idée jamais montrée : on retombe sur un format sans idée (jamais de doublon d'idée)
  if (!d) d = kind === "bofu" ? await bofuObjections(ctx) : kind === "mofu" ? tofuValidate(ctx) : tofuErrors(ctx);
  const about = { cover: (d.slides[0] as { title?: string }).title?.replace("|", " ") ?? "", titles: d.slides.slice(1).map((x) => ("title" in x ? x.title : "")).filter(Boolean) };
  const label = d.theme?.includes(":") ? COLLECTIONS.find((x) => x.slug === d!.theme!.split(":")[1])?.label : undefined;
  return { ...d, caption: await caption(d.kind, ideas.filter((i) => d!.ideas.includes(i.id)), label, about) };
}

/** Légende : écrite par l'IA si disponible, sinon un modèle propre. Toujours avec 5 hashtags de la niche. */
async function caption(kind: Kind, ideas: Idea[], theme?: string, about?: { cover: string; titles: string[] }): Promise<string> {
  const first = ideas[0];
  const topic = about ? `Sujet du carrousel : « ${about.cover} ». Titres des slides : ${about.titles.join(" ; ")}.` : "";
  if (!first) {
    const fbx = `${about?.cover ?? "Lancer son business"} 👇\n\n${(about?.titles ?? []).slice(0, 5).map((t) => `✅ ${t}`).join("\n")}\n\nEnregistre ce post pour plus tard et partage-le à quelqu'un qui veut se lancer.\n\n👉 Des idées de business déjà chiffrées : lien en bio. 1 fiche offerte à l'inscription.\n\n${HASHTAGS}`;
    if (!process.env.ANTHROPIC_API_KEY) return fbx;
    try {
      const out = await askClaude(`Écris la légende Instagram (en français, tutoiement, ton direct et simple, 500 à 800 caractères) d'un carrousel IdeaForge.\n${topic}\n${kind === "bofu" ? "Il doit donner envie de s'inscrire sur ideaforges.io (1 fiche offerte, garantie 14 jours), sans mentir ni exagérer." : "Il doit apporter de la valeur gratuite et pousser à enregistrer et partager."}\nStructure : 1 phrase d'accroche forte sur la 1re ligne, 2 à 4 lignes de valeur reprises du carrousel (rien d'inventé), une question pour faire commenter, puis « 👉 Des idées de business déjà chiffrées : lien en bio. 1 fiche offerte à l'inscription. ».\nTermine par exactement ces hashtags sur la dernière ligne : ${HASHTAGS}\nPas de tiret cadratin. Réponds uniquement avec la légende.`, 700);
      const txt = out.trim().replace(/—/g, ",");
      return txt.length > 80 && txt.length < 2100 ? (txt.includes("#ideedebusiness") ? txt : `${txt}\n\n${HASHTAGS}`) : fbx;
    } catch { return fbx; }
  }
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
    mofu: ideas.length < 2 ? `Étude de cas : ${shortName(first.title)} 🔍\n\n${clip(first.pitch || "", 160)}\n\n💶 Départ : ${first.budget || f.budget}\n📈 Potentiel : ${first.revenue || f.mrr12Txt}\n📊 Score IdeaForge : ${scoreIdea(first).score}/100 (demande, concurrence, marge, vitesse)\n\nTu la lancerais ? Dis-le en commentaire.\n\n👉 La fiche complète : lien en bio. 1 fiche offerte à l'inscription.\n\n${HASHTAGS}` : `${ideas.map((i) => shortName(i.title)).join(" ou ")} ? 🤔\n\nOn compare les chiffres : budget de départ, potentiel, délai et score IdeaForge.\n\nTu choisirais laquelle ? Dis-le en commentaire.\n\n👉 Les fiches complètes : lien en bio. 1 fiche offerte à l'inscription.\n\n${HASHTAGS}`,
    bofu: `On a fait le travail à ta place 🛠️\n\nDans chaque fiche IdeaForge : le budget de départ, la projection sur 12 mois, les concurrents qui gagnent déjà de l'argent, le plan de lancement et le prompt pour coder ton MVP avec l'IA.\n\nExemple : ${shortName(first.title)}.\n\n👉 Ta première fiche est offerte : lien en bio. Garantie 14 jours.\n\n${HASHTAGS}`,
  };
  if (fb2[kind] && !process.env.ANTHROPIC_API_KEY) return fb2[kind];
  if (!process.env.ANTHROPIC_API_KEY) return fallback;
  try {
    const facts = ideas.map((i) => `- ${i.title} | ${i.pitch || ""} | départ ${i.budget || ""} | potentiel ${i.revenue || ""}`).join("\n");
    const out = await askClaude(
      `Écris la légende Instagram (en français, tutoiement, ton direct et simple, 600 à 900 caractères) d'un carrousel IdeaForge${kind === "top5" ? ` « 5 idées de ${theme} »` : ""}.
Idée(s) :\n${facts}${stage[kind] ? `\n${stage[kind]}` : ""}${topic ? `\n${topic} L'accroche doit coller à ce sujet.` : ""}
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
