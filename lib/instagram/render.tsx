// Dessin d'une slide de carrousel (1080 × 1350) : exactement le design du visuel Instagram IdeaForge
// (fond vert forêt, grille de points, ligne de circuit, particules, cartes à icône, bouton vert « Lien en bio »).
import type { Slide } from "@/lib/instagram/content";

const C = { bg: "#f2f3ef", ink: "#0c1512", ink2: "#44554f", ink3: "#5f6e67", green: "#0f7a4a", amber: "#9a6200" };
const G = { bd: "#dcded7", bg: "linear-gradient(180deg, #ffffff, #ffffff)", icBg: "#e1f1e7", ic: "#0f7a4a" };
const A = { bd: "rgba(224,155,19,0.55)", bg: "linear-gradient(180deg, #fffaf0, #fff4de)", icBg: "#fdf3df", ic: "#9a6200" };
const DOTS: [number, number, number, number, string][] = [[489,756,2.2,0.4,"#22a86a"],[663,251,2.2,0.32,"#22a86a"],[1061,1302,2.8,0.51,"#22a86a"],[898,85,1,0.25,"#22a86a"],[32,626,2.2,0.48,"#22a86a"],[595,1258,1,0.54,"#22a86a"],[828,541,2.2,0.19,"#e09b13"],[740,288,1,0.41,"#22a86a"],[429,99,1.4,0.58,"#22a86a"],[94,449,1,0.22,"#22a86a"],[12,628,2.2,0.25,"#22a86a"],[483,257,1.4,0.38,"#22a86a"],[426,1337,1,0.3,"#22a86a"],[868,411,1.4,0.25,"#22a86a"],[80,282,1.4,0.16,"#22a86a"],[672,172,2.8,0.42,"#22a86a"],[936,247,1.4,0.32,"#22a86a"],[51,147,2.8,0.68,"#22a86a"],[761,347,2.8,0.42,"#22a86a"],[1004,1319,1.4,0.28,"#22a86a"],[991,275,1,0.19,"#22a86a"],[269,63,1.8,0.35,"#22a86a"],[142,489,1.8,0.51,"#22a86a"],[631,189,1,0.66,"#22a86a"],[646,101,1,0.55,"#22a86a"],[1079,102,2.8,0.35,"#e09b13"],[1040,461,1,0.53,"#22a86a"],[87,863,2.2,0.55,"#22a86a"],[905,113,2.8,0.17,"#22a86a"],[537,830,1.8,0.64,"#22a86a"],[814,462,2.2,0.64,"#22a86a"],[719,268,2.2,0.59,"#22a86a"],[216,289,1.4,0.47,"#22a86a"],[147,670,1,0.54,"#22a86a"],[299,228,2.2,0.41,"#22a86a"],[726,967,2.8,0.4,"#e09b13"],[34,1178,1,0.52,"#22a86a"],[861,1328,1,0.4,"#22a86a"],[707,1090,1.4,0.26,"#22a86a"],[193,15,2.2,0.44,"#e09b13"],[1023,676,1.4,0.37,"#22a86a"],[979,118,2.2,0.22,"#22a86a"],[676,1228,2.2,0.45,"#22a86a"],[353,1326,1,0.55,"#22a86a"],[972,1324,1.8,0.45,"#22a86a"],[346,1228,1,0.34,"#22a86a"],[526,38,1,0.39,"#e09b13"],[576,927,2.2,0.23,"#22a86a"],[1021,665,1,0.57,"#22a86a"],[177,694,1.8,0.32,"#22a86a"],[913,1216,1.4,0.32,"#22a86a"],[444,154,1,0.48,"#e09b13"],[1047,697,2.2,0.45,"#22a86a"],[132,126,1.4,0.19,"#22a86a"],[447,1292,2.2,0.3,"#22a86a"],[137,585,2.2,0.44,"#22a86a"],[453,40,1.8,0.22,"#22a86a"],[25,262,1.4,0.16,"#22a86a"],[540,786,2.8,0.29,"#22a86a"],[875,1219,1.8,0.48,"#22a86a"],[105,1200,1.4,0.55,"#22a86a"],[853,170,2.2,0.5,"#22a86a"],[685,464,1.4,0.59,"#22a86a"],[26,1029,2.8,0.43,"#22a86a"],[158,249,1.4,0.24,"#22a86a"],[383,284,1.8,0.16,"#22a86a"]];

function Backdrop({ h = 1350, line = true }: { h?: number; line?: boolean }) {
  const ky = h / 1350;
  return (
    <svg width="1080" height={String(h)} viewBox={`0 0 1080 ${h}`} style={{ position: "absolute", left: 0, top: 0 }}>
      <defs>
        <linearGradient id="tr" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stopColor="#22a86a" stopOpacity="0" /><stop offset="0.4" stopColor="#22a86a" /><stop offset="1" stopColor="#e09b13" /></linearGradient>
        <pattern id="dg" width="36" height="36" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.2" fill="#22a86a" fillOpacity="0.10" /></pattern>
      </defs>
      <rect width="1080" height={String(h)} fill="url(#dg)" />
      {line && <path d="M0 176 H560 L600 152 H1080" fill="none" stroke="url(#tr)" strokeWidth="2" strokeLinecap="round" />}
      {line && <circle cx="600" cy="152" r="6" fill="#22a86a" />}
      {DOTS.map(([x, y, r, o, c], i) => <circle key={i} cx={x} cy={Math.round(y * ky)} r={r} fill={c} fillOpacity={o} />)}
    </svg>
  );
}

const icons: Record<string, string> = {
  gift: "M3 8h18v4H3zM12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7M7.5 8a2.5 2.5 0 0 1 0-5C10 3 12 8 12 8s2-5 4.5-5a2.5 2.5 0 0 1 0 5",
  trophy: "M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3",
  bolt: "M13 2 4 14h7l-1 8 9-12h-7l1-8z",
  chart: "M3 3v18h18M7 15l4-4 3 3 6-6",
  coin: "M12 2a10 10 0 1 0 0 20a10 10 0 1 0 0-20zM9 9.5h4.5a2 2 0 0 1 0 4H10a2 2 0 0 0 0 4H15M12 7v2.5M12 17.5V20",
  clock: "M12 2a10 10 0 1 0 0 20a10 10 0 1 0 0-20zM12 6v6l4 2",
  star: "M12 2l3 6.5 7 .8-5.2 4.8 1.5 7L12 17.6 5.7 21.1l1.5-7L2 9.3l7-.8z",
};
function Icon({ name, color }: { name: string; color: string }) {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24">
      <path d={icons[name] ?? icons.star} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Card({ v, icon, num, kicker, title, sub }: { v: typeof G; icon?: string; num?: number; kicker?: string; title: string; sub?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 26, padding: "34px 36px", borderRadius: 28, border: `1.5px solid ${v.bd}`, backgroundImage: v.bg }}>
      <div style={{ display: "flex", width: 84, height: 84, flexShrink: 0, borderRadius: 22, alignItems: "center", justifyContent: "center", background: v.icBg, border: `1.5px solid ${v.bd}`, color: v.ic, fontFamily: "GeistMono", fontSize: 34 }}>
        {icon ? <Icon name={icon} color={v.ic} /> : String(num ?? "")}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 1 }}>
        {kicker && <div style={{ display: "flex", fontFamily: "GeistMono", fontSize: 18, letterSpacing: 2.8, color: v.ic }}>{kicker.toUpperCase()}</div>}
        <div style={{ display: "flex", fontSize: 42, fontWeight: 600, lineHeight: 1.14, letterSpacing: -1, color: C.ink }}>{title}</div>
        {sub && <div style={{ display: "flex", fontSize: 27, lineHeight: 1.35, color: C.ink2 }}>{sub}</div>}
      </div>
    </div>
  );
}

/** Titre en deux tons : la fin (après « | ») passe en vert, comme sur le visuel. */
function Title({ text, size = 82 }: { text: string; size?: number }) {
  let [a, b] = text.split("|");
  if (b === undefined) {
    const w = a.trim().split(/\s+/);
    const k = w.length > 2 ? Math.max(1, Math.round(w.length / 3)) : 0;
    if (k) { a = w.slice(0, -k).join(" "); b = w.slice(-k).join(" "); }
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", fontSize: size, fontWeight: 600, lineHeight: 0.98, letterSpacing: -size * 0.045 }}>
      <div style={{ display: "flex" }}>{a.trim()}</div>
      {b && <div style={{ display: "flex", color: C.green }}>{b.trim()}</div>}
    </div>
  );
}

function Kicker({ text }: { text: string }) {
  return <div style={{ display: "flex", fontFamily: "GeistMono", fontSize: 24, letterSpacing: 4, color: C.green }}>{text.toUpperCase()}</div>;
}

const PILL: Record<string, string> = { cover: "NOUVEAU", text: "LE MARCHÉ", stats: "LES CHIFFRES", list: "LE PLAN", rank: "TOP 5", cta: "IDEAFORGE" };

export function SlideView({ s, handle, pill, reel, bare }: { s: Slide; handle: string; pill?: string; reel?: boolean; bare?: boolean }) {
  const page = "n" in s ? `${s.n}/${s.total}` : "";
  return (
    <div style={{ width: 1080, height: 1350, position: "relative", display: "flex", fontFamily: "Geist", color: C.ink,
      ...(bare ? {} : { backgroundColor: C.bg, backgroundImage: "radial-gradient(circle at 85% 8%, rgba(34,168,106,0.16) 0%, rgba(34,168,106,0) 45%), radial-gradient(circle at 0% 100%, rgba(224,155,19,0.10) 0%, rgba(224,155,19,0) 45%)" }) }}>
      {bare ? null : <Backdrop />}
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1350, display: "flex", flexDirection: "column", padding: "64px 64px 60px", gap: 34 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div style={{ display: "flex", width: 64, height: 64, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: "#003d30", color: "#ffffff", fontSize: 27, fontWeight: 700, letterSpacing: -1 }}>IF</div>
            <div style={{ display: "flex", fontSize: 34, fontWeight: 600, letterSpacing: -1 }}>IdeaForge</div>
          </div>
          <div style={{ display: "flex", fontFamily: "GeistMono", fontSize: 20, letterSpacing: 3.6, color: "#ffffff", background: C.green, padding: "10px 20px", borderRadius: 999 }}>{(pill ?? PILL[s.t]).toUpperCase()}</div>
        </div>
        <div style={{ display: "flex", flexGrow: 1 }} />

        {s.t === "cover" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 30, }}>
            <Kicker text={s.kicker} />
            <Title text={s.title} size={s.title.length > 60 ? 76 : 88} />
            {s.sub && <div style={{ display: "flex", fontSize: 29, lineHeight: 1.4, color: C.ink2 }}>{s.sub}</div>}
            {s.stat && <Card v={A} icon="chart" kicker="Potentiel" title={`≈ ${s.stat}`} sub={s.statLabel} />}
          </div>
        )}
        {s.t === "text" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 30, }}>
            <Kicker text={s.kicker} /><Title text={s.title} size={80} />
            <Card v={G} icon="star" title={s.body} />
          </div>
        )}
        {s.t === "stats" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20, }}>
            <Kicker text={s.kicker} /><Title text={s.title} size={80} />
            <div style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 10 }}>
              {s.tiles.map((t, i) => <Card key={i} v={i === s.tiles.length - 1 ? A : G} icon={["coin", "chart", "clock", "star"][i] ?? "star"} kicker={t.k} title={t.v} />)}
            </div>
          </div>
        )}
        {s.t === "list" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20, }}>
            <Kicker text={s.kicker} /><Title text={s.title} size={80} />
            <div style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 10 }}>
              {s.items.map((it, i) => <Card key={i} v={s.kicker === "Attention" ? A : G} num={i + 1} title={it} />)}
            </div>
          </div>
        )}
        {s.t === "rank" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 26, }}>
            <div style={{ display: "flex", fontFamily: "GeistMono", fontSize: 130, color: C.amber, lineHeight: 1 }}>#{s.rank}</div>
            <Title text={s.title} size={s.title.length > 50 ? 62 : 74} />
            {s.pitch && <div style={{ display: "flex", fontSize: 29, lineHeight: 1.4, color: C.ink2 }}>{s.pitch}</div>}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {s.tiles.map((t, i) => <Card key={i} v={i === s.tiles.length - 1 ? A : G} icon={["coin", "chart", "star"][i] ?? "star"} kicker={t.k} title={t.v} />)}
            </div>
          </div>
        )}
        {s.t === "cta" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24, }}>
            <Title text={`${s.title}|sur IdeaForge`} size={86} />
            <div style={{ display: "flex", fontSize: 29, lineHeight: 1.4, color: C.ink2 }}>Plus de 100 idées de business chiffrées, prêtes à lancer.</div>
            <Card v={G} icon="gift" kicker="Offert à l'inscription" title="1 fiche complète gratuite" sub="Crée ton compte et débloque la fiche de ton choix." />
            <Card v={G} icon="trophy" kicker="Gratuit par e-mail" title="Le Top 10 des idées les mieux notées" />
            <Card v={A} icon="bolt" kicker="Tout débloquer" title={s.lines[0]} />
          </div>
        )}

        <div style={{ display: "flex", flexGrow: 1 }} />
        {s.t === "cta" ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "24px 30px", borderRadius: 24, backgroundImage: "linear-gradient(180deg, #22a86a 0%, #0f7a4a 100%)" }}>
            <div style={{ display: "flex", fontSize: 34, fontWeight: 700, color: "#ffffff" }}>Lien en bio</div>
            <div style={{ display: "flex", fontFamily: "GeistMono", fontSize: 28, color: "#ffffff" }}>ideaforges.io →</div>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: "GeistMono", fontSize: 22, color: C.ink3 }}>
            <div style={{ display: "flex" }}>{handle}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <div style={{ display: "flex" }}>{page}</div>
              {!reel && <div style={{ display: "flex", color: "#ffffff", background: C.green, padding: "10px 20px", borderRadius: 999 }}>Glisse →</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export type StoryData = {
  badge: string; kicker: string; title: string; sub?: string;
  items: { k?: string; v: string; num?: number; icon?: string; amber?: boolean }[];
  cta: string;
};

/** Story 1080 × 1920 : même univers que les carrousels (fond, logo, pastille, cartes, barre verte). */
export function StoryView({ d, handle }: { d: StoryData; handle: string }) {
  return (
    <div style={{ width: 1080, height: 1920, position: "relative", display: "flex", fontFamily: "Geist", color: C.ink, backgroundColor: C.bg,
      backgroundImage: "radial-gradient(circle at 85% 6%, rgba(34,168,106,0.16) 0%, rgba(34,168,106,0) 42%), radial-gradient(circle at 0% 100%, rgba(224,155,19,0.10) 0%, rgba(224,155,19,0) 45%)" }}>
      <Backdrop h={1920} />
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, display: "flex", flexDirection: "column", padding: "150px 72px 230px", gap: 34 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ display: "flex", width: 74, height: 74, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: "#003d30", color: "#ffffff", fontSize: 31, fontWeight: 700, letterSpacing: -1 }}>IF</div>
            <div style={{ display: "flex", fontSize: 40, fontWeight: 600, letterSpacing: -1 }}>IdeaForge</div>
          </div>
          <div style={{ display: "flex", fontFamily: "GeistMono", fontSize: 24, letterSpacing: 4, color: "#ffffff", background: C.green, padding: "12px 24px", borderRadius: 999 }}>{d.badge.toUpperCase()}</div>
        </div>
        <div style={{ display: "flex", flexGrow: 1 }} />
        <Kicker text={d.kicker} />
        <Title text={d.title} size={d.title.length > 60 ? 84 : 98} />
        {d.sub && <div style={{ display: "flex", fontSize: 34, lineHeight: 1.4, color: C.ink2 }}>{d.sub}</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 6 }}>
          {d.items.map((it, i) => <Card key={i} v={it.amber ? A : G} icon={it.num ? undefined : it.icon ?? "star"} num={it.num} kicker={it.k} title={it.v} />)}
        </div>
        <div style={{ display: "flex", flexGrow: 1 }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "30px 36px", borderRadius: 28, backgroundImage: "linear-gradient(180deg, #22a86a 0%, #0f7a4a 100%)" }}>
          <div style={{ display: "flex", fontSize: 38, fontWeight: 700, color: "#ffffff" }}>{d.cta}</div>
          <div style={{ display: "flex", fontFamily: "GeistMono", fontSize: 30, color: "#ffffff" }}>ideaforges.io →</div>
        </div>
        <div style={{ display: "flex", justifyContent: "center", fontFamily: "GeistMono", fontSize: 26, color: C.ink3 }}>{handle}</div>
      </div>
    </div>
  );
}

/** Image de réel 1080 × 1920 : la slide du carrousel au centre, le même décor autour. */
export function ReelFrame({ s, handle }: { s: Slide; handle: string }) {
  return (
    <div style={{ width: 1080, height: 1920, position: "relative", display: "flex", fontFamily: "Geist", color: C.ink, backgroundColor: C.bg,
      backgroundImage: "radial-gradient(circle at 85% 6%, rgba(34,168,106,0.16) 0%, rgba(34,168,106,0) 42%), radial-gradient(circle at 0% 100%, rgba(224,155,19,0.10) 0%, rgba(224,155,19,0) 45%)" }}>
      <Backdrop h={1920} line={false} />
      <div style={{ position: "absolute", left: 0, top: 230, width: 1080, height: 1350, display: "flex", overflow: "hidden", borderTop: "1px solid #dcded7", borderBottom: "1px solid #dcded7" }}>
        <SlideView s={s} handle={handle} reel />
      </div>
    </div>
  );
}

/** Décor seul (fond du réel), 1080 × 1920. */
export function ReelBg() {
  return (
    <div style={{ width: 1080, height: 1920, position: "relative", display: "flex", backgroundColor: C.bg,
      backgroundImage: "radial-gradient(circle at 80% 12%, rgba(34,168,106,0.20) 0%, rgba(34,168,106,0) 45%), radial-gradient(circle at 10% 92%, rgba(224,155,19,0.12) 0%, rgba(224,155,19,0) 45%)" }}>
      <Backdrop h={1920} line={false} />
    </div>
  );
}

export type PollData = { theme: string; question: string; a: string; b: string };

/** Story « Sondage » 1080 × 1920 : question + deux réponses A / B, on répond en message. */
export function PollView({ d, handle }: { d: PollData; handle: string }) {
  const opt = (letter: string, text: string, v: typeof G) => (
    <div style={{ display: "flex", alignItems: "center", gap: 28, padding: "34px 36px", borderRadius: 30, border: `2px solid ${v.bd}`, backgroundImage: v.bg }}>
      <div style={{ display: "flex", width: 96, height: 96, flexShrink: 0, borderRadius: 26, alignItems: "center", justifyContent: "center", background: v.icBg, border: `2px solid ${v.bd}`, color: v.ic, fontSize: 52, fontWeight: 700 }}>{letter}</div>
      <div style={{ display: "flex", fontSize: 46, fontWeight: 600, lineHeight: 1.15, letterSpacing: -1, color: C.ink, flexShrink: 1 }}>{text}</div>
    </div>
  );
  return (
    <div style={{ width: 1080, height: 1920, position: "relative", display: "flex", fontFamily: "Geist", color: C.ink, backgroundColor: C.bg,
      backgroundImage: "radial-gradient(circle at 85% 6%, rgba(34,168,106,0.16) 0%, rgba(34,168,106,0) 42%), radial-gradient(circle at 0% 100%, rgba(224,155,19,0.12) 0%, rgba(224,155,19,0) 45%)" }}>
      <Backdrop h={1920} />
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, display: "flex", flexDirection: "column", padding: "150px 72px 230px", gap: 34 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ display: "flex", width: 74, height: 74, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: "#003d30", color: "#ffffff", fontSize: 31, fontWeight: 700, letterSpacing: -1 }}>IF</div>
            <div style={{ display: "flex", fontSize: 40, fontWeight: 600, letterSpacing: -1 }}>IdeaForge</div>
          </div>
          <div style={{ display: "flex", fontFamily: "GeistMono", fontSize: 24, letterSpacing: 4, color: "#ffffff", background: C.green, padding: "12px 24px", borderRadius: 999 }}>SONDAGE</div>
        </div>
        <div style={{ display: "flex", flexGrow: 1 }} />
        <Kicker text={d.theme} />
        <Title text={d.question} size={d.question.length > 70 ? 76 : 90} />
        <div style={{ display: "flex", flexDirection: "column", gap: 22, marginTop: 10 }}>
          {opt("A", d.a, G)}
          {opt("B", d.b, A)}
        </div>
        <div style={{ display: "flex", flexGrow: 1 }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "30px 36px", borderRadius: 28, backgroundImage: "linear-gradient(180deg, #22a86a 0%, #0f7a4a 100%)" }}>
          <div style={{ display: "flex", fontSize: 40, fontWeight: 700, color: "#ffffff" }}>Réponds A ou B en message</div>
        </div>
        <div style={{ display: "flex", justifyContent: "center", fontFamily: "GeistMono", fontSize: 26, color: C.ink3 }}>{handle}</div>
      </div>
    </div>
  );
}
