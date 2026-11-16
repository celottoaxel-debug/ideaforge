// Dessin d'une slide de carrousel (1080 × 1350), aux couleurs d'IdeaForge.
import type { Slide } from "@/lib/instagram/content";

const C = { bg: "#07130f", ink: "#f4f8f5", ink2: "#c3d0c9", ink3: "#8fa39a", green: "#5ad69c", greenDeep: "#2fc07d", amber: "#f1c26a", line: "rgba(47,192,125,0.35)" };
const card = { display: "flex", borderRadius: 28, border: `2px solid ${C.line}`, background: "rgba(16,36,28,0.92)" } as const;

function Header({ right }: { right: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ display: "flex", width: 58, height: 58, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundImage: "radial-gradient(circle at 30% 20%, #3fd690 0%, #13744a 55%, #0a3a27 100%)", color: "#03140c", fontSize: 25, fontWeight: 700 }}>IF</div>
        <div style={{ display: "flex", fontSize: 32, fontWeight: 600, color: C.ink }}>IdeaForge</div>
      </div>
      <div style={{ display: "flex", fontFamily: "GeistMono", fontSize: 22, color: C.ink3 }}>{right}</div>
    </div>
  );
}

function Kicker({ text, amber }: { text: string; amber?: boolean }) {
  return <div style={{ display: "flex", fontFamily: "GeistMono", fontSize: 24, letterSpacing: 4, color: amber ? C.amber : C.green }}>{text.toUpperCase()}</div>;
}

function Tiles({ tiles }: { tiles: { k: string; v: string }[] }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 18, width: "100%" }}>
      {tiles.map((t, i) => (
        <div key={i} style={{ ...card, flexDirection: "column", gap: 10, padding: "26px 28px", width: tiles.length === 3 ? 296 : 461 }}>
          <div style={{ display: "flex", fontFamily: "GeistMono", fontSize: 20, letterSpacing: 2, color: C.ink3 }}>{t.k.toUpperCase()}</div>
          <div style={{ display: "flex", fontSize: tiles.length === 3 ? 32 : 40, fontWeight: 700, color: C.ink }}>{t.v}</div>
        </div>
      ))}
    </div>
  );
}

export function SlideView({ s, handle }: { s: Slide; handle: string }) {
  const page = "n" in s ? `${s.n}/${s.total}` : handle;
  return (
    <div style={{ width: 1080, height: 1350, display: "flex", flexDirection: "column", padding: "64px 70px 62px", fontFamily: "Geist", color: C.ink, backgroundColor: C.bg,
      backgroundImage: "radial-gradient(circle at 88% 6%, rgba(47,192,125,0.28) 0%, rgba(47,192,125,0) 42%), radial-gradient(circle at 0% 100%, rgba(231,172,60,0.13) 0%, rgba(231,172,60,0) 45%)" }}>
      <Header right={page} />
      <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, justifyContent: "center", gap: 34, width: "100%" }}>
        {s.t === "cover" && (
          <>
            <Kicker text={s.kicker} />
            <div style={{ display: "flex", fontSize: s.title.length > 55 ? 72 : 88, fontWeight: 700, lineHeight: 1.02, letterSpacing: -3 }}>{s.title}</div>
            {s.sub && <div style={{ display: "flex", fontSize: 32, lineHeight: 1.4, color: C.ink2 }}>{s.sub}</div>}
            {s.stat && (
              <div style={{ ...card, alignItems: "center", gap: 26, padding: "28px 32px", border: "2px solid rgba(231,172,60,0.55)", background: "rgba(40,36,18,0.6)" }}>
                <div style={{ display: "flex", fontSize: 64, fontWeight: 700, color: C.amber }}>≈ {s.stat}</div>
                <div style={{ display: "flex", fontSize: 26, lineHeight: 1.3, color: C.ink2, width: 420 }}>{s.statLabel}</div>
              </div>
            )}
          </>
        )}
        {s.t === "text" && (
          <>
            <Kicker text={s.kicker} />
            <div style={{ display: "flex", fontSize: 72, fontWeight: 700, lineHeight: 1.04, letterSpacing: -2 }}>{s.title}</div>
            <div style={{ display: "flex", fontSize: 38, lineHeight: 1.45, color: C.ink2 }}>{s.body}</div>
          </>
        )}
        {s.t === "stats" && (
          <>
            <Kicker text={s.kicker} />
            <div style={{ display: "flex", fontSize: 72, fontWeight: 700, lineHeight: 1.04, letterSpacing: -2 }}>{s.title}</div>
            <Tiles tiles={s.tiles} />
          </>
        )}
        {s.t === "list" && (
          <>
            <Kicker text={s.kicker} amber={s.kicker === "Attention"} />
            <div style={{ display: "flex", fontSize: 72, fontWeight: 700, lineHeight: 1.04, letterSpacing: -2 }}>{s.title}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {s.items.map((it, i) => (
                <div key={i} style={{ ...card, alignItems: "center", gap: 24, padding: "22px 26px" }}>
                  <div style={{ display: "flex", width: 54, height: 54, flexShrink: 0, borderRadius: 27, alignItems: "center", justifyContent: "center", border: `2px solid ${s.kicker === "Attention" ? "rgba(231,172,60,0.6)" : C.line}`, color: s.kicker === "Attention" ? C.amber : C.green, fontFamily: "GeistMono", fontSize: 24 }}>{i + 1}</div>
                  <div style={{ display: "flex", fontSize: 32, lineHeight: 1.35, color: C.ink }}>{it}</div>
                </div>
              ))}
            </div>
          </>
        )}
        {s.t === "rank" && (
          <>
            <div style={{ display: "flex", fontFamily: "GeistMono", fontSize: 150, fontWeight: 600, color: C.amber, lineHeight: 1 }}>#{s.rank}</div>
            <div style={{ display: "flex", fontSize: s.title.length > 50 ? 62 : 74, fontWeight: 700, lineHeight: 1.04, letterSpacing: -2 }}>{s.title}</div>
            {s.pitch && <div style={{ display: "flex", fontSize: 32, lineHeight: 1.4, color: C.ink2 }}>{s.pitch}</div>}
            <Tiles tiles={s.tiles} />
          </>
        )}
        {s.t === "cta" && (
          <>
            <Kicker text="IdeaForge" />
            <div style={{ display: "flex", fontSize: 86, fontWeight: 700, lineHeight: 1.02, letterSpacing: -3 }}>{s.title}</div>
            <div style={{ display: "flex", fontSize: 34, lineHeight: 1.45, color: C.ink2 }}>{s.lines[0]}</div>
            <div style={{ display: "flex", fontSize: 32, fontWeight: 600, color: C.amber }}>{s.lines[1]}</div>
            <div style={{ display: "flex", alignSelf: "flex-start", alignItems: "center", gap: 18, padding: "26px 40px", borderRadius: 24, backgroundImage: "linear-gradient(180deg, #38cc87 0%, #1f9e63 100%)", color: "#03140c", fontSize: 38, fontWeight: 700 }}>{s.lines[2]} · ideaforges.io</div>
          </>
        )}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", fontFamily: "GeistMono", fontSize: 22, color: C.ink3 }}>
        <div style={{ display: "flex" }}>{handle}</div>
        <div style={{ display: "flex", color: s.t === "cta" ? C.ink3 : C.green }}>{s.t === "cta" ? "ideaforges.io" : "Glisse →"}</div>
      </div>
    </div>
  );
}
