"use client";

import { useState } from "react";

/** Lien de parrainage : copier, ou partager directement (WhatsApp, X, e-mail, partage du téléphone). */
export default function ShareLink({ url, message }: { url: string; message: string }) {
  const [ok, setOk] = useState(false);
  const full = `${message} ${url}`;

  async function copy() {
    try { await navigator.clipboard.writeText(url); }
    catch {
      const ta = document.createElement("textarea"); ta.value = url; ta.style.position = "fixed"; ta.style.top = "-9999px";
      document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); } catch {} document.body.removeChild(ta);
    }
    setOk(true); setTimeout(() => setOk(false), 2000);
  }
  async function nativeShare() {
    const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> };
    if (nav.share) { try { await nav.share({ title: "IdeaForge", text: message, url }); } catch {} }
    else copy();
  }

  return (
    <div className="share">
      <div className="share-row">
        <input className="share-input mono" readOnly value={url} onFocus={(e) => e.currentTarget.select()} aria-label="Ton lien de parrainage" />
        <button type="button" className="btn primary" onClick={copy}>{ok ? "Copié ✓" : "Copier le lien"}</button>
      </div>
      <div className="share-btns">
        <a className="btn" href={`https://wa.me/?text=${encodeURIComponent(full)}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
        <a className="btn" href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(full)}`} target="_blank" rel="noopener noreferrer">X</a>
        <a className="btn" href={`mailto:?subject=${encodeURIComponent("Une idée de business pour toi")}&body=${encodeURIComponent(full)}`}>E-mail</a>
        <button type="button" className="btn" onClick={nativeShare}>Partager…</button>
      </div>
    </div>
  );
}
