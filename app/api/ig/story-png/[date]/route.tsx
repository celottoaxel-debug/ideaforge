import { ImageResponse } from "next/og";
import { createAdminClient } from "@/lib/supabase/admin";
import { StoryView, type StoryData } from "@/lib/instagram/render";
import { geistFonts } from "@/lib/instagram/fonts";

export const runtime = "edge";

// Story du jour `date` (AAAA-MM-JJ), en PNG 1080 × 1920.
export async function GET(_req: Request, { params }: { params: { date: string } }) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(params.date)) return new Response("Not found", { status: 404 });
  const { data } = await createAdminClient().from("app_settings").select("value").eq("key", `ig_story:${params.date}`).maybeSingle();
  let d: StoryData | null = null;
  try { d = data?.value ? (JSON.parse(data.value as string).story as StoryData) : null; } catch {}
  if (!d) return new Response("Not found", { status: 404 });
  return new ImageResponse(<StoryView d={d} handle="@ideasforge.io" />, {
    width: 1080, height: 1920, fonts: await geistFonts(),
    headers: { "Cache-Control": "public, max-age=600" },
  });
}
