import { createClient } from "@/lib/supabase/server";
import { getPlan, isMember } from "@/lib/plan";
import { isAdminEmail } from "@/lib/admin";
import { getLocale, dict } from "@/lib/i18n";
import { IDEAS } from "@/lib/ideas";
import CatalogGrid from "@/components/CatalogGrid";
import CheckoutButton from "@/components/CheckoutButton";
import QuoteForm from "@/components/QuoteForm";
import Newsletter from "@/components/Newsletter";
import LangSwitcher from "@/components/LangSwitcher";
import { COLLECTIONS } from "@/lib/collections";
import { SITE, ldJson, organizationLd, faqLd } from "@/lib/seo";
import { PRICE_LIFETIME, PRICE_MONTHLY } from "@/lib/admin";

const HOME_FAQ = [
  { q: "Qu'est-ce qu'IdeaForge ?", a: "IdeaForge est un catalogue de plus de 90 idées de business et de logiciels analysées et chiffrées : marché, budget de départ, revenus projetés sur 24 mois, concurrents, risques, plan de lancement et prompts pour construire le produit avec l'IA." },
  { q: "D'où viennent les chiffres des dossiers ?", a: "Les projections sont calculées à partir d'hypothèses expliquées dans chaque fiche (prix, coût d'acquisition, fidélité des clients, marge). Les références de marché citent des déclarations publiques. Ce sont des estimations pour comparer les idées, pas des promesses de résultat." },
  { q: "Quelle différence entre l'abonnement et l'accès à vie ?", a: `L'abonnement à ${PRICE_MONTHLY} € par mois donne accès aux fiches complètes et aux nouvelles idées tant qu'il est actif, résiliable à tout moment. L'accès à vie à ${PRICE_LIFETIME} € est un paiement unique qui débloque tout, nouveautés comprises, plus le pack de 50 prompts.` },
  { q: "Puis-je utiliser les idées pour créer mon entreprise ?", a: "Oui, c'est l'objectif : tu peux librement t'inspirer des idées et utiliser les prompts pour lancer ta propre activité. Seule la revente ou la republication des fiches est interdite." },
  { q: "Y a-t-il une garantie ?", a: "Oui : satisfait ou remboursé pendant 14 jours, sur simple e-mail, même si tu as déjà utilisé le service." },
  { q: "Comment savoir si mon idée est bonne ?", a: "Le validateur gratuit donne un score, des liens vers des preuves de demande réelles, une stack technique et un plan de 30 jours. Les membres obtiennent aussi une analyse approfondie par IA." },
];

export const dynamic = "force-dynamic";
export const metadata = { alternates: { canonical: "/" } };

export default async function Home() {
  const locale = getLocale();
  const t = dict(locale);

  const NICHES = [
    { ic: "📊", c: "#4B7BF5", h: t.n1_h, p: t.n1_p, ceil: t.n1_c, ex: "Plausible · Fathom" },
    { ic: "✍️", c: "#22a86a", h: t.n2_h, p: t.n2_p, ceil: t.n2_c, ex: "Kit · Hypefury" },
    { ic: "⭐", c: "#e09b13", h: t.n3_h, p: t.n3_p, ceil: t.n3_c, ex: "Senja · Testimonial.to" },
    { ic: "💶", c: "#003d30", h: t.n4_h, p: t.n4_p, ceil: t.n4_c, ex: "Pennylane · Factorial" },
    { ic: "🔎", c: "#0D96F6", h: t.n5_h, p: t.n5_p, ceil: t.n5_c, ex: "Linkody · Rewardful" },
    { ic: "🤖", c: "#7C3AED", h: t.n6_h, p: t.n6_p, ceil: t.n6_c, ex: "Photo AI · Pikzels" },
  ];

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Catalogue : base statique (toujours dispo, gratuite) + idées découvertes en continu (Supabase, is_ai=true).
  // Si Supabase est indisponible, on retombe simplement sur la base statique.
  let extra: typeof IDEAS = [];
  try {
    const { data } = await supabase.from("ideas").select("*").eq("is_ai", true).order("created_at", { ascending: false }).limit(60);
    if (data) extra = (data as typeof IDEAS).filter((d) => !IDEAS.some((s) => s.id === d.id));
  } catch {}
  const ideas = [...extra, ...IDEAS];
  const plan = await getPlan();
  const member = isMember(plan);

  let favSet = new Set<string>();
  if (user) {
    const { data: favs } = await supabase.from("favorites").select("idea_id").eq("user_id", user.id);
    favSet = new Set((favs ?? []).map((f) => f.idea_id as string));
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={ldJson(organizationLd)} />
      <script type="application/ld+json" dangerouslySetInnerHTML={ldJson({ "@context": "https://schema.org", "@type": "WebSite", name: "IdeaForge", url: SITE, inLanguage: ["fr", "en", "es"] })} />
      <script type="application/ld+json" dangerouslySetInnerHTML={ldJson({
        "@context": "https://schema.org",
        "@type": "Product",
        name: "IdeaForge — catalogue d'idées de business chiffrées",
        description: "Plus de 90 idées de business analysées : budget, revenus sur 24 mois, concurrents, risques, plan de lancement et 50 prompts IA.",
        brand: { "@type": "Brand", name: "IdeaForge" },
        url: SITE,
        offers: [
          { "@type": "Offer", name: "Accès à vie", price: String(PRICE_LIFETIME), priceCurrency: "EUR", availability: "https://schema.org/InStock", url: `${SITE}/#pricing` },
          { "@type": "Offer", name: "Abonnement mensuel", price: String(PRICE_MONTHLY), priceCurrency: "EUR", availability: "https://schema.org/InStock", url: `${SITE}/#pricing` },
        ],
      })} />
      <script type="application/ld+json" dangerouslySetInnerHTML={ldJson(faqLd(HOME_FAQ))} />
      <header className="nav">
        <div className="wrap nav-in">
          <a className="brand" href="/"><span className="mk">IF</span> IdeaForge</a>
          <a className="btn" href="/validate">{t.val_nav}</a>
          <a className="btn" href="#catalogue">{t.nav_catalogue}</a>
          <a className="btn" href="/idees">Thèmes</a>
          <a className="btn" href="/radar">{t.radar_nav}</a>
          <a className="btn" href="#pricing">{t.nav_pricing}</a>
          <a className="btn" href="#devis">{t.nav_devis}</a>
          <LangSwitcher current={locale} />
          {isAdminEmail(user?.email) && <a className="btn" href="/admin">Admin</a>}
          {member && <span className="pill" style={{ background: "var(--green-wash)", color: "var(--green-ink)", fontWeight: 600 }}>{t.nav_member}</span>}
          <a className="btn" href="/prompts">🎁 50 prompts</a>
          {user && <a className="btn" href="/compte">Mon compte</a>}
          {user ? <a className="btn dark" href="/auth/signout">{t.nav_logout}</a> : <a className="btn dark" href="/login">{t.nav_login}</a>}
        </div>
      </header>

      <section className="hero">
        <div className="wrap">
          <div className="stat">● {t.hero_stat}</div>
          <h1>{t.hero_h1a}<span className="hl">{t.hero_h1b}</span></h1>
          <p>{t.hero_lede} {ideas.length} {t.ideas_online}.</p>
          <div style={{ marginTop: 22, display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <a className="btn primary" href="/validate">⚡ {t.val_nav}</a>
            {!member && <a className="btn" href="#pricing">{t.hero_cta}</a>}
          </div>

          <div className="mock" aria-hidden="true">
            <div className="mock-bar"><i /><i /><i /><span className="addr mono">ideaforges.io</span></div>
            <div className="mock-body">
              <div className="m-panel">
                <div className="m-h">{t.mock_pain}<span className="m-tag">{t.mock_ai}</span></div>
                <div className="m-row"><span className="m-ic" style={{ background: "#FF4500" }}>R</span><div className="m-meta"><b>Gestion de notes</b><span>Forum · 4 200</span></div><span className="m-rate">★ 2,9</span></div>
                <div className="m-row"><span className="m-ic" style={{ background: "#2563EB" }}>T</span><div className="m-meta"><b>Suivi d&apos;habitudes</b><span>App Store · 1 100</span></div><span className="m-rate">★ 3,4</span></div>
                <div className="m-row"><span className="m-ic" style={{ background: "#7C3AED" }}>C</span><div className="m-meta"><b>Facturation freelance</b><span>Forum · 2 800</span></div><span className="m-rate">★ 3,1</span></div>
              </div>
              <div className="m-panel">
                <div className="m-h">{t.mock_rev}<span className="m-tag green">€ MRR</span></div>
                <div className="m-row"><span className="m-ic" style={{ background: "#22a86a" }}>M</span><div className="m-meta"><b>Meal-prep sportif</b><span>abonnement</span></div><span className="m-big">8,4 k€</span></div>
                <div className="m-row"><span className="m-ic" style={{ background: "#0D96F6" }}>C</span><div className="m-meta"><b>Conciergerie</b><span>commission</span></div><span className="m-big">11 k€</span></div>
                <div className="m-row"><span className="m-ic" style={{ background: "#e09b13" }}>T</span><div className="m-meta"><b>Micro-torréfaction</b><span>B2C</span></div><span className="m-big">6,2 k€</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how">
        <div className="wrap">
          <div className="sec-head"><span className="eyebrow">{t.how_eye}</span><h2>{t.how_h2}</h2><p>{t.how_sub}</p></div>
          <div className="how3">
            <div className="step"><span className="n">01</span><h3>{t.how1_h}</h3><p>{t.how1_p}</p></div>
            <div className="step"><span className="n">02</span><h3>{t.how2_h}</h3><p>{t.how2_p}</p></div>
            <div className="step"><span className="n">03</span><h3>{t.how3_h}</h3><p>{t.how3_p}</p></div>
          </div>
        </div>
      </section>

      <section id="catalogue">
        <div className="wrap">
          <div className="sec-head">
            <h2>{t.cat_h2}</h2>
            <p>{member ? t.cat_sub_member : t.cat_sub_free}</p>
          </div>
          <CatalogGrid ideas={ideas} favIds={[...favSet]} t={t} />
        </div>
      </section>

      <section id="niches" style={{ background: "var(--surface-2)", borderBlock: "1px solid var(--line)" }}>
        <div className="wrap">
          <div className="sec-head"><span className="eyebrow">{t.niche_eye}</span><h2>{t.niche_h2}</h2><p>{t.niche_sub}</p></div>
          <div className="niche-grid">
            {NICHES.map((n, i) => (
              <article className="niche" key={i}>
                <div className="niche-top"><span className="niche-ic" style={{ background: n.c }}>{n.ic}</span></div>
                <h3>{n.h}</h3>
                <p>{n.p}</p>
                <div className="niche-foot"><span className="niche-ceil mono">{n.ceil}</span><span className="niche-ex">{n.ex}</span></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {(
        <section id="pricing" style={{ background: "var(--surface-2)", borderBlock: "1px solid var(--line)" }}>
          <div className="wrap">
            <div className="sec-head"><h2>{t.price_h2}</h2><p>{t.price_sub}</p></div>
            <div className="plans">
              <div className="plan">
                <span className="pname">{t.p_monthly}</span>
                <div className="price"><span className="amt">39€</span><span className="per">{t.per_month}</span></div>
                <ul><li>{t.p_m_f1}</li><li>{t.p_m_f2}</li><li>{t.p_m_f3}</li></ul>
                {member
                  ? <span className="btn" style={{ justifyContent: "center", width: "100%" }}>{t.nav_member}</span>
                  : <CheckoutButton plan="monthly" label={t.p_m_cta} redirecting={t.redirecting} unavailable={t.pay_unavailable} className="btn" />}
              </div>
              <div className="plan feat">
                <span className="badge">{t.most_chosen}</span>
                <span className="pname">{t.p_life}</span>
                <div className="price"><span className="amt">129€</span><span className="was">199€</span></div>
                <ul>
                  <li>{t.p_l_f1}</li><li>{t.p_l_f2}</li><li>{t.p_l_f3}</li><li>{t.p_l_f4}</li>
                  <li className="bonus">{t.p_l_b1}</li><li className="bonus">{t.p_l_b2}</li>
                </ul>
                <div className="compare">{t.compare}</div>
                {member
                  ? <span className="btn primary" style={{ justifyContent: "center", width: "100%" }}>{t.nav_member}</span>
                  : <CheckoutButton plan="lifetime" label={t.p_l_cta} redirecting={t.redirecting} unavailable={t.pay_unavailable} />}
                <div className="guarantee">{t.guarantee}</div>
              </div>
            </div>
            <div className="places">
              <div className="places-note" style={{ marginTop: 0, textAlign: "center" }}>{t.places_note}</div>
            </div>
          </div>
        </section>
      )}

      <section id="devis" style={{ background: "var(--surface-2)", borderBlock: "1px solid var(--line)" }}>
        <div className="wrap">
          <div className="sec-head"><h2>{t.devis_h2}</h2><p>{t.devis_sub}</p></div>
          <QuoteForm t={t} />
        </div>
      </section>

      <section>
        <div className="wrap coll" style={{ padding: 0, maxWidth: 1140 }}>
          <h2 style={{ fontSize: 26, marginBottom: 12 }}>Explorer les idées par thème</h2>
          <div className="coll-chips">{COLLECTIONS.map((c) => <a key={c.slug} href={`/idees/${c.slug}`}>{c.h1}</a>)}</div>
        </div>
      </section>

      <section>
        <div className="wrap coll-faq" style={{ maxWidth: 860, marginTop: 0 }}>
          <h2 style={{ fontSize: 26 }}>Questions fréquentes</h2>
          {HOME_FAQ.map((f) => <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>)}
        </div>
      </section>

      <section>
        <div className="wrap"><Newsletter t={t} /></div>
      </section>

      <footer>
        <div className="wrap">
          <div className="brand"><span className="mk">IF</span> IdeaForge</div>
          <p style={{ marginTop: 12 }}>© 2026 IdeaForge — {t.foot_tag}</p>
          <p className="legal-links"><a href="/mentions-legales">Mentions légales</a> · <a href="/cgv">CGV</a> · <a href="/confidentialite">Confidentialité</a> · <a href="/compte">Gérer / résilier mon abonnement</a></p>
        </div>
      </footer>
    </>
  );
}
