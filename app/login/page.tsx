"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const L: Record<string, Record<string, string>> = {
  fr: { title: "Crée ton compte", sub: "🎁 Gratuit : 1 fiche complète offerte, plus tes idées favorites sauvegardées partout.", google: "Continuer avec Google", github: "Continuer avec GitHub", or: "ou", ph: "ton@email.com", btn: "Recevoir un lien de connexion", sent: "✓ Lien de connexion envoyé à", check: "Vérifie ta boîte mail.", back: "← Retour au catalogue", errAuth: "La connexion n'a pas abouti. Ouvre le lien dans le même navigateur que celui où tu as tapé ton e-mail, ou demande un nouveau lien ci-dessous.", errExpired: "Ce lien a expiré ou a déjà servi. Demande un nouveau lien ci-dessous." },
  en: { title: "Create your account", sub: "🎁 Free: 1 full sheet included, plus your favorite ideas saved everywhere.", google: "Continue with Google", github: "Continue with GitHub", or: "or", ph: "you@email.com", btn: "Send me a login link", sent: "✓ Login link sent to", check: "Check your inbox.", back: "← Back to catalog", errAuth: "Sign-in didn't go through. Open the link in the same browser where you typed your email, or request a new link below.", errExpired: "This link has expired or was already used. Request a new link below." },
  es: { title: "Crea tu cuenta", sub: "🎁 Gratis: 1 ficha completa de regalo, y tus ideas favoritas guardadas.", google: "Continuar con Google", github: "Continuar con GitHub", or: "o", ph: "tu@email.com", btn: "Enviarme un enlace de acceso", sent: "✓ Enlace de acceso enviado a", check: "Revisa tu correo.", back: "← Volver al catálogo", errAuth: "No se pudo iniciar sesión. Abre el enlace en el mismo navegador donde escribiste tu correo, o pide un enlace nuevo abajo.", errExpired: "Este enlace ha caducado o ya se usó. Pide un enlace nuevo abajo." },
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
  useEffect(() => {
    const tt = L[readLocale()] ?? L.fr;
    setT(tt);
    const err = new URLSearchParams(window.location.search).get("error");
    if (err === "auth") setMsg(tt.errAuth);
    else if (err === "expired") setMsg(tt.errExpired);
    // ?next=/page : on revient sur cette page après la connexion (mémorisé 10 min)
    const n = new URLSearchParams(window.location.search).get("next");
    if (n && n.startsWith("/") && !n.startsWith("//")) document.cookie = `if_next=${encodeURIComponent(n)}; path=/; max-age=600; samesite=lax`;
  }, []);

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
