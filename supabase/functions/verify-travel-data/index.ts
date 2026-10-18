// Retired: the automatic daily AI "verify" job was removed in the WanderPass HQ rebuild.
// Kept as a private stub so the old public endpoint no longer runs AI calls for anyone.
import { guarded } from '../_shared/guard.ts';

Deno.serve(guarded(async () => Response.json({ error: 'retired' }, { status: 410 })));
