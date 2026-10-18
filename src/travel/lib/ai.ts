import { supabase } from "@/integrations/supabase/client";
import { FN_BASE } from "@/lib/fn";

/** Travel AI edge function (requires a signed-in, allowlisted user). */
export const AI_ENDPOINT = `${FN_BASE}/travel-ai`;

export async function aiHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  return {
    "Content-Type": "application/json",
    ...(data.session ? { Authorization: `Bearer ${data.session.access_token}` } : {}),
  };
}

/** Drop-in replacement for supabase.functions.invoke(name, { body }) → { data, error }. */
export async function invokeAI(name: string, opts: { body?: unknown } = {}): Promise<{ data: any; error: Error | null }> {
  try {
    const res = await fetch(`${FN_BASE}/${name}`, {
      method: "POST",
      headers: await aiHeaders(),
      body: JSON.stringify(opts.body ?? {}),
    });
    const text = await res.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }
    if (!res.ok) return { data, error: new Error((data && data.error) || `HTTP ${res.status}`) };
    return { data, error: null };
  } catch (e: any) {
    return { data: null, error: e instanceof Error ? e : new Error(String(e)) };
  }
}
