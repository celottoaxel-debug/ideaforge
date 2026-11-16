"use client";

import { useState } from "react";

const L = {
  fr: { btn: "🎁 Débloquer cette fiche gratuitement", busy: "Déblocage…", err: "Impossible pour l'instant, réessaie.", used: "Tu as déjà utilisé ta fiche offerte." },
  en: { btn: "🎁 Unlock this sheet for free", busy: "Unlocking…", err: "Not possible right now, try again.", used: "You've already used your free sheet." },
  es: { btn: "🎁 Desbloquear esta ficha gratis", busy: "Desbloqueando…", err: "No es posible ahora, inténtalo de nuevo.", used: "Ya usaste tu ficha gratis." },
};

/** Bouton « fiche offerte » : débloque la fiche complète pour un inscrit qui ne l'a pas encore utilisée. */
export default function FreeUnlock({ id, locale = "fr" }: { id: string; locale?: string }) {
  const t = L[(locale as keyof typeof L)] ?? L.fr;
  const [state, setState] = useState<"idle" | "busy" | "err" | "used">("idle");
  async function go() {
    setState("busy");
    try {
      const r = await fetch("/api/unlock", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      if (r.ok) { window.location.reload(); return; }
      setState(r.status === 409 ? "used" : "err");
    } catch { setState("err"); }
  }
  return (
    <>
      <button type="button" className="btn primary lg free-unlock" onClick={go} disabled={state === "busy"}>{state === "busy" ? t.busy : t.btn}</button>
      {(state === "err" || state === "used") && <p className="msg err">{state === "used" ? t.used : t.err}</p>}
    </>
  );
}
