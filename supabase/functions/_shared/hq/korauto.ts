// @ts-nocheck
/**
 * KORAUTO Manager — READ-ONLY mirror for the Robert HQ dashboard.
 *
 * Hard rule: this module NEVER writes to korautomanager. It only issues HTTP GET requests against the
 * korautomanager Supabase REST API (PostgREST `select`s) plus one password sign-in to obtain a read session.
 * No insert/update/delete/rpc/storage calls exist here — keep it that way.
 *
 * Needs these Lovable Cloud secrets (added by Robert; never commit values):
 *   KORAUTO_SUPABASE_URL       e.g. https://<project-ref>.supabase.co
 *   KORAUTO_SUPABASE_ANON_KEY  korautomanager's public anon/publishable key
 *   KORAUTO_READ_EMAIL         login of a korautomanager user allowed to view cars (ideally a viewer-only user)
 *   KORAUTO_READ_PASSWORD      its password
 * Without them the dashboard card shows a plain link to korautomanager.
 */
import { getRow, putRow } from '../wi/cache.ts';

const FEED_KEY = 'hq:korauto:feed';
const FEED_TTL_MS = 5 * 60e3;
const TZ = 'Europe/Belgrade';
let session = null; // { token, exp }

function cfg() {
  const url = (Deno.env.get('KORAUTO_SUPABASE_URL') || '').replace(/\/+$/, '');
  const anon = Deno.env.get('KORAUTO_SUPABASE_ANON_KEY') || '';
  const email = Deno.env.get('KORAUTO_READ_EMAIL') || '';
  const password = Deno.env.get('KORAUTO_READ_PASSWORD') || '';
  return { url, anon, email, password, ok: !!(url && anon && email && password) };
}

async function signIn(c) {
  if (session && session.exp - Date.now() > 120e3) return session.token;
  // Sign-in creates an auth session for the read user in korautomanager; it does not modify any data.
  const r = await fetch(`${c.url}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: c.anon, 'content-type': 'application/json' },
    body: JSON.stringify({ email: c.email, password: c.password }),
    signal: AbortSignal.timeout(12000),
  });
  if (!r.ok) throw new Error(`korauto auth ${r.status}`);
  const j = await r.json();
  session = { token: j.access_token, exp: Date.now() + (j.expires_in || 3600) * 1000 };
  return session.token;
}

async function sel(c, token, path) {
  const r = await fetch(`${c.url}/rest/v1/${path}`, {
    method: 'GET',
    headers: { apikey: c.anon, authorization: `Bearer ${token}`, accept: 'application/json' },
    signal: AbortSignal.timeout(12000),
  });
  if (!r.ok) throw new Error(`korauto ${path.split('?')[0]} ${r.status}`);
  return r.json();
}

/** Start of "today" in Kosovo time, as an ISO UTC string. */
function startOfTodayISO() {
  const now = new Date();
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).formatToParts(now).map((p) => [p.type, p.value]));
  const h = Number(parts.hour) % 24;
  const elapsed = (h * 3600 + Number(parts.minute) * 60 + Number(parts.second)) * 1000 + now.getMilliseconds();
  return new Date(now.getTime() - elapsed).toISOString();
}

const CAR_COLS = 'id,make,model,year,plate_number,status,sale_status,approval_status,delivery_status,tracking_status_label,tracking_eta,image_url,created_at,updated_at';
const safe = async (p) => { try { return await p; } catch (e) { return { __err: String(e?.message || e).slice(0, 120) }; } };
const arr = (v) => (Array.isArray(v) ? v : []);
const count = (rows, k) => { const o = {}; for (const r of rows) { const v = r?.[k] ?? 'none'; o[v] = (o[v] || 0) + 1; } return o; };

async function build(c) {
  const token = await signIn(c);
  const today = startOfTodayISO();
  const nowISO = new Date().toISOString();
  const weekISO = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
  const [todayCars, latest, updated, pending, arriving, inspections, complaints, webSales, stageRows, shipping, recentUpdates] = await Promise.all([
    safe(sel(c, token, `cars?select=${CAR_COLS}&created_at=gte.${encodeURIComponent(today)}&order=created_at.desc&limit=50`)),
    safe(sel(c, token, `cars?select=${CAR_COLS}&order=created_at.desc&limit=12`)),
    safe(sel(c, token, `cars?select=${CAR_COLS}&updated_at=gte.${encodeURIComponent(today)}&order=updated_at.desc&limit=20`)),
    safe(sel(c, token, `cars?select=id,make,model,year,created_at&approval_status=eq.pending&order=created_at.desc&limit=20`)),
    safe(sel(c, token, `cars?select=id,make,model,year,tracking_eta,tracking_status_label&tracking_eta=gte.${nowISO.slice(0, 10)}&tracking_eta=lte.${weekISO}&order=tracking_eta.asc&limit=8`)),
    safe(sel(c, token, `inspections?select=id,make,model,year,status,image_url,created_at&order=created_at.desc&limit=8`)),
    safe(sel(c, token, `customs_complaints?select=id,status,car_label,updated_at&archived=eq.false&order=updated_at.desc&limit=20`)),
    safe(sel(c, token, `pending_website_sales?select=id&limit=50`)),
    // stage counts only (no prices / buyer fields)
    safe(sel(c, token, `cars?select=sale_status,status,tracking_status,approval_status&limit=5000`)),
    safe(sel(c, token, `cars?select=id,make,model,year,plate_number,image_url,tracking_status,tracking_status_label,tracking_vessel,tracking_eta,tracking_destination,tracking_arrival_port,updated_at&tracking_status=eq.DEPARTED&order=tracking_eta.asc.nullslast&limit=30`)),
    safe(sel(c, token, `cars?select=${CAR_COLS}&order=updated_at.desc&limit=14`)),
  ]);
  const errors = [todayCars, latest, updated, pending, arriving, inspections, complaints, webSales, stageRows, shipping, recentUpdates].filter((x) => x && x.__err).map((x) => x.__err);
  const updatedOnly = arr(updated).filter((u) => u.created_at < today);
  return {
    configured: true,
    generatedAt: new Date().toISOString(),
    todayStart: today,
    addedToday: arr(todayCars),
    latest: arr(latest),
    updatedToday: updatedOnly,
    pendingApprovals: arr(pending),
    arrivingThisWeek: arr(arriving),
    inspections: arr(inspections),
    openComplaints: arr(complaints),
    pendingWebsiteSales: arr(webSales).length,
    stages: count(arr(stageRows), 'sale_status'),
    statuses: count(arr(stageRows), 'status'),
    tracking: count(arr(stageRows), 'tracking_status'),
    totalCars: arr(stageRows).length,
    shipping: arr(shipping),
    recentUpdates: arr(recentUpdates),
    errors,
  };
}

export async function getKorautoFeed({ force = false } = {}) {
  const c = cfg();
  if (!c.ok) return { configured: false };
  if (!force) {
    const row = await getRow(FEED_KEY).catch(() => null);
    if (row?.payload && Date.now() - new Date(row.updated_at).getTime() < FEED_TTL_MS) return row.payload;
  }
  try {
    const feed = await build(c);
    // Cached in THIS app's own api_cache table (Robert HQ), never in korautomanager.
    await putRow(FEED_KEY, { payload: feed, ttl_seconds: 300, status: feed.errors.length ? 'degraded' : 'ok', error: null, meta: { label: 'KORAUTO feed' } }).catch(() => {});
    return feed;
  } catch (e) {
    const row = await getRow(FEED_KEY).catch(() => null);
    if (row?.payload) return { ...row.payload, stale: true, error: String(e?.message || e).slice(0, 120) };
    return { configured: true, error: String(e?.message || e).slice(0, 120) };
  }
}
