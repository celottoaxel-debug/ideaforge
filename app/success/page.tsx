export const dynamic = "force-dynamic";

export default function SuccessPage() {
  return (
    <main className="auth-wrap">
      <div className="auth-card">
        <div className="brand"><span className="mk">IF</span> IdeaForge</div>
        <h1>🎉 Bienvenue, membre à vie !</h1>
        <p className="sub">
          Ton paiement est confirmé. Toutes les fiches, prompts et la génération illimitée sont
          débloqués. (Le déverrouillage s&apos;applique dès que le webhook a traité le paiement — quelques secondes.)
        </p>
        <a className="prov primary" href="/">Explorer le catalogue complet →</a>
      </div>
    </main>
  );
}
