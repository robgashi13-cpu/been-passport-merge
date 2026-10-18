// WORLD // INTEL API (private). Auth + allowlist are checked inside handleApi for every path
// (the HLS proxy accepts the token as ?t= because <video> cannot send headers).
import { CORS, withCors, subPath } from '../_shared/guard.ts';
import { handleApi } from '../_shared/wi/api.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
  return withCors(await handleApi(req, subPath(req, 'wi-api')));
});
