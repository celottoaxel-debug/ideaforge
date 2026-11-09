import { createAdminClient } from "@/lib/supabase/admin";
import { askClaude } from "@/lib/anthropic";
import { COLLECTIONS } from "@/lib/collections";
import { IDEAS } from "@/lib/ideas";
import { slugify } from "@/lib/blog/markdown";
import { sendEmail, emailEnabled } from "@/lib/email/resend";
import { ADMIN_EMAILS } from "@/lib/admin";
import { layout, esc } from "@/lib/email/templates";
import { SITE } from "@/lib/seo";

// Plan éditorial : recherches à fort volume pour des entrepreneurs francophones.
// Le pilote automatique traite les sujets dans l'ordre et saute ceux déjà rédigés.
export const TOPICS: string[] = [
  "comment trouver une idée de business rentable",
  "idée de business sans argent",
  "comment valider une idée de startup avant de la lancer",
  "qu'est-ce qu'un micro-SaaS et comment en lancer un",
  "idées de business avec l'intelligence artificielle",
  "combien coûte la création d'un SaaS",
  "créer une application sans savoir coder avec l'IA",
  "vibe coding : définition et outils",
  "comment trouver ses premiers clients en B2B",
  "comment fixer le prix d'un logiciel par abonnement",
  "LTV et CAC : calculer la rentabilité d'un client",
  "calculer le point mort de son entreprise",
  "faire une étude de marché gratuite",
  "idées de business en ligne à lancer seul",
  "side business : idées pour un revenu complémentaire",
  "idées de business local rentables",
  "créer une landing page qui convertit",
  "prompts ChatGPT pour entrepreneurs",
  "business à revenus récurrents : idées et modèles",
  "tester une idée de business avec une landing page",
  "erreurs à éviter quand on lance une startup",
  "trouver un nom d'entreprise et un nom de domaine",
  "idées de business pour freelances",
  "agents IA : idées de business à lancer",
  "churn : définition et comment le réduire",
  "réussir son lancement sur Product Hunt",
  "micro-entreprise ou SASU pour lancer un SaaS",
  "SEO pour une startup : par où commencer",
  "idées de SaaS B2B à fort potentiel",
  "copier une idée qui marche aux États-Unis",
];

export type AutopilotResult = { ok: boolean; slug?: string; title?: string; error?: string };

// Rédige un brouillon d'article sur le prochain sujet du plan, puis prévient l'admin par e-mail.
export async function runBlogAutopilot(force = false): Promise<AutopilotResult> {
  if (!process.env.ANTHROPIC_API_KEY) return { ok: false, error: "ANTHROPIC_API_KEY absente" };
  const admin = createAdminClient();

  // Pas plus d'un brouillon automatique en attente : on attend ta validation avant d'en écrire d'autres.
  if (!force) {
    const { count } = await admin.from("posts").select("id", { count: "exact", head: true }).eq("status", "draft").eq("source", "ia");
    if ((count ?? 0) >= 3) return { ok: false, error: "3 brouillons attendent déjà ta validation" };
  }

  const { data: done } = await admin.from("posts").select("keyword");
  const used = new Set(((done as { keyword: string | null }[]) ?? []).map((d) => (d.keyword || "").toLowerCase()));
  const topic = TOPICS.find((t) => !used.has(t.toLowerCase()));
  if (!topic) return { ok: false, error: "Tous les sujets du plan éditorial ont été traités" };

  const links = [
    ...COLLECTIONS.map((c) => `- ${c.h1} : ${SITE}/idees/${c.slug}`),
    ...IDEAS.slice(0, 30).map((i) => `- ${i.title} : ${SITE}/idea/${i.id}`),
    `- Valider une idée gratuitement : ${SITE}/validate`,
    `- Pack de 50 prompts IA : ${SITE}/prompts`,
  ].join("\n");

  const prompt = `Tu es rédacteur SEO pour IdeaForge (${SITE}), un site qui propose plus de 90 idées de business chiffrées (budget, revenus projetés, concurrents, plan de lancement) pour les entrepreneurs francophones.

Rédige un article de blog complet en français sur le sujet : « ${topic} ».

Exigences :
- 1 200 à 1 600 mots, ton clair, concret et bienveillant, tutoiement.
- Structure en Markdown : intro de 2 paragraphes (sans titre), puis des sections ## et ###, des listes, au moins un tableau comparatif, des exemples concrets, et une section « ## Questions fréquentes » avec 4 questions en ### et leurs réponses.
- Optimisé pour la recherche « ${topic} » : le mot-clé dans le titre, l'introduction et un sous-titre, sans bourrage.
- Ajoute 3 à 5 liens internes pertinents, UNIQUEMENT parmi ces adresses (format Markdown [texte](adresse)) :
${links}
- Termine par un court paragraphe qui invite à explorer les idées d'IdeaForge.
- N'invente AUCUN chiffre, aucune étude, aucune citation. Si tu cites une statistique dont tu n'es pas sûr, ajoute juste après : [à vérifier].
- Pas de titre de niveau # dans le corps.

Réponds EXACTEMENT dans ce format, sans rien d'autre :
TITRE: <titre de 50 à 65 caractères>
DESCRIPTION: <meta description de 140 à 160 caractères>
TAGS: <3 à 5 mots-clés séparés par des virgules>
---
<corps de l'article en Markdown>`;

  let raw = "";
  try {
    raw = await askClaude(prompt, 5000);
  } catch (e) {
    return { ok: false, error: `Génération IA échouée : ${e instanceof Error ? e.message : String(e)}` };
  }

  const sep = raw.indexOf("\n---");
  const head = sep >= 0 ? raw.slice(0, sep) : "";
  const body = (sep >= 0 ? raw.slice(sep + 4) : raw).trim();
  const pick = (k: string) => head.match(new RegExp(`^${k}:\\s*(.+)$`, "mi"))?.[1]?.trim() ?? "";
  const title = pick("TITRE") || topic.charAt(0).toUpperCase() + topic.slice(1);
  const description = pick("DESCRIPTION") || null;
  const tags = pick("TAGS").split(",").map((t) => t.trim()).filter(Boolean).slice(0, 6);
  if (body.split(/\s+/).length < 400) return { ok: false, error: "Article trop court, réessaie" };

  let slug = slugify(title) || slugify(topic);
  const { data: exists } = await admin.from("posts").select("id").eq("slug", slug).maybeSingle();
  if (exists) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;

  const { error } = await admin.from("posts").insert({ slug, title, description, content_md: body, tags, keyword: topic, status: "draft", source: "ia" });
  if (error) return { ok: false, error: `Enregistrement échoué : ${error.message}` };

  if (emailEnabled()) {
    const html = layout({
      site: SITE, lang: "fr", preheader: "Un nouvel article attend ta validation.",
      body: `<h1 style="font-family:sans-serif;font-size:24px;margin:0 0 12px;color:#0c1512">📝 Nouvel article à valider</h1>
<p style="font-family:sans-serif;font-size:16px;line-height:1.6;color:#44554f"><b>${esc(title)}</b><br>Sujet : ${esc(topic)}</p>
<p style="font-family:sans-serif;font-size:15px;line-height:1.6;color:#44554f">Relis-le (les passages marqués « [à vérifier] » sont surlignés), puis publie-le en un clic depuis le panel.</p>
<p><a href="${SITE}/blog/${slug}" style="font-family:sans-serif;font-weight:600;color:#0f7a4a">Lire le brouillon →</a> &nbsp; <a href="${SITE}/admin/blog" style="font-family:sans-serif;font-weight:600;color:#0f7a4a">Valider dans le panel →</a></p>`,
    });
    await Promise.all(ADMIN_EMAILS.map((to) => sendEmail({ to, subject: `Article à valider : ${title}`, html, tag: "blog_draft" })));
  }
  return { ok: true, slug, title };
}
