import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, CarFront, CheckCircle2, ChevronRight, ClipboardCheck, FileWarning, Globe, KeyRound, LogOut, RefreshCw, Search, Ship, Sparkles, Store, Truck, Wallet, Warehouse } from "lucide-react";
import { ago } from "@/hub/clock";
import { KORAUTO_URL } from "@/hub/AppShell";
import { STAGE_LABEL, carName, useKorauto, type Car } from "./feed";
import CarDetail from "./CarDetail";
import { fetchKamCars, useKamAccess, useKamSession, type KamCar } from "./kam";

const fmtDay = (iso?: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso.length <= 10 ? `${iso}T12:00:00Z` : iso);
  return Number.isNaN(+d) ? iso : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Europe/Belgrade" });
};

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

type Row = Car | KamCar;
type Ev = { at: string; text: string; sub?: string; icon: typeof Ship; carId?: string };
type FilterKey = "all" | "recent" | "stock" | "sales" | "autosallon" | "shipped" | "water" | "arriving" | "approval" | "balance" | "complaints" | "activity";

const FILTER_LABEL: Record<FilterKey, string> = {
  all: "All cars", recent: "Recent", stock: "In stock", sales: "In sales", autosallon: "In autosallon", shipped: "Shipped",
  water: "On the water", arriving: "Arriving ≤7d", approval: "Awaiting approval", balance: "Balance due", complaints: "Open complaints", activity: "Activity",
};
const CHIPS: FilterKey[] = ["recent", "all", "water", "arriving", "balance", "approval", "sales", "autosallon", "shipped", "stock", "activity"];

const num = (v: unknown) => Number(v ?? 0) || 0;
const paid = (r: Record<string, unknown>) => Math.max(num(r.amount_paid_cash) + num(r.amount_paid_bank) + num(r.deposit), num(r.amount_paid_by_client));
const due = (r: Record<string, unknown>) => (num(r.sale_price) ? Math.max(0, num(r.sale_price) - paid(r)) : 0);
const todayISO = () => new Date().toISOString().slice(0, 10);
const weekISO = () => new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
const eur = (n: number) => new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

function useWide(q = "(min-width: 700px)") {
  const [wide, setWide] = useState(() => typeof window !== "undefined" && window.matchMedia(q).matches);
  useEffect(() => {
    const m = window.matchMedia(q);
    const on = () => setWide(m.matches);
    on();
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, [q]);
  return wide;
}

function CarRow({ r, active, filter, onOpen }: { r: Row; active: boolean; filter: FilterKey; onOpen: () => void }) {
  const x = r as Record<string, unknown>;
  const hasMoney = "sale_price" in x || "buy_price" in x;
  const d = hasMoney ? due(x) : 0;
  let amount = "";
  let amountSub = "";
  if (filter === "water" || filter === "arriving") {
    amount = x.tracking_eta ? `ETA ${fmtDay(String(x.tracking_eta))}` : "";
  } else if (hasMoney && d > 0) {
    amount = eur(d);
    amountSub = "due";
  } else if (hasMoney && num(x.sale_price)) {
    amount = eur(num(x.sale_price));
  } else if (x.tracking_eta && x.tracking_status === "DEPARTED") {
    amount = `ETA ${fmtDay(String(x.tracking_eta))}`;
  }
  const status = [STAGE_LABEL[String(x.sale_status ?? "")] || (x.sale_status as string), x.approval_status === "pending" ? "pending" : x.status === "sold" ? "sold" : null].filter(Boolean).join(" · ");
  const id2 = [x.plate_number, x.vin].filter(Boolean).join(" · ");
  return (
    <li>
      <button type="button" onClick={onOpen} aria-current={active || undefined} data-testid="korauto-row"
        className={`press flex min-h-[52px] w-full items-center gap-3 px-3 py-2 text-left ${active ? "bg-foreground/[0.10]" : ""}`}>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[14px] font-semibold leading-5 text-white">{carName(r as Car)} <span className="font-normal text-white/45">{String(x.year ?? "")}</span></div>
          <div className="truncate font-mono text-[11px] leading-4 text-muted-foreground">{id2 || "—"}</div>
        </div>
        <div className="shrink-0 text-right">
          <div className="hq-num text-[13px] font-semibold leading-5 text-white">{amount || "\u00a0"}{amountSub && <span className="ml-1 text-[10px] font-normal text-muted-foreground">{amountSub}</span>}</div>
          <div className="text-[11px] leading-4 text-muted-foreground">{status || "—"}</div>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-white/30" />
      </button>
    </li>
  );
}

export default function KorautoPage() {
  const { feed, loading, refresh } = useKorauto();
  const now = Date.now();
  const wide = useWide();
  const kamS = useKamSession();
  const { access, error: accessError } = useKamAccess(kamS.session);
  const [open, setOpen] = useState<{ id: string; summary?: Row } | null>(null);
  const [filter, setFilter] = useState<FilterKey>("recent");
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(60);
  const [all, setAll] = useState<KamCar[] | null>(null);
  const [allErr, setAllErr] = useState<string | null>(null);
  const kamReady = !!access && access.active && access.canOpenCars;
  const listRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [areaH, setAreaH] = useState<number | null>(null);
  // Unfolded: list + detail fill the space between the stats and the bottom bar, each scrolls on its own.
  useLayoutEffect(() => {
    if (!wide) return setAreaH(null);
    const measure = () => {
      const el = gridRef.current;
      if (!el) return;
      const tb = document.querySelector(".hq-tabbar") as HTMLElement | null;
      const top = el.getBoundingClientRect().top + window.scrollY;
      setAreaH(Math.max(420, Math.floor(window.innerHeight - top - (tb?.offsetHeight ?? 64) - 8)));
    };
    measure();
    window.addEventListener("resize", measure);
    const t = setTimeout(measure, 400);
    return () => {
      window.removeEventListener("resize", measure);
      clearTimeout(t);
    };
  }, [wide, feed, allErr, access, kamS.session]);

  useEffect(() => {
    if (!kamReady || !access) {
      setAll(null);
      return;
    }
    let alive = true;
    fetchKamCars(access.isAdmin).then((r) => alive && setAll(r)).catch((e) => alive && setAllErr(String(e.message || e)));
    return () => {
      alive = false;
    };
  }, [kamReady, access]);

  const feedPool = useMemo(() => {
    const m = new Map<string, Car>();
    for (const c of [...(feed?.latest ?? []), ...(feed?.recentUpdates ?? []), ...(feed?.addedToday ?? []), ...(feed?.shipping ?? []), ...(feed?.pendingApprovals ?? []), ...(feed?.arrivingThisWeek ?? [])]) m.set(c.id, { ...(m.get(c.id) ?? {}), ...c });
    return [...m.values()];
  }, [feed]);
  const byUpdated = (a: Row, b: Row) => String((b as Car).updated_at || (b as Car).created_at || "").localeCompare(String((a as Car).updated_at || (a as Car).created_at || ""));

  const lists = useMemo(() => {
    const ids = (xs?: { id: string }[]) => new Set((xs ?? []).map((x) => x.id));
    const pool: Row[] = all ?? feedPool;
    const t = todayISO(), w = weekISO();
    const recentIds = ids([...(feed?.latest ?? []), ...(feed?.recentUpdates ?? []), ...(feed?.addedToday ?? [])]);
    const L: Partial<Record<FilterKey, Row[]>> = {
      all: [...pool].sort(byUpdated),
      recent: all ? [...all].sort(byUpdated).slice(0, 30) : feedPool.filter((c) => recentIds.has(c.id)).sort(byUpdated),
      stock: pool.filter((c) => (c as Car).status === "in_stock"),
      sales: pool.filter((c) => (c as Car).sale_status === "sales"),
      autosallon: pool.filter((c) => (c as Car).sale_status === "autosallon"),
      shipped: pool.filter((c) => (c as Car).sale_status === "shipped"),
      water: all ? all.filter((c) => c.tracking_status === "DEPARTED") : feedPool.filter((c) => ids(feed?.shipping).has(c.id)),
      arriving: all ? all.filter((c) => String(c.tracking_eta ?? "") >= t && String(c.tracking_eta ?? "") <= w) : feedPool.filter((c) => ids(feed?.arrivingThisWeek).has(c.id)),
      approval: all ? all.filter((c) => c.approval_status === "pending") : feedPool.filter((c) => ids(feed?.pendingApprovals).has(c.id)),
      balance: all && access?.isAdmin ? all.filter((c) => due(c) > 0).sort((a, b) => due(b) - due(a)) : [],
    };
    for (const k of ["water", "arriving"] as const) L[k] = [...(L[k] ?? [])].sort((a, b) => String((a as Car).tracking_eta ?? "9").localeCompare(String((b as Car).tracking_eta ?? "9")));
    return L;
  }, [all, feedPool, feed, access]);

  const st = feed?.stages ?? {}, ss = feed?.statuses ?? {}, tr = feed?.tracking ?? {};
  const n = (k: FilterKey, fallback: number) => (all ? lists[k]?.length ?? 0 : fallback);
  const stats: { key: FilterKey | "websales"; label: string; value: number | string; icon: typeof Ship; hot?: boolean }[] = [
    { key: "all", label: "Cars", value: all ? all.length : feed?.totalCars ?? "–", icon: CarFront },
    { key: "stock", label: "In stock", value: n("stock", ss.in_stock ?? 0), icon: Warehouse },
    { key: "sales", label: "In sales", value: n("sales", st.sales ?? 0), icon: Store },
    { key: "autosallon", label: "Autosallon", value: n("autosallon", st.autosallon ?? 0), icon: CarFront },
    { key: "shipped", label: "Shipped", value: n("shipped", st.shipped ?? 0), icon: Truck },
    { key: "water", label: "On the water", value: n("water", tr.DEPARTED ?? 0), icon: Ship },
    { key: "arriving", label: "Arriving ≤7d", value: n("arriving", feed?.arrivingThisWeek?.length ?? 0), icon: Ship },
    { key: "approval", label: "Approval", value: n("approval", feed?.pendingApprovals?.length ?? 0), icon: CheckCircle2 },
    { key: "balance", label: "Balance due", value: all && access?.isAdmin ? eur((lists.balance ?? []).reduce((s, c) => s + due(c), 0)) : "—", icon: Wallet },
    { key: "complaints", label: "Complaints", value: feed?.openComplaints?.length ?? 0, icon: FileWarning },
    { key: "websales", label: "Web sales", value: feed?.pendingWebsiteSales ?? 0, icon: Globe, hot: (feed?.pendingWebsiteSales ?? 0) > 0 },
    { key: "activity", label: "Activity", value: "", icon: RefreshCw },
  ];

  const events = useMemo(() => {
    const out: Ev[] = [];
    const today = feed?.todayStart || "";
    for (const c of feed?.addedToday ?? []) out.push({ at: c.created_at || "", text: `${carName(c)} ${c.year ?? ""} added`, sub: [c.plate_number, STAGE_LABEL[c.sale_status || ""] || c.sale_status].filter(Boolean).join(" · "), icon: Sparkles, carId: c.id });
    for (const c of feed?.recentUpdates ?? []) if ((c.updated_at || "") && !((c.created_at || "") >= today && (c.updated_at || "") >= today && feed?.addedToday?.some((a) => a.id === c.id))) out.push({ at: c.updated_at || "", text: `${carName(c)} ${c.year ?? ""} updated`, sub: [c.plate_number, c.tracking_status_label || STAGE_LABEL[c.sale_status || ""]].filter(Boolean).join(" · "), icon: RefreshCw, carId: c.id });
    for (const i of feed?.inspections ?? []) out.push({ at: i.created_at || "", text: `Inspection · ${carName(i)} ${i.year ?? ""}`, sub: i.status || "", icon: ClipboardCheck });
    for (const c of feed?.openComplaints ?? []) out.push({ at: c.updated_at || "", text: `Customs complaint${c.car_label ? ` · ${c.car_label}` : ""}`, sub: c.status || "", icon: FileWarning });
    for (const c of feed?.pendingApprovals ?? []) out.push({ at: c.created_at || "", text: `Awaiting approval · ${carName(c)} ${c.year ?? ""}`, icon: CheckCircle2, carId: c.id });
    const seen = new Set<string>();
    return out.filter((e) => e.at).sort((a, b) => b.at.localeCompare(a.at)).filter((e) => (seen.has(e.text + e.at) ? false : (seen.add(e.text + e.at), true))).slice(0, 30);
  }, [feed]);

  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    const base: Row[] = t ? (all ?? feedPool) : lists[filter] ?? [];
    if (!t) return base;
    const keys = ["vin", "plate_number", "make", "model", "buyer", "shipping_name", "tracking_container", "tracking_booking", "year"];
    return base.filter((c) => {
      const r = c as Record<string, unknown>;
      return keys.some((k) => String(r[k] ?? "").toLowerCase().includes(t)) || `${r.make ?? ""} ${r.model ?? ""}`.toLowerCase().includes(t);
    });
  }, [q, all, feedPool, lists, filter]);

  useEffect(() => setLimit(60), [filter, q]);

  const pick = (k: FilterKey | "websales") => {
    if (k === "websales") return window.open(KORAUTO_URL, "_blank", "noopener,noreferrer");
    setFilter(k);
    setQ("");
    if (!wide) requestAnimationFrame(() => listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };
  const openCar = (c: Row) => setOpen({ id: c.id, summary: c });
  const openById = (id: string) => {
    const c = (all ?? feedPool).find((x) => x.id === id);
    setOpen({ id, summary: c });
  };

  if (feed && !feed.configured) return <main className="mx-auto max-w-[1100px] px-3 pb-12 pt-4"><ConnectState missing={feed.missing} /></main>;

  const activeLabel = q.trim() ? `Search · ${q.trim()}` : FILTER_LABEL[filter];
  const feedOnly = !all && !q.trim() && !["recent", "activity", "complaints"].includes(filter);
  const expected = stats.find((s) => s.key === filter)?.value;

  const detail = open ? (
    <CarDetail
      key={open.id}
      variant={wide ? "pane" : "sheet"}
      carId={open.id}
      summary={open.summary}
      session={kamS.session}
      access={access}
      accessError={accessError}
      onSignIn={kamS.signIn}
      onSignOut={kamS.signOut}
      onClose={() => setOpen(null)}
      onSaved={(c) => setAll((xs) => (xs ? xs.map((x) => (x.id === c.id ? c : x)) : xs))}
    />
  ) : null;

  return (
    <main className="korauto-page mx-auto w-full max-w-[1100px] pb-4 pt-1" style={{ paddingLeft: "max(12px, var(--sal))", paddingRight: "max(12px, var(--sar))" }} data-testid="korauto-page">
      <h1 className="sr-only">KORAUTO Manager</h1>
      <div className="flex items-center gap-2">
        <p className="min-w-0 flex-1 truncate text-[12px] text-muted-foreground">
          {feed?.generatedAt ? `Updated ${ago(feed.generatedAt, now)}` : loading ? "Loading…" : "—"}{feed?.stale ? " · cached" : ""}
          {kamS.session && access ? ` · ${access.email} (${access.role})` : ""}
        </p>
        {kamS.session && <button type="button" onClick={kamS.signOut} className="hq-chip press !min-h-9 !px-2.5" aria-label="Sign out of KorAuto Manager"><LogOut className="h-3.5 w-3.5" /></button>}
        <button onClick={refresh} className="hq-chip press !min-h-9 !px-2.5" aria-label="Refresh"><RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /></button>
        <a href={KORAUTO_URL} target="_blank" rel="noopener noreferrer" className="hq-chip press !min-h-9 !px-2.5" aria-label="Open KorAuto Manager"><ArrowUpRight className="h-3.5 w-3.5" /></a>
      </div>

      {feed?.error && <div className="mt-2 rounded-xl bg-[hsl(var(--destructive)/.12)] px-3 py-2 text-[13px] text-[hsl(var(--destructive))]">Couldn’t read KORAUTO ({feed.error}).</div>}
      {allErr && <div className="mt-2 rounded-xl bg-[hsl(var(--destructive)/.12)] px-3 py-2 text-[13px] text-[hsl(var(--destructive))]">KorAuto Manager: {allErr}</div>}

      <section className="mt-1.5 grid grid-cols-4 gap-1 min-[700px]:grid-cols-6 min-[700px]:gap-1.5" data-testid="korauto-stats">
        {stats.map((s) => {
          const on = s.key === filter && !q.trim();
          const Icon = s.icon;
          return (
            <button key={s.key} type="button" onClick={() => pick(s.key)} aria-pressed={on} data-testid={`korauto-stat-${s.key}`}
              className={`press min-w-0 rounded-xl px-2 py-1.5 text-left transition-colors min-[700px]:px-2.5 ${on ? "bg-foreground text-background" : "bg-foreground/[0.06] text-foreground"}`}>
              <div className={`flex items-center gap-1 truncate text-[11px] leading-4 ${on ? "text-background/70" : "text-muted-foreground"}`}><Icon className="hidden h-3 w-3 shrink-0 min-[700px]:block" /> <span className="truncate">{s.label}</span>{s.hot && !on ? <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-current" /> : null}</div>
              <div className="hq-num truncate text-[16px] font-bold leading-5 min-[700px]:text-[18px] min-[700px]:leading-6">{s.value === "" ? <ChevronRight className="h-4 w-4" /> : s.value}</div>
            </button>
          );
        })}
      </section>

      <div ref={gridRef} className={`mt-2 ${wide ? "grid grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] gap-2" : ""}`} style={wide && areaH ? { height: areaH } : undefined}>
        <div ref={listRef} className={`hq-card min-w-0 overflow-hidden !rounded-[18px] p-0 ${wide ? "flex min-h-0 flex-col" : ""}`} style={{ scrollMarginTop: "calc(var(--hub-h, 56px) + 8px)" }} data-testid="korauto-list">
          <div className="sticky top-0 z-[1] shrink-0 space-y-2 border-b border-white/10 bg-background/80 px-3 pb-2 pt-2.5 backdrop-blur">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input className="hq-field !min-h-10 w-full rounded-xl pl-9 pr-3 text-[16px]" placeholder={all ? `Search ${all.length} cars` : "Search VIN, plate, make…"} value={q} onChange={(e) => setQ(e.target.value)} data-testid="korauto-search" />
            </label>
            <div className="no-scrollbar -mx-3 flex gap-1 overflow-x-auto px-3">
              {CHIPS.map((k) => (
                <button key={k} type="button" onClick={() => pick(k)} aria-pressed={filter === k && !q.trim()}
                  className={`press shrink-0 rounded-full px-2.5 py-1 text-[12px] ${filter === k && !q.trim() ? "bg-foreground font-semibold text-background" : "bg-foreground/[0.06] text-foreground/75"}`}>
                  {FILTER_LABEL[k]}
                </button>
              ))}
            </div>
            <div className="flex items-baseline justify-between text-[12px]">
              <span className="font-semibold text-white" data-testid="korauto-list-title">{activeLabel}</span>
              <span className="text-muted-foreground">{filter === "activity" && !q.trim() ? events.length : filter === "complaints" && !q.trim() ? feed?.openComplaints?.length ?? 0 : shown.length}{feedOnly && typeof expected === "number" && expected > shown.length ? ` of ${expected}` : ""}</span>
            </div>
          </div>

          {!kamS.session && (feedOnly || filter === "balance") && (
            <button type="button" onClick={() => setOpen({ id: shown[0]?.id ?? feedPool[0]?.id ?? "" , summary: shown[0] ?? feedPool[0] })} disabled={!feedPool.length}
              className="press flex w-full shrink-0 items-center gap-2 border-b border-white/10 px-3 py-2 text-left text-[12px] text-muted-foreground">
              <KeyRound className="h-3.5 w-3.5 shrink-0" /> {filter === "balance" ? "Balance due needs a KorAuto Manager admin sign-in — tap to sign in." : "Showing the cars in the read-only feed. Sign in to KorAuto Manager to list every car."}
            </button>
          )}

          {filter === "activity" && !q.trim() ? (
            <ul className={`divide-y divide-white/[0.07] ${wide ? "min-h-0 flex-1 overflow-y-auto" : ""}`} data-testid="korauto-activity">
              {events.map((e, i) => {
                const Icon = e.icon;
                return (
                  <li key={i}>
                    <button type="button" disabled={!e.carId} onClick={() => e.carId && openById(e.carId)} className="press flex min-h-[48px] w-full items-center gap-2.5 px-3 py-1.5 text-left disabled:opacity-100">
                      <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1"><div className="truncate text-[13px] text-white">{e.text}</div>{e.sub && <div className="truncate text-[11px] text-muted-foreground">{e.sub}</div>}</div>
                      <span className="shrink-0 text-[11px] text-muted-foreground">{ago(e.at, now)}</span>
                    </button>
                  </li>
                );
              })}
              {!events.length && <li className="py-6 text-center text-[13px] text-muted-foreground">No recent activity</li>}
            </ul>
          ) : filter === "complaints" && !q.trim() ? (
            <ul className={`divide-y divide-white/[0.07] ${wide ? "min-h-0 flex-1 overflow-y-auto" : ""}`}>
              {(feed?.openComplaints ?? []).map((c) => (
                <li key={c.id}>
                  <a href={`${KORAUTO_URL}/customs`} target="_blank" rel="noopener noreferrer" className="press flex min-h-[48px] items-center gap-2.5 px-3 py-1.5">
                    <FileWarning className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1"><div className="truncate text-[13px] text-white">{c.car_label || "Customs complaint"}</div><div className="truncate text-[11px] text-muted-foreground">{c.status || ""}</div></div>
                    <span className="shrink-0 text-[11px] text-muted-foreground">{ago(c.updated_at, now)}</span>
                  </a>
                </li>
              ))}
              {!(feed?.openComplaints ?? []).length && <li className="py-6 text-center text-[13px] text-muted-foreground">No open complaints</li>}
            </ul>
          ) : (
            <ul className={`divide-y divide-white/[0.07] ${wide ? "min-h-0 flex-1 overflow-y-auto" : ""}`} data-testid="korauto-rows">
              {shown.slice(0, limit).map((c) => <CarRow key={c.id} r={c} filter={filter} active={open?.id === c.id} onOpen={() => openCar(c)} />)}
              {!feed && !all && [0, 1, 2, 3, 4].map((i) => <li key={i} className="hq-shimmer h-[52px]" />)}
              {(feed || all) && !shown.length && <li className="py-6 text-center text-[13px] text-muted-foreground">{q.trim() && !all ? "No match in the feed — sign in to search every car" : "No cars here"}</li>}
              {shown.length > limit && <li><button type="button" className="press w-full py-3 text-[13px] font-semibold" onClick={() => setLimit((l) => l + 60)}>Show more ({shown.length - limit})</button></li>}
            </ul>
          )}
        </div>

        {wide && (
          <div className="min-h-0 min-w-0" data-testid="korauto-pane">
            {detail ?? (
              <div className="hq-card flex h-full flex-col items-center justify-center !rounded-[18px] p-6 text-center">
                <CarFront className="h-7 w-7 text-white/30" />
                <p className="mt-2 text-[14px] font-semibold text-white">Select a car</p>
                <p className="mt-1 max-w-[260px] text-[12px] text-muted-foreground">Tap a row to see every KorAuto Manager field here and edit with your own login.</p>
              </div>
            )}
          </div>
        )}
      </div>
      {!wide && detail}
    </main>
  );
}
