import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/admin";
import { slugify } from "@/lib/blog/markdown";
import { runBlogAutopilot } from "@/lib/blog/autopilot";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Actions du panel blog : publish | unpublish | delete | generate | save
export async function POST(request: Request) {
  const { data: { user } } = await createClient().auth.getUser();
  if (!user?.email || !isAdminEmail(user.email)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const b = await request.json().catch(() => ({}));
  const admin = createAdminClient();
  const now = new Date().toISOString();

  switch (b.action) {
    case "generate":
      return NextResponse.json(await runBlogAutopilot(true));
    case "publish": {
      const { data: p } = await admin.from("posts").select("published_at").eq("id", b.id).maybeSingle();
      const { error } = await admin.from("posts").update({ status: "published", published_at: p?.published_at ?? now, updated_at: now }).eq("id", b.id);
      return NextResponse.json(error ? { ok: false, error: error.message } : { ok: true });
    }
    case "unpublish": {
      const { error } = await admin.from("posts").update({ status: "draft", updated_at: now }).eq("id", b.id);
      return NextResponse.json(error ? { ok: false, error: error.message } : { ok: true });
    }
    case "delete": {
      const { error } = await admin.from("posts").delete().eq("id", b.id);
      return NextResponse.json(error ? { ok: false, error: error.message } : { ok: true });
    }
    case "save": {
      const title = String(b.title || "").trim();
      const content_md = String(b.content_md || "");
      if (!title || !content_md.trim()) return NextResponse.json({ ok: false, error: "Titre et contenu obligatoires" });
      const slug = slugify(String(b.slug || title));
      const row: Record<string, unknown> = {
        title, slug, content_md,
        description: b.description ? String(b.description).slice(0, 300) : null,
        tags: String(b.tags || "").split(",").map((t: string) => t.trim()).filter(Boolean).slice(0, 8),
        updated_at: now,
      };
      if (b.publish) { row.status = "published"; }
      let res;
      if (b.id) {
        if (b.publish) {
          const { data: p } = await admin.from("posts").select("published_at").eq("id", b.id).maybeSingle();
          row.published_at = p?.published_at ?? now;
        }
        res = await admin.from("posts").update(row).eq("id", b.id).select("id, slug").maybeSingle();
      } else {
        res = await admin.from("posts").insert({ ...row, source: "manuel", status: b.publish ? "published" : "draft", published_at: b.publish ? now : null }).select("id, slug").maybeSingle();
      }
      if (res.error) return NextResponse.json({ ok: false, error: res.error.message.includes("duplicate") ? "Cette adresse (slug) existe déjà" : res.error.message });
      return NextResponse.json({ ok: true, id: res.data?.id, slug: res.data?.slug });
    }
  }
  return NextResponse.json({ error: "action inconnue" }, { status: 400 });
}
