import { useEffect, useMemo, useState } from "react";
import { Play, Search, Star, Tv, X } from "lucide-react";
import { useAuth } from "@/hub/auth";
import { usePref } from "@/hub/prefs";
import {
  cleanName, hhmm, prefetchPlay, tvGet, useFavs, useTv,
  type Cat, type Epg, type Live, type PlayItem,
} from "./api";

// Albania / USA / UK categories first, then alphabetical (mirrors the server sort).
const CAT_RANK = [/\b(albania|shqip|albanian|kosov|xk)\b/i, /\b(usa|united states|us[:\s|])/i, /\b(uk|united kingdom|britain|british)\b/i];
const catRank = (n: string) => { const i = CAT_RANK.findIndex((r) => r.test(n)); return i === -1 ? 9 : i; };
const sortCats = (list: Cat[]) => [...list].sort((a, b) => catRank(a.name) - catRank(b.name) || a.name.localeCompare(b.name));

function useDebounced<T>(v: T, ms = 350) {
  const [d, setD] = useState(v);
  useEffect(() => { const t = setTimeout(() => setD(v), ms); return () => clearTimeout(t); }, [v, ms]);
  return d;
}

/** Bumping the key forces every list to refetch from the server with fresh data. */
function useRefreshKey() {
  const [key, setKey] = useState(0);
  return [key, () => setKey((k) => k + 1)] as const;
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
    <label className="flex flex-1 items-center gap-2 rounded-full bg-foreground/[0.07] px-4 py-2.5 text-[16px] focus-within:ring-2 focus-within:ring-primary/40">
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
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-full bg-foreground/[0.07] px-4 py-2.5 text-[16px] md:hidden" aria-label="Category">
        {cats.map((c) => <option key={c.id} value={c.id}>{cleanName(c.name)}</option>)}
      </select>
      <div className="hidden md:block">
        <input value={f} onChange={(e) => setF(e.target.value)} placeholder={`Filter ${cats.length} categories`} className="mb-2 w-full rounded-xl bg-foreground/[0.07] px-3 py-2 text-[13px] outline-none placeholder:text-white/55" />
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
export function LiveSection({ onPlay, refreshKey }: { onPlay: (i: PlayItem) => void; refreshKey: number }) {
  const { token } = useAuth();
  const rawCats = useTv<Cat[]>(`live/categories${refreshKey ? "?refresh=1" : ""}`, 30 * 60e3);
  const cats = useMemo(() => (rawCats.data ? { ...rawCats, data: sortCats(rawCats.data) } : rawCats), [rawCats]);
  const [cat, setCat] = usePref<string>("tv_live_cat", "");
  const [q, setQ] = useState("");
  const dq = useDebounced(q.trim());
  const [limit, setLimit] = useState(60);
  const activeCat = cat || cats.data?.[0]?.id || "";
  const list = useTv<Live[]>(dq.length >= 2 ? `search?type=live&q=${encodeURIComponent(dq)}` : activeCat ? `live/streams?category=${activeCat}${refreshKey ? "&refresh=1" : ""}` : null);
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
                  <div className="group flex items-center gap-3 rounded-2xl bg-foreground/[0.045] p-2">
                    <button onPointerDown={() => prefetchPlay({ kind: "live", id: c.id, name: cleanName(c.name), logo: c.logo, sub: cur?.title }, token)} onClick={() => onPlay({ kind: "live", id: c.id, name: cleanName(c.name), logo: c.logo, sub: cur?.title })} className="flex min-w-0 flex-1 items-center gap-3 text-left" aria-label={`Play ${cleanName(c.name)}`}>
                      <Logo src={c.logo} className="h-10 w-14 shrink-0 rounded-lg bg-foreground/[0.06] p-1" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{cleanName(c.name)}</div>
                        {cur ? (
                          <>
                            <div className="truncate text-xs text-white/70"><span className="text-rose-300">Now</span> {cur.title}</div>
                            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-sky" style={{ width: `${pct}%` }} /></div>
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
          <div className="mt-3 text-center"><button onClick={() => setLimit((l) => l + 60)} className="hq-btn" data-tone="plain">Show more ({(list.data?.length || 0) - limit})</button></div>
        )}
      </section>
    </div>
  );
}


export { useRefreshKey };
