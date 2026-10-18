// @ts-nocheck
import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { useT } from '../i18n';
import { getToken } from '../api';
import { FN_BASE } from '@/lib/fn';

/** HLS player for iptv-org streams: try direct, then via server proxy (CORS / mixed content), else show unavailable. */
export default function HlsPlayer({ url, onDead, onOk }) {
  const ref = useRef(null);
  const t = useT();
  const [state, setState] = useState('loading');
  useEffect(() => {
    const video = ref.current;
    if (!video || !url) return;
    let hls, timer, attempt = 0, dead = false;
    const proxied = `${FN_BASE}/wi-api/tv/hls?u=${encodeURIComponent(url)}&t=${encodeURIComponent(getToken() || '')}`;
    const candidates = location.protocol === 'https:' && url.startsWith('http:') ? [proxied] : [url, proxied];
    const fail = () => {
      clearTimeout(timer);
      hls?.destroy(); hls = null;
      if (dead) return;
      attempt++;
      if (attempt < candidates.length) start(); else { setState('dead'); onDead?.(); }
    };
    const start = () => {
      setState('loading');
      const src = candidates[attempt];
      timer = setTimeout(fail, 15000);
      if (Hls.isSupported()) {
        hls = new Hls({ maxBufferLength: 20, manifestLoadingTimeOut: 10000, levelLoadingTimeOut: 10000, fragLoadingTimeOut: 15000 });
        hls.on(Hls.Events.ERROR, (_, data) => { if (data.fatal) fail(); });
        hls.on(Hls.Events.FRAG_BUFFERED, () => { clearTimeout(timer); setState('ok'); onOk?.(); });
        hls.loadSource(src); hls.attachMedia(video);
        video.muted = true; video.play().catch(() => {});
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = src; video.onloadeddata = () => { clearTimeout(timer); setState('ok'); onOk?.(); }; video.onerror = fail; video.play().catch(() => {});
      } else fail();
    };
    start();
    return () => { dead = true; clearTimeout(timer); hls?.destroy(); };
  }, [url]);
  return (
    <div className="player-frame">
      <video ref={ref} controls playsInline muted />
      {state === 'loading' && <div className="player-msg">ACQUIRING SIGNAL…</div>}
      {state === 'dead' && <div className="player-msg red">✕ {t('Stream unavailable')}<small>offline, geo-blocked or blocked by the broadcaster</small></div>}
    </div>
  );
}
