import { useEffect, useRef, useState } from "react";
import { Airplay, PictureInPicture2, Maximize, X, Loader2, AlertTriangle } from "lucide-react";
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

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    let hls: any = null;
    let alive = true;
    setState("loading");
    (async () => {
      try {
        const { url, type } = await playUrl(item, token);
        if (!alive) return;
        // Safari / iOS: native AVPlayer (AirPlay, PiP, system controls). Everyone else: hls.js.
        const ua = navigator.userAgent;
        const appleNative = /iPad|iPhone|iPod/.test(ua) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(ua)) || (/Safari/.test(ua) && !/Chrome|Chromium|CriOS|Edg|OPR|Android|Firefox/.test(ua));
        const native = appleNative && !!v.canPlayType("application/vnd.apple.mpegurl");
        if (type === "hls" && !native) {
          const { default: Hls } = await import("hls.js");
          if (!Hls.isSupported()) throw new Error("This browser can't play HLS");
          hls = new Hls({ lowLatencyMode: false, backBufferLength: 30, maxBufferLength: 30 });
          hls.on(Hls.Events.ERROR, (_: unknown, d: any) => {
            if (!d.fatal) return;
            if (d.type === Hls.ErrorTypes.MEDIA_ERROR) { hls.recoverMediaError(); return; }
            const code = d.response?.code;
            setErr(code === 502 || code === 403 ? "The provider refused the stream relay (it blocks cloud servers). The home media proxy needs to be enabled." : `Stream error: ${d.details}`);
            setState("error");
          });
          hls.loadSource(url);
          hls.attachMedia(v);
        } else {
          v.src = url;
        }
        if (startAt > 5) v.addEventListener("loadedmetadata", () => { v.currentTime = startAt; }, { once: true });
        await v.play().catch(() => {});
      } catch (e: any) {
        if (!alive) return;
        setErr(String(e?.message || e));
        setState("error");
      }
    })();
    const onPlaying = () => setState("playing");
    const onError = () => {
      if (hls) return;
      setErr(item.kind === "live" ? "This channel can't be played right now." : "This file can't be played in the browser (format or relay).");
      setState("error");
    };
    v.addEventListener("playing", onPlaying);
    v.addEventListener("error", onError);
    return () => {
      alive = false;
      v.removeEventListener("playing", onPlaying);
      v.removeEventListener("error", onError);
      if (hls) hls.destroy();
      v.removeAttribute("src");
      v.load();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.kind, item.id, token]);

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

  return (
    <div className="fixed inset-0 z-[90] flex flex-col bg-black" role="dialog" aria-modal="true" aria-label={`Playing ${item.name}`}>
      <div className="flex items-center gap-3 px-3 py-2 text-white" style={{ paddingTop: "max(env(safe-area-inset-top), 0.5rem)" }}>
        {item.logo && <img src={item.logo} alt="" className="h-8 w-8 rounded-md bg-white/5 object-contain" referrerPolicy="no-referrer" />}
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{item.name}</div>
          {item.sub && <div className="truncate text-xs text-white/60">{item.sub}</div>}
        </div>
        {hasAirplay && (
          <button onClick={airplay} className="rounded-lg p-2 hover:bg-white/10" aria-label="AirPlay"><Airplay className="h-5 w-5" /></button>
        )}
        <button onClick={pip} className="rounded-lg p-2 hover:bg-white/10" aria-label="Picture in picture"><PictureInPicture2 className="h-5 w-5" /></button>
        <button onClick={fullscreen} className="rounded-lg p-2 hover:bg-white/10" aria-label="Fullscreen"><Maximize className="h-5 w-5" /></button>
        <button onClick={onClose} className="rounded-lg p-2 hover:bg-white/10" aria-label="Close player"><X className="h-5 w-5" /></button>
      </div>
      <div className="relative flex flex-1 items-center justify-center">
        <video
          ref={video}
          className="h-full max-h-full w-full bg-black object-contain"
          controls
          playsInline
          autoPlay
          x-webkit-airplay="allow"
          {...({ "webkit-playsinline": "true" } as any)}
        />
        {state === "loading" && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-white/60" /></div>
        )}
        {state === "error" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-6">
            <div className="max-w-md text-center text-white">
              <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-amber-400" />
              <div className="text-sm leading-relaxed text-white/80">{err}</div>
              <button onClick={onClose} className="mt-4 rounded-full bg-white px-5 py-2 text-sm font-medium text-black">Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
