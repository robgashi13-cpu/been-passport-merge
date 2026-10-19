// @ts-nocheck
// korautoks.com car lookup — STRICTLY READ-ONLY, private (signed-in + allowlisted via guarded()).
//
// Reads the korautoks.com website database (Supabase project pzrfwoxtajvxvrwajqpd) through its
// public PostgREST API with HTTP GET only. Nothing here can write: no POST/PATCH/DELETE to the
// website's REST API is ever issued (the only POST is an optional auth sign-in, which creates a
// session and changes no data).
//
// Config (Lovable Secrets override rows in public.hq_secrets, which is service-role only):
//   KORAUTOKS_ANON_KEY     / hq_secrets.korautoks_anon_key   the website's public (anon) key — the
//                          same key korautoks.com ships to every visitor. Sees published cars only.
//   KORAUTOKS_SUPABASE_URL (optional) defaults to https://pzrfwoxtajvxvrwajqpd.supabase.co
//   KORAUTOKS_READ_EMAIL + KORAUTOKS_READ_PASSWORD (optional) a korautoks.com login; when set, reads
//                          run with that user's session so cars hidden from the public (unpublished,
//                          hidden) are also found if the account is allowed to see them.
import { guarded, subPath } from '../_shared/guard.ts';
import { db } from '../_shared/wi/cache.ts';

const env = (k) => (Deno.env.get(k) || '').trim();
let dbCfg = null;
async function cfg() {
  if (!dbCfg || dbCfg.exp < Date.now()) {
    const v = {};
    try {
      const s = await db();
      const { data } = await s.from('hq_secrets').select('name,value').in('name', ['korautoks_anon_key']);
      for (const r of data || []) v[r.name] = r.value;
    } catch { /* ignore */ }
    dbCfg = { v, exp: Date.now() + 5 * 60e3 };
  }
  const url = (env('KORAUTOKS_SUPABASE_URL') || 'https://pzrfwoxtajvxvrwajqpd.supabase.co').replace(/\/+$/, '');
  const anon = env('KORAUTOKS_ANON_KEY') || dbCfg.v.korautoks_anon_key || '';
  return { url, anon, email: env('KORAUTOKS_READ_EMAIL'), password: env('KORAUTOKS_READ_PASSWORD'), ok: !!anon };
}

let session = null;
async function bearerFor(c) {
  if (!c.email || !c.password) return { token: c.anon, mode: 'public' };
  if (session && session.exp - Date.now() > 120e3) return { token: session.token, mode: 'login' };
  try {
    const r = await fetch(`${c.url}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { apikey: c.anon, 'content-type': 'application/json' },
      body: JSON.stringify({ email: c.email, password: c.password }),
      signal: AbortSignal.timeout(10000),
    });
    if (!r.ok) return { token: c.anon, mode: 'public', loginError: `login ${r.status}` };
    const j = await r.json();
    session = { token: j.access_token, exp: Date.now() + (j.expires_in || 3600) * 1000 };
    return { token: session.token, mode: 'login' };
  } catch { return { token: c.anon, mode: 'public', loginError: 'login failed' }; }
}

/** GET-only PostgREST helper. */
async function get(c, auth, path) {
  const r = await fetch(`${c.url}/rest/v1/${path}`, {
    method: 'GET',
    headers: { apikey: c.anon, authorization: `Bearer ${auth.token}`, accept: 'application/json' },
    signal: AbortSignal.timeout(12000),
  });
  if (!r.ok) throw new Error(`korautoks ${path.split('?')[0]} ${r.status}`);
  return r.json();
}

const LIST_COLS = 'id,name,brand,model,year,price,mileage,mileage_num,fuel,transmission,lot,vin,plate_number,primary_image_url,image_count,is_published,inventory_hidden,sold_status,external_source,origin_country,updated_at,created_at';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const enc = encodeURIComponent;
export const normPlate = (s) => String(s || '').replace(/[\s\-·.]/g, '').toUpperCase();

/** Work out which identifiers a query could be and run the matching indexed lookups. */
async function search(c, auth, raw) {
  const q = String(raw || '').trim().slice(0, 40);
  if (q.length < 3) return { query: q, kinds: [], items: [] };
  const compact = q.replace(/[\s\-]/g, '');
  const up = compact.toUpperCase();
  const tasks = [];
  const kinds = [];
  if (UUID_RE.test(q)) { kinds.push('id'); tasks.push(get(c, auth, `cars?select=${LIST_COLS}&id=eq.${q}`).then((r) => r.map((x) => ({ ...x, _match: 'id' })))); }
  if (/^[A-Z0-9]{11,17}$/.test(up) && /[A-Z]/.test(up)) {
    kinds.push('vin');
    tasks.push(get(c, auth, `cars?select=${LIST_COLS}&vin=eq.${enc(up)}&limit=25`).then((r) => r.map((x) => ({ ...x, _match: 'vin' }))));
  }
  if (/^\d{5,12}$/.test(compact)) {
    kinds.push('lot');
    tasks.push(get(c, auth, `cars?select=${LIST_COLS}&lot=eq.${compact}&limit=25`).then((r) => r.map((x) => ({ ...x, _match: 'lot' }))));
  }
  // Korean plates end in 4 digits (e.g. "179가3084"); the site indexes plate_last4.
  const last4 = (compact.match(/(\d{4})$/) || [])[1];
  if (last4 && compact.length <= 10) {
    kinds.push('plate');
    const want = normPlate(q);
    tasks.push(get(c, auth, `cars?select=${LIST_COLS}&plate_last4=eq.${last4}&order=updated_at.desc&limit=200`).then((r) =>
      r.filter((x) => compact.length === 4 || normPlate(x.plate_number) === want || normPlate(x.plate_number).endsWith(want))
        .map((x) => ({ ...x, _match: 'plate' }))));
  }
  const results = await Promise.allSettled(tasks);
  const seen = new Map();
  for (const r of results) if (r.status === 'fulfilled') for (const x of r.value) if (!seen.has(x.id)) seen.set(x.id, x);
  const errors = results.filter((r) => r.status === 'rejected').map((r) => String(r.reason?.message || r.reason).slice(0, 120));
  const order = { id: 0, vin: 1, lot: 2, plate: 3 };
  const items = [...seen.values()].sort((a, b) => (order[a._match] - order[b._match]) || String(b.updated_at).localeCompare(String(a.updated_at))).slice(0, 60);
  return { query: q, kinds, items, errors };
}

async function car(c, auth, id) {
  if (!UUID_RE.test(id)) return null;
  const [rows, images] = await Promise.all([
    get(c, auth, `cars?select=*&id=eq.${id}`),
    get(c, auth, `car_images?select=image_url,is_primary,sort_order&car_id=eq.${id}&order=sort_order&limit=80`).catch(() => []),
  ]);
  const row = rows[0];
  if (!row) return null;
  return { car: row, images: images.map((i) => i.image_url).filter(Boolean), publicUrl: `https://korautoks.com/katallog/${row.id}` };
}

Deno.serve(guarded(async (req) => {
  if (req.method !== 'GET') return Response.json({ error: 'read-only' }, { status: 405 });
  const c = await cfg();
  const route = subPath(req, 'korautoks');
  const u = new URL(req.url);
  if (route === 'status') {
    const auth = c.ok ? await bearerFor(c) : { mode: 'none' };
    return Response.json({ configured: c.ok, mode: auth.mode, loginError: auth.loginError || null }, { headers: { 'cache-control': 'no-store' } });
  }
  if (!c.ok) return Response.json({ configured: false, error: 'not configured' }, { status: 503 });
  const auth = await bearerFor(c);
  if (route === 'search') {
    const out = await search(c, auth, u.searchParams.get('q'));
    return Response.json({ ...out, mode: auth.mode }, { headers: { 'cache-control': 'no-store' } });
  }
  if (route === 'car') {
    const out = await car(c, auth, u.searchParams.get('id') || '');
    if (!out) return Response.json({ error: 'not found' }, { status: 404 });
    return Response.json({ ...out, mode: auth.mode }, { headers: { 'cache-control': 'no-store' } });
  }
  return Response.json({ error: 'not found' }, { status: 404 });
}));
