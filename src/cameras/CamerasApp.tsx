import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Car, Cctv, ChevronLeft, ChevronRight, Maximize2, PersonStanding, Play, RefreshCw, ScanFace, ShieldCheck, Video, WifiOff, X,
} from "lucide-react";
import { useAuth } from "@/hub/auth";
import { ago, Cam, camLabel, FEvent, fjson, fmtWhen, Status, useAuthedBlob, useFrigate } from "./frigate";

function useInView<T extends Element>() {
  const ref = useRef<T | null>(null);
  const [v, setV] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setV(e.isIntersecting), { rootMargin: "120px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, v] as const;
}

const LabelIcon = ({ label, className = "h-3.5 w-3.5" }: { label: string; className?: string }) =>
  label === "car" ? <Car className={className} /> : label === "person" ? <PersonStanding className={className} /> : <ScanFace className={className} />;

function Dot({ on }: { on: boolean }) {
  return <span className={`inline-block h-2 w-2 rounded-full ${on ? "hq-live-dot bg-emerald-400" : "bg-rose-500/80"}`} />;
}

/* ---------- live tile ---------- */
function CamTile({ cam, onOpen }: { cam: Cam; onOpen: () => void }) {
  const [ref, inView] = useInView<HTMLButtonElement>();
  const { url, err, at } = useAuthedBlob(cam.enabled ? `snapshot/${cam.name}?h=480` : null, 3000, inView);
  return (
    <button ref={ref} onClick={onOpen} className="hq-card group relative block overflow-hidden p-0 text-left" aria-label={`Open ${camLabel(cam.name)}`}>
      <div className="relative aspect-video w-full bg-black/60">
        {url ? (
          <img src={url} alt={cam.label} className="absolute inset-0 h-full w-full object-cover" draggable={false} />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
            {err ? <span className="flex items-center gap-2"><WifiOff className="h-4 w-4" /> No image</span> : <span className="animate-pulse">Connecting…</span>}
          </div>
        )}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent px-3 py-2">
          <span className="flex items-center gap-2 text-sm font-medium text-white">
            <Dot on={cam.online} /> {camLabel(cam.name)}
          </span>
          <span className="rounded bg-black/50 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-white/80">
            {cam.online ? "Live" : "Offline"}
          </span>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/70 to-transparent px-3 py-2 text-[11px] text-white/75">
          <span className="hq-num">{cam.fps.toFixed(1)} fps{cam.recording ? " · REC" : ""}{cam.ptz ? " · PTZ" : ""}</span>
          <span className="hq-num">{at ? new Date(at).toLocaleTimeString("en-GB", { timeZone: "Europe/Belgrade" }) : ""}</span>
        </div>
        <Maximize2 className="absolute bottom-2 right-1/2 h-5 w-5 translate-x-1/2 text-white opacity-0 transition group-hover:opacity-80" />
      </div>
    </button>
  );
}

/* ---------- fullscreen viewer ---------- */
function Fullscreen({ cams, index, setIndex, onClose }: { cams: Cam[]; index: number; setIndex: (i: number) => void; onClose: () => void }) {
  const cam = cams[index];
  const { url, err, at } = useAuthedBlob(`snapshot/${cam.name}?h=1080`, 1000, true);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIndex((index + 1) % cams.length);
      if (e.key === "ArrowLeft") setIndex((index - 1 + cams.length) % cams.length);
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [index, cams.length, onClose, setIndex]);
  const native = () => {
    const el = box.current as any;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen?.();
    else (el.requestFullscreen || el.webkitRequestFullscreen)?.call(el);
  };
  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-black/95 backdrop-blur" role="dialog" aria-modal="true">
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Dot on={cam.online} /> {camLabel(cam.name)}
          <span className="hq-num ml-2 text-xs text-white/60">{cam.fps.toFixed(1)} fps · {cam.width}×{cam.height}</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={native} className="rounded-lg p-2 hover:bg-white/10" aria-label="Native fullscreen"><Maximize2 className="h-5 w-5" /></button>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-white/10" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
      </div>
      <div ref={box} className="relative flex flex-1 items-center justify-center overflow-hidden bg-black">
        {url ? (
          <img src={url} alt={cam.label} className="max-h-full max-w-full object-contain" />
        ) : (
          <div className="text-sm text-white/60">{err ? "Camera image unavailable" : "Connecting…"}</div>
        )}
        {cams.length > 1 && (
          <>
            <button onClick={() => setIndex((index - 1 + cams.length) % cams.length)} className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70" aria-label="Previous camera"><ChevronLeft className="h-6 w-6" /></button>
            <button onClick={() => setIndex((index + 1) % cams.length)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70" aria-label="Next camera"><ChevronRight className="h-6 w-6" /></button>
          </>
        )}
        <span className="hq-num absolute bottom-3 right-3 rounded bg-black/60 px-2 py-1 text-[11px] text-white/80">
          ~1s refresh · {at ? new Date(at).toLocaleTimeString("en-GB", { timeZone: "Europe/Belgrade" }) : "—"} CEST
        </span>
      </div>
    </div>
  );
}

/* ---------- events ---------- */
function EventThumb({ ev }: { ev: FEvent }) {
  const [ref, inView] = useInView<HTMLDivElement>();
  const { url } = useAuthedBlob(`event/${ev.id}/thumb`, 0, inView);
  return (
    <div ref={ref} className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-black/50">
      {url ? <img src={url} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-muted-foreground"><LabelIcon label={ev.label} /></div>}
      {ev.hasClip && <Play className="absolute bottom-1 right-1 h-3.5 w-3.5 text-white drop-shadow" />}
    </div>
  );
}

function EventPlayer({ ev, onClose }: { ev: FEvent; onClose: () => void }) {
  const [mode, setMode] = useState<"clip" | "snapshot">(ev.hasClip && ev.end ? "clip" : "snapshot");
  const clip = useAuthedBlob(mode === "clip" ? `event/${ev.id}/clip` : null);
  const snap = useAuthedBlob(mode === "snapshot" ? `event/${ev.id}/snapshot` : null);
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/85 p-3 backdrop-blur" onClick={onClose} role="dialog" aria-modal="true">
      <div className="hq-card w-full max-w-4xl overflow-hidden p-0" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-2 px-4 py-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm font-medium capitalize">
              <LabelIcon label={ev.label} /> {ev.label}{ev.subLabel ? ` · ${ev.subLabel}` : ""}
              {ev.score != null && <span className="hq-num text-xs text-muted-foreground">{Math.round(ev.score * 100)}%</span>}
            </div>
            <div className="text-xs text-muted-foreground">{camLabel(ev.camera)} · {fmtWhen(ev.start)} CEST{ev.end ? ` · ${Math.max(1, Math.round(ev.end - ev.start))}s` : " · in progress"}</div>
          </div>
          <div className="flex items-center gap-1">
            {ev.hasClip && ev.end && (
              <button onClick={() => setMode("clip")} className={`rounded-lg px-2.5 py-1 text-xs ${mode === "clip" ? "bg-white/15" : "hover:bg-white/10"}`}>Clip</button>
            )}
            {ev.hasSnapshot && (
              <button onClick={() => setMode("snapshot")} className={`rounded-lg px-2.5 py-1 text-xs ${mode === "snapshot" ? "bg-white/15" : "hover:bg-white/10"}`}>Snapshot</button>
            )}
            <button onClick={onClose} className="rounded-lg p-2 hover:bg-white/10" aria-label="Close"><X className="h-4 w-4" /></button>
          </div>
        </div>
        <div className="flex aspect-video items-center justify-center bg-black">
          {mode === "clip" ? (
            clip.url ? <video src={clip.url} controls autoPlay playsInline className="h-full w-full" /> : <span className="text-sm text-white/60">{clip.err ? "Clip unavailable" : "Loading clip…"}</span>
          ) : snap.url ? (
            <img src={snap.url} alt="" className="max-h-full max-w-full object-contain" />
          ) : (
            <span className="text-sm text-white/60">{snap.err ? "Snapshot unavailable" : "Loading…"}</span>
          )}
        </div>
      </div>
    </div>
  );
}

function Events({ cams }: { cams: Cam[] }) {
  const { token } = useAuth();
  const [label, setLabel] = useState<string>("");
  const [camera, setCamera] = useState<string>("");
  const q = useMemo(() => {
    const p = new URLSearchParams({ limit: "30" });
    if (label) p.set("label", label);
    if (camera) p.set("camera", camera);
    return `events?${p}`;
  }, [label, camera]);
  const live = useFrigate<{ items: FEvent[] }>(q, 15000);
  const [older, setOlder] = useState<FEvent[]>([]);
  const [more, setMore] = useState(true);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState<FEvent | null>(null);
  useEffect(() => { setOlder([]); setMore(true); }, [q]);
  const items = useMemo(() => {
    const seen = new Set<string>();
    return [...(live.data?.items || []), ...older].filter((e) => !seen.has(e.id) && seen.add(e.id));
  }, [live.data, older]);
  const loadMore = useCallback(async () => {
    const last = items[items.length - 1];
    if (!last) return;
    setBusy(true);
    try {
      const r = await fjson<{ items: FEvent[] }>(`${q}&before=${last.start}`, token);
      setOlder((o) => [...o, ...r.items]);
      if (r.items.length < 30) setMore(false);
    } catch { setMore(false); } finally { setBusy(false); }
  }, [items, q, token]);
  const labels = Array.from(new Set(["person", "car", ...cams.flatMap((c) => c.objects)]));
  const chip = (on: boolean) => `rounded-full border px-3 py-1 text-xs capitalize transition ${on ? "border-sky/60 bg-sky/15 text-foreground" : "border-white/10 text-muted-foreground hover:text-foreground"}`;
  return (
    <section className="hq-card p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="hq-label flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5" /> Recent detections</div>
        <div className="flex flex-wrap gap-1.5">
          <button className={chip(!label)} onClick={() => setLabel("")}>All</button>
          {labels.map((l) => <button key={l} className={chip(label === l)} onClick={() => setLabel(l)}>{l}</button>)}
          <select value={camera} onChange={(e) => setCamera(e.target.value)} className="rounded-full border border-white/10 bg-transparent px-3 py-1 text-xs text-muted-foreground" aria-label="Camera filter">
            <option value="">All cameras</option>
            {cams.map((c) => <option key={c.name} value={c.name}>{camLabel(c.name)}</option>)}
          </select>
        </div>
      </div>
      {live.loading && !items.length ? (
        <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-16 animate-pulse rounded-lg bg-white/5" />)}</div>
      ) : !items.length ? (
        <div className="py-8 text-center text-sm text-muted-foreground">{live.error ? "Couldn't load events." : "No detections yet."}</div>
      ) : (
        <ul className="grid gap-2 md:grid-cols-2">
          {items.map((ev) => (
            <li key={ev.id} className="min-w-0">
              <button onClick={() => setOpen(ev)} className="flex w-full items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-2 text-left transition hover:border-white/15 hover:bg-white/[0.05]">
                <EventThumb ev={ev} />
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 items-center gap-1.5 text-sm font-medium capitalize">
                    <LabelIcon label={ev.label} /> {ev.label}
                    {ev.subLabel && <span className="truncate rounded bg-white/10 px-1.5 text-[11px] normal-case">{ev.subLabel}</span>}
                    {!ev.end && <span className="rounded bg-rose-500/20 px-1.5 text-[10px] uppercase text-rose-300">live</span>}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">{camLabel(ev.camera)} · {fmtWhen(ev.start)} · {ago(ev.start)}</div>
                </div>
                {ev.score != null && <span className="hq-num shrink-0 text-xs text-muted-foreground">{Math.round(ev.score * 100)}%</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
      {items.length >= 30 && more && (
        <div className="mt-3 text-center">
          <button onClick={loadMore} disabled={busy} className="rounded-full border border-white/10 px-4 py-1.5 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50">{busy ? "Loading…" : "Load older"}</button>
        </div>
      )}
      {open && <EventPlayer ev={open} onClose={() => setOpen(null)} />}
    </section>
  );
}

/* ---------- states ---------- */
function Notice({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="hq-card mx-auto max-w-2xl p-6 sm:p-8">
      <div className="mb-3 flex items-center gap-3 text-lg font-semibold">{icon} {title}</div>
      <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </div>
  );
}

export default function CamerasApp() {
  const st = useFrigate<Status>("status", 10000);
  const [fs, setFs] = useState<number | null>(null);
  const s = st.data;
  const cams = s && s.configured && s.reachable ? s.cameras : [];
  const active = cams.filter((c) => c.enabled);
  const disabled = cams.filter((c) => !c.enabled);
  const online = active.filter((c) => c.online).length;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 px-3 pb-24 pt-4 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="hq-label flex items-center gap-2"><Cctv className="h-3.5 w-3.5" /> Frigate NVR</div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Cameras</h1>
        </div>
        {s && s.configured && s.reachable && (
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1"><Dot on={online > 0} /><span className="hq-num">{online}/{active.length}</span> online</span>
            {s.version && <span className="rounded-full border border-white/10 px-3 py-1">v{s.version.split("-")[0]}</span>}
            <span className="hq-num rounded-full border border-white/10 px-3 py-1">{s.latencyMs} ms</span>
            <button onClick={st.reload} className="rounded-full border border-white/10 p-1.5 hover:text-foreground" aria-label="Refresh"><RefreshCw className="h-3.5 w-3.5" /></button>
          </div>
        )}
      </header>

      {st.loading && !s ? (
        <div className="grid gap-3 sm:grid-cols-2">{[0, 1].map((i) => <div key={i} className="hq-card aspect-video animate-pulse" />)}</div>
      ) : !s ? (
        <Notice icon={<WifiOff className="h-5 w-5 text-rose-400" />} title="Camera service unavailable">
          <p>The camera proxy didn't respond ({st.error}). It retries automatically.</p>
        </Notice>
      ) : !s.configured ? (
        <Notice icon={<Cctv className="h-5 w-5 text-sky" />} title="Connect your Frigate">
          <p>The Cameras tab is ready. It needs a private connection to your Frigate NVR on the Mac mini. All camera traffic goes through a server-side proxy. Your Frigate address and login never reach the browser.</p>
          <ol className="list-decimal space-y-1 pl-5">
            <li>Expose Frigate (port 8971) on a public HTTPS address, e.g. Tailscale Funnel or a Cloudflare Tunnel.</li>
            <li>Create a Frigate user with the <em>viewer</em> role.</li>
            <li>Add these secrets in Lovable Cloud: <code>FRIGATE_URL</code>, <code>FRIGATE_USER</code>, <code>FRIGATE_PASSWORD</code>.</li>
          </ol>
        </Notice>
      ) : !s.reachable ? (
        <Notice icon={<WifiOff className="h-5 w-5 text-rose-400" />} title="Frigate is offline or unreachable">
          <p>The proxy is configured, but it can't reach Frigate right now{s.error ? ` (${s.error})` : ""}. Check that the Mac mini is on and that the public tunnel is running. This page retries every 10 seconds.</p>
          <button onClick={st.reload} className="rounded-full border border-white/10 px-4 py-1.5 text-xs hover:text-foreground">Retry now</button>
        </Notice>
      ) : (
        <>
          <div className={`grid gap-3 ${active.length > 2 ? "sm:grid-cols-2 xl:grid-cols-3" : "sm:grid-cols-2"}`}>
            {active.map((c, i) => <CamTile key={c.name} cam={c} onOpen={() => setFs(i)} />)}
          </div>
          {disabled.length > 0 && (
            <div className="flex items-center gap-2 px-1 text-xs text-muted-foreground">
              <Video className="h-3.5 w-3.5" /> Disabled in Frigate: {disabled.map((c) => camLabel(c.name)).join(", ")}
            </div>
          )}
          <Events cams={active} />
          {fs != null && active[fs] && <Fullscreen cams={active} index={fs} setIndex={setFs} onClose={() => setFs(null)} />}
        </>
      )}
    </div>
  );
}
