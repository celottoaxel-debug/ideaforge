// Rendu Markdown → HTML minimal et sûr (aucune dépendance) pour les articles du blog.
// Gère : titres, paragraphes, listes, citations, tableaux, code, gras/italique, liens, séparateurs.
// Tout le texte est échappé avant la mise en forme : aucun HTML brut n'est accepté.

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

function inline(src: string) {
  let s = esc(src);
  s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
  // Liens : uniquement http(s), relatifs (/...) ou ancres. Les liens externes s'ouvrent en nouvel onglet.
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, text: string, href: string) => {
    const h = href.replace(/&amp;/g, "&");
    if (!/^(https?:\/\/|\/|#)/.test(h)) return text;
    const ext = /^https?:\/\//.test(h) && !/ideaforges\.io/.test(h);
    return `<a href="${esc(h)}"${ext ? ' target="_blank" rel="noopener nofollow"' : ""}>${text}</a>`;
  });
  s = s.replace(/\[à vérifier\]/gi, '<mark class="to-check">[à vérifier]</mark>');
  return s;
}

export type Heading = { id: string; text: string; level: number };

export function renderMarkdown(md: string): { html: string; headings: Heading[] } {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  const headings: Heading[] = [];
  const used = new Set<string>();
  let i = 0;

  const para: string[] = [];
  const flush = () => { if (para.length) { out.push(`<p>${inline(para.join(" "))}</p>`); para.length = 0; } };

  while (i < lines.length) {
    const line = lines[i];
    const t = line.trim();

    if (!t) { flush(); i++; continue; }

    if (t.startsWith("```")) {
      flush();
      const code: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) code.push(lines[i++]);
      i++;
      out.push(`<pre><code>${esc(code.join("\n"))}</code></pre>`);
      continue;
    }

    const h = t.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      flush();
      const level = Math.max(2, h[1].length); // le H1 est le titre de l'article
      const text = h[2].replace(/\s+#+$/, "");
      let id = slugify(text) || `section-${headings.length + 1}`;
      while (used.has(id)) id += "-2";
      used.add(id);
      if (level <= 3) headings.push({ id, text, level });
      out.push(`<h${level} id="${id}">${inline(text)}</h${level}>`);
      i++;
      continue;
    }

    if (/^(-{3,}|\*{3,})$/.test(t)) { flush(); out.push("<hr/>"); i++; continue; }

    if (t.startsWith(">")) {
      flush();
      const q: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) q.push(lines[i++].trim().replace(/^>\s?/, ""));
      out.push(`<blockquote>${inline(q.join(" "))}</blockquote>`);
      continue;
    }

    if (/^[-*+]\s+/.test(t) || /^\d+[.)]\s+/.test(t)) {
      flush();
      const ordered = /^\d+[.)]\s+/.test(t);
      const items: string[] = [];
      while (i < lines.length && (ordered ? /^\d+[.)]\s+/ : /^[-*+]\s+/).test(lines[i].trim())) {
        items.push(lines[i].trim().replace(ordered ? /^\d+[.)]\s+/ : /^[-*+]\s+/, ""));
        i++;
      }
      out.push(`<${ordered ? "ol" : "ul"}>${items.map((x) => `<li>${inline(x)}</li>`).join("")}</${ordered ? "ol" : "ul"}>`);
      continue;
    }

    if (t.startsWith("|") && i + 1 < lines.length && /^\|?\s*:?-{2,}/.test(lines[i + 1].trim())) {
      flush();
      const cells = (row: string) => row.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
      const head = cells(t);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) rows.push(cells(lines[i++]));
      out.push(`<div class="post-table"><table><thead><tr>${head.map((c) => `<th>${inline(c)}</th>`).join("")}</tr></thead><tbody>${rows
        .map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`)
        .join("")}</tbody></table></div>`);
      continue;
    }

    para.push(t);
    i++;
  }
  flush();
  return { html: out.join("\n"), headings };
}

export function readingTime(md: string) {
  return Math.max(1, Math.round(md.split(/\s+/).filter(Boolean).length / 220));
}
