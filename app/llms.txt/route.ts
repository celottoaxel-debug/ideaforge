import { allIdeas, SITE, ideaFacts } from "@/lib/seo";
import { COLLECTIONS } from "@/lib/collections";
import { PRICE_LIFETIME, PRICE_MONTHLY } from "@/lib/admin";

export const revalidate = 3600;

// /llms.txt : résumé du site pour les moteurs de réponse IA (ChatGPT, Perplexity, Claude, Gemini).
export async function GET() {
  const ideas = await allIdeas();
  const lines = [
    "# IdeaForge",
    "",
    `> IdeaForge (${SITE}) est un catalogue de ${ideas.length} idées de business et de SaaS analysées et chiffrées : budget de départ, revenus projetés sur 24 mois (3 scénarios), unit economics (LTV, CAC), concurrents, risques, plan de lancement de 12 semaines et prompts pour construire le produit avec l'IA. Site en français, avec des versions anglaise et espagnole.`,
    "",
    "Les projections sont des estimations fondées sur des hypothèses publiées dans chaque fiche, pas des promesses de résultat.",
    "",
    "## Offres",
    `- Accès à vie : ${PRICE_LIFETIME} € en paiement unique (toutes les fiches, nouveautés, pack de 50 prompts), garantie 14 jours.`,
    `- Abonnement : ${PRICE_MONTHLY} € par mois, sans engagement.`,
    `- Gratuit : aperçu des fiches, validateur d'idées : ${SITE}/validate`,
    "",
    "## Idées par thème",
    ...COLLECTIONS.map((c) => `- [${c.h1}](${SITE}/idees/${c.slug}) : ${c.description}`),
    "",
    "## Fiches idées",
    ...ideas.map((it) => {
      const f = ideaFacts(it);
      return `- [${it.title}](${SITE}/idea/${it.id}) : ${it.pitch ?? ""} Budget ${f.budget}, revenus ${it.revenue ?? "n/c"}, ~${f.mrr12Txt}/mois projetés à 12 mois.`;
    }),
    "",
    "## Autres pages",
    `- [Pack de 50 prompts IA](${SITE}/prompts)`,
    `- [Radar des tendances](${SITE}/radar)`,
    `- [Conditions générales](${SITE}/cgv)`,
    `- Contact : ideasforges.io@gmail.com`,
  ];
  return new Response(lines.join("\n"), { headers: { "content-type": "text/plain; charset=utf-8" } });
}
