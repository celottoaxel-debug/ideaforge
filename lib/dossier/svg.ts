// Graphiques SVG générés côté serveur (aucune librairie). Couleurs via les variables CSS du site,
// donc compatibles mode clair / sombre. Fichier pur : aucun import.

export type LineSeries = { name: string; color: string; values: number[]; area?: boolean; dash?: boolean };

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function niceMax(v: number) {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / p;
  const m = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
  return m * p;
}

// Courbes (plusieurs séries) avec grille, axe des mois, valeurs finales et zone sous la courbe principale.
export function lineChart(o: {
  series: LineSeries[]; labels: string[]; fmt: (n: number) => string; height?: number; zeroLine?: boolean; marker?: { index: number; label: string };
}) {
  const W = 720, H = o.height ?? 280, L = 58, R = 92, T = 16, B = 30;
  const all = o.series.flatMap((s) => s.values);
  const ticks = 4;
  const hi = Math.max(0, ...all), lo = Math.min(0, ...all);
  const step = niceMax((hi - lo) / ticks || 1);
  const minV = Math.floor(lo / step) * step;
  const maxV = Math.max(minV + step * ticks, Math.ceil(hi / step) * step);
  const n = o.labels.length;
  const x = (i: number) => L + (i * (W - L - R)) / Math.max(1, n - 1);
  const y = (v: number) => T + ((maxV - v) * (H - T - B)) / (maxV - minV || 1);

  let g = "";
  for (let v = minV; v <= maxV + step / 2; v += step) {
    g += `<line x1="${L}" x2="${W - R}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}" style="stroke:var(--line);stroke-width:1"/>`;
    g += `<text x="${L - 8}" y="${(y(v) + 4).toFixed(1)}" text-anchor="end" style="fill:var(--ink-3);font:11px var(--mono)">${esc(o.fmt(v))}</text>`;
  }
  if (o.zeroLine && minV < 0) g += `<line x1="${L}" x2="${W - R}" y1="${y(0)}" y2="${y(0)}" style="stroke:var(--ink-3);stroke-width:1.2;stroke-dasharray:4 4"/>`;
  o.labels.forEach((lb, i) => {
    if (i % Math.ceil(n / 8) === 0 || i === n - 1)
      g += `<text x="${x(i).toFixed(1)}" y="${H - 8}" text-anchor="middle" style="fill:var(--ink-3);font:11px var(--mono)">${esc(lb)}</text>`;
  });
  if (o.marker) {
    const mx = x(o.marker.index);
    g += `<line x1="${mx}" x2="${mx}" y1="${T}" y2="${H - B}" style="stroke:var(--amber);stroke-width:1.2;stroke-dasharray:3 3"/>`;
    g += `<text x="${mx + 5}" y="${T + 12}" style="fill:var(--amber);font:600 11px var(--mono)">${esc(o.marker.label)}</text>`;
  }

  let paths = "";
  const ends: { y: number; s: LineSeries; v: number }[] = [];
  o.series.forEach((s) => {
    const pts = s.values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`);
    if (s.area) {
      paths += `<path d="M${x(0)},${y(Math.max(0, minV))} L${pts.join(" L")} L${x(s.values.length - 1)},${y(Math.max(0, minV))} Z" style="fill:${s.color};opacity:.10"/>`;
    }
    paths += `<polyline points="${pts.join(" ")}" style="fill:none;stroke:${s.color};stroke-width:${s.area ? 2.6 : 2};stroke-linejoin:round;stroke-linecap:round${s.dash ? ";stroke-dasharray:5 5" : ""}"/>`;
    const last = s.values[s.values.length - 1];
    ends.push({ y: y(last), s, v: last });
  });
  // Étiquettes de fin de courbe, écartées pour ne pas se chevaucher.
  ends.sort((a, b) => a.y - b.y);
  for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 26) ends[i].y = ends[i - 1].y + 26;
  let labels = "";
  ends.forEach((e) => {
    labels += `<circle cx="${x(n - 1)}" cy="${y(e.v)}" r="3.5" style="fill:${e.s.color}"/>`;
    labels += `<text x="${W - R + 8}" y="${e.y - 2}" style="fill:${e.s.color};font:600 12px var(--mono)">${esc(o.fmt(e.v))}</text>`;
    labels += `<text x="${W - R + 8}" y="${e.y + 11}" style="fill:var(--ink-3);font:10.5px var(--f)">${esc(e.s.name)}</text>`;
  });

  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" style="display:block;overflow:visible">${g}${paths}${labels}</svg>`;
}

// Barres horizontales (répartition d'un budget, canaux…).
export function barList(rows: { label: string; value: number; display: string; note?: string }[], color = "var(--green)") {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return `<div class="dz-bars">${rows
    .map(
      (r) => `<div class="dz-bar"><div class="dz-bar-top"><span>${esc(r.label)}</span><span class="mono">${esc(r.display)}</span></div>
<div class="dz-track"><i style="width:${((r.value / max) * 100).toFixed(1)}%;background:${color}"></i></div>${r.note ? `<div class="dz-bar-note">${esc(r.note)}</div>` : ""}</div>`
    )
    .join("")}</div>`;
}

// Entonnoir : une barre par étape, largeur proportionnelle (échelle racine pour garder la dernière lisible).
export function funnelChart(steps: { label: string; value: number; display: string; note?: string }[]) {
  const max = Math.max(1, ...steps.map((s) => s.value));
  const colors = ["color-mix(in srgb, var(--green) 30%, var(--green-wash))", "color-mix(in srgb, var(--green) 60%, var(--green-wash))", "var(--green)"];
  return `<div class="dz-funnel">${steps
    .map((s, i) => `<div class="dz-fstep"><div class="dz-fbar" style="width:${Math.max(14, Math.sqrt(s.value / max) * 100).toFixed(1)}%;background:${colors[i] ?? "var(--green)"}"><span class="mono">${esc(s.display)}</span></div>
<div class="dz-flabel"><b>${esc(s.label)}</b>${s.note ? ` · ${esc(s.note)}` : ""}</div></div>`)
    .join("")}</div>`;
}

// Matrice des risques (probabilité × impact).
export function riskMatrix(items: { label: string; prob: number; impact: number }[]) {
  const W = 720, H = 300, L = 110, B = 40, cw = (W - L - 10) / 3, ch = (H - B - 10) / 3;
  let out = "";
  const heat = (p: number, i: number) => {
    const s = p + i;
    return s >= 5 ? "color-mix(in srgb, #e5484d 22%, var(--surface))" : s >= 4 ? "color-mix(in srgb, var(--amber) 22%, var(--surface))" : "var(--green-wash)";
  };
  for (let p = 1; p <= 3; p++)
    for (let i = 1; i <= 3; i++)
      out += `<rect x="${L + (i - 1) * cw + 2}" y="${10 + (3 - p) * ch + 2}" width="${cw - 4}" height="${ch - 4}" rx="10" style="fill:${heat(p, i)}"/>`;
  ["Faible", "Moyen", "Fort"].forEach((t, k) => {
    out += `<text x="${L + k * cw + cw / 2}" y="${H - 14}" text-anchor="middle" style="fill:var(--ink-3);font:11px var(--mono)">${t}</text>`;
    out += `<text x="${L - 10}" y="${10 + (2 - k) * ch + ch / 2 + 4}" text-anchor="end" style="fill:var(--ink-3);font:11px var(--mono)">${t}</text>`;
  });
  out += `<text x="${L + (W - L) / 2}" y="${H}" text-anchor="middle" style="fill:var(--ink-2);font:600 11px var(--mono)">IMPACT →</text>`;
  out += `<text x="20" y="${10 + (H - B) / 2}" transform="rotate(-90 20 ${10 + (H - B) / 2})" text-anchor="middle" style="fill:var(--ink-2);font:600 11px var(--mono)">PROBABILITÉ →</text>`;
  const seen: Record<string, number> = {};
  items.forEach((r, idx) => {
    const key = `${r.prob}-${r.impact}`;
    const k = (seen[key] = (seen[key] ?? -1) + 1);
    const cx = L + (r.impact - 1) * cw + cw / 2 + (k % 2 ? 26 : -26) * (k ? 1 : 0);
    const cy = 10 + (3 - r.prob) * ch + ch / 2 + (k > 1 ? 22 : 0);
    out += `<circle cx="${cx}" cy="${cy}" r="15" style="fill:var(--forest)"/><text x="${cx}" y="${cy + 5}" text-anchor="middle" style="fill:#fff;font:700 13px var(--mono)">${idx + 1}</text>`;
  });
  return `<svg viewBox="0 0 ${W} ${H + 4}" width="100%" role="img" style="display:block">${out}</svg>`;
}
