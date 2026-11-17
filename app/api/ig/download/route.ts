// Téléchargement d'un réel (iPhone compris) : on renvoie la vidéo avec « attachment » pour que Safari propose de l'enregistrer.
export const runtime = "edge";

const ALLOWED = ["d2ol7oe51mr4n9.cloudfront.net", "odkzhathddzbxojezcnx.supabase.co"];

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  let src: URL;
  try { src = new URL(sp.get("u") || ""); } catch { return new Response("Lien invalide", { status: 400 }); }
  if (src.protocol !== "https:" || !ALLOWED.includes(src.hostname) || !/\.mp4$/i.test(src.pathname)) return new Response("Lien non autorisé", { status: 400 });
  const name = (sp.get("name") || "reel-ideaforge").replace(/[^a-z0-9-]/gi, "-").slice(0, 60) + ".mp4";
  const up = await fetch(src.toString());
  if (!up.ok || !up.body) return new Response("Vidéo introuvable", { status: 404 });
  return new Response(up.body, {
    headers: {
      "Content-Type": "video/mp4",
      "Content-Disposition": `attachment; filename="${name}"`,
      ...(up.headers.get("content-length") ? { "Content-Length": up.headers.get("content-length")! } : {}),
      "Cache-Control": "private, max-age=0",
    },
  });
}
