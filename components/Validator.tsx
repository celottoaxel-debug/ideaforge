"use client";

import { useMemo, useState } from "react";
import type { Idea } from "@/lib/types";
import { IDEAS } from "@/lib/ideas";
import { scoreIdea, buildStack } from "@/lib/score";
import { buildPrompt } from "@/lib/prompt";
import ProofPanel from "@/components/ProofPanel";
import PromptBox from "@/components/PromptBox";

type D = Record<string, string>;

const STOP = new Set("avec pour dans mon ton son une des les que qui est sur aux the and for with your that this app tool tools idea para los las una con".split(" "));
function words(s: string): string[] {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").split(/[^a-z0-9]+/).filter((w) => w.length > 3 && !STOP.has(w));
}
const TAG_HINTS = ["saas", "abonnement", "recurrent", "b2b", "ia", "api", "marketplace", "no-code", "local", "niche", "vertical", "ecommerce", "agent"];

export default function Validator({ t }: { t: D }) {
  const sectors = useMemo(() => Array.from(new Set(IDEAS.map((i) => i.sector))).sort(), []);
  const [text, setText] = useState("");
  const [sector, setSector] = useState(sectors[0] || "Micro-SaaS / IA");
  const [difficulty, setDifficulty] = useState(2);
  const [recurring, setRecurring] = useState(true);
  const [idea, setIdea] = useState<Idea | null>(null);

  function analyze() {
    const clean = text.trim();
    if (clean.length < 8) return;
    const w = words(clean + " " + sector);
    const tags = TAG_HINTS.filter((h) => clean.toLowerCase().includes(h.replace("-", "")) || clean.toLowerCase().includes(h));
    if (recurring) tags.push("récurrent");
    const title = clean.split(/[.\n]/)[0].slice(0, 70) || clean.slice(0, 70);
    const syn: Idea = {
      id: "user-idea", sector, title, pitch: clean.slice(0, 280),
      budget: null, budget_min: null, revenue: null, delai: null, difficulty,
      market: null, model: recurring ? "Abonnement récurrent" : null, competition: null,
      steps: [], risks: [], tags, benchmark: null, markets: null, featured: false, is_ai: false,
    };
    setIdea(syn);
    // scroll to result on next paint
    setTimeout(() => document.getElementById("val-result")?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
  }

  const similar = useMemo(() => {
    if (!idea) return [];
    const uw = new Set(words((idea.title || "") + " " + (idea.pitch || "")));
    return IDEAS.map((it) => {
      const iw = words(it.title + " " + (it.pitch || "") + " " + (it.tags || []).join(" "));
      let overlap = iw.filter((x) => uw.has(x)).length;
      if (it.sector === idea.sector) overlap += 1;
      return { it, overlap };
    }).filter((x) => x.overlap > 0).sort((a, b) => b.overlap - a.overlap).slice(0, 3).map((x) => x.it);
  }, [idea]);

  const sc = idea ? scoreIdea(idea) : null;
  const bars = sc ? [
    { k: t.s_demand, v: sc.demand }, { k: t.s_comp, v: sc.competition },
    { k: t.s_margin, v: sc.margin }, { k: t.s_speed, v: sc.speed },
  ] : [];

  return (
    <div className="validator">
      <div className="panel">
        <div>
          <label htmlFor="vtext">{t.val_ph}</label>
          <textarea id="vtext" rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder={t.val_ph} />
        </div>
        <div className="field-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <label>{t.nav_catalogue ? "Secteur" : "Secteur"}
            <select value={sector} onChange={(e) => setSector(e.target.value)}>{sectors.map((s) => <option key={s}>{s}</option>)}</select>
          </label>
          <label>{t.val_diff}
            <select value={difficulty} onChange={(e) => setDifficulty(+e.target.value)}>
              <option value={1}>{t.diff1}</option><option value={2}>{t.diff2}</option><option value={3}>{t.diff3}</option>
            </select>
          </label>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 8, flexDirection: "row" }}>
          <input type="checkbox" checked={recurring} onChange={(e) => setRecurring(e.target.checked)} style={{ width: "auto" }} />
          {t.val_recurring}
        </label>
        <button className="btn primary" onClick={analyze} disabled={text.trim().length < 8} style={{ justifyContent: "center" }}>{t.val_go}</button>
      </div>

      {idea && sc && (
        <div id="val-result" className="val-out">
          <h3 style={{ fontSize: 22, margin: "6px 0 4px" }}>{t.val_result}</h3>
          <p style={{ color: "var(--ink-3)", fontSize: 13, marginBottom: 16 }}>{t.val_disclaimer}</p>

          <div className="scorebox">
            <div className="score-big"><span className="mono">{sc.score}</span><small>/100</small></div>
            <div className="score-bars">
              {bars.map((b) => (
                <div className="score-row" key={b.k}><span className="score-lbl">{b.k}</span><div className="score-track"><i style={{ width: `${b.v}%` }} /></div><span className="score-num mono">{b.v}</span></div>
              ))}
            </div>
          </div>
          <div className="stack-line"><span className="stack-k">{t.stack_label} :</span> <span className="mono">{buildStack(idea)}</span></div>

          <h4 className="val-sec">{t.proof_h}</h4>
          <ProofPanel it={idea} t={t} />

          <h4 className="val-sec">{t.plan_h}</h4>
          <ol className="plan30">
            {[t.val_plan1, t.val_plan2, t.val_plan3, t.val_plan4].map((s, i) => (
              <li key={i}><span className="plan-w mono">{t.plan_week} {i + 1}</span><span>{s}</span></li>
            ))}
          </ol>

          <h4 className="val-sec">{t.kit_h}</h4>
          <PromptBox prompt={buildPrompt(idea)} t={t} />

          <h4 className="val-sec">{t.val_similar}</h4>
          {similar.length === 0 ? (
            <p style={{ color: "var(--ink-2)" }}>{t.val_none}</p>
          ) : (
            <div className="grid">
              {similar.map((it) => (
                <a className="card" key={it.id} href={`/idea/${it.id}`}>
                  <div className="card-link">
                    <span className="sector">{it.sector}</span>
                    <h3>{it.title}</h3>
                    {it.pitch && <p className="pitch">{it.pitch}</p>}
                    {it.benchmark && <div className="bench">📈 {it.benchmark}</div>}
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
