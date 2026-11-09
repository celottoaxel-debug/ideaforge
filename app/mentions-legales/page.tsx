import { LegalPage, V } from "@/components/LegalPage";
import { legal } from "@/lib/legal";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mentions légales — IdeaForge", description: "Mentions légales du site IdeaForge (ideaforges.io)." };

export default function MentionsLegales() {
  return (
    <LegalPage title="Mentions légales" updated={legal.updated} current="/mentions-legales">
      <p>Conformément à l’article 6 de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l’économie numérique (LCEN), voici les informations relatives à l’éditeur et aux hébergeurs du site {legal.brand} ({legal.domain}).</p>

      <h2>Éditeur du site</h2>
      <ul>
        <li><b>Éditeur :</b> <V>{legal.publisher()}</V>, exerçant sous le nom commercial {legal.brand}</li>
        <li><b>Forme juridique :</b> <V>{legal.status()}</V></li>
        <li><b>SIRET :</b> <V>{legal.siret()}</V></li>
        <li><b>Adresse :</b> <V>{legal.address()}</V></li>
        <li><b>E-mail :</b> <V>{legal.email()}</V></li>
        {legal.phone() && <li><b>Téléphone :</b> {legal.phone()}</li>}
        <li><b>TVA :</b> <V>{legal.vat()}</V></li>
        <li><b>Directeur de la publication :</b> <V>{legal.director()}</V></li>
      </ul>

      <h2>Hébergement</h2>
      <ul>
        <li><b>Site web :</b> Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis — vercel.com</li>
        <li><b>Base de données et comptes :</b> Supabase Inc. — données hébergées dans l’Union européenne (Paris, région AWS eu-west-3) — supabase.com</li>
        <li><b>Paiements :</b> Stripe Payments Europe Ltd., 1 Grand Canal Street Lower, Dublin 2, Irlande — stripe.com</li>
      </ul>

      <h2>Contenus du site</h2>
      <p>Les fiches, dossiers, projections financières, scores et plans publiés sur {legal.brand} sont des analyses et des estimations fournies à titre informatif. Ils ne constituent ni un conseil en investissement, ni un conseil juridique, fiscal ou comptable, ni une garantie de résultat. Une partie des contenus (idées découvertes automatiquement, rapports du validateur, idées générées) est produite à l’aide d’outils d’intelligence artificielle et peut contenir des erreurs. Les chiffres attribués à des entreprises tierces proviennent de déclarations publiques et peuvent avoir évolué.</p>
      <p>Les marques et noms d’entreprises cités (concurrents, références de marché) appartiennent à leurs titulaires respectifs et ne sont mentionnés qu’à titre d’information ; leur citation n’implique aucun partenariat.</p>

      <h2>Propriété intellectuelle</h2>
      <p>La marque {legal.brand}, le logo, la charte graphique, les textes, les fiches, les dossiers, les graphiques et le code du site sont protégés. Toute reproduction, republication ou revente, totale ou partielle, sans autorisation écrite est interdite. Vous restez libre de vous inspirer des idées présentées pour créer votre propre activité : c’est l’objet du service.</p>

      <h2>Contact</h2>
      <p>Pour toute question, signalement de contenu ou demande concernant vos données : <V>{legal.email()}</V>.</p>
    </LegalPage>
  );
}
