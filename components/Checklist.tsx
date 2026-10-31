"use client";

import { useEffect, useState } from "react";

type D = Record<string, string>;

export default function Checklist({ id, steps, t }: { id: string; steps: string[]; t: D }) {
  const key = `ideaforge:checklist:${id}`;
  const [done, setDone] = useState<boolean[]>(() => steps.map(() => false));

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) setDone(steps.map((_, i) => !!arr[i]));
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  function toggle(i: number) {
    setDone((prev) => {
      const next = prev.map((v, j) => (j === i ? !v : v));
      try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
      return next;
    });
  }

  const count = done.filter(Boolean).length;
  const pct = steps.length ? Math.round((count / steps.length) * 100) : 0;

  return (
    <div className="checklist">
      <div className="cl-head">
        <span className="cl-prog mono">{count}/{steps.length} {t.checklist_done}</span>
        <div className="cl-bar"><i style={{ width: `${pct}%` }} /></div>
      </div>
      <ul>
        {steps.map((s, i) => (
          <li key={i}>
            <label>
              <input type="checkbox" checked={done[i] || false} onChange={() => toggle(i)} />
              <span className={done[i] ? "cl-done" : ""}>{s}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
