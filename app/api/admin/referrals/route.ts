import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/admin";

// Admin : marque une récompense de parrainage (palier 3) comme livrée.
export async function POST(request: Request) {
  const { data: { user } } = await createClient().auth.getUser();
  if (!user || !isAdminEmail(user.email)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  let id = 0;
  try { id = Number((await request.json())?.id); } catch {}
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "id" }, { status: 400 });
  const { error } = await createAdminClient().from("referral_rewards").update({ status: "delivered", delivered_at: new Date().toISOString() }).eq("id", id).eq("status", "pending");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
