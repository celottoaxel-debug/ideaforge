import Motion from "@/components/Motion";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Analytics } from "@vercel/analytics/react";
import { getLocale } from "@/lib/i18n";
import Tracker from "@/components/Tracker";
import "./globals.css";

export const viewport = { themeColor: "#07130f", colorScheme: "dark" };

const site = process.env.NEXT_PUBLIC_SITE_URL || "https://ideaforges.io";

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: {
    default: "IdeaForge — Idées de business chiffrées : budget, revenus, plan de lancement",
    template: "%s · IdeaForge",
  },
  description:
    "Plus de 90 idées de business et de SaaS analysées et chiffrées : budget de départ, revenus projetés sur 24 mois, concurrents, risques et plan de lancement. Valide ton idée et lance-la avec l'IA.",
  keywords: ["idées de business", "idée d'entreprise", "idée business rentable", "micro-SaaS", "business IA", "idées SaaS", "business ideas", "ideas de negocio"],
  applicationName: "IdeaForge",
  appleWebApp: { capable: true, title: "IdeaForge", statusBarStyle: "default" },
  authors: [{ name: "Axel Celotto" }],
  creator: "IdeaForge",
  openGraph: {
    type: "website",
    siteName: "IdeaForge",
    locale: "fr_FR",
    title: "IdeaForge — Idées de business chiffrées",
    description: "Plus de 90 idées de business analysées : budget, revenus sur 24 mois, concurrents, plan de lancement.",
    url: site,
  },
  twitter: { card: "summary_large_image", title: "IdeaForge — Idées de business chiffrées", description: "Plus de 90 idées de business analysées et chiffrées." },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
    other: process.env.BING_SITE_VERIFICATION ? { "msvalidate.01": process.env.BING_SITE_VERIFICATION } : undefined,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = getLocale();
  return (
    <html lang={locale} className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>{children}<Motion /><Tracker /><Analytics /></body>
    </html>
  );
}
