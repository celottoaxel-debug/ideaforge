import { getLocale, dict } from "@/lib/i18n";
import LangSwitcher from "@/components/LangSwitcher";
import Validator from "@/components/Validator";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Valide ton idée",
  description: "Colle ton idée de business ou de SaaS : score, preuves de demande en direct, stack, prompt de création et plan 30 jours — instantané.",
};

export default function ValidatePage() {
  const locale = getLocale();
  const t = dict(locale);
  return (
    <>
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
          <Validator t={t} />
        </div>
      </section>

      <footer>
        <div className="wrap">
          <div className="brand"><span className="mk">IF</span> IdeaForge</div>
          <p style={{ marginTop: 12 }}>© 2026 IdeaForge — {t.foot_tag}</p>
        </div>
      </footer>
    </>
  );
}
