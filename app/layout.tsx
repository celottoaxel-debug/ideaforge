import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IdeaForge — From proven idea to shipped product",
  description:
    "Des idées de business validées par la demande réelle (FR · US · ES) : catalogue filtrable, benchmarks, devis SaaS et comptes.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
