import { useMemo, useState } from "react";
import { ArrowUpRight, CarFront, CheckCircle2, ClipboardCheck, FileWarning, Globe, KeyRound, RefreshCw, Ship, Sparkles, Store, Truck, Warehouse } from "lucide-react";
import { ago } from "@/hub/clock";
import { KORAUTO_URL } from "@/hub/AppShell";
import { STAGE_LABEL, carName, useKorauto, type Car } from "./feed";

const fmtDay = (iso?: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso.length <= 10 ? `${iso}T12:00:00Z` : iso);
  return Number.isNaN(+d) ? iso : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Europe/Belgrade" });
};

function Thumb({ src }: { src?: string | null }) {
  return (
    <div className="h-full w-full overflow-hidden bg-white/5">
      {src ? (
        <img src={src} alt="" loading="lazy" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center"><CarFront className="h-6 w-6 text-white/25" /></div>
      )}
    </div>
  );
}

function Stat({ label, value, icon: Icon, hot }: { label: string; value: number | string; icon: typeof Ship; hot?: boolean }) {
  return (
    <div className={`rounded-2xl border p-3 ${hot ? "border-amber-300/25 bg-amber-300/[0.06]" : "border-white/[0.07] bg-white/[0.025]"}`}>
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className={`hq-num mt-1 text-2xl font-semibold ${hot ? "text-amber-200" : "text-white"}`}>{value}</div>
    </div>
  );
}

function ConnectState() {
  const names = ["KORAUTO_SUPABASE_URL", "KORAUTO_SUPABASE_ANON_KEY", "KORAUTO_READ_EMAIL", "KORAUTO_READ_PASSWORD"];
  return (
    <section className="hq-card mx-auto mt-6 max-w-2xl p-6" data-testid="korauto-connect">
      <div className="flex items-center gap-2 text-white"><KeyRound className="h-5 w-5" /><h2 className="font-display text-xl font-semibold">Connect KORAUTO Manager</h2></div>
      <p className="mt-2 text-sm text-muted-foreground">
        This page reads KORAUTO Manager <b className="text-white">read-only</b> (stock, stages, shipping, activity — never buyer details or money).
        Add these four secrets in Lovable → Project settings → Secrets for WanderPass. Values are never shown here.
      </p>
      <ul className="mt-4 space-y-1.5">
        {names.map((n) => (
          <li key={n} className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2 font-mono text-[12px] text-white/85">
            {n} <span className="font-sans text-[11px] text-white/35">not set</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[12px] text-muted-foreground">Use a dedicated low-privilege KORAUTO login (worker role, minimal tabs). WanderPass only ever reads.</p>
      <a href={KORAUTO_URL} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-black">
        Open korautomanager.biz <ArrowUpRight className="h-4 w-4" />
      </a>
    </section>
  );
}

type Ev = { at: string; kind: string; text: string; sub?: string; icon: typeof Ship };

export default function KorautoPage() {
  const { feed, loading, refresh } = useKorauto();
  const [stage, setStage] = useState<string>("all");
  const now = Date.now();

  const cars = useMemo(() => {
    const m = new Map<string, Car>();
    for (const c of [...(feed?.latest ?? []), ...(feed?.recentUpdates ?? []), ...(feed?.addedToday ?? [])]) if (!m.has(c.id)) m.set(c.id, c);
    return [...m.values()].sort((a, b) => String(b.updated_at || b.created_at).localeCompare(String(a.updated_at || a.created_at)));
  }, [feed]);
  const shown = stage === "all" ? cars : cars.filter((c) => (c.sale_status || "none") === stage);

  const events = useMemo(() => {
    const out: Ev[] = [];
    const today = feed?.todayStart || "";
    for (const c of feed?.addedToday ?? []) out.push({ at: c.created_at || "", kind: "added", text: `${carName(c)} ${c.year ?? ""} added`, sub: [c.plate_number, STAGE_LABEL[c.sale_status || ""] || c.sale_status].filter(Boolean).join(" · "), icon: Sparkles });
    for (const c of feed?.recentUpdates ?? []) if ((c.updated_at || "") >= today && (c.created_at || "") < today) out.push({ at: c.updated_at || "", kind: "updated", text: `${carName(c)} ${c.year ?? ""} updated`, sub: [c.plate_number, c.tracking_status_label || STAGE_LABEL[c.sale_status || ""]].filter(Boolean).join(" · "), icon: RefreshCw });
    for (const c of feed?.recentUpdates ?? []) if ((c.updated_at || "") < today) out.push({ at: c.updated_at || "", kind: "updated", text: `${carName(c)} ${c.year ?? ""} updated`, sub: [c.plate_number, c.tracking_status_label || STAGE_LABEL[c.sale_status || ""]].filter(Boolean).join(" · "), icon: RefreshCw });
    for (const i of feed?.inspections ?? []) out.push({ at: i.created_at || "", kind: "inspection", text: `Inspection request · ${carName(i)} ${i.year ?? ""}`, sub: i.status || "", icon: ClipboardCheck });
    for (const c of feed?.openComplaints ?? []) out.push({ at: c.updated_at || "", kind: "complaint", text: `Customs complaint${c.car_label ? ` · ${c.car_label}` : ""}`, sub: c.status || "", icon: FileWarning });
    for (const c of feed?.pendingApprovals ?? []) out.push({ at: c.created_at || "", kind: "approval", text: `Awaiting approval · ${carName(c)} ${c.year ?? ""}`, icon: CheckCircle2 });
    const seen = new Set<string>();
    return out.filter((e) => e.at).sort((a, b) => b.at.localeCompare(a.at)).filter((e) => (seen.has(e.text + e.at) ? false : (seen.add(e.text + e.at), true))).slice(0, 25);
  }, [feed]);

  if (feed && !feed.configured) return <main className="mx-auto max-w-[1440px] px-3 pb-12 pt-4 sm:px-5"><ConnectState /></main>;

  const st = feed?.stages ?? {};
  const ss = feed?.statuses ?? {};
  const tr = feed?.tracking ?? {};
  const stats = [
    { label: "Cars", value: feed?.totalCars ?? "–", icon: CarFront },
    { label: "In stock", value: ss.in_stock ?? 0, icon: Warehouse },
    { label: "In sales", value: st.sales ?? 0, icon: Store },
    { label: "In autosallon", value: st.autosallon ?? 0, icon: CarFront },
    { label: "Shipped", value: st.shipped ?? 0, icon: Truck },
    { label: "On the water", value: tr.DEPARTED ?? 0, icon: Ship },
    { label: "Arriving ≤7d", value: feed?.arrivingThisWeek?.length ?? 0, icon: Ship, hot: (feed?.arrivingThisWeek?.length ?? 0) > 0 },
    { label: "Awaiting approval", value: feed?.pendingApprovals?.length ?? 0, icon: CheckCircle2, hot: (feed?.pendingApprovals?.length ?? 0) > 0 },
    { label: "Open complaints", value: feed?.openComplaints?.length ?? 0, icon: FileWarning },
    { label: "Website sales pending", value: feed?.pendingWebsiteSales ?? 0, icon: Globe, hot: (feed?.pendingWebsiteSales ?? 0) > 0 },
  ];
  const stageKeys = ["all", ...Object.keys(st).sort()];

  return (
    <main className="mx-auto max-w-[1440px] px-3 pb-12 pt-4 sm:px-5" data-testid="korauto-page">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white">KORAUTO Manager</h1>
          <p className="text-[12px] text-muted-foreground">Read-only overview · {feed?.generatedAt ? `updated ${ago(feed.generatedAt, now)}` : loading ? "loading…" : "—"}{feed?.stale ? " · showing cached data" : ""}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={refresh} className="flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-[13px] text-white/80 hover:bg-white/5" aria-label="Refresh">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
          <a href={KORAUTO_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[13px] font-medium text-black">
            Open manager <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {feed?.error && <div className="mt-3 rounded-xl border border-red-400/20 bg-red-400/[0.06] p-3 text-sm text-red-200">Couldn’t read KORAUTO right now ({feed.error}).</div>}

      <section className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => <Stat key={s.label} {...s} />)}
      </section>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-4">
          <section className="hq-card p-4">
            <div className="flex items-center justify-between"><h2 className="hq-label">On the water</h2><span className="text-[11px] text-muted-foreground">{feed?.shipping?.length ?? 0} cars</span></div>
            <ul className="mt-3 divide-y divide-white/[0.05]">
              {(feed?.shipping ?? []).slice(0, 12).map((c) => (
                <li key={c.id} className="flex items-center gap-3 py-2">
                  <div className="h-10 w-14 shrink-0 overflow-hidden rounded-lg"><Thumb src={c.image_url} /></div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-white">{carName(c)} <span className="text-white/45">{c.year ?? ""}</span></div>
                    <div className="truncate text-[11px] text-muted-foreground">{[c.tracking_vessel, c.tracking_arrival_port || c.tracking_destination].filter(Boolean).join(" → ") || c.tracking_status_label || "—"}</div>
                  </div>
                  <div className="shrink-0 text-right text-[11px]"><div className="text-white/80">ETA {fmtDay(c.tracking_eta)}</div><div className="text-white/40">{c.plate_number || ""}</div></div>
                </li>
              ))}
              {feed && !(feed.shipping ?? []).length && <li className="py-4 text-center text-sm text-muted-foreground">Nothing at sea right now</li>}
            </ul>
          </section>

          <section className="hq-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="hq-label">Recent cars</h2>
              <div className="no-scrollbar flex gap-1 overflow-x-auto">
                {stageKeys.map((k) => (
                  <button key={k} onClick={() => setStage(k)} className={`shrink-0 rounded-full px-3 py-1 text-[12px] ${stage === k ? "bg-white text-black" : "bg-white/[0.05] text-white/70 hover:bg-white/10"}`}>
                    {k === "all" ? "All" : STAGE_LABEL[k] || k}{k !== "all" ? ` · ${st[k]}` : ""}
                  </button>
                ))}
              </div>
            </div>
            <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4" data-testid="korauto-recent">
              {shown.slice(0, 16).map((c) => (
                <li key={c.id} className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02]">
                  <div className="aspect-[4/3]"><Thumb src={c.image_url} /></div>
                  <div className="p-2.5">
                    <div className="truncate text-sm font-medium text-white">{carName(c)} <span className="text-white/45">{c.year ?? ""}</span></div>
                    <div className="truncate text-[11px] text-muted-foreground">{c.plate_number || "—"}</div>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {c.sale_status && <span className="rounded-full bg-white/[0.07] px-2 py-0.5 text-[10px] text-white/75">{STAGE_LABEL[c.sale_status] || c.sale_status}</span>}
                      {c.tracking_status_label && <span className="rounded-full bg-sky-400/10 px-2 py-0.5 text-[10px] text-sky-200">{c.tracking_status_label}</span>}
                    </div>
                  </div>
                </li>
              ))}
              {feed && !shown.length && <li className="col-span-full py-6 text-center text-sm text-muted-foreground">No cars in this stage</li>}
            </ul>
          </section>
        </div>

        <section className="hq-card h-fit p-4">
          <h2 className="hq-label">Activity</h2>
          <ul className="mt-3 space-y-2" data-testid="korauto-activity">
            {events.map((e, i) => {
              const Icon = e.icon;
              return (
                <li key={i} className="flex gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] p-2.5">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-white/75"><Icon className="h-3.5 w-3.5" /></span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm text-white">{e.text}</div>
                    {e.sub && <div className="truncate text-[11px] text-muted-foreground">{e.sub}</div>}
                  </div>
                  <span className="shrink-0 text-[10px] text-white/40">{ago(e.at, now)}</span>
                </li>
              );
            })}
            {feed && !events.length && <li className="py-4 text-center text-sm text-muted-foreground">No recent activity</li>}
            {!feed && [0, 1, 2, 3].map((i) => <li key={i} className="h-12 animate-pulse rounded-xl bg-white/[0.03]" />)}
          </ul>
        </section>
      </div>
    </main>
  );
}
