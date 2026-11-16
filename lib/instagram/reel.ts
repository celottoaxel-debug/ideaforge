// Réels automatiques : chaque carrousel publié devient une vidéo verticale animée (plans en mouvement, motion blur, son calé),
// rangée dans Supabase Storage (dossier public « ig-media ») puis publiée comme réel.
// Calendrier : mardi, jeudi, samedi → le dernier carrousel publié qui n'a pas encore son réel.
import { spawn } from "node:child_process";
import { mkdtemp, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createAdminClient } from "@/lib/supabase/admin";
import { SITE } from "@/lib/seo";
import type { Slide } from "@/lib/instagram/content";
import { pickSoundtrack, renderSoundtrack } from "@/lib/instagram/sound";

export type ReelRow = { status: "draft" | "published" | "error"; url?: string; media_id?: string; permalink?: string; error?: string; at?: string };

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

type Style = "punch" | "left" | "right" | "up" | "down";
const BLUR: Record<Style, string> = {
  punch: "gblur=sigma=14", left: "dblur=angle=0:radius=60", right: "dblur=angle=0:radius=60", up: "dblur=angle=90:radius=70", down: "dblur=angle=90:radius=70",
};
const easeOut = (p: string) => `(1-pow(1-(${p}),3))`;
const easeIn = (p: string) => `pow((${p}),3)`;

/** Mouvement de la slide dans son plan : entrée rapide, léger zoom pendant le plan, sortie rapide. */
function motion(style: Style, D: number, ti: number, to: number) {
  const ei = easeOut(`min(t/${ti},1)`), eo = easeIn(`max((t-${(D - to).toFixed(3)})/${to},0)`), push = `(1+0.035*t/${D.toFixed(3)})`;
  switch (style) {
    case "punch": return { S: `(${push}*(1+0.55*(1-${ei}))*(1-0.35*${eo}))`, DX: "0", DY: "0" };
    case "left": return { S: push, DX: `(1150*(1-${ei})-1150*${eo})`, DY: "0" };
    case "right": return { S: push, DX: `(-1150*(1-${ei})+1150*${eo})`, DY: "0" };
    case "up": return { S: push, DX: "0", DY: `(1500*(1-${ei})-1600*${eo})` };
    case "down": return { S: push, DX: "0", DY: `(-1500*(1-${ei})+1600*${eo})` };
  }
}

/** Monte le réel animé du carrousel `id` (plans en mouvement, motion blur, bande son calée sur le tempo)
 *  et le dépose dans Supabase Storage. Renvoie son adresse publique. */
export async function renderReel(id: number): Promise<string> {
  const admin = createAdminClient();
  const { data: post } = await admin.from("ig_posts").select("slides").eq("id", id).maybeSingle();
  const slides = ((post?.slides ?? []) as Slide[]).slice(0, 8);
  if (!slides.length) throw new Error("Carrousel introuvable");
  const dir = await mkdtemp(path.join(tmpdir(), "reel-"));
  try {
    // 1. Calques : décor + contenu transparent de chaque slide
    const files: string[] = [];
    for (let n = 0; n <= slides.length; n++) {
      const r = await fetch(`${SITE}/api/ig/reel-layer/${id}/${n}`, { cache: "no-store" });
      if (!r.ok) throw new Error(`Calque ${n} indisponible`);
      const buf = Buffer.from(await r.arrayBuffer());
      if (!buf.length) throw new Error(`Calque ${n} vide`);
      const f = path.join(dir, `L${n}.png`);
      await writeFile(f, buf);
      files.push(f);
    }
    // 2. Tempo et plans (durées en temps, toutes calées sur les temps de la musique)
    const st = pickSoundtrack(id);
    const B = 60 / st.bpm, FPS = 60, n = slides.length;
    const order: Style[][] = [["punch", "left", "up", "right", "down", "left", "up", "punch"], ["punch", "up", "right", "left", "up", "down", "right", "punch"], ["punch", "right", "down", "left", "up", "right", "left", "punch"]];
    const styles = order[id % order.length];
    const segs = slides.map((s, i) => {
      const beats = i === 0 ? 6 : i === n - 1 ? 7 : s.t === "text" || s.t === "list" ? 6 : 5;
      const D = Math.round(beats * B * 30) / 30; // aligné sur les images (30 i/s) pour rester synchro avec le son
      const style: Style = i === n - 1 ? "punch" : styles[i % styles.length];
      return { D, style, ...motion(style, D, 0.38, i === n - 1 ? 0.01 : 0.26), ti: 0.38, to: 0.26 };
    });
    const total = segs.reduce((a, s) => a + s.D, 0);
    const starts = segs.map((_, i) => segs.slice(0, i).reduce((a, s) => a + s.D, 0));
    // 3. Bande son : whoosh à chaque changement de plan, impact au début et sur le dernier plan
    const audio = path.join(dir, "sound.wav");
    await renderSoundtrack(audio, id, total, starts.slice(1), [0, starts[n - 1]]);
    // 4. Montage vidéo : un plan à la fois (peu de mémoire), puis assemblage avec le son
    const bin = await ffmpegPath();
    const list: string[] = [];
    for (let i = 0; i < n; i++) {
      const g = segs[i], t0 = starts[i].toFixed(3), D = g.D.toFixed(3);
      const shake = "(8*sin(t*90)*exp(-t*12))";
      const blurOn = i === n - 1 ? `lt(t,${(g.ti * 0.7).toFixed(3)})` : `lt(t,${(g.ti * 0.7).toFixed(3)})+gt(t,${(g.D - g.to * 0.8).toFixed(3)})`;
      const fc = [
        `[0:v]scale=1242:2208,crop=1080:1920:x='81+60*sin((t+${t0})/2.3)':y='144+90*sin((t+${t0})/3.1)',eq=brightness='0.10*exp(-t*14)':eval=frame[b]`,
        `[1:v]format=rgba,scale=w='trunc(1080*${g.S}/2)*2':h='trunc(1350*${g.S}/2)*2':eval=frame[c]`,
        `[b][c]overlay=x='(W-w)/2+${g.DX}+${shake}':y='285+(1350-h)/2+${g.DY}':eval=frame,format=yuv420p,${BLUR[g.style]}:enable='${blurOn}',tmix=frames=2:weights='1 1',fps=30[v]`,
      ].join(";");
      const seg = path.join(dir, `seg${i}.mp4`);
      await run(bin, ["-y", "-v", "error", "-loop", "1", "-framerate", String(FPS), "-t", D, "-i", files[0], "-loop", "1", "-framerate", String(FPS), "-t", D, "-i", files[i + 1],
        "-filter_complex", fc, "-map", "[v]", "-t", D, "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p", "-threads", "2", seg]);
      list.push(`file '${seg}'`);
    }
    const listFile = path.join(dir, "list.txt");
    await writeFile(listFile, list.join("\n"));
    const out = path.join(dir, "reel.mp4");
    await run(bin, ["-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", listFile, "-i", audio, "-map", "0:v", "-map", "1:a",
      "-c:v", "copy", "-c:a", "aac", "-b:a", "160k", "-t", total.toFixed(3), "-movflags", "+faststart", out]);
    const key = `reels/${id}-${Date.now()}.mp4`;
    const { error } = await admin.storage.from("ig-media").upload(key, await readFile(out), { contentType: "video/mp4", upsert: true });
    if (error) throw new Error(error.message);
    return admin.storage.from("ig-media").getPublicUrl(key).data.publicUrl;
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}
