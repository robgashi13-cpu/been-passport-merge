import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, BellRing, CarFront, Cctv, Check, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { FN_BASE } from "@/lib/fn";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./auth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

/**
 * HQ notifications: Frigate detections + KORAUTO cars added/edited (edge function `hq-notify`, read-only).
 * - In the browser: an in-app feed (bell) polled every 60 s while the tab is visible, with a toast for new items.
 * - In the HQ iPhone app: the same feed, plus the native shell turns new items into iOS notifications
 *   (foreground every 60 s, background refresh when iOS allows). The web app hands the shell a read-only
 *   device key via `window.webkit.messageHandlers.hqNotify`.
 */
export type HqNotice = { id: string; kind: "camera" | "car_added" | "car_edited"; title: string; body: string; at: string; path: string };
type Prefs = { frigate: boolean; cars: boolean };
type NativeStatus = { registered: boolean; permission: "granted" | "denied" | "default"; backgroundRefresh: boolean };
type State = { items: HqNotice[]; readAt: number; prefs: Prefs; native: NativeStatus | null; loading: boolean; error: string | null; sources: Record<string, string> };

const ITEMS_KEY = "hq-notif-items";
const READ_KEY = "hq-notif-read-at";
const PREFS_KEY = "hq-notif-prefs";
const POLL_MS = 60_000;
const MAX_ITEMS = 120;

const load = <T,>(k: string, fallback: T): T => {
  try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : fallback; } catch { return fallback; }
};
const save = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } };

let state: State = {
  items: load<HqNotice[]>(ITEMS_KEY, []),
  readAt: load<number>(READ_KEY, 0),
  prefs: { frigate: true, cars: true, ...load<Partial<Prefs>>(PREFS_KEY, {}) },
  native: null,
  loading: false,
  error: null,
  sources: {},
};
const subs = new Set<() => void>();
const set = (patch: Partial<State>) => { state = { ...state, ...patch }; subs.forEach((f) => f()); };
const subscribe = (f: () => void) => { subs.add(f); return () => subs.delete(f); };

type NativeBridge = { postMessage: (m: unknown) => void };
const nativeBridge = (): NativeBridge | null => {
  const w = window as unknown as { __HQ_NATIVE__?: boolean; webkit?: { messageHandlers?: { hqNotify?: NativeBridge } } };
  return w.__HQ_NATIVE__ ? w.webkit?.messageHandlers?.hqNotify ?? null : null;
};
const isNativeShell = () => !!(window as unknown as { __HQ_NATIVE__?: boolean }).__HQ_NATIVE__;

let refreshHook: (() => void) | null = null;
if (typeof window !== "undefined") {
  const w = window as unknown as Record<string, unknown>;
  w.__hqNotifyNative = (s: NativeStatus) => set({ native: s });
  w.__hqNotifyRefresh = () => refreshHook?.();
  // Sign-out on this device also stops the iPhone app's alerts.
  supabase.auth.onAuthStateChange((evt) => {
    if (evt === "SIGNED_OUT") {
      nativeBridge()?.postMessage({ type: "unregister" });
      save(ITEMS_KEY, []);
      set({ items: [] });
    }
  });
}

function merge(fresh: HqNotice[]) {
  const byId = new Map(state.items.map((i) => [i.id, i]));
  const added: HqNotice[] = [];
  for (const i of fresh) if (!byId.has(i.id)) { byId.set(i.id, i); added.push(i); }
  const items = [...byId.values()].sort((a, b) => Date.parse(b.at) - Date.parse(a.at)).slice(0, MAX_ITEMS);
  save(ITEMS_KEY, items);
  set({ items });
  return added;
}

async function fetchFeed(token: string, sinceMs: number) {
  const p = new URLSearchParams({ since: new Date(sinceMs).toISOString(), frigate: state.prefs.frigate ? "1" : "0", cars: state.prefs.cars ? "1" : "0" });
  const r = await fetch(`${FN_BASE}/hq-notify/feed?${p}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) throw new Error(`Notifications ${r.status}`);
  return (await r.json()) as { cursor: string; items: HqNotice[]; sources: Record<string, string> };
}

async function registerNative(token: string) {
  const bridge = nativeBridge();
  if (!bridge) return;
  const r = await fetch(`${FN_BASE}/hq-notify/register`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) throw new Error(`register ${r.status}`);
  const { key } = (await r.json()) as { key: string };
  bridge.postMessage({ type: "register", key, base: String(import.meta.env.VITE_SUPABASE_URL || ""), prefs: state.prefs });
}

/** Runs once inside the signed-in shell: polls the feed and links the iPhone app's native alerts. */
export function useNotificationsRuntime() {
  const { token } = useAuth();
  useEffect(() => {
    if (!token) return;
    let alive = true;
    let cursor = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const tick = async () => {
      if (!alive) return;
      if (document.visibilityState === "visible") {
        set({ loading: true });
        try {
          const since = cursor ? cursor - 120_000 : Date.now() - 24 * 3600e3;
          const feed = await fetchFeed(token, since);
          if (!alive) return;
          const first = !cursor;
          cursor = Date.parse(feed.cursor) || Date.now();
          const added = merge(feed.items || []);
          set({ loading: false, error: null, sources: feed.sources || {} });
          if (!first && added.length && !isNativeShell()) {
            const top = added[0];
            toast(added.length > 1 ? `${added.length} new alerts` : top.title, { description: added.length > 1 ? top.title : top.body });
          }
        } catch (e) {
          if (alive) set({ loading: false, error: String((e as Error).message || e) });
        }
      }
      timer = setTimeout(tick, POLL_MS);
    };
    refreshHook = () => { if (timer) clearTimeout(timer); void tick(); };
    void tick();
    const onVisible = () => { if (document.visibilityState === "visible") refreshHook?.(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
      refreshHook = null;
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [token]);

  // iPhone app: wait for the shell's bridge, then register once (the shell keeps the key for 180 days).
  useEffect(() => {
    if (!token || !isNativeShell()) return;
    let tries = 0;
    let alive = true;
    const hello = () => {
      if (!alive) return;
      const bridge = nativeBridge();
      if (!bridge) { if (tries++ < 30) setTimeout(hello, 1000); return; }
      bridge.postMessage({ type: "hello" });
    };
    hello();
    return () => { alive = false; };
  }, [token]);

  useEffect(() => {
    if (!token || !state.native || state.native.registered) return;
    void registerNative(token).catch(() => { /* retried on next launch */ });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, state.native?.registered]);
}

export function useHqNotifications() {
  const s = useSyncExternalStore(subscribe, () => state, () => state);
  const unread = s.items.filter((i) => Date.parse(i.at) > s.readAt).length;
  const markAllRead = useCallback(() => { const t = Date.now(); save(READ_KEY, t); set({ readAt: t }); }, []);
  const setPrefs = useCallback((p: Partial<Prefs>) => {
    const prefs = { ...state.prefs, ...p };
    save(PREFS_KEY, prefs);
    set({ prefs });
    nativeBridge()?.postMessage({ type: "prefs", prefs });
    refreshHook?.();
  }, []);
  return { ...s, unread, markAllRead, setPrefs };
}

const ago = (iso: string) => {
  const s = Math.max(0, (Date.now() - Date.parse(iso)) / 1000);
  if (s < 60) return "now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
};

function Toggle({ on, onChange, icon: Icon, label }: { on: boolean; onChange: (v: boolean) => void; icon: typeof Cctv; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)}
      className={`press flex flex-1 items-center justify-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-colors ${on ? "bg-primary text-primary-foreground" : "glass-thin text-muted-foreground"}`}>
      <Icon className="h-4 w-4" /> {label}
    </button>
  );
}

/** Bell button for the top bar: unread badge + sheet with the feed. */
export function NotificationBell() {
  useNotificationsRuntime();
  const n = useHqNotifications();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    (window as unknown as Record<string, unknown>).__hqNotifyOpen = () => setOpen(false);
  }, []);
  const native = isNativeShell();
  const Icon = n.unread ? BellRing : Bell;
  return (
    <>
      <Button variant="secondary" className="hq-avatar relative" aria-label={n.unread ? `Notifications, ${n.unread} unread` : "Notifications"}
        onClick={() => { setOpen(true); refreshHook?.(); }}>
        <Icon className="h-4 w-4" />
        {n.unread > 0 && (
          <span className="absolute -right-1 -top-1 min-w-[18px] rounded-full bg-destructive px-1 text-center text-[10px] font-bold leading-[18px] text-destructive-foreground">
            {n.unread > 99 ? "99+" : n.unread}
          </span>
        )}
      </Button>
      <Sheet open={open} onOpenChange={(o) => { setOpen(o); if (!o) n.markAllRead(); }}>
        <SheetContent side="right" className="flex w-full flex-col gap-3 sm:max-w-md">
          <SheetHeader><SheetTitle>Notifications</SheetTitle></SheetHeader>
          <div className="flex gap-2">
            <Toggle on={n.prefs.frigate} onChange={(v) => n.setPrefs({ frigate: v })} icon={Cctv} label="Cameras" />
            <Toggle on={n.prefs.cars} onChange={(v) => n.setPrefs({ cars: v })} icon={CarFront} label="KORAUTO cars" />
          </div>
          {native && (
            <div className="glass-thin flex items-center gap-3 rounded-2xl p-3 text-sm">
              <Smartphone className="h-5 w-5 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                {!n.native ? "Connecting to iPhone alerts…"
                  : n.native.permission === "denied" ? "iPhone alerts are off for HQ in Settings."
                  : n.native.registered && n.native.permission === "granted"
                    ? (n.native.backgroundRefresh ? "iPhone alerts on. While HQ is closed, iOS checks when it allows." : "iPhone alerts on while HQ is open. Turn on Background App Refresh for HQ to get them when closed.")
                    : "Allow notifications to get iPhone alerts."}
              </div>
              {n.native && n.native.permission !== "granted" && (
                <Button size="sm" onClick={() => nativeBridge()?.postMessage({ type: "requestPermission" })}>{n.native.permission === "denied" ? "Settings" : "Allow"}</Button>
              )}
              {n.native?.registered && n.native.permission === "granted" && (
                <Button size="sm" variant="secondary" onClick={() => nativeBridge()?.postMessage({ type: "test" })}>Test</Button>
              )}
            </div>
          )}
          {(n.sources.frigate === "error" || n.sources.cars === "error") && (
            <p className="text-xs text-muted-foreground">{n.sources.frigate === "error" ? "Cameras unreachable right now. " : ""}{n.sources.cars === "error" ? "KORAUTO unreachable right now." : ""}</p>
          )}
          <div className="-mx-2 flex-1 overflow-y-auto">
            {n.items.length === 0 ? (
              <p className="px-2 py-10 text-center text-sm text-muted-foreground">{n.loading ? "Checking…" : n.error ? "Couldn't load notifications." : "No alerts in the last 24 hours."}</p>
            ) : (
              <ul className="space-y-1">
                {n.items.filter((i) => (i.kind === "camera" ? n.prefs.frigate : n.prefs.cars)).map((i) => {
                  const ItemIcon = i.kind === "camera" ? Cctv : CarFront;
                  const unread = Date.parse(i.at) > n.readAt;
                  return (
                    <li key={i.id}>
                      <button type="button" className="press flex w-full items-start gap-3 rounded-2xl px-2 py-2.5 text-left hover:bg-muted/60"
                        onClick={() => { setOpen(false); n.markAllRead(); navigate(i.path); }}>
                        <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${i.kind === "camera" ? "bg-amber-500/15 text-amber-600" : i.kind === "car_added" ? "bg-emerald-500/15 text-emerald-600" : "bg-sky-500/15 text-sky-600"}`}>
                          <ItemIcon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2"><span className="truncate text-sm font-semibold text-foreground">{i.title}</span>{unread && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}</span>
                          <span className="block truncate text-xs text-muted-foreground">{i.body}</span>
                        </span>
                        <span className="shrink-0 text-[11px] text-muted-foreground">{ago(i.at)}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          {n.items.length > 0 && (
            <Button variant="ghost" className="self-center" onClick={n.markAllRead}><Check className="h-4 w-4" /> Mark all read</Button>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
