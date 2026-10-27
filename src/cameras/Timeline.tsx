import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Clock, Download, RefreshCw, X } from "lucide-react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hub/auth";
import { camLabel, fjson, fmtWhen, useFrigate, type Cam, type FEvent } from "./frigate";
import { mergeRecordings, playbackWindow, RECORDING_WINDOW, TIMELINE_CAMERAS, type Recording } from "./recordingTimeline";
import TimelineDownload from "./TimelineDownload";

function TimelinePlayer({ camera, start, end, onClose }: { camera: string; start: number; end: number; onClose: () => void }) {
  const { token } = useAuth();
  const video = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [playingTime, setPlayingTime] = useState(start);
  useEffect(() => {
    const el = video.current;
    if (!el) return;
    let alive = true;
    let hls: import("hls.js").default | undefined;
    const load = async () => {
      try {
        const result = await fjson<{ url: string }>(`vod-url?${new URLSearchParams({ camera, start: String(start), end: String(end) })}`, token);
        if (!alive) return;
        if (!result.url) throw new Error("No playback URL");
        if (el.canPlayType("application/vnd.apple.mpegurl")) {
          el.src = result.url;
        } else {
          const { default: Hls } = await import("hls.js");
          if (!alive) return;
          if (!Hls.isSupported()) throw new Error("Unsupported browser");
          hls = new Hls({ maxBufferLength: 20, capLevelToPlayerSize: true });
          hls.on(Hls.Events.ERROR, (_, data) => {
            if (alive && data.fatal) { setError("This recording couldn't play. Try another time."); setLoading(false); }
          });
          hls.loadSource(result.url);
          hls.attachMedia(el);
        }
        void el.play().catch(() => {});
      } catch {
        if (alive) { setError("Recording unavailable. Try another time."); setLoading(false); }
      }
    };
    void load();
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", key);
    return () => {
      alive = false;
      hls?.destroy();
      el.pause(); el.removeAttribute("src"); el.load();
      window.removeEventListener("keydown", key);
    };
  }, [camera, start, end, token, onClose]);
  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-background/90 p-3 backdrop-blur" role="dialog" aria-modal="true" aria-label="Recording player" onClick={onClose}>
      <div className="hq-card w-full max-w-4xl p-0" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <div className="text-sm font-medium">{camLabel(camera)}</div>
            <div className="hq-num text-xs text-muted-foreground">{fmtWhen(playingTime)} · Europe/Belgrade</div>
          </div>
          <Button variant="ghost" size="icon" aria-label="Close recording" onClick={onClose}><X /></Button>
        </div>
        <div className="on-media relative aspect-video bg-black">
          <video ref={video} playsInline controls autoPlay muted className="h-full w-full"
            onLoadedData={() => setLoading(false)} onTimeUpdate={() => setPlayingTime(start + (video.current?.currentTime || 0))}
            onError={() => { setError("This recording couldn't play. Try another time."); setLoading(false); }} />
          {(loading || error) && <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-4 text-center text-sm text-muted-foreground" role={error ? "alert" : "status"}>{error || "Loading recording…"}</div>}
        </div>
      </div>
    </div>, document.body,
  );
}

export default function Timeline({ cams }: { cams: Cam[] }) {
  const cameras = cams.filter((c) => TIMELINE_CAMERAS.includes(c.name));
  const [camera, setCamera] = useState(() => cameras[0]?.name || "office_top");
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  const start = now - RECORDING_WINDOW;
  const [selection, setSelection] = useState<{ start: number; end: number } | null>(null);
  const [downloadMode, setDownloadMode] = useState(false);
  const [range, setRange] = useState<{ start: number; end: number } | null>(null);
  const anchor = useRef<number | null>(null);
  const gesture = useRef<{ x: number; ts: number; moved: boolean } | null>(null);
  const ignoreClick = useRef(false);
  const closePlayer = useCallback(() => setSelection(null), []);
  const recordings = useFrigate<Recording[]>(`api/${camera}/recordings?after=${start}&before=${now}`, 60000);
  const events = useFrigate<{ items: FEvent[] }>(`events?camera=${camera}&limit=100`, 30000);
  const spans = useMemo(() => mergeRecordings(Array.isArray(recordings.data) ? recordings.data : [], start, now), [recordings.data, start, now]);
  useEffect(() => {
    const timer = setInterval(() => { if (!document.hidden) setNow(Math.floor(Date.now() / 1000)); }, 60000);
    return () => clearInterval(timer);
  }, []);
  const ticks = [];
  for (let hour = Math.ceil(start / 3600) * 3600; hour <= now; hour += 3600) ticks.push(hour);
  const position = (ts: number) => `${(ts - start) / RECORDING_WINDOW * 100}%`;
  if (!cameras.length) return null;
  return (
    <section className="hq-card min-w-0 p-4 sm:p-5" aria-label="48-hour recording timeline">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="t-subhead flex items-center gap-2 font-semibold"><Clock className="h-4 w-4" /> Timeline <span className="hq-num text-muted-foreground">48h</span></div>
        <div className="flex items-center gap-1">
          {cameras.map((c) => <Button key={c.name} size="sm" variant={camera === c.name ? "secondary" : "ghost"} aria-pressed={camera === c.name}
            onClick={() => { setCamera(c.name); setSelection(null); setRange(null); anchor.current = null; }}>{camLabel(c.name)}</Button>)}
          <Button variant="ghost" size="icon" aria-label="Refresh timeline" onClick={() => { setNow(Math.floor(Date.now() / 1000)); recordings.reload(); events.reload(); }}><RefreshCw /></Button>
        </div>
      </div>
      <div className="mb-2 flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
        <span>{fmtWhen(start)} — {fmtWhen(now)}</span><span>Europe/Belgrade</span>
      </div>
      <div className="mb-2 flex justify-end">
        <Button size="sm" variant={downloadMode ? "secondary" : "ghost"} aria-pressed={downloadMode}
          onClick={() => { setDownloadMode(!downloadMode); setRange(null); anchor.current = null; }}><Download className="h-3.5 w-3.5" />Download</Button>
      </div>
      <div className="overflow-x-auto pb-2">
        <div className="relative min-w-[960px] pt-6 pb-8">
          <Button variant="ghost" className="relative block h-10 w-full overflow-hidden rounded-xl border border-border bg-muted p-0 hover:bg-muted"
            style={{ touchAction: downloadMode ? "pan-y" : "auto" }}
            onPointerDown={(e) => {
              if (!downloadMode) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const ts = Math.floor(start + Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)) * RECORDING_WINDOW);
              gesture.current = { x: e.clientX, ts, moved: false }; ignoreClick.current = false;
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
              const g = gesture.current; if (!downloadMode || !g) return;
              if (Math.abs(e.clientX - g.x) < 4 && !g.moved) return;
              g.moved = true;
              const rect = e.currentTarget.getBoundingClientRect();
              const ts = Math.floor(start + Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)) * RECORDING_WINDOW);
              setRange({ start: Math.min(g.ts, ts), end: Math.max(g.ts, ts) });
            }}
            onPointerUp={() => {
              const g = gesture.current; if (!g) return;
              if (g.moved) { anchor.current = null; ignoreClick.current = true; }
              gesture.current = null;
            }} onPointerCancel={() => { gesture.current = null; }}
            aria-label={`${downloadMode ? "Select download range for" : "Play"} ${camLabel(camera)} recording at timeline position`} onClick={(e) => {
              if (ignoreClick.current) { ignoreClick.current = false; return; }
              const rect = e.currentTarget.getBoundingClientRect();
              const ratio = e.detail === 0 ? 0.5 : Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
              const ts = Math.floor(start + ratio * RECORDING_WINDOW);
              if (downloadMode) {
                if (anchor.current == null) { anchor.current = ts; setRange({ start: ts, end: ts }); }
                else { setRange({ start: Math.min(anchor.current, ts), end: Math.max(anchor.current, ts) }); anchor.current = null; }
              } else setSelection(playbackWindow(ts, now));
            }}>
            {spans.map((span) => <span key={span.start} className="pointer-events-none absolute inset-y-0 bg-sky/50" style={{ left: position(span.start), width: `${(span.end - span.start) / RECORDING_WINDOW * 100}%` }} />)}
            {ticks.map((ts) => <span key={ts} className="pointer-events-none absolute inset-y-0 border-l border-border/50" style={{ left: position(ts) }} />)}
            {downloadMode && range && Number.isFinite(range.start) && Number.isFinite(range.end) && <span className="pointer-events-none absolute inset-y-0 border-x-2 border-foreground bg-foreground/25" style={{ left: position(range.start), width: `${Math.max(0, range.end - range.start) / RECORDING_WINDOW * 100}%` }} />}
          </Button>
          {ticks.map((ts, i) => <span key={ts} className="pointer-events-none absolute top-16 text-[11px] text-muted-foreground" style={{ left: position(ts) }}>
            {i % 3 === 0 ? new Date(ts * 1000).toLocaleTimeString("en-GB", { timeZone: "Europe/Belgrade", hour: "2-digit", minute: "2-digit" }) : ""}
          </span>)}
          {(events.data?.items || []).filter((ev) => ev.start >= start && ev.start <= now && ev.camera === camera).map((ev) =>
            <Button key={ev.id} variant="ghost" size="icon" className="absolute top-0 h-6 w-6 -translate-x-1/2 p-0" style={{ left: position(ev.start) }}
              title={`${ev.label} · ${fmtWhen(ev.start)}`} aria-label={`Play ${ev.label} recording ${fmtWhen(ev.start)}`} disabled={downloadMode} onClick={() => setSelection(playbackWindow(ev.start, now))}>
              <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
            </Button>)}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4 text-[12px] text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="h-2 w-3 rounded-sm bg-sky/50" />Recorded</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-3 rounded-sm border border-border bg-muted" />Gap</span>
        <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-foreground" />Detection</span>
        {recordings.loading ? <span role="status">Loading recordings…</span> : recordings.error ? <span role="alert" className="text-destructive">Couldn't load recordings.</span> : !spans.length ? <span>No recordings in the last 48 hours.</span> : null}
      </div>
      {downloadMode && <TimelineDownload camera={camera} range={range} spans={spans} onChange={(next) => { anchor.current = null; setRange(next); }} />}
      {selection && <TimelinePlayer camera={camera} {...selection} onClose={closePlayer} />}
    </section>
  );
}