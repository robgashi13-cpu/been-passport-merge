// @ts-nocheck
// api_cache helpers: each upstream source writes one row (payload + ok/degraded/down status) that drives SYSTEM STATUS.
const UA = 'WorldIntelDashboard/1.0 (+https://github.com/; public-data dashboard)';

import { createClient } from 'npm:@supabase/supabase-js@2';
let admin = null;
export async function db() {
  // Service-role client (edge-function env only; never shipped to the browser).
  return (admin ||= createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false, autoRefreshToken: false } }));
}

export async function getRow(key) {
  const s = await db();
  const { data } = await s.from('api_cache').select('*').eq('key', key).maybeSingle();
  return data;
}
export async function getRows(keys) {
  const s = await db();
  const { data } = await s.from('api_cache').select('*').in('key', keys);
  return Object.fromEntries((data || []).map((r) => [r.key, r]));
}
export async function getPayload(key, fallback = null) {
  const r = await getRow(key);
  return r?.payload ?? fallback;
}
export async function putRow(key, row) {
  const s = await db();
  const { error } = await s.from('api_cache').upsert({ key, updated_at: new Date().toISOString(), ...row });
  if (error) throw new Error('cache write: ' + error.message);
}

/** Run a refresh job for one cache key; on failure keep the previous payload (degraded) or mark down. */
export async function runSource(key, label, ttlSec, fn) {
  const t0 = Date.now();
  try {
    const v = await fn();
    await putRow(key, { payload: v, ttl_seconds: ttlSec, status: 'ok', error: null,
      meta: { label, lastOk: new Date().toISOString(), latencyMs: Date.now() - t0, count: Array.isArray(v?.items) ? v.items.length : (v?.count ?? null) } });
    return { key, ok: true };
  } catch (e) {
    const msg = String(e?.message || e).slice(0, 200);
    const prev = await getRow(key).catch(() => null);
    if (prev?.payload) {
      const s = await db();
      await s.from('api_cache').update({ status: 'degraded', error: msg, meta: { ...(prev.meta || {}), label, lastError: new Date().toISOString() } }).eq('key', key);
    } else {
      await putRow(key, { payload: null, ttl_seconds: ttlSec, status: 'down', error: msg, meta: { label, lastError: new Date().toISOString() } });
    }
    return { key, ok: false, error: msg };
  }
}

export async function fetchText(url, { timeout = 20000, headers = {} } = {}) {
  const ctl = new AbortController();
  const tm = setTimeout(() => ctl.abort(), timeout);
  try {
    const r = await fetch(url, { signal: ctl.signal, headers: { 'User-Agent': UA, Accept: '*/*', ...headers }, redirect: 'follow' });
    if (!r.ok) throw new Error(`HTTP ${r.status} ${url.slice(0, 80)}`);
    return await r.text();
  } finally { clearTimeout(tm); }
}
export async function fetchJSON(url, opts) { return JSON.parse(await fetchText(url, opts)); }
export async function fetchBuffer(url, { timeout = 30000 } = {}) {
  const ctl = new AbortController();
  const tm = setTimeout(() => ctl.abort(), timeout);
  try {
    const r = await fetch(url, { signal: ctl.signal, headers: { 'User-Agent': UA } });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return new Uint8Array(await r.arrayBuffer());
  } finally { clearTimeout(tm); }
}

/** Run async tasks with at most `n` in flight (runtime allows ~6 concurrent outbound requests). */
export async function pool(items, n, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (i < items.length) { const k = i++; try { out[k] = await fn(items[k], k); } catch (e) { out[k] = { error: e }; } }
  }));
  return out;
}
