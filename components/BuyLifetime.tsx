"use client";

import { useState } from "react";

export default function BuyLifetime({ label = "Obtenir l'accès à vie →" }: { label?: string }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function buy() {
    setLoading(true); setErr("");
    try {
      const res = await fetch("/api/checkout", { method: "POST" });
      if (res.status === 401) { window.location.href = "/login"; return; }
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setErr("Paiement indisponible. Réessaie.");
    } catch {
      setErr("Erreur réseau. Réessaie.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button className="btn primary" onClick={buy} disabled={loading} style={{ justifyContent: "center", width: "100%" }}>
        {loading ? "Redirection…" : label}
      </button>
      {err && <p className="msg err">{err}</p>}
    </>
  );
}
