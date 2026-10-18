// WanderPass HQ: private (signed-in + allowlisted) — see _shared/guard.ts.
import { guarded } from '../_shared/guard.ts';
import { handler } from '../_shared/ai/flight-facts-ai.ts';

Deno.serve(guarded(handler));
