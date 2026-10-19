import { useEffect, useState } from "react";
import { FN_BASE } from "@/lib/fn";
import { useAuth } from "@/hub/auth";
import { usePref } from "@/hub/prefs";

/** Private IPTV API (edge function `iptv`). Provider credentials never reach the browser. */
export const TV = `${FN_BASE}/iptv`;

export type Cat = { id: string; name: string };
export type Live = { id: number; name: string; logo: string | null; cat: string; epg: string | null; archive: boolean };
export type Vod = { id: number; name: string; logo: string | null; cat: string; rating: number | null; ext: string; added: number | null };
export type Series = { id: number; name: string; logo: string | null; cat: string; rating: number | null; year: string | null; plot: string | null };
export type Epg = { title: string; start: number; end: number };
export type Status = {
  configured: boolean;
  ok?: boolean;
  error?: string;
  mediaProxy?: "home" | "cloud";
  status?: string;
  exp?: number | null;
  maxConnections?: number | null;
  activeCons?: number;
};

export type Kind = "live" | "movie" | "series";
export type PlayItem = { kind: Kind; id: number; name: string; logo: string | null; ext?: string; sub?: string; seriesId?: number };
export type Fav = { kind: Kind; id: number; name: string; logo: string | null; ext?: string };
export type Hist = PlayItem & { pos: number; dur: number; at: number };

const cache = new Map<string, { at: number; v: unknown }>();
const pending = new Map<string, Promise<unknown>>();
const cacheKey = (path: string, token: string | null) => `${token}:${path}`;

/** Drop every cached response so the next load pulls fresh data. */
export function clearTvCache() { cache.clear(); pending.clear(); }

export async function tvGet<T>(path: string, token: string | null, ttl = 5 * 60e3): Promise<T> {
  if (!token) throw new Error("Sign in to view TV");
  const key = cacheKey(path, token);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < ttl) return hit.v as T;
  const existing = pending.get(key);
  if (existing) return existing as Promise<T>;
  const request = (async () => {
    const r = await fetch(`${TV}/${path}`, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(30000) });
    const v = await r.json().catch(() => ({ error: `HTTP ${r.status}` }));
    if (!r.ok) throw new Error(v?.error || `HTTP ${r.status}`);
    if (cache.size > 100) cache.clear();
    cache.set(key, { at: Date.now(), v });
    return v as T;
  })();
  pending.set(key, request);
  try { return await request; } finally { pending.delete(key); }
}

export function useTv<T>(path: string | null, ttl = 5 * 60e3) {
  const { token } = useAuth();
  const hit = path ? cache.get(cacheKey(path, token)) : null;
  const [s, setS] = useState<{ data: T | null; error: string | null; loading: boolean }>({ data: hit ? hit.v as T : null, error: null, loading: !!path && !hit });
  useEffect(() => {
    if (!path || !token) { setS({ data: null, error: null, loading: false }); return; }
    let alive = true;
    const hit = cache.get(cacheKey(path, token));
    setS({ data: hit ? hit.v as T : null, error: null, loading: !hit });
    tvGet<T>(path, token, ttl)
      .then((d) => alive && setS({ data: d, error: null, loading: false }))
      .catch((e) => alive && setS({ data: null, error: String(e.message || e), loading: false }));
    return () => { alive = false; };
  }, [path, token, ttl]);
  return s;
}

/** Opaque URLs stay in memory, scoped to the current session. */
export async function playUrl(item: PlayItem, token: string | null, download = false, hls = false) {
  const q = new URLSearchParams({ kind: item.kind, id: String(item.id) });
  if (item.ext) q.set("ext", item.ext);
  if (download) q.set("download", item.name);
  if (hls && !download) q.set("hls", "1");
  // Cache play URLs for 5 min so reopening a channel starts instantly.
  const d = await tvGet<{ path?: string; base?: string; type: "hls" | "file"; error?: string }>(`play?${q}`, token, download ? 30000 : 5 * 60e3);
  if (!d.path) throw new Error(d.error || "Playback unavailable");
  return { url: `${d.base || TV}/${d.path}`, type: d.type, home: !!d.base };
}

export function useFavs() {
  const [favs, setFavs] = usePref<Fav[]>("tv_favorites", []);
  const isFav = (kind: Kind, id: number) => favs.some((f) => f.kind === kind && f.id === id);
  const toggle = (f: Fav) =>
    setFavs((p) => (p.some((x) => x.kind === f.kind && x.id === f.id) ? p.filter((x) => !(x.kind === f.kind && x.id === f.id)) : [f, ...p].slice(0, 200)));
  return { favs, isFav, toggle };
}

export function useHistory() {
  const [hist, setHist] = usePref<Hist[]>("tv_history", []);
  const record = (h: Hist) =>
    setHist((p) => [h, ...p.filter((x) => !(x.kind === h.kind && x.id === h.id))].slice(0, 40), { delay: 3000 });
  const remove = (h: Hist) => setHist((p) => p.filter((x) => !(x.kind === h.kind && x.id === h.id)));
  return { hist, record, remove };
}

export const cleanName = (n: string) => n.replace(/[ᴬ-ᵡ⁰-⁹¹²³ʰᵉᵛᶜ▶▼#]+/g, "").replace(/\s{2,}/g, " ").trim();
export const hhmm = (sec: number) => new Date(sec * 1000).toLocaleTimeString("en-GB", { timeZone: "Europe/Belgrade", hour: "2-digit", minute: "2-digit" });
