import type { Idea } from "@/lib/types";

type D = Record<string, string>;

// Construit un mot-clé de recherche à partir du titre + 1er tag (sans mots vides).
function keywords(it: Idea): string {
  const stop = /\b(pour|par|de|des|du|la|le|les|un|une|en|aux|et|the|for|and|con|para|los|las|&)\b/gi;
  const base = `${it.title} ${it.tags?.[0] ?? ""}`.replace(stop, " ").replace(/[—•·]/g, " ").replace(/\s+/g, " ").trim();
  return base || it.title;
}

export default function ProofPanel({ it, t }: { it: Idea; t: D }) {
  const q = encodeURIComponent(keywords(it));
  const links = [
    { h: t.src_reddit, ic: "💬", u: `https://www.reddit.com/search/?q=${q}` },
    { h: t.src_trends, ic: "📈", u: `https://trends.google.com/trends/explore?q=${q}` },
    { h: t.src_ph, ic: "🚀", u: `https://www.producthunt.com/search?q=${q}` },
    { h: t.src_competitors, ic: "🏷️", u: `https://www.g2.com/search?query=${q}` },
    { h: t.src_jobs, ic: "💼", u: `https://www.linkedin.com/jobs/search/?keywords=${q}` },
    { h: t.src_google, ic: "🔎", u: `https://www.google.com/search?q=${q}` },
  ];
  return (
    <div className="proof">
      {links.map((l) => (
        <a className="proof-item" key={l.h} href={l.u} target="_blank" rel="noopener noreferrer">
          <span className="proof-ic">{l.ic}</span>
          <span className="proof-h">{l.h}</span>
          <span className="proof-arr">↗</span>
        </a>
      ))}
    </div>
  );
}
