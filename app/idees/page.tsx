import type { Metadata } from "next";
import { COLLECTIONS } from "@/lib/collections";
import { allIdeas, SITE, ldJson, breadcrumbLd } from "@/lib/seo";
import { LegalFooter } from "@/components/LegalPage";

export const revalidate = 3600;
export const metadata: Metadata = {
  title: "Idées de business par thème : IA, micro-SaaS, petit budget, local",
  description: "Toutes les idées de business IdeaForge classées par thème : intelligence artificielle, micro-SaaS, SaaS B2B, petit budget, lancement rapide, business local, Espagne, États-Unis.",
  alternates: { canonical: "/idees" },
};

export default async function IdeesIndex() {
  const ideas = await allIdeas();
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={ldJson(breadcrumbLd([{ name: "Accueil", url: SITE }, { name: "Idées par thème", url: `${SITE}/idees` }]))} />
      <header className="nav"><div className="wrap nav-in">
        <a className="brand" href="/"><span className="mk">IF</span> IdeaForge</a>
        <a className="btn" href="/#catalogue">Catalogue</a>
        <a className="btn dark" href="/#pricing">Tarifs</a>
      </div></header>
      <main className="wrap coll">
        <nav className="crumbs" aria-label="Fil d'Ariane"><a href="/">Accueil</a> › <span>Idées par thème</span></nav>
        <h1>Idées de business par thème</h1>
        <p className="coll-intro">{ideas.length} idées de business analysées et chiffrées : budget de départ, revenus projetés sur 24 mois, concurrents, risques et plan de lancement. Choisis un thème pour comparer les idées qui te correspondent.</p>
        <div className="coll-grid">
          {COLLECTIONS.map((c) => {
            const n = ideas.filter((it) => { try { return c.filter(it); } catch { return false; } }).length;
            return (
              <a key={c.slug} href={`/idees/${c.slug}`} className="card coll-card">
                <h2>{c.h1}</h2>
                <p>{c.description}</p>
                <span className="mono">{n} idées →</span>
              </a>
            );
          })}
        </div>
      </main>
      <LegalFooter />
    </>
  );
}
