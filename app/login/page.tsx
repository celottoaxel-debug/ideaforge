"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const L: Record<string, Record<string, string>> = {
  fr: { title: "Crée ton compte", sub: "Sauvegarde tes idées favorites et retrouve-les partout.", google: "Continuer avec Google", github: "Continuer avec GitHub", or: "ou", ph: "ton@email.com", btn: "Recevoir un lien de connexion", sent: "✓ Lien de connexion envoyé à", check: "Vérifie ta boîte mail.", back: "← Retour au catalogue" },
  en: { title: "Create your account", sub: "Save your favorite ideas and find them anywhere.", google: "Continue with Google", github: "Continue with GitHub", or: "or", ph: "you@email.com", btn: "Send me a login link", sent: "✓ Login link sent to", check: "Check your inbox.", back: "← Back to catalog" },
  es: { title: "Crea tu cuenta", sub: "Guarda tus ideas favoritas y encuéntralas en cualquier lugar.", google: "Continuar con Google", github: "Continuar con GitHub", or: "o", ph: "tu@email.com", btn: "Enviarme un enlace de acceso", sent: "✓ Enlace de acceso enviado a", check: "Revisa tu correo.", back: "← Volver al catálogo" },
};

function readLocale(): string {
  if (typeof document === "undefined") return "fr";
  const m = document.cookie.match(/(?:^|; )locale=(fr|en|es)/);
  return m ? m[1] : "fr";
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [msg, setMsg] = useState("");
  const [t, setT] = useState(L.fr);
  useEffect(() => { setT(L[readLocale()] ?? L.fr); }, []);

  const supabase = createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== "undefined" ? window.location.origin : "");

  async function oauth(provider: "google" | "github") {
    await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: `${siteUrl}/auth/callback` } });
  }
  async function magicLink(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${siteUrl}/auth/callback` } });
    if (error) setMsg(error.message); else setSent(true);
  }

  return (
    <main className="auth-wrap">
      <div className="auth-card">
        <div className="brand"><span className="mk">IF</span> IdeaForge</div>
        <h1>{t.title}</h1>
        <p className="sub">{t.sub}</p>
        <button className="prov google" onClick={() => oauth("google")}>{t.google}</button>
        <button className="prov github" onClick={() => oauth("github")}>{t.github}</button>
        <div className="or"><span>{t.or}</span></div>
        {sent ? (
          <p className="ok">{t.sent} <b>{email}</b>. {t.check}</p>
        ) : (
          <form onSubmit={magicLink}>
            <input type="email" required placeholder={t.ph} value={email} onChange={(e) => setEmail(e.target.value)} />
            <button className="prov primary" type="submit">{t.btn}</button>
          </form>
        )}
        {msg && <p className="err">{msg}</p>}
        <a className="back" href="/">{t.back}</a>
      </div>
    </main>
  );
}
