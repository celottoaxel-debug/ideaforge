import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/blog/markdown";

export const dynamic = "force-dynamic";

// API de publication pour un outil externe (VANTIX, Zapier, Make…).
// En-tête : Authorization: Bearer <BLOG_API_KEY>
// Corps JSON : { title, content (Markdown), description?, tags?: string[], slug?, status?: "draft" | "published" }
// Même slug = mise à jour de l'article existant.
export async function POST(request: Request) {
  const key = process.env.BLOG_API_KEY;
  if (!key || request.headers.get("authorization") !== `Bearer ${key}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let b: Record<string, unknown> = {};
  try { b = await request.json(); } catch { return NextResponse.json({ error: "JSON invalide" }, { status: 400 }); }
  const title = String(b.title || "").trim();
  const content = String(b.content || b.content_md || "").trim();
  if (!title || !content) return NextResponse.json({ error: "title et content sont obligatoires" }, { status: 400 });

  const slug = slugify(String(b.slug || title));
  const status = b.status === "published" ? "published" : "draft";
  const admin = createAdminClient();
  const { data: prev } = await admin.from("posts").select("id, published_at").eq("slug", slug).maybeSingle();
  const row = {
    slug, title, content_md: content,
    description: b.description ? String(b.description).slice(0, 300) : null,
    tags: Array.isArray(b.tags) ? (b.tags as unknown[]).map(String).slice(0, 8) : [],
    status, source: "api", updated_at: new Date().toISOString(),
    published_at: status === "published" ? (prev?.published_at ?? new Date().toISOString()) : prev?.published_at ?? null,
  };
  const { error } = await admin.from("posts").upsert(row, { onConflict: "slug" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const site = (process.env.NEXT_PUBLIC_SITE_URL || "https://ideaforges.io").replace(/\/$/, "");
  return NextResponse.json({ ok: true, slug, status, url: `${site}/blog/${slug}` });
}
