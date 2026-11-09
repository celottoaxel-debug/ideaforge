import { LegalPage, V } from "@/components/LegalPage";
import { legal } from "@/lib/legal";
import { PRICE_MONTHLY, PRICE_LIFETIME } from "@/lib/admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Conditions générales d’utilisation et de vente", description: "CGU et CGV d’IdeaForge : abonnement mensuel, accès à vie, garantie 14 jours satisfait ou remboursé, résiliation.", alternates: { canonical: "/cgv" } };

export default function CGV() {
  const b = legal.brand;
  return (
    <LegalPage title="Conditions générales" updated={legal.updated} current="/cgv">
      <p>
        Les présentes conditions générales d’utilisation et de vente (les « Conditions ») régissent l’utilisation du site {b} ({legal.domain}, le « Service ») et l’achat de ses offres payantes, entre <V>{legal.publisher()}</V> (« nous ») et toute personne qui utilise le Service (« vous »). Créer un compte ou effectuer un achat implique l’acceptation des Conditions en vigueur à cette date (version {legal.termsVersion}).
      </p>

      <h2>1. Le Service</h2>
      <p>{b} propose un catalogue d’idées de business et de logiciels, avec pour chacune une fiche (marché, modèle, concurrence, étapes, risques), un dossier chiffré (projections de revenus et de trésorerie, indicateurs, tableaux et graphiques), des prompts pour construire un produit avec des outils d’intelligence artificielle, un validateur d’idées, un radar des tendances et la génération d’idées par IA. Une partie du catalogue est accessible gratuitement ; l’accès complet est réservé aux membres payants.</p>
      <p><b>Nature des contenus.</b> Les fiches, scores, projections et chiffres de marché sont des <b>analyses et estimations fournies à titre informatif</b>, construites à partir d’hypothèses expliquées dans chaque dossier. Ils ne constituent ni un conseil en investissement, ni un conseil juridique, fiscal ou comptable, ni une promesse de résultat : la réussite d’un projet dépend de nombreux facteurs que nous ne maîtrisons pas. Certains contenus sont produits par des outils d’IA et peuvent contenir des erreurs. Vérifiez les informations importantes avant de prendre une décision, en particulier avant d’investir.</p>

      <h2>2. Compte</h2>
      <p>La création d’un compte est gratuite, par Google, GitHub ou par lien de connexion envoyé par e-mail. Vous devez utiliser une adresse e-mail valide et être âgé·e d’au moins 15 ans ; tout achat nécessite d’être majeur ou d’avoir l’accord d’un représentant légal. Vous êtes responsable de l’usage fait de votre compte. Vous pouvez demander sa suppression à tout moment à <V>{legal.email()}</V>.</p>

      <h2>3. Offres et prix</h2>
      <ul>
        <li><b>Abonnement mensuel</b> : {PRICE_MONTHLY} € par mois, sans engagement. Il donne accès aux fiches et dossiers complets, aux nouvelles idées publiées chaque semaine et à la génération d’idées par IA, tant que l’abonnement est actif.</li>
        <li><b>Accès à vie</b> : {PRICE_LIFETIME} € en un paiement unique (tarif de lancement). Il donne accès à l’ensemble des contenus et fonctionnalités membres, y compris les nouveautés, pour toute la durée d’exploitation du Service (voir l’article 6).</li>
      </ul>
      <p>Les prix sont indiqués en euros, toutes taxes comprises (<V>{legal.vat()}</V>). Le détail des offres figure dans la section Tarifs du site. Le prix applicable est celui affiché au moment de l’achat. Nous pouvons faire évoluer nos prix : une hausse de l’abonnement mensuel vous est notifiée par e-mail au moins 30 jours à l’avance et ne s’applique qu’aux mois suivants ; vous pouvez résilier avant qu’elle ne prenne effet. Le prix de l’accès à vie déjà acheté ne change jamais.</p>

      <h2>4. Paiement</h2>
      <p>Le paiement s’effectue par carte bancaire (ou tout autre moyen proposé) via notre prestataire Stripe. Nous n’avons jamais accès à vos numéros de carte. L’abonnement mensuel est prélevé au début de chaque mois d’abonnement ; l’accès à vie est payé en une fois. L’accès membre est activé dès la confirmation du paiement. En cas d’échec de paiement de l’abonnement, l’accès membre peut être suspendu jusqu’à régularisation. Un reçu vous est envoyé par e-mail pour chaque paiement.</p>

      <h2>5. Abonnement mensuel : durée et résiliation</h2>
      <p>L’abonnement est conclu pour un mois et se renouvelle automatiquement chaque mois, sauf résiliation. Vous pouvez résilier à tout moment, sans frais ni justification, en quelques clics depuis la page <a href="/compte">Mon compte</a> (bouton « Gérer / résilier mon abonnement », également accessible en bas de chaque page), ou en nous écrivant à <V>{legal.email()}</V>. La résiliation prend effet à la fin du mois en cours : vous conservez l’accès jusqu’à cette date et aucun prélèvement supplémentaire n’est effectué.</p>

      <h2>6. Accès à vie</h2>
      <p>« À vie » signifie pour toute la durée d’exploitation du Service par nous ou par un repreneur. L’accès est personnel : il est rattaché à votre compte et ne peut être ni partagé ni revendu. Si nous devions un jour cesser définitivement le Service, nous vous en informerions par e-mail au moins 3 mois à l’avance.</p>

      <h2>7. Garantie « satisfait ou remboursé » et droit de rétractation</h2>
      <p>
        <b>Garantie 14 jours.</b> Si le Service ne vous convient pas, quelle qu’en soit la raison, nous vous remboursons intégralement votre premier paiement (abonnement mensuel ou accès à vie) sur simple demande envoyée à <V>{legal.email()}</V> dans les <b>14 jours</b> suivant l’achat. Le remboursement est effectué sous 14 jours, par le même moyen de paiement, et l’accès membre est alors désactivé.
      </p>
      <p>Cette garantie s’ajoute à votre droit légal de rétractation de 14 jours (article L221-18 du Code de la consommation) et vous permet de vous faire rembourser même si vous avez déjà utilisé le Service. Pour l’exercer, il suffit de nous écrire, par exemple : « Je demande le remboursement de mon achat {b} du … ».</p>

      <h2>8. Demandes de devis</h2>
      <p>Le formulaire « Devis SaaS » permet de nous décrire un projet de développement. La demande est gratuite et sans engagement. Toute prestation éventuelle fait l’objet d’une proposition écrite et de conditions particulières, signées séparément ; les présentes Conditions ne couvrent pas ces prestations.</p>

      <h2>9. Utilisation acceptable et propriété intellectuelle</h2>
      <p>Vous pouvez librement vous inspirer des idées et utiliser les prompts pour créer votre propre activité. En revanche, vous vous engagez à ne pas : republier, revendre ou redistribuer les fiches, dossiers ou contenus membres ; extraire massivement les données du Service (scraping) ; partager votre accès membre ; contourner les mesures de sécurité ou les limites d’usage. En cas de manquement grave, nous pouvons suspendre ou fermer le compte concerné, après vous en avoir informé·e lorsque c’est possible.</p>

      <h2>10. Disponibilité et responsabilité</h2>
      <p>Nous faisons nos meilleurs efforts pour que le Service soit accessible en continu, sans pouvoir le garantir (maintenance, panne d’un prestataire). Notre responsabilité ne saurait être engagée pour les décisions que vous prenez sur la base des contenus du Service, ni pour les résultats de vos projets. Rien dans les présentes ne limite vos droits de consommateur prévus par la loi.</p>

      <h2>11. Données personnelles</h2>
      <p>Le traitement de vos données est décrit dans notre <a href="/confidentialite">Politique de confidentialité</a>.</p>

      <h2>12. Modification des Conditions</h2>
      <p>Nous pouvons modifier les Conditions pour tenir compte de l’évolution du Service ou de la loi. Les modifications importantes vous sont notifiées au moins 30 jours avant leur entrée en vigueur ; si vous les refusez, vous pouvez résilier votre abonnement avant cette date. Les conditions de votre accès à vie déjà acheté ne peuvent pas être réduites.</p>

      <h2>13. Réclamations et médiation</h2>
      <p>Pour toute réclamation, écrivez-nous à <V>{legal.email()}</V> : nous répondons dans les meilleurs délais. Si le différend n’est pas résolu, vous pouvez recourir gratuitement à un médiateur de la consommation (articles L611-1 et suivants du Code de la consommation) : <V>{legal.mediator()}</V>. Vous pouvez aussi utiliser la plateforme européenne de règlement en ligne des litiges.</p>

      <h2>14. Droit applicable</h2>
      <p>Les Conditions sont soumises au droit français. En cas de litige, et à défaut de solution amiable, les tribunaux compétents sont ceux désignés par la loi ; en tant que consommateur, vous bénéficiez en outre des dispositions impératives du droit de votre pays de résidence.</p>

      <h2>Éditeur</h2>
      <p><V>{legal.publisher()}</V> — <V>{legal.status()}</V> — SIRET <V>{legal.siret()}</V> — <V>{legal.address()}</V> — <V>{legal.email()}</V>. Voir aussi les <a href="/mentions-legales">mentions légales</a>.</p>
    </LegalPage>
  );
}
