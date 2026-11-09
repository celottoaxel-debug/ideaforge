"use client";

import { useState } from "react";

export default function AdminRunJobs() {
  const [busy, setBusy] = useState("");
  const [out, setOut] = useState("");
  const [added, setAdded] = useState<{ id: string; title: string; sector: string }[]>([]);

  async function run(job: "discover" | "nurture") {
    setBusy(job); setOut(""); setAdded([]);
    try {
      const r = await fetch("/api/admin/run", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ job }) });
      const d = await r.json();
      if (job === "discover") {
        setOut(d.ok ? `✅ ${d.added} idée(s) publiée(s), affichée(s) en tête du catalogue avec le badge « 🔥 Nouveauté » :` : `❌ ${d.error ?? "échec"}`);
        if (d.ok) setAdded(d.ideas ?? []);
      }
      else setOut(d.ok ? `✅ Relances envoyées : ${Object.entries(d.sent ?? {}).map(([k, v]) => `${k} ${v}`).join(" · ") || "aucune à envoyer"}` : `❌ ${d.error ?? "échec"}`);
    } catch (e) {
      setOut(`❌ ${e instanceof Error ? e.message : "Erreur réseau"}`);
    } finally {
      setBusy("");
    }
  }

  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button className="btn" disabled={!!busy} onClick={() => run("discover")}>{busy === "discover" ? "Génération… (20–40 s)" : "Générer 3 idées maintenant"}</button>
        <button className="btn" disabled={!!busy} onClick={() => run("nurture")}>{busy === "nurture" ? "Envoi…" : "Envoyer les relances dues"}</button>
      </div>
      {out && <p style={{ marginTop: 10, fontSize: 14 }}>{out}</p>}
      {added.length > 0 && (
        <ul style={{ margin: "6px 0 0", paddingLeft: 20, fontSize: 14, display: "flex", flexDirection: "column", gap: 4 }}>
          {added.map((i) => <li key={i.id}><a href={`/idea/${i.id}`} target="_blank" style={{ fontWeight: 600, textDecoration: "underline" }}>{i.title}</a> <span style={{ color: "var(--ink-3)" }}>· {i.sector}</span></li>)}
        </ul>
      )}
    </div>
  );
}
