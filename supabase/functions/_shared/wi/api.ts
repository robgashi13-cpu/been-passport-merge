// @ts-nocheck
// The /api/* surface of the original Express server, served from api_cache. Every route requires a valid session token.
import { getRow, getRows, db, putRow } from './cache.ts';
import { verifyToken } from './auth.ts';
import { fetchArticleMeta, articleUrlOk } from './article.ts';
import { REGIONS, COUNTRY_NAMES } from './geo.ts';
import { NEWS } from './news-config.ts';
import { LABELS, refreshQuakes, refreshEonet, refreshGdacs, refreshNws, refreshKev, refreshPolymarket, refreshManifold, refreshNhc, refreshRisk, xSearch, ytLive } from './sources.ts';
import channels from '../data/channels.json' with { type: 'json' };
import webcams from '../data/webcams.json' with { type: 'json' };

const json = (v, status = 200) => Response.json(v, { status, headers: { 'Cache-Control': 'no-store' } });
const LAZY = { usgs: refreshQuakes, eonet: refreshEonet, gdacs: refreshGdacs, nws: refreshNws, kev: refreshKev, polymarket: refreshPolymarket, manifold: refreshManifold, nhc: refreshNhc, risk: refreshRisk };

/** Read a cached source; if it has never been fetched (cron not yet run), fetch it once inline. */
async function src(key) {
  let r = await getRow(key);
  if (!r?.payload && LAZY[key]) { await LAZY[key](); r = await getRow(key); }
  return r?.payload ? (r.status === 'degraded' ? { ...r.payload, stale: true } : r.payload) : { items: [] };
}

async function threat() {
  const stats = structuredClone((await getRow('gdelt:stats'))?.payload || {});
  for (const s of Object.values(stats)) s.score = s.conflict * 3 + s.attack * 2 + s.military + s.protest * 0.5 + s.unrest * 0.5;
  const g = await src('gdacs');
  for (const a of g.items) if (a.country && a.severity >= 2) { const s = (stats[a.country] ||= { country: a.country, region: a.region, conflict: 0, attack: 0, protest: 0, unrest: 0, military: 0, total: 0, hourly: Array(24).fill(0), score: 0 }); s.disaster = (s.disaster || 0) + 1; s.score += a.severity === 3 ? 25 : 8; }
  const arr = Object.values(stats);
  const max = Math.max(1, ...arr.map((s) => s.score));
  for (const s of arr) { s.index = Math.round(100 * Math.sqrt(s.score / max)); s.level = s.index >= 75 ? 'CRITICAL' : s.index >= 50 ? 'HIGH' : s.index >= 25 ? 'ELEVATED' : 'GUARDED'; s.name = COUNTRY_NAMES[s.country] || s.country; }
  const regions = {};
  for (const [id, r] of Object.entries(REGIONS)) {
    const cs = arr.filter((s) => r.countries.includes(s.country));
    const tot = cs.reduce((a, s) => a + s.score, 0);
    regions[id] = { id, name: r.name, score: tot, conflict: cs.reduce((a, s) => a + s.conflict + s.attack, 0), protest: cs.reduce((a, s) => a + s.protest, 0), top: cs.sort((a, b) => b.score - a.score).slice(0, 5).map((s) => s.country) };
  }
  const rmax = Math.max(1, ...Object.values(regions).map((r) => r.score));
  for (const r of Object.values(regions)) { r.index = Math.round(100 * Math.sqrt(r.score / rmax)); r.level = r.index >= 75 ? 'CRITICAL' : r.index >= 50 ? 'HIGH' : r.index >= 25 ? 'ELEVATED' : 'GUARDED'; }
  const globalIdx = Math.round(Object.values(regions).reduce((a, r) => a + r.index, 0) / Object.keys(regions).length);
  return { countries: arr.sort((a, b) => b.score - a.score), regions, global: globalIdx, window: '24h', method: 'GDELT 2.0 CAMEO event counts (fighting×3, attacks×2, military posture×1, protest/repression×0.5) + GDACS orange/red alerts, normalised 0–100 (sqrt). Reporting volume, not casualties.', updated: new Date().toISOString() };
}

const gdeltWin = (hours) => (hours <= 1 ? 1 : hours <= 6 ? 6 : 24);
async function gdelt(hours, limit) {
  const p = (await getRow('gdelt:' + gdeltWin(hours)))?.payload || { items: [], updated: null };
  return { items: p.items.slice(0, limit), updated: p.updated, window_h: hours };
}

async function news(scope) {
  const cfg = NEWS[scope];
  if (!cfg) return json({ error: 'unknown scope' }, 400);
  await putRow('newsreq:' + scope, { payload: null, ttl_seconds: 3600, status: 'ok', error: null, meta: { internal: true } }).catch(() => {});
  const x = await xSearch(scope).catch(() => null);
  const keys = (cfg.rss || []).map(([, u]) => 'rss:' + u);
  if (scope !== 'world' || !x) keys.push('gdeltdoc:' + scope);
  const rows = await getRows(keys);
  const errors = [];
  const lists = [x?.items || []];
  for (const k of keys) { const r = rows[k]; if (r?.payload?.items) lists.push(r.payload.items); if (r?.status === 'down' || r?.status === 'degraded') errors.push(r.error); }
  const seen = new Set();
  const items = lists.flat().filter((i) => i.time && !Number.isNaN(Date.parse(i.time)) && !seen.has(i.url) && seen.add(i.url)).sort((a, b) => b.time.localeCompare(a.time)).slice(0, 120);
  return json({ scope, name: cfg.name, xEnabled: !!x, items, errors: errors.filter(Boolean).slice(0, 5), updated: new Date().toISOString() });
}

async function status() {
  const s = await db();
  const ids = [...Object.keys(LABELS), 'x-api'];
  const [{ data: a }, { data: b }] = await Promise.all([
    s.from('api_cache').select('key,status,error,meta,updated_at,ttl_seconds').in('key', ids),
    s.from('api_cache').select('key,status,error,meta,updated_at,ttl_seconds').like('key', 'rss:%'),
  ]);
  const byKey = Object.fromEntries([...(a || []), ...(b || [])].map((r) => [r.key, r]));
  const now = Date.now();
  const row = (id, label, r) => {
    if (!r) return { id, label, state: 'pending' };
    let state = r.status, error = r.error;
    if (state === 'ok' && now - Date.parse(r.updated_at) > (r.ttl_seconds * 3 + 180) * 1000) { state = 'degraded'; error = 'stale — scheduled refresh not running'; }
    return { id, label, state, error, lastOk: r.meta?.lastOk, lastError: r.meta?.lastError, latencyMs: r.meta?.latencyMs, count: r.meta?.count ?? null, files: r.meta?.files, latestExport: r.meta?.latestExport };
  };
  const sources = Object.entries(LABELS).map(([id, label]) => (id === 'youtube-live' && !byKey[id] ? { id, label, state: 'pending' } : row(id, label, byKey[id])));
  const xOn = !!Deno.env.get('X_BEARER_TOKEN');
  sources.push(xOn ? { ...row('x-api', 'X API v2 (paid)', byKey['x-api']), requestsMade: byKey['x-api']?.meta?.requestsMade } : { id: 'x-api', label: 'X API v2 (paid)', state: 'disabled', error: 'X_BEARER_TOKEN not set — using free GDELT/RSS' });
  sources.push({ id: 'windy', label: 'Windy Webcams', state: 'disabled', error: 'WINDY_API_KEY not set' });
  sources.push({ id: 'reliefweb', label: 'ReliefWeb', state: 'disabled', error: 'RELIEFWEB_APPNAME (approved appname) not set' });
  for (const r of b || []) sources.push(row(r.meta?.label || r.key, (r.meta?.label || r.key).slice(4), r));
  return json({ sources, serverTime: new Date().toISOString() });
}

let hostCache = null;
async function iptvHosts() {
  if (hostCache && Date.now() - hostCache.t < 600e3) return hostCache.set;
  hostCache = { set: new Set((await getRow('iptv:hosts'))?.payload || []), t: Date.now() };
  return hostCache.set;
}
const API_PREFIX = (Deno.env.get('SUPABASE_URL') || '').replace(/\/+$/, '') + '/functions/v1/wi-api';

async function hlsProxy(url, token) {
  const target = url.searchParams.get('u') || '';
  let u; try { u = new URL(target); } catch { return new Response('bad url', { status: 400 }); }
  if (!/^https?:$/.test(u.protocol)) return new Response('bad protocol', { status: 400 });
  const rq = url.searchParams.get('r');
  const root = rq ? (() => { try { return new URL(rq).host; } catch { return null; } })() : u.host;
  const hosts = await iptvHosts();
  if (!hosts.has(u.host) && !hosts.has(root)) return new Response('host not in iptv-org list', { status: 403 });
  const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), 15000);
  try {
    const r = await fetch(u, { signal: ctl.signal, headers: { 'User-Agent': 'Mozilla/5.0' }, redirect: 'follow' });
    if (!r.ok) return new Response('upstream ' + r.status, { status: r.status });
    const ct = r.headers.get('content-type') || '';
    const finalUrl = r.url || u.href;
    if (/mpegurl|m3u/i.test(ct) || /\.m3u8?(\?|$)/i.test(u.pathname)) {
      const text = await r.text();
      const rootParam = encodeURIComponent(rq || u.href);
      const rew = (x) => `${API_PREFIX}/tv/hls?u=${encodeURIComponent(new URL(x, finalUrl).href)}&r=${rootParam}&t=${encodeURIComponent(token)}`;
      const out = text.split('\n').map((line) => {
        const l = line.trim();
        if (!l) return line;
        if (l.startsWith('#')) return line.replace(/URI="([^"]+)"/g, (_, x) => `URI="${rew(x)}"`);
        return rew(l);
      }).join('\n');
      return new Response(out, { headers: { 'Content-Type': 'application/vnd.apple.mpegurl', 'Cache-Control': 'no-cache' } });
    }
    return new Response(await r.arrayBuffer(), { headers: { 'Content-Type': ct || 'video/mp2t', 'Cache-Control': 'private, max-age=30' } });
  } catch { return new Response('proxy error', { status: 502 }); } finally { clearTimeout(tm); }
}

// "What happened" preview for GDELT dots: source article title + og/meta description, cached in public.article_meta (no AI).
async function article(url) {
  if (!articleUrlOk(url)) return { ok: false, error: 'url not allowed' };
  const s = await db();
  const { data: hit } = await s.from('article_meta').select('data, fetched_at').eq('url', url).maybeSingle();
  if (hit && Date.now() - Date.parse(hit.fetched_at) < (hit.data?.ok ? 7 * 86400e3 : 1800e3)) return hit.data;
  let v;
  try { v = await fetchArticleMeta(url); } catch (e) { v = { ok: false, error: String(e?.message || e).slice(0, 120) }; }
  await s.from('article_meta').upsert({ url, data: v, fetched_at: new Date().toISOString() });
  return v;
}

export async function handleApi(request, splat) {
  const url = new URL(request.url);
  const path = '/' + String(splat || '').replace(/^\/+/, '');
  const bearer = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const token = bearer || (path === '/tv/hls' ? url.searchParams.get('t') || '' : '');
  if (!(await verifyToken(token))) return json({ error: 'Unauthorized' }, 401);
  const q = (k) => url.searchParams.get(k);
  try {
    switch (path) {
      case '/health': return json({ ok: true, time: new Date().toISOString() });
      case '/status': return await status();
      case '/meta': return json({ regions: REGIONS, countryNames: COUNTRY_NAMES, newsScopes: Object.fromEntries(Object.entries(NEWS).map(([k, v]) => [k, { name: v.name, x: v.x, rss: v.rss.map((r) => r[0]) }])),
        xEnabled: !!Deno.env.get('X_BEARER_TOKEN'), windyEnabled: false, newsRefreshSec: 300, xCacheSec: Math.max(300, Number(Deno.env.get('X_CACHE_SECONDS') || 600)) });
      case '/quakes': return json(await src('usgs'));
      case '/eonet': return json(await src('eonet'));
      case '/gdacs': return json(await src('gdacs'));
      case '/nws': return json(await src('nws'));
      case '/kev': return json(await src('kev'));
      case '/article': return json(await article(String(q('url') || '')));
      case '/gdelt': return json(await gdelt(Math.min(24, Number(q('hours') || 6)), Math.min(4000, Number(q('limit') || 1500))));
      case '/events': {
        const hours = Math.min(24, Number(q('hours') || 6));
        const [qk, e, g, n, nhc, gd] = await Promise.all([src('usgs'), src('eonet'), src('gdacs'), src('nws'), src('nhc'), gdelt(hours, 1500)]);
        return json({ items: [...gd.items, ...qk.items, ...g.items, ...e.items, ...nhc.items, ...n.items.slice(0, 150)], updated: new Date().toISOString(), gdeltUpdated: gd.updated });
      }
      case '/predictions': return json(await src('polymarket'));
      case '/predictions/manifold': return json(await src('manifold'));
      case '/risk': return json((await src('risk')) || { pending: true, countries: [], days: [] });
      case '/threat': return json(await threat());
      case '/news': return await news(String(q('scope') || 'world'));
      case '/reliefweb': return json({ items: [], disabled: 'RELIEFWEB_APPNAME not set' });
      case '/windy': return json({ disabled: true, items: [] });
      case '/tv/youtube': return json(channels);
      case '/tv/webcams': return json(webcams);
      case '/tv/hls': return await hlsProxy(url, token);
      case '/tv/iptv': {
        const d = (await getRow('iptv-org'))?.payload || { items: [], countries: [], updated: null };
        const c = q('country') ? String(q('country')).toUpperCase() : null;
        const items = d.items.map((ch) => ({ ...ch, streams: ch.streams.map((s) => ({ ...s, health: null })) })).filter((ch) => ch.streams.length);
        const counts = {};
        for (const ch of items) counts[ch.country] = (counts[ch.country] || 0) + 1;
        return json({ items: c ? items.filter((x) => x.country === c) : [], counts, countries: d.countries, updated: d.updated, total: items.length, healthChecked: false, filtered: false });
      }
    }
    const m = path.match(/^\/tv\/ytlive\/([^/]+)$/);
    if (m) {
      if (!/^UC[\w-]{22}$/.test(m[1])) return json({ error: 'bad id' }, 502);
      return json(await ytLive(m[1]));
    }
    return json({ error: 'not found' }, 404);
  } catch (e) {
    return json({ error: String(e?.message || e) }, 502);
  }
}
