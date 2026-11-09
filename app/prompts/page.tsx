import { getPlan, isMember } from "@/lib/plan";
import { PROMPTS_PACK, PACK_COUNT } from "@/lib/prompts-pack";
import CopyPrompt from "@/components/CopyPrompt";
import CheckoutButton from "@/components/CheckoutButton";
import { LegalFooter } from "@/components/LegalPage";
import { getLocale, dict } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "50 prompts IA pour lancer ton business (ChatGPT, Claude)",
  description: "50 prompts prêts à coller dans ChatGPT ou Claude, de l'idée au lancement : validation, MVP avec l'IA, landing page, acquisition, vente et pilotage.",
  alternates: { canonical: "/prompts" },
};

export default async function PromptsPage() {
  const member = isMember(await getPlan());
  const t = dict(getLocale());
  const sample = PROMPTS_PACK[0].prompts[0];

  return (
    <>
      <header className="nav"><div className="wrap nav-in">
        <a className="brand" href="/"><span className="mk">IF</span> IdeaForge</a>
        <a className="btn" href="/#catalogue">{t.nav_catalogue}</a>
        <a className="btn dark" href="/">←</a>
      </div></header>

      <main className="wrap pack">
        <span className="sector">🎁 Bonus de l’accès à vie</span>
        <h1>Le pack de {PACK_COUNT} prompts</h1>
        <p className="pack-lede">De l’idée au lancement, des prompts prêts à coller dans Claude, ChatGPT, Lovable ou Bolt. Remplace simplement les passages entre [crochets] par tes informations.</p>

        <nav className="pack-toc">
          {PROMPTS_PACK.map((s) => (
            <a key={s.id} href={member ? `#${s.id}` : "#acces"}>{s.emoji} {s.title} <span className="mono">{s.prompts.length}</span></a>
          ))}
        </nav>

        {member ? (
          PROMPTS_PACK.map((s) => (
            <section key={s.id} id={s.id} className="pack-sec">
              <h2>{s.emoji} {s.title}</h2>
              <p className="pack-intro">{s.intro}</p>
              {s.prompts.map((p, i) => (
                <article key={p.id} className="pack-card">
                  <div className="pack-card-h">
                    <span className="mono pack-n">{p.id.replace("p", "#")}</span>
                    <div><h3>{p.title}</h3><span className="pack-when">Quand : {p.when}</span></div>
                  </div>
                  <pre className="prompt-pre">{p.prompt}</pre>
                  <CopyPrompt text={p.prompt} />
                </article>
              ))}
            </section>
          ))
        ) : (
          <>
            <section className="pack-sec">
              <h2>Exemple : {sample.title}</h2>
              <article className="pack-card">
                <pre className="prompt-pre">{sample.prompt}</pre>
                <CopyPrompt text={sample.prompt} />
              </article>
            </section>
            <div id="acces" className="gate-lock" style={{ marginTop: 26 }}>
              <div style={{ fontSize: 26 }}>🔒</div>
              <h3>Les {PACK_COUNT - 1} autres prompts sont inclus dans l’accès à vie</h3>
              <p style={{ color: "var(--ink-2)", maxWidth: "46ch", margin: "0 auto" }}>Avec toutes les fiches, les dossiers chiffrés et la génération d’idées par IA, pour 129 € une seule fois.</p>
              <div style={{ maxWidth: 320, margin: "10px auto 0" }}>
                <CheckoutButton plan="lifetime" label={t.p_l_cta} redirecting={t.redirecting} unavailable={t.pay_unavailable} />
              </div>
            </div>
          </>
        )}
      </main>
      <LegalFooter />
    </>
  );
}
