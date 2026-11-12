import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Clapperboard, Film, Home, RefreshCw, Tv } from "lucide-react";
import { useAuth } from "@/hub/auth";
import { usePref } from "@/hub/prefs";
import { Player } from "./Player";
import { clearTvCache, tvGet, useFavs, useTv, type PlayItem, type Status } from "./api";
import { LiveSection, useRefreshKey } from "./Live";
import { Browse } from "./Browse";
import type { Media, Title } from "./tmdb";

type Tab = "home" | "movies" | "shows" | "live";
const TABS: { id: Tab; label: string; icon: typeof Home }[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "movies", label: "Movies", icon: Film },
  { id: "shows", label: "TV Shows", icon: Clapperboard },
  { id: "live", label: "Live TV", icon: Tv },
];

function asTab(v: string | null): Tab | null {
  if (v === "series") return "shows";
  return TABS.some((t) => t.id === v) ? (v as Tab) : null;
}

function parseTitle(v: string | null): Title | null {
  if (!v) return null;
  const [media, id] = v.split(":");
  if ((media !== "movie" && media !== "tv") || !/^\d+$/.test(id)) return null;
  return { id: Number(id), media: media as Media, title: "", overview: "", poster: null, backdrop: null, rating: null, year: null };
}

export default function TvApp() {
  const status = useTv<Status>("status", 60e3);
  const { token } = useAuth();
  const [refreshKey, bumpRefresh] = useRefreshKey();
  const [refreshing, setRefreshing] = useState(false);
  const [params, setParams] = useSearchParams();
  const [prefTab, setPrefTab] = usePref<Tab>("tv_nav", "home");
  const tab = asTab(params.get("tab")) || asTab(prefTab) || "home";
  const [playing, setPlaying] = useState<{ item: PlayItem; startAt?: number } | null>(null);
  const [open, setOpen] = useState<Title | null>(() => parseTitle(params.get("title")));
  const { favs } = useFavs();
  const play = (item: PlayItem, startAt?: number) => setPlaying({ item, startAt });

  useEffect(() => {
    const p = params.get("play");
    if (!p) return;
    const [kind, id] = p.split(":");
    const f = favs.find((x) => x.kind === kind && String(x.id) === id);
    if (kind === "live" && /^\d+$/.test(id)) {
      setTab("live");
      play({ kind, id: Number(id), name: f?.name || "Channel", logo: f?.logo || null, ext: f?.ext });
    }
    params.delete("play");
    setParams(params, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setTab = (id: Tab) => {
    setPrefTab(id);
    const next = new URLSearchParams(params);
    if (id === "home") next.delete("tab"); else next.set("tab", id);
    setParams(next, { replace: true });
  };

  const setOpenTitle = (t: Title | null) => {
    setOpen(t);
    const next = new URLSearchParams(params);
    if (t) next.set("title", `${t.media}:${t.id}`); else next.delete("title");
    setParams(next, { replace: true });
  };

  const refresh = async () => {
    if (!token || refreshing) return;
    setRefreshing(true);
    try {
      await tvGet("refresh", token, 0).catch(() => {});
      clearTvCache();
      bumpRefresh();
    } finally {
      setTimeout(() => setRefreshing(false), 800);
    }
  };

  const s = status.data;
  const media = tab === "movies" ? "movie" as const : tab === "shows" ? "tv" as const : "all" as const;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 px-3 pb-24 pt-4 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="t-footnote flex items-center gap-2 font-medium text-muted-foreground"><Tv className="h-3.5 w-3.5" /> Watch</div>
          <h1 className="sr-only">TV</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {tab === "live" && (
            <button type="button" onClick={refresh} disabled={refreshing} className="flex items-center gap-1.5 hq-chip press disabled:opacity-50" title="Refresh channel lists">
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} /> {refreshing ? "Updating…" : "Update"}
            </button>
          )}
          {tab === "live" && s && s.configured && !s.error && (
            <>
              <span className="hq-chip text-muted-foreground"><span className={`h-2 w-2 rounded-full ${s.ok ? "bg-foreground" : "bg-[hsl(var(--destructive))]"}`} />{s.status}</span>
              {s.exp && <span className="hq-chip text-muted-foreground">until {new Date(s.exp * 1000).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>}
              {s.maxConnections && <span className="hq-chip text-muted-foreground">{s.activeCons}/{s.maxConnections} stream{s.maxConnections > 1 ? "s" : ""}</span>}
            </>
          )}
        </div>
      </header>

      <div className="flex gap-1 overflow-x-auto rounded-full bg-foreground/[0.07] p-1 no-scrollbar sm:w-fit" role="tablist" aria-label="TV sections">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} className={`flex min-h-11 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-[13px] sm:px-4 sm:text-[14px] transition-[background-color,box-shadow] duration-300 ${tab === t.id ? "bg-card font-semibold text-foreground shadow-[0_2px_8px_hsl(0_0%_0%/.18)]" : "text-foreground/65"}`}>
              <Icon className="h-4 w-4" /> {t.label}
            </button>
          );
        })}
      </div>

      {tab !== "live" && <Browse media={media} open={open} onOpen={setOpenTitle} />}

      {tab === "live" && (
        <div data-testid="tv-live">
          {status.loading && !s ? (
            <div className="h-40 animate-pulse rounded-[26px] bg-foreground/[0.04]" />
          ) : !s || (s.configured && s.error) ? (
            <div className="hq-card p-6 text-sm text-muted-foreground">The TV service didn't respond{s?.error ? ` (${s.error})` : ""}. Try again in a moment.</div>
          ) : !s.configured ? (
            <div className="hq-card p-6 text-sm text-muted-foreground">IPTV isn't configured yet. Add IPTV_URL, IPTV_USER and IPTV_PASS on the server.</div>
          ) : (
            <>
              {s.mediaProxy === "cloud" && (
                <div className="mb-4 rounded-2xl bg-foreground/[0.06] px-4 py-3 text-[13px] leading-relaxed text-foreground/80">
                  Channel lists come from your provider. Video playback needs the home media proxy, because your provider blocks streams relayed through cloud servers. Until that's on, channels may not start.
                </div>
              )}
              <LiveSection onPlay={play} refreshKey={refreshKey} />
            </>
          )}
        </div>
      )}

      {playing && <Player item={playing.item} startAt={playing.startAt} onClose={() => setPlaying(null)} />}

      <p className="pt-2 text-center text-[11px] leading-relaxed text-muted-foreground">
        This product uses the TMDB API but is not endorsed or certified by TMDB.
        {" "}<a href="https://www.themoviedb.org" target="_blank" rel="noreferrer" className="underline underline-offset-2">themoviedb.org</a>
      </p>
    </div>
  );
}
