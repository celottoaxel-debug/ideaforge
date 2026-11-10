// Gabarits d'e-mails IdeaForge, aux couleurs du site (vert #22a86a, forêt #003d30, police Geist/system).
// Aucun import : ce fichier reste « pur » (utilisable côté serveur et pour générer des aperçus).

export type Lang = "fr" | "en" | "es";
export type MailIdea = { id: string; title: string; pitch?: string | null; budget?: string | null; revenue?: string | null; sector?: string | null };
export type Rendered = { subject: string; html: string; text: string };

const C = {
  bg: "#f4f5f2", card: "#ffffff", ink: "#0c1512", ink2: "#44554f", ink3: "#808e88",
  line: "#e9e8e3", green: "#22a86a", greenDeep: "#0f7a4a", greenWash: "#e7f5ed", forest: "#003d30", amber: "#e09b13",
};
const FONT = `'Geist','Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif`;

export function lang(l?: string | null): Lang {
  return l === "en" || l === "es" ? l : "fr";
}

export function esc(s: unknown) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ---------- briques ----------
export function button(label: string, href: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:26px 0 6px"><tr><td style="border-radius:12px;background:${C.green};background-image:linear-gradient(180deg,${C.green} 0%,${C.greenDeep} 100%)">
<a href="${href}" style="display:inline-block;padding:14px 26px;font-family:${FONT};font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:12px">${label}</a></td></tr></table>`;
}

const h1 = (s: string) => `<h1 style="margin:0 0 12px;font-family:${FONT};font-size:26px;line-height:1.25;font-weight:700;letter-spacing:-0.02em;color:${C.ink}">${s}</h1>`;
const p = (s: string) => `<p style="margin:0 0 14px;font-family:${FONT};font-size:16px;line-height:1.6;color:${C.ink2}">${s}</p>`;
const eyebrow = (s: string) => `<div style="margin:0 0 10px;font-family:${FONT};font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:${C.green}">${s}</div>`;

function list(items: string[]) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 4px;width:100%">${items
    .map(
      (it, i) => `<tr><td valign="top" style="width:30px;padding:7px 0"><div style="width:22px;height:22px;border-radius:7px;background:${C.greenWash};color:${C.greenDeep};font-family:${FONT};font-size:12px;font-weight:700;line-height:22px;text-align:center">${i + 1}</div></td>
<td style="padding:7px 0;font-family:${FONT};font-size:15px;line-height:1.55;color:${C.ink2}">${it}</td></tr>`
    )
    .join("")}</table>`;
}

function checks(items: string[]) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 4px">${items
    .map((it) => `<tr><td valign="top" style="width:26px;padding:5px 0;font-family:${FONT};font-size:15px;color:${C.green};font-weight:700">✓</td><td style="padding:5px 0;font-family:${FONT};font-size:15px;line-height:1.5;color:${C.ink2}">${it}</td></tr>`)
    .join("")}</table>`;
}

function ideaCards(ideas: MailIdea[], site: string, cta: string) {
  return ideas
    .map(
      (i) => `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 12px;border:1px solid ${C.line};border-radius:14px"><tr><td style="padding:18px 20px">
${i.sector ? `<div style="font-family:${FONT};font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:${C.ink3};margin-bottom:6px">${esc(i.sector)}</div>` : ""}
<div style="font-family:${FONT};font-size:17px;font-weight:700;color:${C.ink};margin-bottom:6px">${esc(i.title)}</div>
${i.pitch ? `<div style="font-family:${FONT};font-size:14px;line-height:1.55;color:${C.ink2};margin-bottom:10px">${esc(i.pitch)}</div>` : ""}
<div style="font-family:${FONT};font-size:13px;color:${C.ink3}">${i.budget ? `💶 ${esc(i.budget)}` : ""}${i.budget && i.revenue ? " &nbsp;·&nbsp; " : ""}${i.revenue ? `📈 ${esc(i.revenue)}` : ""}</div>
<a href="${site}/idea/${encodeURIComponent(i.id)}" style="display:inline-block;margin-top:12px;font-family:${FONT};font-size:14px;font-weight:600;color:${C.greenDeep};text-decoration:none">${cta} →</a>
</td></tr></table>`
    )
    .join("");
}

const FOOT: Record<Lang, { why: string; unsub: string; tx: string }> = {
  fr: { why: "Tu reçois cet e-mail parce que tu t'es inscrit sur IdeaForge.", unsub: "Se désabonner", tx: "E-mail lié à ton compte IdeaForge." },
  en: { why: "You're receiving this because you signed up to IdeaForge.", unsub: "Unsubscribe", tx: "Email about your IdeaForge account." },
  es: { why: "Recibes este correo porque te registraste en IdeaForge.", unsub: "Darse de baja", tx: "Correo sobre tu cuenta de IdeaForge." },
};

// Mise en page commune. unsub = lien de désinscription (e-mails marketing uniquement).
export function layout(o: { body: string; preheader?: string; lang?: Lang; site: string; unsub?: string; marketing?: boolean }) {
  const f = FOOT[o.lang ?? "fr"];
  const foot = o.marketing && o.unsub
    ? `${f.why} <a href="${o.unsub}" style="color:${C.ink3};text-decoration:underline">${f.unsub}</a>`
    : f.tx;
  return `<!DOCTYPE html><html lang="${o.lang ?? "fr"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><title>IdeaForge</title></head>
<body style="margin:0;padding:0;background:${C.bg};-webkit-font-smoothing:antialiased">
${o.preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${esc(o.preheader)}&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;</div>` : ""}
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${C.bg}"><tr><td align="center" style="padding:36px 16px">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px">
<tr><td style="padding:0 6px 18px"><a href="${o.site}" style="text-decoration:none"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td style="width:30px;height:30px;border-radius:9px;background:${C.forest};color:#ffffff;font-family:${FONT};font-size:12.5px;font-weight:800;text-align:center;line-height:30px">IF</td>
<td style="padding-left:10px;font-family:${FONT};font-size:17px;font-weight:700;color:${C.ink};letter-spacing:-0.01em">IdeaForge</td></tr></table></a></td></tr>
<tr><td style="background:${C.card};border:1px solid ${C.line};border-radius:18px;padding:34px 32px;box-shadow:0 2px 4px rgba(12,21,18,.04),0 12px 28px -14px rgba(12,21,18,.18)">${o.body}</td></tr>
<tr><td style="padding:20px 8px 0;font-family:${FONT};font-size:12px;line-height:1.6;color:${C.ink3};text-align:center">${foot}<br><a href="${o.site}" style="color:${C.ink3};text-decoration:none">ideaforges.io</a></td></tr>
</table></td></tr></table></body></html>`;
}

// Version texte brut (meilleure délivrabilité).
function toText(html: string) {
  return html
    .replace(/<head>[\s\S]*?<\/head>/, "")
    .replace(/<div style="display:none[\s\S]*?<\/div>/, "")
    .replace(/<\/td>/g, " ")
    .replace(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g, "$2 ($1)")
    .replace(/<(br|\/p|\/h1|\/tr|\/div)[^>]*>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#[0-9]+;/g, "")
    .replace(/[ \t]+/g, " ").replace(/\n\s*\n\s*\n+/g, "\n\n").trim();
}

function done(subject: string, html: string): Rendered {
  return { subject, html, text: toText(html) };
}

// ---------- 1. Bienvenue ----------
const WELCOME = {
  fr: { s: "Bienvenue sur IdeaForge 👋", pre: "Ton compte est prêt. Voici par où commencer.", eb: "Bienvenue", h: "Ton compte est prêt", intro: "Content de t'avoir parmi nous ! IdeaForge t'aide à trouver, valider et lancer une idée de business qui tient la route. Pour bien démarrer :", steps: ["<b>Parcours le catalogue</b> : des idées triées par budget, revenu et difficulté.", "<b>Teste ta propre idée</b> avec le validateur : score, preuves de demande et plan sur 30 jours.", "<b>Garde un œil sur le Radar</b> : les nouvelles niches repérées en continu."], cta: "Explorer les idées", ps: "Une question ? Réponds simplement à cet e-mail, je lis tout." },
  en: { s: "Welcome to IdeaForge 👋", pre: "Your account is ready. Here's where to start.", eb: "Welcome", h: "Your account is ready", intro: "Glad to have you! IdeaForge helps you find, validate and launch a business idea that holds up. To get started:", steps: ["<b>Browse the catalog</b>: ideas sorted by budget, revenue and difficulty.", "<b>Test your own idea</b> with the validator: score, demand proof and a 30-day plan.", "<b>Keep an eye on the Radar</b>: new niches spotted around the clock."], cta: "Explore ideas", ps: "Questions? Just reply to this email, I read everything." },
  es: { s: "Bienvenido a IdeaForge 👋", pre: "Tu cuenta está lista. Por dónde empezar.", eb: "Bienvenido", h: "Tu cuenta está lista", intro: "¡Qué bien tenerte aquí! IdeaForge te ayuda a encontrar, validar y lanzar una idea de negocio sólida. Para empezar:", steps: ["<b>Explora el catálogo</b>: ideas ordenadas por presupuesto, ingresos y dificultad.", "<b>Prueba tu propia idea</b> con el validador: puntuación, pruebas de demanda y plan de 30 días.", "<b>Vigila el Radar</b>: nuevos nichos detectados sin parar."], cta: "Explorar ideas", ps: "¿Dudas? Responde a este correo, lo leo todo." },
};

export function welcomeEmail(l: Lang, site: string): Rendered {
  const t = WELCOME[l];
  const body = eyebrow(t.eb) + h1(t.h) + p(t.intro) + list(t.steps) + button(t.cta, `${site}/#catalogue`) + p(`<span style="font-size:14px;color:${C.ink3}">${t.ps}</span>`);
  return done(t.s, layout({ body, preheader: t.pre, lang: l, site }));
}

// ---------- 2. Relances inscrits non payants (J+1, J+3, J+7) ----------
const NURTURE = {
  fr: [
    { s: "3 idées à regarder cette semaine", pre: "Sélectionnées pour leur potentiel et leur budget de départ.", eb: "Sélection", h: "3 idées à fort potentiel", intro: "On a sélectionné pour toi trois idées avec un bon rapport budget / revenu. Jette un œil, une seule peut suffire à lancer quelque chose.", card: "Voir la fiche", cta: "Voir tout le catalogue", link: "/#catalogue" },
    { s: "Ce que débloque l'accès à vie", pre: "Fiches complètes, prompts prêts à l'emploi, génération illimitée.", eb: "Accès à vie", h: "Passe de l'idée au lancement", intro: "Avec ton compte gratuit, tu vois l'aperçu des idées. L'accès à vie débloque tout le reste, pour un paiement unique :", items: ["Toutes les fiches complètes : marché, modèle, étapes, risques", "Les prompts « Lancer avec Claude » pour construire ton MVP", "La génération d'idées par IA, illimitée", "Toutes les mises à jour futures, sans abonnement"], price: "<b>129 €</b> une seule fois, au lieu de 199 €. Satisfait ou remboursé 14 jours.", cta: "Débloquer l'accès à vie", link: "/#pricing" },
    { s: "Dernier rappel : le tarif de lancement", pre: "L'accès à vie est encore à 129 € au lieu de 199 €.", eb: "Dernier rappel", h: "Le tarif de lancement ne durera pas", intro: "C'est le dernier e-mail de cette série. L'accès à vie est encore au tarif de lancement : <b>129 €</b> une fois, au lieu de 199 € ensuite. Et si ça ne te convient pas, tu es remboursé sous 14 jours.", cta: "Profiter du tarif de lancement", link: "/#pricing", ps: "Pas le bon moment ? Aucun souci, tu gardes ton compte gratuit." },
  ],
  en: [
    { s: "3 ideas worth a look this week", pre: "Picked for their potential and starting budget.", eb: "Picks", h: "3 high-potential ideas", intro: "We picked three ideas with a strong budget-to-revenue ratio. Have a look, one can be enough to start something.", card: "View the sheet", cta: "See the full catalog", link: "/#catalogue" },
    { s: "What lifetime access unlocks", pre: "Full sheets, ready-made prompts, unlimited generation.", eb: "Lifetime access", h: "Go from idea to launch", intro: "Your free account shows idea previews. Lifetime access unlocks everything else, for a one-time payment:", items: ["Every full sheet: market, model, steps, risks", "The “Launch with Claude” prompts to build your MVP", "Unlimited AI idea generation", "All future updates, no subscription"], price: "<b>€129</b> once, instead of €199. 14-day money-back guarantee.", cta: "Unlock lifetime access", link: "/#pricing" },
    { s: "Last reminder: launch pricing", pre: "Lifetime access is still €129 instead of €199.", eb: "Last reminder", h: "Launch pricing won't last", intro: "This is the last email in this series. Lifetime access is still at launch price: <b>€129</b> once, instead of €199 later. And if it's not for you, you're refunded within 14 days.", cta: "Get launch pricing", link: "/#pricing", ps: "Not the right time? No problem, you keep your free account." },
  ],
  es: [
    { s: "3 ideas que mirar esta semana", pre: "Elegidas por su potencial y su presupuesto inicial.", eb: "Selección", h: "3 ideas con gran potencial", intro: "Hemos elegido tres ideas con buena relación presupuesto / ingresos. Échales un vistazo, con una basta para empezar.", card: "Ver la ficha", cta: "Ver todo el catálogo", link: "/#catalogue" },
    { s: "Lo que desbloquea el acceso de por vida", pre: "Fichas completas, prompts listos, generación ilimitada.", eb: "Acceso de por vida", h: "Pasa de la idea al lanzamiento", intro: "Tu cuenta gratuita muestra un adelanto de las ideas. El acceso de por vida desbloquea todo lo demás, con un pago único:", items: ["Todas las fichas completas: mercado, modelo, pasos, riesgos", "Los prompts «Lanzar con Claude» para construir tu MVP", "Generación de ideas con IA ilimitada", "Todas las actualizaciones futuras, sin suscripción"], price: "<b>129 €</b> una sola vez, en lugar de 199 €. Garantía de reembolso de 14 días.", cta: "Desbloquear acceso de por vida", link: "/#pricing" },
    { s: "Último aviso: precio de lanzamiento", pre: "El acceso de por vida sigue a 129 € en lugar de 199 €.", eb: "Último aviso", h: "El precio de lanzamiento no durará", intro: "Este es el último correo de la serie. El acceso de por vida sigue a precio de lanzamiento: <b>129 €</b> una vez, en lugar de 199 € después. Y si no te convence, te reembolsamos en 14 días.", cta: "Aprovechar el precio de lanzamiento", link: "/#pricing", ps: "¿No es el momento? Sin problema, conservas tu cuenta gratuita." },
  ],
};

// step = 1 (J+1), 2 (J+3), 3 (J+7)
export function nurtureEmail(step: 1 | 2 | 3, l: Lang, site: string, unsub: string, ideas: MailIdea[] = []): Rendered {
  const t = NURTURE[l][step - 1] as Record<string, any>;
  let body = eyebrow(t.eb) + h1(t.h) + p(t.intro);
  if (step === 1) body += ideaCards(ideas.slice(0, 3), site, t.card);
  if (step === 2) body += checks(t.items) + p(t.price);
  body += button(t.cta, `${site}${t.link}`);
  if (t.ps) body += p(`<span style="font-size:14px;color:${C.ink3}">${t.ps}</span>`);
  return done(t.s, layout({ body, preheader: t.pre, lang: l, site, unsub, marketing: true }));
}

// ---------- 3. Paiement abandonné ----------
const ABANDON = {
  fr: { s: "Ton accès à vie t'attend", pre: "Tu as commencé ton paiement sans le terminer.", eb: "Paiement non finalisé", h: "Il ne manquait pas grand-chose", intro: "Tu as commencé à prendre l'accès à vie sur IdeaForge, mais le paiement n'est pas allé au bout. Tu peux le reprendre en un clic, au même tarif de lancement.", help: "Un souci avec ta carte ou une question avant de te lancer ? Réponds à cet e-mail, je t'aide.", cta: "Reprendre mon paiement" },
  en: { s: "Your lifetime access is waiting", pre: "You started your payment but didn't finish.", eb: "Payment not completed", h: "You were almost there", intro: "You started getting lifetime access to IdeaForge, but the payment didn't go through. You can pick it up in one click, at the same launch price.", help: "Card trouble or a question first? Reply to this email and I'll help.", cta: "Resume my payment" },
  es: { s: "Tu acceso de por vida te espera", pre: "Empezaste el pago pero no lo terminaste.", eb: "Pago no finalizado", h: "Te faltaba muy poco", intro: "Empezaste a obtener el acceso de por vida a IdeaForge, pero el pago no se completó. Puedes retomarlo en un clic, al mismo precio de lanzamiento.", help: "¿Problemas con la tarjeta o alguna duda? Responde a este correo y te ayudo.", cta: "Retomar mi pago" },
};

export function abandonedEmail(l: Lang, site: string, unsub: string): Rendered {
  const t = ABANDON[l];
  const body = eyebrow(t.eb) + h1(t.h) + p(t.intro) + button(t.cta, `${site}/#pricing`) + p(`<span style="font-size:14px;color:${C.ink3}">${t.help}</span>`);
  return done(t.s, layout({ body, preheader: t.pre, lang: l, site, unsub, marketing: true }));
}

// ---------- 4. Drop hebdo (newsletter) ----------
const DROP = {
  fr: { s: (n: number) => `Le drop de la semaine : ${n} nouvelles idées`, pre: "Les idées repérées cette semaine, prêtes à être lancées.", eb: "Drop hebdo", h: "Les idées de la semaine", intro: "Voici les idées repérées cette semaine par IdeaForge. Chacune a son budget de départ et son potentiel de revenu.", card: "Lire la fiche", cta: "Voir tout le catalogue" },
  en: { s: (n: number) => `This week's drop: ${n} new ideas`, pre: "Ideas spotted this week, ready to launch.", eb: "Weekly drop", h: "This week's ideas", intro: "Here are the ideas IdeaForge spotted this week, each with its starting budget and revenue potential.", card: "Read the sheet", cta: "See the full catalog" },
  es: { s: (n: number) => `El drop de la semana: ${n} ideas nuevas`, pre: "Las ideas detectadas esta semana, listas para lanzar.", eb: "Drop semanal", h: "Las ideas de la semana", intro: "Estas son las ideas que IdeaForge detectó esta semana, cada una con su presupuesto inicial y potencial de ingresos.", card: "Leer la ficha", cta: "Ver todo el catálogo" },
};

export function dropEmail(l: Lang, site: string, unsub: string, ideas: MailIdea[]): Rendered {
  const t = DROP[l];
  const body = eyebrow(t.eb) + h1(t.h) + p(t.intro) + ideaCards(ideas, site, t.card) + button(t.cta, `${site}/#catalogue`);
  return done(t.s(ideas.length), layout({ body, preheader: t.pre, lang: l, site, unsub, marketing: true }));
}

// ---------- 5. Alertes pour l'admin ----------
export function adminSignupEmail(email: string, site: string, provider?: string): Rendered {
  const body = eyebrow("Nouvelle inscription") + h1("🎉 Un nouvel inscrit") + p(`<b>${esc(email)}</b> vient de créer un compte${provider ? ` (via ${esc(provider)})` : ""}.`) + button("Ouvrir le panel admin", `${site}/admin`);
  return done(`Nouvel inscrit : ${email}`, layout({ body, lang: "fr", site }));
}

export function adminPaymentEmail(email: string, plan: string, amount: string, site: string): Rendered {
  const label = plan === "monthly" ? "abonnement mensuel" : "accès à vie";
  const body = eyebrow("Nouveau paiement") + h1(`💶 ${esc(amount)} encaissés`) + p(`<b>${esc(email)}</b> vient de prendre l'<b>${label}</b>.`) + button("Ouvrir le panel admin", `${site}/admin`);
  return done(`Paiement ${amount} : ${email} (${label})`, layout({ body, lang: "fr", site }));
}

// ---------- 6. Lien de connexion (gabarit à coller dans Supabase → Email Templates) ----------
// Supabase remplace {{ .ConfirmationURL }} lui-même. Trilingue dans un seul e-mail (Supabase n'a qu'un gabarit).
export function magicLinkTemplate(site: string): Rendered {
  const body =
    eyebrow("Connexion") +
    h1("Ton lien de connexion") +
    p("Clique sur le bouton pour te connecter à IdeaForge. Ce lien n'est valable qu'une fois et expire bientôt.") +
    button("Me connecter", "{{ .ConfirmationURL }}") +
    p(`<span style="font-size:13px;color:${C.ink3}">EN · Click the button to sign in. ES · Haz clic en el botón para iniciar sesión.<br>Si tu n'as rien demandé, ignore simplement cet e-mail.</span>`);
  return done("Ton lien de connexion IdeaForge", layout({ body, preheader: "Ton lien pour te connecter à IdeaForge.", lang: "fr", site }));
}

export function confirmSignupTemplate(site: string): Rendered {
  const body =
    eyebrow("Inscription") +
    h1("Confirme ton adresse e-mail") +
    p("Plus qu'un clic pour activer ton compte IdeaForge.") +
    button("Confirmer mon e-mail", "{{ .ConfirmationURL }}") +
    p(`<span style="font-size:13px;color:${C.ink3}">EN · Confirm your email to activate your account. ES · Confirma tu correo para activar tu cuenta.<br>Si tu n'as rien demandé, ignore simplement cet e-mail.</span>`);
  return done("Confirme ton inscription à IdeaForge", layout({ body, preheader: "Plus qu'un clic pour activer ton compte.", lang: "fr", site }));
}

// ---------- 7. Bienvenue membre (après achat) ----------
const MEMBER = {
  fr: { s: "C'est parti : ton accès membre est actif ✅", pre: "Tout le catalogue est débloqué. Voici comment en tirer le maximum.", eb: "Merci pour ta confiance", h: "Ton accès membre est actif", life: "l'accès à vie", month: "l'abonnement mensuel", intro: (p: string) => `Merci d'avoir pris ${p} ! Tout est débloqué : fiches complètes, dossiers chiffrés, prompts et génération d'idées. Pour avancer vite :`, steps: ["<b>Choisis 3 idées</b> dans le catalogue et compare leurs dossiers (point mort, LTV/CAC, budget).", "<b>Passe la meilleure au validateur</b> pour voir les preuves de demande en direct.", "<b>Copie le prompt « Lancer avec Claude »</b> de la fiche pour construire ton MVP.", "<b>Ouvre ton bonus</b> : le pack de 50 prompts sur ideaforges.io/prompts, de la validation au lancement."], cta: "Ouvrir le catalogue complet", ps: "Garantie 14 jours : si ça ne te convient pas, réponds simplement à cet e-mail et tu es remboursé." },
  en: { s: "You're in: your member access is live ✅", pre: "The whole catalog is unlocked. Here's how to make the most of it.", eb: "Thank you", h: "Your member access is live", life: "lifetime access", month: "the monthly plan", intro: (p: string) => `Thanks for getting ${p}! Everything is unlocked: full sheets, detailed financial files, prompts and idea generation. To move fast:`, steps: ["<b>Pick 3 ideas</b> and compare their files (break-even, LTV/CAC, budget).", "<b>Run the best one through the validator</b> to see live demand proof.", "<b>Copy the “Launch with Claude” prompt</b> to build your MVP.", "<b>Open your bonus</b>: the 50-prompt pack at ideaforges.io/prompts."], cta: "Open the full catalog", ps: "14-day guarantee: if it's not for you, just reply to this email and you'll be refunded." },
  es: { s: "Listo: tu acceso de miembro está activo ✅", pre: "Todo el catálogo está desbloqueado. Así le sacas el máximo partido.", eb: "Gracias por tu confianza", h: "Tu acceso de miembro está activo", life: "el acceso de por vida", month: "la suscripción mensual", intro: (p: string) => `¡Gracias por elegir ${p}! Todo está desbloqueado: fichas completas, dossiers con cifras, prompts y generación de ideas. Para avanzar rápido:`, steps: ["<b>Elige 3 ideas</b> y compara sus dossiers (punto de equilibrio, LTV/CAC, presupuesto).", "<b>Pasa la mejor por el validador</b> para ver pruebas de demanda en directo.", "<b>Copia el prompt «Lanzar con Claude»</b> para construir tu MVP.", "<b>Abre tu bonus</b>: el pack de 50 prompts en ideaforges.io/prompts."], cta: "Abrir el catálogo completo", ps: "Garantía de 14 días: si no te convence, responde a este correo y te reembolsamos." },
};

export function memberWelcomeEmail(plan: string, l: Lang, site: string): Rendered {
  const t = MEMBER[l];
  const body = eyebrow(t.eb) + h1(t.h) + p(t.intro(plan === "monthly" ? t.month : t.life)) + list(t.steps) + button(t.cta, `${site}/#catalogue`) + p(`<span style="font-size:14px;color:${C.ink3}">${t.ps}</span>`);
  return done(t.s, layout({ body, preheader: t.pre, lang: l, site }));
}

// ---------- 8. Abonnement mensuel résilié : proposer l'accès à vie ----------
const WINBACK = {
  fr: { s: "Ton abonnement est terminé (et une option plus simple)", pre: "Garde tout pour toujours, en un seul paiement.", eb: "Abonnement terminé", h: "Merci d'avoir été membre", intro: "Ton abonnement mensuel vient de se terminer, tu repasses en compte gratuit. Si tu veux garder les fiches complètes et les dossiers sans abonnement, l'accès à vie reste disponible : <b>129 € une seule fois</b>, soit moins de 4 mois d'abonnement, avec la garantie 14 jours.", cta: "Passer à l'accès à vie", ps: "Une remarque sur ce qui t'a manqué ? Réponds à cet e-mail, ça nous aide vraiment." },
  en: { s: "Your subscription has ended (and a simpler option)", pre: "Keep everything forever, with a single payment.", eb: "Subscription ended", h: "Thanks for being a member", intro: "Your monthly plan just ended and you're back on a free account. To keep full sheets and files without a subscription, lifetime access is still available: <b>€129 once</b>, less than 4 months of subscription, with the 14-day guarantee.", cta: "Get lifetime access", ps: "Anything we could do better? Just reply, it really helps." },
  es: { s: "Tu suscripción ha terminado (y una opción más sencilla)", pre: "Consérvalo todo para siempre, con un solo pago.", eb: "Suscripción terminada", h: "Gracias por haber sido miembro", intro: "Tu suscripción mensual acaba de terminar y vuelves a una cuenta gratuita. Para conservar las fichas y dossiers sin suscripción, el acceso de por vida sigue disponible: <b>129 € una sola vez</b>, menos de 4 meses de suscripción, con la garantía de 14 días.", cta: "Pasar al acceso de por vida", ps: "¿Algo que podamos mejorar? Responde a este correo, nos ayuda mucho." },
};

export function winbackEmail(l: Lang, site: string, unsub: string): Rendered {
  const t = WINBACK[l];
  const body = eyebrow(t.eb) + h1(t.h) + p(t.intro) + button(t.cta, `${site}/#pricing`) + p(`<span style="font-size:14px;color:${C.ink3}">${t.ps}</span>`);
  return done(t.s, layout({ body, preheader: t.pre, lang: l, site, unsub, marketing: true }));
}

// ---------- 9. Parrainage : un filleul vient de payer ----------
const REFT = {
  fr: { s: (n: number) => `🎉 Un ami parrainé vient de rejoindre IdeaForge (${n} au total)`, pre: "Ton lien de parrainage fonctionne.", eb: "Parrainage", h: "Ton ami vient de rejoindre IdeaForge", intro: (n: number) => `Merci ! Une personne inscrite avec ton lien vient de prendre son accès. Tu as maintenant <b>${n} ami${n > 1 ? "s" : ""} parrainé${n > 1 ? "s" : ""}</b>.`, t1: "✨ <b>1 mois membre offert</b> : toutes les fiches complètes sont débloquées pour 30 jours.", t1i: "✨ Palier 1 atteint. Tu es déjà membre à vie, il est inclus dans ton accès.", t2: "🔥 <b>Accès à vie offert</b> : tout IdeaForge est à toi, pour toujours, sans rien payer.", t2i: "🔥 Palier 2 atteint. Tu es déjà membre à vie, il est inclus dans ton accès.", t3: "🚀 <b>Palier 3 atteint</b> : ton SaaS codé en priorité avec -30 % sur le devis. On te recontacte très vite par e-mail.", next: (k: number, name: string) => `Plus que <b>${k}</b> ami${k > 1 ? "s" : ""} pour débloquer : ${name}.`, cta: "Voir mon parrainage" },
  en: { s: (n: number) => `🎉 A friend you referred just joined IdeaForge (${n} total)`, pre: "Your referral link works.", eb: "Referral", h: "Your friend just joined IdeaForge", intro: (n: number) => `Thank you! Someone who signed up with your link just got their access. You now have <b>${n} referred friend${n > 1 ? "s" : ""}</b>.`, t1: "✨ <b>1 free month of membership</b>: every full sheet is unlocked for 30 days.", t1i: "✨ Tier 1 reached. You already have lifetime access, it's included.", t2: "🔥 <b>Free lifetime access</b>: all of IdeaForge is yours, forever.", t2i: "🔥 Tier 2 reached. You already have lifetime access, it's included.", t3: "🚀 <b>Tier 3 reached</b>: your SaaS built in priority with 30% off the quote. We'll email you very soon.", next: (k: number, name: string) => `Only <b>${k}</b> more friend${k > 1 ? "s" : ""} to unlock: ${name}.`, cta: "See my referrals" },
  es: { s: (n: number) => `🎉 Un amigo que invitaste se unió a IdeaForge (${n} en total)`, pre: "Tu enlace de referido funciona.", eb: "Referidos", h: "Tu amigo se unió a IdeaForge", intro: (n: number) => `¡Gracias! Alguien que se registró con tu enlace acaba de obtener su acceso. Ya tienes <b>${n} amigo${n > 1 ? "s" : ""} referido${n > 1 ? "s" : ""}</b>.`, t1: "✨ <b>1 mes de membresía gratis</b>: todas las fichas completas desbloqueadas durante 30 días.", t1i: "✨ Nivel 1 alcanzado. Ya tienes acceso de por vida, está incluido.", t2: "🔥 <b>Acceso de por vida gratis</b>: todo IdeaForge es tuyo, para siempre.", t2i: "🔥 Nivel 2 alcanzado. Ya tienes acceso de por vida, está incluido.", t3: "🚀 <b>Nivel 3 alcanzado</b>: tu SaaS programado en prioridad con -30 % en el presupuesto. Te escribimos muy pronto.", next: (k: number, name: string) => `Solo <b>${k}</b> amigo${k > 1 ? "s" : ""} más para desbloquear: ${name}.`, cta: "Ver mis referidos" },
};
const TIER_NAMES = { fr: ["1 mois membre offert", "l'accès à vie offert", "ton SaaS en priorité à -30 %"], en: ["a free month", "free lifetime access", "your SaaS in priority at -30%"], es: ["un mes gratis", "acceso de por vida gratis", "tu SaaS en prioridad con -30 %"] };

export function referralRewardEmail(l: Lang, site: string, paidCount: number, newTiers: { tier: number; status: string }[]): Rendered {
  const t = REFT[l];
  const lines = newTiers.map((n) => n.tier === 1 ? (n.status === "included" ? t.t1i : t.t1) : n.tier === 2 ? (n.status === "included" ? t.t2i : t.t2) : t.t3);
  const needs = [1, 3, 10];
  const nextIdx = needs.findIndex((x) => x > paidCount);
  const nextLine = nextIdx >= 0 ? p(t.next(needs[nextIdx] - paidCount, TIER_NAMES[l][nextIdx])) : "";
  const body = eyebrow(t.eb) + h1(t.h) + p(t.intro(paidCount)) + lines.map((x) => p(x)).join("") + nextLine + button(t.cta, `${site}/parrainage`);
  return done(t.s(paidCount), layout({ body, preheader: t.pre, lang: l, site }));
}

export function adminReferralEmail(referrer: string, referred: string, paidCount: number, newTiers: { tier: number; status: string }[], site: string): Rendered {
  const tiers = newTiers.length ? p(`Palier${newTiers.length > 1 ? "s" : ""} débloqué${newTiers.length > 1 ? "s" : ""} : <b>${newTiers.map((n) => `${n.tier}${n.status === "included" ? " (déjà inclus)" : n.status === "pending" ? " (à livrer par toi)" : ""}`).join(", ")}</b>.`) : "";
  const body = eyebrow("Parrainage") + h1("🤝 Un filleul vient de payer") + p(`<b>${esc(referred)}</b>, parrainé par <b>${esc(referrer)}</b>, vient de payer. ${esc(referrer)} a maintenant <b>${paidCount}</b> filleul${paidCount > 1 ? "s" : ""} payant${paidCount > 1 ? "s" : ""}.`) + tiers + button("Voir le parrainage", `${site}/admin/parrainage`);
  return done(`Parrainage : ${referred} (parrain ${referrer}, ${paidCount} au total)`, layout({ body, lang: "fr", site }));
}
