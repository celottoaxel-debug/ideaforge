import { listPublished } from "@/lib/blog/posts";
import { SITE } from "@/lib/seo";

export const revalidate = 600;
const x = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function GET() {
  const posts = await listPublished(50);
  const items = posts.map((p) => `<item><title>${x(p.title)}</title><link>${SITE}/blog/${p.slug}</link><guid>${SITE}/blog/${p.slug}</guid>${p.published_at ? `<pubDate>${new Date(p.published_at).toUTCString()}</pubDate>` : ""}<description>${x(p.description ?? "")}</description></item>`).join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Blog IdeaForge</title><link>${SITE}/blog</link><description>Trouver, valider et lancer une idée de business.</description><language>fr</language>${items}</channel></rss>`;
  return new Response(xml, { headers: { "content-type": "application/rss+xml; charset=utf-8" } });
}
