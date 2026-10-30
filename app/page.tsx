import { createClient } from "@/lib/supabase/server";
import { getPlan, isMember } from "@/lib/plan";
import { IDEAS } from "@/lib/ideas";
import FavoriteButton from "@/components/FavoriteButton";
import BuyLifetime from "@/components/BuyLifetime";
import QuoteForm from "@/components/QuoteForm";
import Newsletter from "@/components/Newsletter";

export const dynamic = "force-dynamic";

const DIFF: Record<number, string> = { 1: "Facile", 2: "Intermédiaire", 3: "Exigeant" };

export default async function Home() {
  const supabase = createClient();

  // Catalogue servi en statique (figé dans l'app) — aucune conso Supabase.
  const ideas = IDEAS;

  const { data: { user } } = await supabase.auth.getUser();
  const plan = await getPlan();
  const member = isMember(plan);

  let favSet = new Set<string>();
  if (user) {
    const { data: favs } = await supabase.from("favorites").select("idea_id").eq("user_id", user.id);
    favSet = new Set((favs ?? []).map((f) => f.idea_id as string));
  }

  return (
    <>
      <header className="nav">
        <div className="wrap nav-in">
          <a className="brand" href="/"><span className="mk">IF</span> IdeaForge</a>
          <a className="btn" href="#catalogue">Catalogue</a>
          <a className="btn" href="#pricing">Tarifs</a>
          <a className="btn" href="#devis">Devis SaaS</a>
          {member && <span className="pill" style={{ background: "var(--green-wash)", color: "var(--green-ink)", fontWeight: 600 }}>★ Membre à vie</span>}
          {user ? (
            <a className="btn dark" href="/auth/signout">Déconnexion</a>
          ) : (
            <a className="btn dark" href="/login">Se connecter</a>
          )}
        </div>
      </header>

      <section className="hero">
        <div className="wrap">
          <div className="stat">● Plus de 2 500 € générés à partir de ces idées</div>
          <h1>Trouve une idée de business <span className="hl">qui gagne déjà de l&apos;argent</span></h1>
          <p>Des idées validées par la demande réelle (FR · US · ES) : {ideas.length} idées en ligne, benchmarks à l&apos;appui.</p>
          {!member && <div style={{ marginTop: 20 }}><a className="btn primary" href="#pricing">Débloquer toutes les fiches — 129 € à vie</a></div>}
        </div>
      </section>

      <section id="catalogue">
        <div className="wrap">
          <div className="sec-head">
            <h2>Le catalogue</h2>
            <p>{member ? "Toutes les fiches sont débloquées." : "Aperçu libre — débloque les fiches complètes + prompts avec l'Accès à vie."}</p>
          </div>
          <div className="grid">
            {ideas.map((it) => (
              <div className="card" key={it.id}>
                <a href={`/idea/${it.id}`} className="card-link">
                  <span className="sector">{it.sector}</span>
                  <h3>{it.title}</h3>
                  {it.pitch && <p className="pitch">{it.pitch}</p>}
                  {it.benchmark && <div className="bench">📈 {it.benchmark}</div>}
                  {it.difficulty && <span className="pill">{DIFF[it.difficulty]}</span>}
                  <div className="stats">
                    <div className="stat"><span className="k">Ticket</span><span className="v">{it.budget}</span></div>
                    <div className="stat"><span className="k">Potentiel</span><span className="v">{it.revenue}</span></div>
                    <div className="stat"><span className="k">Délai</span><span className="v">{it.delai}</span></div>
                  </div>
                </a>
                <FavoriteButton ideaId={it.id} initial={favSet.has(it.id)} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {!member && (
        <section id="pricing" style={{ background: "var(--surface-2)", borderBlock: "1px solid var(--line)" }}>
          <div className="wrap">
            <div className="sec-head">
              <h2>Un prix simple, validé par les résultats</h2>
              <p>Paiement sécurisé via Stripe. Accès immédiat à toutes les idées.</p>
            </div>
            <div className="plans">
              <div className="plan">
                <span className="pname">Drop hebdomadaire</span>
                <div className="price"><span className="amt">39€</span><span className="per">/ mois</span></div>
                <ul>
                  <li>3 nouvelles idées validées / semaine</li>
                  <li>Fiches détaillées complètes</li>
                  <li>Génération d&apos;idées par IA</li>
                </ul>
              </div>
              <div className="plan feat">
                <span className="badge">Le plus choisi</span>
                <span className="pname">Accès à vie</span>
                <div className="price"><span className="amt">129€</span><span className="was">199€</span></div>
                <ul>
                  <li>Les 80+ idées débloquées, pour toujours</li>
                  <li>Fiches complètes + prompts « Lancer avec Claude »</li>
                  <li>Génération d&apos;idées par IA illimitée</li>
                  <li>Toutes les nouveautés à vie</li>
                  <li className="bonus">🎁 1 devis SaaS prioritaire offert</li>
                  <li className="bonus">🎁 Pack de 50 prompts prêts-à-coller</li>
                </ul>
                <div className="compare">39 €/mois = 468 €/an. À vie : 129 € une fois, rentabilisé en 3,3 mois.</div>
                <BuyLifetime />
                <div className="guarantee">🛡️ Garantie 14 jours satisfait ou remboursé</div>
              </div>
            </div>
            <div className="places">
              <div className="places-head"><span>Places au tarif de lancement 129 €</span><span className="mono">158 / 200</span></div>
              <div className="places-bar"><i style={{ width: "79%" }} /></div>
              <div className="places-note">⚡ Le prix passe à 199 € une fois les 200 places vendues — rejoins 312 membres.</div>
            </div>
          </div>
        </section>
      )}

      <section id="devis" style={{ background: "var(--surface-2)", borderBlock: "1px solid var(--line)" }}>
        <div className="wrap">
          <div className="sec-head">
            <h2>Fais coder ton SaaS</h2>
            <p>Décris ton logiciel : on t&apos;envoie un devis chiffré. Exemple : organisation kiné → ~500 €.</p>
          </div>
          <QuoteForm />
        </div>
      </section>

      <section>
        <div className="wrap"><Newsletter /></div>
      </section>

      <footer>
        <div className="wrap">
          <div className="brand"><span className="mk">IF</span> IdeaForge</div>
          <p style={{ marginTop: 12 }}>© 2026 IdeaForge — From proven idea to shipped product.</p>
        </div>
      </footer>
    </>
  );
}
