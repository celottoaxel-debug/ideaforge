import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";
import { createPost, publishPost, prepareStory, publishStory } from "@/lib/instagram/publish";
import type { Kind } from "@/lib/instagram/content";

export const maxDuration = 120;

// Admin : créer un carrousel maintenant, ou publier un brouillon.
export async function POST(request: Request) {
  const { data: { user } } = await createClient().auth.getUser();
  if (!user || !isAdminEmail(user.email)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  let body: { action?: string; kind?: string; id?: number } = {};
  try { body = await request.json(); } catch {}
  try {
    if (body.action === "generate") {
      const kind = (["idea", "top5", "new"].includes(String(body.kind)) ? body.kind : "idea") as Kind;
      return NextResponse.json({ ok: true, id: await createPost(kind) });
    }
    if (body.action === "publish" && Number.isInteger(body.id)) return NextResponse.json(await publishPost(body.id as number));
    if (body.action === "story-prepare") { await prepareStory(); return NextResponse.json({ ok: true }); }
    if (body.action === "story-publish") return NextResponse.json(await publishStory());
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
  return NextResponse.json({ error: "action" }, { status: 400 });
}
