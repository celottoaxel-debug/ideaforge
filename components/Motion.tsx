"use client";

/**
 * Mouvement global du site (toutes les pages) :
 * - [data-reveal] : entrée chorégraphiée quand l'élément arrive à l'écran (classe .in)
 * - .trace : lignes de circuit SVG qui se dessinent avec le scroll
 * - onglet caché : toutes les animations en pause
 * - mouvements réduits : tout s'affiche directement dans son état final, en direct
 */
import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function Motion() {
  const path = usePathname();

  useEffect(() => {
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    const els = [...document.querySelectorAll<HTMLElement>("[data-reveal]:not(.in)")];
    const traces = [...document.querySelectorAll<SVGPathElement>(".trace path")];
    traces.forEach((p) => {
      const L = Math.ceil(p.getTotalLength());
      p.style.strokeDasharray = String(L);
      p.dataset.len = String(L);
    });

    const pin = () => {
      els.forEach((e) => e.classList.add("in"));
      traces.forEach((p) => (p.style.strokeDashoffset = "0"));
    };

    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const t = e.target;
        t.classList.add("in"); io.unobserve(t);
        window.setTimeout(() => t.classList.add("settled"), 1400); // les délais d'entrée ne freinent plus les survols
      }),
      { rootMargin: "0px 0px -12% 0px", threshold: 0.08 },
    );

    let raf: number | null = null;
    const last = new Map<SVGPathElement, number>();
    const draw = () => {
      raf = null;
      const vh = window.innerHeight;
      traces.forEach((p) => {
        const r = (p.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
        const prog = Math.min(1, Math.max(0, (vh - r.top) / (vh * 0.6 + r.height)));
        const off = Math.round(+p.dataset.len! * (1 - prog));
        if (last.get(p) !== off) { last.set(p, off); p.style.strokeDashoffset = String(off); }
      });
    };
    const onScroll = () => { if (raf === null) raf = requestAnimationFrame(draw); };

    const arm = () => {
      if (mq.matches) { io.disconnect(); window.removeEventListener("scroll", onScroll); pin(); return; }
      els.forEach((e) => { if (!e.classList.contains("in")) io.observe(e); });
      window.addEventListener("scroll", onScroll, { passive: true });
      draw();
    };
    const onMq = () => { io.disconnect(); window.removeEventListener("scroll", onScroll); last.clear(); arm(); };
    mq.addEventListener("change", onMq);
    arm();

    const onVis = () => document.body.classList.toggle("paused", document.hidden);
    document.addEventListener("visibilitychange", onVis);

    return () => {
      io.disconnect(); window.removeEventListener("scroll", onScroll);
      mq.removeEventListener("change", onMq); document.removeEventListener("visibilitychange", onVis);
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, [path]);

  return null;
}
