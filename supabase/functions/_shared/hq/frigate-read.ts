// @ts-nocheck
// Minimal READ-ONLY Frigate client for notifications (hq-notify). Same credentials as the `frigate`
// function (FRIGATE_URL / FRIGATE_USER / FRIGATE_PASSWORD env, or hq_secrets rows). Only POST /api/login
// (to get a session) and GET /api/events. Never returns media, never changes Frigate.
import { db } from '../wi/cache.ts';

let session = null;
let dbCfg = null;

async function cfg() {
  let url = Deno.env.get('FRIGATE_URL') || '';
  let user = Deno.env.get('FRIGATE_USER') || '';
  let password = Deno.env.get('FRIGATE_PASSWORD') || '';
  if (!url) {
    if (!dbCfg || dbCfg.exp < Date.now()) {
      const v = {};
      try {
        const s = await db();
        const { data } = await s.from('hq_secrets').select('name,value').in('name', ['frigate_url', 'frigate_user', 'frigate_password']);
        for (const r of data || []) v[r.name] = r.value;
      } catch { /* ignore */ }
      dbCfg = { v, exp: Date.now() + 5 * 60e3 };
    }
    url = dbCfg.v.frigate_url || '';
    user = dbCfg.v.frigate_user || '';
    password = dbCfg.v.frigate_password || '';
  }
  url = url.replace(/\/+$/, '');
  return { url, user, password, ok: /^https:\/\//.test(url) };
}

async function login(c, force = false) {
  if (!c.user) return null;
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

async function get(c, path, retry = true) {
  const token = await login(c);
  const headers = {};
  if (token) { headers.cookie = `frigate_token=${token}`; headers.authorization = `Bearer ${token}`; }
  const r = await fetch(`${c.url}${path}`, { headers, redirect: 'error', signal: AbortSignal.timeout(12000) });
  if (r.status === 401 && retry && c.user) { await r.body?.cancel(); await login(c, true); return get(c, path, false); }
  return r;
}

/** Frigate events that started after `afterSec` (epoch seconds), newest first. */
export async function frigateEventsSince(afterSec: number, limit = 50) {
  const c = await cfg();
  if (!c.ok) return { configured: false, items: [] };
  const p = new URLSearchParams({ limit: String(limit), include_thumbnails: '0', after: String(Math.floor(afterSec)) });
  const r = await get(c, `/api/events?${p}`);
  if (!r.ok) { await r.body?.cancel(); throw new Error(`frigate events ${r.status}`); }
  const list = await r.json();
  return {
    configured: true,
    items: (Array.isArray(list) ? list : []).filter((e) => Number(e.start_time) > afterSec).map((e) => ({
      id: String(e.id),
      camera: String(e.camera || ''),
      label: String(e.label || 'object'),
      subLabel: Array.isArray(e.sub_label) ? e.sub_label[0] : e.sub_label ?? null,
      score: e.data?.top_score ?? e.top_score ?? e.data?.score ?? e.score ?? null,
      start: Number(e.start_time),
      zones: e.zones || [],
    })),
  };
}
