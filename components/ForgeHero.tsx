"use client";

/**
 * Accueil cinématique : la vidéo "La Forge" avance quand on descend et recule quand on remonte.
 * - vidéo chargée en Blob (fonctionne même sans Range), anneau de chargement honnête, watchdog 20 s
 * - temps affiché lissé (lerp normalisé dt), seeks jamais superposés, écritures DOM seulement si changement
 * - 5 conditions "image fixe" identiques au CSS, réévaluées en direct
 * - complet sans vidéo : l'image de départ puis l'image finale prennent le relais
 */
import { useEffect, useRef } from "react";

type Band = {
  a: number; b: number; side: "l" | "r" | "c"; fx: "rise" | "drift" | "grid" | "settle";
  kicker: string; h: string; p: string; cta?: boolean;
};

const GATES = [
  "(max-width: 720px)",
  "(orientation: portrait) and (max-width: 1024px)",
  "(orientation: portrait) and (pointer: coarse)",
  "(orientation: landscape) and (pointer: coarse) and (max-height: 560px)",
  "(prefers-reduced-motion: reduce)",
];

function rng(seed: number) {
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const smooth = (p: number, e0: number, e1: number) => {
  const t = clamp((p - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
};

/** Découpe un titre en mots (et en lettres pour l'effet "circuit"), avec des décalages reproductibles. */
function Split({ text, fx, seed }: { text: string; fx: Band["fx"]; seed: number }) {
  const r = rng(seed);
  const words = text.split(" ");
  const total = text.replace(/ /g, "").length;
  let ci = 0;
  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {words.map((w, wi) => {
          const th = fx === "grid" ? 0 : (wi / Math.max(1, words.length)) * 0.5;
          const node = (
            <span key={wi} className="w" style={{ ["--th" as string]: th.toFixed(3) }}>
              {fx === "grid"
                ? [...w].map((c, k) => {
                    const t = (ci++ / total) * 0.55 + r() * 0.06;
                    return (
                      <span key={k} className="c" style={{ ["--th" as string]: t.toFixed(3), ["--jx" as string]: `${Math.round((r() - 0.5) * 120)}px`, ["--jy" as string]: `${Math.round((r() - 0.5) * 70)}px` }}>{c}</span>
                    );
                  })
                : w}
            </span>
          );
          return <span key={wi}>{node}{wi < words.length - 1 ? " " : ""}</span>;
        })}
      </span>
    </>
  );
}

export default function ForgeHero(props: {
  video: string; poster: string; ending: string; bytes: number;
  bands: Band[]; primary: { href: string; label: string }; secondary?: { href: string; label: string };
  staticKicker: string; staticH: string; staticP: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const ringRef = useRef<SVGSVGElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current!, stage = stageRef.current!, video = videoRef.current!, ring = ringRef.current!;
    const endLayer = endRef.current!;
    const bandEls = [...stage.querySelectorAll<HTMLElement>(".fh-band")];
    const bands = bandEls.map((el) => ({ el, a: +el.dataset.a!, b: +el.dataset.b!, op: -1, k: -1 }));

    let target = 0, shown = 0, rafId: number | null = null, lastTick = 0;
    let heroOnScreen = true, scrubOn = false, started = false, initDone = false, failed = false;
    let seekBusy = false, pendingTime: number | null = null;
    let loadK = 0; const loadStart = performance.now();
    let lastEnd = -1;

    const heroProgress = () => {
      const r = track.getBoundingClientRect();
      const range = track.offsetHeight - window.innerHeight;
      return range > 0 ? clamp(-r.top / range, 0, 1) : 0;
    };

    // la tête se forme dans la première moitié du clip : on étire ce passage sur plus de scroll
    const timeAt = (p: number) => Math.pow(p, 1.5) * Math.max(0, video.duration - 0.04);

    function requestSeek(t: number) {
      if (!video.duration || failed || !video.src) return;
      if (seekBusy) { pendingTime = t; return; }
      seekBusy = true;
      video.currentTime = t;
    }
    const onSeeked = () => {
      seekBusy = false;
      if (pendingTime !== null) { const t = pendingTime; pendingTime = null; requestSeek(t); }
    };
    const onVErr = () => { seekBusy = false; pendingTime = null; failVideo(); };
    video.addEventListener("seeked", onSeeked);
    video.addEventListener("error", onVErr);

    function updateBands(p: number) {
      bands.forEach((bd, i) => {
        const { a, b } = bd;
        const f = Math.min(0.02, (b - a) / 3);
        const first = i === 0, last = i === bands.length - 1;
        let op = (first ? 1 : smooth(p, a, a + f)) * (last ? 1 : 1 - smooth(p, b - f, b));
        if (first && p < a) op = 1;
        const ramp = +(bd.el.dataset.ramp || 0) || Math.min(0.025, (b - a) * 0.35);
        let k = clamp((p - a) / ramp, 0, 1);
        if (first) k = Math.max(k, loadK);
        op = Math.round(op * 1000) / 1000;
        if (Math.abs(op - bd.op) > 0.004) {
          bd.op = op;
          bd.el.style.opacity = String(op);
          bd.el.style.visibility = op <= 0.001 ? "hidden" : "visible";
        }
        if (Math.abs(k - bd.k) > 0.008 || (k === 1 && bd.k !== 1) || (k === 0 && bd.k !== 0)) {
          bd.k = k;
          bd.el.style.setProperty("--k", k.toFixed(3));
        }
      });
      // sans vidéo : l'image finale remplace progressivement l'image de départ
      if (failed) {
        const e = Math.round(smooth(p, 0.55, 0.85) * 100) / 100;
        if (e !== lastEnd) { lastEnd = e; endLayer.style.opacity = String(e); }
      }
    }

    function tick(now: number) {
      const dt = Math.min(100, now - (lastTick || now));
      lastTick = now;
      const kk = 0.16;
      shown += (target - shown) * (1 - Math.pow(1 - kk, dt / 16.667));
      if (loadK < 1) loadK = smooth(now - loadStart, 150, 1300);
      const settled = Math.abs(target - shown) < 0.0005;
      if (settled) shown = target;
      if (video.duration) requestSeek(timeAt(shown));
      updateBands(shown);
      if (settled && loadK >= 1) { rafId = null; lastTick = 0; }
      else rafId = requestAnimationFrame(tick);
    }
    function kick() { if (rafId === null && heroOnScreen && scrubOn) rafId = requestAnimationFrame(tick); }
    const onScroll = () => { target = heroProgress(); kick(); };

    function failVideo() {
      if (failed) return;
      failed = true;
      stage.classList.add("video-failed");
      ring.classList.add("done");
      updateBands(shown);
    }

    async function loadHeroBlob() {
      const ctrl = new AbortController();
      let watchdog = window.setTimeout(() => ctrl.abort(), 20000);
      const res = await fetch(props.video, { signal: ctrl.signal, priority: "low" } as RequestInit);
      if (!res.ok || !res.body) throw new Error("video");
      const total = Number(res.headers.get("Content-Length")) || props.bytes;
      const reader = res.body.getReader();
      const chunks: BlobPart[] = [];
      let got = 0, lastRing = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        clearTimeout(watchdog);
        watchdog = window.setTimeout(() => ctrl.abort(), 20000);
        chunks.push(value as unknown as BlobPart);
        got += value.length;
        const frac = Math.min(1, got / total);
        const now = performance.now();
        if (now - lastRing > 100 || frac === 1) { lastRing = now; ring.style.setProperty("--ld", String(Math.round(126 * (1 - frac)))); }
      }
      clearTimeout(watchdog);
      ring.style.setProperty("--ld", "0");
      // Safari respecte strictement preload="none" : on autorise le chargement avant de brancher le Blob
      video.preload = "auto";
      video.muted = true; video.defaultMuted = true; video.setAttribute("muted", ""); video.setAttribute("playsinline", "");
      let ready = false;
      const onReady = () => {
        if (ready) return; ready = true;
        ring.classList.add("done");
        stage.classList.add("video-ready");
        requestSeek(timeAt(heroProgress()) || 0.001);
      };
      video.addEventListener("loadeddata", onReady, { once: true });
      video.addEventListener("canplay", onReady, { once: true });
      video.src = URL.createObjectURL(new Blob(chunks, { type: "video/mp4" }));
      video.load();
      // iOS ne décode la première image qu'après une lecture : on lance puis on met en pause aussitôt
      const pp = video.play(); if (pp && pp.then) pp.then(() => { video.pause(); onReady(); }).catch(() => {});
    }

    function initHeroOnce() {
      if (initDone) return; initDone = true;
      const poster = stage.querySelector<HTMLElement>(".fh-poster")!;
      poster.style.backgroundImage = `url('${props.poster}')`;
      endLayer.style.backgroundImage = `url('${props.ending}')`;
      const startBlob = () => { if (started) return; started = true; loadHeroBlob().catch(failVideo); };
      const img = new Image();
      img.onload = startBlob; img.onerror = startBlob; img.src = props.poster;
      window.setTimeout(startBlob, 4000);
    }

    function enableScrub() {
      if (scrubOn) return; scrubOn = true;
      initHeroOnce();
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll, { passive: true });
      bands.forEach((b) => { b.op = -1; b.k = -1; });
      target = shown = heroProgress();
      updateBands(shown);
      onScroll();
    }
    function disableScrub() {
      if (!scrubOn) return; scrubOn = false;
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
    }
    const applyHeroMode = () => (GATES.some((q) => matchMedia(q).matches) ? disableScrub() : enableScrub());
    const mqls = GATES.map((q) => matchMedia(q));
    mqls.forEach((m) => m.addEventListener("change", applyHeroMode));
    applyHeroMode();

    const io = new IntersectionObserver(([e]) => { heroOnScreen = e.isIntersecting; if (heroOnScreen) onScroll(); });
    io.observe(track);

    return () => {
      disableScrub(); io.disconnect();
      mqls.forEach((m) => m.removeEventListener("change", applyHeroMode));
      video.removeEventListener("seeked", onSeeked); video.removeEventListener("error", onVErr);
    };
  }, [props.video, props.poster, props.ending, props.bytes]);

  return (
    <section className="fh" aria-label="IdeaForge">
      <div className="fh-track" ref={trackRef}>
        <div className="fh-stage" ref={stageRef}>
          <div className="fh-poster" />
          <video ref={videoRef} className="fh-video" muted playsInline preload="none" aria-hidden="true" tabIndex={-1} />
          <div className="fh-end" ref={endRef} />
          <div className="fh-scrim" />
          {props.bands.map((b, i) => (
            <div key={i} className={`fh-band side-${b.side} fx-${b.fx}`} data-a={b.a} data-b={b.b} style={{ opacity: i === 0 ? 1 : 0 }}>
              <span className="fh-kicker mono">{b.kicker}</span>
              {i === 0
                ? <h1 className="fh-h"><Split text={b.h} fx={b.fx} seed={11 + i * 7} /></h1>
                : <h2 className="fh-h"><Split text={b.h} fx={b.fx} seed={11 + i * 7} /></h2>}
              <p className="fh-p">{b.p}</p>
              {b.cta && (
                <div className="fh-cta">
                  <a className="btn primary lg" href={props.primary.href}>{props.primary.label}</a>
                  {props.secondary && <a className="btn ghost lg" href={props.secondary.href}>{props.secondary.label}</a>}
                </div>
              )}
            </div>
          ))}
          <svg className="fh-ring" ref={ringRef} viewBox="0 0 48 48" aria-hidden="true">
            <circle cx="24" cy="24" r="20" className="bg" />
            <circle cx="24" cy="24" r="20" className="fg" strokeDasharray="126" />
          </svg>
          <a className="fh-cue mono" href="#suite" aria-label="Descendre">
            <span>Descends</span><i />
          </a>
        </div>
      </div>

      {/* Téléphones, tablettes en portrait, mouvements réduits : une image fixe composée */}
      <div className="fh-static" style={{ ["--end" as string]: `url('${props.ending}')` }}>
        <div className="fh-static-in wrap">
          <span className="fh-kicker mono">{props.staticKicker}</span>
          <p className="fh-static-h" role="heading" aria-level={2}>{props.staticH}</p>
          <p className="fh-p">{props.staticP}</p>
          <div className="fh-cta">
            <a className="btn primary lg" href={props.primary.href}>{props.primary.label}</a>
            {props.secondary && <a className="btn ghost lg" href={props.secondary.href}>{props.secondary.label}</a>}
          </div>
        </div>
      </div>
    </section>
  );
}
