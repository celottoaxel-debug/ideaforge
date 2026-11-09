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
    extra = ((data as Idea[]) ?? []).filter((d) => !IDEAS.some((s) => s.id === d.id));
  } catch {}
  return [...extra, ...IDEAS];
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
