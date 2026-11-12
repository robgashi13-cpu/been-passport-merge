import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Clapperboard, Film, Play, Search, Star, X } from "lucide-react";
import { useAuth } from "@/hub/auth";
import { usePref } from "@/hub/prefs";
import { DownloadButton } from "./DownloadButton";
import {
  cleanName, prefetchPlay, useFavs, useHistory, useTv,
  type Cat, type PlayItem, type Series, type Vod,
} from "./api";

function useDebounced<T>(v: T, ms = 350) {
  const [d, setD] = useState(v);
  useEffect(() => { const t = setTimeout(() => setD(v), ms); return () => clearTimeout(t); }, [v, ms]);
  return d;
}

function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <label className="flex flex-1 items-center gap-2 rounded-full bg-foreground/[0.07] px-4 py-2.5 text-[16px] focus-within:ring-2 focus-within:ring-foreground/20">
      <Search className="h-4 w-4 text-muted-foreground" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground/70" />
      {value && <button type="button" onClick={() => onChange("")} aria-label="Clear"><X className="h-4 w-4 text-muted-foreground" /></button>}
    </label>
  );
}

function Poster({ src, alt, className = "" }: { src: string | null; alt: string; className?: string }) {
  const [bad, setBad] = useState(false);
  if (!src || bad) {
    return <div className={`flex items-center justify-center bg-foreground/[0.06] text-muted-foreground ${className}`}><Clapperboard className="h-6 w-6 opacity-40" /></div>;
  }
  return <img src={src} alt={alt} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setBad(true)} className={`object-cover ${className}`} />;
}

function Sheet({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/55 backdrop-blur-sm sm:items-center" onClick={onClose} data-testid="iptv-detail">
      <div className="hq-card max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-b-none p-0 sm:m-4 sm:rounded-[28px]" onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  );
}

function MovieDetail({ m, onPlay, onClose }: { m: Vod; onPlay: (i: PlayItem, at?: number) => void; onClose: () => void }) {
  const info = useTv<{ name?: string; cover: string | null; plot: string | null; genre: string | null; year: string | null; duration: string | null; rating: number | null }>(`vod/info?id=${m.id}`);
  const { token } = useAuth();
  const { isFav, toggle } = useFavs();
  const { hist } = useHistory();
  const item: PlayItem = { kind: "movie", id: m.id, name: cleanName(m.name), logo: m.logo, ext: m.ext };
  const h = hist.find((x) => x.kind === "movie" && x.id === m.id);
  const fav = isFav("movie", m.id);
  const d = info.data;
  useEffect(() => { prefetchPlay(item, token); }, [m.id, m.ext, token]);
  return (
    <Sheet onClose={onClose}>
      <div className="flex gap-4 p-4 sm:p-6">
        <Poster src={d?.cover || m.logo} alt="" className="w-28 shrink-0 rounded-2xl sm:w-36 aspect-[2/3]" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-lg font-semibold leading-tight">{cleanName(m.name)}</h2>
            <button type="button" onClick={onClose} className="rounded-full p-1" aria-label="Close"><X className="h-4 w-4" /></button>
          </div>
          <div className="mt-1 text-xs text-muted-foreground">{[d?.year, d?.genre, d?.duration, (d?.rating || m.rating) ? `★ ${(d?.rating || m.rating)?.toFixed(1)}` : null].filter(Boolean).join(" · ")}</div>
          <p className="mt-3 line-clamp-8 text-sm text-foreground/80">{info.loading && !d ? "Loading…" : d?.plot || "No description."}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onPointerDown={() => prefetchPlay(item, token)} onClick={() => onPlay(item, h?.pos)} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-foreground px-5 text-sm font-semibold text-background">
              <Play className="h-4 w-4 fill-current" /> {h?.pos ? "Resume" : "Play"}
            </button>
            <DownloadButton item={item} />
            <button type="button" onClick={() => toggle({ kind: "movie", id: m.id, name: cleanName(m.name), logo: m.logo, ext: m.ext })} className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-foreground/[0.06] px-4 text-sm">
              <Star className={`h-4 w-4 ${fav ? "fill-current" : ""}`} /> {fav ? "Saved" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </Sheet>
  );
}

type SeriesInfo = { info: { name: string; cover: string | null; plot: string | null; genre: string | null; year: string | null; rating: number | null }; seasons: { season: number; episodes: { id: number; num: number | null; title: string; ext: string; plot: string | null; img: string | null; duration: string | null }[] }[] };

function SeriesDetail({ s, onPlay, onClose }: { s: Series; onPlay: (i: PlayItem, at?: number) => void; onClose: () => void }) {
  const { token } = useAuth();
  const info = useTv<SeriesInfo>(`series/info?id=${s.id}`);
  const [season, setSeason] = useState<number | null>(null);
  const { hist } = useHistory();
  const seasons = info.data?.seasons || [];
  const cur = seasons.find((x) => x.season === season) || seasons[0];
  const cover = info.data?.info.cover || s.logo;
  return (
    <Sheet onClose={onClose}>
      <div className="p-4 sm:p-6">
        <div className="flex items-start gap-4">
          <Poster src={cover} alt="" className="w-24 shrink-0 rounded-2xl sm:w-32 aspect-[2/3]" />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-lg font-semibold leading-tight">{cleanName(s.name)}</h2>
              <button type="button" onClick={onClose} className="rounded-full p-1" aria-label="Close"><X className="h-4 w-4" /></button>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">{[info.data?.info.year, info.data?.info.genre, (info.data?.info.rating || s.rating) ? `★ ${(info.data?.info.rating || s.rating)?.toFixed(1)}` : null].filter(Boolean).join(" · ")}</div>
            <p className="mt-3 line-clamp-6 text-sm text-foreground/80">{info.loading && !info.data ? "Loading…" : info.data?.info.plot || s.plot || "No description."}</p>
          </div>
        </div>
        {seasons.length > 0 && (
          <>
            <div className="mt-4 flex gap-1.5 overflow-x-auto no-scrollbar">
              {seasons.map((x) => (
                <button key={x.season} type="button" onClick={() => setSeason(x.season)} className={`min-h-10 shrink-0 rounded-full px-3 text-[13px] ${cur?.season === x.season ? "bg-foreground text-background" : "bg-foreground/[0.06]"}`}>Season {x.season}</button>
              ))}
            </div>
            <ul className="mt-3 space-y-1.5">
              {cur?.episodes.map((e) => {
                const h = hist.find((x) => x.kind === "series" && x.id === e.id);
                const label = `S${cur.season}E${e.num ?? "?"}`;
                const item: PlayItem = { kind: "series", id: e.id, ext: e.ext, name: cleanName(s.name), sub: `${label} · ${e.title}`, logo: e.img || s.logo, seriesId: s.id };
                return (
                  <li key={e.id}>
                    <button type="button" onPointerDown={() => prefetchPlay(item, token)} onClick={() => onPlay(item, h?.pos)} className="flex w-full items-center gap-3 rounded-2xl bg-foreground/[0.04] p-2 text-left">
                      {e.img ? <Poster src={e.img} alt="" className="h-14 w-[6.2rem] shrink-0 rounded-xl" /> : <span className="w-14 shrink-0 text-xs text-muted-foreground">{label}</span>}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{e.num != null ? `${e.num}. ` : ""}{e.title}</span>
                        {e.duration ? <span className="text-[11px] text-muted-foreground">{e.duration}</span> : null}
                      </span>
                      {h && h.dur > 0 && <span className="h-1 w-12 overflow-hidden rounded bg-foreground/10"><span className="block h-full bg-foreground" style={{ width: `${Math.min(100, (h.pos / h.dur) * 100)}%` }} /></span>}
                      <Play className="h-4 w-4 shrink-0" />
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

function Row({ title, items, onOpen }: { title: string; items: { id: number; name: string; logo: string | null; rating: number | null }[]; onOpen: (id: number) => void }) {
  if (!items.length) return null;
  return (
    <section>
      <h2 className="mb-2 text-[15px] font-semibold tracking-tight">{cleanName(title)}</h2>
      <div className="-mx-1 flex gap-2.5 overflow-x-auto px-1 pb-1 no-scrollbar">
        {items.slice(0, 30).map((it) => (
          <button key={it.id} type="button" onClick={() => onOpen(it.id)} className="press w-[30vw] max-w-[168px] min-w-[112px] shrink-0 text-left sm:w-[140px] lg:w-[160px]">
            <Poster src={it.logo} alt="" className="aspect-[2/3] w-full rounded-2xl" />
            <div className="mt-1.5 truncate text-[13px] font-medium leading-tight">{cleanName(it.name)}</div>
            {it.rating ? <div className="text-[11px] text-muted-foreground">★ {it.rating.toFixed(1)}</div> : null}
          </button>
        ))}
      </div>
    </section>
  );
}

function CategoryRow({ cat, kind, onOpen }: { cat: Cat; kind: "vod" | "series"; onOpen: (item: Vod | Series) => void }) {
  const path = kind === "vod" ? `vod/streams?category=${cat.id}` : `series/list?category=${cat.id}`;
  const list = useTv<(Vod | Series)[]>(path, 30 * 60e3);
  if (list.loading && !list.data) return <div className="h-40 animate-pulse rounded-2xl bg-foreground/[0.05]" />;
  return <Row title={cat.name} items={list.data || []} onOpen={(id) => { const it = (list.data || []).find((x) => x.id === id); if (it) onOpen(it); }} />;
}

export function IptvCatalog({ kind, onPlay, maxRows = 8 }: { kind: "vod" | "series"; onPlay: (i: PlayItem, at?: number) => void; maxRows?: number }) {
  const raw = useTv<Cat[]>(kind === "vod" ? "vod/categories" : "series/categories", 30 * 60e3);
  const [shown, setShown] = usePref<number>(`tv_${kind}_rows`, maxRows);
  const [q, setQ] = useState("");
  const dq = useDebounced(q.trim());
  const found = useTv<(Vod | Series)[]>(dq.length >= 2 ? `search?type=${kind === "vod" ? "vod" : "series"}&q=${encodeURIComponent(dq)}` : null);
  const [open, setOpen] = useState<Vod | Series | null>(null);
  const cats = raw.data || [];
  const visible = useMemo(() => cats.slice(0, Math.max(maxRows, shown)), [cats, shown, maxRows]);

  if (raw.error && !raw.data) {
    return <div className="text-sm text-muted-foreground">Couldn't load your {kind === "vod" ? "movies" : "shows"} ({raw.error}).</div>;
  }

  return (
    <div className="space-y-6" data-testid={kind === "vod" ? "iptv-movies" : "iptv-shows"}>
      <div className="flex items-center gap-2">
        {kind === "vod" ? <Film className="h-4 w-4 text-muted-foreground" /> : <Clapperboard className="h-4 w-4 text-muted-foreground" />}
        <h2 className="text-[15px] font-semibold tracking-tight">{kind === "vod" ? "Your movies" : "Your TV shows"}</h2>
      </div>
      <SearchBox value={q} onChange={setQ} placeholder={kind === "vod" ? "Search your movies" : "Search your shows"} />
      {dq.length >= 2 ? (
        found.loading && !found.data ? (
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5 lg:grid-cols-7">{Array.from({ length: 8 }, (_, i) => <div key={i} className="aspect-[2/3] animate-pulse rounded-2xl bg-foreground/[0.05]" />)}</div>
        ) : !found.data?.length ? (
          <div className="py-8 text-center text-sm text-muted-foreground">No titles match in your library.</div>
        ) : (
          <ul className="grid grid-cols-3 gap-2.5 sm:grid-cols-5 lg:grid-cols-7">
            {found.data.map((it) => (
              <li key={it.id}>
                <button type="button" onClick={() => setOpen(it)} className="w-full text-left">
                  <Poster src={it.logo} alt="" className="aspect-[2/3] w-full rounded-2xl" />
                  <div className="mt-1.5 truncate text-[13px] font-medium">{cleanName(it.name)}</div>
                </button>
              </li>
            ))}
          </ul>
        )
      ) : (
        <>
          {raw.loading && !cats.length ? <div className="h-40 animate-pulse rounded-2xl bg-foreground/[0.05]" /> : null}
          <div className="space-y-7">
            {visible.map((c) => <CategoryRow key={c.id} cat={c} kind={kind} onOpen={setOpen} />)}
          </div>
          {cats.length > visible.length && (
            <div className="text-center">
              <button type="button" onClick={() => setShown(visible.length + 8)} className="hq-chip min-h-11 px-4">Show more categories ({cats.length - visible.length})</button>
            </div>
          )}
        </>
      )}
      {open && kind === "vod" ? <MovieDetail m={open as Vod} onPlay={onPlay} onClose={() => setOpen(null)} /> : null}
      {open && kind === "series" ? <SeriesDetail s={open as Series} onPlay={onPlay} onClose={() => setOpen(null)} /> : null}
    </div>
  );
}
