// @ts-nocheck
// TMDB v3 proxy (private: signed-in + allowlisted). Responses are cached for 6 hours.
// Secret name in Lovable Secrets: TMDB_API_KEY. The key is never sent to the browser.
import { guarded, subPath } from '../_shared/guard.ts';

const TMDB = 'https://api.themoviedb.org/3';
const IMG = 'https://image.tmdb.org/t/p/';
const TVMAZE = 'https://api.tvmaze.com';
const TTL = 6 * 60 * 60 * 1000;
const cache = new Map();

const json = (v, status = 200, age = 0) =>
  Response.json(v, {
    status,
    headers: { 'cache-control': age ? `private, max-age=${age}` : 'no-store' },
  });

function key() {
  return (Deno.env.get('TMDB_API_KEY') || '').trim();
}

function img(path, size) {
  if (!path) return null;
  if (String(path).startsWith('http')) return path;
  return `${IMG}${size}${path}`;
}

function year(s) {
  return s ? String(s).slice(0, 4) : null;
}

function card(x, media) {
  const m = media || (x.media_type === 'tv' ? 'tv' : x.media_type === 'movie' ? 'movie' : x.title ? 'movie' : 'tv');
  if (x.media_type === 'person' || !x.id) return null;
  return {
    id: x.id,
    media: m,
    title: x.title || x.name || '',
    overview: x.overview || '',
    poster: img(x.poster_path, 'w342'),
    backdrop: img(x.backdrop_path, 'w1280'),
    rating: typeof x.vote_average === 'number' ? Math.round(x.vote_average * 10) / 10 : null,
    year: year(x.release_date || x.first_air_date),
  };
}

function cards(list, media) {
  return (list || []).map((x) => card(x, media)).filter(Boolean);
}

async function tmdb(k, path, params = {}) {
  const u = new URL(`${TMDB}/${path.replace(/^\/+/, '')}`);
  for (const [a, b] of Object.entries(params)) if (b != null && b !== '') u.searchParams.set(a, String(b));
  u.searchParams.set('api_key', k);
  const r = await fetch(u, { signal: AbortSignal.timeout(8000) });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) {
    const err = new Error('tmdb');
    err.status = r.status;
    throw err;
  }
  return body;
}

async function cached(ck, fn) {
  const hit = cache.get(ck);
  if (hit && hit.exp > Date.now()) return hit.v;
  const v = await fn();
  if (cache.size > 200) cache.clear();
  cache.set(ck, { exp: Date.now() + TTL, v });
  return v;
}

const MOVIE_GENRES = [
  { id: 28, name: 'Action' },
  { id: 35, name: 'Comedy' },
  { id: 18, name: 'Drama' },
  { id: 27, name: 'Horror' },
  { id: 878, name: 'Science Fiction' },
  { id: 16, name: 'Animation' },
  { id: 99, name: 'Documentary' },
];
const TV_GENRES = [
  { id: 10759, name: 'Action & Adventure' },
  { id: 35, name: 'Comedy' },
  { id: 18, name: 'Drama' },
  { id: 80, name: 'Crime' },
  { id: 10765, name: 'Sci-Fi & Fantasy' },
  { id: 16, name: 'Animation' },
  { id: 99, name: 'Documentary' },
];

async function home(k, media) {
  const rows = [];
  let hero = null;
  if (media === 'all' || media === 'movie') {
    const [trend, popular, top] = await Promise.all([
      tmdb(k, media === 'movie' ? 'trending/movie/week' : 'trending/all/week'),
      tmdb(k, 'movie/popular'),
      tmdb(k, 'movie/top_rated'),
    ]);
    const trending = cards(trend.results, media === 'movie' ? 'movie' : undefined);
    hero = trending.find((x) => x.backdrop && x.overview) || trending[0] || null;
    rows.push({ id: 'trending', title: media === 'movie' ? 'Trending movies' : 'Trending', items: trending });
    rows.push({ id: 'popular-movies', title: 'Popular movies', items: cards(popular.results, 'movie') });
    rows.push({ id: 'top-movies', title: 'Top rated movies', items: cards(top.results, 'movie') });
    for (const g of MOVIE_GENRES.slice(0, 4)) {
      const d = await tmdb(k, 'discover/movie', { with_genres: g.id, sort_by: 'popularity.desc' });
      rows.push({ id: `movie-${g.id}`, title: g.name, items: cards(d.results, 'movie') });
    }
  }
  if (media === 'all' || media === 'tv') {
    const [trend, popular, top] = await Promise.all([
      media === 'tv' ? tmdb(k, 'trending/tv/week') : Promise.resolve({ results: [] }),
      tmdb(k, 'tv/popular'),
      tmdb(k, 'tv/top_rated'),
    ]);
    if (media === 'tv') {
      const trending = cards(trend.results, 'tv');
      hero = trending.find((x) => x.backdrop && x.overview) || trending[0] || hero;
      rows.unshift({ id: 'trending', title: 'Trending shows', items: trending });
    }
    rows.push({ id: 'popular-tv', title: 'Popular shows', items: cards(popular.results, 'tv') });
    rows.push({ id: 'top-tv', title: 'Top rated shows', items: cards(top.results, 'tv') });
    for (const g of TV_GENRES.slice(0, 3)) {
      const d = await tmdb(k, 'discover/tv', { with_genres: g.id, sort_by: 'popularity.desc' });
      rows.push({ id: `tv-${g.id}`, title: g.name, items: cards(d.results, 'tv') });
    }
  }
  return { configured: true, source: 'tmdb', hero, rows };
}

function trailerOf(videos) {
  const list = (videos?.results || []).filter((v) => v.site === 'YouTube' && v.key);
  const official = list.find((v) => v.type === 'Trailer' && v.official) || list.find((v) => v.type === 'Trailer') || list[0];
  return official ? { site: 'youtube', key: official.key, name: official.name || 'Trailer' } : null;
}

function providersOf(block) {
  const results = block?.results || {};
  const region = results.XK ? 'XK' : results.DE ? 'DE' : null;
  const pack = (region && results[region]) || {};
  const out = [];
  const seen = new Set();
  for (const typ of ['flatrate', 'free', 'ads', 'rent', 'buy']) {
    for (const p of pack[typ] || []) {
      if (seen.has(p.provider_id)) continue;
      seen.add(p.provider_id);
      out.push({ id: p.provider_id, name: p.provider_name, logo: img(p.logo_path, 'w92'), type: typ });
    }
  }
  return { region, providers: out };
}

async function title(k, media, id) {
  const path = media === 'tv' ? `tv/${id}` : `movie/${id}`;
  const d = await tmdb(k, path, { append_to_response: 'videos,credits,watch/providers' });
  const base = card(d, media);
  const { region, providers } = providersOf(d['watch/providers']);
  const runtime = media === 'movie'
    ? (d.runtime || null)
    : (Array.isArray(d.episode_run_time) && d.episode_run_time[0]) || d.last_episode_to_air?.runtime || null;
  return {
    configured: true,
    source: 'tmdb',
    ...base,
    runtime,
    genres: (d.genres || []).map((g) => ({ id: g.id, name: g.name })),
    tagline: d.tagline || '',
    cast: (d.credits?.cast || []).slice(0, 14).map((c) => ({
      id: c.id,
      name: c.name,
      character: c.character || '',
      photo: img(c.profile_path, 'w185'),
    })),
    trailer: trailerOf(d.videos),
    region,
    providers,
    seasons: media === 'tv'
      ? (d.seasons || [])
        .filter((s) => s.season_number >= 0)
        .map((s) => ({
          season: s.season_number,
          name: s.name,
          episodeCount: s.episode_count,
          poster: img(s.poster_path, 'w185'),
          year: year(s.air_date),
        }))
      : undefined,
  };
}

async function season(k, id, n) {
  const d = await tmdb(k, `tv/${id}/season/${n}`);
  return {
    configured: true,
    source: 'tmdb',
    season: d.season_number,
    name: d.name,
    overview: d.overview || '',
    episodes: (d.episodes || []).map((e) => ({
      num: e.episode_number,
      name: e.name,
      overview: e.overview || '',
      airDate: e.air_date || null,
      still: img(e.still_path, 'w300'),
      runtime: e.runtime || null,
    })),
  };
}

function mazeCard(s) {
  const show = s.show || s;
  if (!show?.id) return null;
  return {
    id: show.id,
    media: 'tv',
    title: show.name || '',
    overview: (show.summary || '').replace(/<[^>]+>/g, ''),
    poster: show.image?.medium || show.image?.original || null,
    backdrop: show.image?.original || show.image?.medium || null,
    rating: typeof show.rating?.average === 'number' ? show.rating.average : null,
    year: year(show.premiered),
  };
}

async function maze(path) {
  const r = await fetch(`${TVMAZE}/${path.replace(/^\/+/, '')}`, { signal: AbortSignal.timeout(8000) });
  if (!r.ok) throw new Error('tvmaze');
  return r.json();
}

async function mazeHome() {
  const shows = await maze('shows?page=0');
  const items = shows.slice(0, 40).map(mazeCard).filter(Boolean);
  const hero = items.find((x) => x.backdrop && x.overview) || items[0] || null;
  const byGenre = {};
  for (const s of shows.slice(0, 80)) {
    for (const g of s.genres || []) {
      (byGenre[g] ||= []).push(mazeCard(s));
    }
  }
  const rows = [
    { id: 'trending', title: 'Popular shows', items },
    ...Object.entries(byGenre).slice(0, 4).map(([name, list]) => ({
      id: `g-${name}`,
      title: name,
      items: list.filter(Boolean).slice(0, 20),
    })),
  ];
  return { configured: false, source: 'tvmaze', hero, rows };
}

async function mazeTitle(id) {
  const d = await maze(`shows/${id}?embed[]=cast&embed[]=seasons`);
  const base = mazeCard(d);
  return {
    configured: false,
    source: 'tvmaze',
    ...base,
    runtime: d.runtime || d.averageRuntime || null,
    genres: (d.genres || []).map((name, i) => ({ id: i + 1, name })),
    tagline: '',
    cast: (d._embedded?.cast || []).slice(0, 14).map((c, i) => ({
      id: c.person?.id || i,
      name: c.person?.name || '',
      character: c.character?.name || '',
      photo: c.person?.image?.medium || null,
    })),
    trailer: null,
    region: null,
    providers: [],
    seasons: (d._embedded?.seasons || []).map((s) => ({
      season: s.number,
      name: s.name || `Season ${s.number}`,
      episodeCount: s.episodeOrder,
      poster: s.image?.medium || null,
      year: year(s.premiereDate),
    })),
  };
}

async function mazeSeason(id, n) {
  const all = await maze(`shows/${id}/episodes`);
  const list = (all || []).filter((e) => e.season === Number(n));
  return {
    configured: false,
    source: 'tvmaze',
    season: Number(n),
    name: `Season ${n}`,
    overview: '',
    episodes: list.map((e) => ({
      num: e.number,
      name: e.name,
      overview: (e.summary || '').replace(/<[^>]+>/g, ''),
      airDate: e.airdate || null,
      still: e.image?.medium || null,
      runtime: e.runtime || null,
    })),
  };
}

function mediaOf(u, fallback = 'all') {
  const m = u.searchParams.get('media') || fallback;
  return m === 'movie' || m === 'tv' || m === 'all' ? m : fallback;
}

function intOf(v, min, max) {
  const n = Number(v);
  if (!Number.isInteger(n) || n < min || n > max) return null;
  return n;
}

Deno.serve(guarded(async (req) => {
  const u = new URL(req.url);
  const path = subPath(req, 'tmdb');
  const k = key();
  const ck = `${path}?${u.search}`;

  if (path === '' || path === 'status') {
    return json({ configured: !!k, fallback: k ? null : 'tvmaze' });
  }

  try {
    if (!k) {
      if (path === 'home') {
        const media = mediaOf(u);
        if (media === 'movie') return json({ configured: false, source: 'none', hero: null, rows: [] }, 200, 300);
        return json(await cached(`maze:home`, mazeHome), 200, 21600);
      }
      if (path === 'search') {
        const q = (u.searchParams.get('q') || '').trim().slice(0, 80);
        if (q.length < 2) return json({ configured: false, source: 'tvmaze', items: [] });
        const data = await cached(`maze:search:${q.toLowerCase()}`, () => maze(`search/shows?q=${encodeURIComponent(q)}`));
        return json({ configured: false, source: 'tvmaze', items: data.map(mazeCard).filter(Boolean) }, 200, 21600);
      }
      if (path === 'genres') return json({ configured: false, source: 'tvmaze', genres: [] });
      if (path === 'title') {
        const id = intOf(u.searchParams.get('id'), 1, 1e9);
        if (!id) return json({ error: 'Not found' }, 400);
        return json(await cached(`maze:title:${id}`, () => mazeTitle(id)), 200, 21600);
      }
      if (path === 'season') {
        const id = intOf(u.searchParams.get('id'), 1, 1e9);
        const n = intOf(u.searchParams.get('season'), 0, 80);
        if (!id || n == null) return json({ error: 'Not found' }, 400);
        return json(await cached(`maze:season:${id}:${n}`, () => mazeSeason(id, n)), 200, 21600);
      }
      return json({ configured: false, source: 'none', items: [] });
    }

    const v = await cached(ck, async () => {
      if (path === 'home') return home(k, mediaOf(u));
      if (path === 'search') {
        const q = (u.searchParams.get('q') || '').trim().slice(0, 80);
        const media = mediaOf(u, 'all');
        if (q.length < 2) return { configured: true, source: 'tmdb', items: [] };
        const endpoint = media === 'movie' ? 'search/movie' : media === 'tv' ? 'search/tv' : 'search/multi';
        const d = await tmdb(k, endpoint, { query: q, include_adult: 'false' });
        const items = cards(d.results, media === 'all' ? undefined : media).filter((x) => x.media === 'movie' || x.media === 'tv');
        return { configured: true, source: 'tmdb', items };
      }
      if (path === 'genres') {
        const media = mediaOf(u, 'movie') === 'tv' ? 'tv' : 'movie';
        const d = await tmdb(k, `genre/${media}/list`);
        return { configured: true, source: 'tmdb', genres: d.genres || (media === 'tv' ? TV_GENRES : MOVIE_GENRES) };
      }
      if (path === 'discover') {
        const media = mediaOf(u, 'movie') === 'tv' ? 'tv' : 'movie';
        const genre = intOf(u.searchParams.get('genre'), 1, 1e6);
        const page = intOf(u.searchParams.get('page'), 1, 20) || 1;
        const d = await tmdb(k, `discover/${media}`, { with_genres: genre || undefined, page, sort_by: 'popularity.desc' });
        return { configured: true, source: 'tmdb', page, total: d.total_pages, items: cards(d.results, media) };
      }
      if (path === 'title') {
        const media = mediaOf(u, 'movie') === 'tv' ? 'tv' : 'movie';
        const id = intOf(u.searchParams.get('id'), 1, 1e9);
        if (!id) throw Object.assign(new Error('bad id'), { status: 400 });
        return title(k, media, id);
      }
      if (path === 'season') {
        const id = intOf(u.searchParams.get('id'), 1, 1e9);
        const n = intOf(u.searchParams.get('season'), 0, 80);
        if (!id || n == null) throw Object.assign(new Error('bad id'), { status: 400 });
        return season(k, id, n);
      }
      return { error: 'Not found' };
    });
    if (v?.error === 'Not found') return json(v, 404);
    return json(v, 200, 21600);
  } catch (e) {
    if (e?.status === 401 || e?.status === 403) return json({ configured: true, error: 'TMDB rejected the request' }, 502);
    if (e?.status === 400) return json({ error: 'Not found' }, 400);
    return json({ error: 'Catalog unavailable' }, 502);
  }
}));
