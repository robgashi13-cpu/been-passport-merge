import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { Clapperboard, Film, Play, RefreshCw, Search, Star, Tv, X, Loader2, History } from "lucide-react";
import { useAuth } from "@/hub/auth";
import { usePref } from "@/hub/prefs";
import { Player } from "./Player";
import { DownloadButton } from "./DownloadButton";
import {
  cleanName, clearTvCache, hhmm, tvGet, useFavs, useHistory, useTv,
  type Cat, type Epg, type Hist, type Live, type PlayItem, type Series, type Status, type Vod,
} from "./api";

type Tab = "live" | "movies" | "series";
type Playing = { item: PlayItem; startAt?: number } | null;

// Albania / USA / UK categories first, then alphabetical (mirrors the server sort).
const CAT_RANK = [/\b(albania|shqip|albanian|kosov|xk)\b/i, /\b(usa|united states|us[:\s|])/i, /\b(uk|united kingdom|britain|british)\b/i];
const catRank = (n: string) => { const i = CAT_RANK.findIndex((r) => r.test(n)); return i === -1 ? 9 : i; };
const sortCats = (list: Cat[]) => [...list].sort((a, b) => catRank(a.name) - catRank(b.name) || a.name.localeCompare(b.name));

function useDebounced<T>(v: T, ms = 350) {
  const [d, setD] = useState(v);
  useEffect(() => { const t = setTimeout(() => setD(v), ms); return () => clearTimeout(t); }, [v, ms]);
  return d;
}

const Logo = ({ src, className = "" }: { src: string | null; className?: string }) => {
  const [bad, setBad] = useState(false);
  return src && !bad ? (
    <img src={src} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setBad(true)} className={`object-contain ${className}`} />
  ) : (
    <div className={`flex items-center justify-center text-white/25 ${className}`}><Tv className="h-4 w-4" /></div>
  );
};

function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <label className="flex flex-1 items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-sm focus-within:border-sky/50">
      <Search className="h-4 w-4 text-white/40" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-white/30" />
      {value && <button onClick={() => onChange("")} aria-label="Clear"><X className="h-4 w-4 text-white/40" /></button>}
    </label>
  );
}

function CatPicker({ cats, value, onChange }: { cats: Cat[]; value: string; onChange: (id: string) => void }) {
  const [f, setF] = useState("");
  const list = useMemo(() => (f ? cats.filter((c) => c.name.toLowerCase().includes(f.toLowerCase())) : cats), [cats, f]);
  return (
    <>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-full border border-white/10 bg-zinc-900 px-3 py-2 text-sm md:hidden" aria-label="Category">
        {cats.map((c) => <option key={c.id} value={c.id}>{cleanName(c.name)}</option>)}
      </select>
      <div className="hidden md:block">
        <input value={f} onChange={(e) => setF(e.target.value)} placeholder={`Filter ${cats.length} categories`} className="mb-2 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs outline-none placeholder:text-white/30" />
        <ul className="max-h-[62vh] space-y-0.5 overflow-y-auto pr-1">
          {list.slice(0, 400).map((c) => (
            <li key={c.id}>
              <button onClick={() => onChange(c.id)} className={`w-full truncate rounded-lg px-2.5 py-1.5 text-left text-[13px] ${value === c.id ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/[0.05] hover:text-white"}`}>
                {cleanName(c.name)}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ live */
function LiveSection({ onPlay }: { onPlay: (i: PlayItem) => void }) {
  const { token } = useAuth();
  const rawCats = useTv<Cat[]>("live/categories", 30 * 60e3);
  const cats = useMemo(() => (rawCats.data ? { ...rawCats, data: sortCats(rawCats.data) } : rawCats), [rawCats]);
  const [cat, setCat] = usePref<string>("tv_live_cat", "");
  const [q, setQ] = useState("");
  const dq = useDebounced(q.trim());
  const [limit, setLimit] = useState(60);
  const activeCat = cat || cats.data?.[0]?.id || "";
  const list = useTv<Live[]>(dq.length >= 2 ? `search?type=live&q=${encodeURIComponent(dq)}` : activeCat ? `live/streams?category=${activeCat}` : null);
  const { isFav, toggle } = useFavs();
  const [epg, setEpg] = useState<Record<string, Epg[]>>({});
  const shown = (list.data || []).slice(0, limit);
  useEffect(() => setLimit(60), [activeCat, dq]);
  useEffect(() => {
    const ids = shown.map((c) => String(c.id)).filter((id) => !(id in epg));
    if (!ids.length || !token) return;
    let alive = true;
    (async () => {
      for (let i = 0; i < ids.length; i += 40) {
        const part = ids.slice(i, i + 40);
        try {
          const d = await tvGet<Record<string, Epg[]>>(`epg?ids=${part.join(",")}`, token, 2 * 60e3);
          if (alive) setEpg((p) => ({ ...p, ...d }));
        } catch { /* ignore */ }
      }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list.data, limit, token]);
  const now = Date.now() / 1000;

  return (
    <div className="grid gap-4 md:grid-cols-[240px_1fr]">
      <aside>{cats.data ? <CatPicker cats={cats.data} value={activeCat} onChange={setCat} /> : <div className="h-40 animate-pulse rounded-xl bg-white/5" />}</aside>
      <section className="min-w-0">
        <div className="mb-3 flex gap-2"><SearchBox value={q} onChange={setQ} placeholder="Search all channels" /></div>
        {list.loading && !list.data ? (
          <div className="space-y-2">{Array.from({ length: 8 }, (_, i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-white/[0.04]" />)}</div>
        ) : list.error ? (
          <div className="py-10 text-center text-sm text-muted-foreground">Couldn't load channels ({list.error}).</div>
        ) : !shown.length ? (
          <div className="py-10 text-center text-sm text-muted-foreground">No channels.</div>
        ) : (
          <ul className="grid gap-1.5 xl:grid-cols-2" data-testid="channel-list">
            {shown.map((c) => {
              const e = (epg[String(c.id)] || []).filter((x) => x.end > now);
              const cur = e[0] && e[0].start <= now ? e[0] : null;
              const next = cur ? e[1] : e[0];
              const pct = cur ? Math.min(100, ((now - cur.start) / (cur.end - cur.start)) * 100) : 0;
              const fav = isFav("live", c.id);
              return (
                <li key={c.id} className="min-w-0">
                  <div className="group flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-2 transition hover:border-white/15 hover:bg-white/[0.05]">
                    <button onClick={() => onPlay({ kind: "live", id: c.id, name: cleanName(c.name), logo: c.logo, sub: cur?.title })} className="flex min-w-0 flex-1 items-center gap-3 text-left" aria-label={`Play ${cleanName(c.name)}`}>
                      <Logo src={c.logo} className="h-10 w-14 shrink-0 rounded-md bg-white/[0.04] p-1" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{cleanName(c.name)}</div>
                        {cur ? (
                          <>
                            <div className="truncate text-xs text-white/70"><span className="text-rose-300">Now</span> {cur.title}</div>
                            <div className="mt-1 h-0.5 overflow-hidden rounded bg-white/10"><div className="h-full bg-sky" style={{ width: `${pct}%` }} /></div>
                          </>
                        ) : null}
                        {next && <div className="truncate text-[11px] text-white/40">{hhmm(next.start)} {next.title}</div>}
                      </div>
                      <Play className="h-4 w-4 shrink-0 text-white/30 group-hover:text-white" />
                    </button>
                    <button onClick={() => toggle({ kind: "live", id: c.id, name: cleanName(c.name), logo: c.logo })} className="rounded-full p-1.5 hover:bg-white/10" aria-label={fav ? "Remove favorite" : "Add favorite"} aria-pressed={fav}>
                      <Star className={`h-4 w-4 ${fav ? "fill-amber-400 text-amber-400" : "text-white/30"}`} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {(list.data?.length || 0) > limit && (
          <div className="mt-3 text-center"><button onClick={() => setLimit((l) => l + 60)} className="rounded-full border border-white/10 px-4 py-1.5 text-xs text-white/70 hover:text-white">Show more ({(list.data?.length || 0) - limit})</button></div>
        )}
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ movies & series */
function PosterGrid<T extends { id: number; name: string; logo: string | null; rating: number | null }>({ items, onOpen, limit }: { items: T[]; onOpen: (t: T) => void; limit: number }) {
  return (
    <ul className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-6">
      {items.slice(0, limit).map((m) => (
        <li key={m.id}>
          <button onClick={() => onOpen(m)} className="group block w-full text-left">
            <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-white/[0.04] ring-1 ring-white/5 transition group-hover:ring-white/25">
              {m.logo ? <img src={m.logo} alt="" loading="lazy" referrerPolicy="no-referrer" className="h-full w-full object-cover" onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} /> : null}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-2 pt-8">
                <div className="line-clamp-2 text-[12px] font-medium leading-tight">{cleanName(m.name)}</div>
                {m.rating ? <div className="text-[10px] text-amber-300">★ {m.rating.toFixed(1)}</div> : null}
              </div>
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}

function Sheet({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div className="hq-card max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-b-none p-0 sm:m-4 sm:rounded-b-3xl" onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  );
}

function MovieDetail({ m, onPlay, onClose, resumeAt }: { m: Vod; onPlay: (i: PlayItem, at?: number) => void; onClose: () => void; resumeAt?: number }) {
  const info = useTv<{ name?: string; cover: string | null; plot: string | null; genre: string | null; year: string | null; duration: string | null; rating: number | null }>(`vod/info?id=${m.id}`);
  const { isFav, toggle } = useFavs();
  const item: PlayItem = { kind: "movie", id: m.id, name: cleanName(m.name), logo: m.logo, ext: m.ext };
  const fav = isFav("movie", m.id);
  return (
    <Sheet onClose={onClose}>
      <div className="flex gap-4 p-4">
        <div className="w-28 shrink-0 overflow-hidden rounded-xl bg-white/5 sm:w-36">{(info.data?.cover || m.logo) && <img src={info.data?.cover || m.logo!} alt="" className="aspect-[2/3] w-full object-cover" referrerPolicy="no-referrer" />}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2"><h2 className="text-lg font-semibold leading-tight">{cleanName(m.name)}</h2><button onClick={onClose} className="rounded-full p-1 hover:bg-white/10" aria-label="Close"><X className="h-4 w-4" /></button></div>
          <div className="mt-1 text-xs text-white/50">{[info.data?.year, info.data?.genre, info.data?.duration, m.ext.toUpperCase()].filter(Boolean).join(" · ")}</div>
          <p className="mt-3 line-clamp-6 text-sm text-white/70">{info.loading ? "Loading…" : info.data?.plot || "No description."}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={() => onPlay(item, resumeAt)} className="flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-semibold text-black"><Play className="h-4 w-4 fill-black" /> {resumeAt ? "Resume" : "Play"}</button>
            <DownloadButton item={item} />
            {resumeAt ? <button onClick={() => onPlay(item, 0)} className="rounded-full border border-white/15 px-4 py-2 text-sm">From start</button> : null}
            <button onClick={() => toggle({ kind: "movie", id: m.id, name: cleanName(m.name), logo: m.logo, ext: m.ext })} className="flex items-center gap-1.5 rounded-full border border-white/15 px-4 py-2 text-sm"><Star className={`h-4 w-4 ${fav ? "fill-amber-400 text-amber-400" : ""}`} /> {fav ? "Saved" : "Save"}</button>
          </div>
          {m.ext.toLowerCase() === "mkv" && <p className="mt-3 text-[11px] text-white/40">MKV files may not play in Safari/iPhone.</p>}
        </div>
      </div>
    </Sheet>
  );
}

type SeriesInfo = { info: { name: string; cover: string | null; plot: string | null; genre: string | null; year: string | null }; seasons: { season: number; episodes: { id: number; num: number | null; title: string; ext: string; plot: string | null; img: string | null; duration: string | null }[] }[] };
function SeriesDetail({ s, onPlay, onClose }: { s: Series; onPlay: (i: PlayItem, at?: number) => void; onClose: () => void }) {
  const info = useTv<SeriesInfo>(`series/info?id=${s.id}`);
  const [season, setSeason] = useState<number | null>(null);
  const { hist } = useHistory();
  const seasons = info.data?.seasons || [];
  const cur = seasons.find((x) => x.season === season) || seasons[0];
  return (
    <Sheet onClose={onClose}>
      <div className="p-4">
        <div className="flex items-start gap-4">
          {(info.data?.info.cover || s.logo) && <img src={info.data?.info.cover || s.logo!} alt="" className="w-24 shrink-0 rounded-xl object-cover sm:w-32" referrerPolicy="no-referrer" />}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2"><h2 className="text-lg font-semibold leading-tight">{cleanName(s.name)}</h2><button onClick={onClose} className="rounded-full p-1 hover:bg-white/10" aria-label="Close"><X className="h-4 w-4" /></button></div>
            <div className="mt-1 text-xs text-white/50">{[info.data?.info.year || s.year, info.data?.info.genre].filter(Boolean).join(" · ")}</div>
            <p className="mt-2 line-clamp-4 text-sm text-white/70">{info.data?.info.plot || s.plot || (info.loading ? "Loading…" : "")}</p>
          </div>
        </div>
        {info.loading && <div className="mt-6 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-white/50" /></div>}
        {seasons.length > 0 && (
          <>
            <div className="mt-4 flex gap-1.5 overflow-x-auto pb-1">
              {seasons.map((x) => (
                <button key={x.season} onClick={() => setSeason(x.season)} className={`shrink-0 rounded-full px-3 py-1 text-xs ${cur?.season === x.season ? "bg-white text-black" : "border border-white/10 text-white/70"}`}>Season {x.season}</button>
              ))}
            </div>
            <ul className="mt-3 space-y-1.5">
              {cur?.episodes.map((e) => {
                const h = hist.find((x) => x.kind === "series" && x.id === e.id);
                const label = `S${cur.season}E${e.num ?? "?"}`;
                return (
                  <li key={e.id}>
                    <button onClick={() => onPlay({ kind: "series", id: e.id, ext: e.ext, name: cleanName(s.name), sub: `${label} · ${e.title}`, logo: s.logo, seriesId: s.id }, h?.pos)} className="flex w-full items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-2 text-left hover:bg-white/[0.06]">
                      <span className="hq-num w-14 shrink-0 text-xs text-white/50">{label}</span>
                      <span className="min-w-0 flex-1 truncate text-sm">{e.title}</span>
                      {h && h.dur > 0 && <span className="h-1 w-12 overflow-hidden rounded bg-white/10"><span className="block h-full bg-sky" style={{ width: `${Math.min(100, (h.pos / h.dur) * 100)}%` }} /></span>}
                      <Play className="h-4 w-4 shrink-0 text-white/40" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </Sheet>
  );
}

function CatalogSection({ kind, onPlay }: { kind: "vod" | "series"; onPlay: (i: PlayItem, at?: number) => void }) {
  const rawCats = useTv<Cat[]>(`${kind}/categories`, 30 * 60e3);
  const cats = useMemo(() => (rawCats.data ? { ...rawCats, data: sortCats(rawCats.data) } : rawCats), [rawCats]);
  const [cat, setCat] = usePref<string>(`tv_${kind}_cat`, "");
  const [q, setQ] = useState("");
  const dq = useDebounced(q.trim());
  const [limit, setLimit] = useState(48);
  const activeCat = cat || cats.data?.[0]?.id || "";
  const path = dq.length >= 2 ? `search?type=${kind}&q=${encodeURIComponent(dq)}` : activeCat ? (kind === "vod" ? `vod/streams?category=${activeCat}` : `series/list?category=${activeCat}`) : null;
  const list = useTv<(Vod | Series)[]>(path);
  const [open, setOpen] = useState<Vod | Series | null>(null);
  const { hist } = useHistory();
  useEffect(() => setLimit(48), [path]);
  return (
    <div className="grid gap-4 md:grid-cols-[240px_1fr]">
      <aside>{cats.data ? <CatPicker cats={cats.data} value={activeCat} onChange={setCat} /> : <div className="h-40 animate-pulse rounded-xl bg-white/5" />}</aside>
      <section className="min-w-0">
        <div className="mb-3 flex gap-2"><SearchBox value={q} onChange={setQ} placeholder={kind === "vod" ? "Search movies" : "Search series"} /></div>
        {list.loading && !list.data ? (
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-6">{Array.from({ length: 12 }, (_, i) => <div key={i} className="aspect-[2/3] animate-pulse rounded-xl bg-white/[0.04]" />)}</div>
        ) : list.error ? (
          <div className="py-10 text-center text-sm text-muted-foreground">Couldn't load ({list.error}).</div>
        ) : (
          <PosterGrid items={(list.data || []) as any[]} limit={limit} onOpen={setOpen} />
        )}
        {(list.data?.length || 0) > limit && <div className="mt-3 text-center"><button onClick={() => setLimit((l) => l + 48)} className="rounded-full border border-white/10 px-4 py-1.5 text-xs text-white/70 hover:text-white">Show more</button></div>}
      </section>
      {open && kind === "vod" && <MovieDetail m={open as Vod} resumeAt={hist.find((h) => h.kind === "movie" && h.id === open.id)?.pos} onPlay={(i, at) => { setOpen(null); onPlay(i, at); }} onClose={() => setOpen(null)} />}
      {open && kind === "series" && <SeriesDetail s={open as Series} onPlay={(i, at) => { setOpen(null); onPlay(i, at); }} onClose={() => setOpen(null)} />}
    </div>
  );
}

/* ------------------------------------------------------------------ rows */
function Row({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <section>
      <div className="hq-label mb-2 flex items-center gap-2">{icon} {title}</div>
      <div className="-mx-1 flex gap-2.5 overflow-x-auto px-1 pb-1">{children}</div>
    </section>
  );
}

export default function TvApp() {
  const status = useTv<Status>("status", 60e3);
  const { token } = useAuth();
  // Warm the category caches as soon as TV opens so every tab is instant.
  useEffect(() => {
    if (!token) return;
    for (const p of ["live/categories", "vod/categories", "series/categories"]) tvGet(p, token, 30 * 60e3).catch(() => {});
  }, [token]);
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = usePref<Tab>("tv_tab", "live");
  const [playing, setPlaying] = useState<Playing>(null);
  const { favs, toggle } = useFavs();
  const { hist, remove } = useHistory();
  const play = (item: PlayItem, startAt?: number) => setPlaying({ item, startAt });

  // deep link from the dashboard: /tv?play=live:123
  useEffect(() => {
    const p = params.get("play");
    if (!p) return;
    const [kind, id] = p.split(":");
    const f = favs.find((x) => x.kind === kind && String(x.id) === id);
    if ((kind === "live" || kind === "movie") && /^\d+$/.test(id)) play({ kind, id: Number(id), name: f?.name || "Channel", logo: f?.logo || null, ext: f?.ext });
    params.delete("play");
    setParams(params, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const s = status.data;
  const cont = hist.filter((h) => h.kind !== "live" && h.dur > 0 && h.pos > 30 && h.pos < h.dur - 90);
  const recentLive = hist.filter((h) => h.kind === "live").slice(0, 12);
  const TABS: { id: Tab; label: string; icon: ReactNode }[] = [
    { id: "live", label: "Live TV", icon: <Tv className="h-4 w-4" /> },
    { id: "movies", label: "Movies", icon: <Film className="h-4 w-4" /> },
    { id: "series", label: "Series", icon: <Clapperboard className="h-4 w-4" /> },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 px-3 pb-24 pt-4 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="hq-label flex items-center gap-2"><Tv className="h-3.5 w-3.5" /> IPTV</div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">TV</h1>
        </div>
        {s && s.configured && !s.error && (
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1"><span className={`h-2 w-2 rounded-full ${s.ok ? "bg-emerald-400" : "bg-rose-500"}`} />{s.status}</span>
            {s.exp && <span className="rounded-full border border-white/10 px-3 py-1">until {new Date(s.exp * 1000).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>}
            {s.maxConnections && <span className="rounded-full border border-white/10 px-3 py-1">{s.activeCons}/{s.maxConnections} stream{s.maxConnections > 1 ? "s" : ""}</span>}
          </div>
        )}
      </header>

      {status.loading && !s ? (
        <div className="h-40 animate-pulse rounded-3xl bg-white/[0.03]" />
      ) : !s || (s.configured && s.error) ? (
        <div className="hq-card p-6 text-sm text-muted-foreground">The TV service didn't respond{s?.error ? ` (${s.error})` : ""}. Try again in a moment.</div>
      ) : !s.configured ? (
        <div className="hq-card p-6 text-sm text-muted-foreground">IPTV isn't configured yet. Add IPTV_URL, IPTV_USER and IPTV_PASS on the server.</div>
      ) : (
        <>
          {s.mediaProxy === "cloud" && (
            <div className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] px-4 py-3 text-xs leading-relaxed text-amber-100/80">
              Channel lists come from your provider. Video playback needs the home media proxy, because your provider blocks streams relayed through cloud servers. Until that's on, channels may not start.
            </div>
          )}
          {cont.length > 0 && (
            <Row title="Continue watching" icon={<History className="h-3.5 w-3.5" />}>
              {cont.map((h: Hist) => (
                <div key={`${h.kind}${h.id}`} className="relative w-40 shrink-0">
                  <button onClick={() => play(h, h.pos)} className="block w-full text-left">
                    <div className="relative aspect-video overflow-hidden rounded-xl bg-white/[0.05]">
                      {h.logo && <img src={h.logo} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />}
                      <div className="absolute inset-x-0 bottom-0 h-1 bg-white/15"><div className="h-full bg-sky" style={{ width: `${(h.pos / h.dur) * 100}%` }} /></div>
                    </div>
                    <div className="mt-1 truncate text-xs">{h.name}</div>
                    {h.sub && <div className="truncate text-[11px] text-white/40">{h.sub}</div>}
                  </button>
                  <button onClick={() => remove(h)} className="absolute right-1 top-1 rounded-full bg-black/60 p-1" aria-label="Remove"><X className="h-3 w-3" /></button>
                </div>
              ))}
            </Row>
          )}
          {(favs.length > 0 || recentLive.length > 0) && (
            <Row title={favs.length ? "Favorites" : "Recently watched"} icon={<Star className="h-3.5 w-3.5" />}>
              {(favs.length ? favs : recentLive).map((f) => (
                <div key={`${f.kind}${f.id}`} className="group relative w-28 shrink-0">
                  <button onClick={() => play(f)} className="block w-full text-left">
                    <Logo src={f.logo} className="aspect-video w-full rounded-xl bg-white/[0.05] p-2 ring-1 ring-white/5 group-hover:ring-white/25" />
                    <div className="mt-1 truncate text-xs text-white/80">{f.name}</div>
                  </button>
                  {favs.length > 0 && <button onClick={() => toggle(f)} className="absolute right-1 top-1 hidden rounded-full bg-black/60 p-1 group-hover:block" aria-label="Remove favorite"><X className="h-3 w-3" /></button>}
                </div>
              ))}
            </Row>
          )}
          <div className="flex gap-1 rounded-full border border-white/10 bg-white/[0.02] p-1 sm:w-fit" role="tablist">
            {TABS.map((t) => (
              <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} className={`flex flex-1 items-center justify-center gap-1.5 rounded-full px-4 py-1.5 text-sm transition sm:flex-none ${tab === t.id ? "bg-white text-black" : "text-white/60 hover:text-white"}`}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
          {tab === "live" && <LiveSection onPlay={play} />}
          {tab === "movies" && <CatalogSection kind="vod" onPlay={play} />}
          {tab === "series" && <CatalogSection kind="series" onPlay={play} />}
        </>
      )}
      {playing && <Player item={playing.item} startAt={playing.startAt} onClose={() => setPlaying(null)} />}
    </div>
  );
}
