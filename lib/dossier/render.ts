// Rendu HTML du dossier complet d'une idée (le même code sert au site et aux aperçus).
// Tout le texte vient de nos données (lib/dossier/data) et est échappé.
import {
  type Dossier, type IdeaLike, arpu, scenarios, unitEconomics, firstMonth, funnel, budgetSplit, sensitivity, budgetOf, eur, eurK, int,
} from "./engine";
import { lineChart, barList, funnelChart, riskMatrix } from "./svg";

const esc = (s: unknown) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const SC = {
  prudent: { name: "Prudent", color: "var(--ink-3)" },
  realiste: { name: "Réaliste", color: "var(--green)" },
  ambitieux: { name: "Ambitieux", color: "var(--forest-2)" },
};

const sec = (n: number, title: string, sub: string, body: string) =>
  `<section class="dz-sec"><div class="dz-head"><span class="dz-num mono">${String(n).padStart(2, "0")}</span><div><h2>${esc(title)}</h2>${sub ? `<p>${sub}</p>` : ""}</div></div>${body}</section>`;

const table = (head: string[], rows: string[][], opts: { num?: number[]; hi?: number } = {}) =>
  `<div class="dz-tablewrap"><table class="dz-table"><thead><tr>${head.map((h, i) => `<th${opts.num?.includes(i) ? ' class="n"' : ""}>${esc(h)}</th>`).join("")}</tr></thead><tbody>${rows
    .map((r, ri) => `<tr${opts.hi === ri ? ' class="hi"' : ""}>${r.map((c, i) => `<td${opts.num?.includes(i) ? ' class="n mono"' : ""}>${c}</td>`).join("")}</tr>`)
    .join("")}</tbody></table></div>`;

const kpi = (k: string, v: string, note = "", tone = "") =>
  `<div class="dz-kpi ${tone}"><span class="k">${esc(k)}</span><span class="v mono">${esc(v)}</span>${note ? `<span class="n">${esc(note)}</span>` : ""}</div>`;

const months = Array.from({ length: 24 }, (_, i) => `M${i + 1}`);
const lvl = (n: number) => ["", "Faible", "Moyen", "Fort"][n] ?? "—";

export function renderDossier(it: IdeaLike, d: Dossier, opts: { member: boolean; generic?: boolean }) {
  const sc = scenarios(d, it);
  const real = sc[1];
  const ue = unitEconomics(d);
  const a = arpu(d);
  const be = firstMonth(real.profit, (v) => v >= 0);
  const payback = firstMonth(real.cash, (v) => v >= 0);
  const budget = budgetOf(it);
  const unit = d.unit ?? (d.kind === "saas" ? "/mois" : "/prestation");
  const ratioTone = ue.ltvCac >= 3 ? "good" : ue.ltvCac >= 1.5 ? "mid" : "bad";
  let n = 0;

  // ---------- 01. En un coup d'œil (visible par tous) ----------
  const glance = sec(++n, "Le dossier en un coup d'œil", "Les chiffres clés du scénario réaliste, calculés à partir des hypothèses de la section « Méthode ».",
    `<div class="dz-kpis">
${kpi("Revenu moyen / client", `${eur(a)}${d.kind === "saas" ? "/mois" : "/mois"}`, d.kind === "saas" ? "mix des 3 offres" : `${(d.freq ?? 1).toLocaleString("fr-FR")} achat(s) / mois`)}
${kpi("Clients actifs à 12 mois", int(real.active[11]), `${int(sc[0].active[11])} à ${int(sc[2].active[11])} selon le scénario`)}
${kpi("Revenu mensuel à 12 mois", eurK(real.mrr[11]), `${eurK(real.mrr[23])} à 24 mois`, "hot")}
${kpi("Rentable chaque mois dès", be ? `Mois ${be}` : "> 24 mois", "résultat mensuel ≥ 0")}
${kpi("Mise de départ remboursée", payback ? `Mois ${payback}` : "> 24 mois", `budget de départ ${eurK(budget)}`)}
${kpi("LTV / CAC", `${ue.ltvCac.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} ×`, ue.ltvCac >= 3 ? "sain (objectif ≥ 3)" : "à améliorer (objectif ≥ 3)", ratioTone)}
</div>`);

  // ---------- 02. Projection (visible par tous) ----------
  const proj = sec(++n, "Projection du revenu mensuel sur 24 mois", "Trois scénarios d'acquisition : prudent (moitié du réaliste), réaliste, ambitieux (double).",
    `<div class="dz-chart">${lineChart({
      series: [
        { name: SC.prudent.name, color: SC.prudent.color, values: sc[0].mrr, dash: true },
        { name: SC.ambitieux.name, color: SC.ambitieux.color, values: sc[2].mrr },
        { name: SC.realiste.name, color: SC.realiste.color, values: real.mrr, area: true },
      ],
      labels: months, fmt: eurK,
    })}</div>
${table(["Scénario", "M3", "M6", "M12", "M18", "M24", "Clients M24"],
      sc.map((s) => [`<span class="dz-dot" style="background:${SC[s.key].color}"></span>${SC[s.key].name}`, ...[2, 5, 11, 17, 23].map((i) => eurK(s.mrr[i])), int(s.active[23])]),
      { num: [1, 2, 3, 4, 5, 6], hi: 1 })}`);

  if (!opts.member) {
    const locked = ["Chiffres clés du marché", "Client idéal & exemple concret", "Offres & grille tarifaire", "Trésorerie & point mort", "Unit economics (LTV, CAC, payback)", "Tableau de sensibilité prix × churn", "Entonnoir de conversion", "Canaux d'acquisition", "Budget de lancement détaillé", "Analyse concurrentielle", "Matrice des risques", "Feuille de route 12 semaines", "Hypothèses & méthode"];
    return `<div class="dz">${glance}${proj}<div class="dz-locked"><div class="dz-locked-h">🔒 ${locked.length} sections réservées aux membres</div><ol>${locked.map((l) => `<li>${esc(l)}</li>`).join("")}</ol></div></div>`;
  }

  // ---------- 03. Marché ----------
  const market = d.facts.length
    ? sec(++n, "Chiffres clés du marché", "Ordres de grandeur publics et estimations IdeaForge, à vérifier avant d'investir.",
      `<div class="dz-facts">${d.facts.map(([v, l]) => `<div class="dz-fact"><span class="v">${esc(v)}</span><span class="l">${esc(l)}</span></div>`).join("")}</div>`)
    : "";

  // ---------- 04. Client & exemple ----------
  const client = d.persona
    ? sec(++n, "Client idéal & exemple concret", "",
      `<div class="dz-two"><div class="dz-box"><span class="k">Pour qui</span><p>${esc(d.persona)}</p></div><div class="dz-box"><span class="k">Le problème qu'il paie pour régler</span><p>${esc(d.pain)}</p></div></div>
<blockquote class="dz-example"><span class="k">Exemple concret</span>${esc(d.example)}</blockquote>`)
    : "";

  // ---------- 05. Offres ----------
  const mix = d.mix ?? [60, 30, 10];
  const offers = sec(++n, "Offres & grille tarifaire", `Prix conseillés et répartition attendue des clients. Revenu moyen pondéré : <b>${eur(a)}/mois</b> par client.`,
    table(["Offre", "Prix", "Ce qui est inclus", "Part des clients"],
      d.tiers.map((t, i) => [`<b>${esc(t[0])}</b>`, `${eur(t[1])}${esc(unit)}`, esc(t[2]), `${mix[i] ?? 0} %`]),
      { num: [1, 3], hi: 1 }));

  // ---------- 06. Trésorerie ----------
  const cash = sec(++n, "Trésorerie cumulée & point mort", `On part de −${eurK(budget)} (budget de départ). Chaque mois : marge brute − coûts fixes (${eur(d.fixed)}) − acquisition des nouveaux clients.`,
    `<div class="dz-chart">${lineChart({
      series: [
        { name: SC.prudent.name, color: SC.prudent.color, values: sc[0].cash, dash: true },
        { name: SC.realiste.name, color: SC.realiste.color, values: real.cash, area: true },
      ],
      labels: months, fmt: eurK, zeroLine: true,
      marker: payback ? { index: payback - 1, label: `Remboursé M${payback}` } : undefined,
    })}</div>
${table(["Mois", "Clients", "Nouveaux clients", "Revenu", "Résultat du mois", "Trésorerie cumulée"],
      [0, 2, 5, 8, 11, 17, 23].map((i) => [`M${i + 1}`, int(real.active[i]), int(real.news[i]), eurK(real.mrr[i]),
        `<span class="${real.profit[i] >= 0 ? "pos" : "neg"}">${eurK(real.profit[i])}</span>`, `<span class="${real.cash[i] >= 0 ? "pos" : "neg"}">${eurK(real.cash[i])}</span>`]),
      { num: [1, 2, 3, 4, 5] })}`);

  // ---------- 07. Unit economics ----------
  const ueTable = sec(++n, "Unit economics", "Ce que rapporte et coûte un client sur toute sa durée de vie.",
    table(["Indicateur", "Valeur", "Lecture"], [
      ["Revenu moyen par client (ARPU)", `${eur(a)}/mois`, "Mix des offres × prix"],
      ["Marge brute", `${d.margin} %`, d.kind === "saas" ? "Après hébergement, IA et frais de paiement" : "Après matières, consommables et main-d'œuvre directe"],
      ["Coût d'acquisition (CAC)", eur(d.cac), "Marketing + temps de vente par client signé"],
      ["Clients perdus / mois (churn)", `${d.churn.toLocaleString("fr-FR")} %`, `Durée de vie moyenne ≈ ${int(ue.lifetimeMonths)} mois`],
      ["Valeur vie client (LTV)", eur(ue.ltv), "ARPU × marge × durée de vie"],
      ["Ratio LTV / CAC", `<span class="${ratioTone === "good" ? "pos" : ratioTone === "bad" ? "neg" : ""}">${ue.ltvCac.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} ×</span>`, "≥ 3 = acquisition rentable"],
      ["Retour sur CAC (payback)", `${ue.payback.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} mois`, "≤ 12 mois = sain"],
    ], { num: [1] }));

  // ---------- 08. Sensibilité ----------
  const sens = sensitivity(d);
  const sensSec = sec(++n, "Sensibilité : prix × churn", "Revenu mensuel au mois 12 selon le prix pratiqué et la fidélité des clients (même acquisition que le scénario réaliste).",
    table(["Prix \\ Churn", ...sens.churns.map((c) => `${(d.churn * c).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %/mois`)],
      sens.prices.map((p, i) => [`<b>${p === 1 ? "Prix conseillé" : p < 1 ? "−20 %" : "+20 %"}</b>`, ...sens.grid[i].map((v, j) => (i === 1 && j === 1 ? `<b>${eurK(v)}</b>` : eurK(v)))]),
      { num: [1, 2, 3], hi: 1 }));

  // ---------- 09. Entonnoir ----------
  const f = funnel(d, 10_000);
  const fun = sec(++n, "Entonnoir : atteindre 10 k€ de revenu mensuel", `Il faut ${int(f.customers)} clients actifs. Taux de conversion types du secteur, en remontant l'entonnoir.`,
    `<div class="dz-chart">${funnelChart(f.steps.map((s) => ({ label: s.label, note: s.rate ? `${(s.rate * 100).toLocaleString("fr-FR")} % passent à l'étape suivante` : "objectif", value: s.value, display: int(s.value) })))}</div>`);

  // ---------- 10. Canaux ----------
  const ch = sec(++n, "Canaux d'acquisition", "Répartition visée des nouveaux clients et façon de les activer.",
    barList(d.channels.map(([label, share, how]) => ({ label, value: share, display: `${share} %`, note: how }))));

  // ---------- 11. Budget ----------
  const split = budgetSplit(d, it);
  const bud = sec(++n, "Budget de lancement détaillé", `Répartition type de ${eurK(budget)} de mise de départ.`,
    barList(split.map(([label, v]) => ({ label, value: v, display: eur(v) })), "var(--forest-2)"));

  // ---------- 12. Concurrence ----------
  const comp = d.comps.length
    ? sec(++n, "Analyse concurrentielle", "Prix publics indicatifs relevés par IdeaForge : ils évoluent, vérifie-les avant de fixer les tiens.",
      table(["Acteur", "Prix", "Point fort", "Faille à exploiter"], d.comps.map((c) => [`<b>${esc(c[0])}</b>`, esc(c[1]), esc(c[2]), esc(c[3])])))
    : "";

  // ---------- 13. Risques ----------
  const risks = (it.risks ?? []).map((r, i) => ({ label: r, prob: d.risks?.[i]?.[0] ?? 2, impact: d.risks?.[i]?.[1] ?? 2 }));
  const riskSec = risks.length
    ? sec(++n, "Matrice des risques", "Probabilité et impact de chaque risque identifié.",
      `<div class="dz-chart narrow">${riskMatrix(risks)}</div>${table(["#", "Risque", "Probabilité", "Impact"], risks.map((r, i) => [`<b>${i + 1}</b>`, esc(r.label), lvl(r.prob), lvl(r.impact)]))}`)
    : "";

  // ---------- 14. Feuille de route ----------
  const steps = it.steps ?? [];
  const weeks = ["S1–S2", "S3–S4", "S5–S7", "S8–S10", "S11–S12", "S13+"];
  const road = steps.length
    ? sec(++n, "Feuille de route 12 semaines", "Les étapes clés, dans l'ordre.",
      `<ol class="dz-road">${steps.slice(0, 6).map((s, i) => `<li><span class="w mono">${weeks[i]}</span><span>${esc(s)}</span></li>`).join("")}</ol>`)
    : "";

  // ---------- 15. Méthode ----------
  const method = sec(++n, "Hypothèses & méthode", "",
    `<ul class="dz-method">
<li>Acquisition en rampe sur 3 mois, puis +5 %/mois (bouche-à-oreille), calibrée pour atteindre <b>${int(d.target)} clients actifs au mois 12</b> dans le scénario réaliste.</li>
<li>Churn de ${d.churn.toLocaleString("fr-FR")} %/mois, marge brute de ${d.margin} %, CAC de ${eur(d.cac)}, coûts fixes de ${eur(d.fixed)}/mois.</li>
<li>Répartition des clients entre les offres : ${mix.join(" / ")} %.</li>
<li>Ce sont des <b>projections</b>, pas des promesses : elles servent à comparer les idées et à décider où tester en premier. Remplace nos hypothèses par tes vrais chiffres dès tes premiers clients.</li>
${opts.generic ? "<li>Cette idée a été découverte récemment : ses hypothèses sont déduites automatiquement de la fiche, le dossier détaillé arrive bientôt.</li>" : ""}
</ul>`);

  return `<div class="dz">${glance}${proj}${market}${client}${offers}${cash}${ueTable}${sensSec}${fun}${ch}${bud}${comp}${riskSec}${road}${method}</div>`;
}
