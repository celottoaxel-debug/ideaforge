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
import MobileMenuCloser from "@/components/MobileMenuCloser";
import { COLLECTIONS } from "@/lib/collections";
import { SITE, ldJson, organizationLd, faqLd } from "@/lib/seo";
import { PRICE_LIFETIME, PRICE_MONTHLY } from "@/lib/admin";
import ForgeHero from "@/components/ForgeHero";
import ForgeHold from "@/components/ForgeHold";
import { homeCopy } from "@/lib/home-copy";
import { HERO } from "@/lib/hero-assets";

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
  const c = homeCopy(locale, ideas.length);

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
        name: "IdeaForge : catalogue d'idées de business chiffrées",
        description: "Plus de 90 idées de business analysées : budget, revenus sur 24 mois, concurrents, risques, plan de lancement et 50 prompts IA.",
        brand: { "@type": "Brand", name: "IdeaForge" },
        url: SITE,
        offers: [
          { "@type": "Offer", name: "Accès à vie", price: String(PRICE_LIFETIME), priceCurrency: "EUR", availability: "https://schema.org/InStock", url: `${SITE}/#pricing` },
          { "@type": "Offer", name: "Abonnement mensuel", price: String(PRICE_MONTHLY), priceCurrency: "EUR", availability: "https://schema.org/InStock", url: `${SITE}/#pricing` },
        ],
      })} />
      <script type="application/ld+json" dangerouslySetInnerHTML={ldJson(faqLd(HOME_FAQ))} />
      {(() => {
        const primary = (
          <>
            <a className="btn" href="/validate">{t.val_nav}</a>
            <a className="btn" href="#catalogue">{t.nav_catalogue}</a>
            <a className="btn" href="/idees">Thèmes</a>
            <a className="btn" href="/blog">Blog</a>
            <a className="btn" href="#pricing">{t.nav_pricing}</a>
          </>
        );
        const secondary = (
          <>
            <a className="btn" href="/radar">{t.radar_nav}</a>
            <a className="btn" href="#devis">{t.nav_devis}</a>
            <a className="btn" href="/prompts">🎁 50 prompts</a>
            {isAdminEmail(user?.email) && <a className="btn" href="/admin">Admin</a>}
            {user && <a className="btn" href="/compte">Mon compte</a>}
          </>
        );
        const links = <>{primary}{secondary}</>;
        const account = user ? <a className="btn dark" href="/auth/signout">{t.nav_logout}</a> : <a className="btn dark" href="/login">{t.nav_login}</a>;
        return (
          <header className="nav">
            <div className="wrap nav-in">
              <a className="brand" href="/"><span className="mk">IF</span> IdeaForge</a>
              {/* Ordinateur : liens en ligne */}
              <div className="nav-desk">
                {primary}
                <details className="nav-more">
                  <summary className="btn">Plus ▾</summary>
                  <div className="nav-mob-panel">{secondary}</div>
                </details>
                <LangSwitcher current={locale} />
                {member && <span className="pill" style={{ background: "var(--green-wash)", color: "var(--green-ink)", fontWeight: 600 }}>{t.nav_member}</span>}
                {account}
              </div>
              {/* Mobile : menu repliable */}
              <MobileMenuCloser />
              <details className="nav-mob">
                <summary aria-label="Menu">{member && <span className="nav-mob-star">★</span>}<span className="burger" aria-hidden>☰</span></summary>
                <div className="nav-mob-panel">
                  {member && <span className="pill" style={{ background: "var(--green-wash)", color: "var(--green-ink)", fontWeight: 600, alignSelf: "flex-start" }}>{t.nav_member}</span>}
                  {links}
                  <LangSwitcher current={locale} />
                  {account}
                </div>
              </details>
            </div>
          </header>
        );
      })()}

      <ForgeHero
        video={HERO.video} poster={HERO.poster} ending={HERO.ending} bytes={HERO.bytes}
        bands={c.bands}
        primary={member ? { href: "#catalogue", label: c.ctaIdeas } : { href: "#pricing", label: `${c.ctaLife} · ${PRICE_LIFETIME} €` }}
        secondary={member ? undefined : { href: "#catalogue", label: c.ctaIdeas }}
        staticKicker={c.staticKicker} staticH={c.staticH} staticP={c.staticP}
      />

      {/* dégradé partagé par les lignes de circuit */}
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
        <defs><linearGradient id="trace-g" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stopColor="#2fc07d" stopOpacity="0" /><stop offset=".25" stopColor="#2fc07d" /><stop offset=".75" stopColor="#e7ac3c" /><stop offset="1" stopColor="#e7ac3c" stopOpacity="0" /></linearGradient></defs>
      </svg>

      <section id="suite" style={{ paddingTop: "clamp(40px, 6vw, 72px)" }}>
        <div className="wrap">
          <div className="proofband" data-reveal="stagger">
            {c.proof.map((p) => (
              <div key={p.l}><span className="v">{p.v}{p.s && <small>{p.s}</small>}</span><span className="l">{p.l}</span></div>
            ))}
          </div>
        </div>
      </section>

      <Trace d="M0 45 H300 L340 20 H560 L600 45 H780 L820 70 H1140" nodes={[[340, 20], [600, 45], [820, 70]]} />

      <section id="peurs">
        <div className="wrap">
          <div className="sec-head" data-reveal><span className="eyebrow">{c.fearsEye}</span><h2>{c.fearsH}</h2><p>{c.fearsP}</p></div>
          <div className="fears" data-reveal="stagger">
            {c.fears.map((f, i) => (
              <article className="fear" key={i}><q>{f.q}</q><div className="ans">{f.a}</div></article>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="tint">
        <div className="wrap">
          <div className="sec-head" data-reveal><span className="eyebrow">{c.howEye}</span><h2>{c.howH}</h2><p>{c.howP}</p></div>
          <Trace d="M190 45 H570 M570 45 H950" nodes={[[190, 45], [570, 45], [950, 45]]} />
          <div className="how3" data-reveal="stagger">
            {c.how.map((h, i) => (
              <div className="step" key={i}><div className="step-img"><img src={HERO.steps[i]} alt="" loading="lazy" decoding="async" width={800} height={600} /></div><span className="n mono">0{i + 1}</span><h3>{h.h}</h3><p>{h.p}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section id="forger" className="forge-sec">
        <div className="wrap">
          <div className="sec-head" data-reveal><span className="eyebrow">{c.forgeEye}</span><h2>{c.forgeH}</h2><p>{c.forgeP}</p></div>
          <div data-reveal>
            <ForgeHold
              ideas={ideas.filter((x) => x.budget && x.revenue).slice(0, 60).map((x) => ({ id: x.id, title: x.title, sector: x.sector, pitch: x.pitch, budget: x.budget, revenue: x.revenue, delai: x.delai }))}
              labels={c.forgeL}
            />
          </div>
        </div>
      </section>

      <Trace d="M0 20 H420 L460 45 H680 L720 70 H1140" nodes={[[460, 45], [720, 70]]} />

      <section id="catalogue">
        <div className="wrap">
          <div className="sec-head" data-reveal>
            <span className="eyebrow">IdeaForge</span>
            <h2>{t.cat_h2}</h2>
            <p>{member ? t.cat_sub_member : t.cat_sub_free}</p>
          </div>
          <CatalogGrid ideas={ideas} favIds={[...favSet]} t={t} />
        </div>
      </section>

      <section id="niches" className="tint">
        <div className="wrap">
          <div className="sec-head" data-reveal><span className="eyebrow">{t.niche_eye}</span><h2>{t.niche_h2}</h2><p>{t.niche_sub}</p></div>
          <div className="niche-grid" data-reveal="stagger">
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
        <section id="pricing">
          <div className="wrap">
            <div className="sec-head" data-reveal><span className="eyebrow">{c.ctaLife}</span><h2>{t.price_h2}</h2><p>{t.price_sub}</p></div>
            <div className="plans" data-reveal="stagger">
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

      <section id="devis" className="tint">
        <div className="wrap">
          <div className="sec-head" data-reveal><h2>{t.devis_h2}</h2><p>{t.devis_sub}</p></div>
          <QuoteForm t={t} />
        </div>
      </section>

      <section>
        <div className="wrap coll" style={{ padding: 0, maxWidth: 1140 }}>
          <h2 style={{ fontSize: 26, marginBottom: 12 }}>{c.themesH}</h2>
          <div className="coll-chips">{COLLECTIONS.map((c) => <a key={c.slug} href={`/idees/${c.slug}`}>{c.h1}</a>)}</div>
        </div>
      </section>

      <section>
        <div className="wrap coll-faq" style={{ maxWidth: 860, marginTop: 0 }}>
          <h2 style={{ fontSize: 26 }}>{c.faqH}</h2>
          {HOME_FAQ.map((f) => <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>)}
        </div>
      </section>

      {!member && (
        <section style={{ paddingBottom: 30 }}>
          <div className="wrap">
            <div className="final" data-reveal>
              <span className="orbit" aria-hidden="true" />
              <span className="eyebrow">IdeaForge</span>
              <h2>{c.finalH}</h2>
              <p>{c.finalP}</p>
              <div className="fh-cta">
                <a className="btn amber lg" href="#pricing">{c.ctaLife} · {PRICE_LIFETIME} €</a>
                <a className="btn ghost lg" href="#catalogue">{c.ctaIdeas}</a>
              </div>
            </div>
          </div>
        </section>
      )}

      <section>
        <div className="wrap"><Newsletter t={t} /></div>
      </section>

      <footer>
        <div className="wrap">
          <div className="brand"><span className="mk">IF</span> IdeaForge</div>
          <p style={{ marginTop: 12 }}>© 2026 IdeaForge · {t.foot_tag}</p>
          <p className="legal-links"><a href="/blog">Blog</a> · <a href="/idees">Idées par thème</a> · <a href="/mentions-legales">Mentions légales</a> · <a href="/cgv">CGV</a> · <a href="/confidentialite">Confidentialité</a> · <a href="/compte">Gérer / résilier mon abonnement</a></p>
        </div>
      </footer>
    </>
  );
}

/** Ligne de circuit décorative qui se dessine pendant le scroll. */
function Trace({ d, nodes }: { d: string; nodes: [number, number][] }) {
  return (
    <svg className="trace" viewBox="0 0 1140 90" aria-hidden="true">
      <path d={d} />
      {nodes.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3.2" />)}
    </svg>
  );
}
