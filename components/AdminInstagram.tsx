"use client";

import { useState } from "react";

/** Boutons du panel Instagram : créer un carrousel, publier un brouillon, copier la légende. */
export function GenerateCarousel() {
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState("");
  async function go(kind: string) {
    setBusy(kind); setErr("");
    try {
      const r = await fetch("/api/admin/instagram", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "generate", kind }) });
      const j = await r.json();
      if (j.ok) window.location.reload(); else setErr(j.error || "Erreur");
    } catch { setErr("Erreur réseau"); }
    setBusy(null);
  }
  return (
    <div className="ig-gen">
      {[["tofu", "🧲 TOFU : attirer"], ["mofu", "🤝 MOFU : convaincre"], ["bofu", "🎯 BOFU : convertir"], ["idea", "💡 1 idée chiffrée"], ["top5", "🏆 Top 5"], ["new", "✨ Nouvelle idée IA"]].map(([k, l]) => (
        <button key={k} type="button" className="btn" disabled={!!busy} onClick={() => go(k)}>{busy === k ? "Création…" : l}</button>
      ))}
      {err && <p className="msg err">{err}</p>}
    </div>
  );
}

export function PublishButton({ id, disabled }: { id: number; disabled?: boolean }) {
  const [state, setState] = useState<"idle" | "busy" | "err">("idle");
  const [err, setErr] = useState("");
  async function go() {
    setState("busy");
    try {
      const r = await fetch("/api/admin/instagram", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "publish", id }) });
      const j = await r.json();
      if (j.ok) { window.location.reload(); return; }
      setErr(j.error || "Erreur"); setState("err");
    } catch { setErr("Erreur réseau"); setState("err"); }
  }
  return (
    <>
      <button type="button" className="btn primary" onClick={go} disabled={disabled || state === "busy"}>{state === "busy" ? "Publication… (30 s)" : "📸 Publier sur Instagram"}</button>
      {state === "err" && <p className="msg err">{err}</p>}
    </>
  );
}

export function CopyCaption({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return <button type="button" className="btn" onClick={async () => { try { await navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 1800); } catch {} }}>{ok ? "Copié ✓" : "Copier la légende"}</button>;
}

export function StoryButtons({ canPublish, published }: { canPublish: boolean; published: boolean }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState("");
  async function go(action: string) {
    setBusy(action); setErr("");
    try {
      const r = await fetch("/api/admin/instagram", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
      const j = await r.json();
      if (j.ok) { window.location.reload(); return; }
      setErr(j.error || "Erreur");
    } catch { setErr("Erreur réseau"); }
    setBusy(null);
  }
  if (published) return null;
  return (
    <div className="ig-actions">
      <button type="button" className="btn" disabled={!!busy} onClick={() => go("story-prepare")}>{busy === "story-prepare" ? "Préparation…" : "🔄 Préparer la story du jour"}</button>
      <button type="button" className="btn primary" disabled={!canPublish || !!busy} onClick={() => go("story-publish")}>{busy === "story-publish" ? "Publication…" : "📲 Publier la story"}</button>
      {err && <p className="msg err">{err}</p>}
    </div>
  );
}

export function ReelButtons({ id, canPublish, hasVideo }: { id: number; canPublish: boolean; hasVideo: boolean }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState("");
  async function go(action: string) {
    setBusy(action); setErr("");
    try {
      const r = await fetch("/api/admin/instagram", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, id }) });
      const j = await r.json();
      if (j.ok) { window.location.reload(); return; }
      setErr(j.error || "Erreur");
    } catch { setErr("Erreur réseau"); }
    setBusy(null);
  }
  return (
    <>
      <button type="button" className="btn" disabled={!!busy} onClick={() => go("reel-prepare")}>{busy === "reel-prepare" ? "Montage… (1 min)" : hasVideo ? "🎬 Refaire la vidéo" : "🎬 Créer le réel"}</button>
      {hasVideo && <button type="button" className="btn primary" disabled={!canPublish || !!busy} onClick={() => go("reel-publish")}>{busy === "reel-publish" ? "Publication… (1-2 min)" : "🎬 Publier le réel"}</button>}
      {err && <p className="msg err">{err}</p>}
    </>
  );
}

export function UgcPublish({ date, disabled }: { date: string; disabled?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  async function go(action = "ugc-publish") {
    setBusy(true); setErr("");
    try {
      const r = await fetch("/api/admin/instagram", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, date }) });
      const j = await r.json();
      if (j.ok) { window.location.reload(); return; }
      setErr(j.error || "Erreur");
    } catch { setErr("Erreur réseau"); }
    setBusy(false);
  }
  return (
    <>
      <button type="button" className="btn primary" disabled={disabled || busy} onClick={() => go()}>{busy ? "Publication… (1-2 min)" : "🎥 Publier sur Instagram"}</button>
      {err && <p className="msg err">{err}</p>}
    </>
  );
}

type Media = { url: string; label: string; duration?: number };
async function api(body: Record<string, unknown>) {
  const r = await fetch("/api/admin/instagram", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.ok === false || j.error) throw new Error(j.error || "Erreur");
  return j;
}

/** Envoi d'une vidéo (face caméra ou fin) directement vers le stockage, puis ajout à la bibliothèque. */
function MediaUpload({ kind, label }: { kind: "face" | "end"; label: string }) {
  const [state, setState] = useState("");
  async function onFile(f: File | undefined) {
    if (!f) return;
    const mo = Math.round(f.size / 1048576);
    setState(`Envoi de ${mo} Mo en cours… (garde la page ouverte)`);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const up = await api({ action: "ugc-upload-url", kind, filename: f.name });
      const { error } = await createClient().storage.from("ig-media").uploadToSignedUrl(up.path, up.token, f, { contentType: f.type || "video/mp4" });
      if (error) throw new Error(/maximum allowed size|too large|413/i.test(error.message) ? `vidéo trop lourde (${mo} Mo) pour la limite d'envoi de Supabase` : error.message);
      const duration = await new Promise<number>((res) => { const v = document.createElement("video"); v.preload = "metadata"; v.onloadedmetadata = () => res(v.duration || 0); v.onerror = () => res(0); v.src = URL.createObjectURL(f); });
      const name = (f.name.replace(/\.[^.]+$/, "") || "Vidéo").slice(0, 40);
      await api({ action: "ugc-media-add", kind, url: up.publicUrl, path: up.path, label: name, duration: Math.round(duration * 10) / 10 });
      window.location.reload();
    } catch (e) {
      const m = e instanceof Error ? e.message : "envoi impossible";
      setState(`Erreur : ${/load failed|failed to fetch|network/i.test(m) ? `connexion coupée pendant l'envoi (${mo} Mo)` : m}`);
    }
  }
  return (
    <label className="btn" style={{ cursor: "pointer" }}>
      {state ? state : label}
      <input type="file" accept="video/*" style={{ display: "none" }} onChange={(e) => onFile(e.target.files?.[0])} />
    </label>
  );
}

export function UgcStudio({ faces, endings, ideas, hooks }: { faces: Media[]; endings: Media[]; ideas: { path: string; title: string; score: number }[]; hooks: string[] }) {
  const [face, setFace] = useState(faces[0]?.url ?? "");
  const [end, setEnd] = useState(endings[0]?.url ?? "");
  const [idea, setIdea] = useState("");
  const [hook, setHook] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  async function create() {
    setBusy(true); setMsg("");
    try { await api({ action: "ugc-request", face, end, idea, hook }); window.location.reload(); }
    catch (e) { setMsg(e instanceof Error ? e.message : "Erreur"); setBusy(false); }
  }
  async function remove(kind: "face" | "end", url: string) {
    if (!window.confirm("Retirer cette vidéo de la bibliothèque ?")) return;
    try { await api({ action: "ugc-media-remove", kind, url }); window.location.reload(); } catch {}
  }
  const vids = (list: Media[], kind: "face" | "end", sel: string, set: (u: string) => void, none?: boolean) => (
    <div className="ugc-vids">
      {none && <button type="button" className={`ugc-vid none ${sel === "" ? "on" : ""}`} onClick={() => set("")}>Sans<br />(fin sur toi)</button>}
      {list.map((m) => (
        <div key={m.url} className={`ugc-vid ${sel === m.url ? "on" : ""}`}>
          <button type="button" onClick={() => set(m.url)} aria-label={`Choisir ${m.label}`}>
            <video src={`${m.url}#t=1`} muted playsInline preload="metadata" />
          </button>
          <span>{m.label}{m.duration ? ` · ${Math.round(m.duration)} s` : ""}</span>
          <button type="button" className="ugc-x" onClick={() => remove(kind, m.url)} aria-label="Retirer">×</button>
        </div>
      ))}
    </div>
  );
  return (
    <div className="ig-post ugc-studio">
      <div className="ig-head"><b>1. Ta vidéo face caméra</b><MediaUpload kind="face" label="＋ Ajouter une vidéo de toi" /></div>
      {faces.length ? vids(faces, "face", face, setFace) : <p className="vis-empty">Ajoute une vidéo de toi au bureau (40 s ou plus, geste vers la caméra au début).</p>}
      <div className="ig-head"><b>2. La fin (écran de téléphone)</b><MediaUpload kind="end" label="＋ Ajouter une fin" /></div>
      {vids(endings, "end", end, setEnd, true)}
      <div className="ugc-row">
        <label><b>3. L&apos;idée filmée</b>
          <select value={idea} onChange={(e) => setIdea(e.target.value)}>
            <option value="">Automatique : la mieux notée pas encore utilisée</option>
            {ideas.map((i) => <option key={i.path} value={i.path}>{i.score}/100 · {i.title.slice(0, 60)}</option>)}
          </select>
        </label>
        <label><b>4. L&apos;accroche</b>
          <select value={hook} onChange={(e) => setHook(e.target.value)}>
            <option value="">Au hasard</option>
            {hooks.map((h) => <option key={h} value={h}>{h.replace("|", " ").replace("{s}", "38")}</option>)}
          </select>
        </label>
      </div>
      <div className="ig-actions">
        <button type="button" className="btn primary" disabled={!face || busy} onClick={create}>{busy ? "Envoi…" : "🎬 Créer le réel face caméra"}</button>
        {msg && <p className="msg err">{msg}</p>}
      </div>
      <p className="ugc-note">Le réel est monté dans l&apos;heure (de 8 h à 23 h), puis il apparaît juste au-dessus avec les boutons Publier et Télécharger.</p>
    </div>
  );
}

/** Veille concurrents : actualiser, ajouter / retirer un compte, réutiliser une accroche. */
export function WatchRefresh() {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  return (
    <>
      <button type="button" className="btn primary" disabled={busy} onClick={async () => { setBusy(true); setErr(""); try { await api({ action: "watch-refresh" }); window.location.reload(); } catch (e) { setErr(e instanceof Error ? e.message : "Erreur"); setBusy(false); } }}>
        {busy ? "Analyse en cours… (1 min)" : "🔄 Actualiser maintenant"}
      </button>
      {err && <p className="msg err">{err}</p>}
    </>
  );
}

export function WatchAdd() {
  const [u, setU] = useState("");
  const [market, setMarket] = useState("FR");
  const [busy, setBusy] = useState(false);
  return (
    <form className="watch-add" onSubmit={async (e) => { e.preventDefault(); if (!u.trim()) return; setBusy(true); try { await api({ action: "watch-add", username: u, market }); window.location.reload(); } catch { setBusy(false); } }}>
      <input value={u} onChange={(e) => setU(e.target.value)} placeholder="@compte à surveiller" autoCapitalize="none" autoCorrect="off" />
      <select value={market} onChange={(e) => setMarket(e.target.value)}><option value="FR">🇫🇷 FR</option><option value="US">🇺🇸 US</option></select>
      <button type="submit" className="btn" disabled={busy}>{busy ? "…" : "＋ Ajouter"}</button>
    </form>
  );
}

export function WatchRemove({ username }: { username: string }) {
  return <button type="button" className="ugc-x" style={{ position: "static" }} aria-label={`Retirer ${username}`} onClick={async () => { if (!window.confirm(`Ne plus surveiller @${username} ?`)) return; try { await api({ action: "watch-remove", username }); window.location.reload(); } catch {} }}>×</button>;
}

export function UseHook({ hook }: { hook: string }) {
  const [state, setState] = useState<"" | "busy" | "ok">("");
  return (
    <button type="button" className="btn" disabled={state !== ""} onClick={async () => { setState("busy"); try { await api({ action: "hook-add", hook }); setState("ok"); } catch { setState(""); } }}>
      {state === "ok" ? "Ajoutée ✓" : state === "busy" ? "…" : "＋ À mes accroches de réels"}
    </button>
  );
}

export function Reproduce({ oid }: { oid: string }) {
  const [state, setState] = useState<"" | "busy" | "ok">("");
  const [err, setErr] = useState("");
  return (
    <>
      <button type="button" className="btn primary" disabled={state !== ""} onClick={async () => { setState("busy"); setErr(""); try { await api({ action: "watch-reproduce", oid }); setState("ok"); } catch (e) { setErr(e instanceof Error ? e.message : "Erreur"); setState(""); } }}>
        {state === "ok" ? "Demandé ✓ (prêt dans l'heure)" : state === "busy" ? "…" : "🎬 Reproduire ce format"}
      </button>
      {err && <span className="ugc-note">{err}</span>}
    </>
  );
}

/** Ouvre Instagram sur l'iPhone avec les slides prêtes ; la légende + hashtags est copiée pour être collée. */
export function ShareToInstagram({ id }: { id: number }) {
  const [state, setState] = useState<"idle" | "busy" | "ready" | "shared" | "done">("idle");
  const [err, setErr] = useState("");
  const [data, setData] = useState<{ caption: string; files: File[] } | null>(null);
  async function prepare() {
    setState("busy"); setErr("");
    try {
      const j = await api({ action: "manual-caption", id });
      const files: File[] = [];
      for (let n = 1; n <= j.slides; n++) {
        const r = await fetch(`/api/ig/jpg/${id}/${n}.jpg`);
        if (!r.ok) throw new Error(`Slide ${n} introuvable`);
        files.push(new File([await r.blob()], `ideaforge-${id}-${n}.jpg`, { type: "image/jpeg" }));
      }
      if (!navigator.canShare || !navigator.canShare({ files })) throw new Error("Ouvre ce panel sur ton iPhone (Safari) pour utiliser ce bouton.");
      setData({ caption: j.caption, files }); setState("ready");
    } catch (e) { setErr(e instanceof Error ? e.message : "Erreur"); setState("idle"); }
  }
  async function open() {
    if (!data) return;
    navigator.clipboard.writeText(data.caption).catch(() => {});
    try { await navigator.share({ files: data.files }); setState("shared"); }
    catch (e) { if (!(e instanceof Error && e.name === "AbortError")) setErr("Le partage n'a pas marché, réessaie."); }
  }
  async function done() {
    try { await api({ action: "manual-done", id }); setState("done"); window.location.reload(); } catch (e) { setErr(e instanceof Error ? e.message : "Erreur"); }
  }
  return (
    <>
      {state === "idle" && <button type="button" className="btn primary" onClick={prepare}>🎵 Poster moi-même (avec musique)</button>}
      {state === "busy" && <button type="button" className="btn primary" disabled>Préparation des slides…</button>}
      {state === "ready" && <button type="button" className="btn primary" onClick={open}>📲 Ouvrir Instagram</button>}
      {state === "shared" && <>
        <button type="button" className="btn" onClick={open}>📲 Rouvrir Instagram</button>
        <button type="button" className="btn primary" onClick={done}>✅ J&apos;ai publié</button>
      </>}
      {(state === "ready" || state === "shared") && <p className="ugc-note" style={{ width: "100%" }}>Dans le menu, choisis <b>Instagram</b> puis <b>Publication</b>. Ajoute ta musique, puis dans la légende fais un appui long → <b>Coller</b> : la description et les hashtags sont déjà copiés.</p>}
      {err && <p className="msg err">{err}</p>}
    </>
  );
}

/** « Archiver la publication » : un clic quand c'est posté, et ça part dans 🗂️ Archives. */
export function ArchiveButton({ type, id, label = "🗂️ Archiver la publication" }: { type: "post" | "reel" | "ugc" | "story" | "poll"; id: string | number; label?: string }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  async function go() {
    setBusy(true); setErr("");
    try { await api({ action: "archive", type, key: String(id) }); window.location.reload(); return; }
    catch (e) { setErr(e instanceof Error ? e.message : "Erreur"); }
    setBusy(false);
  }
  return (
    <>
      <button type="button" className="btn ig-archive" disabled={busy} onClick={go}>{busy ? "Archivage…" : label}</button>
      {err && <p className="msg err">{err}</p>}
    </>
  );
}
