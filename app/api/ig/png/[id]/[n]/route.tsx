import { ImageResponse } from "next/og";
import { createAdminClient } from "@/lib/supabase/admin";
import { SlideView } from "@/lib/instagram/render";
import { geistFonts } from "@/lib/instagram/fonts";
import type { Slide } from "@/lib/instagram/content";

export const runtime = "edge";

// Slide n (à partir de 1) du carrousel `id`, en PNG 1080 × 1350.
export async function GET(_req: Request, { params }: { params: { id: string; n: string } }) {
  const { data } = await createAdminClient().from("ig_posts").select("slides").eq("id", Number(params.id)).maybeSingle();
  const slides = (data?.slides ?? []) as Slide[];
  const s = slides[Number(params.n) - 1];
  if (!s) return new Response("Not found", { status: 404 });
  return new ImageResponse(<SlideView s={s} handle="@ideasforge.io" />, {
    width: 1080, height: 1350, fonts: await geistFonts(),
    headers: { "Cache-Control": "public, max-age=3600" },
  });
}
