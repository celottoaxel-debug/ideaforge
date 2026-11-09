import type { MetadataRoute } from "next";
import { allIdeas, SITE } from "@/lib/seo";
import { COLLECTIONS } from "@/lib/collections";
import { listPublished } from "@/lib/blog/posts";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const [ideas, posts] = await Promise.all([allIdeas(), listPublished(1000)]);
  const page = (path: string, priority: number, changeFrequency: "daily" | "weekly" | "monthly" | "yearly") =>
    ({ url: `${SITE}${path}`, lastModified: now, changeFrequency, priority });
  return [
    page("", 1, "daily"),
    page("/idees", 0.9, "weekly"),
    ...COLLECTIONS.map((c) => page(`/idees/${c.slug}`, 0.85, "weekly")),
    page("/blog", 0.8, "daily"),
    ...posts.map((p) => ({ url: `${SITE}/blog/${p.slug}`, lastModified: new Date(p.updated_at), changeFrequency: "monthly" as const, priority: 0.75 })),
    page("/validate", 0.7, "monthly"),
    page("/radar", 0.6, "weekly"),
    page("/prompts", 0.6, "monthly"),
    ...ideas.map((it) => page(`/idea/${it.id}`, it.is_ai ? 0.6 : 0.7, "monthly")),
    ...["/cgv", "/mentions-legales", "/confidentialite"].map((p) => page(p, 0.2, "yearly")),
  ];
}
