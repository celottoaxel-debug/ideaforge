// Moteur du « dossier » d'une idée : à partir de quelques hypothèses (prix, CAC, churn, marge…),
// calcule projections sur 24 mois (3 scénarios), unit economics, point mort, entonnoir, budget, sensibilité.
// Fichier pur (aucun import) : réutilisable côté serveur et pour les aperçus.

export type Tier = [name: string, price: number, content: string];
export type Competitor = [name: string, price: string, strength: string, weakness: string];
export type Channel = [name: string, share: number, how: string];

export type Dossier = {
  kind: "saas" | "local";
  unit?: string;                     // libellé de prix, ex. "/mois" (SaaS) ou "/prestation"
  tiers: Tier[];                     // 3 offres
  mix?: [number, number, number];    // répartition des clients par offre (%)
  freq?: number;                     // achats par client et par mois (activités locales)
  cac: number;                       // coût d'acquisition d'un client (€)
  churn: number;                     // % de clients perdus par mois
  margin: number;                    // marge brute (%)
  fixed: number;                     // coûts fixes mensuels (€)
  target: number;                    // clients actifs à 12 mois, scénario réaliste
  persona: string;                   // client idéal
  pain: string;                      // problème payé
  example: string;                   // exemple concret d'utilisation / de vente
  facts: [value: string, label: string][]; // chiffres clés du marché
  comps: Competitor[];
  channels: Channel[];
  risks?: [prob: number, impact: number][]; // niveau 1–3 pour chaque risque de la fiche
};

export type IdeaLike = {
  id: string; sector: string; title: string; budget?: string | null; budget_min: number | null; revenue: string | null;
  difficulty: number | null; steps?: string[]; risks?: string[];
};

export type Series = { name: string; color: string; values: number[] };

const MONTHS = 24;

export function arpu(d: Dossier) {
  const mix = d.mix ?? [60, 30, 10];
  const tot = mix.reduce((a, b) => a + b, 0) || 1;
  const perPurchase = d.tiers.reduce((s, t, i) => s + t[1] * (mix[i] ?? 0), 0) / tot;
  return perPurchase * (d.kind === "local" ? d.freq ?? 1 : 1);
}

// Clients actifs mois par mois. Acquisition en rampe (3 mois) puis +5 %/mois (bouche-à-oreille),
// calibrée pour atteindre `target12` clients actifs au mois 12.
function simulate(target12: number, churnPct: number) {
  const c = churnPct / 100;
  const run = (n: number) => {
    const active: number[] = [], news: number[] = [];
    let a = 0;
    for (let t = 1; t <= MONTHS; t++) {
      const nt = n * Math.min(1, t / 3) * Math.pow(1.05, t - 1);
      a = a * (1 - c) + nt;
      active.push(a); news.push(nt);
    }
    return { active, news };
  };
  const base = run(1);
  const k = target12 / base.active[11];
  return { active: base.active.map((x) => x * k), news: base.news.map((x) => x * k) };
}

// Budget de départ : milieu de la fourchette affichée (« 1–4 k€ » => 2 500 €), sinon le minimum.
export function budgetOf(it: IdeaLike) {
  const m = (it.budget || "").replace(/\s/g, "").match(/(\d+(?:,\d+)?)[–-](\d+(?:,\d+)?)k€/);
  if (m) return Math.round(((parseFloat(m[1].replace(",", ".")) + parseFloat(m[2].replace(",", "."))) / 2) * 1000);
  return Math.max(300, it.budget_min ?? 1000);
}

export type Scenario = { key: "prudent" | "realiste" | "ambitieux"; mult: number; active: number[]; news: number[]; mrr: number[]; cash: number[]; profit: number[] };

export function scenarios(d: Dossier, it: IdeaLike): Scenario[] {
  const a = arpu(d), m = d.margin / 100, budget = budgetOf(it);
  return ([["prudent", 0.5], ["realiste", 1], ["ambitieux", 2]] as const).map(([key, mult]) => {
    const { active, news } = simulate(d.target * mult, d.churn);
    const mrr = active.map((x) => x * a);
    const profit = mrr.map((r, i) => r * m - d.fixed - news[i] * d.cac);
    const cash: number[] = [];
    profit.reduce((acc, p) => { const v = acc + p; cash.push(v); return v; }, -budget);
    return { key, mult, active, news, mrr, cash, profit };
  });
}

export function unitEconomics(d: Dossier) {
  const a = arpu(d), m = d.margin / 100, c = d.churn / 100;
  const lifetime = c > 0 ? 1 / c : 60;
  const ltv = a * m * lifetime;
  return {
    arpu: a,
    lifetimeMonths: lifetime,
    ltv,
    ltvCac: d.cac > 0 ? ltv / d.cac : 0,
    payback: a * m > 0 ? d.cac / (a * m) : Infinity,
  };
}

export function firstMonth(values: number[], pred: (v: number) => boolean) {
  const i = values.findIndex(pred);
  return i < 0 ? null : i + 1;
}

// Combien de visiteurs / prospects pour atteindre un objectif de revenu mensuel.
export function funnel(d: Dossier, goal = 10_000) {
  const a = arpu(d);
  const customers = Math.ceil(goal / Math.max(1, a));
  const steps = d.kind === "saas"
    ? [["Visiteurs / mois", 0.04], ["Inscriptions (essai)", 0.12], ["Clients payants", 1]]
    : [["Personnes touchées / mois", 0.03], ["Demandes de devis / contacts", 0.25], ["Clients", 1]];
  // On remonte l'entonnoir depuis les clients nécessaires.
  const out: { label: string; value: number; rate?: number }[] = [];
  let v = customers;
  out.unshift({ label: steps[2][0] as string, value: v });
  v = v / (steps[1][1] as number); out.unshift({ label: steps[1][0] as string, value: Math.ceil(v), rate: steps[1][1] as number });
  v = v / (steps[0][1] as number); out.unshift({ label: steps[0][0] as string, value: Math.ceil(v), rate: steps[0][1] as number });
  return { goal, customers, steps: out };
}

// Répartition type du budget de lancement.
export function budgetSplit(d: Dossier, it: IdeaLike): [string, number][] {
  const b = budgetOf(it);
  const parts: [string, number][] = d.kind === "saas"
    ? [["Développement & IA", 0.42], ["Marketing de lancement", 0.25], ["Design & contenu", 0.12], ["Outils & hébergement (12 mois)", 0.11], ["Juridique, compta & admin", 0.10]]
    : [["Équipement & matériel", 0.45], ["Local & aménagement", 0.20], ["Stock / consommables de départ", 0.12], ["Marketing local & site", 0.13], ["Juridique, assurances & admin", 0.10]];
  return parts.map(([k, p]) => [k, Math.round((b * p) / 10) * 10]);
}

// MRR au mois 12 selon le prix et le churn (tableau de sensibilité).
export function sensitivity(d: Dossier) {
  const prices = [0.8, 1, 1.2];
  const churns = [0.5, 1, 1.5];
  const a = arpu(d);
  return {
    prices, churns,
    grid: prices.map((p) =>
      churns.map((cm) => {
        // Même acquisition que le scénario réaliste, churn modifié.
        const base = simulate(d.target, d.churn);
        const c = (d.churn * cm) / 100;
        let act = 0;
        for (let t = 0; t < 12; t++) act = act * (1 - c) + base.news[t];
        return act * a * p;
      })
    ),
  };
}

// Repli pour les idées sans dossier rédigé (ex. idées découvertes par l'IA) : hypothèses déduites de la fiche.
export function fallbackDossier(it: IdeaLike & { pitch?: string | null; market?: string | null; is_ai?: boolean | null }): Dossier {
  // Les idées découvertes par l'IA sont toutes des logiciels / outils en ligne, quel que soit leur secteur.
  const local = !it.is_ai && !/SaaS|IA|Tech/i.test(it.sector);
  const nums = (it.revenue || "").match(/\d+/g)?.map(Number) ?? [];
  const highK = nums.length >= 2 ? nums[1] : 15; // borne haute en k€/mois
  const price = local ? 45 : it.difficulty === 3 ? 49 : 19;
  const tiers: Tier[] = local
    ? [["Essentiel", price, "La prestation de base"], ["Confort", Math.round(price * 1.8), "Prestation + options"], ["Premium", Math.round(price * 3.2), "Formule complète, prioritaire"]]
    : [["Starter", price, "Les fonctions clés, 1 utilisateur"], ["Pro", price * 2 + 9, "Usage illimité, intégrations"], ["Business", price * 5 + 49, "Équipe, API, support prioritaire"]];
  const d: Dossier = {
    kind: local ? "local" : "saas",
    unit: local ? "/prestation" : "/mois",
    tiers, freq: local ? 1.5 : undefined,
    cac: local ? 35 : it.difficulty === 3 ? 180 : 70,
    churn: local ? 6 : 4.5, margin: local ? 55 : 82,
    fixed: local ? 1800 : it.difficulty === 3 ? 900 : 250,
    target: 0,
    persona: "", pain: "", example: "", facts: [], comps: [], channels: [
      ["Contenu & SEO", 35, "Articles et pages ciblées sur les recherches des clients"],
      ["Réseaux sociaux", 25, "Démonstrations courtes, avant / après"],
      ["Partenariats", 25, "Prescripteurs qui parlent déjà à la cible"],
      ["Publicité payante", 15, "Petits budgets testés, coupés si le CAC dérape"],
    ],
  };
  // Cible réaliste : ~1/3 de la borne haute de revenu au mois 12.
  d.target = Math.max(10, Math.round((highK * 1000 * 0.33) / arpu(d)));
  return d;
}

// ---------- formats ----------
export const eur = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(Math.round(n));
export const eurK = (n: number) => {
  const a = Math.abs(n);
  if (a >= 1_000_000) return `${(n / 1_000_000).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} M€`;
  if (a >= 10_000) return `${Math.round(n / 1000).toLocaleString("fr-FR")} k€`;
  if (a >= 1000) return `${(n / 1000).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} k€`;
  return `${Math.round(n)} €`;
};
export const int = (n: number) => Math.round(n).toLocaleString("fr-FR");
