// Identité légale affichée sur /mentions-legales, /cgv et /confidentialite.
// Les valeurs connues sont renseignées ; le reste se règle dans Vercel → Settings → Environment Variables.
// Une valeur manquante s'affiche en surligné « à compléter » : rien n'est inventé.
const v = (key: string, fallback: string | null, placeholder: string) =>
  process.env[key]?.trim() || fallback || `[${placeholder} — à compléter]`;

export const legal = {
  brand: "IdeaForge",
  domain: "ideaforges.io",
  publisher: () => v("LEGAL_NAME", "Axel Celotto (EI)", "Nom de l'éditeur"),
  status: () => v("LEGAL_STATUS", "Entrepreneur individuel (micro-entreprise)", "Forme juridique"),
  siret: () => v("LEGAL_SIRET", "991 367 202 00017", "Numéro SIRET"),
  address: () => v("LEGAL_ADDRESS", "Place Pasteur, 83120 Sainte-Maxime, France", "Adresse postale"),
  email: () => v("LEGAL_EMAIL", null, "E-mail de contact"),
  phone: () => process.env.LEGAL_PHONE?.trim() || null,
  director: () => v("LEGAL_DIRECTOR", "Axel Celotto", "Directeur de la publication"),
  vat: () => v("LEGAL_VAT", "TVA non applicable, art. 293 B du CGI", "Mention TVA"),
  mediator: () => v("LEGAL_MEDIATOR", "en cours d'adhésion", "Médiateur de la consommation"),
  updated: "9 novembre 2026",
  termsVersion: "2026-11-09",
};

export const isPlaceholder = (s: string) => s.includes("à compléter");
