// @ts-nocheck
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { usePoll, flag, getJSON } from '../api';
import { makeGlobe, countriesGeo, setLand, countryAt } from './Globe';
import { YtEmbed } from './Player';
import HlsPlayer from './HlsPlayer';
import { useT } from '../i18n';
import { useMobile } from '../api';

export default function TvView({ meta, region }) {
  const t = useT();
  const yt = usePoll('/api/tv/youtube', 3600e3);
  const counts = usePoll('/api/tv/iptv', 6 * 3600e3);
  const [country, setCountry] = useState(() => localStorage.getItem('tvCountry') || 'XK');
  const [q, setQ] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [iptvList, setIptvList] = useState([]);
  const [playing, setPlaying] = useState(null);
  const [dead, setDead] = useState(() => new Set());
  const [okSet, setOkSet] = useState(() => new Set());
  const mobile = useMobile();
  const elRef = useRef(null);
  const gRef = useRef(null);
  const [geo, setGeo] = useState(null);

  useEffect(() => { localStorage.setItem('tvCountry', country); }, [country]);
  useEffect(() => { countriesGeo().then(setGeo); }, []);
  useEffect(() => { getJSON(`/api/tv/iptv?country=${country}${showAll ? '&all=1' : ''}`).then((d) => setIptvList(d.items)).catch(() => setIptvList([])); }, [country, showAll]);

  const ytAll = yt.data?.channels || [];
  const ytByCountry = useMemo(() => { const m = {}; for (const c of ytAll) (m[c.country] ||= []).push(c); return m; }, [ytAll]);
  const iptvCounts = counts.data?.counts || {};
  const countryNames = useMemo(() => { const m = { ...(meta?.countryNames || {}) }; for (const c of counts.data?.countries || []) m[c.code] ||= c.name; m.XK = 'Kosovo'; return m; }, [meta, counts.data]);
  const regionCountries = region !== 'global' && meta ? meta.regions[region].countries : null;
  const allCountries = useMemo(() => [...new Set([...Object.keys(ytByCountry), ...Object.keys(iptvCounts)])].filter((c) => !regionCountries || regionCountries.includes(c)).sort((a, b) => (countryNames[a] || a).localeCompare(countryNames[b] || b)), [ytByCountry, iptvCounts, countryNames, regionCountries]);

  useEffect(() => { if (regionCountries && !regionCountries.includes(country) && allCountries.length) setCountry(allCountries.includes('XK') ? 'XK' : allCountries[0]); }, [region]);

  // globe
  useEffect(() => {
    if (mobile || !elRef.current || gRef.current) return; // no second WebGL context on phones
    const g = makeGlobe(elRef.current);
    g.pointOfView({ lat: 42, lng: 20, altitude: 1.9 });
    g.controls().autoRotate = false;
    g.onGlobeClick(({ lat, lng }) => { const f = g.__feats && countryAt(g.__feats, lat, lng); if (f?.properties.iso) setCountry(f.properties.iso); });
    gRef.current = g;
    return () => {};
  }, []);
  useEffect(() => {
    const g = gRef.current; if (!g || !geo) return;
    g.__feats = geo.features;
    setLand(g, geo.features, (f) => { const iso = f.properties.iso; if (iso === country) return ['#6cb8ff', 0.55]; const y = ytByCountry[iso]?.length || 0, i = iptvCounts[iso] || 0; if (regionCountries && !regionCountries.includes(iso)) return ['#9aaabd', 0.07]; return y ? ['#6cb8ff', Math.min(0.42, 0.14 + y * 0.03)] : i ? ['#6cb8ff', 0.12] : ['#9aaabd', 0.14]; });
  }, [geo, country, ytByCountry, iptvCounts, region]);
  useEffect(() => {
    const g = gRef.current; if (!g || !geo) return;
    const f = geo.features.find((x) => x.properties.iso === country); if (!f) return;
    const b = bbox(f.geometry); g.pointOfView({ lat: (b[1] + b[3]) / 2, lng: (b[0] + b[2]) / 2, altitude: 1.4 }, 1000);
  }, [country, geo]);

  // search across everything
  const ql = q.trim().toLowerCase();
  const ytShown = ql ? ytAll.filter((c) => (c.name + ' ' + (c.ytAuthor || '') + ' ' + (countryNames[c.country] || '')).toLowerCase().includes(ql)) : ytByCountry[country] || [];
  const iptvShown = ql ? [] : iptvList;

  useEffect(() => {
    if (ql) return;
    if (ytShown[0]) setPlaying({ kind: 'yt', ch: ytShown[0] });
    else if (iptvShown[0]) setPlaying({ kind: 'hls', url: iptvShown[0].streams[0].url, name: iptvShown[0].name });
  }, [country, ytShown.length, iptvShown.length]);

  return (
    <div className="tv-view">
      {!mobile && <div className="tv-globe"><div className="globe-canvas" ref={elRef} />
        <div className="tv-hint">{t('Click a country')} · <span className="cy">■</span> official YouTube live · <span className="dim">■</span> iptv-org only</div>
        <div className="tv-stats">{ytAll.length} verified YouTube lives · {counts.data?.total || '…'} iptv-org news channels w/ streams</div>
      </div>}
      <div className="tv-side">
        <div className="tv-player">
          {playing?.kind === 'yt' && <YtEmbed key={playing.ch.channelId} channelId={playing.ch.channelId} title={playing.ch.name} muted={false} />}
          {playing?.kind === 'hls' && <HlsPlayer key={playing.url} url={playing.url} onDead={() => setDead((s) => new Set(s).add(playing.url))} onOk={() => setOkSet((s) => new Set(s).add(playing.url))} />}
          {!playing && <div className="player-frame"><div className="player-msg">SELECT A CHANNEL</div></div>}
          <div className="now-playing">{playing ? <>▶ {playing.kind === 'yt' ? `${playing.ch.name} — ${flag(playing.ch.country)} ${countryNames[playing.ch.country] || ''}` : `${playing.name} — iptv-org stream`} {playing.kind === 'yt' ? <a href={playing.ch.sourceUrl} target="_blank" rel="noreferrer">official channel ↗</a> : <a href={playing.url} target="_blank" rel="noreferrer">stream URL ↗</a>}</> : '—'}</div>
        </div>
        <div className="tv-controls">
          <select value={country} onChange={(e) => { setCountry(e.target.value); setQ(''); }}>
            {allCountries.map((c) => <option key={c} value={c}>{flag(c)} {countryNames[c] || c} ({(ytByCountry[c]?.length || 0) + (iptvCounts[c] || 0)})</option>)}
          </select>
          <input placeholder={t('Search channels…')} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="tv-list">
          <div className="list-h">{t('OFFICIAL YOUTUBE LIVE')} <span className="muted">· verified live & embeddable at build · {ytShown.length}</span></div>
          {ytShown.map((c) => (
            <div key={c.channelId} className={'ch' + (playing?.ch?.channelId === c.channelId ? ' on' : '')} onClick={() => setPlaying({ kind: 'yt', ch: c })}>
              <img src={`https://i.ytimg.com/vi/${c.liveVideoId}/mqdefault.jpg`} alt="" loading="lazy" />
              <div><b>{c.name}</b>{c.official !== 'unconfirmed' ? <span className="vbadge" title={'official check: ' + c.official}>✔</span> : <span className="ubadge" title="channel ownership not confirmed automatically">◌</span>}<small>{flag(c.country)} {countryNames[c.country] || c.country} · {c.category} · {c.lang || ''}</small></div>
              <span className="lamp green" title="live at last check" />
            </div>
          ))}
          {!ytShown.length && <div className="muted pad">No verified official YouTube live channel for this selection.</div>}
          {!ql && <>
            <div className="list-h">{t('IPTV-ORG STREAMS')} <span className="muted">· {counts.data?.filtered ? 'passed server check' : 'public HLS'} · {iptvShown.length}</span> <label className="chk"><input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} /> incl. failed</label></div>
            {iptvShown.map((c) => c.streams.map((s, i) => (
              <div key={s.url} className={'ch' + (playing?.url === s.url ? ' on' : '')} onClick={() => setPlaying({ kind: 'hls', url: s.url, name: c.name })}>
                <div className="ch-ico">TV</div>
                <div><b>{c.name}{c.streams.length > 1 ? ` #${i + 1}` : ''}</b><small>{s.quality || '—'}{s.label ? ' · ' + s.label : ''} · {(c.categories || []).join('/')} · {new URL(s.url).host}</small></div>
                <span className={'lamp ' + (dead.has(s.url) || s.health?.alive === false ? 'red' : okSet.has(s.url) || s.health?.alive ? 'green' : 'grey')} title={dead.has(s.url) ? 'failed to play in your browser' : s.health ? `server check ${s.health.alive ? 'OK' : 'FAILED'} ${s.health.checkedAt}` : 'untested'} />
              </div>
            )))}
            {!iptvShown.length && <div className="muted pad">No iptv-org news streams listed for this country.</div>}
          </>}
        </div>
      </div>
    </div>
  );
}
function bbox(g) { const b = [180, 90, -180, -90]; const rings = g.type === 'Polygon' ? [g.coordinates] : g.coordinates; for (const p of rings) for (const [x, y] of p[0]) { b[0] = Math.min(b[0], x); b[1] = Math.min(b[1], y); b[2] = Math.max(b[2], x); b[3] = Math.max(b[3], y); } return b; }
