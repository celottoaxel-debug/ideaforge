import { ImageResponse } from "next/og";
import { createAdminClient } from "@/lib/supabase/admin";
import { PollView, type PollData } from "@/lib/instagram/render";
import { geistFonts } from "@/lib/instagram/fonts";

export const runtime = "edge";

// Story sondage (clé AAAA-MM-JJ-am|pm), en PNG 1080 × 1920.
export async function GET(_req: Request, { params }: { params: { key: string } }) {
  if (!/^\d{4}-\d{2}-\d{2}-(am|pm)$/.test(params.key)) return new Response("Not found", { status: 404 });
  const { data } = await createAdminClient().from("app_settings").select("value").eq("key", `ig_poll:${params.key}`).maybeSingle();
  let d: PollData | null = null;
  try { d = data?.value ? (JSON.parse(data.value as string) as PollData) : null; } catch {}
  if (!d) return new Response("Not found", { status: 404 });
  return new ImageResponse(<PollView d={d} handle="@ideasforge.io" />, { width: 1080, height: 1920, fonts: await geistFonts(), headers: { "Cache-Control": "public, max-age=600" } });
}
