import { LegalPage, V } from "@/components/LegalPage";
import { legal } from "@/lib/legal";

export const dynamic = "force-dynamic";
export const metadata = { title: "Politique de confidentialité et cookies", description: "Comment IdeaForge traite vos données personnelles : données collectées, prestataires, durées de conservation, cookies et droits.", alternates: { canonical: "/confidentialite" } };

export default function Confidentialite() {
  const b = legal.brand;
  return (
    <LegalPage title="Confidentialité" updated={legal.updated} current="/confidentialite">
      <p>Cette politique explique quelles données personnelles {b} traite, pourquoi, combien de temps, avec quels prestataires, et comment exercer vos droits au titre du Règlement général sur la protection des données (RGPD) et de la loi Informatique et Libertés.</p>

      <h2>1. Responsable du traitement</h2>
      <p><V>{legal.publisher()}</V> — <V>{legal.address()}</V> — contact : <V>{legal.email()}</V>.</p>

      <h2>2. Données traitées et finalités</h2>
      <h3>Votre compte</h3>
      <p>Adresse e-mail et, si vous vous connectez avec Google ou GitHub, le nom et l’identifiant transmis par ce service. Aucun mot de passe n’est créé : la connexion se fait par Google, GitHub ou lien envoyé par e-mail. Finalité : créer et sécuriser votre compte. Base légale : exécution du contrat.</p>
      <h3>Vos achats</h3>
      <p>Offre achetée (abonnement mensuel ou accès à vie), date, statut, montant et identifiants de paiement Stripe. Nous ne recevons ni ne conservons vos numéros de carte : ils sont traités directement par Stripe. Base légale : exécution du contrat et obligations légales (comptabilité).</p>
      <h3>Votre utilisation du service</h3>
      <p>Idées ajoutées en favoris, langue choisie, et la progression de vos listes de tâches (enregistrée uniquement dans votre navigateur). Finalité : fournir les fonctionnalités. Base légale : exécution du contrat.</p>
      <h3>Le validateur et la génération d’idées</h3>
      <p>Le texte de l’idée que vous soumettez au validateur est envoyé à notre prestataire d’intelligence artificielle (Anthropic) pour produire le rapport. N’y saisissez pas d’informations confidentielles ou personnelles. Base légale : exécution du contrat (service demandé).</p>
      <h3>Demandes de devis</h3>
      <p>Les informations saisies dans le formulaire de devis (description du projet, secteur, budget, e-mail). Finalité : répondre à votre demande. Base légale : mesures précontractuelles prises à votre demande.</p>
      <h3>E-mails</h3>
      <ul>
        <li><b>E-mails liés au compte</b> (lien de connexion, confirmation de paiement) : base légale : exécution du contrat.</li>
        <li><b>E-mails d’information sur {b}</b> (bienvenue, conseils et rappels sur nos offres dans les jours qui suivent votre inscription, relance si un paiement n’a pas été finalisé) : base légale : intérêt légitime à informer nos utilisateurs inscrits sur nos propres services. Chaque e-mail contient un lien de désinscription en un clic.</li>
        <li><b>Drop hebdomadaire (newsletter)</b> : envoyé uniquement si vous vous y êtes inscrit·e. Base légale : votre consentement, retirable à tout moment par le lien présent dans chaque e-mail.</li>
      </ul>
      <h3>Données techniques et mesure d’audience</h3>
      <p>Journaux techniques (adresse IP, date, page demandée, erreurs) conservés quelques jours par nos hébergeurs pour la sécurité. Pour compter les visites, nous enregistrons pour chaque page vue : la page, la source de la visite (site d’origine ou campagne), le pays et la ville déduits de l’adresse IP, le type d’appareil et le navigateur. Votre adresse IP n’est jamais enregistrée : elle sert seulement, avec votre navigateur, à calculer un identifiant anonyme qui change chaque jour, sans cookie. Ces statistiques, réservées à l’éditeur, sont conservées 13 mois. Une mesure d’audience anonyme complémentaire (Vercel Web Analytics) fonctionne aussi sans cookie. Base légale : intérêt légitime (mesure d’audience exemptée de consentement, article 82 de la loi Informatique et Libertés).</p>

      <h2>3. Destinataires et prestataires</h2>
      <p>Vos données ne sont jamais vendues. Elles ne sont accessibles qu’à nous et aux prestataires qui nous aident à faire fonctionner le service, dans la limite de leur mission :</p>
      <ul>
        <li><b>Vercel Inc.</b> (hébergement du site, mesure d’audience anonyme) — États-Unis ;</li>
        <li><b>Supabase</b> (comptes et base de données) — données hébergées dans l’Union européenne (Paris) ;</li>
        <li><b>Stripe</b> (paiements) — Irlande / États-Unis ;</li>
        <li><b>Resend</b> (envoi des e-mails) — États-Unis ;</li>
        <li><b>Anthropic</b> (intelligence artificielle du validateur et de la découverte d’idées) — États-Unis ;</li>
        <li><b>Google</b> et <b>GitHub</b>, uniquement si vous choisissez de vous connecter avec eux.</li>
      </ul>
      <p>Pour les prestataires situés hors de l’Union européenne, les transferts sont encadrés par le cadre de protection des données UE–États-Unis (Data Privacy Framework) et/ou les clauses contractuelles types de la Commission européenne.</p>

      <h2>4. Durées de conservation</h2>
      <ul>
        <li>Compte, favoris et préférences : tant que le compte est actif, puis suppression dans les 30 jours suivant votre demande ;</li>
        <li>Comptes inactifs : suppression après 3 ans sans connexion, après un e-mail de prévenance ;</li>
        <li>Demandes de devis : 3 ans après le dernier contact ;</li>
        <li>Inscription à la newsletter : jusqu’à votre désinscription ;</li>
        <li>Factures et pièces comptables : 10 ans (obligation légale, article L123-22 du Code de commerce) ;</li>
        <li>Statistiques de visite : 13 mois ;</li>
        <li>Journaux techniques : quelques jours.</li>
      </ul>

      <h2>5. Cookies et stockage local</h2>
      <p>{b} n’utilise <b>aucun cookie publicitaire ni de suivi</b>. Seuls des cookies et stockages strictement nécessaires au service sont utilisés ; ils sont exemptés de consentement (article 82 de la loi Informatique et Libertés) :</p>
      <ul>
        <li>Cookies de session Supabase (<code>sb-…-auth-token</code>) : vous garder connecté·e ;</li>
        <li><code>locale</code> : mémoriser votre langue (1 an) ;</li>
        <li>Stockage local du navigateur : la progression de vos listes de tâches sur les fiches.</li>
      </ul>
      <p>Lors d’un paiement, vous êtes redirigé·e vers la page sécurisée de Stripe, qui applique sa propre politique en matière de cookies (prévention de la fraude).</p>

      <h2>6. Vos droits</h2>
      <p>Vous disposez des droits d’accès, de rectification, d’effacement, de limitation, d’opposition et de portabilité de vos données, du droit de retirer votre consentement à tout moment, et du droit de définir des directives sur le sort de vos données après votre décès. Pour les exercer, écrivez à <V>{legal.email()}</V> ; nous répondons sous un mois. Pour ne plus recevoir nos e-mails d’information, utilisez le lien de désinscription présent dans chacun d’eux.</p>
      <p>Si vous estimez que vos droits ne sont pas respectés, vous pouvez adresser une réclamation à la CNIL (cnil.fr).</p>

      <h2>7. Sécurité</h2>
      <p>Connexions chiffrées (HTTPS), aucun mot de passe stocké, accès à la base de données restreint et cloisonné par utilisateur, paiements délégués à un prestataire certifié PCI-DSS. Aucun système n’étant infaillible, nous vous informerons sans délai en cas de violation de données vous concernant, conformément à la loi.</p>

      <h2>8. Modifications</h2>
      <p>Nous pouvons mettre à jour cette politique. En cas de changement important, nous vous prévenons par e-mail ou sur le site avant son entrée en vigueur.</p>
    </LegalPage>
  );
}
