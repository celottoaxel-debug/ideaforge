import type { ReactNode } from "react";
import { isPlaceholder } from "@/lib/legal";
import { SITE, ldJson, breadcrumbLd, webPageLd } from "@/lib/seo";

const DOCS = [
  { href: "/mentions-legales", label: "Mentions légales" },
  { href: "/cgv", label: "Conditions générales (CGU / CGV)" },
  { href: "/confidentialite", label: "Confidentialité & cookies" },
];

// Mise en page commune des pages légales (la version française fait foi).
export function LegalPage({ title, updated, current, children }: { title: string; updated: string; current: string; children: ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={ldJson(webPageLd({ name: title, description: `${title} du site IdeaForge (ideaforges.io).`, path: current }))} />
      <script type="application/ld+json" dangerouslySetInnerHTML={ldJson(breadcrumbLd([{ name: "Accueil", url: SITE }, { name: title, url: `${SITE}${current}` }]))} />
      <header className="nav"><div className="wrap nav-in">
        <a className="brand" href="/"><span className="mk">IF</span> IdeaForge</a>
        <a className="btn dark" href="/">←</a>
      </div></header>
      <main className="wrap legal">
        <nav className="legal-tabs" aria-label="Documents légaux">
          {DOCS.map((d) => (
            <a key={d.href} href={d.href} className={d.href === current ? "on" : ""} aria-current={d.href === current ? "page" : undefined}>{d.label}</a>
          ))}
        </nav>
        <h1>{title}</h1>
        <p className="legal-date">Dernière mise à jour : {updated}. Version française faisant foi.</p>
        <div className="legal-body">{children}</div>
      </main>
      <LegalFooter />
    </>
  );
}

// Valeur de la configuration légale : surlignée si elle reste à compléter.
export function V({ children }: { children: string }) {
  return isPlaceholder(children) ? <mark className="legal-todo">{children}</mark> : <>{children}</>;
}

export function LegalFooter() {
  return (
    <footer>
      <div className="wrap">
        <div className="brand"><span className="mk">IF</span> IdeaForge</div>
        <p className="legal-links">
          <a href="/blog">Blog</a> · <a href="/idees">Idées par thème</a> · <a href="/mentions-legales">Mentions légales</a> · <a href="/cgv">CGV</a> · <a href="/confidentialite">Confidentialité</a> · <a href="/compte">Gérer / résilier mon abonnement</a>
        </p>
        <p style={{ marginTop: 8 }}>© 2026 IdeaForge</p>
      </div>
    </footer>
  );
}
