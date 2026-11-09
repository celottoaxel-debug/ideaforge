"use client";

import { useState } from "react";

type R = { to: string; from: string; results: { name: string; ok: boolean; error?: string }[] } | { error: string };

export default function AdminEmailTest() {
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState<R | null>(null);

  async function run(all: boolean) {
    setLoading(true); setRes(null);
    try {
      const r = await fetch("/api/admin/test-email", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ all }) });
      setRes(await r.json());
    } catch (e) {
      setRes({ error: e instanceof Error ? e.message : "Erreur réseau" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card" style={{ margin: "18px 0" }}>
      <b>E-mails (Resend)</b>
      <p style={{ color: "var(--ink-2)", fontSize: 14, margin: "6px 0 12px" }}>Envoie-toi un exemplaire pour vérifier que Resend fonctionne.</p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button className="btn primary" disabled={loading} onClick={() => run(false)}>{loading ? "Envoi…" : "Envoyer un e-mail de test"}</button>
        <button className="btn" disabled={loading} onClick={() => run(true)}>Envoyer les 10 modèles</button>
      </div>
      {res && "error" in res && <p className="msg err" style={{ marginTop: 10 }}>{res.error}</p>}
      {res && "results" in res && (
        <div style={{ marginTop: 12, fontSize: 14 }}>
          <div style={{ color: "var(--ink-3)", marginBottom: 6 }}>De {res.from} à {res.to}</div>
          {res.results.map((r) => (
            <div key={r.name}>{r.ok ? "✅" : "❌"} {r.name}{r.error ? ` — ${r.error}` : ""}</div>
          ))}
        </div>
      )}
    </div>
  );
}
