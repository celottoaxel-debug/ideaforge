// Réels automatiques : chaque carrousel publié devient une vidéo verticale (fondus entre les slides),
// rangée dans Supabase Storage (dossier public « ig-media ») puis publiée comme réel.
// Calendrier : mardi, jeudi, samedi → le dernier carrousel publié qui n'a pas encore son réel.
import { spawn } from "node:child_process";
import { mkdtemp, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createAdminClient } from "@/lib/supabase/admin";
import { SITE } from "@/lib/seo";
import type { Slide } from "@/lib/instagram/content";

export type ReelRow = { status: "draft" | "published" | "error"; url?: string; media_id?: string; permalink?: string; error?: string; at?: string };

const FADE = 0.5;
const dur = (s: Slide, i: number, n: number) => (i === 0 ? 3 : i === n - 1 ? 3.5 : s.t === "text" ? 4 : 3.5);

async function ffmpegPath(): Promise<string> {
  const mod = (await import("ffmpeg-static")) as unknown as { default?: string } | string;
  const p = (typeof mod === "string" ? mod : mod.default) as string | undefined;
  if (!p) throw new Error("ffmpeg indisponible");
  return p;
}

function run(bin: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const p = spawn(bin, args);
    let err = "";
    p.stderr.on("data", (d) => { err = (err + d.toString()).slice(-2000); });
    p.on("error", reject);
    p.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg ${code}: ${err.slice(-400)}`))));
  });
}

/** Monte la vidéo du carrousel `id` et la dépose dans Supabase Storage. Renvoie son adresse publique. */
export async function renderReel(id: number): Promise<string> {
  const admin = createAdminClient();
  const { data: post } = await admin.from("ig_posts").select("slides").eq("id", id).maybeSingle();
  const slides = ((post?.slides ?? []) as Slide[]).slice(0, 10);
  if (!slides.length) throw new Error("Carrousel introuvable");
  const dir = await mkdtemp(path.join(tmpdir(), "reel-"));
  try {
    const files: string[] = [];
    for (let n = 1; n <= slides.length; n++) {
      const r = await fetch(`${SITE}/api/ig/reel-png/${id}/${n}`, { cache: "no-store" });
      if (!r.ok) throw new Error(`Image ${n} indisponible`);
      const f = path.join(dir, `f${n}.png`);
      await writeFile(f, Buffer.from(await r.arrayBuffer()));
      files.push(f);
    }
    const ds = slides.map((s, i) => dur(s, i, slides.length));
    const total = ds.reduce((a, b) => a + b, 0) - FADE * (slides.length - 1);
    const args: string[] = ["-y"];
    files.forEach((f, i) => args.push("-loop", "1", "-t", String(ds[i]), "-i", f));
    args.push("-f", "lavfi", "-t", total.toFixed(2), "-i", "anullsrc=r=44100:cl=stereo");
    const parts: string[] = files.map((_, i) => `[${i}:v]scale=1080:1920,setsar=1,fps=30,format=yuv420p[v${i}]`);
    let last = "v0", offset = 0;
    for (let i = 1; i < files.length; i++) {
      offset += ds[i - 1] - FADE;
      const out = i === files.length - 1 ? "vout" : `x${i}`;
      parts.push(`[${last}][v${i}]xfade=transition=fade:duration=${FADE}:offset=${offset.toFixed(2)}[${out}]`);
      last = out;
    }
    if (files.length === 1) parts.push(`[v0]null[vout]`);
    const out = path.join(dir, "reel.mp4");
    args.push("-filter_complex", parts.join(";"), "-map", "[vout]", "-map", `${files.length}:a`,
      "-c:v", "libx264", "-preset", "veryfast", "-crf", "21", "-pix_fmt", "yuv420p", "-r", "30",
      "-c:a", "aac", "-b:a", "128k", "-shortest", "-movflags", "+faststart", out);
    await run(await ffmpegPath(), args);
    const key = `reels/${id}-${Date.now()}.mp4`;
    const { error } = await admin.storage.from("ig-media").upload(key, await readFile(out), { contentType: "video/mp4", upsert: true });
    if (error) throw new Error(error.message);
    return admin.storage.from("ig-media").getPublicUrl(key).data.publicUrl;
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}
