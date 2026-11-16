import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/admin";
import { igAccount } from "@/lib/instagram/publish";
import { GenerateCarousel, PublishButton, CopyCaption } from "@/components/AdminInstagram";

export const dynamic = "force-dynamic";
export const metadata = { title: "Instagram · Admin", robots: { index: false, follow: false } };

type Post = { id: number; kind: string; slot: string | null; slides: unknown[]; caption: string; status: string; permalink: string | null; error: string | null; created_at: string; published_at: string | null; theme: string | null };
const KIND: Record<string, string> = { idea: "💡 Idée chiffrée", top5: "🏆 Top 5", new: "✨ Nouvelle idée IA" };
const fmt = (d: string | null) => (d ? new Date(d).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" }) : "");

export default async function AdminInstagram() {
  const { data: { user } } = await createClient().auth.getUser();
  if (!user || !isAdminEmail(user.email)) return <main className="wrap" style={{ padding: 40 }}><p>Accès réservé. <a href="/admin">Panel admin</a></p></main>;

  let posts: Post[] = [], err = "";
  try {
    const { data, error } = await createAdminClient().from("ig_posts").select("*").order("created_at", { ascending: false }).limit(20);
    if (error) throw new Error(error.message);
    posts = (data ?? []) as Post[];
  } catch (e) { err = e instanceof Error ? e.message : "Erreur"; }
  const acc = await igAccount();

  return (
    <main className="wrap" style={{ paddingBlock: "34px 60px" }}>
      <a className="crumbs" href="/admin">← Panel admin</a>
      <h1 style={{ fontSize: 34, margin: "6px 0 18px" }}>📸 Instagram</h1>
      {err && <div className="admin-warn">Les carrousels ne sont pas encore activés dans la base de données ({err}).</div>}

      <div className="tiles" style={{ marginBottom: 22 }}>
        <div className={`tile ${acc.ok ? "hot" : ""}`}><div className="tile-k">Compte connecté</div><div className="tile-v" style={{ fontSize: 20 }}>{acc.ok ? `@${acc.username}` : "Non connecté"}</div><div className="tile-s">{acc.ok ? "Publication automatique active" : acc.error}</div></div>
        <div className="tile"><div className="tile-k">Calendrier</div><div className="tile-v" style={{ fontSize: 20 }}>Lun · Mer · Ven</div><div className="tile-s">vers 9 h, heure de Paris</div></div>
        <div className="tile"><div className="tile-k">Publiés</div><div className="tile-v">{posts.filter((p) => p.status === "published").length}</div><div className="tile-s">sur les 20 derniers</div></div>
        <div className="tile"><div className="tile-k">Brouillons</div><div className="tile-v">{posts.filter((p) => p.status !== "published").length}</div><div className="tile-s">prêts ou en erreur</div></div>
      </div>

      <h2 className="val-sec">Créer un carrousel maintenant</h2>
      <GenerateCarousel />

      <h2 className="val-sec" style={{ marginTop: 30 }}>Carrousels</h2>
      {posts.length === 0 && <p className="vis-empty">Aucun carrousel pour l&apos;instant. Le premier sera créé automatiquement lundi, mercredi ou vendredi, ou tout de suite avec un bouton ci-dessus.</p>}
      <div className="ig-list">
        {posts.map((p) => (
          <article key={p.id} className="ig-post">
            <div className="ig-head">
              <b>{KIND[p.kind] ?? p.kind}</b>
              <span className={`ref-pill ${p.status === "published" ? "paid" : "signed_up"}`}>{p.status === "published" ? "Publié" : p.status === "error" ? "Erreur" : "Brouillon"}</span>
              <span className="ref-date">{p.status === "published" ? `publié le ${fmt(p.published_at)}` : `créé le ${fmt(p.created_at)}`}</span>
            </div>
            <div className="ig-strip">
              {p.slides.map((_, i) => (
                <a key={i} href={`/api/ig/jpg/${p.id}/${i + 1}.jpg`} target="_blank" rel="noopener noreferrer"><img src={`/api/ig/jpg/${p.id}/${i + 1}.jpg`} alt={`Slide ${i + 1}`} loading="lazy" width={216} height={270} /></a>
              ))}
            </div>
            <details className="ig-cap"><summary>Légende</summary><pre>{p.caption}</pre></details>
            {p.error && <p className="msg err">{p.error}</p>}
            <div className="ig-actions">
              {p.status !== "published" && <PublishButton id={p.id} disabled={!acc.ok} />}
              {p.permalink && <a className="btn" href={p.permalink} target="_blank" rel="noopener noreferrer">Voir sur Instagram ↗</a>}
              <CopyCaption text={p.caption} />
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
