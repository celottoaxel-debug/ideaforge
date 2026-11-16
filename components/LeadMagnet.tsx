"use client";

import { useEffect, useRef, useState } from "react";
import { getTop10 } from "@/app/actions";

const L = {
  fr: { eb: "Gratuit", h: "Le Top 10 des idées les mieux notées", p: "Les 10 idées avec le meilleur score IdeaForge, chiffrées (budget, revenus), envoyées dans ta boîte mail. Puis une idée chaque semaine.", ph: "ton@email.com", btn: "Recevoir le Top 10", busy: "Envoi…", ok: "✓ C'est parti ! Regarde ta boîte mail (et les spams, au cas où).", err: "Adresse invalide ou erreur, réessaie.", legal: "Désinscription en 1 clic.", pre: "Avant de partir…", close: "Fermer" },
  en: { eb: "Free", h: "The Top 10 best-rated ideas", p: "The 10 ideas with the best IdeaForge score, costed (budget, revenue), sent to your inbox. Then one idea every week.", ph: "you@email.com", btn: "Get the Top 10", busy: "Sending…", ok: "✓ Done! Check your inbox (and spam, just in case).", err: "Invalid address or error, try again.", legal: "Unsubscribe in one click.", pre: "Before you go…", close: "Close" },
  es: { eb: "Gratis", h: "El Top 10 de las ideas mejor puntuadas", p: "Las 10 ideas con mejor puntuación IdeaForge, con cifras (presupuesto, ingresos), en tu correo. Luego una idea cada semana.", ph: "tu@email.com", btn: "Recibir el Top 10", busy: "Enviando…", ok: "✓ ¡Listo! Revisa tu correo (y el spam, por si acaso).", err: "Dirección inválida o error, inténtalo de nuevo.", legal: "Baja en un clic.", pre: "Antes de irte…", close: "Cerrar" },
};
type Loc = keyof typeof L;

function Form({ t, source }: { t: (typeof L)["fr"]; source: string }) {
  const [state, setState] = useState<"idle" | "busy" | "ok" | "err">("idle");
  async function action(fd: FormData) {
    setState("busy");
    fd.set("source", source);
    const r = await getTop10(fd);
    setState(r.ok ? "ok" : "err");
    if (r.ok) { try { localStorage.setItem("if_top10", "1"); } catch {} }
  }
  if (state === "ok") return <p className="lm-ok">{t.ok}</p>;
  return (
    <form className="lm-form" action={action}>
      <label className="sr-only" htmlFor={`lm-${source}`}>E-mail</label>
      <input id={`lm-${source}`} name="email" type="email" required placeholder={t.ph} autoComplete="email" />
      <button className="btn primary" type="submit" disabled={state === "busy"}>{state === "busy" ? t.busy : t.btn}</button>
      {state === "err" && <p className="msg err" style={{ flexBasis: "100%" }}>{t.err}</p>}
    </form>
  );
}

/** Bloc « Top 10 » intégré dans la page. */
export function LeadMagnet({ locale = "fr" }: { locale?: string }) {
  const t = L[locale as Loc] ?? L.fr;
  return (
    <div className="lm" data-reveal>
      <span className="lm-medal" aria-hidden="true">🏆</span>
      <div className="lm-txt">
        <span className="eyebrow">{t.eb}</span>
        <h2>{t.h}</h2>
        <p>{t.p}</p>
      </div>
      <div className="lm-side">
        <Form t={t} source="top10" />
        <span className="lm-legal">{t.legal}</span>
      </div>
    </div>
  );
}

/**
 * Fenêtre de sortie : s'affiche une seule fois (puis pas avant 7 jours),
 * quand la souris quitte la page par le haut, ou sur téléphone après 35 s et la moitié de la page lue.
 */
export function ExitOffer({ locale = "fr" }: { locale?: string }) {
  const t = L[locale as Loc] ?? L.fr;
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let seen = false;
    try {
      const last = Number(localStorage.getItem("if_exit") || 0);
      seen = Date.now() - last < 7 * 86_400_000 || localStorage.getItem("if_top10") === "1";
    } catch {}
    if (seen) return;
    const show = () => {
      if (seen) return; seen = true;
      try { localStorage.setItem("if_exit", String(Date.now())); } catch {}
      setOpen(true);
    };
    const onOut = (e: MouseEvent) => { if (!e.relatedTarget && e.clientY <= 0) show(); };
    const start = Date.now();
    const onScroll = () => {
      const deep = window.scrollY / Math.max(1, document.body.scrollHeight - window.innerHeight) > 0.5;
      if (deep && Date.now() - start > 35_000) show();
    };
    const coarse = matchMedia("(pointer: coarse)").matches;
    if (coarse) window.addEventListener("scroll", onScroll, { passive: true });
    else document.addEventListener("mouseout", onOut);
    return () => { document.removeEventListener("mouseout", onOut); window.removeEventListener("scroll", onScroll); };
  }, []);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;
  return (
    <div className="xo" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
      <div className="xo-box" role="dialog" aria-modal="true" aria-labelledby="xo-h">
        <button ref={closeRef} type="button" className="xo-close" onClick={() => setOpen(false)} aria-label={t.close}>×</button>
        <span className="eyebrow">{t.pre}</span>
        <h2 id="xo-h">🏆 {t.h}</h2>
        <p>{t.p}</p>
        <Form t={t} source="exit" />
        <span className="lm-legal">{t.legal}</span>
      </div>
    </div>
  );
}
