import { getLocale, dict, type Locale } from "@/lib/i18n";
import LangSwitcher from "@/components/LangSwitcher";

export const dynamic = "force-dynamic";
export const metadata = { title: "Radar" };

type L = Locale;
const SOURCES: { name: string; url: string; ic: string; desc: Record<L, string> }[] = [
  { name: "Product Hunt", url: "https://www.producthunt.com/", ic: "🚀", desc: { fr: "Les lancements de produits du jour.", en: "Today's product launches.", es: "Los lanzamientos del día." } },
  { name: "Y Combinator Launches", url: "https://www.ycombinator.com/launches", ic: "🟧", desc: { fr: "Les nouvelles startups YC en direct.", en: "New YC startups, live.", es: "Nuevas startups de YC, en directo." } },
  { name: "Hacker News — Show", url: "https://news.ycombinator.com/show", ic: "🧡", desc: { fr: "Ce que les devs lancent en ce moment.", en: "What devs are shipping right now.", es: "Lo que los devs lanzan ahora." } },
  { name: "Indie Hackers", url: "https://www.indiehackers.com/products", ic: "💡", desc: { fr: "Produits bootstrappés et leurs revenus.", en: "Bootstrapped products and their revenue.", es: "Productos bootstrapped y sus ingresos." } },
  { name: "Reddit r/SaaS", url: "https://www.reddit.com/r/SaaS/top/?t=week", ic: "💬", desc: { fr: "Les douleurs et débats SaaS de la semaine.", en: "This week's SaaS pains and debates.", es: "Dolores y debates SaaS de la semana." } },
  { name: "GitHub Trending", url: "https://github.com/trending", ic: "⭐", desc: { fr: "Les dépôts qui montent (signaux techniques).", en: "Rising repos (tech signals).", es: "Repos en alza (señales técnicas)." } },
  { name: "Google Trends", url: "https://trends.google.com/trends/trendingsearches/daily", ic: "📈", desc: { fr: "Les recherches en forte hausse.", en: "Fast-rising searches.", es: "Búsquedas en fuerte alza." } },
  { name: "Reddit r/startups", url: "https://www.reddit.com/r/startups/top/?t=week", ic: "🌱", desc: { fr: "Besoins et retours de fondateurs.", en: "Founder needs and feedback.", es: "Necesidades y feedback de fundadores." } },
];

export default function RadarPage() {
  const locale = getLocale();
  const t = dict(locale);
  return (
    <>
      <header className="nav"><div className="wrap nav-in">
        <a className="brand" href="/"><span className="mk">IF</span> IdeaForge</a>
        <a className="btn" href="/#catalogue">{t.nav_catalogue}</a>
        <LangSwitcher current={locale} />
        <a className="btn dark" href="/">← {t.idea_back.replace("← ", "")}</a>
      </div></header>

      <main className="wrap" style={{ paddingBlock: 40 }}>
        <div className="sec-head" style={{ margin: "0 0 28px" }}>
          <span className="eyebrow">{t.radar_nav}</span>
          <h1 style={{ fontSize: "clamp(28px,4.4vw,40px)" }}>{t.radar_h}</h1>
          <p style={{ color: "var(--ink-2)", marginTop: 12 }}>{t.radar_sub}</p>
        </div>

        <div className="niche-grid">
          {SOURCES.map((s) => (
            <a className="niche" key={s.name} href={s.url} target="_blank" rel="noopener noreferrer">
              <div className="niche-top"><span className="niche-ic" style={{ background: "var(--surface-2)" }}>{s.ic}</span></div>
              <h3>{s.name} <span style={{ color: "var(--ink-3)", fontWeight: 400 }}>↗</span></h3>
              <p>{s.desc[locale]}</p>
            </a>
          ))}
        </div>

        <div className="card" style={{ marginTop: 22, background: "var(--green-wash)", borderColor: "color-mix(in srgb, var(--green) 28%, var(--line))" }}>
          <p style={{ fontSize: 14.5, color: "var(--ink)" }}>🤖 {t.radar_auto}</p>
        </div>
      </main>
    </>
  );
}
