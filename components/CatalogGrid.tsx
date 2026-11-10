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

export default function CatalogGrid({ ideas, favIds, t }: { ideas: Idea[]; favIds: string[]; t: D }) {
  const [q, setQ] = useState("");
  const [sector, setSector] = useState("");
  const [diffF, setDiffF] = useState(0);
  const [sort, setSort] = useState<"feat" | "score" | "ticket">("feat");
  const [showAll, setShowAll] = useState(false);
  const [cmp, setCmp] = useState<string[]>([]);

  const favSet = new Set(favIds);
  const diffLabel: Record<number, string> = { 1: t.diff1, 2: t.diff2, 3: t.diff3 };
  const scores = useMemo(() => Object.fromEntries(ideas.map((i) => [i.id, scoreIdea(i).score])), [ideas]);
  const sectors = useMemo(() => Array.from(new Set(ideas.map((i) => i.sector))).sort(), [ideas]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let list = ideas.filter((i) => {
      if (sector && i.sector !== sector) return false;
      if (diffF && i.difficulty !== diffF) return false;
      if (needle) {
        const hay = (i.title + " " + i.sector + " " + (i.pitch || "") + " " + (i.tags || []).join(" ") + " " + (i.benchmark || "")).toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
    list = [...list].sort((a, b) => {
      if (sort === "score") return scores[b.id] - scores[a.id];
      if (sort === "ticket") return (a.budget_min || 0) - (b.budget_min || 0);
      const na = isNewIdea(a), nb = isNewIdea(b);
      if (na || nb) return na && nb ? new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime() : na ? -1 : 1;
      return (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || scores[b.id] - scores[a.id];
    });
    return list;
  }, [ideas, q, sector, diffF, sort, scores]);

  const active = q || sector || diffF;
  const collapsed = !showAll && !active && filtered.length > PREVIEW;
  const shown = collapsed ? filtered.slice(0, PREVIEW) : filtered;
  const cmpIdeas = cmp.map((id) => ideas.find((i) => i.id === id)).filter(Boolean) as Idea[];

  function toggleCmp(id: string) {
    setCmp((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= 3 ? prev : [...prev, id]));
  }

  return (
    <>
      <div className="cat-controls">
        <input className="cat-search" type="search" placeholder={t.search_ph} value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={sector} onChange={(e) => setSector(e.target.value)}>
          <option value="">{t.f_all}</option>
          {sectors.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={diffF} onChange={(e) => setDiffF(+e.target.value)}>
          <option value={0}>{t.f_all}</option>
          <option value={1}>{t.diff1}</option>
          <option value={2}>{t.diff2}</option>
          <option value={3}>{t.diff3}</option>
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as "feat" | "score" | "ticket")}>
          <option value="feat">{t.sort_feat}</option>
          <option value="score">{t.sort_score}</option>
          <option value="ticket">{t.sort_ticket}</option>
        </select>
      </div>

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
            {shown.map((it) => {
              const sc = scores[it.id];
              return (
                <div className={"card" + (isNewIdea(it) ? " is-new" : "")} key={it.id}>
                  {isNewIdea(it) && <span className="new-flag">🔥 {t.badge_novelty}</span>}
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
