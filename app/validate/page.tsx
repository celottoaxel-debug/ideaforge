import { getLocale, dict } from "@/lib/i18n";
import LangSwitcher from "@/components/LangSwitcher";
import Validator from "@/components/Validator";
import { SITE, ldJson, breadcrumbLd, webPageLd } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Valider son idée de business gratuitement",
  description: "Colle ton idée de business ou de SaaS : score sur 100, preuves de demande en direct, stack technique, prompt de création et plan sur 30 jours.",
  alternates: { canonical: "/validate" },
};

export default function ValidatePage() {
  const locale = getLocale();
  const t = dict(locale);
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={ldJson({
        "@context": "https://schema.org", "@type": "WebApplication", name: "Validateur d'idées de business IdeaForge",
        url: `${SITE}/validate`, applicationCategory: "BusinessApplication", operatingSystem: "Web", inLanguage: "fr-FR",
        description: "Outil gratuit qui note une idée de business sur 100, montre des preuves de demande réelles, propose une stack technique, un prompt de création et un plan sur 30 jours.",
        offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
        publisher: { "@type": "Organization", name: "IdeaForge", url: SITE },
      })} />
      <script type="application/ld+json" dangerouslySetInnerHTML={ldJson(breadcrumbLd([{ name: "Accueil", url: SITE }, { name: "Valider une idée", url: `${SITE}/validate` }]))} />
      <script type="application/ld+json" dangerouslySetInnerHTML={ldJson(webPageLd({ name: "Valider son idée de business gratuitement", description: "Score, preuves de demande, stack et plan de 30 jours pour ton idée.", path: "/validate" }))} />
      <header className="nav"><div className="wrap nav-in">
        <a className="brand" href="/"><span className="mk">IF</span> IdeaForge</a>
        <a className="btn" href="/#catalogue">{t.nav_catalogue}</a>
        <a className="btn" href="/radar">{t.radar_nav}</a>
        <LangSwitcher current={locale} />
        <a className="btn dark" href="/">←</a>
      </div></header>

      <section className="hero" style={{ paddingBottom: 20 }}>
        <div className="wrap">
          <div className="stat">⚡ {t.val_nav}</div>
          <h1>{t.val_h}</h1>
          <p>{t.val_sub}</p>
        </div>
      </section>

      <section style={{ paddingTop: 10 }}>
        <div className="wrap" style={{ maxWidth: 760 }}>
          <Validator t={t} locale={locale} />
        </div>
      </section>

      <footer>
        <div className="wrap">
          <div className="brand"><span className="mk">IF</span> IdeaForge</div>
          <p style={{ marginTop: 12 }}>© 2026 IdeaForge · {t.foot_tag}</p>
        </div>
      </footer>
    </>
  );
}
