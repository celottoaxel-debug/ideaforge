"use client";

import { useState } from "react";

/** Boutons du panel Instagram : créer un carrousel, publier un brouillon, copier la légende. */
export function GenerateCarousel() {
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState("");
  async function go(kind: string) {
    setBusy(kind); setErr("");
    try {
      const r = await fetch("/api/admin/instagram", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "generate", kind }) });
      const j = await r.json();
      if (j.ok) window.location.reload(); else setErr(j.error || "Erreur");
    } catch { setErr("Erreur réseau"); }
    setBusy(null);
  }
  return (
    <div className="ig-gen">
      {[["idea", "💡 1 idée chiffrée"], ["top5", "🏆 Top 5 d'un thème"], ["new", "✨ Nouvelle idée IA"]].map(([k, l]) => (
        <button key={k} type="button" className="btn" disabled={!!busy} onClick={() => go(k)}>{busy === k ? "Création…" : l}</button>
      ))}
      {err && <p className="msg err">{err}</p>}
    </div>
  );
}

export function PublishButton({ id, disabled }: { id: number; disabled?: boolean }) {
  const [state, setState] = useState<"idle" | "busy" | "err">("idle");
  const [err, setErr] = useState("");
  async function go() {
    setState("busy");
    try {
      const r = await fetch("/api/admin/instagram", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "publish", id }) });
      const j = await r.json();
      if (j.ok) { window.location.reload(); return; }
      setErr(j.error || "Erreur"); setState("err");
    } catch { setErr("Erreur réseau"); setState("err"); }
  }
  return (
    <>
      <button type="button" className="btn primary" onClick={go} disabled={disabled || state === "busy"}>{state === "busy" ? "Publication… (30 s)" : "📸 Publier sur Instagram"}</button>
      {state === "err" && <p className="msg err">{err}</p>}
    </>
  );
}

export function CopyCaption({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return <button type="button" className="btn" onClick={async () => { try { await navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 1800); } catch {} }}>{ok ? "Copié ✓" : "Copier la légende"}</button>;
}

export function StoryButtons({ canPublish, published }: { canPublish: boolean; published: boolean }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState("");
  async function go(action: string) {
    setBusy(action); setErr("");
    try {
      const r = await fetch("/api/admin/instagram", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
      const j = await r.json();
      if (j.ok) { window.location.reload(); return; }
      setErr(j.error || "Erreur");
    } catch { setErr("Erreur réseau"); }
    setBusy(null);
  }
  if (published) return null;
  return (
    <div className="ig-actions">
      <button type="button" className="btn" disabled={!!busy} onClick={() => go("story-prepare")}>{busy === "story-prepare" ? "Préparation…" : "🔄 Préparer la story du jour"}</button>
      <button type="button" className="btn primary" disabled={!canPublish || !!busy} onClick={() => go("story-publish")}>{busy === "story-publish" ? "Publication…" : "📲 Publier la story"}</button>
      {err && <p className="msg err">{err}</p>}
    </div>
  );
}

export function ReelButtons({ id, canPublish, hasVideo }: { id: number; canPublish: boolean; hasVideo: boolean }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState("");
  async function go(action: string) {
    setBusy(action); setErr("");
    try {
      const r = await fetch("/api/admin/instagram", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, id }) });
      const j = await r.json();
      if (j.ok) { window.location.reload(); return; }
      setErr(j.error || "Erreur");
    } catch { setErr("Erreur réseau"); }
    setBusy(null);
  }
  return (
    <>
      <button type="button" className="btn" disabled={!!busy} onClick={() => go("reel-prepare")}>{busy === "reel-prepare" ? "Montage… (1 min)" : hasVideo ? "🎬 Refaire la vidéo" : "🎬 Créer le réel"}</button>
      {hasVideo && <button type="button" className="btn primary" disabled={!canPublish || !!busy} onClick={() => go("reel-publish")}>{busy === "reel-publish" ? "Publication… (1-2 min)" : "🎬 Publier le réel"}</button>}
      {err && <p className="msg err">{err}</p>}
    </>
  );
}
