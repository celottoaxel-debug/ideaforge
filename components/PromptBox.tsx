"use client";

import { useState } from "react";

type D = Record<string, string>;

export default function PromptBox({ prompt, t }: { prompt: string; t: D }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try { await navigator.clipboard.writeText(prompt); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch {
      const ta = document.createElement("textarea"); ta.value = prompt; ta.style.position = "fixed"; ta.style.top = "-9999px";
      document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
      document.body.removeChild(ta);
    }
  }

  const enc = encodeURIComponent(prompt);
  return (
    <div className="promptbox">
      <pre className="prompt-pre">{prompt}</pre>
      <div className="prompt-actions">
        <button className="btn primary" onClick={copy} type="button">{copied ? t.prompt_copied : t.prompt_copy}</button>
        <a className="btn" href="https://claude.ai/new" target="_blank" rel="noopener">{t.open_claude}</a>
        <a className="btn" href="https://lovable.dev" target="_blank" rel="noopener">{t.open_lovable}</a>
        <a className="btn" href={`https://bolt.new/?prompt=${enc}`} target="_blank" rel="noopener">{t.open_bolt}</a>
        <a className="btn" href="https://stackblitz.com/fork/nextjs" target="_blank" rel="noopener">{t.open_stackblitz}</a>
      </div>
    </div>
  );
}
