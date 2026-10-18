import { useEffect, useRef, useState } from "react";
import { FN_BASE } from "@/lib/fn";
import { useAuth } from "@/hub/auth";

/** Private Frigate proxy (edge function `frigate`). Credentials/URL stay server-side. */
export const FRIGATE = `${FN_BASE}/frigate`;

export type Cam = {
  name: string;
  label: string;
  enabled: boolean;
  online: boolean;
  fps: number;
  detectFps: number;
  width: number | null;
  height: number | null;
  recording: boolean;
  objects: string[];
  ptz: boolean;
};
export type Status =
  | { configured: false }
  | { configured: true; reachable: false; error?: string }
  | { configured: true; reachable: true; error?: undefined; version: string | null; uptime: number | null; latencyMs: number; cameras: Cam[]; updated: string };
export type FEvent = {
  id: string;
  camera: string;
  label: string;
  subLabel: string | null;
  score: number | null;
  start: number;
  end: number | null;
  hasClip: boolean;
  hasSnapshot: boolean;
  zones: string[];
};

export async function fjson<T>(path: string, token: string | null): Promise<T> {
  const r = await fetch(`${FRIGATE}/${path}`, { headers: { Authorization: `Bearer ${token || ""}` } });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

/** Poll a JSON route while the page is visible. */
export function useFrigate<T>(path: string | null, ms: number) {
  const { token } = useAuth();
  const [s, setS] = useState<{ data: T | null; error: string | null; loading: boolean }>({ data: null, error: null, loading: true });
  const tick = useRef(0);
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!path || !token) return;
    let alive = true;
    const id = ++tick.current;
    const load = () => {
      if (document.hidden) return;
      fjson<T>(path, token)
        .then((d) => alive && id === tick.current && setS({ data: d, error: null, loading: false }))
        .catch((e) => alive && setS((p) => ({ ...p, error: String(e.message || e), loading: false })));
    };
    load();
    const t = setInterval(load, ms);
    const vis = () => !document.hidden && load();
    document.addEventListener("visibilitychange", vis);
    return () => {
      alive = false;
      clearInterval(t);
      document.removeEventListener("visibilitychange", vis);
    };
  }, [path, ms, token, n]);
  return { ...s, reload: () => setN((x) => x + 1) };
}

/**
 * Authenticated image/video as an object URL (the token goes in a header, never in the URL).
 * refreshMs > 0 re-fetches (live snapshot mode); pauses while hidden or offscreen.
 */
export function useAuthedBlob(path: string | null, refreshMs = 0, visible = true) {
  const { token } = useAuth();
  const [url, setUrl] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [at, setAt] = useState<number | null>(null);
  const cur = useRef<string | null>(null);
  useEffect(() => {
    if (!path || !token || !visible) return;
    let alive = true;
    let busy = false;
    const load = async () => {
      if (busy || document.hidden) return;
      busy = true;
      try {
        const r = await fetch(`${FRIGATE}/${path}${path.includes("?") ? "&" : "?"}_=${Date.now()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const b = await r.blob();
        if (!alive) return;
        const u = URL.createObjectURL(b);
        if (cur.current) URL.revokeObjectURL(cur.current);
        cur.current = u;
        setUrl(u);
        setErr(null);
        setAt(Date.now());
      } catch (e: any) {
        if (alive) setErr(String(e?.message || e));
      } finally {
        busy = false;
      }
    };
    load();
    const t = refreshMs > 0 ? setInterval(load, refreshMs) : null;
    return () => {
      alive = false;
      if (t) clearInterval(t);
    };
  }, [path, refreshMs, token, visible]);
  useEffect(() => () => {
    if (cur.current) URL.revokeObjectURL(cur.current);
  }, []);
  return { url, err, at };
}

export const camLabel = (n: string) => n.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
export const fmtWhen = (sec: number) =>
  new Date(sec * 1000).toLocaleString("en-GB", { timeZone: "Europe/Belgrade", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
export function ago(sec: number, now = Date.now()) {
  const s = Math.max(0, Math.round(now / 1000 - sec));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return `${Math.round(s / 86400)}d ago`;
}
