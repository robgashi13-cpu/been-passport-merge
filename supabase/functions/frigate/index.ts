// @ts-nocheck
// Frigate NVR proxy (private: signed-in + allowlisted). READ-ONLY: only GET requests to Frigate's HTTP API
// plus POST /api/login to obtain a session. Never changes Frigate config, cameras, PTZ or recordings.
//
// Secrets (Lovable Cloud → Secrets; never sent to the browser):
//   FRIGATE_URL       public HTTPS base of Frigate's authenticated port (8971), e.g. https://<host>.ts.net
//   FRIGATE_USER      Frigate user (ideally a "viewer" role user)
//   FRIGATE_PASSWORD  its password
// Fallback when those env secrets are not set: rows frigate_url / frigate_user / frigate_password in
// public.hq_secrets (RLS on, no policies, service-role only — same store as the cron key).
// Without either, every route answers { configured: false }.
import { guarded, subPath } from '../_shared/guard.ts';
import { db } from '../_shared/wi/cache.ts';

const CAM_RE = /^[A-Za-z0-9_-]{1,64}$/;
const EVT_RE = /^[A-Za-z0-9._-]{1,80}$/;
let session: { token: string; exp: number } | null = null;

let dbCfg: { v: Record<string, string>; exp: number } | null = null;
async function fromDb(): Promise<Record<string, string>> {
  if (dbCfg && dbCfg.exp > Date.now()) return dbCfg.v;
  const v: Record<string, string> = {};
  try {
    const s = await db();
    const { data } = await s.from('hq_secrets').select('name,value').in('name', ['frigate_url', 'frigate_user', 'frigate_password']);
    for (const r of data || []) v[r.name] = r.value;
  } catch { /* ignore */ }
  dbCfg = { v, exp: Date.now() + 5 * 60e3 };
  return v;
}

async function cfg() {
  let url = Deno.env.get('FRIGATE_URL') || '';
  let user = Deno.env.get('FRIGATE_USER') || '';
  let password = Deno.env.get('FRIGATE_PASSWORD') || '';
  if (!url) {
    const v = await fromDb();
    url = v.frigate_url || '';
    user = v.frigate_user || '';
    password = v.frigate_password || '';
  }
  url = url.replace(/\/+$/, '');
  return { url, user, password, ok: /^https:\/\//.test(url) };
}

async function login(c, force = false) {
  if (!c.user) return null; // Frigate with auth disabled (trusted proxy) — no token needed
  if (!force && session && session.exp > Date.now()) return session.token;
  const r = await fetch(`${c.url}/api/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ user: c.user, password: c.password }),
    signal: AbortSignal.timeout(10000),
  });
  if (!r.ok) throw new Error(`frigate login ${r.status}`);
  const m = (r.headers.get('set-cookie') || '').match(/frigate_token=([^;]+)/);
  if (!m) throw new Error('frigate login: no token');
  session = { token: m[1], exp: Date.now() + 30 * 60e3 };
  return session.token;
}

async function fget(c, path, { timeout = 12000, retry = true } = {}) {
  const token = await login(c);
  const headers: Record<string, string> = {};
  if (token) { headers['cookie'] = `frigate_token=${token}`; headers['authorization'] = `Bearer ${token}`; }
  const r = await fetch(`${c.url}${path}`, { headers, signal: AbortSignal.timeout(timeout) });
  if (r.status === 401 && retry && c.user) { await login(c, true); return fget(c, path, { timeout, retry: false }); }
  return r;
}

const json = (v, status = 200) => Response.json(v, { status, headers: { 'cache-control': 'no-store' } });

async function passthrough(c, path, type, timeout = 15000) {
  const r = await fget(c, path, { timeout });
  if (!r.ok) return new Response(`upstream ${r.status}`, { status: r.status === 404 ? 404 : 502 });
  return new Response(r.body, { headers: { 'content-type': r.headers.get('content-type') || type, 'cache-control': type.startsWith('image/') && path.includes('latest.jpg') ? 'no-store' : 'private, max-age=5' } });
}

let statusCache = null;
let statusPending = null;
async function status(c) {
  if (statusCache && statusCache.exp > Date.now()) return json(statusCache.data);
  if (statusPending) return json(await statusPending);
  statusPending = readStatus(c);
  try {
    const data = await statusPending;
    if (data.reachable) statusCache = { data, exp: Date.now() + 5000 };
    return json(data);
  } finally { statusPending = null; }
}
async function readStatus(c) {
  const t0 = Date.now();
  const [cfgR, statsR, verR] = await Promise.all([fget(c, '/api/config'), fget(c, '/api/stats'), fget(c, '/api/version')]);
  if (!cfgR.ok) return { configured: true, reachable: false, error: `config ${cfgR.status}` };
  const conf = await cfgR.json();
  const stats = statsR.ok ? await statsR.json() : {};
  const version = verR.ok ? (await verR.text()).trim() : null;
  const cams = Object.entries(conf.cameras || {}).map(([name, cc]: any) => {
    const st = stats[name] || stats.cameras?.[name] || {};
    const enabled = cc.enabled !== false && cc.enabled_in_config !== false;
    const fps = Number(st.camera_fps ?? 0);
    return {
      name,
      label: cc.friendly_name || name.replace(/_/g, ' '),
      enabled,
      online: enabled && fps > 0,
      fps: Math.round(fps * 10) / 10,
      detectFps: Math.round(Number(st.detection_fps ?? 0) * 10) / 10,
      width: cc.detect?.width ?? null,
      height: cc.detect?.height ?? null,
      recording: !!cc.record?.enabled,
      objects: cc.objects?.track || [],
      ptz: !!cc.onvif?.host,
    };
  });
  return {
    configured: true,
    reachable: true,
    version,
    uptime: stats.service?.uptime ?? null,
    storage: stats.service?.storage?.['/media/frigate/recordings'] ?? null,
    latencyMs: Date.now() - t0,
    cameras: cams,
    updated: new Date().toISOString(),
  };
}

async function events(c, q) {
  const p = new URLSearchParams();
  p.set('limit', String(Math.min(100, Math.max(1, Number(q.get('limit') || 40)))));
  p.set('include_thumbnails', '0');
  const cam = q.get('camera'); if (cam && CAM_RE.test(cam)) p.set('cameras', cam);
  const lab = q.get('label'); if (lab && /^[a-z_]{1,32}$/.test(lab)) p.set('labels', lab);
  const before = q.get('before'); if (before && /^\d+(\.\d+)?$/.test(before)) p.set('before', before);
  const r = await fget(c, `/api/events?${p}`);
  if (!r.ok) return json({ error: `events ${r.status}` }, 502);
  const list = await r.json();
  return json({
    items: (Array.isArray(list) ? list : []).map((e) => ({
      id: e.id,
      camera: e.camera,
      label: e.label,
      subLabel: Array.isArray(e.sub_label) ? e.sub_label[0] : e.sub_label ?? null,
      score: e.data?.top_score ?? e.top_score ?? e.data?.score ?? e.score ?? null,
      start: e.start_time,
      end: e.end_time,
      hasClip: !!e.has_clip,
      hasSnapshot: !!e.has_snapshot,
      zones: e.zones || [],
    })),
    updated: new Date().toISOString(),
  });
}

Deno.serve(guarded(async (req) => {
  const c = await cfg();
  const path = subPath(req, 'frigate');
  if (!c.ok) return json({ configured: false });
  const q = new URL(req.url).searchParams;
  try {
    if (path === '' || path === 'status') return await status(c);
    if (path === 'events') return await events(c, q);
    let m = path.match(/^snapshot\/([^/]+)$/);
    if (m && CAM_RE.test(m[1])) {
      const h = Math.min(1080, Math.max(120, Number(q.get('h') || 480)));
      return await passthrough(c, `/api/${m[1]}/latest.jpg?h=${h}`, 'image/jpeg');
    }
    m = path.match(/^event\/([^/]+)\/(thumb|snapshot|clip)$/);
    if (m && EVT_RE.test(m[1])) {
      if (m[2] === 'thumb') return await passthrough(c, `/api/events/${m[1]}/thumbnail.webp`, 'image/webp');
      if (m[2] === 'snapshot') return await passthrough(c, `/api/events/${m[1]}/snapshot.jpg?bbox=1`, 'image/jpeg');
      return await passthrough(c, `/api/events/${m[1]}/clip.mp4`, 'video/mp4', 60000);
    }
    return json({ error: 'not found' }, 404);
  } catch (e) {
    return json({ configured: true, reachable: false, error: String(e?.message || e).slice(0, 160) }, 200);
  }
}));
