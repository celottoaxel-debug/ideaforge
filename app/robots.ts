import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://ideaforges.io";
  const privateRoutes = ["/api/", "/auth/", "/admin", "/compte", "/success", "/login"];
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: privateRoutes },
      // Moteurs de réponse IA : autorisés explicitement (visibilité dans ChatGPT, Perplexity, Claude, Gemini…).
      { userAgent: ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "PerplexityBot", "Perplexity-User", "ClaudeBot", "Claude-SearchBot", "Claude-User", "Google-Extended", "Applebot-Extended", "Bingbot", "DuckAssistBot"], allow: "/", disallow: privateRoutes },
    ],
    sitemap: `${site}/sitemap.xml`,
    host: site,
  };
}
