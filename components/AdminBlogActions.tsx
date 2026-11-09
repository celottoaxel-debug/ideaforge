"use client";

import { useState } from "react";

async function call(body: Record<string, unknown>) {
  const r = await fetch("/api/admin/blog", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  return r.json();
}

export function PostActions({ id, status, slug, checks }: { id: string; status: string; slug: string; checks: number }) {
  const [busy, setBusy] = useState(false);
  async function run(action: string) {
    if (action === "delete" && !confirm("Supprimer définitivement cet article ?")) return;
    if (action === "publish" && checks > 0 && !confirm(`Il reste ${checks} passage(s) « [à vérifier] ». Publier quand même ?`)) return;
    setBusy(true);
    const d = await call({ action, id });
    setBusy(false);
    if (d.ok) location.reload(); else alert(d.error || "Erreur");
  }
  return (
    <div className="blog-actions">
      <a className="btn" href={`/blog/${slug}`} target="_blank">Lire</a>
      <a className="btn" href={`/admin/blog/edit?id=${id}`}>Modifier</a>
      {status === "draft"
        ? <button className="btn primary" disabled={busy} onClick={() => run("publish")}>✅ Publier</button>
        : <button className="btn" disabled={busy} onClick={() => run("unpublish")}>Dépublier</button>}
      <button className="btn" disabled={busy} onClick={() => run("delete")}>Supprimer</button>
    </div>
  );
}

export function GenerateButton() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  async function go() {
    setBusy(true); setMsg("");
    const d = await call({ action: "generate" }).catch((e) => ({ ok: false, error: String(e) }));
    setBusy(false);
    if (d.ok) location.reload(); else setMsg(`❌ ${d.error}`);
  }
  return (
    <span>
      <button className="btn" disabled={busy} onClick={go}>{busy ? "Rédaction en cours… (30–60 s)" : "🤖 Rédiger un article maintenant"}</button>
      {msg && <span style={{ marginLeft: 10, fontSize: 14 }}>{msg}</span>}
    </span>
  );
}

export function PostEditor({ post }: { post: { id?: string; title?: string; slug?: string; description?: string | null; tags?: string[]; content_md?: string } }) {
  const [f, setF] = useState({
    title: post.title ?? "", slug: post.slug ?? "", description: post.description ?? "",
    tags: (post.tags ?? []).join(", "), content_md: post.content_md ?? "",
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  async function save(publish: boolean) {
    setBusy(true); setMsg("");
    const d = await call({ action: "save", id: post.id, publish, ...f });
    setBusy(false);
    if (d.ok) location.href = "/admin/blog"; else setMsg(`❌ ${d.error}`);
  }

  return (
    <div className="blog-editor">
      <label>Titre (50 à 65 caractères)<input value={f.title} onChange={set("title")} /><small>{f.title.length} caractères</small></label>
      <label>Adresse (slug, vide = générée depuis le titre)<input value={f.slug} onChange={set("slug")} placeholder="mon-article" /></label>
      <label>Description Google (140 à 160 caractères)<textarea rows={2} value={f.description} onChange={set("description")} /><small>{f.description.length} caractères</small></label>
      <label>Mots-clés (séparés par des virgules)<input value={f.tags} onChange={set("tags")} /></label>
      <label>Contenu (Markdown : ## titre, **gras**, - liste, [lien](/adresse), tableaux)<textarea rows={26} value={f.content_md} onChange={set("content_md")} style={{ fontFamily: "var(--mono)", fontSize: 13 }} /></label>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button className="btn" disabled={busy} onClick={() => save(false)}>Enregistrer en brouillon</button>
        <button className="btn primary" disabled={busy} onClick={() => save(true)}>Enregistrer et publier</button>
        <a className="btn" href="/admin/blog">Annuler</a>
      </div>
      {msg && <p className="msg err">{msg}</p>}
    </div>
  );
}
