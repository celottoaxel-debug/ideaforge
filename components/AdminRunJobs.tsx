"use client";

import { useState } from "react";

export default function AdminRunJobs() {
  const [busy, setBusy] = useState("");
  const [out, setOut] = useState("");

  async function run(job: "discover" | "nurture") {
    setBusy(job); setOut("");
    try {
      const r = await fetch("/api/admin/run", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ job }) });
      const d = await r.json();
      if (job === "discover") setOut(d.ok ? `✅ ${d.added} idée(s) ajoutée(s) au catalogue.` : `❌ ${d.error ?? "échec"}`);
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
    </div>
  );
}
