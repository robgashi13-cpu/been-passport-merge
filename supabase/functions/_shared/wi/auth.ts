// @ts-nocheck
// Robert HQ: WORLD // INTEL API auth = a valid Lovable Cloud (Supabase) access token whose email is on the
// public.allowed_emails allowlist. Verified server-side on every /api/public/v1/* request.
import { db } from './cache.ts';

const okCache = new Map(); // token -> { ok, t }

export async function verifyToken(token) {
  if (!token || typeof token !== 'string' || token.length > 4000 || token.split('.').length !== 3) return false;
  const hit = okCache.get(token);
  if (hit && Date.now() - hit.t < 60e3) return hit.ok;
  let ok = false;
  try {
    const s = await db();
    const { data, error } = await s.auth.getUser(token);
    const email = data?.user?.email?.toLowerCase();
    if (!error && email) {
      const { data: row } = await s.from('allowed_emails').select('email').eq('email', email).maybeSingle();
      ok = !!row;
    }
  } catch { ok = false; }
  if (okCache.size > 200) okCache.clear();
  okCache.set(token, { ok, t: Date.now() });
  return ok;
}
