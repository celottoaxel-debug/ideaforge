import { createHash } from "crypto";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|whatsapp|telegram|discord|lighthouse|headless|vercel|curl|wget|python|axios|node-fetch|monitor|uptime/i;

function device(ua: string) {
  if (/ipad|tablet/i.test(ua)) return "Tablette";
  if (/mobi|iphone|android/i.test(ua)) return "Mobile";
  return "Ordinateur";
}
function browser(ua: string) {
  if (/edg\//i.test(ua)) return "Edge";
  if (/opr\//i.test(ua)) return "Opera";
  if (/firefox/i.test(ua)) return "Firefox";
  if (/chrome|crios/i.test(ua)) return "Chrome";
  if (/safari/i.test(ua)) return "Safari";
  return "Autre";
}
function sourceOf(ref: string, utm: string, self: string) {
  if (utm) return utm.toLowerCase().slice(0, 40);
  if (!ref) return "Direct";
  try {
    const h = new URL(ref).hostname.replace(/^www\./, "");
    if (!h || h === self || h.endsWith(`.${self}`)) return "Direct";
    if (/google\./.test(h)) return "Google";
    if (/bing\./.test(h)) return "Bing";
    if (/chatgpt\.com|openai\.com/.test(h)) return "ChatGPT";
    if (/perplexity/.test(h)) return "Perplexity";
    if (/claude\.ai/.test(h)) return "Claude";
    if (/gemini\.google|bard\.google/.test(h)) return "Gemini";
    if (/facebook|fb\.com/.test(h)) return "Facebook";
    if (/instagram/.test(h)) return "Instagram";
    if (/t\.co$|twitter|x\.com/.test(h)) return "X / Twitter";
    if (/linkedin|lnkd\.in/.test(h)) return "LinkedIn";
    if (/tiktok/.test(h)) return "TikTok";
    if (/youtube|youtu\.be/.test(h)) return "YouTube";
    if (/reddit/.test(h)) return "Reddit";
    return h;
  } catch {
    return "Direct";
  }
}

// Enregistre une page vue. Aucun cookie ni adresse IP stockés : le visiteur est un hachage
// (IP + navigateur + date + secret) qui change chaque jour, comme les outils de mesure respectueux de la vie privée.
export async function POST(request: Request) {
  try {
    const h = headers();
    const ua = h.get("user-agent") || "";
    if (!ua || BOT.test(ua)) return new Response(null, { status: 204 });

    let body: { p?: string; r?: string; u?: string } = {};
    try { body = JSON.parse(await request.text()); } catch {}
    const path = String(body.p || "/").split("?")[0].slice(0, 200);
    if (!path.startsWith("/") || path.startsWith("/api") || path.startsWith("/admin")) return new Response(null, { status: 204 });

    const self = (process.env.NEXT_PUBLIC_SITE_URL || "https://ideaforges.io").replace(/^https?:\/\/(www\.)?/, "").replace(/\/.*$/, "");
    const ip = (h.get("x-forwarded-for") || "").split(",")[0].trim();
    const day = new Date().toISOString().slice(0, 10);
    const salt = process.env.EMAIL_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "ideaforge";
    const visitor = createHash("sha256").update(`${salt}|${day}|${ip}|${ua}`).digest("hex").slice(0, 16);
    let city = h.get("x-vercel-ip-city") || null;
    try { if (city) city = decodeURIComponent(city); } catch {}

    await createAdminClient().from("page_views").insert({
      path,
      source: sourceOf(String(body.r || ""), String(body.u || ""), self),
      referrer: body.r ? String(body.r).slice(0, 300) : null,
      country: h.get("x-vercel-ip-country") || null,
      city,
      device: device(ua),
      browser: browser(ua),
      visitor,
    });
  } catch (e) {
    console.error("[track]", e);
  }
  return new Response(null, { status: 204 });
}
