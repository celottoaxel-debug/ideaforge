import type { Metadata } from "next";
import { COLLECTIONS } from "@/lib/collections";
import { allIdeas, SITE, ldJson, breadcrumbLd } from "@/lib/seo";
import { LegalFooter } from "@/components/LegalPage";

export const revalidate = 3600;
export const metadata: Metadata = {
  title: "Idées de business par thème : IA, SaaS, local",
  description: "Les fiches IdeaForge classées par thème : intelligence artificielle, micro-SaaS, SaaS B2B, petit budget, lancement rapide, local, Espagne, États-Unis.",
  alternates: { canonical: "/idees" },
};

export default async function IdeesIndex() {
  const ideas = await allIdeas();
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={ldJson(breadcrumbLd([{ name: "Accueil", url: SITE }, { name: "Idées par thème", url: `${SITE}/idees` }]))} />
      <script type="application/ld+json" dangerouslySetInnerHTML={ldJson({ "@context": "https://schema.org", "@type": "CollectionPage", name: "Idées de business par thème", url: `${SITE}/idees`, inLanguage: "fr-FR", hasPart: COLLECTIONS.map((c) => ({ "@type": "CollectionPage", name: c.h1, url: `${SITE}/idees/${c.slug}` })) })} />
      <header className="nav"><div className="wrap nav-in">
        <a className="brand" href="/"><span className="mk">IF</span> IdeaForge</a>
        <a className="btn" href="/#catalogue">Catalogue</a>
        <a className="btn dark" href="/#pricing">Tarifs</a>
      </div></header>
      <main className="wrap coll">
        <nav className="crumbs" aria-label="Fil d'Ariane"><a href="/">Accueil</a> › <span>Idées par thème</span></nav>
        <h1>Idées de business par thème</h1>
        <p className="coll-intro">{ideas.length} fiches analysées et chiffrées : budget de départ, revenus projetés sur deux ans, concurrents, risques et plan de lancement. Choisis un thème pour comparer les pistes qui te correspondent.</p>
        <h2 className="coll-q">Par quel thème commencer ?</h2>
        <p className="coll-intro">Petit budget ou peu de temps : commence par les thèmes « Petit budget » et « Lancement rapide ». Profil technique ou envie de revenus récurrents : regarde « Micro-SaaS », « SaaS B2B » et « Business avec l&apos;IA ». Envie d&apos;une activité de terrain : « Business local ».</p>
        <div className="coll-grid">
          {COLLECTIONS.map((c) => {
            const n = ideas.filter((it) => { try { return c.filter(it); } catch { return false; } }).length;
            return (
              <a key={c.slug} href={`/idees/${c.slug}`} className="card coll-card">
                <h3>{c.label}</h3>
                <p>{c.description}</p>
                <span className="mono" aria-label={`${n} pistes`}>{n} →</span>
              </a>
            );
          })}
        </div>
      </main>
      <LegalFooter />
    </>
  );
}
