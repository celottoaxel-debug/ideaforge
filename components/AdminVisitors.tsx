import { getVisitorStats, type Top } from "@/lib/analytics";
import { lineChart } from "@/lib/dossier/svg";

const nf = (n: number) => n.toLocaleString("fr-FR");

function TopTable({ title, rows, total }: { title: string; rows: Top; total: number }) {
  return (
    <div className="card vis-top">
      <b>{title}</b>
      {rows.length === 0 ? <p className="vis-empty">Pas encore de données.</p> : (
        <div className="vis-rows">
          {rows.map((r) => (
            <div key={r.label} className="vis-row">
              <i style={{ width: `${total ? Math.max(3, (r.visitors / total) * 100) : 0}%` }} />
              <span className="vis-label">{r.label}</span>
              <span className="mono vis-num">{nf(r.visitors)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Section « Visiteurs » du panel admin. Période : 1, 7, 30 ou 90 jours.
export default async function AdminVisitors({ period }: { period: number }) {
  let s: Awaited<ReturnType<typeof getVisitorStats>> | null = null, err = "";
  try { s = await getVisitorStats(period); } catch (e) { err = e instanceof Error ? e.message : "Erreur"; }

  return (
    <section style={{ marginTop: 34 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
        <h2 style={{ fontSize: 20, margin: 0 }}>Visiteurs</h2>
        <div className="vis-periods">
          {[1, 7, 30, 90].map((d) => <a key={d} href={`/admin?p=${d}`} className={d === period ? "on" : ""}>{d === 1 ? "Aujourd’hui" : `${d} jours`}</a>)}
        </div>
      </div>

      {err && <div className="admin-warn">⚠️ Statistiques indisponibles : {err}</div>}
      {s && (
        <>
          <div className="tiles">
            <div className="tile hot"><div className="tile-k">En ce moment</div><div className="tile-v mono">{nf(s.now)}</div><div className="tile-s">visiteurs ces 30 dernières minutes</div></div>
            <div className="tile"><div className="tile-k">Visiteurs</div><div className="tile-v mono">{nf(s.visitors)}</div><div className="tile-s">{nf(s.today)} aujourd’hui</div></div>
            <div className="tile"><div className="tile-k">Pages vues</div><div className="tile-v mono">{nf(s.views)}</div><div className="tile-s">{s.pagesPerVisit.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} pages par visite</div></div>
            <div className="tile"><div className="tile-k">Inscriptions</div><div className="tile-v mono">{nf(s.signups)}</div><div className="tile-s">{s.visitors ? `${((s.signups / s.visitors) * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} % des visiteurs` : "—"}</div></div>
            <div className="tile"><div className="tile-k">Nouveaux payants</div><div className="tile-v mono">{nf(s.buyers)}</div><div className="tile-s">{s.visitors ? `${((s.buyers / s.visitors) * 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} % des visiteurs` : "—"}</div></div>
          </div>

          {s.series.labels.length > 1 && (
            <div className="card" style={{ margin: "14px 0" }}>
              <b>Visiteurs et pages vues par jour</b>
              <div style={{ marginTop: 10 }} dangerouslySetInnerHTML={{ __html: lineChart({
                series: [
                  { name: "Pages vues", color: "var(--ink-3)", values: s.series.views, dash: true },
                  { name: "Visiteurs", color: "var(--green)", values: s.series.visitors, area: true },
                ],
                labels: s.series.labels, fmt: (n) => nf(Math.round(n)), height: 240,
              }) }} />
            </div>
          )}

          <div className="vis-grid">
            <TopTable title="Pages les plus vues" rows={s.pages} total={s.visitors} />
            <TopTable title="D’où viennent les visiteurs" rows={s.sources} total={s.visitors} />
            <TopTable title="Pays" rows={s.countries} total={s.visitors} />
            <TopTable title="Villes" rows={s.cities} total={s.visitors} />
            <TopTable title="Appareils" rows={s.devices} total={s.visitors} />
            <TopTable title="Navigateurs" rows={s.browsers} total={s.visitors} />
          </div>

          <div className="card" style={{ marginTop: 14 }}>
            <b>Dernières visites</b>
            {s.recent.length === 0 ? <p className="vis-empty">Pas encore de visite enregistrée.</p> : (
              <div className="tablewrap" style={{ marginTop: 8 }}><table className="atable"><thead><tr><th>Quand</th><th>Page</th><th>Source</th><th>Lieu</th><th>Appareil</th></tr></thead><tbody>
                {s.recent.map((r, i) => (
                  <tr key={i}>
                    <td>{new Date(r.created_at).toLocaleString("fr-FR", { timeZone: "Europe/Paris", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</td>
                    <td className="mono" style={{ fontSize: 12.5 }}>{r.path}</td>
                    <td>{r.source}</td>
                    <td>{[r.city, r.country].filter(Boolean).join(", ") || "—"}</td>
                    <td>{r.device}</td>
                  </tr>
                ))}
              </tbody></table></div>
            )}
          </div>
          <p style={{ color: "var(--ink-3)", fontSize: 12.5, marginTop: 8 }}>Mesure sans cookie : un visiteur est compté une fois par jour. Les robots et tes pages /admin sont exclus.</p>
        </>
      )}
    </section>
  );
}
