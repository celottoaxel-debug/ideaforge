import type { Idea } from "@/lib/types";
import { scoreIdea } from "@/lib/score";

// Accueil clair (charte IdeaForge) : titre en deux temps, deux boutons, et la carte de la dernière idée du catalogue.
const L = {
  fr: { badge: "idées analysées et chiffrées", gift: "🎁 1 fiche complète offerte à l'inscription", budget: "Budget", revenue: "Revenus", delay: "Délai", score: "Score IdeaForge", nouveau: "🔥 Nouveau" },
  en: { badge: "ideas analyzed and costed", gift: "🎁 1 full sheet free when you sign up", budget: "Budget", revenue: "Revenue", delay: "Time", score: "IdeaForge Score", nouveau: "🔥 New" },
  es: { badge: "ideas analizadas y con cifras", gift: "🎁 1 ficha completa gratis al registrarte", budget: "Presupuesto", revenue: "Ingresos", delay: "Plazo", score: "Puntuación IdeaForge", nouveau: "🔥 Nuevo" },
};

export default function LightHero(props: {
  locale: "fr" | "en" | "es"; count: number; title: string; text: string; idea?: Idea;
  primary: { href: string; label: string }; secondary?: { href: string; label: string };
}) {
  const t = L[props.locale] ?? L.fr;
  const cut = props.title.indexOf(". ");
  const [h1a, h1b] = cut > 0 ? [props.title.slice(0, cut + 1), props.title.slice(cut + 2)] : [props.title, ""];
  const it = props.idea;
  const score = it ? scoreIdea(it).score : 0;
  const name = it ? it.title.split(/ [–-] /)[0] : "";
  const sub = it ? (it.title.includes(" – ") ? it.title.split(" – ").slice(1).join(" – ") : (it.pitch || "").split(". ")[0]) : "";
  return (
    <section className="lh" aria-label="IdeaForge">
      <div className="wrap lh-in">
        <div>
          <div className="lh-badge lh-up"><i aria-hidden="true" />{props.count} {t.badge}</div>
          <h1 className="lh-up d1">{h1a}{h1b && <span>{h1b}</span>}</h1>
          <p className="lh-p lh-up d2">{props.text}</p>
          <div className="lh-cta lh-up d3">
            <a className="btn primary lg" href={props.primary.href}>{props.primary.label} →</a>
            {props.secondary && <a className="btn lg" href={props.secondary.href}>{props.secondary.label}</a>}
          </div>
          <p className="lh-gift lh-up d4">{t.gift}</p>
        </div>
        {it && (
          <div className="lh-art lh-up d3">
            <div className="lh-trail" aria-hidden="true"><span style={{ width: 72, opacity: .9 }} /><span style={{ width: 48, opacity: .6 }} /><span style={{ width: 24, opacity: .35 }} /></div>
            <a className="lh-card" href={`/idea/${it.id}`}>
              <div className="lh-card-top">
                <span className="lh-sector">{it.sector}</span>
                <span className="lh-new">{t.nouveau}</span>
              </div>
              <h3>{name}</h3>
              {sub && <p>{(sub.charAt(0).toUpperCase() + sub.slice(1)).slice(0, 110)}{sub.length > 110 ? "…" : ""}</p>}
              <div className="lh-stats">
                <div><span className="k">{t.budget}</span><b>{it.budget}</b></div>
                <div className="g"><span className="k">{t.revenue}</span><b>{it.revenue}</b></div>
                <div><span className="k">{t.delay}</span><b>{(it.delai || "").split(" ").slice(0, 2).join(" ")}</b></div>
              </div>
              <div className="lh-score">
                <div className="lh-score-h"><span>{t.score}</span><span>{score}/100</span></div>
                <div className="lh-bar"><i style={{ width: `${score}%` }} /></div>
              </div>
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
