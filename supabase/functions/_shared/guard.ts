// @ts-nocheck
// Every WanderPass HQ edge function is private: the caller must send a valid session token
// (Authorization: Bearer <access_token>) whose email is on public.allowed_emails.
import { verifyToken } from './wi/auth.ts';

export const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-key',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

export function withCors(res: Response): Response {
  const h = new Headers(res.headers);
  for (const [k, v] of Object.entries(CORS)) h.set(k, v);
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers: h });
}

export const bearer = (req: Request) => (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');

/** Wrap a handler so it only runs for allowlisted, signed-in users. */
export function guarded(handler: (req: Request) => Promise<Response>) {
  return async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
    if (!(await verifyToken(bearer(req)))) return withCors(Response.json({ error: 'Unauthorized' }, { status: 401 }));
    try { return withCors(await handler(req)); }
    catch (e) { return withCors(Response.json({ error: String(e?.message || e) }, { status: 500 })); }
  };
}

/** Sub-path after the function name, e.g. /functions/v1/wi-api/threat -> "threat". */
export function subPath(req: Request, fn: string) {
  const p = new URL(req.url).pathname;
  const i = p.indexOf('/' + fn);
  return (i >= 0 ? p.slice(i + fn.length + 1) : p).replace(/^\/+/, '');
}
