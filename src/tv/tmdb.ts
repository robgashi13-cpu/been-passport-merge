import { useEffect, useState } from "react";
import { FN_BASE } from "@/lib/fn";
import { useAuth } from "@/hub/auth";
export { catalogPath, imgUrl, runtimeLabel, youtubeEmbed } from "./tmdb-util";

export const TMDB = `${FN_BASE}/tmdb`;
export const NET_MS = 5000;

export type Media = "movie" | "tv";
export type Title = {
  id: number;
  media: Media;
  title: string;
  overview: string;
  poster: string | null;
  backdrop: string | null;
  rating: number | null;
  year: string | null;
};
export type Genre = { id: number; name: string };
export type Row = { id: string; title: string; items: Title[] };
export type Home = { configured: boolean; source: "tmdb" | "tvmaze" | "none"; hero: Title | null; rows: Row[]; error?: string };
export type SearchResult = { configured: boolean; source: string; items: Title[] };
export type GenreList = { configured: boolean; genres: Genre[] };
export type Discover = { configured: boolean; items: Title[]; page?: number; total?: number };
export type Credit = { id: number; name: string; character: string; photo: string | null };
export type Provider = { id: number; name: string; logo: string | null; type: string };
export type Season = { season: number; name: string; episodeCount?: number; poster: string | null; year: string | null };
export type Episode = { num: number | null; name: string; overview: string; airDate: string | null; still: string | null; runtime: number | null };
export type TitleDetail = Title & {
  configured: boolean;
  source: string;
  runtime: number | null;
  genres: Genre[];
  tagline?: string;
  cast: Credit[];
  trailer: { site: "youtube"; key: string; name: string } | null;
  region: "XK" | "DE" | null;
  providers: Provider[];
  seasons?: Season[];
};
export type SeasonDetail = { season: number; name: string; overview: string; episodes: Episode[] };


const cache = new Map<string, { at: number; v: unknown }>();
const pending = new Map<string, Promise<unknown>>();
const keyOf = (path: string, token: string | null) => `${token}:${path}`;

export function clearTmdbCache() { cache.clear(); pending.clear(); }

export async function tmdbGet<T>(path: string, token: string | null, ttl = 30 * 60e3): Promise<T> {
  if (!token) throw new Error("Sign in to view the catalog");
  const key = keyOf(path, token);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < ttl) return hit.v as T;
  const existing = pending.get(key);
  if (existing) return existing as Promise<T>;
  const request = (async () => {
    const r = await fetch(`${TMDB}/${path}`, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(NET_MS) });
    const v = await r.json().catch(() => ({ error: `HTTP ${r.status}` }));
    if (!r.ok) throw new Error(v?.error || `HTTP ${r.status}`);
    if (cache.size > 80) cache.clear();
    cache.set(key, { at: Date.now(), v });
    return v as T;
  })();
  pending.set(key, request);
  try { return await request; } finally { pending.delete(key); }
}

export function useTmdb<T>(path: string | null, ttl = 30 * 60e3) {
  const { token } = useAuth();
  const hit = path ? cache.get(keyOf(path, token)) : null;
  const [s, setS] = useState<{ data: T | null; error: string | null; loading: boolean }>({
    data: hit ? hit.v as T : null,
    error: null,
    loading: !!path && !hit,
  });
  useEffect(() => {
    if (!path || !token) { setS({ data: null, error: null, loading: false }); return; }
    let alive = true;
    const cached = cache.get(keyOf(path, token));
    setS({ data: cached ? cached.v as T : null, error: null, loading: !cached });
    tmdbGet<T>(path, token, ttl)
      .then((d) => alive && setS({ data: d, error: null, loading: false }))
      .catch((e) => alive && setS({ data: cached ? cached.v as T : null, error: String(e.message || e), loading: false }));
    return () => { alive = false; };
  }, [path, token, ttl]);
  return s;
}
