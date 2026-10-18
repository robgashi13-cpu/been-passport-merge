// @ts-nocheck
// Web Worker: fetch + JSON.parse + normalise/sort the combined event layer (GDELT + USGS + EONET + GDACS + NWS)
// off the main thread, so the globe's render loop never stalls on a ~1 MB payload.
// The session Bearer token is passed in via postMessage (workers can't read localStorage).
const KNOWN = new Set(['conflict', 'attack', 'military', 'protest', 'unrest', 'quake', 'fire', 'storm', 'volcano', 'flood', 'weather', 'drought', 'disaster']);
const norm = (t) => (t === 'ice' || t === 'dust' ? 'drought' : KNOWN.has(t) ? t : 'disaster');
let timer = null, hours = 6, busy = false, token = '';
async function load() {
  if (busy) return; busy = true;
  try {
    const t0 = performance.now();
    const r = await fetch(`${String(import.meta.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '')}/functions/v1/wi-api/events?hours=${hours}`, { headers: { Authorization: `Bearer ${token}` } });
    if (r.status === 401) { postMessage({ type: 'auth' }); return; }
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const d = await r.json();
    const items = d.items.map((e) => ({ ...e, type: norm(e.type), t: Date.parse(e.time), rank: e.severity * 10 + Math.log2(1 + (e.numArticles || (e.mag ? e.mag * 3 : 4))) }));
    items.sort((a, b) => b.t - a.t);
    postMessage({ type: 'data', items, gdeltUpdated: d.gdeltUpdated, updated: d.updated, ms: Math.round(performance.now() - t0) });
  } catch (e) { postMessage({ type: 'error', error: String(e.message || e) }); }
  finally { busy = false; }
}
onmessage = (m) => {
  if (m.data.type === 'token') { token = m.data.token || token; return; }
  if (m.data.type === 'start') { hours = m.data.hours; token = m.data.token || token; clearInterval(timer); load(); timer = setInterval(load, m.data.interval || 90000); }
  if (m.data.type === 'refresh') load();
  if (m.data.type === 'stop') clearInterval(timer);
};
