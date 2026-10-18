// @ts-nocheck
// Upstream refreshers (ported 1:1 from the original server's sources/*.js). Results land in api_cache.
import { classifyCameo, whatHappened } from './cameo.ts';
import { XMLParser } from 'npm:fast-xml-parser@5';
import { unzipSync, strFromU8 } from 'npm:fflate@0.8';
import { runSource, fetchJSON, fetchText, fetchBuffer, db, getRow, putRow, pool } from './cache.ts';
import { tagGeo, countryAt, regionOf } from './geo.ts';
import { NEWS } from './news-config.ts';

const xml = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@', removeNSPrefix: false });

export const LABELS = {
  usgs: 'USGS Earthquakes', eonet: 'NASA EONET', gdacs: 'GDACS Alerts', nws: 'NWS Alerts (US)', gdelt: 'GDELT 2.0 Events',
  'gdelt-doc': 'GDELT DOC (news)', 'iptv-org': 'iptv-org TV DB', 'youtube-live': 'YouTube live resolver', kev: 'CISA KEV',
  polymarket: 'Polymarket (predictions)', manifold: 'Manifold Markets', nhc: 'NOAA NHC Storms', risk: 'Risk outlook (GDELT 7d)',
};

// ---------- USGS earthquakes ----------
export const refreshQuakes = () => runSource('usgs', LABELS.usgs, 60, async () => {
  const [day, sig] = await Promise.all([
    fetchJSON('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson'),
    fetchJSON('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_week.geojson'),
  ]);
  const seen = new Set();
  const items = [];
  for (const f of [...sig.features, ...day.features]) {
    if (seen.has(f.id)) continue; seen.add(f.id);
    const [lon, lat, depth] = f.geometry.coordinates;
    const p = f.properties;
    if (p.mag == null || p.mag < 2.5) continue;
    items.push(tagGeo({ id: 'usgs:' + f.id, type: 'quake', title: p.title, lat, lon, time: new Date(p.time).toISOString(),
      url: p.url, source: 'USGS', severity: p.mag >= 6 ? 3 : p.mag >= 4.5 ? 2 : 1, mag: p.mag, depthKm: depth,
      detail: `M${p.mag} · depth ${depth?.toFixed?.(0)} km${p.tsunami ? ' · TSUNAMI flag' : ''}${p.alert ? ' · PAGER ' + p.alert : ''}` }));
  }
  return { items, updated: new Date().toISOString(), upstreamGenerated: new Date(day.metadata.generated).toISOString() };
});

// ---------- NASA EONET v3 ----------
const EONET_TYPE = { wildfires: 'fire', severeStorms: 'storm', volcanoes: 'volcano', floods: 'flood', seaLakeIce: 'ice', drought: 'drought', dustHaze: 'dust', landslides: 'flood', snow: 'storm', tempExtremes: 'storm', manmade: 'disaster', waterColor: 'disaster', earthquakes: 'quake' };
export const refreshEonet = () => runSource('eonet', LABELS.eonet, 120, async () => {
  const d = await fetchJSON('https://eonet.gsfc.nasa.gov/api/v3/events?status=open&days=20&limit=600', { timeout: 30000 });
  const items = [];
  for (const e of d.events) {
    const g = e.geometry?.[e.geometry.length - 1];
    if (!g) continue;
    let lon, lat;
    if (g.type === 'Point') [lon, lat] = g.coordinates;
    else if (g.type === 'Polygon') { const r = g.coordinates[0]; lon = r.reduce((a, c) => a + c[0], 0) / r.length; lat = r.reduce((a, c) => a + c[1], 0) / r.length; }
    else continue;
    const cat = e.categories?.[0]?.id;
    items.push(tagGeo({ id: 'eonet:' + e.id, type: EONET_TYPE[cat] || 'disaster', title: e.title, lat, lon, time: g.date,
      url: e.sources?.[0]?.url || e.link, source: 'NASA EONET' + (e.sources?.[0]?.id ? ' / ' + e.sources[0].id : ''), severity: cat === 'volcanoes' || cat === 'severeStorms' ? 2 : 1,
      detail: `${e.categories?.map((c) => c.title).join(', ')}${g.magnitudeValue ? ` · ${g.magnitudeValue} ${g.magnitudeUnit}` : ''}` }));
  }
  return { items, updated: new Date().toISOString() };
});

// ---------- GDACS ----------
const GDACS_TYPE = { EQ: 'quake', TC: 'storm', FL: 'flood', VO: 'volcano', DR: 'drought', WF: 'fire', TS: 'quake' };
export const refreshGdacs = () => runSource('gdacs', LABELS.gdacs, 120, async () => {
  const d = xml.parse(await fetchText('https://www.gdacs.org/xml/rss.xml', { timeout: 30000 }));
  const arr = [].concat(d.rss.channel.item || []);
  const items = arr.filter((it) => String(it['gdacs:iscurrent']) === 'true').map((it) => {
    const lvl = it['gdacs:alertlevel'];
    const lat = Number(it['geo:Point']?.['geo:lat']), lon = Number(it['geo:Point']?.['geo:long']);
    return tagGeo({ id: 'gdacs:' + (it.guid?.['#text'] ?? it.guid), type: GDACS_TYPE[it['gdacs:eventtype']] || 'disaster', title: it.title, lat, lon,
      time: new Date(it['gdacs:datemodified'] || it.pubDate).toISOString(), url: it.link, source: 'GDACS', alert: lvl,
      severity: lvl === 'Red' ? 3 : lvl === 'Orange' ? 2 : 1, detail: `${lvl} alert · ${it['gdacs:country'] || ''} · ${it['gdacs:severity']?.['#text'] || ''}` });
  });
  return { items, updated: new Date().toISOString() };
});

// ---------- NWS ----------
export const refreshNws = () => runSource('nws', LABELS.nws, 120, async () => {
  const d = await fetchJSON('https://api.weather.gov/alerts/active?status=actual&message_type=alert,update&severity=Extreme,Severe', { headers: { Accept: 'application/geo+json' }, timeout: 30000 });
  const items = [];
  for (const f of d.features) {
    const g = f.geometry; if (!g) continue;
    const ring = g.type === 'Polygon' ? g.coordinates[0] : g.type === 'MultiPolygon' ? g.coordinates[0][0] : null;
    if (!ring) continue;
    const lon = ring.reduce((a, c) => a + c[0], 0) / ring.length, lat = ring.reduce((a, c) => a + c[1], 0) / ring.length;
    const p = f.properties;
    items.push({ id: 'nws:' + p.id, type: 'weather', title: p.headline || p.event, lat, lon, time: p.sent, url: p['@id'] || f.id, source: 'NWS (US)',
      severity: p.severity === 'Extreme' ? 3 : 2, detail: `${p.event} · ${p.areaDesc?.slice(0, 120)}`, country: 'US', region: 'americas' });
  }
  return { items, updated: new Date().toISOString() };
});

// ---------- GDELT 2.0 events export ----------
const CAMEO = {
  '14': { type: 'protest', label: 'Protest' }, '18': { type: 'attack', label: 'Assault / attack' }, '19': { type: 'conflict', label: 'Armed fighting' },
  '20': { type: 'conflict', label: 'Mass violence' }, '15': { type: 'military', label: 'Military posture' }, '17': { type: 'unrest', label: 'Coercion / repression' }, '13': { type: 'unrest', label: 'Threat' },
};
const CAMEO_DETAIL = { '180': 'Unconventional violence', '181': 'Abduction / hostage-taking', '182': 'Physical assault', '183': 'Bombing (suicide/vehicle/roadside)', '1831': 'Suicide bombing', '1832': 'Vehicular bombing', '1833': 'Roadside bombing', '184': 'Human shield', '185': 'Assassination attempt', '186': 'Assassination', '190': 'Use of conventional military force', '191': 'Blockade', '192': 'Occupy territory', '193': 'Fight with small arms / light weapons', '194': 'Fight with artillery and tanks', '195': 'Aerial weapons (airstrike)', '1951': 'Precision-guided aerial munitions', '1952': 'Remotely piloted aerial munitions (drone)', '196': 'Violate ceasefire', '200': 'Unconventional mass violence', '201': 'Mass expulsion', '202': 'Mass killings', '203': 'Ethnic cleansing', '204': 'Weapons of mass destruction', '140': 'Political dissent', '141': 'Demonstrate or rally', '143': 'Strike / boycott', '144': 'Obstruct / blockade', '145': 'Violent protest / riot', '150': 'Military posture', '152': 'Increase military alert', '154': 'Mobilize armed forces', '171': 'Seize / damage property', '172': 'Administrative sanctions', '173': 'Arrest / detain', '174': 'Expel / deport', '175': 'Violent repression', '138': 'Threaten military force' };

export function stampsBack(latestStamp, n) {
  const y = +latestStamp.slice(0, 4), mo = +latestStamp.slice(4, 6) - 1, d = +latestStamp.slice(6, 8), h = +latestStamp.slice(8, 10), mi = +latestStamp.slice(10, 12);
  const t0 = Date.UTC(y, mo, d, h, mi);
  const out = [];
  for (let i = 0; i < n; i++) { const t = new Date(t0 - i * 900000); out.push(t.toISOString().replace(/[-:T]/g, '').slice(0, 12) + '00'); }
  return out;
}
export function parseExportCsv(csv, stamp) {
  const out = [];
  for (const line of csv.split('\n')) {
    const c = line.split('\t');
    if (c.length < 61) continue;
    const root = c[28];
    const cls = classifyCameo(c); if (!cls) continue; // precise full-code + actor-type mapping (cameo.ts)
    const geoType = +c[51];
    const lat = parseFloat(c[56]), lon = parseFloat(c[57]);
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || geoType === 0) continue;
    const numSources = +c[32], numArticles = +c[33];
    const url = c[60]?.trim();
    if (!url) continue;
    const country = countryAt(lat, lon);
    const time = `${c[59].slice(0, 4)}-${c[59].slice(4, 6)}-${c[59].slice(6, 8)}T${c[59].slice(8, 10)}:${c[59].slice(10, 12)}:00Z`;
    const actors = [cls.a1.name, cls.a2.name].filter(Boolean);
    out.push({ id: 'gdelt:' + c[0], type: cls.type, cameo: c[26], cameoRoot: root, label: cls.label,
      title: `${cls.label}${actors.length ? ' — ' + actors.join(' / ') : ''}`,
      what: whatHappened(cls, c[52], time), actor1: cls.a1.name || null, actor2: cls.a2.name || null, armedActor: cls.armed,
      place: c[52], lat, lon, precision: geoType === 1 ? 'country' : geoType === 2 || geoType === 5 ? 'state' : 'city',
      time, url, source: 'GDELT 2.0', goldstein: +c[30], mentions: +c[31], numSources, numArticles, tone: +c[34],
      severity: cls.severity, country, region: regionOf(country), stamp });
  }
  return out;
}

const KEEP_FILES = 96; // 24 h rolling window
const MAX_NEW_FILES_PER_RUN = 3; // keeps each scheduled call short; the 1-min job back-fills older files one at a time
const stampIso = (s) => `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}T${s.slice(8, 10)}:${s.slice(10, 12)}:00Z`;

export async function refreshGdelt(maxFiles = MAX_NEW_FILES_PER_RUN) {
  const s = await db();
  const t0 = Date.now();
  try {
    const last = await fetchText('https://data.gdeltproject.org/gdeltv2/lastupdate.txt');
    const m = last.match(/gdeltv2\/(\d{14})\.export/);
    if (!m) throw new Error('lastupdate.txt unparsable');
    const latest = m[1];
    const want = stampsBack(latest, KEEP_FILES);
    const { data: have } = await s.from('gdelt_files').select('stamp');
    const haveSet = new Set((have || []).map((r) => r.stamp));
    const missing = want.filter((x) => !haveSet.has(x)).slice(0, maxFiles);
    let failures = 0;
    for (const stamp of missing) { // sequential, polite
      try {
        const buf = await fetchBuffer(`https://data.gdeltproject.org/gdeltv2/${stamp}.export.CSV.zip`, { timeout: 30000 });
        const files = unzipSync(buf);
        const csv = strFromU8(Object.values(files)[0]);
        const evs = parseExportCsv(csv, stamp);
        for (let i = 0; i < evs.length; i += 500) {
          const rows = evs.slice(i, i + 500).map((e) => ({ id: e.id, stamp, url: e.url, type: e.type, cameo_root: e.cameoRoot, severity: e.severity, num_articles: e.numArticles || 0, time: e.time, country: e.country, region: e.region, data: e }));
          const { error } = await s.from('gdelt_events').upsert(rows);
          if (error) throw new Error(error.message);
        }
        await s.from('gdelt_files').upsert({ stamp, n: evs.length });
      } catch { failures++; }
    }
    const oldest = want[want.length - 1];
    await s.from('gdelt_events').delete().lt('stamp', oldest);
    await s.from('gdelt_files').delete().lt('stamp', oldest);

    // precompute windows + country stats for the api
    const updated = stampIso(latest);
    for (const h of [1, 6, 24]) {
      const { data, error } = await s.rpc('gdelt_window', { _hours: h, _limit: h === 24 ? 4000 : 1500 });
      if (error) throw new Error(error.message);
      await putRow('gdelt:' + h, { payload: { items: data || [], updated, window_h: h }, ttl_seconds: 900, status: 'ok', error: null, meta: { internal: true } });
    }
    const { data: stats, error: se } = await s.rpc('gdelt_country_stats');
    if (se) throw new Error(se.message);
    await putRow('gdelt:stats', { payload: stats || {}, ttl_seconds: 900, status: 'ok', error: null, meta: { internal: true } });
    const { count } = await s.from('gdelt_events').select('id', { count: 'exact', head: true });
    const { count: files } = await s.from('gdelt_files').select('stamp', { count: 'exact', head: true });
    await putRow('gdelt', { payload: { latestExport: latest, updated }, ttl_seconds: 900, status: failures > 4 ? 'degraded' : 'ok',
      error: failures ? `${failures} export files failed` : (files < KEEP_FILES ? `back-filling 24h window (${files}/${KEEP_FILES} files)` : null),
      meta: { label: LABELS.gdelt, lastOk: new Date().toISOString(), latencyMs: Date.now() - t0, count, files, latestExport: latest } });
    return { key: 'gdelt', ok: true, loaded: missing.length - failures, failures };
  } catch (e) {
    const prev = await getRow('gdelt').catch(() => null);
    await putRow('gdelt', { payload: prev?.payload ?? null, ttl_seconds: 900, status: prev?.payload ? 'degraded' : 'down', error: String(e.message || e).slice(0, 200), meta: { ...(prev?.meta || {}), label: LABELS.gdelt, lastError: new Date().toISOString() } });
    return { key: 'gdelt', ok: false, error: String(e.message || e) };
  }
}

// ---------- CISA KEV ----------
export const refreshKev = () => runSource('kev', LABELS.kev, 3600, async () => {
  const d = await fetchJSON('https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json', { timeout: 30000 });
  const items = d.vulnerabilities.sort((a, b) => b.dateAdded.localeCompare(a.dateAdded)).slice(0, 25).map((v) => ({ title: `${v.cveID} — ${v.vendorProject} ${v.product}`, detail: v.vulnerabilityName, time: v.dateAdded + 'T00:00:00Z', url: `https://nvd.nist.gov/vuln/detail/${v.cveID}`, source: 'CISA KEV' }));
  return { items, catalogVersion: d.catalogVersion };
});

// ---------- iptv-org ----------
export async function refreshIptv() {
  const r = await runSource('iptv-org', LABELS['iptv-org'], 6 * 3600, async () => {
    const base = 'https://iptv-org.github.io/api/';
    const [channels, streams, countries] = await Promise.all([
      fetchJSON(base + 'channels.json', { timeout: 60000 }), fetchJSON(base + 'streams.json', { timeout: 60000 }), fetchJSON(base + 'countries.json'),
    ]);
    const news = new Map();
    const EXTRA = new Set((Deno.env.get('IPTV_ALL_CATEGORIES_COUNTRIES') || 'XK,AL').split(','));
    for (const c of channels) if ((c.categories?.includes('news') || EXTRA.has(c.country)) && !c.closed && !c.is_nsfw) news.set(c.id, c);
    const byChannel = new Map();
    for (const st of streams) {
      if (!st.channel || !news.has(st.channel)) continue;
      if (st.referrer || st.user_agent) continue;
      (byChannel.get(st.channel) || byChannel.set(st.channel, []).get(st.channel)).push({ url: st.url, quality: st.quality, label: (st.labels || []).join(',') || null, feed: st.feed });
    }
    const list = [];
    for (const [id, c] of news) {
      const st = byChannel.get(id);
      if (!st) continue;
      const cc = c.country === 'UK' ? 'GB' : c.country;
      list.push({ id, name: c.name, country: cc, website: c.website, categories: c.categories, streams: st, region: regionOf(cc) });
    }
    for (const c of countries) if (c.code === 'UK') c.code = 'GB';
    return { items: list, countries: countries.map((c) => ({ code: c.code, name: c.name })), count: list.length, updated: new Date().toISOString() };
  });
  if (r.ok) {
    const row = await getRow('iptv-org');
    const hosts = [...new Set((row?.payload?.items || []).flatMap((c) => c.streams.map((s) => { try { return new URL(s.url).host; } catch { return null; } })).filter(Boolean))];
    await putRow('iptv:hosts', { payload: hosts, ttl_seconds: 6 * 3600, status: 'ok', error: null, meta: { internal: true } });
  }
  return r;
}

// ---------- News: RSS + GDELT DOC ----------
const strip = (s) => String(s ?? '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#8217;|&rsquo;/g, '’').replace(/&#8220;|&#8221;|&quot;/g, '"').replace(/&#039;|&#39;/g, "'").replace(/\s+/g, ' ').trim();
const txt = (v) => (typeof v === 'object' && v !== null ? v['#text'] ?? '' : v ?? '');
const xmlNews = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@' });

function rssFeed(name, url) {
  return runSource('rss:' + url, 'rss:' + name, 300, async () => {
    const d = xmlNews.parse(await fetchText(url, { timeout: 8000, headers: { 'User-Agent': 'Mozilla/5.0 (WorldIntelDashboard RSS reader)' } }));
    let items = [];
    if (d.rss) items = [].concat(d.rss.channel.item || []).map((i) => ({ title: strip(txt(i.title)), url: txt(i.link) || i.guid?.['#text'], time: i.pubDate || i['dc:date'], summary: strip(txt(i.description)).slice(0, 240) }));
    else if (d.feed) items = [].concat(d.feed.entry || []).map((e) => ({ title: strip(txt(e.title)), url: [].concat(e.link || [])[0]?.['@href'], time: e.updated || e.published, summary: strip(txt(e.summary)).slice(0, 240) }));
    else if (d['rdf:RDF']) items = [].concat(d['rdf:RDF'].item || []).map((i) => ({ title: strip(txt(i.title)), url: i.link, time: i['dc:date'], summary: strip(txt(i.description)).slice(0, 240) }));
    items = items.filter((i) => i.title && i.url && i.time && !Number.isNaN(Date.parse(i.time))).map((i) => ({ ...i, time: new Date(i.time).toISOString(), source: name, via: 'RSS' }));
    return { items };
  });
}

async function gdeltDoc(scope) {
  const cfg = NEWS[scope];
  const q = scope === 'world' ? '(conflict OR attack OR protest OR earthquake OR election OR breaking) sourcelang:english' : `sourcecountry:${cfg.gdelt}`;
  const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(q)}&mode=artlist&format=json&maxrecords=60&timespan=24h&sort=datedesc`;
  const t0 = Date.now();
  try {
    const t = await fetchText(url, { timeout: 20000 });
    if (!t.trim().startsWith('{')) throw new Error('GDELT DOC: ' + t.slice(0, 80));
    const d = JSON.parse(t);
    const items = (d.articles || []).map((a) => ({ title: a.title, url: a.url, source: a.domain, via: 'GDELT DOC',
      time: a.seendate ? `${a.seendate.slice(0, 4)}-${a.seendate.slice(4, 6)}-${a.seendate.slice(6, 8)}T${a.seendate.slice(9, 11)}:${a.seendate.slice(11, 13)}:${a.seendate.slice(13, 15)}Z` : null, lang: a.language }));
    await putRow('gdeltdoc:' + scope, { payload: { items }, ttl_seconds: 900, status: 'ok', error: null, meta: { internal: true } });
    await putRow('gdelt-doc', { payload: { lastScope: scope }, ttl_seconds: 900, status: 'ok', error: null, meta: { label: LABELS['gdelt-doc'], lastOk: new Date().toISOString(), latencyMs: Date.now() - t0, count: items.length } });
  } catch (e) {
    const prev = await getRow('gdelt-doc').catch(() => null);
    await putRow('gdelt-doc', { payload: prev?.payload ?? null, ttl_seconds: 900, status: prev?.status === 'ok' ? 'degraded' : 'down', error: String(e.message || e).slice(0, 200), meta: { ...(prev?.meta || {}), label: LABELS['gdelt-doc'], lastError: new Date().toISOString() } });
  }
}

export const NEWS_PARTS = 3;
/** RSS feeds are split into NEWS_PARTS scheduled calls so each one stays short. */
export async function refreshNews(part = 0) {
  const feeds = new Map();
  for (const cfg of Object.values(NEWS)) for (const [n, u] of cfg.rss || []) feeds.set(u, n);
  const mine = [...feeds.entries()].sort((a, b) => a[0].localeCompare(b[0])).filter((_, i) => i % NEWS_PARTS === part);
  await pool(mine, 6, ([u, n]) => rssFeed(n, u));
  return { key: 'news', ok: true, part, feeds: mine.length };
}

/** GDELT DOC allows ~1 request / 5 s: refresh ONE scope per call — the stalest of World + scopes viewed in the last hour, if older than 15 min. */
export async function refreshGdeltDocOne() {
  const s = await db();
  const [{ data: docRows }, { data: reqRows }] = await Promise.all([
    s.from('api_cache').select('key, updated_at').like('key', 'gdeltdoc:%'),
    s.from('api_cache').select('key, updated_at').like('key', 'newsreq:%').gte('updated_at', new Date(Date.now() - 3600e3).toISOString()),
  ]);
  const age = Object.fromEntries((docRows || []).map((r) => [r.key.slice(9), Date.parse(r.updated_at)]));
  const wanted = ['world', ...(reqRows || []).map((r) => r.key.slice(8)).filter((k) => NEWS[k] && k !== 'world')];
  const due = wanted.filter((k) => Date.now() - (age[k] || 0) > 15 * 60e3).sort((a, b) => (age[a] || 0) - (age[b] || 0));
  if (due[0]) await gdeltDoc(due[0]);
  return { key: 'gdelt-doc', scope: due[0] || null };
}

// ---------- X API (optional, paid) ----------
export async function xSearch(scope) {
  const token = Deno.env.get('X_BEARER_TOKEN');
  const cfg = NEWS[scope];
  if (!token || !cfg?.x?.length) return null;
  const ttl = Math.max(300, Number(Deno.env.get('X_CACHE_SECONDS') || 600)); // never below 5 min (credits!)
  const key = 'x:' + scope;
  const prev = await getRow(key);
  if (prev?.payload && Date.now() - Date.parse(prev.updated_at) < ttl * 1000) return prev.payload;
  const query = `(${cfg.x.map((h) => 'from:' + h).join(' OR ')}) -is:retweet -is:reply`;
  const url = `https://api.x.com/2/tweets/search/recent?query=${encodeURIComponent(query)}&max_results=${Number(Deno.env.get('X_MAX_RESULTS') || 25)}&tweet.fields=created_at,author_id,entities&expansions=author_id&user.fields=username,name`;
  const r = await runSource(key, 'x-api', ttl, async () => {
    const d = await fetchJSON(url, { headers: { Authorization: `Bearer ${token}` } });
    const users = Object.fromEntries((d.includes?.users || []).map((u) => [u.id, u]));
    const items = (d.data || []).map((t) => {
      const u = users[t.author_id];
      return { title: t.text, url: `https://x.com/${u?.username || 'i'}/status/${t.id}`, time: t.created_at, source: u ? `@${u.username}` : 'X', via: 'X API' };
    });
    return { items };
  });
  const row = await getRow(key);
  const xs = await getRow('x-api');
  await putRow('x-api', { payload: null, ttl_seconds: ttl, status: r.ok ? 'ok' : 'degraded', error: r.ok ? null : r.error, meta: { label: 'X API v2 (paid)', lastOk: r.ok ? new Date().toISOString() : xs?.meta?.lastOk, count: row?.payload?.items?.length ?? null, requestsMade: (xs?.meta?.requestsMade || 0) + 1 } });
  return row?.payload ?? null;
}

// ---------- YouTube live resolver (on demand, 15 min cache) ----------
export async function ytLive(channelId) {
  const key = 'ytlive:' + channelId;
  const prev = await getRow(key);
  if (prev?.payload && Date.now() - Date.parse(prev.updated_at) < 15 * 60e3) return prev.payload;
  const t0 = Date.now();
  try {
    const h = await fetchText(`https://www.youtube.com/channel/${channelId}/live`, { timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124', 'Accept-Language': 'en', Cookie: 'CONSENT=YES+1' } });
    const vid = (h.match(/"videoDetails":\{"videoId":"([^"]+)"/) || [])[1];
    const live = /"isLive":true/.test(h) || /"isLiveNow":true/.test(h);
    const v = { channelId, videoId: live ? vid : null, live, checkedAt: new Date().toISOString() };
    await putRow(key, { payload: v, ttl_seconds: 900, status: 'ok', error: null, meta: { internal: true } });
    await putRow('youtube-live', { payload: null, ttl_seconds: 900, status: 'ok', error: null, meta: { label: LABELS['youtube-live'], lastOk: new Date().toISOString(), latencyMs: Date.now() - t0 } });
    return v;
  } catch (e) {
    await putRow('youtube-live', { payload: null, ttl_seconds: 900, status: 'degraded', error: String(e.message || e).slice(0, 200), meta: { label: LABELS['youtube-live'], lastError: new Date().toISOString() } });
    if (prev?.payload) return prev.payload;
    throw e;
  }
}

async function gdeltBackfill() {
  const s = await db();
  const { count } = await s.from('gdelt_files').select('stamp', { count: 'exact', head: true });
  return (count ?? 0) < KEEP_FILES ? refreshGdelt(1) : null;
}

// ---------- Prediction markets: Polymarket Gamma API (public) ----------
export const PM_TAGS = ['geopolitics', 'world', 'politics', 'elections'];
const BAD = /(sports|nba|nfl|soccer|crypto|bitcoin|ethereum|mention|tweet|box office|oscars|grammy|weather|temperature)/i;
export function normalizeEvents(lists) {
  const seen = new Set(); const out = [];
  for (const [tag, events] of lists) for (const ev of events || []) {
    if (!ev || ev.closed || seen.has(ev.id)) continue;
    if (BAD.test(ev.title) || (ev.tags || []).some((t) => BAD.test(t.slug || ''))) continue;
    seen.add(ev.id);
    const markets = (ev.markets || []).filter((m) => m.active && !m.closed && m.outcomePrices).map((m) => {
      let prices = [], outcomes = [];
      try { prices = JSON.parse(m.outcomePrices).map(Number); outcomes = JSON.parse(m.outcomes); } catch {}
      return { id: m.id, question: m.question, label: m.groupItemTitle || outcomes[0] || 'Yes', yes: prices[0], change24h: m.oneDayPriceChange ?? null, change1w: m.oneWeekPriceChange ?? null, volume24h: m.volume24hr || 0, endDate: m.endDate };
    }).filter((m) => Number.isFinite(m.yes)).sort((a, b) => b.volume24h - a.volume24h);
    if (!markets.length) continue;
    out.push({ id: ev.id, title: ev.title, slug: ev.slug, url: `https://polymarket.com/event/${ev.slug}`, tag, icon: ev.icon, volume24h: ev.volume24hr || 0, volume: ev.volume || 0, endDate: ev.endDate, markets: markets.slice(0, 6) });
  }
  return out.sort((a, b) => b.volume24h - a.volume24h).slice(0, 60);
}
export const gammaUrl = (tag) => `https://gamma-api.polymarket.com/events?closed=false&active=true&limit=40&order=volume24hr&ascending=false&tag_slug=${tag}`;

export async function refreshPolymarket() {
  const t0 = Date.now();
  try {
    const lists = await Promise.all(PM_TAGS.map(async (tag) => [tag, await fetchJSON(gammaUrl(tag), { timeout: 15000 })]));
    const events = normalizeEvents(lists);
    await putRow('polymarket', { payload: { events, source: 'Polymarket Gamma API (public)', via: 'server', updated: new Date().toISOString() }, ttl_seconds: 300, status: 'ok', error: null,
      meta: { label: LABELS.polymarket, lastOk: new Date().toISOString(), latencyMs: Date.now() - t0, count: events.length } });
    return { key: 'polymarket', ok: true };
  } catch (e) {
    const msg = String(e?.message || e).slice(0, 200);
    if (/451/.test(msg)) { // geo-blocked from the server region: the browser fetches the same public endpoint directly
      await putRow('polymarket', { payload: { events: [], blocked: true, error: msg, tags: PM_TAGS, clientUrls: PM_TAGS.map((t) => [t, gammaUrl(t)]) }, ttl_seconds: 300, status: 'degraded',
        error: 'HTTP 451 from server region - browser fetches directly', meta: { label: LABELS.polymarket, lastError: new Date().toISOString() } });
      return { key: 'polymarket', ok: false, blocked: true };
    }
    const prev = await getRow('polymarket').catch(() => null);
    await putRow('polymarket', { payload: prev?.payload?.events?.length ? prev.payload : { events: [], blocked: false, error: msg, tags: PM_TAGS, clientUrls: PM_TAGS.map((t) => [t, gammaUrl(t)]) }, ttl_seconds: 300,
      status: prev?.payload?.events?.length ? 'degraded' : 'down', error: msg, meta: { ...(prev?.meta || {}), label: LABELS.polymarket, lastError: new Date().toISOString() } });
    return { key: 'polymarket', ok: false, error: msg };
  }
}

// ---------- Manifold Markets public API (play-money) ----------
const MF_TOPICS = [['geopolitics', 'geopolitics'], ['middle-east', 'geopolitics'], ['ukraine', 'geopolitics'], ['world-default', 'world'], ['politics-default', 'politics'], ['elections', 'elections']];
export const refreshManifold = () => runSource('manifold', LABELS.manifold, 300, async () => {
  const lists = await Promise.all(MF_TOPICS.map(([slug, tag]) => fetchJSON(`https://api.manifold.markets/v0/search-markets?term=&topicSlug=${slug}&limit=40&filter=open&sort=24-hour-vol&contractType=BINARY`, { timeout: 15000 }).then((a) => [tag, a]).catch(() => [tag, []])));
  if (lists.every(([, a]) => !a.length)) throw new Error('all Manifold topic queries failed');
  const seen = new Set(), out = [];
  for (const [tag, arr] of lists) for (const m of arr) {
    if (seen.has(m.id) || BAD.test(m.question) || !Number.isFinite(m.probability) || (m.uniqueBettorCount || 0) < 8) continue; seen.add(m.id);
    out.push({ id: 'mf:' + m.id, title: m.question, url: m.url, tag, volume24h: m.volume24Hours || 0, bettors: m.uniqueBettorCount || 0, closeTime: m.closeTime ? new Date(m.closeTime).toISOString() : null,
      markets: [{ id: m.id, label: 'Yes', yes: m.probability, change24h: null }] });
  }
  out.sort((a, b) => b.volume24h - a.volume24h || b.bettors - a.bettors);
  const events = out.slice(0, 80);
  return { events, count: events.length, source: 'Manifold Markets API (public, play-money)', updated: new Date().toISOString() };
});

// ---------- NOAA National Hurricane Center active storms ----------
const NHC_CLASS = { HU: 'Hurricane', TS: 'Tropical Storm', TD: 'Tropical Depression', STS: 'Subtropical Storm', STD: 'Subtropical Depression', PTC: 'Post-Tropical Cyclone', PC: 'Potential Tropical Cyclone' };
export const refreshNhc = () => runSource('nhc', LABELS.nhc, 300, async () => {
  const d = await fetchJSON('https://www.nhc.noaa.gov/CurrentStorms.json');
  const items = (d.activeStorms || []).map((s) => tagGeo({ id: 'nhc:' + s.id, type: 'storm', title: `${NHC_CLASS[s.classification] || s.classification} ${s.name}`,
    lat: s.latitudeNumeric, lon: s.longitudeNumeric, time: s.lastUpdate, url: s.publicAdvisory?.url || 'https://www.nhc.noaa.gov/', source: 'NOAA NHC',
    severity: s.classification === 'HU' ? 3 : s.classification === 'TS' ? 2 : 1,
    detail: `${s.intensity} kt · ${s.pressure} mb · moving ${s.movementDir}° at ${s.movementSpeed} kt · advisory ${s.publicAdvisory?.advNum || ''}` }));
  return { items, updated: new Date().toISOString() };
});

// ---------- 7-day statistical risk outlook (GDELT 1.0 daily exports; ONE day per run) ----------
const RISK_DAYS = 7;
const ROOT_TYPE = { '18': 'attack', '19': 'conflict', '20': 'conflict', '14': 'protest', '15': 'military', '17': 'unrest', '13': 'unrest' };
const dayStr = (d) => d.toISOString().slice(0, 10).replace(/-/g, '');
export const riskDays = (now = Date.now()) => { const out = []; for (let i = RISK_DAYS; i >= 1; i--) out.push(dayStr(new Date(now - i * 86400e3))); return out; };
export function parseDailyCsv(csv) {
  const seen = new Set(); const out = {};
  for (const line of csv.split('\n')) {
    const c = line.split('\t');
    if (c.length < 58) continue;
    const root = c[28], type = ROOT_TYPE[root];
    if (!type) continue;
    if (root === '13' && c[26] !== '138') continue;
    if (root === '17' && !['173', '175', '171'].includes(c[26])) continue;
    if (root === '15' && !['152', '154'].includes(c[26])) continue;
    const lat = parseFloat(c[53]), lon = parseFloat(c[54]);
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || c[49] === '0') continue;
    const key = c[57] + root;
    if (seen.has(key)) continue; seen.add(key);
    const iso = countryAt(lat, lon); if (!iso) continue;
    const s = (out[iso] ||= { conflict: 0, attack: 0, military: 0, protest: 0, unrest: 0 });
    s[type]++;
  }
  return out;
}
const riskScore = (s) => (s ? s.conflict * 3 + s.attack * 2 + s.military + 0.5 * (s.protest + s.unrest) : 0);
/** Pure trend computation, identical to the original risk.js. `byDay` = [{day, countries:{iso:{...}}}] oldest→newest. */
export function computeRisk(days, byDay, gdacsItems = [], names = {}, regionOfFn = regionOf) {
  const isos = new Set(byDay.flatMap((l) => Object.keys(l.countries)));
  const alerts = {};
  for (const a of gdacsItems) if (a.country && a.severity >= 2) alerts[a.country] = (alerts[a.country] || 0) + 1;
  const countries = [];
  for (const iso of isos) {
    const series = byDay.map((l) => Math.round(riskScore(l.countries[iso])));
    const total = series.reduce((a, b) => a + b, 0);
    if (total < 40) continue;
    const recent = (series[4] + series[5] + series[6]) / 3, prior = (series[0] + series[1] + series[2] + series[3]) / 4;
    const n = series.length, mx = (n - 1) / 2, my = total / n;
    let num = 0, den = 0; series.forEach((y, x) => { num += (x - mx) * (y - my); den += (x - mx) ** 2; });
    const slopePct = my ? Math.round((num / den / my) * 100) : 0;
    const change = prior ? Math.round(((recent - prior) / prior) * 100) : 0;
    const trend = change >= 25 && slopePct > 3 ? 'rising' : change <= -25 && slopePct < -3 ? 'falling' : 'stable';
    countries.push({ country: iso, name: names[iso] || iso, region: regionOfFn(iso), series, total, change, slopePct, trend, gdacsAlerts: alerts[iso] || 0 });
  }
  countries.sort((a, b) => b.total - a.total);
  return { days, countries };
}
const RISK_METHOD = '7 complete UTC days of GDELT 1.0 CAMEO-coded events (fighting×3, attacks×2, military posture×1, protest/repression×0.5), deduped by source URL. Trend = last-3-day mean vs prior-4-day mean (±25%) confirmed by least-squares slope. GDACS = active orange/red alerts. Statistical description of reporting volume — not a forecast.';

export async function refreshRisk() {
  const s = await db();
  const t0 = Date.now();
  const days = riskDays();
  let loadedDay = null, error = null;
  try {
    await s.from('gdelt_day_counts').delete().lt('day', days[0]);
    const { data: have } = await s.from('gdelt_day_counts').select('day').in('day', days);
    const haveSet = new Set((have || []).map((r) => r.day));
    const missing = days.filter((d) => !haveSet.has(d)).reverse(); // newest first
    if (missing[0]) {
      const day = missing[0];
      try {
        const buf = await fetchBuffer(`https://data.gdeltproject.org/events/${day}.export.CSV.zip`, { timeout: 45000 });
        const csv = strFromU8(Object.values(unzipSync(buf))[0]);
        const counts = parseDailyCsv(csv);
        const rows = Object.entries(counts).map(([country, c]) => ({ day, country, ...c }));
        if (!rows.length) rows.push({ day, country: '--', conflict: 0, attack: 0, military: 0, protest: 0, unrest: 0 }); // marker: day processed
        const { error: ue } = await s.from('gdelt_day_counts').upsert(rows);
        if (ue) throw new Error(ue.message);
        loadedDay = day;
      } catch (e) { error = `${day}: ${String(e?.message || e).slice(0, 120)}`; }
    }
    const { data: all } = await s.from('gdelt_day_counts').select('*').in('day', days);
    const present = new Set((all || []).map((r) => r.day));
    const byDay = days.map((d) => ({ day: d, countries: {} }));
    for (const r of all || []) { if (r.country === '--') continue; byDay[days.indexOf(r.day)].countries[r.country] = r; }
    const failedDays = days.filter((d) => !present.has(d));
    const gdacs = (await getRow('gdacs'))?.payload?.items || [];
    const { COUNTRY_NAMES } = await import('./geo.ts');
    const payload = failedDays.length === days.length ? { pending: true, countries: [], days: [] }
      : { ...computeRisk(days, byDay, gdacs, COUNTRY_NAMES), method: RISK_METHOD, updated: new Date().toISOString(), failedDays };
    if (failedDays.length) payload.note = `building: ${days.length - failedDays.length}/${days.length} days loaded`;
    await putRow('risk', { payload, ttl_seconds: 3600, status: failedDays.length > 2 && !missing.length ? 'degraded' : error && failedDays.length > 2 ? 'degraded' : 'ok',
      error: error || (failedDays.length ? `missing days: ${failedDays.join(',')}` : null),
      meta: { label: LABELS.risk, lastOk: new Date().toISOString(), latencyMs: Date.now() - t0, count: payload.countries.length } });
    return { key: 'risk', ok: !error, loadedDay, failedDays, error };
  } catch (e) {
    const prev = await getRow('risk').catch(() => null);
    await putRow('risk', { payload: prev?.payload ?? null, ttl_seconds: 3600, status: prev?.payload ? 'degraded' : 'down', error: String(e?.message || e).slice(0, 200), meta: { ...(prev?.meta || {}), label: LABELS.risk, lastError: new Date().toISOString() } });
    return { key: 'risk', ok: false, error: String(e?.message || e) };
  }
}

export const JOBS = {
  fast: () => Promise.all([refreshQuakes(), gdeltBackfill()]),
  hazards: () => Promise.all([refreshEonet(), refreshGdacs(), refreshNws(), refreshGdeltDocOne()]),
  gdelt: () => refreshGdelt(),
  news: (part = 0) => refreshNews(part),
  kev: () => refreshKev(),
  iptv: () => refreshIptv(),
  markets: () => Promise.all([refreshPolymarket(), refreshManifold(), refreshNhc()]),
  risk: () => refreshRisk(),
};
