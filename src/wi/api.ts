// @ts-nocheck
// WORLD // INTEL client helpers. Auth = the Robert HQ Lovable Cloud session (Supabase access token),
// kept in sync by src/hub/auth.tsx via setWiToken(). Original /api/* paths are mapped to /api/public/v1/*.
let TOKEN = null;
export const setWiToken = (t) => { const ch = (t || null) !== TOKEN; TOKEN = t || null; if (ch && typeof window !== 'undefined') window.dispatchEvent(new Event('wi-token')); };
export const getToken = () => TOKEN;
import { FN_BASE } from '@/lib/fn';
export const apiUrl = (url) => (url.startsWith('/api/') ? FN_BASE + '/wi-api/' + url.slice(5) : url);
import { useEffect, useRef, useState, useCallback } from 'react';

// 401 from any /api call -> app shows the login screen
export const authBus = new EventTarget();
export async function getJSON(url) {
  const r = await fetch(apiUrl(url), { headers: { Authorization: `Bearer ${getToken() || ''}` } });
  if (r.status === 401) { authBus.dispatchEvent(new Event('logout')); throw new Error('401'); }
  if (!r.ok) throw new Error(`${r.status}`);
  return r.json();
}

/** Poll an endpoint on an interval (paused while the page is hidden). Returns {data, error, loading, updatedAt, reload}. */
export function usePoll(url, intervalMs, enabled = true) {
  const [state, setState] = useState({ data: null, error: null, loading: true, updatedAt: null });
  const urlRef = useRef(url);
  urlRef.current = url;
  const load = useCallback(async () => {
    if (!urlRef.current || document.hidden) return;
    try {
      const d = await getJSON(urlRef.current);
      setState({ data: d, error: null, loading: false, updatedAt: new Date() });
    } catch (e) {
      setState((s) => ({ ...s, error: String(e.message || e), loading: false }));
    }
  }, []);
  useEffect(() => {
    if (!enabled || !url) return;
    setState((s) => ({ ...s, loading: true }));
    load();
    const t = setInterval(load, intervalMs);
    const vis = () => { if (!document.hidden) load(); };
    document.addEventListener('visibilitychange', vis);
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', vis); };
  }, [url, intervalMs, enabled, load]);
  return { ...state, reload: load };
}

export function timeAgo(iso, now = Date.now()) {
  const t = typeof iso === 'number' ? iso : Date.parse(iso);
  if (!t) return '—';
  const s = Math.round((now - t) / 1000);
  if (s < 5) return 'now';
  if (s < 60) return `${s}s`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h}h`;
  return `${Math.round(h / 24)}d`;
}
export const fmtTime = (iso) => {
  // Kosovo / Belgrade local time with the correct CET/CEST label (was hard-coded "CET" even in summer)
  try { return new Date(iso).toLocaleString('en-GB', { timeZone: 'Europe/Belgrade', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' }); } catch { return iso; }
};
export const flag = (cc) => (cc && /^[A-Z]{2}$/.test(cc) ? String.fromCodePoint(...[...cc].map((c) => 0x1f1a5 + c.charCodeAt(0))) : '🌐');

export function useNow(ms = 1000) {
  const [n, setN] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setN(Date.now()), ms); return () => clearInterval(t); }, [ms]);
  return n;
}
export function useMedia(q) {
  const [m, setM] = useState(() => matchMedia(q).matches);
  useEffect(() => { const mq = matchMedia(q); const f = () => setM(mq.matches); mq.addEventListener('change', f); return () => mq.removeEventListener('change', f); }, [q]);
  return m;
}
export const useMobile = () => useMedia('(max-width: 899px)');
