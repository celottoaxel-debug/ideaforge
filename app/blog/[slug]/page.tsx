import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";
import { getPostBySlug, listPublished, fmtDate } from "@/lib/blog/posts";
import { renderMarkdown, readingTime } from "@/lib/blog/markdown";
import { SITE, ldJson, breadcrumbLd , fitTitle, clip } from "@/lib/seo";
import { LegalFooter } from "@/components/LegalPage";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const p = await getPostBySlug(params.slug);
  if (!p) return { title: "Article", robots: { index: false } };
  const title = fitTitle(p.title);
  const description = p.description ? clip(p.description) : undefined;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `/blog/${p.slug}` },
    openGraph: { type: "article", title, description, url: `/blog/${p.slug}`, publishedTime: p.published_at ?? undefined, modifiedTime: p.updated_at },
  };
}

export default async function PostPage({ params }: { params: { slug: string } }) {
  // Les brouillons ne sont visibles que par l'admin (aperçu avant validation).
  let admin = false;
  try {
    const { data: { user } } = await createClient().auth.getUser();
    admin = isAdminEmail(user?.email);
  } catch {}
  const p = await getPostBySlug(params.slug, admin);
  if (!p) notFound();

  const { html, headings } = renderMarkdown(p.content_md);
  const related = (await listPublished(20)).filter((x) => x.id !== p.id).slice(0, 3);
  const url = `${SITE}/blog/${p.slug}`;

  return (
    <>
      {p.status === "published" && (
        <>
          <script type="application/ld+json" dangerouslySetInnerHTML={ldJson({
            "@context": "https://schema.org", "@type": "BlogPosting", headline: p.title, description: p.description ?? undefined,
            url, mainEntityOfPage: url, inLanguage: "fr", datePublished: p.published_at, dateModified: p.updated_at,
            keywords: p.tags.join(", ") || undefined, wordCount: p.content_md.split(/\s+/).length,
            author: { "@type": "Organization", name: "IdeaForge", url: SITE },
            publisher: { "@type": "Organization", name: "IdeaForge", url: SITE, logo: { "@type": "ImageObject", url: `${SITE}/icon.svg` } },
          })} />
          <script type="application/ld+json" dangerouslySetInnerHTML={ldJson(breadcrumbLd([{ name: "Accueil", url: SITE }, { name: "Blog", url: `${SITE}/blog` }, { name: p.title, url }]))} />
        </>
      )}
      <header className="nav"><div className="wrap nav-in">
        <a className="brand" href="/"><span className="mk">IF</span> IdeaForge</a>
        <a className="btn" href="/blog">Blog</a>
        <a className="btn dark" href="/#catalogue">Voir les idées</a>
      </div></header>
      <main className="wrap post">
        {p.status === "draft" && <div className="admin-warn">Brouillon : visible uniquement par toi. Valide-le depuis le panel admin pour le publier.</div>}
        <nav className="crumbs" aria-label="Fil d'Ariane"><a href="/">Accueil</a> › <a href="/blog">Blog</a> › <span>{p.title}</span></nav>
        <h1>{p.title}</h1>
        <p className="post-meta">{p.published_at ? fmtDate(p.published_at) : "Non publié"} · {readingTime(p.content_md)} min de lecture</p>
        {p.description && <p className="post-lede">{p.description}</p>}
        {headings.length > 3 && (
          <nav className="post-toc" aria-label="Sommaire">
            <b>Sommaire</b>
            <ol>{headings.filter((h) => h.level === 2).map((h) => <li key={h.id}><a href={`#${h.id}`}>{h.text}</a></li>)}</ol>
          </nav>
        )}
        <article className="post-body" dangerouslySetInnerHTML={{ __html: html }} />

        <aside className="post-cta">
          <b>Trouve ton idée, chiffrée de A à Z</b>
          <p>Plus de 90 idées de business avec budget, revenus projetés sur 24 mois, concurrents et plan de lancement.</p>
          <a className="btn primary" href="/idees">Explorer les idées par thème</a>
        </aside>

        {related.length > 0 && (
          <section className="coll-more">
            <h2>À lire aussi</h2>
            <div className="post-list">{related.map((r) => <a key={r.id} href={`/blog/${r.slug}`} className="card post-card"><h2 style={{ fontSize: 17 }}>{r.title}</h2></a>)}</div>
          </section>
        )}
      </main>
      <LegalFooter />
    </>
  );
}
