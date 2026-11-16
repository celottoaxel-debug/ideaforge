import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";
import { createPost, publishPost, prepareStory, publishStory, prepareReel, publishReel, publishUgc, addUgcMedia, removeUgcMedia, requestUgc, ugcUploadUrl, UGC_HOOKS } from "@/lib/instagram/publish";
import type { Kind } from "@/lib/instagram/content";

export const maxDuration = 300;

// Admin : créer un carrousel maintenant, ou publier un brouillon.
export async function POST(request: Request) {
  const { data: { user } } = await createClient().auth.getUser();
  if (!user || !isAdminEmail(user.email)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  let body: { action?: string; kind?: string; id?: number; date?: string; filename?: string; url?: string; label?: string; duration?: number; path?: string; face?: string; end?: string; idea?: string; hook?: string } = {};
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
    if (body.action === "ugc-request" && body.face) {
      const hook = UGC_HOOKS.includes(String(body.hook)) ? String(body.hook) : UGC_HOOKS[Math.floor(Math.random() * UGC_HOOKS.length)];
      await requestUgc({ face: body.face, end: body.end || undefined, idea: body.idea || undefined, hook });
      return NextResponse.json({ ok: true });
    }
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
  return NextResponse.json({ error: "action" }, { status: 400 });
}
