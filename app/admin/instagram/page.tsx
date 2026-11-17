import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/admin";
import { igAccount, recentStories, getReel, recentUgc, ugcFaces, ugcEndings, recentUgcRequests, UGC_HOOKS, recentPolls } from "@/lib/instagram/publish";
import { allIdeas } from "@/lib/seo";
import { scoreIdea } from "@/lib/score";
import { GenerateCarousel, PublishButton, CopyCaption, StoryButtons, ReelButtons, UgcPublish, UgcStudio } from "@/components/AdminInstagram";

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
  let stories: Awaited<ReturnType<typeof recentStories>> = [];
  try { stories = await recentStories(7); } catch {}
  const reels = new Map<number, Awaited<ReturnType<typeof getReel>>>();
  await Promise.all(posts.map(async (p) => { try { reels.set(p.id, await getReel(p.id)); } catch {} }));
  let ugcs: Awaited<ReturnType<typeof recentUgc>> = [];
  try { ugcs = await recentUgc(8); } catch {}
  const [faces, endings, requests] = await Promise.all([ugcFaces().catch(() => []), ugcEndings().catch(() => []), recentUgcRequests(6).catch(() => [])]);
  let topIdeas: { path: string; title: string; score: number }[] = [];
  try { topIdeas = (await allIdeas()).map((i) => ({ path: `/idea/${i.id}`, title: i.title, score: scoreIdea(i).score })).sort((a, b) => b.score - a.score).slice(0, 40); } catch {}
  const polls = await recentPolls(6).catch(() => []);
  const queued = requests.filter((r) => r.row.status === "pending" || r.row.status === "working" || r.row.status === "error");
  const today = new Date().toISOString().slice(0, 10);
  const todayStory = stories.find((x) => x.date === today);

  return (
    <main className="wrap" style={{ paddingBlock: "34px 60px" }}>
      <a className="crumbs" href="/admin">← Panel admin</a>
      <h1 style={{ fontSize: 34, margin: "6px 0 18px" }}>📸 Instagram</h1>
      {err && <div className="admin-warn">Les carrousels ne sont pas encore activés dans la base de données ({err}).</div>}

      <div className="tiles" style={{ marginBottom: 22 }}>
        <div className={`tile ${acc.ok ? "hot" : ""}`}><div className="tile-k">Compte connecté</div><div className="tile-v" style={{ fontSize: 20 }}>{acc.ok ? `@${acc.username}` : "Non connecté"}</div><div className="tile-s">{acc.ok ? "Publication automatique active" : acc.error}</div></div>
        <div className="tile"><div className="tile-k">Calendrier</div><div className="tile-v" style={{ fontSize: 20 }}>Lun · Mer · Ven</div><div className="tile-s">carrousels 9 h · réels face caméra mar/sam · réel animé jeu · 1 story/jour</div></div>
        <div className="tile"><div className="tile-k">Publiés</div><div className="tile-v">{posts.filter((p) => p.status === "published").length}</div><div className="tile-s">sur les 20 derniers</div></div>
        <div className="tile"><div className="tile-k">Brouillons</div><div className="tile-v">{posts.filter((p) => p.status !== "published").length}</div><div className="tile-s">prêts ou en erreur</div></div>
      </div>

      <h2 className="val-sec">🎥 Réels face caméra (mardi, samedi)</h2>
      {ugcs.length === 0 && <p className="vis-empty">Le premier arrive mardi matin : il est monté dans la nuit avec tes vidéos face caméra et une idée du catalogue, puis publié vers 9 h.</p>}
      <div className="ig-list" style={{ marginBottom: 26 }}>
        {ugcs.map(({ date, row }) => (
          <article key={date} className="ig-post">
            <div className="ig-head">
              <b>{row.title ?? "Réel face caméra"}</b>
              <span className={`ref-pill ${row.status === "published" ? "paid" : "signed_up"}`}>{row.status === "published" ? "Publié" : row.status === "error" ? "Erreur" : "Prêt"}</span>
              <span className="ref-date">{date}</span>
            </div>
            <video src={row.url_music || row.url} controls playsInline preload="metadata" style={{ display: "block", width: 220, borderRadius: 10 }} />
            {row.error && <p className="msg err">{row.error}</p>}
            <details className="ig-cap"><summary>Légende</summary><pre>{row.caption}</pre></details>
            <div className="ig-actions">
              <a className="btn" href={`/api/ig/download?u=${encodeURIComponent(row.url)}&name=reel-${date}`} download>⬇️ Sans musique (TikTok, Shorts)</a>
              {row.url_music && <a className="btn" href={`/api/ig/download?u=${encodeURIComponent(row.url_music)}&name=reel-${date}-beat`} download>⬇️ Avec beat</a>}
              {row.status !== "published" && <UgcPublish date={date} disabled={!acc.ok} />}
              {row.permalink && <a className="btn" href={row.permalink} target="_blank" rel="noopener noreferrer">Voir sur Instagram ↗</a>}
              <CopyCaption text={row.caption} />
            </div>
          </article>
        ))}
      </div>

      <p className="ugc-note" style={{ marginTop: -14, marginBottom: 22 }}>Sur iPhone : appuie sur ⬇️, puis « Télécharger ». La vidéo va dans l&apos;app Fichiers (dossier Téléchargements) : ouvre-la, appuie sur Partager puis « Enregistrer la vidéo » pour l&apos;avoir dans tes Photos.</p>

      <h2 className="val-sec">🎬 Créer un réel face caméra</h2>
      {queued.length > 0 && (
        <div className="ig-list" style={{ marginBottom: 12 }}>
          {queued.map(({ key, row }) => (
            <div key={key} className="ig-post" style={{ padding: 12 }}>
              <div className="ig-head">
                <b>{row.status === "error" ? "⚠️ Échec du montage" : row.status === "working" ? "⏳ Montage en cours…" : "🕐 En file : prêt dans l'heure"}</b>
                <span className="ref-date">{new Date(row.at).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" })}</span>
              </div>
              {row.error && <p className="msg err">{row.error}</p>}
            </div>
          ))}
        </div>
      )}
      <div style={{ marginBottom: 26 }}>
        <UgcStudio faces={faces} endings={endings} ideas={topIdeas} hooks={UGC_HOOKS} />
      </div>

      <h2 className="val-sec">📊 Sondages en story (12 h et 19 h)</h2>
      <div className="ig-post" style={{ marginBottom: 26 }}>
        {polls.length === 0 && <p className="vis-empty">Le premier sondage part aujourd&apos;hui à 12 h ou 19 h. Les réponses arrivent dans tes messages Instagram (« A » ou « B »).</p>}
        <div className="ig-strip">
          {polls.map(({ key, row }) => (
            <a key={key} href={`/api/ig/poll/${key}.jpg`} target="_blank" rel="noopener noreferrer" title={`${row.question.replace("|", " ")} · ${row.status === "published" ? "publié" : row.status}`}>
              <img src={`/api/ig/poll/${key}.jpg`} alt={row.question.replace("|", " ")} loading="lazy" width={152} height={270} style={{ width: 152, height: 270 }} />
            </a>
          ))}
        </div>
        {polls.filter((p) => p.row.status === "error").slice(0, 1).map((p) => <p key={p.key} className="msg err">{p.row.error}</p>)}
      </div>

      <h2 className="val-sec">Stories (une par jour)</h2>
      <div className="ig-post" style={{ marginBottom: 26 }}>
        <div className="ig-head">
          <b>📲 Story du jour</b>
          {todayStory ? <span className={`ref-pill ${todayStory.row.status === "published" ? "paid" : "signed_up"}`}>{todayStory.row.status === "published" ? "Publiée" : todayStory.row.status === "error" ? "Erreur" : "Prête"}</span> : <span className="ref-date">pas encore préparée (elle part avec la tâche du matin)</span>}
        </div>
        <div className="ig-strip">
          {stories.map((x) => (
            <a key={x.date} href={`/api/ig/story/${x.date}.jpg`} target="_blank" rel="noopener noreferrer" title={x.date}>
              <img src={`/api/ig/story/${x.date}.jpg`} alt={`Story du ${x.date}`} loading="lazy" width={152} height={270} style={{ width: 152, height: 270 }} />
            </a>
          ))}
        </div>
        {todayStory?.row.error && <p className="msg err">{todayStory.row.error}</p>}
        <StoryButtons canPublish={acc.ok && !!todayStory} published={todayStory?.row.status === "published"} />
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
            {(() => { const r = reels.get(p.id); return r ? (
              <div className="ig-reel">
                <b>🎬 Réel</b> <span className={`ref-pill ${r.status === "published" ? "paid" : "signed_up"}`}>{r.status === "published" ? "Publié" : r.status === "error" ? "Erreur" : "Vidéo prête"}</span>
                {r.url && <video src={r.url} controls playsInline preload="metadata" style={{ display: "block", width: 220, borderRadius: 10, marginTop: 8 }} />}
                {r.error && <p className="msg err">{r.error}</p>}
                <div className="ig-actions" style={{ marginTop: 8 }}>
                  {r.url && <a className="btn" href={`/api/ig/download?u=${encodeURIComponent(r.url)}&name=reel-anime-${p.id}`} download>⬇️ Télécharger (TikTok, Shorts)</a>}
                  {r.permalink && <a className="btn" href={r.permalink} target="_blank" rel="noopener noreferrer">Voir le réel ↗</a>}
                </div>
              </div>) : null; })()}
            <div className="ig-actions">
              {p.status !== "published" && <PublishButton id={p.id} disabled={!acc.ok} />}
              {reels.get(p.id)?.status !== "published" && <ReelButtons id={p.id} canPublish={acc.ok} hasVideo={!!reels.get(p.id)?.url} />}
              {p.permalink && <a className="btn" href={p.permalink} target="_blank" rel="noopener noreferrer">Voir sur Instagram ↗</a>}
              <CopyCaption text={p.caption} />
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
