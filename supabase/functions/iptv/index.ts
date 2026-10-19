// @ts-nocheck
// IPTV (Xtream Codes) API + HLS proxy. Private:
//  • JSON routes require a signed-in, allowlisted user (guarded()).
//  • Media routes (p/, s/, f/) are authorised by short-lived AES-GCM sealed tokens issued by the
//    guarded `play` route. Tokens are opaque (encrypted), so provider credentials and upstream
//    URLs never reach the browser, and a token can only ever fetch the exact URL it was minted for.
// Provider settings: Lovable Secrets IPTV_URL / IPTV_USER / IPTV_PASS override rows
// iptv_url / iptv_user / iptv_pass in public.hq_secrets (service-role only).
// Optional home media proxy (provider blocks datacenter IPs for streams):
//   IPTV_MEDIA_BASE / hq_secrets.iptv_media_base  public HTTPS base of tools/iptv-proxy (e.g. https://<mac>.ts.net/iptv)
//   IPTV_TOKEN_KEY  / hq_secrets.iptv_token_key   shared secret used to seal tokens (same value on the proxy)
import { CORS, guarded, subPath, withCors } from '../_shared/guard.ts';
import { db } from '../_shared/wi/cache.ts';

const UA = 'VLC/3.0.20 LibVLC/3.0.20';
const ID_RE = /^\d{1,10}$/;
const EXT_RE = /^[a-z0-9]{2,5}$/i;

/* ------------------------------------------------------------------ config */
let dbCfg = null;
async function cfg() {
  if (!dbCfg || dbCfg.exp < Date.now()) {
    const v = {};
    try {
      const s = await db();
      const { data } = await s.from('hq_secrets').select('name,value').in('name', ['iptv_url', 'iptv_user', 'iptv_pass', 'iptv_media_base', 'iptv_token_key']);
      for (const r of data || []) v[r.name] = r.value;
    } catch { /* ignore */ }
    dbCfg = { v, exp: Date.now() + 5 * 60e3 };
  }
  const env = (k) => Deno.env.get(k) || '';
  const v = dbCfg.v;
  const fromEnv = !!env('IPTV_URL');
  const url = (fromEnv ? env('IPTV_URL') : v.iptv_url || '').replace(/\/+$/, '');
  const user = fromEnv ? env('IPTV_USER') : v.iptv_user || '';
  const pass = fromEnv ? env('IPTV_PASS') : v.iptv_pass || '';
  const mediaBase = (env('IPTV_MEDIA_BASE') || v.iptv_media_base || '').replace(/\/+$/, '') || null;
  const tokenKey = env('IPTV_TOKEN_KEY') || v.iptv_token_key || env('SUPABASE_SERVICE_ROLE_KEY');
  return { url, user, pass, mediaBase, tokenKey, ok: /^https?:\/\//.test(url) && !!user && !!pass };
}

/* ------------------------------------------------------------------ tokens */
// key = SHA-256("wanderpass-iptv-v1:" + tokenKey) → AES-256-GCM; token = base64url(iv[12] | ciphertext+tag)
let keyP = null;
function key() {
  return (keyP ||= (async () => {
    const c = await cfg();
    const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('wanderpass-iptv-v1:' + (c.tokenKey || '')));
    return crypto.subtle.importKey('raw', h, 'AES-GCM', false, ['encrypt', 'decrypt']);
  })());
}
const b64u = (b) => btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64u = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)), (c) => c.charCodeAt(0));
async function seal(obj) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await key(), new TextEncoder().encode(JSON.stringify(obj)));
  const out = new Uint8Array(12 + ct.byteLength); out.set(iv); out.set(new Uint8Array(ct), 12);
  return b64u(out);
}
async function unseal(tok, kind) {
  try {
    const b = unb64u(tok);
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b.slice(0, 12) }, await key(), b.slice(12));
    const o = JSON.parse(new TextDecoder().decode(pt));
    if (o.k !== kind || !(o.e > Date.now())) return null;
    return o;
  } catch { return null; }
}

/* ------------------------------------------------------------------ xtream api */
const memo = new Map();
async function api(c, action, params = {}, ttl = 10 * 60e3, fresh = false) {
  const q = new URLSearchParams({ username: c.user, password: c.pass, ...(action ? { action } : {}), ...params });
  const k = `${action}|${JSON.stringify(params)}`;
  const hit = memo.get(k);
  if (!fresh && hit && hit.exp > Date.now()) return hit.v;
  const r = await fetch(`${c.url}/player_api.php?${q}`, { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(25000) });
  if (!r.ok) throw new Error(`provider ${r.status}`);
  const v = await r.json();
  if (memo.size > 40) memo.clear();
  memo.set(k, { v, exp: Date.now() + ttl });
  return v;
}
const json = (v, status = 200, cache = 'private, max-age=60') => Response.json(v, { status, headers: { 'cache-control': cache } });
const arr = (v) => (Array.isArray(v) ? v : []);
const img = (u) => (typeof u === 'string' && /^https?:\/\//.test(u) ? u.replace(/^http:\/\//, 'https://') : null); // https upgrade avoids mixed content
const decode = (s) => { try { return new TextDecoder().decode(Uint8Array.from(atob(s || ''), (ch) => ch.charCodeAt(0))); } catch { return s || ''; } };

// Albania / USA / UK categories first, then alphabetical.
const CAT_RANK = [/\b(albania|shqip|albanian|kosov|xk)\b/i, /\b(usa|united states|us[:\s|])/i, /\b(uk|united kingdom|britain|british)\b/i];
const catRank = (n) => { const i = CAT_RANK.findIndex((r) => r.test(n)); return i === -1 ? 9 : i; };
const sortCats = (list) => [...list].sort((a, b) => catRank(a.name) - catRank(b.name) || String(a.name).localeCompare(String(b.name)));

// Hide Arab / Middle-East, Asian and African categories (and their channels/movies).
const HIDE_CAT = /\b(arab|arabic|arabia|saudi|emirates|uae|dubai|qatar|kuwait|bahrain|oman|yemen|iraq|iran|syria|lebanon|jordan|palestine|egypt|morocco|algeria|tunisia|libya|sudan|mauritania|maghreb|mena|middle\s?east|islam|muslim|hindi|india|indian|bollywood|pakistan|urdu|bangla|bengali|punjabi|tamil|telugu|desi|china|chinese|japan|japanese|korea|korean|thai|thailand|vietnam|vietnamese|indonesia|indonesian|malaysia|malay|philippines|filipino|pinoy|singapore|taiwan|hong\s?kong|nepal|sri\s?lanka|afghan|kurd|turk|turkey|turkish|persian|farsi|asia|asian|africa|african|nigeria|nigerian|nollywood|ghana|ghanaian|kenya|kenyan|south\s?africa|ethiopia|ethiopian|somalia|somali|senegal|mali|cameroon|congo|congolese|angola|angolan|zimbabwe|uganda|tanzania|rwanda|mozambique|zambia|botswana|namibia|ivory\s?coast|cote\s?d'ivoire|burkina|niger|chad|guinea|benin|togo|gabon|malawi|eritrea|djibouti|yoruba|igbo|hausa|swahili|amharic|zulu|afrikaans)\b/i;
const hideCat = (n) => HIDE_CAT.test(String(n || ''));
// Items whose own name carries a hidden-region tag (e.g. "Nollywood: Movie X") are filtered too.
const hideItem = (x) => hideCat(x.name);

const slimLive = (x) => ({ id: x.stream_id, name: x.name, logo: img(x.stream_icon), cat: String(x.category_id ?? ''), epg: x.epg_channel_id || null, archive: !!x.tv_archive });
const slimVod = (x) => ({ id: x.stream_id, name: x.name, logo: img(x.stream_icon), cat: String(x.category_id ?? ''), rating: Number(x.rating) || null, ext: x.container_extension || 'mp4', added: Number(x.added) || null });
const slimSeries = (x) => ({ id: x.series_id, name: x.name, logo: img(x.cover), cat: String(x.category_id ?? ''), rating: Number(x.rating) || null, year: x.releaseDate || x.release_date || null, plot: x.plot || null });

async function routes(req, c, path, q) {
  const fresh = q.get('refresh') === '1';
  if (path === 'refresh') { memo.clear(); return json({ ok: true, cleared: true }, 200, 'no-store'); }
  if (path === 'status') {
    const d = await api(c, '', {}, 60e3);
    const u = d.user_info || {};
    return json({ configured: true, ok: u.auth === 1, mediaProxy: c.mediaBase ? 'home' : 'cloud', status: u.status, exp: Number(u.exp_date) || null, maxConnections: Number(u.max_connections) || null, activeCons: Number(u.active_cons) || 0 }, 200, 'no-store');
  }
  const cats = { 'live/categories': 'get_live_categories', 'vod/categories': 'get_vod_categories', 'series/categories': 'get_series_categories' };
  if (cats[path]) return json(sortCats(arr(await api(c, cats[path], {}, 30 * 60e3, fresh)).map((x) => ({ id: String(x.category_id), name: x.category_name })).filter((x) => !hideCat(x.name))), 200, 'private, max-age=600');
  const cat = q.get('category') || '';
  if (cat && !ID_RE.test(cat)) return json({ error: 'bad category' }, 400);
  if (path === 'live/streams') return json(arr(await api(c, 'get_live_streams', cat ? { category_id: cat } : {}, 30 * 60e3, fresh)).map(slimLive).filter((x) => !hideItem(x)).slice(0, 3000), 200, 'private, max-age=300');
  if (path === 'vod/streams') return json(arr(await api(c, 'get_vod_streams', cat ? { category_id: cat } : {}, 30 * 60e3, fresh)).map(slimVod).filter((x) => !hideItem(x)).slice(0, 3000), 200, 'private, max-age=300');
  if (path === 'series/list') return json(arr(await api(c, 'get_series', cat ? { category_id: cat } : {}, 30 * 60e3, fresh)).map(slimSeries).filter((x) => !hideItem(x)).slice(0, 3000), 200, 'private, max-age=300');
  if (path === 'series/info') {
    const id = q.get('id') || '';
    if (!ID_RE.test(id)) return json({ error: 'bad id' }, 400);
    const d = await api(c, 'get_series_info', { series_id: id });
    const eps = d.episodes || {};
    const seasons = Object.keys(eps).sort((a, b) => Number(a) - Number(b)).map((s) => ({
      season: Number(s),
      episodes: arr(eps[s]).map((e) => ({ id: Number(e.id), num: Number(e.episode_num) || null, title: e.title, ext: e.container_extension || 'mp4', plot: e.info?.plot || null, img: img(e.info?.movie_image), duration: e.info?.duration || null })),
    }));
    const i = d.info || {};
    return json({ info: { name: i.name, cover: img(i.cover), plot: i.plot || null, genre: i.genre || null, year: i.releaseDate || null, rating: Number(i.rating) || null }, seasons });
  }
  if (path === 'vod/info') {
    const id = q.get('id') || '';
    if (!ID_RE.test(id)) return json({ error: 'bad id' }, 400);
    const d = await api(c, 'get_vod_info', { vod_id: id });
    const i = d.info || {};
    return json({ name: i.name || d.movie_data?.name, cover: img(i.movie_image || i.cover_big), plot: i.plot || i.description || null, genre: i.genre || null, year: i.releasedate || null, duration: i.duration || null, rating: Number(i.rating) || null });
  }
  if (path === 'epg') {
    const ids = (q.get('ids') || '').split(',').filter((x) => ID_RE.test(x)).slice(0, 40);
    const out = {};
    const now = Date.now() / 1000;
    let i = 0;
    const worker = async () => {
      while (i < ids.length) {
        const id = ids[i++];
        try {
          const d = await api(c, 'get_short_epg', { stream_id: id, limit: '3' }, 5 * 60e3);
          out[id] = arr(d.epg_listings)
            .map((e) => ({ title: decode(e.title), start: Number(e.start_timestamp), end: Number(e.stop_timestamp) }))
            .filter((e) => e.end > now).slice(0, 2);
        } catch { out[id] = []; }
      }
    };
    await Promise.all(Array.from({ length: 8 }, worker));
    return json(out, 200, 'private, max-age=120');
  }
  if (path === 'search') {
    const term = (q.get('q') || '').trim().toLowerCase();
    const type = q.get('type') || 'live';
    if (term.length < 2) return json([]);
    const act = { live: 'get_live_streams', vod: 'get_vod_streams', series: 'get_series' }[type];
    const slim = { live: slimLive, vod: slimVod, series: slimSeries }[type];
    if (!act) return json({ error: 'bad type' }, 400);
    const all = arr(await api(c, act, {}, 30 * 60e3));
    const words = term.split(/\s+/);
    const res = [];
    for (const x of all) {
      const n = String(x.name || '').toLowerCase();
      if (words.every((w) => n.includes(w))) { const s = slim(x); if (hideItem(s)) continue; res.push(s); if (res.length >= 80) break; }
    }
    return json(res);
  }
  if (path === 'play') {
    const kind = q.get('kind');
    const id = q.get('id') || '';
    if (!ID_RE.test(id)) return json({ error: 'bad id' }, 400);
    const downloading = q.has('download');
    const e = Date.now() + (downloading ? 10 * 60e3 : 8 * 3600e3);
    if (kind === 'live') {
      const tok = await seal({ k: 'pl', u: `${c.url}/live/${c.user}/${c.pass}/${id}.m3u8`, e });
      return json({ type: 'hls', base: c.mediaBase, path: `p/${tok}/index.m3u8` }, 200, 'no-store');
    }
    if (kind === 'movie' || kind === 'series') {
      const ext = (q.get('ext') || 'mp4').toLowerCase();
      if (!EXT_RE.test(ext)) return json({ error: 'bad ext' }, 400);
      if (q.get('hls') === '1' && !downloading) {
        // Provider-side HLS remux: plays MKV/AVI etc. on phones that can't decode the raw container.
        const tok = await seal({ k: 'pl', u: `${c.url}/${kind}/${c.user}/${c.pass}/${id}.m3u8`, e });
        return json({ type: 'hls', base: c.mediaBase, path: `p/${tok}/index.m3u8` }, 200, 'no-store');
      }
      const filename = downloading ? `${(q.get('download') || 'movie').replace(/[^a-zA-Z0-9 _-]/g, '').slice(0, 100) || 'movie'}.${ext}` : null;
      const tok = await seal({ k: 'f', u: `${c.url}/${kind}/${c.user}/${c.pass}/${id}.${ext}`, e, ...(filename ? { download: filename } : {}) });
      return json({ type: 'file', ext, base: c.mediaBase, path: `f/${tok}/video.${ext}` }, 200, 'no-store');
    }
    return json({ error: 'bad kind' }, 400);
  }
  return json({ error: 'not found' }, 404);
}

/* ------------------------------------------------------------------ media proxy */
const MEDIA_CORS = { ...CORS, 'Access-Control-Allow-Headers': 'range, content-type', 'Access-Control-Expose-Headers': 'content-length, content-range, accept-ranges' };
const media = (body, init = {}) => new Response(body, { ...init, headers: { ...MEDIA_CORS, ...(init.headers || {}) } });

async function rewrite(text, base) {
  const e = Date.now() + 3 * 3600e3;
  const lines = text.split(/\r?\n/);
  const isMaster = lines.some((l) => l.startsWith('#EXT-X-STREAM-INF'));
  // Seal all tokens in parallel — big playlists would otherwise cost one crypto await per line.
  const out = await Promise.all(lines.map(async (line) => {
    if (!line) return line;
    if (line.startsWith('#')) {
      // URI="..." attributes (keys, init maps, alternate renditions)
      const m = line.match(/URI="([^"]+)"/);
      if (m) {
        const abs = new URL(m[1], base).href;
        const isPl = line.startsWith('#EXT-X-MEDIA') || /\.m3u8/i.test(abs);
        const tok = await seal({ k: isPl ? 'pl' : 's', u: abs, e });
        return line.replace(m[0], `URI="../../${isPl ? 'p' : 's'}/${tok}/${isPl ? 'index.m3u8' : 'k.bin'}"`);
      }
      return line;
    }
    const abs = new URL(line.trim(), base).href;
    if (isMaster || /\.m3u8(\?|$)/i.test(abs)) return `../../p/${await seal({ k: 'pl', u: abs, e })}/index.m3u8`;
    return `../../s/${await seal({ k: 's', u: abs, e })}/seg.ts`;
  }));
  return out.join('\n');
}

async function mediaRoute(req, path) {
  const [kind, tok] = path.split('/');
  if (kind === 'p') {
    const t = await unseal(tok, 'pl');
    if (!t) return media('expired', { status: 403 });
    const r = await fetch(t.u, { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(15000) });
    if (!r.ok) return media(`upstream ${r.status}${r.status === 511 || r.status === 403 ? ' (provider blocks cloud IPs; set up the home media proxy)' : ''}`, { status: r.status === 404 ? 404 : 502 });
    const body = await rewrite(await r.text(), r.url || t.u);
    return media(body, { headers: { 'content-type': 'application/vnd.apple.mpegurl', 'cache-control': 'no-store' } });
  }
  if (kind === 's') {
    const t = await unseal(tok, 's');
    if (!t) return media('expired', { status: 403 });
    const r = await fetch(t.u, { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(30000) });
    if (!r.ok) return media(`upstream ${r.status}`, { status: 502 });
    return media(r.body, { headers: { 'content-type': r.headers.get('content-type') || 'video/mp2t', 'cache-control': 'private, max-age=60' } });
  }
  if (kind === 'f') {
    const t = await unseal(tok, 'f');
    if (!t) return media('expired', { status: 403 });
    const h = { 'user-agent': UA };
    const range = req.headers.get('range');
    if (range) h['range'] = range;
    const r = await fetch(t.u, { headers: h, method: req.method === 'HEAD' ? 'HEAD' : 'GET', signal: req.signal });
    if (!r.ok && r.status !== 206) return media(`upstream ${r.status}`, { status: r.status === 458 || r.status === 460 ? 429 : 502 });
    const out = { 'cache-control': t.download ? 'no-store' : 'private, max-age=300', 'accept-ranges': 'bytes' };
    if (t.download) out['content-disposition'] = `attachment; filename="${String(t.download).replace(/[^a-zA-Z0-9 ._-]/g, '')}"`;
    for (const k of ['content-type', 'content-length', 'content-range']) { const v = r.headers.get(k); if (v) out[k] = v; }
    if (/octet-stream/.test(out['content-type'] || '') || !out['content-type']) out['content-type'] = /\.mkv$/i.test(path) ? 'video/x-matroska' : 'video/mp4';
    return media(r.body, { status: r.status, headers: out });
  }
  return media('not found', { status: 404 });
}

const api_ = guarded(async (req) => {
  const c = await cfg();
  if (!c.ok) return json({ configured: false }, 200, 'no-store');
  const path = subPath(req, 'iptv');
  try { return await routes(req, c, path, new URL(req.url).searchParams); }
  catch (e) { return json({ configured: true, error: String(e?.message || e).replace(c.user, '***').replace(c.pass, '***').slice(0, 160) }, 502, 'no-store'); }
});

Deno.serve(async (req) => {
  const path = subPath(req, 'iptv');
  if (/^(p|s|f)\//.test(path)) {
    if (req.method === 'OPTIONS') return media(null, { status: 204 });
    try { return await mediaRoute(req, path); }
    catch { return media('proxy error', { status: 502 }); }
  }
  return api_(req);
});
