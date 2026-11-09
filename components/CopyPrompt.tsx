"use client";

import { useState } from "react";

export default function CopyPrompt({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  async function copy() {
    try { await navigator.clipboard.writeText(text); }
    catch {
      const ta = document.createElement("textarea"); ta.value = text; ta.style.position = "fixed"; ta.style.top = "-9999px";
      document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); } catch {} document.body.removeChild(ta);
    }
    setOk(true); setTimeout(() => setOk(false), 2000);
  }
  return <button type="button" className="btn primary" onClick={copy}>{ok ? "Copié ✓" : "Copier le prompt"}</button>;
}
