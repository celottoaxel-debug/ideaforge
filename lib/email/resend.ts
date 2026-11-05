// Envoi d'e-mails via l'API HTTP de Resend (pas de dépendance npm).
// Variables : RESEND_API_KEY (obligatoire), EMAIL_FROM (optionnel), EMAIL_REPLY_TO (optionnel).

export type Email = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  unsubscribeUrl?: string; // ajoute les en-têtes List-Unsubscribe (Gmail / Apple Mail)
  tag?: string;
};

const FROM = process.env.EMAIL_FROM || "IdeaForge <hello@ideaforges.io>";
const REPLY_TO = process.env.EMAIL_REPLY_TO || process.env.ADMIN_EMAIL?.split(",")[0] || "celottoaxel@gmail.com";

function payload(e: Email) {
  const headers: Record<string, string> = {};
  if (e.unsubscribeUrl) {
    headers["List-Unsubscribe"] = `<${e.unsubscribeUrl}>`;
    headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";
  }
  return {
    from: FROM,
    to: [e.to],
    reply_to: REPLY_TO,
    subject: e.subject,
    html: e.html,
    ...(e.text ? { text: e.text } : {}),
    ...(Object.keys(headers).length ? { headers } : {}),
    ...(e.tag ? { tags: [{ name: "type", value: e.tag }] } : {}),
  };
}

export function emailEnabled() {
  return !!process.env.RESEND_API_KEY;
}

// Un e-mail. Ne lève jamais d'erreur : renvoie false et logue si l'envoi échoue.
export async function sendEmail(e: Email): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("[email] RESEND_API_KEY absente — e-mail non envoyé :", e.subject);
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload(e)),
    });
    if (!res.ok) {
      console.error("[email] Resend", res.status, await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error("[email] erreur réseau", err);
    return false;
  }
}

// Envoi groupé (jusqu'à 100 par appel Resend). Renvoie le nombre d'e-mails acceptés.
export async function sendBatch(list: Email[]): Promise<number> {
  const key = process.env.RESEND_API_KEY;
  if (!key || list.length === 0) return 0;
  let ok = 0;
  for (let i = 0; i < list.length; i += 100) {
    const chunk = list.slice(i, i + 100);
    try {
      const res = await fetch("https://api.resend.com/emails/batch", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify(chunk.map(payload)),
      });
      if (res.ok) ok += chunk.length;
      else console.error("[email] batch", res.status, await res.text());
    } catch (err) {
      console.error("[email] batch erreur réseau", err);
    }
  }
  return ok;
}
