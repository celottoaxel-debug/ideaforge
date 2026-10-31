import { createClient } from "@/lib/supabase/server";
import { getPlan, isMember } from "@/lib/plan";
import { getLocale, dict } from "@/lib/i18n";
import { IDEAS } from "@/lib/ideas";
import type { Idea } from "@/lib/types";
import { buildPrompt } from "@/lib/prompt";
import CheckoutButton from "@/components/CheckoutButton";
import PromptBox from "@/components/PromptBox";
import Checklist from "@/components/Checklist";
import RevenueCalc from "@/components/RevenueCalc";
import LangSwitcher from "@/components/LangSwitcher";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export function generateMetadata({ params }: { params: { id: string } }): Metadata {
  const it = IDEAS.find((x) => x.id === params.id);
  if (!it) return { title: "IdeaForge" };
  return {
    title: `${it.title} — IdeaForge`,
    description: it.pitch ?? undefined,
    openGraph: { title: `${it.title} — IdeaForge`, description: it.pitch ?? undefined },
  };
}

export default async function IdeaPage({ params }: { params: { id: string } }) {
  let it = IDEAS.find((x) => x.id === params.id) as Idea | undefined;
  if (!it) {
    // Idée découverte en continu (Supabase) : repli si absente de la base statique.
    try {
      const supabase = createClient();
      const { data } = await supabase.from("ideas").select("*").eq("id", params.id).maybeSingle();
      if (data) it = data as Idea;
    } catch {}
  }
  if (!it) notFound();

  const locale = getLocale();
  const t = dict(locale);
  const diff: Record<number, string> = { 1: t.diff1, 2: t.diff2, 3: t.diff3 };
  const plan = await getPlan();
  const member = isMember(plan);

  return (
    <>
      <header className="nav">
        <div className="wrap nav-in">
          <a className="brand" href="/"><span className="mk">IF</span> IdeaForge</a>
          <a className="btn" href="/">{t.idea_back}</a>
          <LangSwitcher current={locale} />
        </div>
      </header>

      <main className="wrap" style={{ maxWidth: 760, paddingBlock: 40 }}>
        <span className="sector">{it.sector}{it.markets ? ` · ${it.markets}` : ""}</span>
        <h1 style={{ fontSize: 34, margin: "8px 0 10px" }}>{it.title}</h1>
        {it.pitch && <p style={{ fontSize: 18, color: "var(--ink-2)" }}>{it.pitch}</p>}

        <div className="grid" style={{ gridTemplateColumns: "repeat(2,1fr)", margin: "22px 0" }}>
          <div className="card"><span className="stat"><span className="k">{t.m_ticket}</span><span className="v">{it.budget}</span></span></div>
          <div className="card"><span className="stat"><span className="k">{t.m_potential}</span><span className="v">{it.revenue}</span></span></div>
          <div className="card"><span className="stat"><span className="k">{t.m_delai}</span><span className="v">{it.delai}</span></span></div>
          <div className="card"><span className="stat"><span className="k">{t.m_diff}</span><span className="v">{it.difficulty ? diff[it.difficulty] : "—"}</span></span></div>
        </div>

        {it.benchmark && (
          <div className="card" style={{ background: "var(--forest)", color: "#fff", marginBottom: 20 }}>
            <span className="k" style={{ color: "rgba(255,255,255,.6)" }}>{t.d_bench}</span>
            <div style={{ fontFamily: "var(--mono)", fontWeight: 600 }}>📈 {it.benchmark}</div>
          </div>
        )}

        <section className="dsec"><h3>{t.calc_h}</h3><RevenueCalc t={t} defaultPrice={29} /></section>

        <section className="dsec"><h3>{t.d_market}</h3><p>{member ? it.market : (it.market || "").slice(0, 150) + "…"}</p></section>

        {member ? (
          <>
            <section className="dsec"><h3>{t.d_model}</h3><p>{it.model}</p></section>
            <section className="dsec"><h3>{t.d_comp}</h3><p>{it.competition}</p></section>
            {it.steps?.length ? <section className="dsec"><h3>{t.checklist_h}</h3><Checklist id={it.id} steps={it.steps} t={t} /></section> : null}
            <section className="dsec"><h3>{t.d_risks}</h3><ul>{it.risks?.map((s, i) => <li key={i}>{s}</li>)}</ul></section>
            <section className="dsec"><h3>{t.d_prompt_h}</h3><p style={{ color: "var(--ink-2)", fontSize: 14, marginBottom: 10 }}>{t.d_prompt_sub}</p><PromptBox prompt={buildPrompt(it)} t={t} /></section>
          </>
        ) : (
          <div className="gate-lock">
            <div style={{ fontSize: 26 }}>🔒</div>
            <h3>{t.gate_title}</h3>
            <p style={{ color: "var(--ink-2)", maxWidth: "42ch", margin: "0 auto" }}>{t.gate_sub}</p>
            <div style={{ maxWidth: 320, margin: "10px auto 0" }}>
              <CheckoutButton plan="lifetime" label={t.p_l_cta} redirecting={t.redirecting} unavailable={t.pay_unavailable} />
            </div>
          </div>
        )}
      </main>
    </>
  );
}
