import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";
import { createPost, publishPost, prepareStory, publishStory, prepareReel, publishReel, publishUgc, addUgcMedia, removeUgcMedia, requestUgc, ugcUploadUrl, ugcFaces, ugcEndings, UGC_HOOKS } from "@/lib/instagram/publish";
import type { Kind } from "@/lib/instagram/content";
import { runWatch, watchAccounts, watchData, setWatchAccounts, addCustomHook, customHooks } from "@/lib/instagram/watch";

export const maxDuration = 300;

// Admin : créer un carrousel maintenant, ou publier un brouillon.
export async function POST(request: Request) {
  const { data: { user } } = await createClient().auth.getUser();
  if (!user || !isAdminEmail(user.email)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  let body: { action?: string; kind?: string; id?: number; date?: string; username?: string; market?: string; theme?: string; filename?: string; url?: string; label?: string; duration?: number; path?: string; face?: string; end?: string; idea?: string; hook?: string; oid?: string } = {};
  try { body = await request.json(); } catch {}
  try {
    if (body.action === "generate") {
      const kind = (["idea", "top5", "new"].includes(String(body.kind)) ? body.kind : "idea") as Kind;
      return NextResponse.json({ ok: true, id: await createPost(kind) });
    }
    if (body.action === "publish" && Number.isInteger(body.id)) return NextResponse.json(await publishPost(body.id as number));
    if (body.action === "story-prepare") { await prepareStory(); return NextResponse.json({ ok: true }); }
    if (body.action === "story-publish") return NextResponse.json(await publishStory());
    if (body.action === "reel-prepare" && Number.isInteger(body.id)) return NextResponse.json(await prepareReel(body.id as number));
    if (body.action === "reel-publish" && Number.isInteger(body.id)) return NextResponse.json(await publishReel(body.id as number));
    if (body.action === "ugc-publish" && /^[\w-]{10,40}$/.test(String(body.date))) return NextResponse.json(await publishUgc(String(body.date)));
    const kind = body.kind === "end" ? "end" : "face";
    if (body.action === "ugc-upload-url" && body.filename) return NextResponse.json({ ok: true, ...(await ugcUploadUrl(kind, body.filename)) });
    if (body.action === "ugc-media-add" && body.url && body.label) {
      await addUgcMedia(kind, { url: body.url, label: String(body.label).slice(0, 60), duration: Number(body.duration) || undefined, path: body.path });
      return NextResponse.json({ ok: true });
    }
    if (body.action === "ugc-media-remove" && body.url) { await removeUgcMedia(kind, body.url); return NextResponse.json({ ok: true }); }
    if (body.action === "watch-refresh") { const r = await runWatch(); return NextResponse.json({ ok: true, outliers: r.outliers.length }); }
    if (body.action === "watch-add" && body.username) {
      const u = String(body.username).trim().replace(/^@/, "").toLowerCase().replace(/[^a-z0-9._]/g, "");
      if (!u) return NextResponse.json({ ok: false, error: "Nom de compte invalide" });
      const list = await watchAccounts();
      if (!list.some((a) => a.username === u)) await setWatchAccounts([...list, { username: u, market: body.market === "US" ? "US" : "FR", theme: String(body.theme || "Business IA").slice(0, 30) }]);
      return NextResponse.json({ ok: true });
    }
    if (body.action === "watch-remove" && body.username) {
      await setWatchAccounts((await watchAccounts()).filter((a) => a.username !== body.username));
      return NextResponse.json({ ok: true });
    }
    if (body.action === "hook-add" && body.hook) { await addCustomHook(String(body.hook).slice(0, 120)); return NextResponse.json({ ok: true }); }
    if (body.action === "watch-reproduce" && body.oid) {
      const o = (await watchData())?.outliers.find((x) => x.id === body.oid);
      if (!o) return NextResponse.json({ error: "Post introuvable dans la veille" }, { status: 404 });
      const [faces, ends] = await Promise.all([ugcFaces(), ugcEndings()]);
      if (!faces.length) return NextResponse.json({ error: "Ajoute d'abord une vidéo face caméra dans le studio" }, { status: 400 });
      const hook = o.idea || UGC_HOOKS[0];
      await requestUgc({ face: faces[Math.floor(Math.random() * faces.length)].url, end: ends[0]?.url, hook, format: { from: o.username, permalink: o.permalink, type: o.type, hook: o.hook, structure: o.structure, cta: o.cta, why: o.why } });
      return NextResponse.json({ ok: true });
    }
    if (body.action === "ugc-request" && body.face) {
      const allHooks = [...UGC_HOOKS, ...(await customHooks())];
      const hook = allHooks.includes(String(body.hook)) ? String(body.hook) : allHooks[Math.floor(Math.random() * allHooks.length)];
      await requestUgc({ face: body.face, end: body.end || undefined, idea: body.idea || undefined, hook });
      return NextResponse.json({ ok: true });
    }
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
  return NextResponse.json({ error: "action" }, { status: 400 });
}
