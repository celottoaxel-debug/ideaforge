import type { MetadataRoute } from "next";
import { IDEAS } from "@/lib/ideas";

export default function sitemap(): MetadataRoute.Sitemap {
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://ideaforge-two-beryl.vercel.app";
  const now = new Date();
  return [
    { url: site, lastModified: now, changeFrequency: "weekly", priority: 1 },
    ...IDEAS.map((it) => ({
      url: `${site}/idea/${it.id}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
