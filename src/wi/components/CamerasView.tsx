// @ts-nocheck
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { usePoll, flag, timeAgo } from '../api';
import { YtEmbed } from './Player';
import VirtualList from '../ui/VirtualList';
import { makeGlobe } from './Globe';
import { useT } from '../i18n';
import { useMobile } from '../api';

export default function CamerasView({ meta, region }) {
  const t = useT();
  const cams = usePoll('/api/tv/webcams', 3600e3);
  const [wcountry, setWcountry] = useState('XK');
  const windy = usePoll(meta?.windyEnabled ? `/api/windy?country=${wcountry}` : null, 600e3, !!meta?.windyEnabled);
  const [q, setQ] = useState('');
  const [cc, setCc] = useState('ALL');
  const [sel, setSel] = useState(null);
  const mobile = useMobile();
  const elRef = useRef(null), gRef = useRef(null);
  const names = meta?.countryNames || {};
  const regionCountries = region !== 'global' && meta ? meta.regions[region].countries : null;
  const list = cams.data?.webcams || [];
  const inReg = list.filter((c) => !regionCountries || regionCountries.includes(c.country));
  const countries = useMemo(() => { const m = {}; for (const c of inReg) m[c.country || '??'] = (m[c.country || '??'] || 0) + 1; return Object.entries(m).sort((a, b) => b[1] - a[1]); }, [inReg]);
  const ql = q.trim().toLowerCase();
  const shown = inReg.filter((c) => (cc === 'ALL' || (c.country || '??') === cc) && (!ql || `${c.name} ${c.place} ${c.liveTitle} ${names[c.country] || ''}`.toLowerCase().includes(ql)));
  useEffect(() => { setCc('ALL'); }, [region]);
  useEffect(() => { if (!sel && list[0]) setSel({ kind: 'yt', c: list[0] }); }, [list.length]);

  useEffect(() => {
    if (mobile || !elRef.current || gRef.current) return; // no second WebGL context on phones
    const g = makeGlobe(elRef.current);
    g.pointOfView({ lat: 30, lng: 10, altitude: 2.2 });
    g.pointLat('lat').pointLng('lon').pointColor(() => '#6cb8ff').pointAltitude(0.01).pointRadius(0.32).pointResolution(6)
      .pointLabel((d) => `<div class="g-tip"><b>▣ ${d.name}</b><br/><span>${d.place || ''} · ${d.ytAuthor || ''}</span></div>`)
      .onPointClick((d) => setSel({ kind: 'yt', c: d }));
    gRef.current = g;
  }, []);
  useEffect(() => { gRef.current?.pointsData(shown.filter((c) => c.lat != null)); }, [shown]);
  useEffect(() => { const g = gRef.current; if (g && sel?.c?.lat != null) g.pointOfView({ lat: sel.c.lat, lng: sel.c.lon, altitude: 1.2 }, 1000); }, [sel]);
  useEffect(() => { const g = gRef.current; if (!g || !meta) return; if (region !== 'global') { const r = meta.regions[region]; g.pointOfView({ lat: r.center[0], lng: r.center[1], altitude: r.alt + 0.4 }, 1000); } }, [region, meta]);

  return (
    <div className="tv-view">
      {!mobile && <div className="tv-globe"><div className="globe-canvas" ref={elRef} />
        <div className="tv-hint">▣ {inReg.length} public live webcams (verified live) · click a point</div>
        <div className="tv-stats legal-mini">Public, legitimate sources only — official YouTube webcam streams + Windy API. Never private / unsecured cameras.</div>
      </div>}
      <div className="tv-side">
        <div className="tv-player">
          {sel?.kind === 'yt' && <YtEmbed key={sel.c.liveVideoId || sel.c.channelId} channelId={sel.c.channelId} videoId={sel.c.listedVia === 'curated' ? null : sel.c.liveVideoId} title={sel.c.name} />}
          {sel?.kind === 'windy' && <div className="player-frame"><iframe src={sel.c.player} title={sel.c.title} allowFullScreen /></div>}
          {!sel && <div className="player-frame"><div className="player-msg">SELECT A CAMERA</div></div>}
          <div className="now-playing">{sel?.kind === 'yt' ? <>▶ {flag(sel.c.country)} {sel.c.liveTitle || sel.c.name} <a href={sel.c.sourceUrl} target="_blank" rel="noreferrer">{sel.c.ytAuthor || 'YouTube'} ↗</a></> : sel?.kind === 'windy' ? <>▶ {sel.c.title} <a href={sel.c.url} target="_blank" rel="noreferrer">Windy ↗</a></> : '—'}</div>
        </div>
        <div className="tv-controls">
          <select value={cc} onChange={(e) => setCc(e.target.value)}>
            <option value="ALL">◎ ALL COUNTRIES ({inReg.length})</option>
            {countries.map(([k, n]) => <option key={k} value={k}>{flag(k)} {names[k] || (k === '??' ? 'At sea / unknown' : k)} ({n})</option>)}
          </select>
          <input placeholder="Search cameras…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="tv-list">
          <div className="list-h">{t('PUBLIC CAMERAS')} <span className="muted">· YouTube live webcams · {shown.length}</span></div>
          <VirtualList className="cam-vlist" items={shown.map((c) => ({ ...c, id: c.liveVideoId }))} rowHeight={64} render={(c) => (
            <div className={'ch' + (sel?.c?.liveVideoId === c.liveVideoId ? ' on' : '')} onClick={() => setSel({ kind: 'yt', c })}>
              <img src={`https://i.ytimg.com/vi/${c.liveVideoId}/mqdefault.jpg`} alt="" loading="lazy" decoding="async" />
              <div><b>{c.name}</b><small>{flag(c.country)} {c.place || names[c.country] || ''} · {c.ytAuthor || ''}</small></div>
              <span className="lamp green" title={'live at check ' + c.checkedAt} />
            </div>)} />
          {!shown.length && <div className="muted pad">No verified live webcam for this selection.</div>}
          <div className="list-h">WINDY WEBCAMS API</div>
          {!meta?.windyEnabled ? <div className="keybox">🔒 Add <code>WINDY_API_KEY</code> to <code>.env</code> (free key at api.windy.com/keys) and restart to enable public city / traffic / landmark webcams per country (incl. Kosovo).</div> : <>
            <select className="wsel" value={wcountry} onChange={(e) => setWcountry(e.target.value)}>{Object.entries(names).sort((a, b) => a[1].localeCompare(b[1])).map(([k, v]) => <option key={k} value={k}>{flag(k)} {v}</option>)}</select>
            {(windy.data?.items || []).map((w) => (
              <div key={w.id} className="ch" onClick={() => setSel({ kind: 'windy', c: w })}>
                <img src={w.image} alt="" loading="lazy" /><div><b>{w.title}</b><small>{w.city} · updated {timeAgo(w.updated)} ago</small></div><span className={'lamp ' + (w.status === 'active' ? 'green' : 'grey')} />
              </div>))}
          </>}
        </div>
      </div>
    </div>
  );
}
