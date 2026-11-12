import { useEffect, useState, type ReactNode } from "react";
import { Clapperboard, Search, Star, X } from "lucide-react";
import {
  catalogPath, runtimeLabel, useTmdb, youtubeEmbed,
  type Genre, type Home, type SearchResult, type GenreList, type Discover,
  type Title, type TitleDetail, type SeasonDetail,
} from "./tmdb";

function useDebounced<T>(v: T, ms = 350) {
  const [d, setD] = useState(v);
  useEffect(() => { const t = setTimeout(() => setD(v), ms); return () => clearTimeout(t); }, [v, ms]);
  return d;
}

function Poster({ src, alt, className = "" }: { src: string | null; alt: string; className?: string }) {
  const [bad, setBad] = useState(false);
  if (!src || bad) {
    return (
      <div className={`flex items-center justify-center bg-foreground/[0.06] text-muted-foreground ${className}`}>
        <Clapperboard className="h-6 w-6 opacity-40" />
      </div>
    );
  }
  return <img src={src} alt={alt} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setBad(true)} className={`object-cover ${className}`} />;
}

function PosterCard({ item, onOpen, wide = false }: { item: Title; onOpen: (t: Title) => void; wide?: boolean }) {
  return (
    <button type="button" onClick={() => onOpen(item)} className="press w-[30vw] max-w-[168px] min-w-[112px] shrink-0 text-left sm:w-[140px] lg:w-[160px]">
      <Poster src={item.poster} alt="" className={`w-full rounded-2xl ${wide ? "aspect-video" : "aspect-[2/3]"}`} />
      <div className="mt-1.5 truncate text-[13px] font-medium leading-tight">{item.title}</div>
      <div className="text-[11px] text-muted-foreground">
        {[item.year, item.rating ? `★ ${item.rating.toFixed(1)}` : null].filter(Boolean).join(" · ")}
      </div>
    </button>
  );
}

function Row({ title, items, onOpen }: { title: string; items: Title[]; onOpen: (t: Title) => void }) {
  if (!items.length) return null;
  return (
    <section>
      <h2 className="mb-2 text-[15px] font-semibold tracking-tight">{title}</h2>
      <div className="-mx-1 flex gap-2.5 overflow-x-auto px-1 pb-1 no-scrollbar">{items.map((it) => <PosterCard key={`${it.media}-${it.id}`} item={it} onOpen={onOpen} />)}</div>
    </section>
  );
}

function NeedKey({ fallback }: { fallback?: boolean }) {
  return (
    <div className="hq-card px-4 py-3 text-[13px] leading-relaxed text-muted-foreground" data-testid="tmdb-missing-key">
      Add a <span className="font-medium text-foreground">TMDB_API_KEY</span> secret in Lovable Secrets to load movies, ratings, official trailers and where-to-watch.
      {fallback ? " TV shows below come from a public catalog until the key is added." : ""}
    </div>
  );
}

function CatalogError({ message }: { message: string }) {
  const net = /404|failed to fetch|network|timeout|unavailable|502|503|HTTP/i.test(message);
  return (
    <div className="hq-card px-4 py-6 text-center text-sm text-muted-foreground" data-testid="tmdb-catalog-error">
      {net ? "Couldn't reach the catalog service. Check your connection and try again." : `Couldn't load the catalog (${message}).`}
    </div>
  );
}

function TrailerFrame({ youtubeKey, title }: { youtubeKey: string; title: string }) {
  return (
    <div className="on-media aspect-video overflow-hidden rounded-2xl bg-black">
      <iframe
        title={`${title} trailer`}
        src={youtubeEmbed(youtubeKey)}
        className="h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}

function DetailSheet({ item, onClose, startTrailer = false }: { item: Title; onClose: () => void; startTrailer?: boolean }) {
  const info = useTmdb<TitleDetail>(catalogPath("title", { media: item.media, id: item.id }));
  const d = info.data;
  const [season, setSeason] = useState<number | null>(null);
  const [showTrailer, setShowTrailer] = useState(startTrailer);
  const seasons = d?.seasons || [];
  const active = season ?? seasons.find((s) => s.season > 0)?.season ?? seasons[0]?.season ?? null;
  const eps = useTmdb<SeasonDetail>(item.media === "tv" && active != null ? catalogPath("season", { id: item.id, season: active }) : null);
  const year = d?.year || item.year;
  const runtime = runtimeLabel(d?.runtime ?? null);
  const regionLabel = d?.region === "XK" ? "Kosovo" : d?.region === "DE" ? "Germany" : null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/55 backdrop-blur-sm sm:items-center" onClick={onClose} data-testid="tv-detail">
      <div className="hq-card max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-b-none p-0 sm:m-4 sm:rounded-[28px]" onClick={(e) => e.stopPropagation()}>
        <div className="on-media relative aspect-[16/9] bg-black">
          <Poster src={d?.backdrop || item.backdrop || d?.poster || item.poster} alt="" className="absolute inset-0 h-full w-full" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/10" />
          <button type="button" onClick={onClose} className="absolute right-3 top-3 rounded-full bg-black/50 p-2 text-white" aria-label="Close"><X className="h-4 w-4" /></button>
        </div>
        <div className="relative -mt-16 grid gap-4 px-4 pb-6 sm:grid-cols-[140px_1fr] sm:px-6">
          <Poster src={d?.poster || item.poster} alt="" className="mx-auto aspect-[2/3] w-28 rounded-2xl shadow-lg sm:mx-0 sm:w-full" />
          <div className="min-w-0">
            <h2 className="text-2xl font-semibold tracking-tight">{d?.title || item.title}</h2>
            {d?.tagline ? <p className="mt-1 text-sm text-muted-foreground">{d.tagline}</p> : null}
            <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-[13px] text-muted-foreground">
              {year ? <span>{year}</span> : null}
              {runtime ? <span>· {runtime}</span> : null}
              {d?.rating ? <span className="inline-flex items-center gap-1">· <Star className="h-3 w-3" /> {d.rating.toFixed(1)}</span> : null}
            </div>
            {d?.genres?.length ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {d.genres.map((g) => <span key={g.id} className="hq-chip">{g.name}</span>)}
              </div>
            ) : null}
            <p className="mt-3 text-sm leading-relaxed text-foreground/80">{info.loading && !d ? "Loading…" : d?.overview || item.overview || "No overview."}</p>
            {d?.trailer && (
              <button type="button" onClick={() => setShowTrailer((v) => !v)} className="mt-4 inline-flex min-h-11 items-center rounded-full bg-foreground px-5 text-sm font-semibold text-background">
                {showTrailer ? "Hide trailer" : "Trailer"}
              </button>
            )}
          </div>
        </div>
        <div className="space-y-6 px-4 pb-8 sm:px-6">
          {showTrailer && d?.trailer ? <TrailerFrame youtubeKey={d.trailer.key} title={d.title} /> : null}
          {d?.providers && d.providers.length > 0 && (
            <section>
              <h3 className="mb-2 text-[15px] font-semibold">Where to watch {regionLabel ? <span className="font-normal text-muted-foreground">· {regionLabel}</span> : null}</h3>
              <ul className="flex flex-wrap gap-2">
                {d.providers.map((p) => (
                  <li key={p.id} className="flex items-center gap-2 rounded-full bg-foreground/[0.06] py-1 pl-1 pr-3 text-[13px]">
                    {p.logo ? <img src={p.logo} alt="" width={22} height={22} loading="lazy" className="h-[22px] w-[22px] rounded-full object-cover" /> : null}
                    <span>{p.name}</span>
                    <span className="text-[11px] uppercase text-muted-foreground">{p.type}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {d && d.providers && d.providers.length === 0 && d.source === "tmdb" && (
            <p className="text-[13px] text-muted-foreground">No official watch providers listed for Kosovo or Germany.</p>
          )}
          {d?.cast?.length ? (
            <section>
              <h3 className="mb-2 text-[15px] font-semibold">Cast</h3>
              <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 no-scrollbar">
                {d.cast.map((c) => (
                  <div key={c.id} className="w-[72px] shrink-0 sm:w-[84px]">
                    <Poster src={c.photo} alt="" className="aspect-[2/3] w-full rounded-xl" />
                    <div className="mt-1 truncate text-[12px] font-medium">{c.name}</div>
                    {c.character ? <div className="truncate text-[11px] text-muted-foreground">{c.character}</div> : null}
                  </div>
                ))}
              </div>
            </section>
          ) : null}
          {seasons.length > 0 && (
            <section>
              <h3 className="mb-2 text-[15px] font-semibold">Seasons</h3>
              <div className="mb-3 flex gap-1.5 overflow-x-auto no-scrollbar">
                {seasons.map((s) => (
                  <button key={s.season} type="button" onClick={() => setSeason(s.season)} className={`min-h-10 shrink-0 rounded-full px-3 text-[13px] ${active === s.season ? "bg-foreground text-background" : "bg-foreground/[0.06]"}`}>
                    {s.name || `Season ${s.season}`}
                  </button>
                ))}
              </div>
              {eps.loading && !eps.data ? <div className="h-24 animate-pulse rounded-2xl bg-foreground/[0.05]" /> : null}
              <ul className="space-y-2">
                {(eps.data?.episodes || []).map((e, i) => (
                  <li key={`${e.num}-${i}`} className="flex gap-3 rounded-2xl bg-foreground/[0.04] p-2">
                    {e.still ? <Poster src={e.still} alt="" className="h-[64px] w-[114px] shrink-0 rounded-xl" /> : <div className="flex h-[64px] w-[42px] shrink-0 items-center justify-center text-[12px] text-muted-foreground">{e.num ?? ""}</div>}
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-medium leading-tight">{e.num != null ? `${e.num}. ` : ""}{e.name}</div>
                      <div className="mt-0.5 text-[11px] text-muted-foreground">{[e.airDate, runtimeLabel(e.runtime)].filter(Boolean).join(" · ")}</div>
                      {e.overview ? <p className="mt-1 line-clamp-3 text-[12px] leading-relaxed text-foreground/70">{e.overview}</p> : null}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function Hero({ item, onOpen, onTrailer }: { item: Title; onOpen: (t: Title) => void; onTrailer: (t: Title) => void }) {
  return (
    <section className="relative -mx-3 overflow-hidden sm:mx-0 sm:rounded-[28px]" data-testid="tv-hero">
      <div className="relative aspect-[5/4] min-h-[260px] sm:aspect-[21/9] sm:min-h-[320px]">
        <Poster src={item.backdrop || item.poster} alt="" className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/15" />
        <div className="on-media absolute inset-x-0 bottom-0 space-y-2 p-5 text-white sm:max-w-2xl sm:p-8">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/70">Featured</p>
          <h2 className="text-[32px] font-semibold leading-[1.05] tracking-tight text-white sm:text-5xl">{item.title}</h2>
          <p className="line-clamp-3 text-sm leading-relaxed text-white/80">{item.overview}</p>
          <div className="flex flex-wrap gap-2 pt-1">
            <button type="button" onClick={() => onTrailer(item)} className="inline-flex min-h-11 items-center rounded-full bg-white px-5 text-sm font-semibold text-black">Trailer</button>
            <button type="button" onClick={() => onOpen(item)} className="inline-flex min-h-11 items-center rounded-full bg-black/45 px-5 text-sm font-semibold text-white ring-1 ring-white/35 backdrop-blur">Details</button>
          </div>
        </div>
      </div>
    </section>
  );
}

function SearchBar({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <label className="flex flex-1 items-center gap-2 rounded-full bg-foreground/[0.07] px-4 py-2.5 text-[16px] focus-within:ring-2 focus-within:ring-foreground/20">
      <Search className="h-4 w-4 text-muted-foreground" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground/70" />
      {value && <button type="button" onClick={() => onChange("")} aria-label="Clear"><X className="h-4 w-4 text-muted-foreground" /></button>}
    </label>
  );
}

export function Browse({ media, open, onOpen, onPlay }: { media: "all" | "movie" | "tv"; open: Title | null; onOpen: (t: Title | null) => void; onPlay: (i: PlayItem, at?: number) => void }) {
  const home = useTmdb<Home>(catalogPath("home", { media }));
  const genres = useTmdb<GenreList>(media === "all" ? null : catalogPath("genres", { media }));
  const [q, setQ] = useState("");
  const [genre, setGenre] = useState<number | null>(null);
  const dq = useDebounced(q.trim());
  const search = useTmdb<SearchResult>(dq.length >= 2 && !genre ? catalogPath("search", { q: dq, media }) : null);
  const discovered = useTmdb<Discover>(genre ? catalogPath("discover", { media: media === "all" ? "movie" : media, genre }) : null);
  const [trailerFromHero, setTrailerFromHero] = useState(false);

  useEffect(() => { setGenre(null); setQ(""); }, [media]);

  const onTrailer = (t: Title) => { onOpen(t); setTrailerFromHero(true); };
  const openTitle = (t: Title | null) => { setTrailerFromHero(false); onOpen(t); };
  // When opening from the hero Trailer button, the sheet should auto-reveal the trailer once loaded.
  // DetailSheet owns that toggle; we pass a key so it remounts and a hint via session flag is overkill.
  // Instead wrap: if trailerFromHero, a small auto-open child is enough — handled below with a keyed sheet plus hint.

  const configured = home.data?.configured;
  const source = home.data?.source;
  const showNeedKey = home.data && configured === false;
  const items: Title[] | null = genre ? (discovered.data?.items ?? null) : dq.length >= 2 ? (search.data?.items ?? null) : null;
  const searching = genre ? discovered.loading : search.loading;

  return (
    <div className="space-y-10" data-testid={media === "all" ? "tv-home" : media === "movie" ? "tv-movies" : "tv-shows"}>
      {media !== "tv" ? <IptvCatalog kind="vod" onPlay={onPlay} maxRows={media === "all" ? 4 : 8} /> : null}
      {media !== "movie" ? <IptvCatalog kind="series" onPlay={onPlay} maxRows={media === "all" ? 4 : 8} /> : null}

      <div className="space-y-6" data-testid="catalog-extras">
      <h2 className="text-[15px] font-semibold tracking-tight text-muted-foreground">Catalog extras</h2>
      {showNeedKey ? <NeedKey fallback={source === "tvmaze"} /> : null}
      {home.loading && !home.data ? <div className="aspect-[5/4] animate-pulse rounded-[28px] bg-foreground/[0.05] sm:aspect-[21/9]" /> : null}
      {home.error && !home.data ? <CatalogError message={home.error} /> : null}
      {!items && home.data?.hero ? <Hero item={home.data.hero} onOpen={openTitle} onTrailer={onTrailer} /> : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchBar value={q} onChange={(v) => { setQ(v); setGenre(null); }} placeholder={media === "movie" ? "Search movies" : media === "tv" ? "Search shows" : "Search movies and shows"} />
      </div>
      {genres.data?.genres?.length ? (
        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 no-scrollbar" role="listbox" aria-label="Genres">
          <Chip active={genre == null && !dq} onClick={() => { setGenre(null); setQ(""); }}>All</Chip>
          {genres.data.genres.map((g: Genre) => (
            <Chip key={g.id} active={genre === g.id} onClick={() => { setGenre(g.id); setQ(""); }}>{g.name}</Chip>
          ))}
        </div>
      ) : null}

      {items ? (
        searching && !items.length ? (
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5 lg:grid-cols-7">{Array.from({ length: 10 }, (_, i) => <div key={i} className="aspect-[2/3] animate-pulse rounded-2xl bg-foreground/[0.05]" />)}</div>
        ) : !items.length ? (
          <div className="py-10 text-center text-sm text-muted-foreground">No titles match.</div>
        ) : (
          <ul className="grid grid-cols-3 gap-2.5 sm:grid-cols-5 lg:grid-cols-7">
            {items.map((it) => (
              <li key={`${it.media}-${it.id}`}><div className="w-full [&>button]:w-full [&>button]:max-w-none [&>button]:min-w-0"><PosterCard item={it} onOpen={openTitle} /></div></li>
            ))}
          </ul>
        )
      ) : (
        <div className="space-y-7">
          {(home.data?.rows || []).map((row) => <Row key={row.id} title={row.title} items={row.items} onOpen={openTitle} />)}
        </div>
      )}

      {open ? <DetailSheet key={`${open.media}-${open.id}-${trailerFromHero}`} item={open} onClose={() => openTitle(null)} startTrailer={trailerFromHero} /> : null}
      </div>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={`min-h-10 shrink-0 rounded-full px-3.5 text-[13px] ${active ? "bg-foreground text-background" : "bg-foreground/[0.06] text-foreground"}`}>
      {children}
    </button>
  );
}
