import { createClient } from "@/lib/supabase/server";
import { getPlan, isMember } from "@/lib/plan";
import type { Idea } from "@/lib/types";
import BuyLifetime from "@/components/BuyLifetime";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

const DIFF: Record<number, string> = { 1: "Facile", 2: "Intermédiaire", 3: "Exigeant" };

export default async function IdeaPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data } = await supabase.from("ideas").select("*").eq("id", params.id).maybeSingle();
  if (!data) notFound();
  const it = data as Idea;

  const plan = await getPlan();
  const member = isMember(plan);

  return (
    <>
      <header className="nav">
        <div className="wrap nav-in">
          <a className="brand" href="/"><span className="mk">IF</span> IdeaForge</a>
          <a className="btn" href="/">← Catalogue</a>
        </div>
      </header>

      <main className="wrap" style={{ maxWidth: 760, paddingBlock: 40 }}>
        <span className="sector">{it.sector}{it.markets ? ` · ${it.markets}` : ""}</span>
        <h1 style={{ fontSize: 34, margin: "8px 0 10px" }}>{it.title}</h1>
        {it.pitch && <p style={{ fontSize: 18, color: "var(--ink-2)" }}>{it.pitch}</p>}

        <div className="grid" style={{ gridTemplateColumns: "repeat(2,1fr)", margin: "22px 0" }}>
          <div className="card"><span className="stat"><span className="k">Ticket d&apos;entrée</span><span className="v">{it.budget}</span></span></div>
          <div className="card"><span className="stat"><span className="k">Potentiel</span><span className="v">{it.revenue}</span></span></div>
          <div className="card"><span className="stat"><span className="k">Délai</span><span className="v">{it.delai}</span></span></div>
          <div className="card"><span className="stat"><span className="k">Difficulté</span><span className="v">{it.difficulty ? DIFF[it.difficulty] : "—"}</span></span></div>
        </div>

        {it.benchmark && (
          <div className="card" style={{ background: "var(--forest)", color: "#fff", marginBottom: 20 }}>
            <span className="k" style={{ color: "rgba(255,255,255,.6)" }}>Benchmark marché</span>
            <div style={{ fontFamily: "var(--mono)", fontWeight: 600 }}>📈 {it.benchmark}</div>
          </div>
        )}

        <section className="dsec"><h3>Le marché</h3><p>{member ? it.market : (it.market || "").slice(0, 150) + "…"}</p></section>

        {member ? (
          <>
            <section className="dsec"><h3>Modèle de revenus</h3><p>{it.model}</p></section>
            <section className="dsec"><h3>Concurrence</h3><p>{it.competition}</p></section>
            <section className="dsec"><h3>Étapes de lancement</h3><ol>{it.steps?.map((s, i) => <li key={i}>{s}</li>)}</ol></section>
            <section className="dsec"><h3>Points de vigilance</h3><ul>{it.risks?.map((s, i) => <li key={i}>{s}</li>)}</ul></section>
          </>
        ) : (
          <div className="gate-lock">
            <div style={{ fontSize: 26 }}>🔒</div>
            <h3>Fiche complète réservée aux membres</h3>
            <p style={{ color: "var(--ink-2)", maxWidth: "40ch", margin: "0 auto" }}>
              Modèle de revenus, concurrence, étapes de lancement, risques et le prompt
              « Lancer avec Claude » sont inclus dans l&apos;Accès à vie — cette fiche + les 79 autres pour 129 € une fois.
            </p>
            <div style={{ maxWidth: 320, margin: "10px auto 0" }}><BuyLifetime /></div>
          </div>
        )}
      </main>
    </>
  );
}
