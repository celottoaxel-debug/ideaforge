"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [msg, setMsg] = useState("");
  const supabase = createClient();
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (typeof window !== "undefined" ? window.location.origin : "");

  async function oauth(provider: "google" | "github") {
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${siteUrl}/auth/callback` },
    });
  }

  async function magicLink(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${siteUrl}/auth/callback` },
    });
    if (error) setMsg(error.message);
    else setSent(true);
  }

  return (
    <main className="auth-wrap">
      <div className="auth-card">
        <div className="brand"><span className="mk">IF</span> IdeaForge</div>
        <h1>Crée ton compte</h1>
        <p className="sub">Sauvegarde tes idées favorites et retrouve-les partout.</p>

        <button className="prov google" onClick={() => oauth("google")}>Continuer avec Google</button>
        <button className="prov github" onClick={() => oauth("github")}>Continuer avec GitHub</button>

        <div className="or"><span>ou</span></div>

        {sent ? (
          <p className="ok">✓ Lien de connexion envoyé à <b>{email}</b>. Vérifie ta boîte mail.</p>
        ) : (
          <form onSubmit={magicLink}>
            <input
              type="email"
              required
              placeholder="ton@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button className="prov primary" type="submit">Recevoir un lien de connexion</button>
          </form>
        )}
        {msg && <p className="err">{msg}</p>}
        <a className="back" href="/">← Retour au catalogue</a>
      </div>
    </main>
  );
}
