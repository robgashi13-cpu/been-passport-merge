// WanderPass HQ: private (signed-in + allowlisted) — see _shared/guard.ts.
import { guarded } from '../_shared/guard.ts';
import { handler } from '../_shared/ai/travel-search-ai.ts';

Deno.serve(guarded(handler));
