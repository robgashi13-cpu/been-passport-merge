import { useEffect, useRef, useState } from "react";
import { Airplay, PictureInPicture2, Maximize, X, Loader2, AlertTriangle } from "lucide-react";
import { DownloadButton } from "./DownloadButton";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hub/auth";
import { playUrl, useHistory, type PlayItem } from "./api";

/**
 * Native-first player: iPhone/iPad/Safari play HLS through the built-in AVPlayer
 * (playsinline + fullscreen + AirPlay + PiP). Other browsers use hls.js.
 */
export function Player({ item, startAt = 0, onClose }: { item: PlayItem; startAt?: number; onClose: () => void }) {
  const { token } = useAuth();
  const video = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<"loading" | "playing" | "error">("loading");
  const [err, setErr] = useState<string>("");
  const { record } = useHistory();
  const lastSave = useRef(0);

  // VOD: browsers (esp. iPhone) can't decode MKV/AVI etc. → ask the provider for an HLS remux.
  // Whatever we try first, fall back to the other format once before showing an error.
  const ext = (item.ext || "mp4").toLowerCase();
  const fileFirst = item.kind === "live" || ["mp4", "m4v", "mov"].includes(ext);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => { setAttempt(0); }, [item.kind, item.id]);

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    let hls: any = null;
    let alive = true;
    let failed = false;
    setState("loading");
    const useHls = item.kind !== "live" && (attempt === 0 ? !fileFirst : fileFirst);
    const fail = (msg: string) => {
      if (!alive || failed) return;
      failed = true;
      if (item.kind !== "live" && attempt === 0) { setAttempt(1); return; }
      setErr(msg);
      setState("error");
    };
    const hlsModule = v.canPlayType("application/vnd.apple.mpegurl") ? null : import("hls.js");
    let seek: (() => void) | null = null;
    (async () => {
      try {
        const { url, type } = await playUrl(item, token, false, useHls);
        if (!alive) return;
        // Safari / iOS: native AVPlayer (AirPlay, PiP, system controls). Everyone else: hls.js.
        const ua = navigator.userAgent;
        const appleNative = /iPad|iPhone|iPod/.test(ua) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(ua)) || (/Safari/.test(ua) && !/Chrome|Chromium|CriOS|Edg|OPR|Android|Firefox/.test(ua));
        const native = appleNative && !!v.canPlayType("application/vnd.apple.mpegurl");
        if (type === "hls" && !native) {
          const { default: Hls } = await (hlsModule ?? import("hls.js"));
          if (!alive) return;
          if (!Hls.isSupported()) throw new Error("This browser can't play HLS");
          hls = new Hls({
            lowLatencyMode: item.kind === "live",
            startLevel: -1,
            capLevelToPlayerSize: true,
            backBufferLength: 10,
            maxBufferLength: item.kind === "live" ? 6 : 20,
            maxMaxBufferLength: 30,
            maxBufferSize: 20 * 1000 * 1000,
            manifestLoadingMaxRetry: 4,
            levelLoadingMaxRetry: 4,
            fragLoadingMaxRetry: 6,
            manifestLoadingRetryDelay: 300,
            levelLoadingRetryDelay: 300,
            fragLoadingRetryDelay: 300,
            liveSyncDurationCount: 2,
            startPosition: item.kind === "live" ? -1 : 0,
            liveMaxLatencyDurationCount: 6,
            nudgeMaxRetry: 8,
          });
          hls.on(Hls.Events.ERROR, (_: unknown, d: any) => {
            if (!d.fatal) return;
            if (d.type === Hls.ErrorTypes.MEDIA_ERROR) { hls.recoverMediaError(); return; }
            const code = d.response?.code;
            fail(code === 502 || code === 403 ? "The provider refused the stream relay (it blocks cloud servers). The home media proxy needs to be enabled." : `Stream error: ${d.details}`);
          });
          hls.loadSource(url);
          hls.attachMedia(v);
        } else {
          v.src = url;
        }
        if (startAt > 5) { seek = () => { v.currentTime = startAt; }; v.addEventListener("loadedmetadata", seek, { once: true }); }
        await v.play().catch(() => {});
      } catch (e: any) {
        fail(String(e?.message || e));
      }
    })();
    const onPlaying = () => setState("playing");
    const onError = () => {
      if (hls) return;
      fail(item.kind === "live" ? "This channel can't be played right now." : "This title couldn't start. Your TV plan allows one stream at a time — close it on other devices and try again.");
    };
    v.addEventListener("playing", onPlaying);
    v.addEventListener("error", onError);
    return () => {
      alive = false;
      v.removeEventListener("playing", onPlaying);
      v.removeEventListener("error", onError);
      if (seek) v.removeEventListener("loadedmetadata", seek);
      if (hls) hls.destroy();
      v.removeAttribute("src");
      v.load();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.kind, item.id, token, attempt]);

  // continue-watching progress (and "recently watched" for live)
  useEffect(() => {
    const v = video.current;
    if (!v) return;
    const save = () => {
      const now = Date.now();
      if (now - lastSave.current < 10000) return;
      lastSave.current = now;
      record({ ...item, pos: item.kind === "live" ? 0 : v.currentTime, dur: item.kind === "live" ? 0 : v.duration || 0, at: now });
    };
    v.addEventListener("timeupdate", save);
    return () => v.removeEventListener("timeupdate", save);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.kind, item.id]);

  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);

  const v = () => video.current as any;
  const fullscreen = () => {
    const el = v();
    if (!el) return;
    if (el.webkitEnterFullscreen && !document.fullscreenEnabled) el.webkitEnterFullscreen();
    else (el.requestFullscreen || el.webkitRequestFullscreen)?.call(el);
  };
  const pip = () => {
    const el = v();
    if (!el) return;
    if (document.pictureInPictureElement) document.exitPictureInPicture();
    else if (el.requestPictureInPicture) el.requestPictureInPicture().catch(() => {});
    else if (el.webkitSetPresentationMode) el.webkitSetPresentationMode("picture-in-picture");
  };
  const airplay = () => v()?.webkitShowPlaybackTargetPicker?.();
  const hasAirplay = typeof window !== "undefined" && "WebKitPlaybackTargetAvailabilityEvent" in window;

  const ctl = "flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white/80 backdrop-blur-md transition hover:bg-white/15 hover:text-white active:scale-95";
  return (
    <div className="on-media fixed inset-0 z-[90] flex flex-col bg-black/95 backdrop-blur-xl" role="dialog" aria-modal="true" aria-label={`Playing ${item.name}`}>
      {/* ambient glow from the poster */}
      {item.logo && <img src={item.logo} alt="" aria-hidden className="pointer-events-none absolute inset-0 h-full w-full scale-125 object-cover opacity-[0.07] blur-3xl" referrerPolicy="no-referrer" />}

      {/* floating glass header */}
      <div className="relative z-10 mx-auto mt-2 flex w-full max-w-5xl items-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-2 shadow-2xl shadow-black/50 backdrop-blur-xl sm:mx-4 sm:w-auto" style={{ marginTop: "max(env(safe-area-inset-top), 0.5rem)", marginLeft: "max(0.75rem, env(safe-area-inset-left))", marginRight: "max(0.75rem, env(safe-area-inset-right))" }}>
        {item.logo && <img src={item.logo} alt="" className="h-9 w-9 shrink-0 rounded-lg bg-white/5 object-contain ring-1 ring-white/10" referrerPolicy="no-referrer" />}
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-white">{item.name}</div>
          {item.sub && <div className="truncate text-xs text-white/50">{item.sub}</div>}
        </div>
        {item.kind === "live" && <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-rose-500/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-rose-300"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-400" />Live</span>}
        {item.kind !== "live" && <DownloadButton item={item} />}
        {hasAirplay && <button onClick={airplay} className={ctl} aria-label="AirPlay"><Airplay className="h-4.5 w-4.5" /></button>}
        <button onClick={pip} className={ctl} aria-label="Picture in picture"><PictureInPicture2 className="h-4.5 w-4.5" /></button>
        <button onClick={fullscreen} className={ctl} aria-label="Fullscreen"><Maximize className="h-4.5 w-4.5" /></button>
        <button onClick={onClose} className={`${ctl} hover:bg-rose-500/20 hover:text-rose-300`} aria-label="Close player"><X className="h-4.5 w-4.5" /></button>
      </div>

      {/* video stage */}
      <div className="relative z-10 flex min-h-0 flex-1 items-center justify-center p-3 sm:p-5">
        <div className="relative flex h-full max-h-full w-full max-w-6xl items-center justify-center overflow-hidden rounded-2xl bg-black shadow-2xl shadow-black/60 ring-1 ring-white/10">
          <video
            ref={video}
            className="h-full max-h-full w-full bg-black object-contain"
            controls
            preload="auto"
            playsInline
            autoPlay
            x-webkit-airplay="allow"
            {...({ "webkit-playsinline": "true" } as any)}
          />
          {state === "loading" && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/40">
              <Loader2 className="h-9 w-9 animate-spin text-white/70" />
              <div className="text-[11px] font-medium uppercase tracking-[0.25em] text-white/40">Loading stream</div>
            </div>
          )}
          {state === "error" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/85 p-6 backdrop-blur-sm">
              <div className="max-w-md text-center text-white">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-amber-400/30 bg-amber-400/10"><AlertTriangle className="h-7 w-7 text-amber-400" /></div>
                <div className="text-sm leading-relaxed text-white/80">{err}</div>
                <button onClick={onClose} className="mt-5 rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-black transition hover:bg-white/90 active:scale-95">Close</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
