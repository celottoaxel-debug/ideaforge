import type { MetadataRoute } from "next";
import { IDEAS } from "@/lib/ideas";

export default function sitemap(): MetadataRoute.Sitemap {
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://ideaforges.io";
  const now = new Date();
  return [
    { url: site, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${site}/prompts`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.6 },
    ...["/cgv", "/mentions-legales", "/confidentialite"].map((p) => ({ url: `${site}${p}`, lastModified: now, changeFrequency: "yearly" as const, priority: 0.2 })),
    ...IDEAS.map((it) => ({
      url: `${site}/idea/${it.id}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
