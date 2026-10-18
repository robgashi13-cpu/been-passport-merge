// Scheduled refresh of the WORLD // INTEL caches. Called by pg_cron (see db/wanderpass_hq.sql).
// Auth: header x-cron-key must equal public.hq_secrets('cron') — a random value generated in SQL,
// readable only by the service role. Only refreshes public-data caches; returns no user data.
import { CORS, withCors } from '../_shared/guard.ts';
import { db } from '../_shared/wi/cache.ts';
import { JOBS } from '../_shared/wi/sources.ts';

const VALID = new Set(['fast', 'hazards', 'gdelt', 'news', 'kev', 'iptv', 'markets', 'risk']);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
  const key = req.headers.get('x-cron-key') || '';
  const s = await db();
  const { data } = await s.from('hq_secrets').select('value').eq('name', 'cron').maybeSingle();
  if (!key || !data?.value || key !== data.value) return withCors(Response.json({ error: 'Unauthorized' }, { status: 401 }));
  let body: { job?: string; part?: number } = {};
  try { body = await req.json(); } catch { /* empty */ }
  if (!body.job || !VALID.has(body.job)) return withCors(Response.json({ error: 'Bad request' }, { status: 400 }));
  const part = Math.max(0, Math.min(2, Number(body.part || 0)));
  // @ts-ignore dynamic job table
  const result = body.job === 'news' ? await JOBS.news(part) : await JOBS[body.job]();
  return withCors(Response.json({ ok: true, job: body.job, result }));
});
