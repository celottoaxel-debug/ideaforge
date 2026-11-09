import { ImageResponse } from "next/og";
import { IDEAS } from "@/lib/ideas";

export const alt = "Fiche idée IdeaForge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Image de partage d'une fiche (catalogue statique ; les idées IA utilisent l'image par défaut du site).
export default function OgImage({ params }: { params: { id: string } }) {
  const it = IDEAS.find((x) => x.id === params.id);
  const title = it?.title ?? "Idée de business chiffrée";
  const stats = it ? [["Budget", it.budget ?? "—"], ["Revenus", it.revenue ?? "—"], ["Délai", it.delai ?? "—"]] : [];
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#fbfbfa", padding: 64, fontFamily: "sans-serif", color: "#0c1512" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: "#003d30", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800 }}>IF</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>IdeaForge</div>
          </div>
          <div style={{ fontSize: 22, color: "#178a56", fontWeight: 700, textTransform: "uppercase", letterSpacing: 2 }}>{it?.sector ?? ""}</div>
        </div>
        <div style={{ fontSize: 64, fontWeight: 800, lineHeight: 1.08, letterSpacing: -1.5, display: "flex" }}>{title}</div>
        <div style={{ display: "flex", gap: 18 }}>
          {stats.map(([k, v]) => (
            <div key={k} style={{ display: "flex", flexDirection: "column", background: "#fff", border: "2px solid #e9e8e3", borderRadius: 20, padding: "18px 26px", flex: 1 }}>
              <div style={{ fontSize: 20, color: "#808e88", textTransform: "uppercase", letterSpacing: 1.5 }}>{k}</div>
              <div style={{ fontSize: 34, fontWeight: 800, color: "#0f7a4a" }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    size
  );
}
