import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";
import { createPost, publishPost, prepareStory, publishStory, prepareReel, publishReel, publishUgc } from "@/lib/instagram/publish";
import type { Kind } from "@/lib/instagram/content";

export const maxDuration = 300;

// Admin : créer un carrousel maintenant, ou publier un brouillon.
export async function POST(request: Request) {
  const { data: { user } } = await createClient().auth.getUser();
  if (!user || !isAdminEmail(user.email)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  let body: { action?: string; kind?: string; id?: number; date?: string } = {};
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
    if (body.action === "ugc-publish" && /^\d{4}-\d{2}-\d{2}$/.test(String(body.date))) return NextResponse.json(await publishUgc(String(body.date)));
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
  return NextResponse.json({ error: "action" }, { status: 400 });
}
