import sharp from "sharp";

export const runtime = "nodejs";

// Même slide, convertie en JPEG : Instagram n'accepte que ce format. Adresse : /api/ig/jpg/<id>/<n>.jpg
export async function GET(req: Request, { params }: { params: { id: string; file: string } }) {
  const n = Number(params.file.replace(/\.jpe?g$/i, ""));
  if (!Number.isInteger(n) || n < 1 || n > 10) return new Response("Not found", { status: 404 });
  const origin = new URL(req.url).origin;
  const png = await fetch(`${origin}/api/ig/png/${encodeURIComponent(params.id)}/${n}`, { cache: "no-store" });
  if (!png.ok) return new Response("Not found", { status: 404 });
  const jpg = await sharp(Buffer.from(await png.arrayBuffer())).jpeg({ quality: 90, mozjpeg: true }).toBuffer();
  return new Response(new Uint8Array(jpg), { headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=86400" } });
}
