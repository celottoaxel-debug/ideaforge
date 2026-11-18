// Télécharger une story (ou un sondage) pour la poster soi-même avec une musique Instagram :
// le fichier est envoyé en pièce jointe ET le média est marqué « publié » (il passe dans Archives).
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: { kind: string; key: string } }) {
  const { data: { user } } = await createClient().auth.getUser();
  if (!user || !isAdminEmail(user.email)) return new Response("Accès réservé", { status: 403 });
  const { kind, key } = params;
  const ok = (kind === "story" && /^\d{4}-\d{2}-\d{2}$/.test(key)) || (kind === "poll" && /^\d{4}-\d{2}-\d{2}-(am|pm)$/.test(key));
  if (!ok) return new Response("Introuvable", { status: 404 });
  const origin = new URL(req.url).origin;
  const img = await fetch(`${origin}/api/ig/${kind}/${key}.jpg`, { cache: "no-store" });
  if (!img.ok) return new Response("Image introuvable", { status: 404 });
  const buf = Buffer.from(await img.arrayBuffer());
  // Marque comme publié à la main (le site ne la publiera donc pas une 2e fois)
  const admin = createAdminClient();
  const k = `ig_${kind}:${key}`;
  const { data } = await admin.from("app_settings").select("value").eq("key", k).maybeSingle();
  if (data?.value) {
    try {
      const row = JSON.parse(data.value as string);
      if (row.status !== "published") await admin.from("app_settings").update({ value: JSON.stringify({ ...row, status: "published", manual: true, error: undefined, at: new Date().toISOString() }), updated_at: new Date().toISOString() }).eq("key", k);
    } catch {}
  }
  return new Response(new Uint8Array(buf), {
    headers: { "Content-Type": "image/jpeg", "Content-Disposition": `attachment; filename="${kind === "story" ? "story" : "sondage"}-ideaforge-${key}.jpg"`, "Cache-Control": "no-store" },
  });
}
