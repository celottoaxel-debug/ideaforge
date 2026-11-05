import { createHmac, timingSafeEqual } from "crypto";

// Lien de désinscription signé : impossible de désinscrire quelqu'un d'autre sans le lien reçu.
function secret() {
  return process.env.EMAIL_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "ideaforge-dev";
}

export function unsubToken(email: string) {
  return createHmac("sha256", secret()).update(email.trim().toLowerCase()).digest("base64url").slice(0, 32);
}

export function checkUnsubToken(email: string, token: string) {
  const a = Buffer.from(unsubToken(email));
  const b = Buffer.from(token || "");
  return a.length === b.length && timingSafeEqual(a, b);
}

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://ideaforges.io").replace(/\/$/, "");
}

export function unsubUrl(email: string) {
  return `${siteUrl()}/api/unsubscribe?e=${encodeURIComponent(email)}&t=${unsubToken(email)}`;
}
