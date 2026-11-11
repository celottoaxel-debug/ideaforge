import type { Idea } from "@/lib/types";
import { ideaFacts } from "@/lib/seo";
import { scoreIdea } from "@/lib/score";

// Carte d'idée chiffrée, utilisée sur les pages thématiques et « idées similaires ».
export default function IdeaRow({ it, showSector = true }: { it: Idea; showSector?: boolean }) {
  const f = ideaFacts(it);
  return (
    <a className="irow" href={`/idea/${it.id}`}>
      <div className="irow-main">
        {showSector && <span className="sector">{it.sector}</span>}
        <h3>{it.title}</h3>
        {it.pitch && <p>{it.pitch}</p>}
      </div>
      <div className="irow-stats">
        <span><b className="mono">{f.budget}</b><i>mise de départ</i></span>
        <span><b className="mono">{f.mrr12Txt}</b><i>CA mensuel, an 1*</i></span>
        <span><b className="mono">{scoreIdea(it).score}/100</b><i>score</i></span>
      </div>
    </a>
  );
}
