import sharp from "sharp";

export const runtime = "nodejs";

// Story convertie en JPEG pour Instagram. Adresse : /api/ig/story/<AAAA-MM-JJ>.jpg
export async function GET(req: Request, { params }: { params: { file: string } }) {
  const date = params.file.replace(/\.jpe?g$/i, "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return new Response("Not found", { status: 404 });
  const origin = new URL(req.url).origin;
  const png = await fetch(`${origin}/api/ig/story-png/${date}`, { cache: "no-store" });
  if (!png.ok) return new Response("Not found", { status: 404 });
  const jpg = await sharp(Buffer.from(await png.arrayBuffer())).jpeg({ quality: 90, mozjpeg: true }).toBuffer();
  return new Response(new Uint8Array(jpg), { headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=600" } });
}
