import { NextResponse } from "next/server";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";
export const maxDuration = 45;

// Rapport de validation par IA. Actif seulement si ANTHROPIC_API_KEY est défini (aucun coût sinon).
// Ne dépend PAS de Supabase.
export async function POST(request: Request) {
  // Protection légère anti-abus : même origine uniquement.
  const h = headers();
  const host = h.get("host");
  const origin = h.get("origin") || h.get("referer") || "";
  if (host && origin && !origin.includes(host)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return NextResponse.json({ unavailable: true });

  let body: { text?: string; sector?: string; difficulty?: number; recurring?: boolean; locale?: string } = {};
  try { body = await request.json(); } catch {}
  const text = String(body.text || "").trim().slice(0, 1200);
  if (text.length < 8) return NextResponse.json({ error: "too_short" }, { status: 400 });
  const lang = body.locale === "en" ? "anglais" : body.locale === "es" ? "espagnol" : "français";

  const prompt = `Tu es un analyste startup senior. Évalue cette idée de business/SaaS de façon lucide et chiffrée.
IDÉE : ${text}
SECTEUR : ${body.sector || "n/c"} · DIFFICULTÉ ESTIMÉE : ${body.difficulty || 2}/3 · RÉCURRENT : ${body.recurring ? "oui" : "non"}

Réponds UNIQUEMENT avec un objet JSON (en ${lang}), sans texte autour :
{"score":number (0-100, réaliste),"verdict":string (2-3 phrases franches),"competitors":[{"name":string,"note":string}] (3 à 5 concurrents réels probables),"market":string (ordre de grandeur de la taille de marché + source de raisonnement),"angles":[string] (3 angles de différenciation concrets),"risks":[string] (2-3 risques clés)}`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: "claude-sonnet-5-5", max_tokens: 1600, messages: [{ role: "user", content: prompt }] }),
    });
    const data = await res.json();
    const out: string = data?.content?.[0]?.text ?? "";
    const s = out.indexOf("{"), e = out.lastIndexOf("}");
    if (s === -1 || e === -1) throw new Error("no json");
    const report = JSON.parse(out.slice(s, e + 1));
    return NextResponse.json({ ok: true, report });
  } catch (err) {
    return NextResponse.json({ error: "generation_failed", detail: err instanceof Error ? err.message : String(err) }, { status: 502 });
  }
}
