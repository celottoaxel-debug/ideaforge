import type { Idea } from "@/lib/types";
import { ideaFacts } from "@/lib/seo";

// Pages thématiques /idees/[slug] : chaque page cible une recherche précise,
// avec un texte d'introduction unique, la liste chiffrée des idées et une FAQ.
export type Collection = {
  slug: string;
  h1: string;
  title: string;          // balise <title>
  description: string;    // meta description
  intro: string[];        // paragraphes uniques
  filter: (it: Idea) => boolean;
  faq: { q: string; a: string }[];
};

const weeks = (it: Idea) => {
  const m = (it.delai || "").match(/(\d+)\s*(?:–|-)?\s*(\d+)?\s*sem/);
  return m ? Number(m[2] || m[1]) : 99;
};
const LOCAL = /Services|Restauration|Artisanat|Écologie|Bien-être|Événementiel|E-commerce|Éducation/;

export const COLLECTIONS: Collection[] = [
  {
    slug: "idees-business-ia",
    h1: "Idées de business avec l'IA",
    title: "Idées de business avec l'IA à lancer en 2026 (chiffrées)",
    description: "Les meilleures idées de business basées sur l'intelligence artificielle : agents IA, micro-SaaS, outils verticaux. Budget, revenus sur 12 mois et concurrents pour chaque idée.",
    intro: [
      "L'intelligence artificielle a fait chuter le coût de construction d'un logiciel : un fondateur seul peut aujourd'hui lancer un agent qui rédige, trie, répond au téléphone ou prépare des documents, là où il fallait une équipe il y a trois ans.",
      "Les idées ci-dessous ont un point commun : elles vendent un résultat concret (des appels qui ne sont plus manqués, des tickets résolus, des rendez-vous décrochés) à des clients qui paient déjà pour le problème. Chaque fiche détaille le budget de départ, le revenu projeté sur 24 mois, les concurrents et les risques, comme les coûts d'IA ou la fiabilité des réponses.",
    ],
    filter: (it) => /\bIA\b|agent|GPT|intelligence artificielle/i.test([it.title, it.pitch, ...(it.tags || [])].join(" ")),
    faq: [
      { q: "Faut-il savoir coder pour lancer un business IA ?", a: "Plus forcément. Les outils de génération d'applications (Lovable, Bolt, Claude) permettent de construire un premier produit en quelques semaines. Pour un produit qui manipule des données sensibles, un développeur reste conseillé pour la sécurité." },
      { q: "Quel est le principal risque d'un business basé sur l'IA ?", a: "La dépendance aux fournisseurs de modèles : leurs prix et leurs capacités changent vite. Les meilleures idées se protègent par une spécialisation métier, des données propres au client et une intégration dans ses outils." },
      { q: "Combien coûtent les appels à l'IA ?", a: "De quelques centimes à quelques euros par client et par mois selon l'usage. Les dossiers IdeaForge intègrent ce coût dans la marge brute de chaque idée." },
    ],
  },
  {
    slug: "idees-micro-saas",
    h1: "Idées de micro-SaaS rentables",
    title: "Idées de micro-SaaS rentables à lancer seul",
    description: "Des idées de micro-SaaS à lancer seul ou à deux : petit budget, abonnement mensuel, revenus récurrents. Prix conseillés, projections et premiers clients pour chaque idée.",
    intro: [
      "Un micro-SaaS est un petit logiciel en ligne, vendu par abonnement, qui règle un problème précis pour une niche précise. Il se construit en quelques semaines, se gère seul et peut générer de quelques centaines à plusieurs dizaines de milliers d'euros par mois.",
      "La sélection ci-dessous privilégie les idées accessibles techniquement, avec une demande prouvée par des acteurs qui publient leurs revenus. Pour chacune, tu trouveras une grille de prix en trois offres, le nombre de clients à atteindre pour vivre de ton produit et les canaux pour trouver les premiers utilisateurs.",
    ],
    filter: (it) => it.sector === "Micro-SaaS / IA" && (it.difficulty ?? 2) <= 2,
    faq: [
      { q: "Combien de clients faut-il pour vivre d'un micro-SaaS ?", a: "À 29 € par mois, environ 140 clients donnent 4 000 € de revenu mensuel. Chaque fiche calcule ce nombre selon le prix moyen réel de l'idée." },
      { q: "Combien de temps pour lancer un micro-SaaS ?", a: "Entre 4 et 10 semaines pour une première version payante si l'on se concentre sur une seule fonction cœur." },
      { q: "Comment trouver ses premiers clients ?", a: "Les canaux les plus efficaces au départ sont le SEO sur des recherches précises, les communautés de la cible et la prospection directe. Chaque fiche propose une répartition chiffrée des canaux." },
    ],
  },
  {
    slug: "idees-saas-b2b",
    h1: "Idées de SaaS B2B à fort potentiel",
    title: "Idées de SaaS B2B à fort potentiel (marché, prix, concurrents)",
    description: "Idées de logiciels B2B pour PME et professionnels : conformité, RH, finance, santé, voyage. Taille de marché, grille tarifaire, cycle de vente et projection sur 24 mois.",
    intro: [
      "Les logiciels vendus aux entreprises ont deux atouts : des clients qui restent longtemps (souvent plusieurs années) et des paniers élevés. En contrepartie, ils demandent plus de budget et un cycle de vente plus long.",
      "Les idées de cette page visent des marchés où des leaders ont déjà prouvé la demande, comme Pennylane, Factorial ou Doctolib, mais où des segments restent mal servis : petites entreprises, métiers spécifiques, pays moins couverts. Chaque dossier montre le temps nécessaire pour rembourser la mise de départ, souvent plus long qu'un micro-SaaS mais pour une activité plus solide.",
    ],
    filter: (it) => it.sector === "Tech / SaaS",
    faq: [
      { q: "Quel budget pour lancer un SaaS B2B ?", a: "Selon les idées, de 1 500 € pour une première version ciblée à plus de 20 000 € pour un logiciel métier réglementé (santé, finance)." },
      { q: "Pourquoi le B2B est-il intéressant ?", a: "Les entreprises changent rarement de logiciel une fois installé : le taux de départ mensuel est souvent de 1 à 3 %, contre 5 à 10 % pour une application grand public." },
    ],
  },
  {
    slug: "idees-business-petit-budget",
    h1: "Idées de business à lancer avec moins de 1 000 €",
    title: "Idées de business avec petit budget (moins de 1 000 €)",
    description: "Lancer un business sans gros investissement : idées accessibles avec moins de 1 000 €, revenus estimés, temps de lancement et premiers clients.",
    intro: [
      "Pas besoin de lever des fonds ni d'emprunter pour démarrer : beaucoup d'activités en ligne se lancent avec un ordinateur, quelques abonnements à des outils et du temps.",
      "Toutes les idées de cette page ont un budget de départ minimum inférieur ou égal à 1 000 €. Pour chacune, le dossier détaille comment répartir ce budget, en combien de mois l'activité devient rentable et combien de clients il faut pour atteindre un premier revenu significatif.",
    ],
    filter: (it) => (it.budget_min ?? 99_999) <= 1000,
    faq: [
      { q: "Peut-on vraiment lancer un business avec moins de 1 000 € ?", a: "Oui, à condition de construire soi-même (avec l'aide de l'IA) et de miser sur des canaux d'acquisition gratuits comme le contenu, le SEO et la prospection." },
      { q: "Quel statut choisir pour démarrer ?", a: "En France, la micro-entreprise est le statut le plus simple pour tester une activité. Fais-toi confirmer le choix par un expert-comptable selon ta situation." },
    ],
  },
  {
    slug: "idees-business-rentables-rapidement",
    h1: "Idées de business rapides à lancer",
    title: "Idées de business rapides à lancer (moins de 2 mois)",
    description: "Des idées de business qui se lancent en moins de 8 semaines : délai, budget, revenus projetés et premières étapes détaillées.",
    intro: [
      "Le meilleur moyen de valider une idée est de la mettre vite face à de vrais clients. Les activités de cette page peuvent être lancées en 8 semaines ou moins, avec une première version simple mais vendable.",
      "Pour chaque idée, la feuille de route de 12 semaines découpe le lancement en étapes concrètes, et le dossier indique le mois à partir duquel le résultat mensuel devient positif dans le scénario réaliste.",
    ],
    filter: (it) => weeks(it) <= 8,
    faq: [
      { q: "Comment lancer en moins de 2 mois ?", a: "En limitant la première version à une seule fonction qui règle le problème principal, en utilisant des outils existants (paiement, hébergement, e-mails) et en cherchant ses premiers clients dès la première semaine." },
    ],
  },
  {
    slug: "idees-business-a-lancer-seul",
    h1: "Idées de business à lancer seul",
    title: "Idées de business à lancer seul (solopreneur)",
    description: "Idées d'entreprise adaptées aux solopreneurs : difficulté accessible, budget limité, gestion possible seul. Revenus estimés et plan de lancement.",
    intro: [
      "Lancer seul, c'est garder 100 % des décisions et des revenus, mais aussi tout porter : produit, vente, support. Les idées de cette page sont choisies pour rester gérables par une seule personne, avec une difficulté accessible et un budget de départ de 3 000 € maximum.",
      "Chaque dossier précise le temps de mise en route, les tâches à automatiser en priorité et le nombre de clients nécessaires pour en vivre.",
    ],
    filter: (it) => (it.difficulty ?? 3) <= 2 && (it.budget_min ?? 99_999) <= 3000,
    faq: [
      { q: "Quel business lancer seul en 2026 ?", a: "Les micro-SaaS de niche, les services packagés (vidéo, conciergerie) et les outils pour une profession précise sont les plus adaptés : ils se vendent sans équipe commerciale." },
    ],
  },
  {
    slug: "idees-business-local",
    h1: "Idées de business local et de services",
    title: "Idées de business local et de services rentables",
    description: "Idées d'activités locales : services, commerce, artisanat, restauration, écologie. Investissement, panier moyen, clients à atteindre et risques.",
    intro: [
      "Toutes les bonnes idées ne sont pas des logiciels. Les activités de proximité (services à domicile, ateliers, commerces ambulants, agences locales) profitent d'une concurrence souvent faible hors des grandes villes et d'une clientèle fidèle.",
      "Les dossiers de ces idées raisonnent en panier moyen, en fréquence d'achat et en coûts fixes (local, matériel, déplacements), pour montrer honnêtement le temps nécessaire avant de rembourser l'investissement de départ.",
    ],
    filter: (it) => LOCAL.test(it.sector) && !it.is_ai,
    faq: [
      { q: "Quel business local est le plus rentable ?", a: "Ceux qui combinent une clientèle récurrente (abonnements, contrats avec des professionnels) et des coûts fixes maîtrisés. Les dossiers comparent ces deux points pour chaque idée." },
    ],
  },
  {
    slug: "idees-revenus-recurrents",
    h1: "Idées de business à revenus récurrents",
    title: "Idées de business à revenus récurrents (abonnement)",
    description: "Construire un revenu mensuel prévisible : idées de business par abonnement, prix conseillés, taux de départ et valeur d'un client sur sa durée de vie.",
    intro: [
      "Un revenu récurrent, c'est un client qui paie chaque mois sans qu'il faille le reconvaincre. C'est le modèle le plus valorisé par les investisseurs et le plus confortable pour un fondateur.",
      "Les idées de cette page reposent sur un abonnement. Leurs dossiers calculent la valeur d'un client sur toute sa durée de vie (LTV), le coût pour l'acquérir (CAC) et le ratio entre les deux, l'indicateur clé d'une activité récurrente saine.",
    ],
    filter: (it) => ideaFacts(it).kind === "saas" && /récurrent|abonnement|SaaS/i.test([it.model, it.revenue, it.sector, ...(it.tags || [])].join(" ")),
    faq: [
      { q: "Qu'est-ce qu'un bon ratio LTV / CAC ?", a: "Au moins 3 : un client doit rapporter trois fois ce qu'il a coûté à acquérir. Chaque dossier IdeaForge affiche ce ratio." },
    ],
  },
  {
    slug: "idees-business-espagne",
    h1: "Idées de business en Espagne",
    title: "Idées de business qui marchent en Espagne",
    description: "Opportunités sur le marché espagnol : indépendants, concours publics, padel, copropriétés, restauration. Idées chiffrées et acteurs locaux de référence.",
    intro: [
      "L'Espagne compte plus de 3 millions de travailleurs indépendants et plusieurs scale-ups qui ont prouvé des marchés entiers (Factorial, TravelPerk, Playtomic). Beaucoup de niches restent pourtant mal équipées.",
      "Les idées de cette page sont pensées pour le marché espagnol et souvent transposables en Amérique latine. Chaque dossier cite les acteurs locaux de référence et les spécificités du pays.",
    ],
    filter: (it) => it.id.startsWith("es-") || /ES · LATAM/.test(it.markets || ""),
    faq: [
      { q: "Faut-il parler espagnol pour lancer en Espagne ?", a: "Pour un produit et un support de qualité, oui, ou s'associer à quelqu'un qui le parle : les clients attendent une expérience entièrement en espagnol." },
    ],
  },
  {
    slug: "idees-business-usa",
    h1: "Idées de business inspirées du marché américain",
    title: "Idées de business qui marchent aux États-Unis, à adapter en Europe",
    description: "Des modèles qui génèrent déjà des revenus aux États-Unis, à adapter au marché français et européen : API, outils pour créateurs, productivité.",
    intro: [
      "Beaucoup de logiciels rentables naissent aux États-Unis avant d'arriver, parfois des années plus tard, en Europe. Adapter un modèle qui a déjà prouvé sa demande réduit fortement le risque.",
      "Les idées de cette page s'inspirent d'outils américains qui publient leurs revenus. Leurs dossiers indiquent ce qu'il faut adapter : langue, conformité RGPD, moyens de paiement et prix.",
    ],
    filter: (it) => it.id.startsWith("us-"),
    faq: [
      { q: "Copier une idée américaine, est-ce une bonne stratégie ?", a: "Oui, si l'on adapte vraiment le produit au marché local (langue, réglementation, habitudes) au lieu de traduire simplement l'interface." },
    ],
  },
];

export const findCollection = (slug: string) => COLLECTIONS.find((c) => c.slug === slug);

// Collections dont fait partie une idée (pour le maillage interne).
export function collectionsOf(it: Idea) {
  return COLLECTIONS.filter((c) => { try { return c.filter(it); } catch { return false; } });
}
