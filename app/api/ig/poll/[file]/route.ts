import sharp from "sharp";

export const runtime = "nodejs";

// Story sondage en JPEG pour Instagram : /api/ig/poll/<AAAA-MM-JJ-am|pm>.jpg
export async function GET(req: Request, { params }: { params: { file: string } }) {
  const key = params.file.replace(/\.jpe?g$/i, "");
  if (!/^\d{4}-\d{2}-\d{2}-(am|pm)$/.test(key)) return new Response("Not found", { status: 404 });
  const png = await fetch(`${new URL(req.url).origin}/api/ig/poll-png/${key}`, { cache: "no-store" });
  if (!png.ok) return new Response("Not found", { status: 404 });
  const jpg = await sharp(Buffer.from(await png.arrayBuffer())).jpeg({ quality: 90, mozjpeg: true }).toBuffer();
  return new Response(new Uint8Array(jpg), { headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=600" } });
}
