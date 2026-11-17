import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/admin";
import { igAccount, recentStories, getReel, recentUgc, ugcFaces, ugcEndings, recentUgcRequests, UGC_HOOKS, recentPolls, igMedia } from "@/lib/instagram/publish";
import { allIdeas } from "@/lib/seo";
import { scoreIdea } from "@/lib/score";
import { GenerateCarousel, PublishButton, CopyCaption, StoryButtons, ReelButtons, UgcPublish, UgcStudio } from "@/components/AdminInstagram";

export const dynamic = "force-dynamic";
export const metadata = { title: "Instagram · Admin", robots: { index: false, follow: false } };

type Post = { id: number; kind: string; slot: string | null; slides: unknown[]; caption: string; status: string; permalink: string | null; error: string | null; created_at: string; published_at: string | null; theme: string | null };
const KIND: Record<string, string> = { idea: "💡 Idée chiffrée", top5: "🏆 Top 5", new: "✨ Nouvelle idée IA" };
const fmt = (d: string | null) => (d ? new Date(d).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" }) : "");

export default async function AdminInstagram({ searchParams }: { searchParams?: { tab?: string } }) {
  const tab = searchParams?.tab === "archives" ? "archives" : "dash";
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
      <h1 style={{ fontSize: 34, margin: "6px 0 14px" }}>📸 Instagram</h1>
      <nav className="ig-tabs">
        <a className={tab === "dash" ? "on" : ""} href="/admin/instagram">🛠️ À publier</a>
        <a className={tab === "archives" ? "on" : ""} href="/admin/instagram?tab=archives">🗂️ Archives</a>
      </nav>
      {tab === "archives" ? <Archives canPublish={acc.ok} /> : <>
      {err && <div className="admin-warn">Les carrousels ne sont pas encore activés dans la base de données ({err}).</div>}

      <div className="tiles" style={{ marginBottom: 22 }}>
        <div className={`tile ${acc.ok ? "hot" : ""}`}><div className="tile-k">Compte connecté</div><div className="tile-v" style={{ fontSize: 20 }}>{acc.ok ? `@${acc.username}` : "Non connecté"}</div><div className="tile-s">{acc.ok ? "Publication automatique active" : acc.error}</div></div>
        <div className="tile"><div className="tile-k">Calendrier</div><div className="tile-v" style={{ fontSize: 20 }}>Lun · Mer · Ven</div><div className="tile-s">carrousels 9 h · réels face caméra mar/sam · réel animé jeu · 1 story/jour</div></div>
        <div className="tile"><div className="tile-k">Publiés</div><div className="tile-v">{posts.filter((p) => p.status === "published").length}</div><div className="tile-s">sur les 20 derniers</div></div>
        <div className="tile"><div className="tile-k">Brouillons</div><div className="tile-v">{posts.filter((p) => p.status !== "published").length}</div><div className="tile-s">prêts ou en erreur</div></div>
      </div>

      <h2 className="val-sec">🎥 Réels face caméra (mardi, samedi)</h2>
      {ugcs.filter(({ row }) => row.status !== "published").length === 0 && ugcs.length > 0 && <p className="vis-empty">Tous tes réels face caméra sont publiés : retrouve-les dans 🗂️ Archives.</p>}
      {ugcs.length === 0 && <p className="vis-empty">Le premier arrive mardi matin : il est monté dans la nuit avec tes vidéos face caméra et une idée du catalogue, puis publié vers 9 h.</p>}
      <div className="ig-list" style={{ marginBottom: 26 }}>
        {ugcs.filter(({ row }) => row.status !== "published").map(({ date, row }) => (
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
          {polls.filter(({ row }) => row.status !== "published").map(({ key, row }) => (
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
          {stories.filter((x) => x.row.status !== "published").map((x) => (
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

      <h2 className="val-sec" style={{ marginTop: 30 }}>Carrousels à publier</h2>
      <p className="ugc-note" style={{ marginBottom: 10 }}>Dès qu&apos;un carrousel, un réel, une story ou un sondage est publié, il passe dans 🗂️ Archives.</p>
      {posts.length === 0 && <p className="vis-empty">Aucun carrousel pour l&apos;instant. Le premier sera créé automatiquement lundi, mercredi ou vendredi, ou tout de suite avec un bouton ci-dessus.</p>}
      <div className="ig-list">
        {posts.filter((p) => p.status !== "published").map((p) => (
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
      </>}
    </main>
  );
}

/** Onglet Archives : tout ce qui est en ligne sur Instagram, plus l'historique des stories et sondages. */
async function Archives({ canPublish }: { canPublish: boolean }) {
  const admin = createAdminClient();
  const [{ data: postRows }, ugcList] = await Promise.all([
    admin.from("ig_posts").select("*").eq("status", "published").order("published_at", { ascending: false }).limit(40),
    recentUgc(40).catch(() => [] as Awaited<ReturnType<typeof recentUgc>>),
  ]);
  const pubPosts = (postRows ?? []) as Post[];
  const pubUgc = ugcList.filter(({ row }) => row.status === "published");
  const reelMap = new Map<number, Awaited<ReturnType<typeof getReel>>>();
  await Promise.all(pubPosts.map(async (p) => { try { reelMap.set(p.id, await getReel(p.id)); } catch {} }));
  const dl = (u: string, name: string) => `/api/ig/download?u=${encodeURIComponent(u)}&name=${name}`;
  const [media, stories, polls] = await Promise.all([
    igMedia(90).catch(() => [] as Awaited<ReturnType<typeof igMedia>>),
    recentStories(30).catch(() => [] as Awaited<ReturnType<typeof recentStories>>),
    recentPolls(30).catch(() => [] as Awaited<ReturnType<typeof recentPolls>>),
  ]);
  const TYPE: Record<string, string> = { CAROUSEL_ALBUM: "Carrousel", VIDEO: "Réel", IMAGE: "Photo" };
  const byMonth = new Map<string, typeof media>();
  for (const m of media) {
    const k = new Date(m.timestamp).toLocaleDateString("fr-FR", { month: "long", year: "numeric", timeZone: "Europe/Paris" });
    byMonth.set(k, [...(byMonth.get(k) ?? []), m]);
  }
  const count = (t: string) => media.filter((m) => (m.media_product_type === "REELS" ? "VIDEO" : m.media_type) === t).length;
  const pubStories = stories.filter((x) => x.row.status === "published");
  const pubPolls = polls.filter((x) => x.row.status === "published");
  return (
    <>
      <div className="tiles" style={{ marginBottom: 22 }}>
        <div className="tile"><div className="tile-k">Publications</div><div className="tile-v">{media.length}</div><div className="tile-s">sur le compte</div></div>
        <div className="tile"><div className="tile-k">Carrousels</div><div className="tile-v">{count("CAROUSEL_ALBUM")}</div><div className="tile-s">en ligne</div></div>
        <div className="tile"><div className="tile-k">Réels</div><div className="tile-v">{count("VIDEO")}</div><div className="tile-s">en ligne</div></div>
        <div className="tile"><div className="tile-k">Stories et sondages</div><div className="tile-v">{pubStories.length + pubPolls.length}</div><div className="tile-s">publiés (30 derniers jours)</div></div>
      </div>
      <h2 className="val-sec">🎥 Réels face caméra publiés</h2>
      {pubUgc.length === 0 && <p className="vis-empty" style={{ marginBottom: 20 }}>Aucun pour l&apos;instant.</p>}
      <div className="ig-list" style={{ marginBottom: 26 }}>
        {pubUgc.map(({ date, row }) => (
          <article key={date} className="ig-post">
            <div className="ig-head"><b>{row.title ?? "Réel face caméra"}</b><span className="ref-pill paid">Publié</span><span className="ref-date">{fmt(row.at ?? null) || date}</span></div>
            <video src={row.url_music || row.url} controls playsInline preload="metadata" style={{ display: "block", width: 200, borderRadius: 10 }} />
            <details className="ig-cap"><summary>Légende</summary><pre>{row.caption}</pre></details>
            <div className="ig-actions">
              <a className="btn" href={dl(row.url, `reel-${date}`)} download>⬇️ Sans musique</a>
              {row.url_music && <a className="btn" href={dl(row.url_music, `reel-${date}-beat`)} download>⬇️ Avec beat</a>}
              {row.permalink && <a className="btn" href={row.permalink} target="_blank" rel="noopener noreferrer">Voir sur Instagram ↗</a>}
              <CopyCaption text={row.caption} />
            </div>
          </article>
        ))}
      </div>

      <h2 className="val-sec">🖼️ Carrousels publiés (et leurs réels animés)</h2>
      {pubPosts.length === 0 && <p className="vis-empty" style={{ marginBottom: 20 }}>Aucun pour l&apos;instant.</p>}
      <div className="ig-list" style={{ marginBottom: 26 }}>
        {pubPosts.map((p) => {
          const r = reelMap.get(p.id);
          return (
            <article key={p.id} className="ig-post">
              <div className="ig-head"><b>{KIND[p.kind] ?? p.kind}</b><span className="ref-pill paid">Publié</span><span className="ref-date">{fmt(p.published_at)}</span></div>
              <div className="ig-strip">
                {p.slides.map((_, i) => (
                  <a key={i} href={`/api/ig/jpg/${p.id}/${i + 1}.jpg`} target="_blank" rel="noopener noreferrer"><img src={`/api/ig/jpg/${p.id}/${i + 1}.jpg`} alt={`Slide ${i + 1}`} loading="lazy" width={216} height={270} /></a>
                ))}
              </div>
              {r?.url && (
                <div className="ig-reel">
                  <b>🎬 Réel animé</b> <span className={`ref-pill ${r.status === "published" ? "paid" : "signed_up"}`}>{r.status === "published" ? "Publié" : "Vidéo prête"}</span>
                  <video src={r.url} controls playsInline preload="metadata" style={{ display: "block", width: 200, borderRadius: 10, marginTop: 8 }} />
                </div>
              )}
              <details className="ig-cap"><summary>Légende</summary><pre>{p.caption}</pre></details>
              <div className="ig-actions">
                {r?.url && <a className="btn" href={dl(r.url, `reel-anime-${p.id}`)} download>⬇️ Réel animé</a>}
                {r?.status !== "published" && <ReelButtons id={p.id} canPublish={canPublish} hasVideo={!!r?.url} />}
                {p.permalink && <a className="btn" href={p.permalink} target="_blank" rel="noopener noreferrer">Voir le carrousel ↗</a>}
                {r?.permalink && <a className="btn" href={r.permalink} target="_blank" rel="noopener noreferrer">Voir le réel ↗</a>}
                <CopyCaption text={p.caption} />
              </div>
            </article>
          );
        })}
      </div>

      <h2 className="val-sec">📱 Tout ce qui est en ligne sur ton compte</h2>
      {media.length === 0 && <p className="vis-empty">Aucune publication trouvée (ou Instagram n&apos;est pas connecté).</p>}
      {[...byMonth.entries()].map(([month, list]) => (
        <section key={month} style={{ marginBottom: 26 }}>
          <h2 className="val-sec" style={{ textTransform: "capitalize" }}>{month}</h2>
          <div className="ig-arch">
            {list.map((m) => {
              const type = m.media_product_type === "REELS" ? "Réel" : TYPE[m.media_type] ?? m.media_type;
              const img = m.media_type === "VIDEO" ? m.thumbnail_url : m.media_url;
              return (
                <a key={m.id} className="ig-arch-item" href={m.permalink} target="_blank" rel="noopener noreferrer">
                  <div className="ig-arch-img">{img ? <img src={img} alt="" loading="lazy" /> : null}<span className="ig-arch-type">{type}</span></div>
                  <div className="ig-arch-meta">
                    <b>{new Date(m.timestamp).toLocaleDateString("fr-FR", { day: "numeric", month: "short", timeZone: "Europe/Paris" })}</b>
                    <span>{m.like_count != null ? `♥ ${m.like_count}` : ""}{m.comments_count != null ? ` · 💬 ${m.comments_count}` : ""}</span>
                  </div>
                  <p>{(m.caption ?? "").split("\n")[0].slice(0, 90)}</p>
                </a>
              );
            })}
          </div>
        </section>
      ))}
      <h2 className="val-sec">Stories et sondages publiés</h2>
      <p className="ugc-note" style={{ marginBottom: 10 }}>Les stories disparaissent d&apos;Instagram après 24 h : elles restent visibles ici.</p>
      <div className="ig-strip" style={{ marginBottom: 26 }}>
        {pubPolls.map(({ key, row }) => (
          <a key={`p${key}`} href={`/api/ig/poll/${key}.jpg`} target="_blank" rel="noopener noreferrer" title={`Sondage · ${row.question.replace("|", " ")}`}>
            <img src={`/api/ig/poll/${key}.jpg`} alt="" loading="lazy" width={128} height={228} style={{ width: 128, height: 228 }} />
          </a>
        ))}
        {pubStories.map(({ date }) => (
          <a key={`s${date}`} href={`/api/ig/story/${date}.jpg`} target="_blank" rel="noopener noreferrer" title={`Story du ${date}`}>
            <img src={`/api/ig/story/${date}.jpg`} alt="" loading="lazy" width={128} height={228} style={{ width: 128, height: 228 }} />
          </a>
        ))}
        {pubStories.length + pubPolls.length === 0 && <p className="vis-empty">Aucune story publiée pour l&apos;instant.</p>}
      </div>
    </>
  );
}
