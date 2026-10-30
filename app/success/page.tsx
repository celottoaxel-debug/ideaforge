import { getLocale, dict } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default function SuccessPage() {
  const t = dict(getLocale());
  return (
    <main className="auth-wrap">
      <div className="auth-card">
        <div className="brand"><span className="mk">IF</span> IdeaForge</div>
        <h1>{t.success_title}</h1>
        <p className="sub">{t.success_sub}</p>
        <a className="prov primary" href="/">{t.success_cta}</a>
      </div>
    </main>
  );
}
