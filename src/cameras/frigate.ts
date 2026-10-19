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

const jsonCache = new Map<string, { at: number; data: unknown }>();
const pending = new Map<string, Promise<unknown>>();

export async function fjson<T>(path: string, token: string | null): Promise<T> {
  if (!token) throw new Error("Sign in to view cameras");
  const key = `${token}:${path}`;
  const existing = pending.get(key);
  if (existing) return existing as Promise<T>;
  const request = (async () => {
    const r = await fetch(`${FRIGATE}/${path}`, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(15000) });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const d = await r.json();
    if (jsonCache.size > 50) jsonCache.clear();
    jsonCache.set(key, { at: Date.now(), data: d });
    return d as T;
  })();
  pending.set(key, request);
  try { return await request; } finally { pending.delete(key); }
}

/** Share recent metadata so opening Cameras doesn't wait on a second status request. */
export function useFrigate<T>(path: string | null, ms: number) {
  const { token } = useAuth();
  const key = `${token}:${path}`;
  const cached = jsonCache.get(key);
  const recent = cached && Date.now() - cached.at < 60000 ? cached.data as T : null;
  const [s, setS] = useState<{ data: T | null; error: string | null; loading: boolean }>({ data: recent, error: null, loading: !!path && !recent });
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!path || !token) { setS({ data: null, error: null, loading: false }); return; }
    let alive = true;
    let busy = false;
    const hit = jsonCache.get(key);
    setS({ data: hit && Date.now() - hit.at < 60000 ? hit.data as T : null, error: null, loading: !hit });
    const load = async () => {
      if (document.hidden || busy) return;
      busy = true;
      try { const d = await fjson<T>(path, token); if (alive) setS({ data: d, error: null, loading: false }); }
      catch (e) { if (alive) setS((p) => ({ ...p, error: e instanceof Error ? e.message : "Camera request failed", loading: false })); }
      finally { busy = false; }
    };
    void load();
    const t = setInterval(load, ms);
    const vis = () => { if (!document.hidden) void load(); };
    document.addEventListener("visibilitychange", vis);
    return () => { alive = false; clearInterval(t); document.removeEventListener("visibilitychange", vis); };
  }, [path, ms, token, n, key]);
  return { ...s, reload: () => setN((x) => x + 1) };
}

/** Abort stale requests and retain prepared files for synchronous device saving. */
export function useAuthedBlob(path: string | null, refreshMs = 0, visible = true) {
  const { token } = useAuth();
  const [media, setMedia] = useState<{ url: string | null; blob: Blob | null; err: string | null; at: number | null }>({ url: null, blob: null, err: null, at: null });
  const cur = useRef<string | null>(null);
  useEffect(() => {
    if (!path || !token) {
      if (cur.current) URL.revokeObjectURL(cur.current);
      cur.current = null;
      setMedia({ url: null, blob: null, err: null, at: null });
      return;
    }
    if (!visible) return;
    let alive = true;
    let busy = false;
    let controller: AbortController | null = null;
    const load = async () => {
      if (busy || document.hidden) return;
      busy = true;
      controller = new AbortController();
      try {
        const r = await fetch(`${FRIGATE}/${path}`, { headers: { Authorization: `Bearer ${token}` }, cache: refreshMs ? "no-store" : "default", signal: controller.signal });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        if (!r.headers.get("content-type")?.match(/^(image|video)\//)) throw new Error("Media unavailable");
        const blob = await r.blob();
        if (!alive) return;
        const url = URL.createObjectURL(blob);
        const old = cur.current;
        cur.current = url;
        setMedia({ url, blob, err: null, at: Date.now() });
        if (old) setTimeout(() => URL.revokeObjectURL(old), 1000);
      } catch (e) {
        if (alive && !(e instanceof DOMException && e.name === "AbortError")) setMedia((p) => ({ ...p, err: e instanceof Error ? e.message : "Media unavailable" }));
      } finally { busy = false; }
    };
    setMedia({ url: null, blob: null, err: null, at: null });
    void load();
    const t = refreshMs > 0 ? setInterval(load, refreshMs) : null;
    const vis = () => { if (document.hidden) controller?.abort(); else void load(); };
    document.addEventListener("visibilitychange", vis);
    return () => { alive = false; controller?.abort(); if (t) clearInterval(t); document.removeEventListener("visibilitychange", vis); };
  }, [path, refreshMs, token, visible]);
  useEffect(() => () => { if (cur.current) URL.revokeObjectURL(cur.current); }, []);
  return media;
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
