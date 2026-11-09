import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";
import { listAll, fmtDate, type Post } from "@/lib/blog/posts";
import { readingTime } from "@/lib/blog/markdown";
import { TOPICS } from "@/lib/blog/autopilot";
import { PostActions, GenerateButton } from "@/components/AdminBlogActions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Blog — Admin", robots: { index: false, follow: false } };

export default async function AdminBlog() {
  const { data: { user } } = await createClient().auth.getUser();
  if (!user || !isAdminEmail(user.email)) {
    return <main className="wrap" style={{ padding: 40 }}><p>Accès réservé. <a href="/admin">Panel admin</a></p></main>;
  }
  let posts: Post[] = [], err = "";
  try { posts = await listAll(); } catch (e) { err = e instanceof Error ? e.message : "Erreur"; }
  const drafts = posts.filter((p) => p.status === "draft");
  const published = posts.filter((p) => p.status === "published");
  const used = new Set(posts.map((p) => (p.keyword || "").toLowerCase()));
  const remaining = TOPICS.filter((t) => !used.has(t.toLowerCase())).length;

  const Row = ({ p }: { p: Post }) => {
    const checks = (p.content_md.match(/\[à vérifier\]/gi) || []).length;
    return (
      <div className="card blog-row">
        <div>
          <b>{p.title}</b>
          <div className="post-meta">
            {p.status === "published" ? `Publié le ${fmtDate(p.published_at)}` : `Brouillon du ${fmtDate(p.created_at)}`} · {readingTime(p.content_md)} min · {p.source === "ia" ? "🤖 IA" : p.source === "api" ? "API" : "manuel"}
            {checks > 0 && <span className="to-check" style={{ marginLeft: 8 }}>{checks} à vérifier</span>}
          </div>
        </div>
        <PostActions id={p.id} status={p.status} slug={p.slug} checks={checks} />
      </div>
    );
  };

  return (
    <>
      <header className="nav"><div className="wrap nav-in">
        <a className="brand" href="/"><span className="mk">IF</span> IdeaForge</a>
        <a className="btn" href="/admin">← Panel</a>
        <a className="btn" href="/blog" target="_blank">Voir le blog</a>
      </div></header>
      <main className="wrap" style={{ paddingBlock: 30, maxWidth: 980 }}>
        <h1 style={{ fontSize: 28, marginBottom: 6 }}>Blog</h1>
        <p style={{ color: "var(--ink-2)", marginBottom: 16 }}>
          Le pilote automatique rédige un brouillon par jour (sujets restants dans le plan : {remaining}/{TOPICS.length}). Relis-le, corrige les passages « [à vérifier] », puis publie-le en un clic.
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
          <a className="btn primary" href="/admin/blog/edit">✍️ Nouvel article</a>
          <GenerateButton />
        </div>
        {err && <div className="admin-warn">⚠️ {err}</div>}

        <h2 style={{ fontSize: 19, margin: "10px 0" }}>À valider ({drafts.length})</h2>
        {drafts.length === 0 ? <p className="vis-empty">Aucun brouillon en attente.</p> : drafts.map((p) => <Row key={p.id} p={p} />)}

        <h2 style={{ fontSize: 19, margin: "24px 0 10px" }}>Publiés ({published.length})</h2>
        {published.length === 0 ? <p className="vis-empty">Aucun article publié pour l’instant.</p> : published.map((p) => <Row key={p.id} p={p} />)}

        <details className="card" style={{ marginTop: 24 }}>
          <summary><b>Publier depuis un autre outil (API)</b></summary>
          <p style={{ fontSize: 14, color: "var(--ink-2)" }}>Ajoute une variable <code>BLOG_API_KEY</code> dans Vercel, puis envoie une requête :</p>
          <pre className="prompt-pre" style={{ borderRadius: 12 }}>{`POST https://ideaforges.io/api/blog/publish
Authorization: Bearer <BLOG_API_KEY>
Content-Type: application/json

{ "title": "…", "description": "…", "tags": ["…"], "content": "## Markdown…", "status": "draft" }`}</pre>
        </details>
      </main>
    </>
  );
}
