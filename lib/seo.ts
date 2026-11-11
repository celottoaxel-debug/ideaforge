import type { Idea } from "@/lib/types";
import { IDEAS } from "@/lib/ideas";
import { getDossier } from "@/lib/dossier";
import { arpu, scenarios, unitEconomics, firstMonth, budgetOf, eurK, eur } from "@/lib/dossier/engine";
import { createAdminClient } from "@/lib/supabase/admin";

export const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://ideaforges.io").replace(/\/$/, "");
export const BRAND = "IdeaForge";

// Toutes les idées publiques : catalogue statique + idées découvertes par l'IA (Supabase).
export async function allIdeas(): Promise<Idea[]> {
  let extra: Idea[] = [];
  try {
    const { data } = await createAdminClient().from("ideas").select("*").eq("is_ai", true).order("created_at", { ascending: false }).limit(500);
    extra = dedupeIdeas(((data as Idea[]) ?? []).filter((d) => !IDEAS.some((s) => s.id === d.id)));
  } catch {}
  return [...extra, ...IDEAS];
}

/** Retire les idées générées en double (même titre) : on garde la plus ancienne, qui fait foi. */
export function dedupeIdeas<T extends { title: string; created_at?: string | null }>(list: T[]): T[] {
  const oldest = new Map<string, T>();
  for (const it of list) {
    const k = titleKey(it.title);
    const cur = oldest.get(k);
    if (!cur || (it.created_at ?? "") < (cur.created_at ?? "")) oldest.set(k, it);
  }
  const keep = new Set(oldest.values());
  return list.filter((it) => keep.has(it));
}

/** Si cette idée est un doublon d'une idée plus ancienne, renvoie l'identifiant de l'originale. */
export async function originalIdeaId(it: Idea): Promise<string | null> {
  if (!it.is_ai) return null;
  try {
    const { data } = await createAdminClient().from("ideas").select("id, title, created_at").eq("is_ai", true).eq("title", it.title).order("created_at", { ascending: true }).limit(1);
    const first = data?.[0];
    return first && first.id !== it.id ? (first.id as string) : null;
  } catch { return null; }
}

export async function findIdea(id: string): Promise<Idea | undefined> {
  const s = IDEAS.find((x) => x.id === id);
  if (s) return s;
  try {
    const { data } = await createAdminClient().from("ideas").select("*").eq("id", id).maybeSingle();
    return (data as Idea) ?? undefined;
  } catch {
    return undefined;
  }
}

// Chiffres clés d'une idée (scénario réaliste du dossier), pour les titres, descriptions et FAQ.
export function ideaFacts(it: Idea) {
  const { dossier: d } = getDossier(it);
  const sc = scenarios(d, it)[1];
  const ue = unitEconomics(d);
  return {
    budget: it.budget || eurK(budgetOf(it)),
    budgetNum: budgetOf(it),
    mrr12: sc.mrr[11],
    mrr12Txt: eurK(sc.mrr[11]),
    clients12: Math.round(sc.active[11]),
    breakEven: firstMonth(sc.profit, (v) => v >= 0),
    arpu: arpu(d),
    arpuTxt: eur(arpu(d)),
    ltvCac: ue.ltvCac,
    competitors: d.comps.map((c) => c[0]),
    persona: d.persona,
    channels: d.channels.map((c) => c[0]),
    kind: d.kind,
  };
}

export function ideaFaq(it: Idea): { q: string; a: string }[] {
  const f = ideaFacts(it);
  const t = it.title;
  const out: { q: string; a: string }[] = [
    { q: `Combien coûte le lancement de « ${t} » ?`, a: `Le budget de départ estimé est de ${f.budget}. Il couvre principalement ${f.kind === "saas" ? "le développement du produit, le design, les outils et le marketing de lancement" : "l'équipement, l'aménagement, le stock de départ et le marketing local"}.` },
    { q: `Combien peut rapporter « ${t} » ?`, a: `Fourchette de revenus observée pour ce type d'activité : ${it.revenue || "variable"}. Dans le scénario réaliste du dossier IdeaForge, l'activité atteint environ ${f.mrr12Txt} de revenu mensuel au bout de 12 mois, avec ${f.clients12} clients actifs et un revenu moyen de ${f.arpuTxt} par client et par mois. Ce sont des projections, pas des promesses.` },
  ];
  if (it.delai) out.push({ q: `En combien de temps peut-on lancer « ${t} » ?`, a: `Comptez ${it.delai} pour une première version commercialisable${f.breakEven ? `, puis environ ${f.breakEven} mois pour que l'activité devienne rentable chaque mois dans le scénario réaliste` : ""}.` });
  if (f.competitors.length) out.push({ q: `Qui sont les concurrents de « ${t} » ?`, a: `Les principaux acteurs à connaître sont ${f.competitors.join(", ")}. ${it.competition || ""}`.trim() });
  if (f.persona) out.push({ q: `À qui s'adresse « ${t} » ?`, a: f.persona });
  if (f.channels.length) out.push({ q: `Comment trouver les premiers clients ?`, a: `Les canaux d'acquisition recommandés sont : ${f.channels.slice(0, 3).join(", ")}.` });
  return out;
}

// Balise <script type="application/ld+json"> (échappe "<" pour éviter toute injection).
export function ldJson(data: unknown) {
  return { __html: JSON.stringify(data).replace(/</g, "\\u003c") };
}

export const organizationLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: BRAND,
  url: SITE,
  logo: `${SITE}/icon.svg`,
  email: "ideasforges.io@gmail.com",
  founder: { "@type": "Person", name: "Axel Celotto" },
  address: { "@type": "PostalAddress", streetAddress: "Place Pasteur", postalCode: "83120", addressLocality: "Sainte-Maxime", addressCountry: "FR" },
};

export function breadcrumbLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((x, i) => ({ "@type": "ListItem", position: i + 1, name: x.name, item: x.url })),
  };
}

export function faqLd(faq: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
}

// ---------- Longueurs recommandées (audit SEO) ----------
export const TITLE_MAX = 60;
export const DESC_MAX = 155;
const SUFFIX = ` · ${BRAND}`;

/** Coupe un texte à `max` caractères sur un mot entier, sans laisser de ponctuation pendante. */
export function clip(text: string, max = DESC_MAX): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  const at = cut.lastIndexOf(" ");
  return (at > max * 0.6 ? cut.slice(0, at) : cut).replace(/[\s,;:·–-]+$/, "") + "…";
}

/** Nom court d'une idée : la partie avant « – » ou « : » (ex. « ReponsESG »). */
export function shortName(title: string): string {
  const m = title.split(/\s[–—-]\s|\s?:\s/)[0].trim();
  return m.length >= 3 ? m : title;
}

/**
 * Titre complet (déjà suffixé « · IdeaForge ») qui tient en 60 caractères :
 * essaie chaque variante dans l'ordre, puis coupe proprement la dernière.
 */
export function fitTitle(...variants: string[]): string {
  for (const v of variants) if ((v + SUFFIX).length <= TITLE_MAX) return v + SUFFIX;
  const last = variants[variants.length - 1];
  return clip(last, TITLE_MAX - SUFFIX.length) + SUFFIX;
}

/** Page web simple pour les pages sans autre donnée structurée. */
export function webPageLd(o: { name: string; description: string; path: string; type?: string; extra?: Record<string, unknown> }) {
  return {
    "@context": "https://schema.org",
    "@type": o.type ?? "WebPage",
    name: o.name,
    description: o.description,
    url: `${SITE}${o.path}`,
    inLanguage: "fr-FR",
    isPartOf: { "@type": "WebSite", name: BRAND, url: SITE },
    publisher: { "@type": "Organization", name: BRAND, url: SITE },
    ...(o.extra ?? {}),
  };
}

/** Normalise un titre pour repérer les doublons (minuscules, sans accents ni ponctuation). */
export function titleKey(title: string): string {
  return title.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
}
