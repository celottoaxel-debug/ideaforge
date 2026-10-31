import type { Idea } from "@/lib/types";

// Prompt de création "prêt à coller dans Claude".
// Utilise le prompt sur mesure de l'idée s'il existe, sinon en génère un détaillé depuis ses champs.
export function buildPrompt(it: Idea): string {
  if (it.prompt && it.prompt.trim()) return it.prompt.trim();

  const isSaaS = /SaaS|IA|Tech/.test(it.sector);
  const L: string[] = [];
  L.push(`Tu es une équipe produit + design + développement full-stack senior. Construis ${isSaaS ? "une application web (SaaS)" : "un site web professionnel"} complète, fonctionnelle et prête à déployer, à partir de ce brief. Travaille en autonomie et documente tes décisions.`);
  L.push("");
  L.push(`PROJET : ${it.title}`);
  if (it.pitch) L.push(`CONCEPT : ${it.pitch}`);
  L.push(`SECTEUR : ${it.sector}${it.markets ? ` (marchés : ${it.markets})` : ""}`);
  if (it.market) L.push(`PROBLÈME / MARCHÉ : ${it.market}`);
  if (it.model) L.push(`MODÈLE ÉCONOMIQUE : ${it.model}`);
  if (it.benchmark) L.push(`RÉFÉRENCE MARCHÉ : ${it.benchmark}`);
  L.push("");
  if (isSaaS) {
    L.push("FONCTIONNALITÉS (MVP d'abord) :");
    L.push("- Page d'accueil claire + inscription / connexion (sessions sécurisées)");
    L.push("- Onboarding jusqu'à la première valeur");
    L.push("- Tableau de bord pour la fonction cœur ci-dessus");
    L.push("- CRUD complet sur l'entité principale (créer, lister, filtrer, modifier, supprimer)");
    L.push("- Paramètres de compte + facturation par abonnement (Stripe)");
    L.push("");
    L.push("TECHNIQUE : Next.js + TypeScript, base de données PostgreSQL (ORM Prisma), API serveur, code propre et commenté. Secrets en variables d'environnement.");
    L.push("NON-FONCTIONNEL : sécurité (hash mots de passe, validation, autorisation serveur), RGPD, responsive, accessibilité.");
  } else {
    L.push("CONTENU DU SITE : hero avec promesse, présentation de l'offre et bénéfices, preuve sociale, tarifs/prestations, formulaire de contact/réservation, SEO local. Design moderne et responsive, contenu en français prêt à l'emploi.");
  }
  L.push("");
  if (it.steps?.length) L.push("ÉTAPES DE LANCEMENT (contexte business) : " + it.steps.join(" / "));
  if (it.risks?.length) L.push("POINTS DE VIGILANCE : " + it.risks.join(" / "));
  L.push("");
  L.push("Commence par un MVP fonctionnel que je peux lancer et tester tout de suite, puis propose les étapes suivantes. Si une info essentielle manque, pose-moi UNE question ciblée ; sinon, commence directement.");
  return L.join("\n");
}
