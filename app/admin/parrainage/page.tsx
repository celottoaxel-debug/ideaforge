import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/admin";
import { TIERS } from "@/lib/referral";
import ReferralDeliver from "@/components/ReferralDeliver";

export const dynamic = "force-dynamic";
export const metadata = { title: "Parrainage · Admin", robots: { index: false, follow: false } };

type Ref = { id: number; referrer_id: string; referred_id: string; status: string; plan: string | null; amount_cents: number | null; created_at: string; paid_at: string | null };
type Reward = { id: number; user_id: string; tier: number; status: string; created_at: string; delivered_at: string | null };

const fmt = (d: string | null) => (d ? new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) : "·");
const eur = (c: number) => (c / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

export default async function AdminParrainage() {
  const { data: { user } } = await createClient().auth.getUser();
  if (!user || !isAdminEmail(user.email)) {
    return <main className="wrap" style={{ padding: 40 }}><p>Accès réservé. <a href="/admin">Panel admin</a></p></main>;
  }

  let refs: Ref[] = [], rewards: Reward[] = [], emails = new Map<string, string>(), codes = new Map<string, string>(), err = "";
  try {
    const admin = createAdminClient();
    const [{ data: r, error: e1 }, { data: w, error: e2 }] = await Promise.all([
      admin.from("referrals").select("*").order("created_at", { ascending: false }),
      admin.from("referral_rewards").select("*").order("created_at", { ascending: false }),
    ]);
    if (e1 || e2) throw new Error((e1 || e2)!.message);
    refs = (r ?? []) as Ref[];
    rewards = (w ?? []) as Reward[];
    const ids = [...new Set([...refs.flatMap((x) => [x.referrer_id, x.referred_id]), ...rewards.map((x) => x.user_id)])];
    if (ids.length) {
      const { data: p } = await admin.from("profiles").select("id, email, ref_code").in("id", ids);
      (p ?? []).forEach((x) => { emails.set(x.id as string, (x.email as string) || "(sans e-mail)"); if (x.ref_code) codes.set(x.id as string, x.ref_code as string); });
    }
  } catch (e) {
    err = e instanceof Error ? e.message : "Erreur";
  }
  const mail = (id: string) => emails.get(id) ?? id.slice(0, 8);

  // Regroupe par parrain, les plus performants en premier
  const byReferrer = new Map<string, Ref[]>();
  refs.forEach((r) => byReferrer.set(r.referrer_id, [...(byReferrer.get(r.referrer_id) ?? []), r]));
  const branches = [...byReferrer.entries()]
    .map(([id, kids]) => ({ id, kids, paid: kids.filter((k) => k.status === "paid").length, revenue: kids.reduce((a, k) => a + (k.status === "paid" ? k.amount_cents ?? 0 : 0), 0) }))
    .sort((a, b) => b.paid - a.paid || b.kids.length - a.kids.length);

  const paidRefs = refs.filter((r) => r.status === "paid");
  const revenue = paidRefs.reduce((a, r) => a + (r.amount_cents ?? 0), 0);
  const toDeliver = rewards.filter((r) => r.status === "pending");
  const conv = refs.length ? Math.round((paidRefs.length / refs.length) * 100) : 0;

  return (
    <main className="wrap" style={{ paddingBlock: "34px 60px" }}>
      <div className="blog-row">
        <div>
          <a className="crumbs" href="/admin">← Panel admin</a>
          <h1 style={{ fontSize: 34, marginTop: 6 }}>🤝 Parrainage</h1>
        </div>
        <a className="btn" href="/parrainage">Voir la page publique</a>
      </div>
      {err && <div className="admin-warn">Le parrainage n&apos;est pas encore activé dans la base de données ({err}).</div>}

      <div className="tiles" style={{ margin: "18px 0 26px" }}>
        <div className="tile"><div className="tile-k">Parrains actifs</div><div className="tile-v">{branches.length}</div><div className="tile-s">au moins 1 inscrit</div></div>
        <div className="tile"><div className="tile-k">Filleuls inscrits</div><div className="tile-v">{refs.length}</div><div className="tile-s">{conv} % ont payé</div></div>
        <div className="tile hot"><div className="tile-k">Filleuls payants</div><div className="tile-v">{paidRefs.length}</div><div className="tile-s">{eur(revenue)} encaissés</div></div>
        <div className={`tile ${toDeliver.length ? "hot" : ""}`}><div className="tile-k">Récompenses à livrer</div><div className="tile-v">{toDeliver.length}</div><div className="tile-s">palier 3 (SaaS -30 %)</div></div>
      </div>

      {toDeliver.length > 0 && (
        <>
          <h2 className="val-sec">À livrer par toi</h2>
          <div className="tablewrap" style={{ marginBottom: 26 }}>
            <table className="atable">
              <thead><tr><th>Parrain</th><th>Récompense</th><th>Débloquée le</th><th></th></tr></thead>
              <tbody>
                {toDeliver.map((w) => (
                  <tr key={w.id}><td>{mail(w.user_id)}</td><td>🚀 SaaS en priorité, -30 % sur le devis</td><td>{fmt(w.created_at)}</td><td><ReferralDeliver id={w.id} /></td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <h2 className="val-sec">Qui a parrainé qui</h2>
      {branches.length === 0 ? (
        <p className="vis-empty">Aucun parrainage pour l&apos;instant. Dès qu&apos;un inscrit arrive par un lien ?ref=, il apparaît ici.</p>
      ) : (
        <div className="rtree">
          {branches.map((b) => {
            const got = rewards.filter((w) => w.user_id === b.id);
            return (
              <div className="rbranch" key={b.id}>
                <div className="rparent">
                  <b>{mail(b.id)}</b>
                  <span className="mono">code {codes.get(b.id) ?? "·"}</span>
                  <span className="rscore">{b.paid} payant{b.paid > 1 ? "s" : ""} / {b.kids.length} inscrit{b.kids.length > 1 ? "s" : ""} · {eur(b.revenue)}</span>
                  <div className="rtiers">
                    {TIERS.map((t) => {
                      const g = got.find((w) => w.tier === t.tier);
                      return <span key={t.tier} className={g ? "on" : ""} title={t.name}>{t.emoji} {t.short}{g?.status === "included" ? " (inclus)" : g?.status === "pending" ? " (à livrer)" : g?.status === "delivered" ? " ✓" : ""}</span>;
                    })}
                  </div>
                </div>
                <div className="rkids">
                  {b.kids.map((k) => (
                    <div key={k.id} className={`rkid ${k.status}`}>
                      <span>{mail(k.referred_id)}</span>
                      <span className={`ref-pill ${k.status}`}>{k.status === "paid" ? (k.plan === "monthly" ? "Mensuel" : "À vie") : "Inscrit"}</span>
                      <span className="ref-date">{k.status === "paid" ? `payé le ${fmt(k.paid_at)}` : `inscrit le ${fmt(k.created_at)}`}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <h2 className="val-sec" style={{ marginTop: 34 }}>Tous les parrainages</h2>
      <div className="tablewrap">
        <table className="atable">
          <thead><tr><th>Parrain</th><th>Filleul</th><th>Inscrit le</th><th>Statut</th><th>Payé le</th><th>Offre</th><th>Montant</th></tr></thead>
          <tbody>
            {refs.length === 0 && <tr><td colSpan={7} className="empty-td">Aucun parrainage pour l&apos;instant.</td></tr>}
            {refs.map((r) => (
              <tr key={r.id}>
                <td>{mail(r.referrer_id)}</td>
                <td>{mail(r.referred_id)}</td>
                <td>{fmt(r.created_at)}</td>
                <td><span className={`ref-pill ${r.status}`}>{r.status === "paid" ? "A payé" : "Inscrit"}</span></td>
                <td>{r.status === "paid" ? fmt(r.paid_at) : "·"}</td>
                <td>{r.plan === "monthly" ? "Mensuel" : r.plan === "lifetime" ? "À vie" : "·"}</td>
                <td>{r.amount_cents != null ? eur(r.amount_cents) : "·"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="tile-s" style={{ marginTop: 18 }}>
        Paliers : {TIERS.map((t) => `${t.emoji} ${t.need} ami${t.need > 1 ? "s" : ""} payant${t.need > 1 ? "s" : ""} = ${t.name}`).join(" · ")}. Les paliers 1 et 2 sont donnés automatiquement ; le palier 3 apparaît dans « À livrer ». Les filleuls ont -20 % sur leur premier paiement.
      </p>
    </main>
  );
}
