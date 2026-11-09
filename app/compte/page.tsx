import { createClient } from "@/lib/supabase/server";
import { getPlan } from "@/lib/plan";
import { LegalFooter } from "@/components/LegalPage";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mon compte", robots: { index: false, follow: false } };

const PLAN_LABEL: Record<string, string> = { lifetime: "Accès à vie", monthly: "Abonnement mensuel (39 €/mois)", free: "Compte gratuit" };

export default async function Compte({ searchParams }: { searchParams: { billing?: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const plan = await getPlan();

  return (
    <>
      <header className="nav"><div className="wrap nav-in">
        <a className="brand" href="/"><span className="mk">IF</span> IdeaForge</a>
        <a className="btn dark" href="/">←</a>
      </div></header>
      <main className="wrap legal">
        <h1>Mon compte</h1>
        {!user ? (
          <p className="legal-date"><a href="/login">Connecte-toi</a> pour voir ton compte.</p>
        ) : (
          <div className="legal-body">
            <p><b>E-mail :</b> {user.email}</p>
            <p><b>Offre :</b> {PLAN_LABEL[plan ?? "free"] ?? plan}</p>

            {plan === "monthly" && (
              <>
                <h2>Gérer ou résilier mon abonnement</h2>
                <p>Change de carte, télécharge tes factures ou résilie en quelques clics. La résiliation prend effet à la fin du mois en cours, sans frais.</p>
                <a className="btn primary" href="/api/billing/portal" style={{ textDecoration: "none" }}>Gérer / résilier mon abonnement</a>
              </>
            )}
            {(plan === "lifetime" || plan === "monthly") && <p>🎁 Ton bonus : <a href="/prompts">le pack de 50 prompts</a>.</p>}
            {plan === "lifetime" && <p>Ton accès à vie n’a pas d’abonnement : aucun prélèvement à venir. Pour un remboursement dans les 14 jours, écris à ideasforges.io@gmail.com.</p>}
            {plan !== "monthly" && plan !== "lifetime" && <p>Tu n’as pas d’abonnement en cours. <a href="/#pricing">Voir les offres</a>.</p>}

            {searchParams.billing === "none" && <p className="msg err">Aucun abonnement Stripe trouvé pour ce compte. Écris-nous à ideasforges.io@gmail.com et on s’en occupe.</p>}
            {searchParams.billing === "error" && <p className="msg err">L’espace de gestion est momentanément indisponible. Réessaie plus tard ou écris-nous à ideasforges.io@gmail.com : on résilie pour toi immédiatement.</p>}

            <p style={{ marginTop: 24 }}><a href="/auth/signout">Se déconnecter</a></p>
          </div>
        )}
      </main>
      <LegalFooter />
    </>
  );
}
