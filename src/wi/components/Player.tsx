// @ts-nocheck
import React, { useEffect, useRef, useState } from 'react';
import { getJSON } from '../api';
import { useT } from '../i18n';

/** Official YouTube live: resolve the current live video id server-side; fall back to the channel live_stream embed. */
export function YtEmbed({ channelId, videoId, muted = true, title }) {
  const [src, setSrc] = useState(null);
  const [state, setState] = useState('loading');
  useEffect(() => {
    let dead = false;
    setSrc(null); setState('loading');
    if (videoId) { // a specific live video (e.g. one webcam of a multi-stream channel)
      setSrc(`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=${muted ? 1 : 0}&rel=0&modestbranding=1&playsinline=1`); setState('live');
      return () => { dead = true; };
    }
    getJSON(`/api/tv/ytlive/${channelId}`).then((d) => {
      if (dead) return;
      const q = `autoplay=1&mute=${muted ? 1 : 0}&rel=0&modestbranding=1&playsinline=1`;
      setSrc(d.videoId ? `https://www.youtube.com/embed/${d.videoId}?${q}` : `https://www.youtube.com/embed/live_stream?channel=${channelId}&${q}`);
      setState(d.live ? 'live' : 'offline?');
    }).catch(() => { if (!dead) { setSrc(`https://www.youtube.com/embed/live_stream?channel=${channelId}&autoplay=1&mute=1`); setState('unknown'); } });
    return () => { dead = true; };
  }, [channelId, videoId, muted]);
  return (
    <div className="player-frame">
      {src ? <iframe src={src} title={title || 'live'} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" /> : <div className="player-msg">RESOLVING LIVE FEED…</div>}
      {state === 'offline?' && <div className="player-badge amber">CHANNEL NOT LIVE RIGHT NOW</div>}
    </div>
  );
}

