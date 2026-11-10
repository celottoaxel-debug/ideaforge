"use client";

import { useState } from "react";

/** Bouton admin : marque une récompense « palier 3 » comme livrée. */
export default function ReferralDeliver({ id }: { id: number }) {
  const [state, setState] = useState<"idle" | "busy" | "done" | "err">("idle");
  async function go() {
    setState("busy");
    try {
      const r = await fetch("/api/admin/referrals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      setState(r.ok ? "done" : "err");
    } catch { setState("err"); }
  }
  if (state === "done") return <span className="ref-pill paid">Livré ✓</span>;
  return <button type="button" className="btn" onClick={go} disabled={state === "busy"}>{state === "busy" ? "…" : state === "err" ? "Erreur, réessayer" : "Marquer livré"}</button>;
}
