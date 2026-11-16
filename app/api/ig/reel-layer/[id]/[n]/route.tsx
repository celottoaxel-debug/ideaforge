import { ImageResponse } from "next/og";
import { createAdminClient } from "@/lib/supabase/admin";
import { SlideView, ReelBg } from "@/lib/instagram/render";
import { geistFonts } from "@/lib/instagram/fonts";
import type { Slide } from "@/lib/instagram/content";

export const runtime = "edge";

// Calques du réel animé : n = 0 → le décor (1080 × 1920), n ≥ 1 → le contenu de la slide n sur fond transparent (1080 × 1350).
export async function GET(_req: Request, { params }: { params: { id: string; n: string } }) {
  const n = Number(params.n);
  const fonts = await geistFonts();
  if (n === 0) return new ImageResponse(<ReelBg />, { width: 1080, height: 1920, fonts, headers: { "Cache-Control": "public, max-age=86400" } });
  const { data } = await createAdminClient().from("ig_posts").select("slides").eq("id", Number(params.id)).maybeSingle();
  const s = ((data?.slides ?? []) as Slide[])[n - 1];
  if (!s) return new Response("Not found", { status: 404 });
  return new ImageResponse(<SlideView s={s} handle="@ideasforge.io" reel bare />, { width: 1080, height: 1350, fonts, headers: { "Cache-Control": "public, max-age=3600" } });
}
