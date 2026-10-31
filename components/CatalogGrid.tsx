"use client";

import { useState } from "react";
import type { Idea } from "@/lib/types";
import FavoriteButton from "@/components/FavoriteButton";

type Labels = {
  ticket: string; potential: string; delai: string;
  d1: string; d2: string; d3: string;
  save: string; saved: string; seeAll: string; seeLess: string;
};

const PREVIEW = 9;

export default function CatalogGrid({ ideas, favIds, labels }: { ideas: Idea[]; favIds: string[]; labels: Labels }) {
  const [showAll, setShowAll] = useState(false);
  const favSet = new Set(favIds);
  const diff: Record<number, string> = { 1: labels.d1, 2: labels.d2, 3: labels.d3 };
  const collapsed = !showAll && ideas.length > PREVIEW;
  const shown = collapsed ? ideas.slice(0, PREVIEW) : ideas;

  return (
    <>
      <div className={"catprev" + (collapsed ? " faded" : "")}>
        <div className="grid">
          {shown.map((it) => (
            <div className="card" key={it.id}>
              <a href={`/idea/${it.id}`} className="card-link">
                <span className="sector">{it.sector}</span>
                <h3>{it.title}</h3>
                {it.pitch && <p className="pitch">{it.pitch}</p>}
                {it.benchmark && <div className="bench">📈 {it.benchmark}</div>}
                {it.difficulty && <span className="pill">{diff[it.difficulty]}</span>}
                <div className="stats">
                  <div className="stat"><span className="k">{labels.ticket}</span><span className="v">{it.budget}</span></div>
                  <div className="stat"><span className="k">{labels.potential}</span><span className="v">{it.revenue}</span></div>
                  <div className="stat"><span className="k">{labels.delai}</span><span className="v">{it.delai}</span></div>
                </div>
              </a>
              <FavoriteButton ideaId={it.id} initial={favSet.has(it.id)} saveLabel={labels.save} savedLabel={labels.saved} />
            </div>
          ))}
        </div>
        {collapsed && <div className="catprev-fade" />}
      </div>
      {ideas.length > PREVIEW && (
        <div className="catprev-more">
          <button className="btn primary" type="button" onClick={() => setShowAll((v) => !v)}>
            {showAll ? labels.seeLess : labels.seeAll.replace("{n}", String(ideas.length))}
          </button>
        </div>
      )}
    </>
  );
}
