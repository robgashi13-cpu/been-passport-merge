// Read-only KORAUTO Manager mirror for the dashboard card (private). Never writes to korautomanager.
import { guarded } from '../_shared/guard.ts';
import { getKorautoFeed } from '../_shared/hq/korauto.ts';

Deno.serve(guarded(async (req) => {
  const force = new URL(req.url).searchParams.get('force') === '1';
  const feed = await getKorautoFeed({ force });
  return Response.json(feed, { headers: { 'cache-control': 'no-store' } });
}));
