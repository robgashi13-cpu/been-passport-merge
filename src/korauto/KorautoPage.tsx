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
    <div className="h-full w-full overflow-hidden bg-foreground/[0.06]">
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
    <div className="hq-card hq-stat !rounded-[20px] !p-3.5" data-hot={!!hot}>
      <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className="hq-num hq-big mt-1.5 text-[28px] text-white">{value}</div>
    </div>
  );
}

function ConnectState({ missing }: { missing?: string[] }) {
  const names = ["KORAUTO_SUPABASE_URL", "KORAUTO_SUPABASE_ANON_KEY", "KORAUTO_READ_EMAIL", "KORAUTO_READ_PASSWORD"];
  const miss = new Set(missing ?? names);
  const loginOnly = !miss.has("KORAUTO_SUPABASE_URL") && !miss.has("KORAUTO_SUPABASE_ANON_KEY");
  return (
    <section className="hq-card mx-auto mt-6 max-w-2xl p-6" data-testid="korauto-connect">
      <div className="flex items-center gap-2 text-white"><KeyRound className="h-5 w-5" /><h2 className="font-display text-xl font-semibold" data-testid="korauto-connect-title">{loginOnly ? "KORAUTO Manager needs a login" : "Connect KORAUTO Manager"}</h2></div>
      <p className="mt-2 text-sm text-muted-foreground">
        This page reads KORAUTO Manager <b className="text-white">read-only</b> (stock, stages, shipping, activity — never buyer details or money).
        {loginOnly
          ? <>The connection is already set up. Add the KORAUTO login as two secrets in Lovable → WanderPass → Project settings → Secrets: <b className="text-white">KORAUTO_READ_EMAIL</b> and <b className="text-white">KORAUTO_READ_PASSWORD</b>. Values are never shown here.</>
          : <>Add the secrets marked “not set” in Lovable → Project settings → Secrets for WanderPass. Values are never shown here.</>}
      </p>
      <ul className="mt-4 space-y-1.5">
        {names.map((n) => (
          <li key={n} className="hq-row !min-h-[40px] justify-between rounded-xl bg-foreground/[0.05] font-mono text-[12px] text-white/85">
            {n} {miss.has(n) ? <span className="font-sans text-[12px] font-medium text-[hsl(var(--orange))]">not set</span> : <span className="font-sans text-[12px] font-medium text-[hsl(var(--success))]">set</span>}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[12px] text-muted-foreground">Use a dedicated low-privilege KORAUTO login (worker role, minimal tabs). WanderPass only ever reads.</p>
      <a href={KORAUTO_URL} target="_blank" rel="noopener noreferrer" className="hq-btn mt-5">
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

  if (feed && !feed.configured) return <main className="mx-auto max-w-[1440px] px-3 pb-12 pt-4 sm:px-5"><ConnectState missing={feed.missing} /></main>;

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
          <h1 className="sr-only">KORAUTO Manager</h1>
          <p className="t-footnote text-muted-foreground">Read-only overview · {feed?.generatedAt ? `updated ${ago(feed.generatedAt, now)}` : loading ? "loading…" : "—"}{feed?.stale ? " · showing cached data" : ""}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={refresh} className="hq-btn press" data-tone="plain" aria-label="Refresh">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
          <a href={KORAUTO_URL} target="_blank" rel="noopener noreferrer" className="hq-btn">
            Open manager <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {feed?.error && <div className="mt-3 rounded-2xl bg-[hsl(var(--destructive)/.12)] p-3 text-sm text-[hsl(var(--destructive))]">Couldn’t read KORAUTO right now ({feed.error}).</div>}

      <section className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => <Stat key={s.label} {...s} />)}
      </section>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-4">
          <section className="hq-card p-4">
            <div className="flex items-center justify-between"><h2 className="t-headline">On the water</h2><span className="text-[13px] text-muted-foreground">{feed?.shipping?.length ?? 0} cars</span></div>
            <ul className="mt-3 hq-group">
              {(feed?.shipping ?? []).slice(0, 12).map((c) => (
                <li key={c.id} className="hq-row !min-h-[56px] !py-2">
                  <div className="h-10 w-14 shrink-0 overflow-hidden rounded-lg"><Thumb src={c.image_url} /></div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-white">{carName(c)} <span className="text-white/45">{c.year ?? ""}</span></div>
                    <div className="truncate text-[12px] text-muted-foreground">{[c.tracking_vessel, c.tracking_arrival_port || c.tracking_destination].filter(Boolean).join(" → ") || c.tracking_status_label || "—"}</div>
                  </div>
                  <div className="shrink-0 text-right text-[11px]"><div className="text-white/80">ETA {fmtDay(c.tracking_eta)}</div><div className="text-muted-foreground">{c.plate_number || ""}</div></div>
                </li>
              ))}
              {feed && !(feed.shipping ?? []).length && <li className="py-4 text-center text-sm text-muted-foreground">Nothing at sea right now</li>}
            </ul>
          </section>

          <section className="hq-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="t-headline">Recent cars</h2>
              <div className="no-scrollbar flex gap-1 overflow-x-auto">
                {stageKeys.map((k) => (
                  <button key={k} onClick={() => setStage(k)} className={`press shrink-0 rounded-full px-3 py-1.5 text-[13px] ${stage === k ? "bg-primary font-semibold text-primary-foreground" : "bg-foreground/[0.06] text-foreground/75"}`}>
                    {k === "all" ? "All" : STAGE_LABEL[k] || k}{k !== "all" ? ` · ${st[k]}` : ""}
                  </button>
                ))}
              </div>
            </div>
            <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4" data-testid="korauto-recent">
              {shown.slice(0, 16).map((c) => (
                <li key={c.id} className="press overflow-hidden rounded-2xl bg-foreground/[0.045]">
                  <div className="aspect-[4/3]"><Thumb src={c.image_url} /></div>
                  <div className="p-2.5">
                    <div className="truncate text-sm font-medium text-white">{carName(c)} <span className="text-white/45">{c.year ?? ""}</span></div>
                    <div className="truncate text-[12px] text-muted-foreground">{c.plate_number || "—"}</div>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {c.sale_status && <span className="rounded-full bg-foreground/[0.07] px-2 py-0.5 text-[11px] text-white/75">{STAGE_LABEL[c.sale_status] || c.sale_status}</span>}
                      {c.tracking_status_label && <span className="rounded-full bg-primary/12 px-2 py-0.5 text-[11px] text-primary">{c.tracking_status_label}</span>}
                    </div>
                  </div>
                </li>
              ))}
              {feed && !shown.length && <li className="col-span-full py-6 text-center text-sm text-muted-foreground">No cars in this stage</li>}
            </ul>
          </section>
        </div>

        <section className="hq-card h-fit p-4">
          <h2 className="t-headline">Activity</h2>
          <ul className="hq-group mt-3" data-testid="korauto-activity">
            {events.map((e, i) => {
              const Icon = e.icon;
              return (
                <li key={i} className="hq-row !items-start !py-2.5">
                  <span className="mt-0.5 hq-ico !h-7 !w-7 !rounded-lg"><Icon className="h-3.5 w-3.5" /></span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm text-white">{e.text}</div>
                    {e.sub && <div className="truncate text-[11px] text-muted-foreground">{e.sub}</div>}
                  </div>
                  <span className="shrink-0 text-[12px] text-muted-foreground">{ago(e.at, now)}</span>
                </li>
              );
            })}
            {feed && !events.length && <li className="py-4 text-center text-sm text-muted-foreground">No recent activity</li>}
            {!feed && [0, 1, 2, 3].map((i) => <li key={i} className="hq-shimmer h-12" />)}
          </ul>
        </section>
      </div>
    </main>
  );
}
