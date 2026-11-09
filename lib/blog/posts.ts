import { createAdminClient } from "@/lib/supabase/admin";

export type Post = {
  id: string; slug: string; title: string; description: string | null; content_md: string; tags: string[];
  keyword: string | null; status: "draft" | "published"; source: string; published_at: string | null; created_at: string; updated_at: string;
};

// Lecture côté serveur avec la clé service (les brouillons ne sont jamais renvoyés au public par ces fonctions,
// sauf getPostBySlug(slug, true) utilisé pour l'aperçu admin).
export async function listPublished(limit = 200): Promise<Post[]> {
  try {
    const { data } = await createAdminClient().from("posts").select("*").eq("status", "published")
      .order("published_at", { ascending: false }).limit(limit);
    return (data as Post[]) ?? [];
  } catch {
    return [];
  }
}

export async function getPostBySlug(slug: string, includeDrafts = false): Promise<Post | null> {
  try {
    let q = createAdminClient().from("posts").select("*").eq("slug", slug);
    if (!includeDrafts) q = q.eq("status", "published");
    const { data } = await q.maybeSingle();
    return (data as Post) ?? null;
  } catch {
    return null;
  }
}

export async function listAll(): Promise<Post[]> {
  const { data, error } = await createAdminClient().from("posts").select("*").order("status", { ascending: true }).order("created_at", { ascending: false }).limit(500);
  if (error) throw new Error(error.message);
  return (data as Post[]) ?? [];
}

export const fmtDate = (s: string | null) =>
  s ? new Date(s).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "";
