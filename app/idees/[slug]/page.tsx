import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { COLLECTIONS, findCollection } from "@/lib/collections";
import { allIdeas, SITE, ldJson, breadcrumbLd, faqLd, ideaFacts } from "@/lib/seo";
import IdeaRow from "@/components/IdeaRow";
import { LegalFooter } from "@/components/LegalPage";

export const revalidate = 3600;

export function generateStaticParams() {
  return COLLECTIONS.map((c) => ({ slug: c.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const c = findCollection(params.slug);
  if (!c) return {};
  return {
    title: c.title,
    description: c.description,
    alternates: { canonical: `/idees/${c.slug}` },
    openGraph: { title: c.title, description: c.description, url: `/idees/${c.slug}`, type: "website" },
  };
}

export default async function CollectionPage({ params }: { params: { slug: string } }) {
  const c = findCollection(params.slug);
  if (!c) notFound();
  const ideas = (await allIdeas())
    .filter((it) => { try { return c.filter(it); } catch { return false; } })
    .sort((a, b) => ideaFacts(b).mrr12 - ideaFacts(a).mrr12);
  const others = COLLECTIONS.filter((x) => x.slug !== c.slug);

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: c.h1,
    numberOfItems: ideas.length,
    itemListElement: ideas.slice(0, 50).map((it, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE}/idea/${it.id}`, name: it.title })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={ldJson(itemList)} />
      <script type="application/ld+json" dangerouslySetInnerHTML={ldJson(breadcrumbLd([
        { name: "Accueil", url: SITE }, { name: "Idées par thème", url: `${SITE}/idees` }, { name: c.h1, url: `${SITE}/idees/${c.slug}` },
      ]))} />
      {c.faq.length > 0 && <script type="application/ld+json" dangerouslySetInnerHTML={ldJson(faqLd(c.faq))} />}

      <header className="nav"><div className="wrap nav-in">
        <a className="brand" href="/"><span className="mk">IF</span> IdeaForge</a>
        <a className="btn" href="/idees">Idées par thème</a>
        <a className="btn dark" href="/#pricing">Tarifs</a>
      </div></header>

      <main className="wrap coll">
        <nav className="crumbs" aria-label="Fil d'Ariane"><a href="/">Accueil</a> › <a href="/idees">Idées par thème</a> › <span>{c.h1}</span></nav>
        <h1>{c.h1}</h1>
        <p className="coll-count">{ideas.length} fiches analysées et chiffrées</p>
        {c.intro.map((p, i) => <p key={i} className="coll-intro">{p}</p>)}

        <h2 className="coll-q">{c.question}</h2>
        <p className="coll-intro">Les {ideas.length} pistes ci-dessous sont classées du revenu projeté le plus élevé au plus faible. Ouvre une fiche pour voir le budget détaillé, les concurrents et le plan de lancement.</p>
        <div className="irows">{ideas.map((it) => <IdeaRow key={it.id} it={it} showSector={false} />)}</div>
        <p className="coll-note">* Revenu mensuel projeté à la fin de la première année, dans le scénario réaliste du dossier de chaque idée : une estimation, pas une promesse.</p>

        {c.faq.length > 0 && (
          <section className="coll-faq">
            <h2>Questions fréquentes : {c.label.toLowerCase()}</h2>
            {c.faq.map((f) => <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>)}
          </section>
        )}

        <section className="coll-more">
          <h2>Quels autres thèmes explorer ?</h2>
          <div className="coll-chips">{others.map((o) => <a key={o.slug} href={`/idees/${o.slug}`}>{o.label}</a>)}</div>
        </section>
      </main>
      <LegalFooter />
    </>
  );
}
