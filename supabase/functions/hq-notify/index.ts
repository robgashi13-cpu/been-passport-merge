// @ts-nocheck
// HQ notifications feed (private). READ-ONLY on both sources:
//   • Frigate: new detection events (GET /api/events) — text only, never snapshots or video.
//   • KORAUTO Manager: cars added or edited (GET cars?updated_at=gt.…) — identity fields only.
// Auth, one of:
//   • Authorization: Bearer <session token> of a signed-in, allowlisted user (the web app), or
//   • x-hq-device: <device key> issued by POST /register to a signed-in, allowlisted user. The HQ iPhone app
//     stores it in the Keychain so its background refresh can read this feed while the web session sleeps.
//     The key can ONLY read this text feed (no cameras, no media, no other function) and stops working as
//     soon as the email is removed from public.allowed_emails or after 180 days.
import { db } from '../_shared/wi/cache.ts';
import { frigateEventsSince } from '../_shared/hq/frigate-read.ts';
import { getCarChangesSince } from '../_shared/hq/korauto.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-hq-device',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};
const json = (v, status = 200) => Response.json(v, { status, headers: { ...CORS, 'cache-control': 'no-store' } });
const TZ = 'Europe/Belgrade';
const DEVICE_TTL = 180 * 864e2; // seconds
const enc = new TextEncoder();
const b64 = (bytes) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const un64 = (v) => Uint8Array.from(atob(v.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

async function hmacKey() {
  const secret = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  if (!secret) throw new Error('signing unavailable');
  return crypto.subtle.importKey('raw', enc.encode(`hq-notify-device-v1:${secret}`), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

async function allowed(email) {
  if (!email) return false;
  const s = await db();
  const { data } = await s.from('allowed_emails').select('email').eq('email', email.toLowerCase()).maybeSingle();
  return !!data;
}

async function userEmail(req) {
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token || token.length > 4000 || token.split('.').length !== 3) return null;
  try {
    const s = await db();
    const { data, error } = await s.auth.getUser(token);
    const email = data?.user?.email?.toLowerCase();
    return !error && email && await allowed(email) ? email : null;
  } catch { return null; }
}

async function issueDeviceKey(email) {
  const now = Math.floor(Date.now() / 1000);
  const payload = b64(enc.encode(JSON.stringify({ e: email, iat: now, exp: now + DEVICE_TTL, n: crypto.randomUUID().slice(0, 8) })));
  const sig = await crypto.subtle.sign('HMAC', await hmacKey(), enc.encode(payload));
  return { key: `${payload}.${b64(new Uint8Array(sig))}`, expires: new Date((now + DEVICE_TTL) * 1000).toISOString() };
}

const deviceOk = new Map();
async function deviceEmail(req) {
  const key = req.headers.get('x-hq-device') || '';
  if (!key || key.length > 600) return null;
  const hit = deviceOk.get(key);
  if (hit && Date.now() - hit.t < 60e3) return hit.email;
  let email = null;
  try {
    const [payload, sig] = key.split('.');
    if (payload && sig && await crypto.subtle.verify('HMAC', await hmacKey(), un64(sig), enc.encode(payload))) {
      const g = JSON.parse(new TextDecoder().decode(un64(payload)));
      if (typeof g.e === 'string' && Number.isInteger(g.exp) && g.exp > Date.now() / 1000 && await allowed(g.e)) email = g.e;
    }
  } catch { email = null; }
  if (deviceOk.size > 100) deviceOk.clear();
  deviceOk.set(key, { email, t: Date.now() });
  return email;
}

const clock = (d) => new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit' }).format(d);
const nice = (s) => String(s || '').replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()).trim();
const carName = (c) => [c.make, c.model, c.year].filter(Boolean).join(' ') || 'Car';

function parseSince(raw) {
  const now = Date.now();
  let t = NaN;
  if (raw && /^\d{10,13}$/.test(raw)) t = raw.length === 13 ? Number(raw) : Number(raw) * 1000;
  else if (raw) t = Date.parse(raw);
  if (!Number.isFinite(t)) t = now - 24 * 3600e3;
  return Math.min(now, Math.max(now - 48 * 3600e3, t));
}

async function feed(q) {
  const sinceMs = parseSince(q.get('since'));
  const sinceISO = new Date(sinceMs).toISOString();
  const want = (k) => q.get(k) !== '0';
  const cursor = new Date().toISOString();
  const sources = {};
  const items = [];
  const [cam, cars] = await Promise.all([
    want('frigate') ? frigateEventsSince(sinceMs / 1000).catch((e) => ({ error: String(e?.message || e).slice(0, 80) })) : null,
    want('cars') ? getCarChangesSince(sinceISO).catch((e) => ({ error: String(e?.message || e).slice(0, 80) })) : null,
  ]);
  if (cam) {
    sources.frigate = cam.error ? 'error' : cam.configured ? 'ok' : 'not-configured';
    if (cam.error) sources.frigateError = cam.error;
    for (const e of cam.items || []) {
      const at = new Date(e.start * 1000);
      const pct = typeof e.score === 'number' ? ` · ${Math.round(e.score * 100)}%` : '';
      items.push({
        id: `frigate:${e.id}`,
        kind: 'camera',
        title: `${nice(e.subLabel || e.label)} · ${nice(e.camera)}`,
        body: `Detected at ${clock(at)}${pct}${e.zones?.length ? ` · ${e.zones.map(nice).join(', ')}` : ''}`,
        at: at.toISOString(),
        path: '/cameras',
        camera: e.camera,
        label: e.label,
      });
    }
  }
  if (cars) {
    sources.cars = cars.error ? 'error' : cars.configured ? 'ok' : 'not-configured';
    if (cars.error) sources.carsError = cars.error;
    for (const c of cars.items || []) {
      const added = c.created_at && Date.parse(c.created_at) > sinceMs;
      const at = added ? c.created_at : c.updated_at;
      items.push({
        id: added ? `car-added:${c.id}` : `car-edited:${c.id}:${c.updated_at}`,
        kind: added ? 'car_added' : 'car_edited',
        title: added ? 'New car added' : 'Car updated',
        body: `${carName(c)}${c.plate_number ? ` · ${c.plate_number}` : ''} · ${clock(new Date(at))}`,
        at,
        path: '/korauto',
        carId: c.id,
      });
    }
  }
  items.sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
  return json({ since: sinceISO, cursor, sources, items });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
  const path = new URL(req.url).pathname.replace(/^.*\/hq-notify\/?/, '');
  const q = new URL(req.url).searchParams;
  try {
    if (path === 'register') {
      if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
      const email = await userEmail(req);
      if (!email) return json({ error: 'Unauthorized' }, 401);
      return json(await issueDeviceKey(email));
    }
    if (path === '' || path === 'feed') {
      if (req.method !== 'GET') return json({ error: 'Method not allowed' }, 405);
      const email = req.headers.get('x-hq-device') ? await deviceEmail(req) : await userEmail(req);
      if (!email) return json({ error: 'Unauthorized' }, 401);
      return await feed(q);
    }
    return json({ error: 'not found' }, 404);
  } catch (e) {
    return json({ error: 'Notifications unavailable' }, 500);
  }
});
