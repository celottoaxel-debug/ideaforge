import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail, PRICE_MONTHLY, PRICE_LIFETIME, euro } from "@/lib/admin";
import AdminEmailTest from "@/components/AdminEmailTest";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin", robots: { index: false } };

type Profile = { id: string; email: string | null; full_name: string | null; plan: string | null; created_at: string };
type Quote = { id: string; email: string | null; description: string; sector: string | null; budget: string | null; created_at: string };

function fmtDate(s: string) {
  try { return new Date(s).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }); } catch { return s; }
}

export default async function AdminPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 1) Non connecté
  if (!user) {
    return (
      <main className="auth-wrap"><div className="auth-card">
        <div className="brand"><span className="mk">IF</span> IdeaForge</div>
        <h1>Panel admin</h1>
        <p className="sub">Connecte-toi avec ton compte administrateur pour accéder au tableau de bord.</p>
        <a className="prov primary" href="/login">Se connecter</a>
        <a className="back" href="/">← Retour au site</a>
      </div></main>
    );
  }

  // 2) Connecté mais pas admin
  if (!isAdminEmail(user.email)) {
    return (
      <main className="auth-wrap"><div className="auth-card">
        <div className="brand"><span className="mk">IF</span> IdeaForge</div>
        <h1>Accès refusé</h1>
        <p className="sub">Ce compte ({user.email}) n&apos;est pas administrateur.</p>
        <a className="prov" href="/auth/signout">Changer de compte</a>
        <a className="back" href="/">← Retour au site</a>
      </div></main>
    );
  }

  // 3) Admin : lecture de toutes les données via le client service-role
  let profiles: Profile[] = [], quotes: Quote[] = [], newsletter = 0, favorites = 0, dataError = "";
  try {
    const admin = createAdminClient();
    const [p, q, n, f] = await Promise.all([
      admin.from("profiles").select("id,email,full_name,plan,created_at").order("created_at", { ascending: false }),
      admin.from("quote_requests").select("id,email,description,sector,budget,created_at").order("created_at", { ascending: false }).limit(50),
      admin.from("newsletter_subscribers").select("id", { count: "exact", head: true }),
      admin.from("favorites").select("user_id", { count: "exact", head: true }),
    ]);
    if (p.error) throw p.error;
    profiles = (p.data as Profile[]) ?? [];
    quotes = (q.data as Quote[]) ?? [];
    newsletter = n.count ?? 0;
    favorites = f.count ?? 0;
  } catch (e) {
    dataError = e instanceof Error ? e.message : "Erreur de lecture des données.";
  }

  const total = profiles.length;
  const lifetime = profiles.filter((p) => p.plan === "lifetime").length;
  const monthly = profiles.filter((p) => p.plan === "monthly").length;
  const members = lifetime + monthly;
  const free = total - members;
  const mrr = monthly * PRICE_MONTHLY;
  const lifetimeRevenue = lifetime * PRICE_LIFETIME;
  const totalCollected = lifetimeRevenue + mrr; // encaissé ce mois (approx.)
  const convRate = total ? Math.round((members / total) * 100) : 0;

  const tiles = [
    { k: "MRR (abonnements)", v: euro(mrr), s: `${monthly} × ${PRICE_MONTHLY} €/mois`, hot: true },
    { k: "Revenus à vie encaissés", v: euro(lifetimeRevenue), s: `${lifetime} × ${PRICE_LIFETIME} €` },
    { k: "Encaissé ce mois (est.)", v: euro(totalCollected), s: "à vie + abonnements" },
    { k: "ARR estimé", v: euro(mrr * 12), s: "MRR × 12" },
    { k: "Membres payants", v: String(members), s: `${lifetime} à vie · ${monthly} mensuels` },
    { k: "Comptes gratuits", v: String(free), s: "non abonnés" },
    { k: "Taux de conversion", v: `${convRate}%`, s: `${members}/${total} comptes` },
    { k: "Inscrits newsletter", v: String(newsletter), s: "drop hebdo" },
  ];

  return (
    <>
      <header className="nav"><div className="wrap nav-in">
        <a className="brand" href="/"><span className="mk">IF</span> IdeaForge</a>
        <span className="pill" style={{ background: "var(--green-wash)", color: "var(--green-ink)", fontWeight: 600 }}>Admin</span>
        <a className="btn" href="/">← Site</a>
        <a className="btn dark" href="/auth/signout">Déconnexion</a>
      </div></header>

      <main className="wrap" style={{ paddingBlock: 36 }}>
        <h1 style={{ fontSize: 30, marginBottom: 6 }}>Tableau de bord</h1>
        <p style={{ color: "var(--ink-2)", marginBottom: 22 }}>Vue d&apos;ensemble des revenus, des membres et de l&apos;activité.</p>

        {dataError && (
          <div className="admin-warn">
            ⚠️ Données indisponibles pour le moment : {dataError}.<br />
            (Souvent lié au quota Supabase restreint, ou à la variable <code>SUPABASE_SERVICE_ROLE_KEY</code> manquante dans Vercel.)
          </div>
        )}

        <div className="tiles">
          {tiles.map((t) => (
            <div className={"tile" + (t.hot ? " hot" : "")} key={t.k}>
              <div className="tile-k">{t.k}</div>
              <div className="tile-v mono">{t.v}</div>
              <div className="tile-s">{t.s}</div>
            </div>
          ))}
        </div>

        <AdminEmailTest />

        <h2 style={{ fontSize: 20, margin: "34px 0 12px" }}>Membres ({total})</h2>
        <div className="tablewrap">
          <table className="atable">
            <thead><tr><th>E-mail</th><th>Nom</th><th>Plan</th><th>Inscrit le</th></tr></thead>
            <tbody>
              {profiles.length === 0 && <tr><td colSpan={4} className="empty-td">Aucun compte pour l&apos;instant.</td></tr>}
              {profiles.slice(0, 100).map((p) => (
                <tr key={p.id}>
                  <td>{p.email ?? "—"}</td>
                  <td>{p.full_name ?? "—"}</td>
                  <td><span className={"tag-plan " + (p.plan || "free")}>{p.plan === "lifetime" ? "À vie" : p.plan === "monthly" ? "Mensuel" : "Gratuit"}</span></td>
                  <td className="mono">{fmtDate(p.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 style={{ fontSize: 20, margin: "34px 0 12px" }}>Demandes de devis ({quotes.length})</h2>
        <div className="tablewrap">
          <table className="atable">
            <thead><tr><th>Date</th><th>E-mail</th><th>Secteur</th><th>Budget</th><th>Projet</th></tr></thead>
            <tbody>
              {quotes.length === 0 && <tr><td colSpan={5} className="empty-td">Aucune demande pour l&apos;instant.</td></tr>}
              {quotes.map((q) => (
                <tr key={q.id}>
                  <td className="mono">{fmtDate(q.created_at)}</td>
                  <td>{q.email ?? "—"}</td>
                  <td>{q.sector ?? "—"}</td>
                  <td>{q.budget ?? "—"}</td>
                  <td style={{ maxWidth: 360 }}>{q.description.slice(0, 160)}{q.description.length > 160 ? "…" : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p style={{ color: "var(--ink-3)", fontSize: 13, marginTop: 28 }}>
          📈 Trafic & parcours des visiteurs (pages vues, provenance) : voir <b>Vercel → ton projet → Analytics</b>.
          Les chiffres ci-dessus sont tes données métier en temps réel (Supabase).
        </p>
      </main>
    </>
  );
}
