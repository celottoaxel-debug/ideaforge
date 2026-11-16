import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { findIdea } from "@/lib/seo";

// Fiche complète offerte : chaque inscrit peut débloquer gratuitement UNE fiche de son choix.
export async function POST(request: Request) {
  const { data: { user } } = await createClient().auth.getUser();
  if (!user) return NextResponse.json({ error: "auth" }, { status: 401 });
  let id = "";
  try { id = String((await request.json())?.id || ""); } catch {}
  if (!id || !(await findIdea(id))) return NextResponse.json({ error: "idea" }, { status: 400 });

  const admin = createAdminClient();
  // Mise à jour atomique : ne marche que si aucune fiche n'a encore été offerte à ce compte.
  const { data, error } = await admin
    .from("profiles")
    .update({ free_unlock_id: id, free_unlock_at: new Date().toISOString() })
    .eq("id", user.id)
    .is("free_unlock_id", null)
    .select("id");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data?.length) return NextResponse.json({ error: "used" }, { status: 409 });
  return NextResponse.json({ ok: true });
}
