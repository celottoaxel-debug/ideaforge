"use client";

/**
 * Le moment interactif : on maintient le bouton appuyé pour "forger" une idée.
 * La jauge monte pendant l'appui, redescend en douceur si on lâche trop tôt,
 * et révèle une vraie idée du catalogue quand elle est pleine.
 */
import { useEffect, useRef, useState } from "react";

type Pick = { id: string; title: string; sector: string; pitch: string | null; budget: string | null; revenue: string | null; delai: string | null };

const HOLD_MS = 1500;

export default function ForgeHold({ ideas, labels }: {
  ideas: Pick[];
  labels: { hold: string; holding: string; again: string; open: string; budget: string; revenue: string; delay: string };
}) {
  const [prog, setProg] = useState(0);
  const [idea, setIdea] = useState<Pick | null>(null);
  const [holding, setHolding] = useState(false);
  const raf = useRef<number | null>(null);
  const pRef = useRef(0);
  const down = useRef(false);
  const lastIdx = useRef(-1);

  const finish = () => {
    let i = Math.floor(Math.random() * ideas.length);
    if (ideas.length > 1 && i === lastIdx.current) i = (i + 1) % ideas.length;
    lastIdx.current = i;
    setIdea(ideas[i]);
    down.current = false; setHolding(false);
    pRef.current = 1; setProg(1);
  };

  const loop = (t0: number, from: number) => (now: number) => {
    const dt = now - t0;
    let p: number;
    if (down.current) p = Math.min(1, from + dt / HOLD_MS);
    else p = Math.max(0, from - dt / (HOLD_MS * 0.6));
    pRef.current = p; setProg(p);
    if (down.current && p >= 1) { raf.current = null; finish(); return; }
    if (!down.current && p <= 0) { raf.current = null; return; }
    raf.current = requestAnimationFrame(loop(t0, from));
  };
  const restart = () => {
    if (raf.current !== null) cancelAnimationFrame(raf.current);
    const t0 = performance.now();
    raf.current = requestAnimationFrame(loop(t0, pRef.current));
  };

  const start = () => {
    if (idea) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { finish(); return; }
    down.current = true; setHolding(true); restart();
  };
  const stop = () => {
    if (!down.current) return;
    down.current = false; setHolding(false);
    if (pRef.current < 1) restart();
  };
  const reset = () => { setIdea(null); pRef.current = 0; setProg(0); };

  useEffect(() => () => { if (raf.current !== null) cancelAnimationFrame(raf.current); }, []);

  const deg = Math.round(prog * 360);

  return (
    <div className={`forge ${idea ? "done" : ""} ${holding ? "holding" : ""}`}>
      {!idea ? (
        <button
          type="button"
          className="forge-btn"
          style={{ ["--deg" as string]: `${deg}deg`, ["--p" as string]: prog.toFixed(3) }}
          onPointerDown={(e) => { e.preventDefault(); start(); }}
          onPointerUp={stop} onPointerLeave={stop} onPointerCancel={stop}
          onKeyDown={(e) => { if ((e.key === " " || e.key === "Enter") && !e.repeat) { e.preventDefault(); start(); } }}
          onKeyUp={(e) => { if (e.key === " " || e.key === "Enter") stop(); }}
          onContextMenu={(e) => e.preventDefault()}
          aria-label={labels.hold}
        >
          <span className="forge-core" aria-hidden="true" />
          <span className="forge-label">{holding ? labels.holding : labels.hold}</span>
        </button>
      ) : (
        <div className="forge-card" role="status">
          <span className="sector">{idea.sector}</span>
          <h3>{idea.title}</h3>
          {idea.pitch && <p>{idea.pitch}</p>}
          <div className="forge-stats">
            {idea.budget && <div><span className="k mono">{labels.budget}</span><b>{idea.budget}</b></div>}
            {idea.revenue && <div><span className="k mono">{labels.revenue}</span><b>{idea.revenue}</b></div>}
            {idea.delai && <div><span className="k mono">{labels.delay}</span><b>{idea.delai}</b></div>}
          </div>
          <div className="forge-actions">
            <a className="btn primary" href={`/idea/${idea.id}`}>{labels.open}</a>
            <button type="button" className="btn ghost" onClick={reset}>{labels.again}</button>
          </div>
        </div>
      )}
    </div>
  );
}
