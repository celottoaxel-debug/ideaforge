import type { Metadata } from "next";
import { listPublished, fmtDate } from "@/lib/blog/posts";
import { readingTime } from "@/lib/blog/markdown";
import { SITE, ldJson, breadcrumbLd } from "@/lib/seo";
import { LegalFooter } from "@/components/LegalPage";

export const revalidate = 600;
export const metadata: Metadata = {
  title: "Blog : trouver, valider et lancer une idée de business",
  description: "Guides pratiques pour entrepreneurs : trouver une idée rentable, la valider, construire un MVP avec l'IA, fixer ses prix et trouver ses premiers clients.",
  alternates: { canonical: "/blog", types: { "application/rss+xml": "/blog/rss.xml" } },
};

export default async function BlogIndex() {
  const posts = await listPublished();
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={ldJson({
        "@context": "https://schema.org", "@type": "Blog", name: "Blog IdeaForge", url: `${SITE}/blog`, inLanguage: "fr",
        blogPost: posts.slice(0, 30).map((p) => ({ "@type": "BlogPosting", headline: p.title, url: `${SITE}/blog/${p.slug}`, datePublished: p.published_at })),
      })} />
      <script type="application/ld+json" dangerouslySetInnerHTML={ldJson(breadcrumbLd([{ name: "Accueil", url: SITE }, { name: "Blog", url: `${SITE}/blog` }]))} />
      <header className="nav"><div className="wrap nav-in">
        <a className="brand" href="/"><span className="mk">IF</span> IdeaForge</a>
        <a className="btn" href="/idees">Idées par thème</a>
        <a className="btn dark" href="/#pricing">Tarifs</a>
      </div></header>
      <main className="wrap coll">
        <nav className="crumbs" aria-label="Fil d'Ariane"><a href="/">Accueil</a> › <span>Blog</span></nav>
        <h1>Le blog IdeaForge</h1>
        <p className="coll-intro">Des guides concrets pour passer de l’idée au premier client : trouver une idée rentable, la valider, la construire avec l’IA et la vendre.</p>
        {posts.length === 0 ? (
          <p className="coll-intro">Les premiers articles arrivent très bientôt. En attendant, explore les <a href="/idees">idées par thème</a>.</p>
        ) : (
          <div className="post-list">
            {posts.map((p) => (
              <a key={p.id} href={`/blog/${p.slug}`} className="card post-card">
                <span className="post-meta">{fmtDate(p.published_at)} · {readingTime(p.content_md)} min de lecture</span>
                <h2>{p.title}</h2>
                {p.description && <p>{p.description}</p>}
              </a>
            ))}
          </div>
        )}
      </main>
      <LegalFooter />
    </>
  );
}
