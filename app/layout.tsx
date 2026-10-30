import type { Metadata } from "next";
import { getLocale } from "@/lib/i18n";
import "./globals.css";

const site = process.env.NEXT_PUBLIC_SITE_URL || "https://ideaforge-two-beryl.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: {
    default: "IdeaForge — Des idées business qui gagnent déjà de l'argent",
    template: "%s · IdeaForge",
  },
  description:
    "Plus de 80 idées de business validées par la demande réelle (FR · US · ES) : catalogue filtrable, benchmarks publics, et devis SaaS. From proven idea to shipped product.",
  keywords: ["idées business", "business ideas", "micro-SaaS", "vibe coding", "SaaS", "ideas de negocio"],
  openGraph: {
    type: "website",
    siteName: "IdeaForge",
    title: "IdeaForge — Des idées business qui gagnent déjà de l'argent",
    description: "80+ idées validées (FR · US · ES), benchmarks à l'appui.",
    url: site,
  },
  twitter: { card: "summary_large_image", title: "IdeaForge", description: "80+ idées business validées." },
  alternates: { canonical: site },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = getLocale();
  return (
    <html lang={locale}>
      <body>{children}</body>
    </html>
  );
}
