// Appel à l'API Anthropic. Récupère le texte de TOUS les blocs de la réponse
// (les modèles récents peuvent renvoyer d'autres blocs avant le texte).
export async function askClaude(prompt: string, maxTokens: number): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY absente");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5", max_tokens: maxTokens, messages: [{ role: "user", content: prompt }] }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`Anthropic ${res.status} : ${data?.error?.message ?? "erreur inconnue"}`);
  const blocks: { type?: string; text?: string }[] = Array.isArray(data?.content) ? data.content : [];
  const text = blocks.filter((b) => b?.type === "text" && typeof b.text === "string").map((b) => b.text).join("\n").trim();
  if (!text) throw new Error(`réponse vide (stop_reason : ${data?.stop_reason ?? "?"}, blocs : ${blocks.map((b) => b?.type).join(", ") || "aucun"})`);
  return text;
}

// Extrait le premier tableau JSON d'une réponse (tolère les ```json … ``` et le texte autour).
export function extractJsonArray(text: string): unknown[] {
  const cleaned = text.replace(/```(?:json)?/gi, "");
  const start = cleaned.indexOf("["), end = cleaned.lastIndexOf("]");
  if (start === -1 || end <= start) throw new Error(`pas de tableau JSON dans la réponse : « ${cleaned.slice(0, 160)}… »`);
  return JSON.parse(cleaned.slice(start, end + 1));
}
