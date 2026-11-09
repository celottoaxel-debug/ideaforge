import { createAdminClient } from "@/lib/supabase/admin";

type Row = { created_at: string; path: string; source: string | null; country: string | null; city: string | null; device: string | null; browser: string | null; visitor: string | null };

export type Top = { label: string; visitors: number; views: number }[];

const DAY = 86_400_000;

function top(rows: Row[], key: (r: Row) => string | null, n = 8): Top {
  const m = new Map<string, { v: Set<string>; views: number }>();
  for (const r of rows) {
    const k = key(r) || "Inconnu";
    const e = m.get(k) ?? { v: new Set<string>(), views: 0 };
    e.views++; if (r.visitor) e.v.add(r.visitor);
    m.set(k, e);
  }
  return [...m.entries()].map(([label, e]) => ({ label, visitors: e.v.size, views: e.views }))
    .sort((a, b) => b.visitors - a.visitors || b.views - a.views).slice(0, n);
}

const regionName = (() => {
  try { const d = new Intl.DisplayNames(["fr"], { type: "region" }); return (c: string) => { try { return d.of(c) ?? c; } catch { return c; } }; }
  catch { return (c: string) => c; }
})();

// Statistiques de visite sur `days` jours (données de la table page_views).
export async function getVisitorStats(days: number) {
  const admin = createAdminClient();
  const since = new Date(Date.now() - days * DAY);
  since.setUTCHours(0, 0, 0, 0);

  const rows: Row[] = [];
  for (let from = 0; from < 100_000; from += 1000) {
    const { data, error } = await admin.from("page_views")
      .select("created_at,path,source,country,city,device,browser,visitor")
      .gte("created_at", since.toISOString()).order("created_at", { ascending: false }).range(from, from + 999);
    if (error) throw new Error(error.message);
    rows.push(...((data as Row[]) ?? []));
    if (!data || data.length < 1000) break;
  }

  const [{ count: signups }, { count: buyers }] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", since.toISOString()),
    admin.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", since.toISOString()).neq("plan", "free"),
  ]);

  // Série jour par jour.
  const labels: string[] = [], visitors: number[] = [], views: number[] = [];
  const byDay = new Map<string, { v: Set<string>; n: number }>();
  for (const r of rows) {
    const d = r.created_at.slice(0, 10);
    const e = byDay.get(d) ?? { v: new Set<string>(), n: 0 };
    e.n++; if (r.visitor) e.v.add(`${d}|${r.visitor}`);
    byDay.set(d, e);
  }
  for (let t = since.getTime(); t <= Date.now(); t += DAY) {
    const d = new Date(t).toISOString().slice(0, 10);
    const e = byDay.get(d);
    labels.push(new Date(t).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }));
    visitors.push(e?.v.size ?? 0);
    views.push(e?.n ?? 0);
  }

  const uniq = new Set(rows.map((r) => `${r.created_at.slice(0, 10)}|${r.visitor}`)).size;
  const now = new Set(rows.filter((r) => Date.now() - new Date(r.created_at).getTime() < 30 * 60_000).map((r) => r.visitor)).size;
  const today = new Date().toISOString().slice(0, 10);

  return {
    days,
    visitors: uniq,
    views: rows.length,
    now,
    today: byDay.get(today)?.v.size ?? 0,
    pagesPerVisit: uniq ? rows.length / uniq : 0,
    signups: signups ?? 0,
    buyers: buyers ?? 0,
    series: { labels, visitors, views },
    pages: top(rows, (r) => r.path),
    sources: top(rows, (r) => r.source),
    countries: top(rows, (r) => (r.country ? regionName(r.country) : null)),
    cities: top(rows, (r) => (r.city ? `${r.city}${r.country ? ` (${r.country})` : ""}` : null), 6),
    devices: top(rows, (r) => r.device, 3),
    browsers: top(rows, (r) => r.browser, 5),
    recent: rows.slice(0, 12),
  };
}
