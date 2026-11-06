import type { Dossier } from "../engine";

export const SAMPLE: Record<string, Dossier> = {
  "x-aeo": {
    kind: "saas", tiers: [["Solo", 49, "1 domaine, 50 requêtes suivies, 3 assistants IA"], ["Pro", 149, "3 domaines, 300 requêtes, 6 assistants, recommandations IA"], ["Agence", 399, "20 domaines, rapports en marque blanche, accès API"]],
    mix: [50, 38, 12], cac: 450, churn: 4.5, margin: 76, fixed: 1400, target: 110,
    persona: "Responsable marketing ou SEO d'une PME / scale-up B2B (20 à 300 salariés), ou agence SEO qui gère 10 à 50 clients.",
    pain: "Le trafic Google baisse et personne ne sait si ChatGPT, Perplexity ou Gemini recommandent la marque, ni comment y apparaître.",
    example: "Une marque de logiciel RH suit 80 questions du type « meilleur logiciel de paie pour PME ». Le tableau de bord montre qu'elle n'est citée que dans 12 % des réponses de ChatGPT contre 41 % pour son concurrent principal. L'outil lui suggère 5 pages à créer et 3 annuaires où apparaître ; six semaines plus tard, sa part de citation passe à 27 % et le rapport mensuel part automatiquement à la direction.",
    facts: [["800 M+", "utilisateurs hebdomadaires de ChatGPT annoncés par OpenAI fin 2025"], ["≈ 25 %", "de baisse du volume de recherche classique anticipée par Gartner d'ici 2026 au profit des assistants IA"], ["~156 k$/mois", "revenu public revendiqué par AEO Engine, signe que des clients paient déjà"]],
    comps: [["Profound", "≈ 499 $/mois et plus", "Données très complètes, clients grands comptes", "Trop cher et complexe pour les PME"], ["Otterly.ai", "≈ 29 à 189 $/mois", "Simple, abordable", "Peu de recommandations actionnables"], ["Semrush (module IA)", "inclus dans les offres ≈ 140 $+/mois", "Base installée énorme", "Fonction secondaire, peu approfondie"]],
    channels: [["Contenu & SEO (études de cas, baromètres)", 35, "Publier chaque mois un baromètre « qui est cité par l'IA » par secteur"], ["Partenariats agences SEO", 30, "Offre Agence en marque blanche + commission de 20 %"], ["LinkedIn (fondateur)", 20, "Posts avec captures avant / après de citations"], ["Publicité Google / LinkedIn", 15, "Mots-clés « GEO », « AEO », « visibilité ChatGPT »"]],
    risks: [[3, 2], [2, 2]],
  },
  concierge: {
    kind: "local", unit: "/logement/mois", tiers: [["Essentiel", 180, "Ménage, linge, check-in autonome (≈ 18 % des revenus)"], ["Sérénité", 290, "+ gestion des annonces, prix dynamiques, messagerie 7j/7"], ["Premium", 420, "+ photos pro, maintenance, conciergerie voyageurs"]],
    mix: [35, 50, 15], freq: 1, cac: 400, churn: 3, margin: 42, fixed: 1600, target: 28,
    persona: "Propriétaire d'1 à 3 logements en location courte durée, actif ou expatrié, qui n'a pas le temps de gérer les voyageurs.",
    pain: "Les check-in tardifs, le ménage entre deux séjours et les messages des voyageurs lui prennent 6 à 10 h par mois et par logement.",
    example: "Un couple possède un T2 à Annecy loué 160 €/nuit. Avec la formule Sérénité, le taux d'occupation passe de 58 % à 71 % grâce aux prix dynamiques et à la réactivité des réponses. Leur revenu net augmente d'environ 420 € par mois après la commission, et ils ne gèrent plus rien.",
    facts: [["800 000+", "logements proposés en location courte durée en France"], ["18–25 %", "commission habituelle des conciergeries sur le revenu locatif"], ["≈ 60 %", "taux d'occupation moyen hors très grandes zones touristiques (estimation)"]],
    comps: [["Conciergeries nationales (ex. HostnFly)", "≈ 20–25 % des revenus", "Notoriété, couverture large", "Service standardisé, peu d'ancrage local"], ["Conciergeries locales indépendantes", "18–22 %", "Proximité", "Peu outillées, qualité variable"], ["Gestion en direct par le propriétaire", "0 % mais 6–10 h/mois", "Contrôle total", "Fatigue, notes en baisse"]],
    channels: [["Bouche-à-oreille & parrainage", 35, "1 mois offert par propriétaire recommandé"], ["Prospection des annonces Airbnb de la zone", 30, "Message aux hôtes avec notes < 4,7 ou calendrier vide"], ["Agences immobilières & notaires", 20, "Commission de 1 mois de gestion par mandat apporté"], ["Google Business & SEO local", 15, "« conciergerie airbnb + ville »"]],
    risks: [[2, 3], [3, 2], [2, 2]],
  },
};
