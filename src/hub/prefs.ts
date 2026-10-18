import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./auth";

/**
 * Per-user preference synced through public.user_prefs (RLS: owner only), with a localStorage
 * cache so it renders instantly and still works offline. Last write wins.
 */
export function usePref<T>(key: string, fallback: T) {
  const { user } = useAuth();
  const uid = user?.id;
  const lsKey = `wp:pref:${uid ?? "anon"}:${key}`;
  const read = (): T => {
    try {
      const raw = localStorage.getItem(lsKey);
      return raw ? (JSON.parse(raw).v as T) : fallback;
    } catch {
      return fallback;
    }
  };
  const [value, setValue] = useState<T>(read);
  const [synced, setSynced] = useState(false);
  const localAt = useRef<number>(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setValue(read());
    try {
      localAt.current = JSON.parse(localStorage.getItem(lsKey) || "{}").t || 0;
    } catch {
      localAt.current = 0;
    }
    if (!uid) return;
    let alive = true;
    (supabase as any)
      .from("user_prefs")
      .select("value, updated_at")
      .eq("user_id", uid)
      .eq("key", key)
      .maybeSingle()
      .then(({ data }: any) => {
        if (!alive) return;
        setSynced(true);
        if (!data) return;
        const remoteAt = Date.parse(data.updated_at) || 0;
        if (remoteAt >= localAt.current) {
          setValue(data.value as T);
          localStorage.setItem(lsKey, JSON.stringify({ v: data.value, t: remoteAt }));
          localAt.current = remoteAt;
        }
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, key]);

  const save = useCallback(
    (next: T | ((prev: T) => T), opts: { delay?: number } = {}) => {
      setValue((prev) => {
        const v = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        const t = Date.now();
        localAt.current = t;
        try {
          localStorage.setItem(lsKey, JSON.stringify({ v, t }));
        } catch {
          /* quota */
        }
        if (uid) {
          if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(() => {
            (supabase as any)
              .from("user_prefs")
              .upsert({ user_id: uid, key, value: v, updated_at: new Date(t).toISOString() })
              .then(() => {});
          }, opts.delay ?? 400);
        }
        return v;
      });
    },
    [uid, key, lsKey],
  );

  return [value, save, synced] as const;
}
