import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureRefCode, maskEmail, TIERS } from "@/lib/referral";
import { SITE, ldJson, breadcrumbLd, webPageLd, faqLd } from "@/lib/seo";
import ShareLink from "@/components/ShareLink";
import { LegalFooter } from "@/components/LegalPage";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Parrainage : gagne l'accès à vie",
  description: "Partage ton lien IdeaForge : tes amis ont -20 % sur leur accès, et tu gagnes 1 mois offert, puis l'accès à vie, puis ton SaaS codé en priorité.",
  alternates: { canonical: "/parrainage" },
};

type Row = { referred_id: string; status: string; created_at: string; paid_at: string | null };
const fmt = (d: string | null) => (d ? new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) : "");

export default async function Parrainage() {
  const { data: { user } } = await createClient().auth.getUser();

  let code = "", rows: (Row & { email: string | null })[] = [], rewards: { tier: number; status: string }[] = [], bonusUntil: string | null = null, err = false;
  if (user) {
    try {
      code = await ensureRefCode(user.id, user.email);
      const admin = createAdminClient();
      const [{ data: refs }, { data: rw }, { data: me }] = await Promise.all([
        admin.from("referrals").select("referred_id, status, created_at, paid_at").eq("referrer_id", user.id).order("created_at", { ascending: false }),
        admin.from("referral_rewards").select("tier, status").eq("user_id", user.id),
        admin.from("profiles").select("bonus_until").eq("id", user.id).maybeSingle(),
      ]);
      const ids = (refs ?? []).map((r) => r.referred_id as string);
      const { data: profs } = ids.length ? await admin.from("profiles").select("id, email").in("id", ids) : { data: [] as { id: string; email: string | null }[] };
      const emails = new Map((profs ?? []).map((p) => [p.id as string, p.email as string | null]));
      rows = (refs ?? []).map((r) => ({ ...(r as Row), email: emails.get(r.referred_id as string) ?? null }));
      rewards = (rw ?? []) as { tier: number; status: string }[];
      bonusUntil = (me?.bonus_until as string) ?? null;
    } catch { err = true; }
  }

  const paid = rows.filter((r) => r.status === "paid").length;
  const link = code ? `${SITE}/?ref=${code}` : "";
  const pct = Math.min(100, paid <= 1 ? paid * 33.3 : paid <= 3 ? 33.3 + ((paid - 1) / 2) * 33.3 : 66.6 + ((paid - 3) / 7) * 33.4);
  const rewardOf = (t: number) => rewards.find((r) => r.tier === t);

  const FAQ = [
    { q: "Qui compte comme ami parrainé ?", a: "Une personne qui clique sur ton lien, crée son compte dans les 30 jours, puis prend un accès payant (abonnement ou accès à vie)." },
    { q: "Et si je suis déjà membre à vie ?", a: "Les deux premiers paliers sont déjà inclus dans ton accès. Le palier 3, ton SaaS codé en priorité avec -30 % sur le devis, reste à gagner." },
    { q: "Je suis abonné au mois et je débloque l'accès à vie : je paie encore ?", a: "Non. Dès que tu passes à vie, ton abonnement mensuel est arrêté automatiquement." },
    { q: "Je peux me parrainer moi-même ?", a: "Non, ton propre lien ne compte pas pour ton compte. Chaque ami ne peut avoir qu'un seul parrain." },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={ldJson(webPageLd({ name: "Programme de parrainage IdeaForge", description: "Tes amis ont -20 % ; tu gagnes 1 mois offert, puis l'accès à vie, puis ton SaaS codé en priorité.", path: "/parrainage" }))} />
      <script type="application/ld+json" dangerouslySetInnerHTML={ldJson(breadcrumbLd([{ name: "Accueil", url: SITE }, { name: "Parrainage", url: `${SITE}/parrainage` }]))} />
      <script type="application/ld+json" dangerouslySetInnerHTML={ldJson(faqLd(FAQ))} />
      <header className="nav"><div className="wrap nav-in">
        <a className="brand" href="/"><span className="mk">IF</span> IdeaForge</a>
        <a className="btn" href="/#catalogue">Catalogue</a>
        {user ? <a className="btn" href="/compte">Mon compte</a> : <a className="btn dark" href="/login?next=/parrainage">Se connecter</a>}
      </div></header>

      <main className="wrap ref">
        <section className="ref-hero">
          <span className="eyebrow">Parrainage</span>
          <h1>Invite tes amis.<br /><em>Gagne l&apos;accès à vie.</em></h1>
          <p>Tes amis ont <b>-20 %</b> sur leur accès IdeaForge. Toi, tu débloques une récompense à chaque palier. Seuls les amis qui prennent un accès payant comptent.</p>
        </section>

        <section className="ref-tiers" aria-label="Les 3 récompenses">
          {TIERS.map((t) => {
            const r = rewardOf(t.tier);
            const reached = paid >= t.need;
            return (
              <article key={t.tier} className={`ref-tier ${reached ? "on" : ""} t${t.tier}`}>
                <span className="ref-need mono">{t.need} ami{t.need > 1 ? "s" : ""}</span>
                <span className="ref-emoji" aria-hidden="true">{t.emoji}</span>
                <h2>{t.name}</h2>
                <p>
                  {t.tier === 1 && "30 jours d'accès complet à toutes les fiches, aux dossiers chiffrés et aux prompts."}
                  {t.tier === 2 && "Tout IdeaForge pour toujours : les fiches, les nouvelles idées chaque semaine, le pack de 50 prompts."}
                  {t.tier === 3 && "On code ton SaaS en priorité, avec 30 % de réduction sur le devis."}
                </p>
                <span className="ref-state">
                  {!reached ? `Encore ${t.need - paid} ami${t.need - paid > 1 ? "s" : ""}` :
                    r?.status === "included" ? "Débloqué (déjà inclus dans ton accès)" :
                    r?.status === "pending" ? "Débloqué : on te contacte" :
                    r?.status === "delivered" ? "Débloqué et livré ✓" : "Débloqué ✓"}
                </span>
              </article>
            );
          })}
        </section>

        {!user ? (
          <section className="ref-box">
            <h2>Obtiens ton lien en 10 secondes</h2>
            <p>Connecte-toi (gratuit) et ton lien personnel s&apos;affiche ici, prêt à partager.</p>
            <a className="btn primary lg" href="/login?next=/parrainage">Obtenir mon lien</a>
          </section>
        ) : err ? (
          <section className="ref-box"><p className="msg err">Le parrainage est momentanément indisponible. Réessaie dans quelques minutes.</p></section>
        ) : (
          <>
            <section className="ref-box">
              <h2>Ton lien de parrainage</h2>
              <p>Ton ami clique, s&apos;inscrit dans les 30 jours, et sa réduction de 20 % s&apos;applique toute seule au paiement.</p>
              <ShareLink url={link} message="Je t'invite sur IdeaForge : plus de 100 idées de business déjà chiffrées. Avec mon lien, tu as -20 % :" />
              {bonusUntil && new Date(bonusUntil) > new Date() && <p className="ref-bonus">✨ Ton mois offert est actif jusqu&apos;au {fmt(bonusUntil)}.</p>}
            </section>

            <section className="ref-box">
              <div className="ref-progress-h">
                <h2>Ta progression</h2>
                <span className="mono"><b>{paid}</b> ami{paid > 1 ? "s" : ""} payant{paid > 1 ? "s" : ""} · {rows.length} inscrit{rows.length > 1 ? "s" : ""}</span>
              </div>
              <div className="ref-track" role="progressbar" aria-valuemin={0} aria-valuemax={10} aria-valuenow={Math.min(paid, 10)}>
                <i style={{ width: `${pct}%` }} />
                {TIERS.map((t, i) => <span key={t.tier} className={`ref-dot ${paid >= t.need ? "on" : ""}`} style={{ left: `${[33.3, 66.6, 100][i]}%` }}><b className="mono">{t.need}</b></span>)}
              </div>

              <h3 className="ref-sub">Tes filleuls</h3>
              {rows.length === 0 ? (
                <p className="ref-empty">Personne pour l&apos;instant. Partage ton lien à un ami qui veut se lancer : c&apos;est souvent le premier message qui marche.</p>
              ) : (
                <ul className="ref-list">
                  {rows.map((r) => (
                    <li key={r.referred_id}>
                      <span className="mono">{maskEmail(r.email)}</span>
                      <span className={`ref-pill ${r.status}`}>{r.status === "paid" ? "A payé ✓" : "Inscrit"}</span>
                      <span className="ref-date">{r.status === "paid" ? `le ${fmt(r.paid_at)}` : `le ${fmt(r.created_at)}`}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}

        <section className="coll-faq" style={{ maxWidth: 760, margin: "40px auto 0" }}>
          <h2>Questions fréquentes</h2>
          <details><summary>Qui compte comme ami parrainé ?</summary><p>Une personne qui clique sur ton lien, crée son compte dans les 30 jours, puis prend un accès payant (abonnement ou accès à vie). Les inscriptions gratuites s&apos;affichent dans ta liste, mais ne comptent pas encore pour les paliers.</p></details>
          <details><summary>Et si je suis déjà membre à vie ?</summary><p>Les deux premiers paliers sont déjà inclus dans ton accès. Le palier 3, ton SaaS codé en priorité avec -30 % sur le devis, reste à gagner.</p></details>
          <details><summary>Je suis abonné au mois et je débloque l&apos;accès à vie : je paie encore ?</summary><p>Non. Dès que tu passes à vie, ton abonnement mensuel est arrêté automatiquement.</p></details>
          <details><summary>Je peux me parrainer moi-même ?</summary><p>Non, ton propre lien ne compte pas pour ton compte. Chaque ami ne peut avoir qu&apos;un seul parrain.</p></details>
        </section>
      </main>
      <LegalFooter />
    </>
  );
}
