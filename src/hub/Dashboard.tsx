import { Link, useNavigate } from "react-router-dom";
import { FN_BASE } from "@/lib/fn";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ChevronRight,
  CarFront,
  Globe2,
  Activity,
  Newspaper,
  Plane,
  BookMarked,
  Link2,
  Plus,
  Sparkles,
  Clock3,
  ShieldAlert,
  Ship,
  FileWarning,
  CheckCircle2,
  RefreshCw,
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudFog,
  Camera,
  Cctv,
  Tv,
  Play,
  Star,
  Link2 as LinkIcon,
  Search,
} from "lucide-react";
import { EditableGrid, type CardDef } from "./EditableGrid";
import { extraWidgets } from "./ExtraWidgets";
import { useFavs, useHistory } from "@/tv/api";
import { ago as camAgo, camLabel, type FEvent, type Status as CamStatus, useAuthedBlob, useFrigate } from "@/cameras/frigate";
import { AlfredOpen } from "@/lib/alfred";
import { usePoll } from "@/wi/api";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./auth";
import { KORAUTO_URL } from "./AppShell";
import { carName, useKorauto, type Car } from "@/korauto/feed";
import { ago, fmtDate, fmtTime, greeting, useNow } from "./clock";

/* ---------------------------------------------------------------- primitives */

type CardProps = {
  className?: string | undefined;
  tint?: keyof typeof TINTS | undefined;
  children: ReactNode;
  to?: "/world" | "/travel" | "/cameras" | "/" | "/korauto" | "/korautoks" | "/tv" | undefined;
  hash?: string | undefined;
  href?: string | undefined;
  delay?: number | undefined;
};

const TINTS = {
  blue: "--primary", orange: "--orange", red: "--destructive", indigo: "--indigo", teal: "--teal",
  purple: "--purple", cyan: "--cyan", green: "--success", pink: "--pink", slate: "--slate", amber: "--warning",
} as const;

function Card({
  className = "",
  tint = "blue",
  children,
  to,
  hash,
  href,
  delay = 0,
}: CardProps) {
  const style = {
    ["--tint-c" as any]: `var(${TINTS[tint]})`,
    animationDelay: `${delay}ms`,
  };
  const cls = `hq-card hq-rise flex h-full flex-col p-4 sm:p-5 ${className}`;
  if (href)
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cls}
        style={style}
      >
        {children}
      </a>
    );
  if (to)
    return (
      <Link to={hash ? { pathname: to, hash: `#${hash}` } : to} className={cls} style={style}>
        {children}
      </Link>
    );
  return (
    <div className={cls} style={style}>
      {children}
    </div>
  );
}

function CardHead({
  icon,
  label,
  right,
}: {
  icon: ReactNode;
  label: string;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-2">
        <span className="hq-ico">{icon}</span>
        <span className="t-footnote truncate font-semibold">{label}</span>
      </div>
      {right ?? <ChevronRight className="hq-chev h-4 w-4 shrink-0" />}
    </div>
  );
}

const LEVEL_COLOR: Record<string, string> = {
  CRITICAL: "hsl(var(--destructive))",
  HIGH: "hsl(var(--orange))",
  ELEVATED: "hsl(var(--warning))",
  GUARDED: "hsl(var(--success))",
};
const levelOf = (i: number) =>
  i >= 75 ? "CRITICAL" : i >= 50 ? "HIGH" : i >= 25 ? "ELEVATED" : "GUARDED";

/* ---------------------------------------------------------------- hero */

function weatherIcon(code?: number) {
  if (code == null) return Cloud;
  if (code === 0 || code === 1) return Sun;
  if (code === 45 || code === 48) return CloudFog;
  if (code >= 95) return CloudLightning;
  if ((code >= 71 && code <= 77) || code === 85 || code === 86)
    return CloudSnow;
  if (code >= 51) return CloudRain;
  return Cloud;
}

function useWeather() {
  const [w, setW] = useState<{
    t: number;
    code: number;
    hi: number;
    lo: number;
  } | null>(null);
  useEffect(() => {
    let alive = true;
    const load = () =>
      fetch(
        "https://api.open-meteo.com/v1/forecast?latitude=42.6629&longitude=21.1655&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=Europe%2FBelgrade&forecast_days=1",
      )
        .then((r) => (r.ok ? r.json() : null))
        .then((j) => {
          if (alive && j?.current)
            setW({
              t: j.current.temperature_2m,
              code: j.current.weather_code,
              hi: j.daily?.temperature_2m_max?.[0],
              lo: j.daily?.temperature_2m_min?.[0],
            });
        })
        .catch(() => {});
    load();
    const id = setInterval(load, 30 * 60e3);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);
  return w;
}

function HeroCard() {
  const now = useNow(1000);
  const { user } = useAuth();
  const w = useWeather();
  const WIcon = weatherIcon(w?.code);
  const name = (user?.user_metadata as any)?.name?.split(" ")[0] || "Robert";
  const seoul = fmtTime(now, "Asia/Seoul");
  return (
    <Card
      className="col-span-2 justify-between"
      tint="blue"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="t-subhead text-muted-foreground">{greeting(now)}</p>
          <h1 className="mt-0.5 truncate text-[28px] font-bold leading-8 tracking-tight text-white sm:text-3xl">
            {name}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            {fmtDate(now)}
          </p>
        </div>
        <div className="hq-stat flex items-center gap-2">
          <WIcon className="h-5 w-5 text-[hsl(var(--orange))]" />
          <div className="leading-tight">
            <div className="hq-num text-sm text-white">
              {w ? `${Math.round(w.t)}°` : "—"}
            </div>
            <div className="text-[11px] text-muted-foreground">
              Prishtina
              {w?.hi != null
                ? ` · ${Math.round(w.hi)}°/${Math.round(w.lo)}°`
                : ""}
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="hq-num text-4xl font-medium leading-none tracking-tight text-white sm:text-5xl">
            {fmtTime(now, "Europe/Belgrade", false)}
            <span className="ml-1 text-lg text-white/55 sm:text-xl">
              {String(now.getSeconds()).padStart(2, "0")}
            </span>
          </div>
          <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Clock3 className="h-3 w-3" /> Kosovo time
          </div>
        </div>
        <div className="text-right text-[11px] leading-5 text-muted-foreground">
          <div>
            Seoul{" "}
            <span className="hq-num text-white/80">{seoul}</span>
          </div>
          <div>
            New York{" "}
            <span className="hq-num text-white/80">
              {fmtTime(now, "America/New_York")}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ---------------------------------------------------------------- KORAUTO */


function KorautoCard() {
  const { feed, loading, refresh } = useKorauto();
  const now = Date.now();
  const configured = feed?.configured;
  const added = feed?.addedToday ?? [];
  const latest = feed?.latest ?? [];
  const todayStart = feed?.todayStart;
  const stats = [
    {
      k: "Added today",
      v: added.length,
      icon: Sparkles,
      hot: added.length > 0,
    },
    {
      k: "Pending approval",
      v: feed?.pendingApprovals?.length ?? 0,
      icon: CheckCircle2,
      hot: (feed?.pendingApprovals?.length ?? 0) > 0,
    },
    {
      k: "Arriving ≤7d",
      v: feed?.arrivingThisWeek?.length ?? 0,
      icon: Ship,
      hot: false,
    },
    {
      k: "Open complaints",
      v: feed?.openComplaints?.length ?? 0,
      icon: FileWarning,
      hot: false,
    },
  ];

  return (
    <Card
      to="/korauto"
      className="col-span-2 row-span-2"
      tint="orange"
      delay={60}
    >
      <CardHead
        icon={<CarFront className="h-4 w-4" />}
        label="KORAUTO Manager"
        right={
          <span className="flex items-center gap-1 text-[13px] text-muted-foreground">
            {configured && !feed?.error && (
              <span className="hq-live-dot h-1.5 w-1.5 rounded-full bg-[hsl(var(--success))]" />
            )}
            Open <ChevronRight className="h-4 w-4" />
          </span>
        }
      />

      {feed && !configured ? (
        <div className="flex flex-1 flex-col justify-between">
          <div className="mt-4">
            <h3 className="t-title2 text-white">
              Your car business, one tap away
            </h3>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Stock, shipping and activity from KORAUTO Manager, read-only.
              Connect it once by adding the read-only KORAUTO login in
              Lovable Secrets.
            </p>
          </div>
          <div className="mt-4 hq-btn w-fit">
            Connect KORAUTO <ChevronRight className="h-4 w-4" />
          </div>
        </div>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {stats.map((s) => (
              <div
                key={s.k}
                className="hq-stat" data-hot={s.hot}
              >
                <div
                  className="hq-num text-[22px] font-bold leading-7 text-white sm:text-2xl"
                >
                  {loading && !feed ? "–" : s.v}
                </div>
                <div className="mt-0.5 line-clamp-2 text-[11px] leading-tight text-muted-foreground sm:text-[11px]">
                  {s.k}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="t-footnote font-medium text-muted-foreground">
              {added.length ? "New today" : "Latest cars"}
            </span>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                refresh();
              }}
              className="flex items-center gap-1 rounded-full px-2 py-1 text-[11px] text-white/55 hover:bg-white/5 hover:text-white"
              aria-label="Refresh KORAUTO feed"
            >
              <RefreshCw
                className={`h-3 w-3 ${loading ? "animate-spin" : ""}`}
              />
              {feed?.generatedAt ? ago(feed.generatedAt, now) : ""}
            </button>
          </div>
          <ul className="no-scrollbar hq-group mt-2 min-h-0 flex-1 overflow-y-auto">
            {(added.length ? added : latest).slice(0, 5).map((c) => {
              const isNew = !!(
                todayStart &&
                c.created_at &&
                c.created_at >= todayStart
              );
              return (
                <li
                  key={c.id}
                  className="hq-row !min-h-[56px] !py-1.5"
                >
                  <div className="h-10 w-14 shrink-0 overflow-hidden rounded-[10px] bg-white/5">
                    {c.image_url ? (
                      <img
                        src={c.image_url}
                        alt=""
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <CarFront className="m-auto mt-2.5 h-5 w-5 text-white/55" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-white">
                      {carName(c)}{" "}
                      <span className="text-white/45">{c.year ?? ""}</span>
                    </div>
                    <div className="truncate text-[11px] text-muted-foreground">
                      {[c.plate_number, c.sale_status, c.tracking_status_label]
                        .filter(Boolean)
                        .join(" · ") || "—"}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    {isNew && (
                      <div className="hq-pill-new mb-0.5">
                        New
                      </div>
                    )}
                    <div className="text-[11px] text-white/55">
                      {ago(c.created_at, now)}
                    </div>
                  </div>
                </li>
              );
            })}
            {feed && !feed.error && !latest.length && !added.length && (
              <li className="py-6 text-center text-sm text-muted-foreground">
                No cars yet
              </li>
            )}
            {feed?.error && !latest.length && (
              <li className="p-3 text-xs text-[hsl(var(--destructive))]">
                Couldn’t read KORAUTO right now ({feed.error}). Tap for details.
              </li>
            )}
            {!feed &&
              loading &&
              [0, 1, 2].map((i) => (
                <li
                  key={i}
                  className="hq-shimmer h-[56px]"
                />
              ))}
          </ul>
          {(feed?.updatedToday?.length ?? 0) > 0 && (
            <div className="mt-2 truncate text-[11px] text-muted-foreground">
              Updated today:{" "}
              {feed!.updatedToday!.slice(0, 3).map(carName).join(", ")}
              {feed!.updatedToday!.length > 3
                ? ` +${feed!.updatedToday!.length - 3}`
                : ""}
            </div>
          )}
        </>
      )}
    </Card>
  );
}

/* ---------------------------------------------------------------- world */

function ThreatCard() {
  const threat = usePoll("/api/threat", 5 * 60e3);
  const d: any = threat.data;
  const g = d?.global ?? null;
  const lvl = g != null ? levelOf(g) : null;
  const top = (d?.countries || []).slice(0, 3);
  const pct = g != null ? Math.min(100, Math.max(0, g)) : 0;
  return (
    <Card
      to="/world"
      className="col-span-1"
      tint={lvl === "CRITICAL" ? "red" : lvl === "HIGH" ? "orange" : lvl === "ELEVATED" ? "amber" : "green"}
      delay={120}
    >
      <CardHead icon={<Activity className="h-4 w-4" />} label="World threat" />
      <div className="mt-auto flex items-end justify-between gap-2">
        <div>
          <div className="hq-big text-white">
            {g ?? "—"}
          </div>
          <div
            className="mt-1 text-[12px] font-semibold"
            style={{ color: lvl ? LEVEL_COLOR[lvl] : undefined }}
          >
            {lvl ?? (threat.loading ? "Loading…" : "No data yet")}
          </div>
        </div>
        <svg viewBox="0 0 36 36" className="hq-ring h-14 w-14 -rotate-90">
          <circle
            cx="18"
            cy="18"
            r="15"
            fill="none"
            stroke="hsl(var(--foreground) / .1)"
            strokeWidth="4"
          />
          <circle
            cx="18"
            cy="18"
            r="15"
            fill="none"
            stroke={lvl ? LEVEL_COLOR[lvl] : "hsl(var(--primary))"}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${(pct / 100) * 94.2} 94.2`}
          />
        </svg>
      </div>
      <div className="mt-2 truncate text-[11px] text-muted-foreground">
        {top.length
          ? top.map((c: any) => c.name || c.country).join(" · ")
          : "GDELT + GDACS, 24h"}
      </div>
    </Card>
  );
}

function HazardsCard() {
  const q = usePoll("/api/quakes", 5 * 60e3);
  const items: any[] = (q.data as any)?.items || [];
  const strong = items.filter((i) => (i.mag ?? 0) >= 4.5);
  const biggest = [...items].sort((a, b) => (b.mag ?? 0) - (a.mag ?? 0))[0];
  return (
    <Card
      to="/world"
      className="col-span-1"
      tint="orange"
      delay={160}
    >
      <CardHead
        icon={<ShieldAlert className="h-4 w-4" />}
        label="Earthquakes"
      />
      <div className="mt-auto">
        <div className="hq-big text-white">
          {q.data ? strong.length : "—"}
        </div>
        <div className="mt-1 text-[11px] text-muted-foreground">
          M4.5+ in 24h
        </div>
      </div>
      <div className="mt-2 line-clamp-2 text-[11px] text-white/70">
        {biggest ? (
          <>
            <span className="hq-num font-semibold text-[hsl(var(--orange))]">
              M{Number(biggest.mag).toFixed(1)}
            </span>{" "}
            {String(biggest.title || "").replace(/^M\s?[\d.]+\s*-\s*/, "")}
          </>
        ) : q.loading ? (
          "Loading USGS…"
        ) : (
          "USGS feed"
        )}
      </div>
    </Card>
  );
}

function HeadlinesCard() {
  const n = usePoll("/api/news?scope=world", 10 * 60e3);
  const items: any[] = ((n.data as any)?.items || []).slice(0, 6);
  const now = Date.now();
  return (
    <Card
      className="col-span-2 row-span-2"
      tint="indigo"
      delay={200}
    >
      <CardHead
        icon={<Newspaper className="h-4 w-4" />}
        label="World headlines"
        right={
          <Link
            to={{ pathname: "/world", hash: "#news" }}
            className="flex items-center gap-0.5 rounded-full px-2 py-1 text-[13px] text-muted-foreground"
          >
            All news <ChevronRight className="h-4 w-4" />
          </Link>
        }
      />
      <ul className="no-scrollbar mt-3 min-h-0 flex-1 hq-group overflow-y-auto">
        {items.map((it, i) => (
          <li key={it.url || i}>
            <a
              href={it.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group hq-row !block !py-2.5"
            >
              <div className="line-clamp-2 text-[14px] font-medium leading-snug text-white">
                {it.title}
              </div>
              <div className="mt-1 flex items-center gap-2 text-[12px] text-muted-foreground">
                <span className="truncate">
                  {it.source || it.feed || it.domain || "News"}
                </span>
                <span className="opacity-50">·</span>
                <span className="shrink-0">{ago(it.time, now)}</span>
              </div>
            </a>
          </li>
        ))}
        {!items.length &&
          (n.loading ? (
            [0, 1, 2, 3].map((i) => (
              <li
                key={i}
                className="hq-shimmer h-12"
              />
            ))
          ) : (
            <li className="py-8 text-center text-sm text-muted-foreground">
              Headlines appear after the first refresh
            </li>
          ))}
      </ul>
    </Card>
  );
}

/* ---------------------------------------------------------------- travel */

const TOTAL_COUNTRIES = 197;

function useTravelSummary() {
  const { user } = useAuth();
  const [s, setS] = useState<{
    visited: string[];
    passport: string;
    trips: any[];
    bucket: string[];
  } | null>(null);
  const [meta, setMeta] = useState<{
    continents: number;
    passportName?: string | undefined;
    flag?: string | undefined;
    rank?: number | undefined;
    vf?: number | undefined;
  } | null>(null);
  useEffect(() => {
    if (!user) return;
    (supabase as any)
      .from("user_travel_data")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }: { data: any }) => {
        const d: any = data || {};
        setS({
          visited: d.visited_countries || [],
          passport: d.passport_code || "XK",
          trips: Array.isArray(d.trips) ? d.trips : [],
          bucket: d.bucket_list || [],
        });
      });
  }, [user]);
  useEffect(() => {
    if (!s) return;
    import("@/travel/data/countries").then(({ countries }) => {
      const conts = new Set(
        countries
          .filter((c) => s.visited.includes(c.code))
          .map((c) => c.continent),
      );
      const p = countries.find((c) => c.code === s.passport);
      setMeta({
        continents: conts.size,
        passportName: p?.name,
        flag: p?.flagEmoji,
        rank: p?.passportRank,
        vf: p?.visaFreeDestinations,
      });
    });
  }, [s]);
  return { s, meta };
}

function TravelCard({ s, meta }: ReturnType<typeof useTravelSummary>) {
  const count = s?.visited.length ?? 0;
  const pct = Math.round((count / TOTAL_COUNTRIES) * 100);
  const upcoming = useMemo(() => {
    const now = Date.now();
    return (s?.trips || [])
      .filter((t) => t?.startDate && new Date(t.startDate).getTime() > now)
      .sort((a, b) => +new Date(a.startDate) - +new Date(b.startDate))[0];
  }, [s]);
  return (
    <Card
      to="/travel"
      className="col-span-1"
      tint="teal"
      delay={240}
    >
      <CardHead icon={<Plane className="h-4 w-4" />} label="Travel" />
      <div className="mt-auto">
        <div className="flex items-baseline gap-1">
          <span className="hq-big text-white">
            {s ? count : "—"}
          </span>
          <span className="t-footnote text-muted-foreground">
            / {TOTAL_COUNTRIES}
          </span>
        </div>
        <div className="hq-bar mt-2.5">
          <i style={{ transform: `scaleX(${Math.max(0.02, pct / 100)})` }} />
        </div>
      </div>
      <div className="mt-2 truncate text-[11px] text-muted-foreground">
        {upcoming
          ? `Next: ${upcoming.countryName || upcoming.countryCode}`
          : `${pct}% of the world · ${meta?.continents ?? 0} continents`}
      </div>
    </Card>
  );
}

function PassportCard({ s, meta }: ReturnType<typeof useTravelSummary>) {
  return (
    <Card
      to="/travel"
      hash="passport"
      className="col-span-1"
      tint="purple"
      delay={280}
    >
      <CardHead icon={<BookMarked className="h-4 w-4" />} label="Passport" />
      <div className="mt-auto flex items-end justify-between gap-2">
        <div className="min-w-0">
          <div className="hq-big text-white">
            {meta?.vf ?? "—"}
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            visa-free destinations
          </div>
        </div>
        {(s?.passport || "XK") && (
          <img
            src={`https://flagcdn.com/w160/${(s?.passport || "XK").toLowerCase()}.png`}
            alt=""
            className="h-9 w-auto rounded-md ring-1 ring-black/10 dark:ring-white/15"
          />
        )}
      </div>
      <div className="mt-2 truncate text-[11px] text-muted-foreground">
        {meta?.passportName ?? s?.passport ?? "Kosovo"}
        {meta?.rank ? ` · rank #${meta.rank}` : ""}
      </div>
    </Card>
  );
}

/* ---------------------------------------------------------------- links & slots */

const LINKS = [
  { label: "KORAUTO Manager", href: KORAUTO_URL, sub: "korautomanager.biz" },
  {
    label: "KORAUTO website",
    href: "https://korautoks.com",
    sub: "korautoks.com",
  },
  { label: "Lovable", href: "https://lovable.dev/projects", sub: "Projects" },
  { label: "Gmail", href: "https://mail.google.com", sub: "Inbox" },
];

function LinksCard() {
  return (
    <Card className="col-span-1" tint="slate" delay={320}>
      <CardHead
        icon={<Link2 className="h-4 w-4" />}
        label="Quick links"
        right={<span />}
      />
      <ul className="hq-links mt-2 flex min-h-0 flex-1 flex-col justify-end">
        {LINKS.map((l) => (
          <li key={l.href}>
            <a
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              className="press text-white"
            >
              <span className="truncate">{l.label}</span>
              <ChevronRight className="hq-chev h-3.5 w-3.5 shrink-0" />
            </a>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function FutureSlot({ delay = 0 }: { delay?: number }) {
  return (
    <div
      className="hq-rise col-span-1 flex h-full flex-col items-center justify-center gap-2 rounded-[26px] border border-dashed border-white/20 p-4 text-center"
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.04] text-white/55">
        <Plus className="h-4 w-4" />
      </span>
      <div className="text-[13px] font-medium text-white/60">Next project</div>
      <div className="text-[11px] text-white/55">Reserved slot</div>
    </div>
  );
}

function WorldTileCard() {
  return (
    <Card
      to="/world"
      className="col-span-1"
      tint="cyan"
      delay={340}
    >
      <CardHead icon={<Globe2 className="h-4 w-4" />} label="World News" />
      <div className="relative mt-auto">
        <div className="pointer-events-none absolute -bottom-8 -right-6 h-28 w-28 rounded-full bg-[radial-gradient(circle_at_35%_35%,hsl(var(--cyan)/0.4),transparent_62%)]" />
        <div className="relative text-[17px] font-semibold leading-snug tracking-tight text-white">
          Globe, news, TV & markets
        </div>
      </div>
      <div className="relative mt-2 text-[11px] text-muted-foreground">
        World Intel
      </div>
    </Card>
  );
}


/* ---------------------------------------------------------------- cameras */

function CamerasCard() {
  const st = useFrigate<CamStatus>("status", 30000);
  const s = st.data;
  const ok = !!s && s.configured && s.reachable;
  const ev = useFrigate<{ items: FEvent[] }>(ok ? "events?limit=1" : null, 30000);
  const last = ev.data?.items?.[0];
  const thumb = useAuthedBlob(last ? `event/${last.id}/thumb` : null);
  const active = ok ? s.cameras.filter((c) => c.enabled) : [];
  const online = active.filter((c) => c.online).length;
  return (
    <Card to="/cameras" className="col-span-1" tint="green" delay={380}>
      <CardHead
        icon={<Cctv className="h-4 w-4" />}
        label="Cameras"
        right={
          ok ? (
            <span className={`h-2 w-2 rounded-full ${online ? "hq-live-dot bg-[hsl(var(--success))]" : "bg-[hsl(var(--destructive))]"}`} />
          ) : undefined
        }
      />
      <div className="mt-auto flex items-end justify-between gap-2">
        <div className="min-w-0">
          <div className="hq-big text-white">
            {ok ? (
              <>
                {online}
                <span className="text-xl font-medium text-white/55">/{active.length}</span>
              </>
            ) : (
              "—"
            )}
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            {!s ? "connecting…" : !s.configured ? "setup needed" : !s.reachable ? "Frigate offline" : "cameras online"}
          </div>
        </div>
        {thumb.url && (
          <img loading="lazy" decoding="async" src={thumb.url} alt="" className="h-12 w-16 rounded-lg object-cover" />
        )}
      </div>
      <div className="mt-2 truncate text-[11px] text-muted-foreground">
        {last
          ? `${camLabel(last.subLabel ?? last.label)} · ${camLabel(last.camera)} · ${camAgo(last.start)}`
          : ok
            ? "No recent detections"
            : "Frigate NVR · live view & events"}
      </div>
    </Card>
  );
}

/* ---------------------------------------------------------------- alfred */

function AlfredCard() {
  return (
    <div className="hq-card hq-rise flex h-full flex-col p-4 sm:p-5" style={{ ["--tint-c" as any]: "var(--slate)" }} data-testid="alfred-card">
      <CardHead icon={<Camera className="h-4 w-4" />} label="AlfredCamera" right={<span className="h-4 w-4 shrink-0" />} />
      <div className="mt-auto">
        <div className="t-footnote text-muted-foreground">Log in with your Alfred account</div>
        <div className="mt-2">
          <AlfredOpen />
        </div>
      </div>
    </div>
  );
}


/* ---------------------------------------------------------------- tv */

function TvCard() {
  const { favs } = useFavs();
  const { hist } = useHistory();
  const live = favs.filter((f) => f.kind === "live");
  const quick = (live.length ? live : hist.filter((h) => h.kind === "live")).slice(0, 6);
  return (
    <Card className="col-span-1" tint="pink" delay={400}>
      <Link to="/tv" className="block">
        <CardHead icon={<Tv className="h-4 w-4" />} label="TV" />
      </Link>
      {quick.length ? (
        <ul className="mt-auto grid grid-cols-3 gap-1.5">
          {quick.map((f) => (
            <li key={f.id}>
              <Link
                to={`/tv?play=live:${f.id}`}
                title={`Play ${f.name}`}
                className="group press relative flex aspect-video items-center justify-center overflow-hidden rounded-xl bg-white/[0.07]"
              >
                {f.logo ? (
                  <img src={f.logo} alt={f.name} loading="lazy" referrerPolicy="no-referrer" className="h-full w-full object-contain p-1" />
                ) : (
                  <span className="truncate px-1 text-[11px] text-white/70">{f.name}</span>
                )}
                <Play className="absolute h-4 w-4 fill-white text-white opacity-0 drop-shadow transition group-hover:opacity-100" />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-auto">
          <div className="text-[17px] font-semibold leading-snug tracking-tight text-white">Live TV, movies & series</div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
            <Star className="h-3 w-3" /> Star channels to quick-play here
          </div>
        </div>
      )}
      <div className="mt-2 truncate text-[11px] text-muted-foreground">
        {live.length ? `${live.length} favorite${live.length > 1 ? "s" : ""}` : quick.length ? "Recently watched" : "Open TV"}
      </div>
    </Card>
  );
}

/* ---------------------------------------------------------------- korautoks.com lookup */

function KorautoksCard() {
  const nav = useNavigate();
  const [q, setQ] = useState("");
  return (
    <div className="hq-card hq-rise flex h-full flex-col p-4 sm:p-5" data-testid="kks-card">
      <Link to="/korautoks" className="block">
        <CardHead icon={<Search className="h-4 w-4" />} label="korautoks.com" />
      </Link>
      <div className="mt-auto">
        <div className="text-[17px] font-semibold leading-snug tracking-tight text-white">Find a car</div>
        <form
          className="mt-2 flex gap-1.5"
          onSubmit={(e) => {
            e.preventDefault();
            const v = q.trim();
            nav(v ? `/korautoks?q=${encodeURIComponent(v)}` : "/korautoks");
          }}
        >
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="VIN, lot or plate"
            aria-label="Search korautoks.com"
            className="h-9 min-w-0 flex-1 rounded-full bg-white/[0.07] px-3.5 text-[16px] text-white placeholder:text-white/55 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/.4)]"
          />
          <button className="hq-btn shrink-0" aria-label="Search">Go</button>
        </form>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- page */

export function Dashboard() {
  const travel = useTravelSummary();
  const defs: CardDef[] = [
    { id: "hero", label: "Clock & weather", icon: <Clock3 className="h-4 w-4" />, size: "M", render: () => <HeroCard /> },
    { id: "korauto", label: "KORAUTO", icon: <CarFront className="h-4 w-4" />, size: "L", render: () => <KorautoCard /> },
    { id: "threat", label: "World threat", icon: <Activity className="h-4 w-4" />, size: "S", render: () => <ThreatCard /> },
    { id: "hazards", label: "Earthquakes", icon: <ShieldAlert className="h-4 w-4" />, size: "S", render: () => <HazardsCard /> },
    { id: "headlines", label: "World headlines", icon: <Newspaper className="h-4 w-4" />, size: "L", render: () => <HeadlinesCard /> },
    { id: "travel", label: "Travel", icon: <Plane className="h-4 w-4" />, size: "S", render: () => <TravelCard {...travel} /> },
    { id: "passport", label: "Passport", icon: <BookMarked className="h-4 w-4" />, size: "S", render: () => <PassportCard {...travel} /> },
    { id: "world", label: "World News", icon: <Globe2 className="h-4 w-4" />, size: "S", render: () => <WorldTileCard /> },
    { id: "cameras", label: "Cameras", icon: <Cctv className="h-4 w-4" />, size: "S", render: () => <CamerasCard /> },
    { id: "alfred", label: "AlfredCamera", icon: <Camera className="h-4 w-4" />, size: "S", render: () => <AlfredCard /> },
    { id: "korautoks", label: "korautoks.com search", icon: <Search className="h-4 w-4" />, size: "S", render: () => <KorautoksCard /> },
    { id: "tv", label: "TV favorites", icon: <Tv className="h-4 w-4" />, size: "S", render: () => <TvCard /> },
    { id: "links", label: "Quick links", icon: <LinkIcon className="h-4 w-4" />, size: "S", render: () => <LinksCard /> },
    ...extraWidgets(travel),
  ];
  return (
    <main className="mx-auto max-w-[1440px] px-4 pb-12 pt-2 sm:px-6 sm:pt-4">
      <EditableGrid
        defs={defs}
        prefKey="dashboard_layout"
        className="grid grid-flow-row-dense auto-rows-[180px] grid-cols-2 gap-3 sm:auto-rows-[190px] sm:gap-4 md:grid-cols-4 lg:auto-rows-[210px]"
      />
      <p className="mt-8 text-center text-[12px] text-muted-foreground">
        HQ · private · data refreshes automatically
      </p>
    </main>
  );
}
