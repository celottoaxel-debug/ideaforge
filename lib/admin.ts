// E-mails autorisés à accéder au panel admin (modifiable via la variable ADMIN_EMAIL, séparés par des virgules).
export const ADMIN_EMAILS = (process.env.ADMIN_EMAIL || "celottoaxel@gmail.com")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

export function isAdminEmail(email?: string | null): boolean {
  return !!email && ADMIN_EMAILS.includes(email.toLowerCase());
}

// Tarifs (euros) pour le calcul des revenus.
export const PRICE_MONTHLY = 39;
export const PRICE_LIFETIME = 129;

export const euro = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
