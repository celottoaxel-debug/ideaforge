import { ImageResponse } from "next/og";

export const alt = "IdeaForge — Idées de business chiffrées";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#003d30", padding: 72, color: "#fff", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: "rgba(255,255,255,.14)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 800 }}>IF</div>
          <div style={{ fontSize: 34, fontWeight: 700 }}>IdeaForge</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 68, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2 }}>Des idées de business chiffrées, prêtes à lancer</div>
          <div style={{ fontSize: 30, color: "#9fe0bf" }}>Budget · revenus sur 24 mois · concurrents · plan de lancement</div>
        </div>
        <div style={{ fontSize: 26, color: "rgba(255,255,255,.7)" }}>ideaforges.io</div>
      </div>
    ),
    size
  );
}
