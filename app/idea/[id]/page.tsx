import { createClient } from "@/lib/supabase/server";
import { getPlan, isMember } from "@/lib/plan";
import { getLocale, dict } from "@/lib/i18n";
import { IDEAS } from "@/lib/ideas";
import type { Idea } from "@/lib/types";
import { buildPrompt } from "@/lib/prompt";
import { scoreIdea, buildStack } from "@/lib/score";
import { getDossier, renderDossier } from "@/lib/dossier";
import { findIdea, ideaFaq, ideaFacts, allIdeas, ldJson, breadcrumbLd, faqLd, SITE, fitTitle, shortName, clip, originalIdeaId } from "@/lib/seo";
import { collectionsOf } from "@/lib/collections";
import IdeaRow from "@/components/IdeaRow";
import CheckoutButton from "@/components/CheckoutButton";
import ProofPanel from "@/components/ProofPanel";
import PromptBox from "@/components/PromptBox";
import Checklist from "@/components/Checklist";
import RevenueCalc from "@/components/RevenueCalc";
import LangSwitcher from "@/components/LangSwitcher";
import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const it = await findIdea(params.id);
  if (!it) return { title: "Idée introuvable", robots: { index: false } };
  const f = ideaFacts(it);
  const name = shortName(it.title);
  // ≤ 60 caractères avec « · IdeaForge », du plus complet au plus court
  const title = fitTitle(`${it.title} : budget et revenus`, it.title, `${name} : budget, revenus et plan`, `${name} : budget et revenus`, name);
  const description = clip(`${it.pitch ? it.pitch.replace(/\.$/, "") + ". " : ""}Budget ${f.budget}, ~${f.mrr12Txt} de revenu mensuel projeté à 12 mois, concurrents et plan.`);
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `/idea/${it.id}` },
    openGraph: { title, description, url: `/idea/${it.id}`, type: "article" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function IdeaPage({ params }: { params: { id: string } }) {
  let it = IDEAS.find((x) => x.id === params.id) as Idea | undefined;
  if (!it) {
    // Idée découverte en continu (Supabase) : repli si absente de la base statique.
    try {
      const supabase = createClient();
      const { data } = await supabase.from("ideas").select("*").eq("id", params.id).maybeSingle();
      if (data) it = data as Idea;
    } catch {}
  }
  if (!it) notFound();
  // Idée générée en double : on renvoie (301) vers l'originale pour ne pas créer de contenu dupliqué.
  const original = await originalIdeaId(it);
  if (original) permanentRedirect(`/idea/${original}`);

  const locale = getLocale();
  const t = dict(locale);
  const diff: Record<number, string> = { 1: t.diff1, 2: t.diff2, 3: t.diff3 };
  const plan = await getPlan();
  const member = isMember(plan);
  const faq = ideaFaq(it);
  const cols = collectionsOf(it);
  const similar = (await allIdeas()).filter((x) => x.id !== it!.id && x.sector === it!.sector).slice(0, 5);

  return (
    <>
      <header className="nav">
        <div className="wrap nav-in">
          <a className="brand" href="/"><span className="mk">IF</span> IdeaForge</a>
          <a className="btn" href="/">{t.idea_back}</a>
          <LangSwitcher current={locale} />
        </div>
      </header>

      <script type="application/ld+json" dangerouslySetInnerHTML={ldJson({
        "@context": "https://schema.org",
        "@type": "Article",
        headline: it.title,
        description: it.pitch ?? undefined,
        url: `${SITE}/idea/${it.id}`,
        inLanguage: "fr",
        about: it.sector,
        keywords: (it.tags || []).join(", ") || undefined,
        author: { "@type": "Organization", name: "IdeaForge", url: SITE },
        publisher: { "@type": "Organization", name: "IdeaForge", url: SITE, logo: { "@type": "ImageObject", url: `${SITE}/icon.svg` } },
        isAccessibleForFree: false,
        hasPart: { "@type": "WebPageElement", isAccessibleForFree: false, cssSelector: ".dz-locked" },
      })} />
      <script type="application/ld+json" dangerouslySetInnerHTML={ldJson(breadcrumbLd([
        { name: "Accueil", url: SITE },
        ...(cols[0] ? [{ name: cols[0].h1, url: `${SITE}/idees/${cols[0].slug}` }] : [{ name: "Catalogue", url: `${SITE}/#catalogue` }]),
        { name: it.title, url: `${SITE}/idea/${it.id}` },
      ]))} />
      <script type="application/ld+json" dangerouslySetInnerHTML={ldJson(faqLd(faq))} />

      <main className="wrap" style={{ maxWidth: 760, paddingBlock: 40 }}>
        <nav className="crumbs" aria-label="Fil d'Ariane" style={{ marginBottom: 12 }}>
          <a href="/">Accueil</a> › {cols[0] ? <a href={`/idees/${cols[0].slug}`}>{cols[0].h1}</a> : <a href="/#catalogue">Catalogue</a>} › <span>{it.title}</span>
        </nav>
        <span className="sector">{it.sector}{it.markets ? ` · ${it.markets}` : ""}</span>
        <h1 style={{ fontSize: 34, margin: "8px 0 10px" }}>{it.title}</h1>
        {it.pitch && <p style={{ fontSize: 18, color: "var(--ink-2)" }}>{it.pitch}</p>}

        <div className="grid" style={{ gridTemplateColumns: "repeat(2,1fr)", margin: "22px 0" }}>
          <div className="card"><span className="stat"><span className="k">{t.m_ticket}</span><span className="v">{it.budget}</span></span></div>
          <div className="card"><span className="stat"><span className="k">{t.m_potential}</span><span className="v">{it.revenue}</span></span></div>
          <div className="card"><span className="stat"><span className="k">{t.m_delai}</span><span className="v">{it.delai}</span></span></div>
          <div className="card"><span className="stat"><span className="k">{t.m_diff}</span><span className="v">{it.difficulty ? diff[it.difficulty] : "—"}</span></span></div>
        </div>

        {it.benchmark && (
          <div className="card" style={{ background: "var(--forest)", color: "#fff", marginBottom: 20 }}>
            <span className="k" style={{ color: "rgba(255,255,255,.6)" }}>{t.d_bench}</span>
            <div style={{ fontFamily: "var(--mono)", fontWeight: 600 }}>📈 {it.benchmark}</div>
          </div>
        )}

        {(() => {
          const sc = scoreIdea(it!);
          const bars = [
            { k: t.s_demand, v: sc.demand },
            { k: t.s_comp, v: sc.competition },
            { k: t.s_margin, v: sc.margin },
            { k: t.s_speed, v: sc.speed },
          ];
          return (
            <section className="dsec">
              <h2>{t.score_label}</h2>
              <div className="scorebox">
                <div className="score-big"><span className="mono">{sc.score}</span><small>/100</small></div>
                <div className="score-bars">
                  {bars.map((b) => (
                    <div className="score-row" key={b.k}>
                      <span className="score-lbl">{b.k}</span>
                      <div className="score-track"><i style={{ width: `${b.v}%` }} /></div>
                      <span className="score-num mono">{b.v}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="stack-line"><span className="stack-k">{t.stack_label} :</span> <span className="mono">{buildStack(it!)}</span></div>
            </section>
          );
        })()}

        {(() => {
          const { dossier, generic } = getDossier(it!);
          return <div dangerouslySetInnerHTML={{ __html: renderDossier(it!, dossier, { member, generic }) }} />;
        })()}

        <section className="dsec"><h2>{t.proof_h}</h2><p style={{ color: "var(--ink-2)", fontSize: 14, marginBottom: 10 }}>{t.proof_sub}</p><ProofPanel it={it!} t={t} /></section>

        <section className="dsec"><h2>{t.calc_h}</h2><RevenueCalc t={t} defaultPrice={29} /></section>

        <section className="dsec"><h2>{t.d_market}</h2><p>{member ? it.market : (it.market || "").slice(0, 150) + "…"}</p></section>

        {member ? (
          <>
            <section className="dsec"><h2>{t.d_model}</h2><p>{it.model}</p></section>
            <section className="dsec"><h2>{t.d_comp}</h2><p>{it.competition}</p></section>
            {it.steps?.length ? <section className="dsec"><h2>{t.checklist_h}</h2><Checklist id={it.id} steps={it.steps} t={t} /></section> : null}
            <section className="dsec"><h2>{t.kit_h}</h2><p style={{ color: "var(--ink-2)", fontSize: 14, marginBottom: 10 }}>{t.kit_sub}</p><PromptBox prompt={buildPrompt(it)} t={t} /></section>
          </>
        ) : (
          <div className="gate-lock">
            <div style={{ fontSize: 26 }}>🔒</div>
            <h2>{t.gate_title}</h2>
            <p style={{ color: "var(--ink-2)", maxWidth: "42ch", margin: "0 auto" }}>{t.gate_sub}</p>
            <div style={{ maxWidth: 320, margin: "10px auto 0" }}>
              <CheckoutButton plan="lifetime" label={t.p_l_cta} redirecting={t.redirecting} unavailable={t.pay_unavailable} />
            </div>
          </div>
        )}
        <section className="coll-faq">
          <h2>Questions fréquentes sur {shortName(it.title)}</h2>
          {faq.map((f) => <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>)}
        </section>

        {similar.length > 0 && (
          <section style={{ marginTop: 30 }}>
            <h2 style={{ fontSize: 21, marginBottom: 6 }}>Quelles idées similaires lancer ?</h2>
            <div className="irows" style={{ marginTop: 10 }}>{similar.map((x) => <IdeaRow key={x.id} it={x} />)}</div>
          </section>
        )}
        {cols.length > 0 && (
          <section className="coll-more">
            <h2>Dans quels thèmes trouver cette idée ?</h2>
            <div className="coll-chips">{cols.map((c) => <a key={c.slug} href={`/idees/${c.slug}`}>{c.label}</a>)}</div>
          </section>
        )}
      </main>
    </>
  );
}
