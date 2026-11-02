"use client";

import { useEffect, useMemo, useState } from "react";
import type { Idea } from "@/lib/types";
import { IDEAS } from "@/lib/ideas";
import { scoreIdea, buildStack } from "@/lib/score";
import { buildPrompt } from "@/lib/prompt";
import ProofPanel from "@/components/ProofPanel";
import PromptBox from "@/components/PromptBox";

type D = Record<string, string>;
type Report = { score: number; verdict: string; competitors: { name: string; note: string }[]; market: string; angles: string[]; risks: string[] };

const STOP = new Set("avec pour dans mon ton son une des les que qui est sur aux the and for with your that this app tool tools idea para los las una con".split(" "));
function words(s: string): string[] {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").split(/[^a-z0-9]+/).filter((w) => w.length > 3 && !STOP.has(w));
}
const TAG_HINTS = ["saas", "abonnement", "recurrent", "b2b", "ia", "api", "marketplace", "no-code", "local", "niche", "vertical", "ecommerce", "agent"];

export default function Validator({ t, locale }: { t: D; locale: string }) {
  const sectors = useMemo(() => Array.from(new Set(IDEAS.map((i) => i.sector))).sort(), []);
  const [text, setText] = useState("");
  const [sector, setSector] = useState(sectors[0] || "Micro-SaaS / IA");
  const [difficulty, setDifficulty] = useState(2);
  const [recurring, setRecurring] = useState(true);
  const [idea, setIdea] = useState<Idea | null>(null);
  const [ai, setAi] = useState<Report | null>(null);
  const [aiState, setAiState] = useState<"" | "loading" | "unavailable" | "error">("");
  const [shareMsg, setShareMsg] = useState("");

  function buildIdea(txt: string, sec: string, diff: number, rec: boolean): Idea {
    const clean = txt.trim();
    const tags = TAG_HINTS.filter((hh) => clean.toLowerCase().includes(hh.replace("-", "")) || clean.toLowerCase().includes(hh));
    if (rec) tags.push("récurrent");
    const title = clean.split(/[.\n]/)[0].slice(0, 70) || clean.slice(0, 70);
    return { id: "user-idea", sector: sec, title, pitch: clean.slice(0, 280), budget: null, budget_min: null, revenue: null, delai: null, difficulty: diff, market: null, model: rec ? "Abonnement récurrent" : null, competition: null, steps: [], risks: [], tags, benchmark: null, markets: null, featured: false, is_ai: false };
  }

  function analyze(txt = text, sec = sector, diff = difficulty, rec = recurring) {
    if (txt.trim().length < 8) return;
    setAi(null); setAiState("");
    setIdea(buildIdea(txt, sec, diff, rec));
    setTimeout(() => document.getElementById("val-result")?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
  }

  // Préremplissage depuis l'URL (?idea=&sector=&diff=&rec=) + analyse auto (partage).
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const q = p.get("idea");
    if (q) {
      const sec = p.get("sector") || sector;
      const diff = Number(p.get("diff")) || 2;
      const rec = p.get("rec") !== "0";
      setText(q); setSector(sec); setDifficulty(diff); setRecurring(rec);
      analyze(q, sec, diff, rec);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runAI() {
    if (!idea) return;
    setAiState("loading"); setAi(null);
    try {
      const res = await fetch("/api/validate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text: idea.pitch, sector, difficulty, recurring, locale }) });
      const data = await res.json();
      if (data.unavailable) { setAiState("unavailable"); return; }
      if (data.ok && data.report) { setAi(data.report as Report); setAiState(""); return; }
      setAiState("error");
    } catch { setAiState("error"); }
  }

  function share() {
    const u = new URL(window.location.origin + "/validate");
    u.searchParams.set("idea", idea?.pitch || text);
    u.searchParams.set("sector", sector);
    u.searchParams.set("diff", String(difficulty));
    u.searchParams.set("rec", recurring ? "1" : "0");
    navigator.clipboard?.writeText(u.toString()).then(() => { setShareMsg(t.share_copied); setTimeout(() => setShareMsg(""), 2000); }).catch(() => {});
    setTimeout(() => window.print(), 300);
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
  const bars = sc ? [{ k: t.s_demand, v: sc.demand }, { k: t.s_comp, v: sc.competition }, { k: t.s_margin, v: sc.margin }, { k: t.s_speed, v: sc.speed }] : [];

  return (
    <div className="validator">
      <div className="panel no-print">
        <div>
          <label htmlFor="vtext">{t.val_ph}</label>
          <textarea id="vtext" rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder={t.val_ph} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <label>Secteur<select value={sector} onChange={(e) => setSector(e.target.value)}>{sectors.map((s) => <option key={s}>{s}</option>)}</select></label>
          <label>{t.val_diff}<select value={difficulty} onChange={(e) => setDifficulty(+e.target.value)}><option value={1}>{t.diff1}</option><option value={2}>{t.diff2}</option><option value={3}>{t.diff3}</option></select></label>
        </div>
        <label style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <input type="checkbox" checked={recurring} onChange={(e) => setRecurring(e.target.checked)} style={{ width: "auto" }} />{t.val_recurring}
        </label>
        <button className="btn primary" onClick={() => analyze()} disabled={text.trim().length < 8} style={{ justifyContent: "center" }}>{t.val_go}</button>
      </div>

      {idea && sc && (
        <div id="val-result" className="val-out">
          <div className="val-top no-print">
            <h3 style={{ fontSize: 22, margin: 0 }}>{t.val_result}</h3>
            <button className="btn" onClick={share}>{shareMsg || t.share_btn}</button>
          </div>
          <p style={{ color: "var(--ink-3)", fontSize: 13, margin: "4px 0 16px" }}>{t.val_disclaimer}</p>

          <div className="scorebox">
            <div className="score-big"><span className="mono">{sc.score}</span><small>/100</small></div>
            <div className="score-bars">{bars.map((b) => <div className="score-row" key={b.k}><span className="score-lbl">{b.k}</span><div className="score-track"><i style={{ width: `${b.v}%` }} /></div><span className="score-num mono">{b.v}</span></div>)}</div>
          </div>
          <div className="stack-line"><span className="stack-k">{t.stack_label} :</span> <span className="mono">{buildStack(idea)}</span></div>

          <div className="ai-block">
            {!ai && aiState !== "loading" && <button className="btn primary no-print" onClick={runAI}>{t.ai_go}</button>}
            {aiState === "loading" && <p className="msg">{t.ai_running}</p>}
            {aiState === "unavailable" && <p className="msg" style={{ color: "var(--ink-2)" }}>{t.ai_unavailable}</p>}
            {aiState === "error" && <p className="msg err">{t.ai_err}</p>}
            {ai && (
              <div className="ai-report">
                <h4 className="val-sec">{t.ai_h}</h4>
                <div className="ai-verdict"><span className="ai-score mono">{ai.score}/100</span><p>{ai.verdict}</p></div>
                {ai.competitors?.length > 0 && <><h4 className="val-sec">{t.ai_competitors}</h4><ul className="ai-list">{ai.competitors.map((c, i) => <li key={i}><b>{c.name}</b> — {c.note}</li>)}</ul></>}
                {ai.market && <><h4 className="val-sec">{t.ai_market}</h4><p>{ai.market}</p></>}
                {ai.angles?.length > 0 && <><h4 className="val-sec">{t.ai_angles}</h4><ul className="ai-list">{ai.angles.map((a, i) => <li key={i}>{a}</li>)}</ul></>}
                {ai.risks?.length > 0 && <><h4 className="val-sec">{t.ai_risks}</h4><ul className="ai-list">{ai.risks.map((r, i) => <li key={i}>{r}</li>)}</ul></>}
              </div>
            )}
          </div>

          <h4 className="val-sec">{t.proof_h}</h4>
          <ProofPanel it={idea} t={t} />

          <h4 className="val-sec">{t.plan_h}</h4>
          <ol className="plan30">{[t.val_plan1, t.val_plan2, t.val_plan3, t.val_plan4].map((s, i) => <li key={i}><span className="plan-w mono">{t.plan_week} {i + 1}</span><span>{s}</span></li>)}</ol>

          <h4 className="val-sec">{t.kit_h}</h4>
          <PromptBox prompt={buildPrompt(idea)} t={t} />

          <h4 className="val-sec">{t.val_similar}</h4>
          {similar.length === 0 ? <p style={{ color: "var(--ink-2)" }}>{t.val_none}</p> : (
            <div className="grid">{similar.map((it) => (
              <a className="card" key={it.id} href={`/idea/${it.id}`}>
                <div className="card-link"><span className="sector">{it.sector}</span><h3>{it.title}</h3>{it.pitch && <p className="pitch">{it.pitch}</p>}{it.benchmark && <div className="bench">📈 {it.benchmark}</div>}</div>
              </a>
            ))}</div>
          )}
        </div>
      )}
    </div>
  );
}
