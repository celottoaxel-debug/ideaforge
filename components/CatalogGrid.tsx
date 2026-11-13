"use client";

import { useMemo, useState } from "react";
import type { Idea } from "@/lib/types";
import { scoreIdea } from "@/lib/score";
import FavoriteButton from "@/components/FavoriteButton";

type D = Record<string, string>;
const PREVIEW = 9;
const NEW_DAYS = 7;

// Idée découverte par l'IA il y a moins de 7 jours : mise en avant + badge « Nouveauté ».
export function isNewIdea(i: Idea) {
  if (!i.is_ai || !i.created_at) return false;
  return Date.now() - new Date(i.created_at).getTime() < NEW_DAYS * 86_400_000;
}

const BEST = 75; // « Meilleur score » : idées notées 75/100 ou plus
type Quick = "best" | "new" | "cheap" | "fast" | "ai" | "easy" | "fav";
type Sort = "feat" | "score" | "ticket" | "new";

/** Délai de lancement en semaines (lit « 2–6 semaines », « 3 mois »…). */
function weeksOf(it: Idea) {
  const d = (it.delai || "").toLowerCase();
  const n = d.match(/(\d+)\+?\s*(?:–|-|à)?\s*(\d+)?\s*(sem|mois)/);
  if (!n) return 99;
  const v = Number(n[2] || n[1]);
  return n[3] === "mois" ? v * 4.3 : v;
}
const isAI = (i: Idea) => /\bIA\b|\bAI\b|agent|GPT|LLM|intelligence artificielle/i.test([i.title, i.pitch, i.sector, ...(i.tags || [])].join(" "));

export default function CatalogGrid({ ideas, favIds, t }: { ideas: Idea[]; favIds: string[]; t: D }) {
  const [q, setQ] = useState("");
  const [sector, setSector] = useState("");
  const [diffF, setDiffF] = useState(0);
  const [budgetMax, setBudgetMax] = useState(0);
  const [minScore, setMinScore] = useState(0);
  const [quick, setQuick] = useState<Quick[]>([]);
  const [sort, setSort] = useState<Sort>("feat");
  const [showAll, setShowAll] = useState(false);
  const [cmp, setCmp] = useState<string[]>([]);

  const favSet = new Set(favIds);
  const diffLabel: Record<number, string> = { 1: t.diff1, 2: t.diff2, 3: t.diff3 };
  const scores = useMemo(() => Object.fromEntries(ideas.map((i) => [i.id, scoreIdea(i).score])), [ideas]);
  const sectors = useMemo(() => Array.from(new Set(ideas.map((i) => i.sector))).sort(), [ideas]);

  const QUICK: { k: Quick; ic: string; label: string; test: (i: Idea) => boolean }[] = [
    { k: "best", ic: "🏆", label: t.qf_best, test: (i) => scores[i.id] >= BEST },
    { k: "new", ic: "🔥", label: t.qf_new, test: (i) => isNewIdea(i) },
    { k: "cheap", ic: "💶", label: t.qf_cheap, test: (i) => (i.budget_min ?? 99999) <= 1000 },
    { k: "fast", ic: "⚡", label: t.qf_fast, test: (i) => weeksOf(i) <= 8 },
    { k: "ai", ic: "🤖", label: t.qf_ai, test: isAI },
    { k: "easy", ic: "🟢", label: t.qf_easy, test: (i) => i.difficulty === 1 },
    ...(favIds.length ? [{ k: "fav" as Quick, ic: "★", label: t.qf_fav, test: (i: Idea) => favSet.has(i.id) }] : []),
  ];
  const counts = useMemo(() => Object.fromEntries(QUICK.map((f) => [f.k, ideas.filter(f.test).length])), [ideas, scores, favIds]); // eslint-disable-line react-hooks/exhaustive-deps

  function toggleQuick(k: Quick) {
    const on = quick.includes(k);
    // « Meilleur score » trie automatiquement de la meilleure note à la moins bonne
    if (k === "best") setSort(on ? "feat" : "score");
    setQuick(on ? quick.filter((x) => x !== k) : [...quick, k]);
  }
  function reset() { setQ(""); setSector(""); setDiffF(0); setBudgetMax(0); setMinScore(0); setQuick([]); setSort("feat"); }

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const tests = QUICK.filter((f) => quick.includes(f.k)).map((f) => f.test);
    let list = ideas.filter((i) => {
      if (sector && i.sector !== sector) return false;
      if (diffF && i.difficulty !== diffF) return false;
      if (budgetMax && (i.budget_min ?? 99999) > budgetMax) return false;
      if (minScore && scores[i.id] < minScore) return false;
      if (!tests.every((fn) => fn(i))) return false;
      if (needle) {
        const hay = (i.title + " " + i.sector + " " + (i.pitch || "") + " " + (i.tags || []).join(" ") + " " + (i.benchmark || "")).toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
    list = [...list].sort((a, b) => {
      if (sort === "score") return scores[b.id] - scores[a.id];
      if (sort === "ticket") return (a.budget_min || 0) - (b.budget_min || 0);
      if (sort === "new") return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      const na = isNewIdea(a), nb = isNewIdea(b);
      if (na || nb) return na && nb ? new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime() : na ? -1 : 1;
      return (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || scores[b.id] - scores[a.id];
    });
    return list;
  }, [ideas, q, sector, diffF, budgetMax, minScore, quick, sort, scores]); // eslint-disable-line react-hooks/exhaustive-deps

  const active = Boolean(q || sector || diffF || budgetMax || minScore || quick.length || sort !== "feat");
  const collapsed = !showAll && !active && filtered.length > PREVIEW;
  const shown = collapsed ? filtered.slice(0, PREVIEW) : filtered;
  const cmpIdeas = cmp.map((id) => ideas.find((i) => i.id === id)).filter(Boolean) as Idea[];
  const ranked = sort === "score";

  function toggleCmp(id: string) {
    setCmp((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= 3 ? prev : [...prev, id]));
  }

  return (
    <>
      <div className="qf" role="group" aria-label="Filtres rapides">
        {QUICK.map((f) => {
          const on = quick.includes(f.k);
          return (
            <button key={f.k} type="button" className={`qf-chip ${on ? "on" : ""} ${f.k === "best" ? "best" : ""}`} aria-pressed={on} onClick={() => toggleQuick(f.k)}>
              <span aria-hidden="true">{f.ic}</span> {f.label} <span className="qf-n mono">{counts[f.k]}</span>
            </button>
          );
        })}
      </div>

      <div className="cat-controls">
        <input className="cat-search" type="search" placeholder={t.search_ph} value={q} onChange={(e) => setQ(e.target.value)} aria-label={t.search_ph} />
        <select value={sector} onChange={(e) => setSector(e.target.value)} aria-label={t.f_sector}>
          <option value="">{t.f_sector}</option>
          {sectors.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={diffF} onChange={(e) => setDiffF(+e.target.value)} aria-label={t.f_diff}>
          <option value={0}>{t.f_diff}</option>
          <option value={1}>{t.diff1}</option>
          <option value={2}>{t.diff2}</option>
          <option value={3}>{t.diff3}</option>
        </select>
        <select value={budgetMax} onChange={(e) => setBudgetMax(+e.target.value)} aria-label={t.f_budget}>
          <option value={0}>{t.f_budget}</option>
          <option value={1000}>{t.f_budget_lt} 1 000 €</option>
          <option value={5000}>{t.f_budget_lt} 5 000 €</option>
          <option value={15000}>{t.f_budget_lt} 15 000 €</option>
        </select>
        <select value={minScore} onChange={(e) => setMinScore(+e.target.value)} aria-label={t.f_score}>
          <option value={0}>{t.f_score}</option>
          <option value={60}>{t.f_score_min} 60+</option>
          <option value={70}>{t.f_score_min} 70+</option>
          <option value={80}>{t.f_score_min} 80+</option>
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Tri">
          <option value="feat">{t.sort_feat}</option>
          <option value="score">{t.sort_score}</option>
          <option value="ticket">{t.sort_ticket}</option>
          <option value="new">{t.sort_new}</option>
        </select>
      </div>

      {active && (
        <div className="qf-status">
          <span><b className="mono">{filtered.length}</b> {filtered.length === 1 ? t.f_result1.replace(/^1\s*/, "") : t.f_results.replace("{n}", "").trim()}</span>
          {quick.includes("best") && <span className="qf-note">{t.f_best_note}</span>}
          <button type="button" className="qf-reset" onClick={reset}>{t.f_reset}</button>
        </div>
      )}

      {cmpIdeas.length > 0 && (
        <div className="cmp-panel">
          <div className="cmp-head"><b>{t.cmp_title}</b><button className="btn" onClick={() => setCmp([])}>{t.cmp_clear}</button></div>
          <div className="cmp-table-wrap">
            <table className="cmp-table">
              <thead><tr><th></th>{cmpIdeas.map((i) => <th key={i.id}>{i.title}</th>)}</tr></thead>
              <tbody>
                <tr><td>{t.score_label}</td>{cmpIdeas.map((i) => <td key={i.id} className="mono cmp-score">{scores[i.id]}</td>)}</tr>
                <tr><td>{t.ticket}</td>{cmpIdeas.map((i) => <td key={i.id}>{i.budget}</td>)}</tr>
                <tr><td>{t.potential}</td>{cmpIdeas.map((i) => <td key={i.id}>{i.revenue}</td>)}</tr>
                <tr><td>{t.delai}</td>{cmpIdeas.map((i) => <td key={i.id}>{i.delai}</td>)}</tr>
                <tr><td>{t.m_diff}</td>{cmpIdeas.map((i) => <td key={i.id}>{i.difficulty ? diffLabel[i.difficulty] : "·"}</td>)}</tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <p style={{ textAlign: "center", color: "var(--ink-3)", padding: "30px 0" }}>{t.cat_empty}</p>
      ) : (
        <div className={"catprev" + (collapsed ? " faded" : "")}>
          <div className="grid">
            {shown.map((it, idx) => {
              const sc = scores[it.id];
              return (
                <div className={"card" + (isNewIdea(it) ? " is-new" : "")} key={it.id}>
                  {isNewIdea(it) && <span className="new-flag">🔥 {t.badge_novelty}</span>}
                  {ranked && idx < 3 && <span className={`rank-flag r${idx + 1}`}>{["🥇", "🥈", "🥉"][idx]} {t.f_top} {idx + 1} · {sc}/100</span>}
                  <div className="card-badges">
                    {it.featured && <span className="bdg feat">★ {t.badge_feat}</span>}
                    {it.is_ai && !isNewIdea(it) && <span className="bdg new">✦ {t.badge_new}</span>}
                    {sc >= 82 && <span className="bdg hot">⚡ {t.badge_hot}</span>}
                  </div>
                  <a href={`/idea/${it.id}`} className="card-link">
                    <span className="sector">{it.sector}</span>
                    <h3>{it.title}</h3>
                    {it.pitch && <p className="pitch">{it.pitch}</p>}
                    {it.benchmark && <div className="bench">📈 {it.benchmark}</div>}
                    <div className="card-meta">
                      {it.difficulty && <span className="pill">{diffLabel[it.difficulty]}</span>}
                      <span className="scorepill mono" title={t.score_label}>{t.score_label.replace("IdeaForge ", "").replace(" IdeaForge", "")} {sc}</span>
                    </div>
                    <div className="stats">
                      <div className="stat"><span className="k">{t.ticket}</span><span className="v">{it.budget}</span></div>
                      <div className="stat"><span className="k">{t.potential}</span><span className="v">{it.revenue}</span></div>
                      <div className="stat"><span className="k">{t.delai}</span><span className="v">{it.delai}</span></div>
                    </div>
                  </a>
                  <div className="card-foot">
                    <FavoriteButton ideaId={it.id} initial={favSet.has(it.id)} saveLabel={t.fav_save} savedLabel={t.fav_saved} />
                    <button type="button" className={"cmp-btn" + (cmp.includes(it.id) ? " on" : "")} onClick={() => toggleCmp(it.id)}>
                      {cmp.includes(it.id) ? "✓ " : "+ "}{t.cmp_add}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          {collapsed && <div className="catprev-fade" />}
        </div>
      )}

      {!active && filtered.length > PREVIEW && (
        <div className="catprev-more">
          <button className="btn primary" type="button" onClick={() => setShowAll((v) => !v)}>
            {showAll ? t.cat_see_less : t.cat_see_all.replace("{n}", String(filtered.length))}
          </button>
        </div>
      )}
    </>
  );
}
