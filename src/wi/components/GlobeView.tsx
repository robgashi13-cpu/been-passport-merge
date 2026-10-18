// @ts-nocheck
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { usePoll, timeAgo, fmtTime, flag, useNow, useMobile, authBus, getToken } from '../api';
import { TYPES, typeOf, LEVEL_COLOR } from '../config';
import { makeGlobe, countriesGeo, setActive, setLand, countryAt } from './Globe';
import Panel from './Panel';
import StatusList from './StatusPanel';
import { YtEmbed } from './Player';
import VirtualList from '../ui/VirtualList';
import Sheet from '../ui/Sheet';
import { useT, LangCtx } from '../i18n';
import { Spark, Outlook } from './Outlook';

const WINDOWS = [1, 6, 24];
const STRAITS = [
  { name: 'Hormuz', lat: 26.57, lon: 56.25 }, { name: 'Bab el-Mandeb', lat: 12.58, lon: 43.33 },
  { name: 'Suez', lat: 30.6, lon: 32.33 }, { name: 'Bosphorus', lat: 41.12, lon: 29.07 },
  { name: 'Taiwan Strait', lat: 24.4, lon: 119.5 }, { name: 'Malacca', lat: 2.5, lon: 101.3 },
];
const MAIN_LAYERS = ['conflict', 'attack', 'protest', 'quake', 'fire', 'storm', 'volcano', 'flood'];
// three-globe forces material colour to white when a texture is set, so each colour gets its own tiny sprite
// (alphaTest 0.5 => crisp round dots with a dark rim for contrast). One THREE.Points draw call per (type, severity).
let THREE_ = null; const dotTex = {};
const dotTexture = (color) => {
  if (dotTex[color] || !THREE_) return dotTex[color];
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  x.beginPath(); x.arc(32, 32, 30, 0, 7); x.fillStyle = 'rgba(8,10,14,0.95)'; x.fill();
  x.beginPath(); x.arc(32, 32, 23, 0, 7); x.fillStyle = color; x.fill();
  return (dotTex[color] = new THREE_.CanvasTexture(c));
};

export default function GlobeView({ meta, region, setRegion, status, active }) {
  const t = useT();
  const lang = React.useContext(LangCtx);
  const mobile = useMobile();
  const now = useNow(30000);
  const [hours, setHours] = useState(6);
  const [ev, setEv] = useState({ items: [], loading: true });
  const threat = usePoll('/api/threat', 300e3);
  const risk = usePoll('/api/risk', 1800e3);
  const yt = usePoll('/api/tv/youtube', 3600e3);
  const [off, setOff] = useState(() => new Set(JSON.parse(localStorage.getItem('offTypes') || '[]')));
  const [sel, setSel] = useState(null);
  const [near, setNear] = useState([]); // events sharing the clicked spot (overlapping dots)
  const selRef = useRef(null); selRef.current = sel;
  const [threatTab, setThreatTab] = useState('regions');
  const [feedSort, setFeedSort] = useState('latest');
  const [sheetTab, setSheetTab] = useState('feed');
  const [liveCh, setLiveCh] = useState(null);
  const [cols, setCols] = useState(() => JSON.parse(localStorage.getItem('cols') || '{"l":true,"r":true}'));
  const [layersOpen, setLayersOpen] = useState(false);
  const elRef = useRef(null), globeRef = useRef(null), sheetRef = useRef(null), workerRef = useRef(null);
  const [geo, setGeo] = useState(null);
  const geoRef = useRef(null);

  useEffect(() => { localStorage.setItem('offTypes', JSON.stringify([...off])); }, [off]);
  useEffect(() => { localStorage.setItem('cols', JSON.stringify(cols)); }, [cols]);
  useEffect(() => { countriesGeo().then(setGeo); }, []);

  // data: Web Worker does fetch + parse + normalise off the main thread
  useEffect(() => {
    const w = new Worker(new URL('../workers/events.worker.ts', import.meta.url), { type: 'module' });
    w.onmessage = (m) => {
      if (m.data.type === 'data') setEv({ items: m.data.items, gdeltUpdated: m.data.gdeltUpdated, updatedAt: new Date(), parseMs: m.data.ms });
      else if (m.data.type === 'auth') authBus.dispatchEvent(new Event('logout'));
      else if (m.data.type === 'error') setEv((s) => ({ ...s, error: m.data.error, loading: false }));
    };
    workerRef.current = w;
    return () => w.terminate();
  }, []);
  useEffect(() => { workerRef.current?.postMessage({ type: 'start', hours, interval: 90000, token: getToken() }); }, [hours]);
  useEffect(() => { const f = () => workerRef.current?.postMessage({ type: 'token', token: getToken() }); window.addEventListener('wi-token', f); return () => window.removeEventListener('wi-token', f); }, []);
  useEffect(() => { const v = () => !document.hidden && workerRef.current?.postMessage({ type: 'refresh' }); document.addEventListener('visibilitychange', v); return () => document.removeEventListener('visibilitychange', v); }, []);

  const all = ev.items;
  const inRegion = (e) => region === 'global' || e.region === region;
  const visible = useMemo(() => all.filter((e) => !off.has(e.type) && inRegion(e)), [all, off, region]);
  const visibleRef = useRef(visible); visibleRef.current = visible;
  const counts = useMemo(() => { const c = {}; for (const e of all) if (inRegion(e)) c[e.type] = (c[e.type] || 0) + 1; return c; }, [all, region]);
  const feed = useMemo(() => (feedSort === 'top' ? [...visible].sort((a, b) => b.rank - a.rank || b.t - a.t) : visible).slice(0, 600), [visible, feedSort]);
  const threatBy = useMemo(() => Object.fromEntries((threat.data?.countries || []).map((c) => [c.country, c])), [threat.data]);

  // init globe
  useEffect(() => {
    if (!elRef.current || globeRef.current) return;
    const g = makeGlobe(elRef.current);
    g.pointOfView({ lat: 35, lng: 25, altitude: mobile ? 2.6 : 2.1 });
    g.particlesList((d) => d).particleLat('lat').particleLng('lon').particleAltitude(0.0022)
      .particlesColor((d) => d.color).particlesSize((d) => (mobile ? 3.2 : 2.6) + d.sev * 1.6).particlesSizeAttenuation(false)
      .particleLabel((d) => !d?.title ? '' : `<div class="g-tip"><b style="color:${typeOf(d.type).color}">${typeOf(d.type).label}</b><br/>${esc(d.title)}<br/><span>${esc(d.place || d.source)} · ${timeAgo(d.time)} ago</span></div>`)
      .onParticleClick((d, ev) => { const hits = pickAt(ev); if (hits.length || d?.lat != null) selectEvents(hits.length ? hits : [d]); })
      .ringLat('lat').ringLng('lon').ringColor((d) => (tt) => hexA(typeOf(d.type).color, (d.__sel ? 1 : 0.8) * (1 - tt))).ringMaxRadius((d) => (d.__sel ? 3.2 : 1.5 + d.severity)).ringPropagationSpeed((d) => (d.__sel ? 2.4 : 1.4)).ringRepeatPeriod((d) => (d.__sel ? 900 : 1600)).ringResolution(32)
      .labelLat('lat').labelLng('lon').labelText('name').labelSize(0.45).labelDotRadius(0.18).labelColor(() => 'rgba(200,220,235,0.55)').labelResolution(1).labelAltitude(0.004)
      .labelsData(mobile ? [] : STRAITS)
      .htmlLat('lat').htmlLng('lng').htmlAltitude(0.002).htmlElement((d) => { const el = document.createElement('div'); el.className = 'g-clabel'; el.textContent = d.name; return el; })
      .onGlobeClick(({ lat, lng }, ev) => {
        const hits = pickAt(ev); if (hits.length) return selectEvents(hits); // tap near a dot (generous radius on touch)
        if (selRef.current && selRef.current.kind !== 'country') return closeSel(); // empty globe closes an open event card
        const f = geoRef.current && countryAt(geoRef.current.features, lat, lng); if (f?.properties.iso) openCountry(f.properties.iso, f.properties.NAME); else closeSel();
      });
    import('three').then((T) => { THREE_ = T; g.particlesTexture((d) => dotTexture(d.color)); });
    g.controls().addEventListener('start', () => { g.controls().autoRotate = false; });
    globeRef.current = g; window.__globe = g;
  }, []);

  useEffect(() => {
    const g = globeRef.current; if (!g || !geo) return;
    const feats = geo.features;
    geoRef.current = geo;
    // zoom-dependent country labels (DOM, only a handful at a time) + hide strait labels when close
    let lvl = -1, mScale = 1, straits = null;
    g.__onAlt = (alt) => {
      // markers have a constant pixel size: shrink them when far out so the full-globe view doesn't turn into blobs
      const ms = Math.round(Math.min(1, Math.max(0.6, 2.4 / alt)) * 20) / 20;
      if (ms !== mScale) { mScale = ms; g.particlesSize((d) => ((mobile ? 3.2 : 2.6) + d.sev * 1.6) * ms); }
      // strait labels only at mid zoom (clutter up close, unreadable specks fully zoomed out); small hysteresis
      const s = !mobile && alt >= 0.6 && alt < (straits ? 2.6 : 2.4);
      if (s !== straits) { straits = s; g.labelsData(s ? STRAITS : []); }
      const T = [[1.1, 0], [0.6, 2], [0.3, 4], [0.15, 6], [-1, 10]]; const k = (a) => T.find(([th]) => a > th)[1];
      let L = k(alt); if (lvl >= 0 && L !== lvl && k(alt * (L > lvl ? 1.1 : 0.9)) === lvl) L = lvl; // 10% hysteresis
      if (L === lvl) return; lvl = L;
      g.htmlElementsData(L ? feats.filter((f) => f.properties.lr <= L).map((f) => ({ lat: f.properties.ly, lng: f.properties.lx, name: f.properties.NAME })) : []);
    };
    g.__onAlt(g.__alt ?? 2);
    // one merged land mesh; neutral land, subtle tint only for ELEVATED and above
    setLand(g, feats, (f) => { const s = threatBy[f.properties.iso]; if (!s || s.level === 'GUARDED' || s.level === 'LOW') return ['#9aaabd', 0.16]; return [LEVEL_COLOR[s.level], 0.10 + (s.index / 100) * 0.16]; });
  }, [geo, threatBy, mobile]);

  // point cloud: one Points object per (type, severity) set — throttled to data changes only
  useEffect(() => {
    const g = globeRef.current; if (!g) return;
    const sets = {};
    // each set IS the array of its events (with props attached): globe.gl resolves a hovered/clicked particle as
    // set[intersection.index], so with a plain {items} object the tooltip/click got `undefined` (tooltip never showed).
    for (const e of visible) { const k = e.type + ':' + e.severity; (sets[k] ||= Object.assign([], { key: k, type: e.type, sev: e.severity, color: typeOf(e.type).color })).push(e); }
    g.particlesData(Object.values(sets));
    const nowMs = Date.now();
    const rings = visible.filter((e) => e.severity >= 3 && nowMs - e.t < 3 * 3600e3 && e.id !== sel?.id).slice(0, mobile ? 12 : 30);
    if (sel && !sel.kind && sel.lat != null) rings.push({ ...sel, __sel: true }); // pulsing highlight on the selected dot
    g.ringsData(rings);
  }, [visible, sel]);
  useEffect(() => { const k = (e) => e.key === 'Escape' && closeSel(); window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, []);

  useEffect(() => {
    const g = globeRef.current; if (!g || !meta) return;
    if (region === 'global') g.pointOfView({ lat: 30, lng: 20, altitude: mobile ? 2.6 : 2.2 }, 1000);
    else { const r = meta.regions[region]; g.pointOfView({ lat: r.center[0] - (mobile ? 8 : 0), lng: r.center[1], altitude: r.alt + (mobile ? 0.5 : 0) }, 1000); g.controls().autoRotate = false; }
  }, [region, meta]);
  useEffect(() => setActive(globeRef.current, active), [active]);

  // Screen-space hit test: every visible event on the camera-facing hemisphere within a few px of the click.
  // Catches overlapping dots (returned nearest first) and makes small dots easy to tap on phones.
  function pickAt(ev) {
    const g = globeRef.current; if (!g || !ev || ev.clientX == null) return [];
    const box = elRef.current.getBoundingClientRect(); const x = ev.clientX - box.left, y = ev.clientY - box.top;
    const c = g.camera().position, R = g.getGlobeRadius(), rad = mobile ? 20 : 11;
    const hits = [];
    for (const e of visibleRef.current) {
      if (e.lat == null || e.lon == null) continue;
      const p = g.getCoords(e.lat, e.lon, 0); if (p.x * c.x + p.y * c.y + p.z * c.z <= R * R) continue; // behind the horizon
      const s = g.getScreenCoords(e.lat, e.lon, 0); const d = Math.hypot(s.x - x, s.y - y);
      if (d <= rad) hits.push([d, e]);
    }
    hits.sort((a, b) => (Math.abs(a[0] - b[0]) >= 1 ? a[0] - b[0] : b[1].rank - a[1].rank)); // nearest; exactly stacked dots -> most significant first
    const [first, ...rest] = hits.map((h) => h[1]);
    return first ? [first, ...rest.sort((a, b) => b.rank - a.rank || b.t - a.t).slice(0, 49)] : [];
  }
  function selectEvents(list) {
    const e = list[0]; setSel(e); setNear(list); const g = globeRef.current; g.controls().autoRotate = false;
    const alt = g.pointOfView().altitude; // centre the dot without changing zoom; on phones keep it above the bottom sheet
    g.pointOfView({ lat: e.lat - (mobile ? Math.min(28, alt * 9) : 0), lng: e.lon, altitude: alt }, 700);
    if (mobile) sheetRef.current?.snapTo(1);
  }
  function closeSel() { setSel(null); setNear([]); }
  function flyTo(e) {
    setSel(e); setNear([]); const g = globeRef.current; g.controls().autoRotate = false;
    g.pointOfView({ lat: e.lat - (mobile ? 6 : 0), lng: e.lon, altitude: mobile ? 0.9 : 0.6 }, 900);
    if (mobile) sheetRef.current?.snapTo(1);
  }
  function openCountry(iso, name) { if (!iso) return; setSel({ kind: 'country', iso, name }); setNear([]); if (mobile) sheetRef.current?.snapTo(1); }

  const ytList = (yt.data?.channels || []).filter((c) => c.category === 'news' || c.listedVia === 'curated');
  const regionCountries = region !== 'global' && meta ? meta.regions[region].countries : null;
  const regionalCh = regionCountries ? ytList.filter((c) => regionCountries.includes(c.country)) : [];
  const defaultCh = regionalCh[0] || ytList.find((c) => c.name === 'DW News') || ytList[0];
  const curCh = ytList.find((c) => c.channelId === liveCh) || defaultCh;
  const reg = threat.data?.regions;
  const topCountries = (threat.data?.countries || []).filter((c) => !regionCountries || regionCountries.includes(c.country)).slice(0, 15);
  const gl = region !== 'global' && reg ? reg[region] : null;
  const indexVal = gl ? gl.index : threat.data?.global;
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  const layerList = (
    <div className="layers">
      {Object.entries(TYPES).filter(([k]) => counts[k] || MAIN_LAYERS.includes(k)).map(([k, v]) => (
        <button key={k} className={'layer' + (off.has(k) ? ' off' : '')} onClick={() => { const n = new Set(off); n.has(k) ? n.delete(k) : n.add(k); setOff(n); }}>
          <i style={{ background: v.color }} /><span>{lang === 'sq' ? v.sq : v.label}</span><b className="num">{counts[k] || 0}</b>
        </button>
      ))}
      <div className="btn-row"><button className="ghost" onClick={() => setOff(new Set())}>{t('ALL')}</button><button className="ghost" onClick={() => setOff(new Set(Object.keys(TYPES)))}>{t('NONE')}</button></div>
    </div>
  );
  const feedRow = (e) => (
    <div className={'feed-item' + (sel?.id === e.id ? ' on' : '')} onClick={() => flyTo(e)}>
      <i className="f-dot" style={{ background: typeOf(e.type).color }} />
      <div className="f-body"><div className="f-title">{e.title}</div><div className="f-meta">{flag(e.country)} {e.place || e.country || '—'} · {e.source}</div></div>
      <span className="f-ago num">{timeAgo(e.t, now)}</span>
    </div>
  );
  const feedList = <VirtualList className="feed" items={feed} rowHeight={62} render={feedRow} empty={<div className="muted pad">{ev.loading ? 'Loading sources…' : 'No events match the current filters.'}</div>} />;
  const sortTabs = <span className="seg-mini"><button className={feedSort === 'latest' ? 'on' : ''} onClick={() => setFeedSort('latest')}>Latest</button><button className={feedSort === 'top' ? 'on' : ''} onClick={() => setFeedSort('top')}>Top</button></span>;
  const threatBody = (
    <>
      <div className="gauge-row">
        <div className="gauge" style={{ '--v': indexVal || 0, '--c': LEVEL_COLOR[lvl(indexVal)] }}><b className="num">{indexVal ?? '–'}</b></div>
        <div><div className="g-scope">{gl ? gl.name : 'Global'} · 24h</div><div className="g-level" style={{ color: LEVEL_COLOR[lvl(indexVal)] }}>{lvl(indexVal)}</div><div className="muted tiny">GDELT CAMEO reporting volume + GDACS alerts. Not casualties.</div></div>
      </div>
      <div className="seg-mini wide"><button className={threatTab === 'regions' ? 'on' : ''} onClick={() => setThreatTab('regions')}>{t('Regions')}</button><button className={threatTab === 'countries' ? 'on' : ''} onClick={() => setThreatTab('countries')}>{t('Hotspots')}</button><button className={threatTab === 'trend' ? 'on' : ''} onClick={() => setThreatTab('trend')}>7-day trend</button></div>
      {threatTab === 'regions' && reg && Object.values(reg).sort((a, b) => b.index - a.index).map((r) => (
        <div key={r.id} className={'region-row' + (region === r.id ? ' on' : '')} onClick={() => setRegion(region === r.id ? 'global' : r.id)}>
          <span className="r-name">{r.name}</span><span className="bar"><i style={{ transform: `scaleX(${r.index / 100})`, background: LEVEL_COLOR[r.level] }} /></span><b className="num" style={{ color: LEVEL_COLOR[r.level] }}>{r.index}</b>
        </div>))}
      {threatTab === 'countries' && topCountries.map((c) => (
        <div key={c.country} className="hot-row" onClick={() => openCountry(c.country, c.name)}>
          <span className="h-name">{flag(c.country)} {c.name}</span><Spark data={c.hourly} color={LEVEL_COLOR[c.level]} /><span className="h-lvl num" style={{ color: LEVEL_COLOR[c.level] }}>{c.index}</span>
        </div>))}
      {threatTab === 'trend' && <Outlook data={risk.data} region={region} regionCountries={regionCountries} compact onPick={(c) => openCountry(c.country, c.name)} />}
    </>
  );
  const live = (
    <>
      <select className="mini-select" value={curCh?.channelId || ''} onChange={(e) => setLiveCh(e.target.value)}>{ytList.map((c) => <option key={c.channelId} value={c.channelId}>{flag(c.country)} {c.name}</option>)}</select>
      {active && curCh ? <YtEmbed channelId={curCh.channelId} title={curCh.name} /> : <div className="player-frame"><div className="player-msg">No channel</div></div>}
      {curCh && <div className="cap">{curCh.name} · <a href={curCh.sourceUrl} target="_blank" rel="noreferrer">official channel ↗</a></div>}
    </>
  );
  const detail = sel && <Detail sel={sel} setSel={closeSel} near={near} pick={setSel} threatBy={threatBy} risk={risk.data} all={all} now={now} flyTo={flyTo} t={t} />;

  return (
    <div className={'globe-view' + (mobile ? ' m' : '')}>
      <div className="globe-canvas" ref={elRef} />

      <div className="chips">
        <div className="seg-mini glass">{WINDOWS.map((h) => <button key={h} className={hours === h ? 'on' : ''} onClick={() => setHours(h)}>{h}h</button>)}</div>
        <div className="chip glass num">{visible.length} <span className="muted">{t('events')}</span></div>
        {mobile && <button className="chip glass" onClick={() => setLayersOpen((v) => !v)}>Layers{off.size ? ` · ${off.size} off` : ''}</button>}
        <button className="chip glass icon" title="Auto-rotate" onClick={() => { const c = globeRef.current.controls(); c.autoRotate = !c.autoRotate; }}>⟳</button>
      </div>
      {mobile && <div className={'layers-pop glass' + (layersOpen ? ' open' : '')}>{layerList}</div>}

      {!mobile && <>
        <button className={'col-toggle l' + (cols.l ? '' : ' closed')} onClick={() => setCols({ ...cols, l: !cols.l })} title="Toggle left panel">{cols.l ? '‹' : '›'}</button>
        <button className={'col-toggle r' + (cols.r ? '' : ' closed')} onClick={() => setCols({ ...cols, r: !cols.r })} title="Toggle right panel">{cols.r ? '›' : '‹'}</button>
        <div className={'col left' + (cols.l ? '' : ' hidden')}>
          <Panel title={t('Layers')} right={<span className="muted num">{total}</span>}>{layerList}</Panel>
          <Panel title={t('Live stream')} className="live-panel">{live}</Panel>
          <Panel title={t('System status')} className="status-panel" defaultOpen={false}><StatusList status={status} compact /></Panel>
        </div>
        <div className={'col right' + (cols.r ? '' : ' hidden')}>
          <Panel title={t('Threat index')} className="threat-panel">{threatBody}</Panel>
          <Panel title={(region !== 'global' && meta ? meta.regions[region].name + ' · ' : '') + t('Live feed')} className="feed-panel" right={<>{sortTabs}<span className="muted num">{feed.length}</span></>}>{feedList}</Panel>
        </div>
        {detail && <div className="card">{detail}</div>}
        <div className="bottom-bar"><span><i className="dot" /> {ev.updatedAt ? ev.updatedAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '—'} CET</span><span>GDELT {ev.gdeltUpdated ? timeAgo(ev.gdeltUpdated, now) + ' ago' : '—'}</span><span>USGS · EONET · GDACS · NWS · GDELT</span></div>
      </>}

      {mobile && (
        <Sheet ref={sheetRef} snaps={[0.2, 0.52, 0.9]} initial={0} header={
          sel ? <div className="sheet-title"><button className="ghost back" onClick={closeSel}>‹ Back</button></div> :
          <div className="seg-mini wide">{[['feed', t('Live feed')], ['threat', t('Threat')], ['live', 'Live TV'], ['status', 'Status']].map(([k, l]) => <button key={k} className={sheetTab === k ? 'on' : ''} onClick={() => { setSheetTab(k); if (sheetRef.current?.index === 0) sheetRef.current.snapTo(1); }}>{l}</button>)}</div>}>
          {sel ? <div className="pad scroll">{detail}</div> : <>
            {sheetTab === 'feed' && <><div className="sheet-sub">{sortTabs}<span className="muted num">{feed.length} {t('events')}</span></div>{feedList}</>}
            {sheetTab === 'threat' && <div className="pad scroll">{threatBody}</div>}
            {sheetTab === 'live' && <div className="pad">{live}</div>}
            {sheetTab === 'status' && <div className="pad scroll"><StatusList status={status} compact /></div>}
          </>}
        </Sheet>
      )}
    </div>
  );
}

function Detail({ sel, setSel, near = [], pick, threatBy, risk, all, now, flyTo, t }) {
  if (sel.kind === 'country') {
    const s = threatBy[sel.iso]; const r = risk?.countries?.find((c) => c.country === sel.iso);
    const evs = all.filter((e) => e.country === sel.iso).slice(0, 8);
    return (<div className="detail">
      <button className="x" onClick={() => setSel(null)}>×</button>
      <div className="card-type">{flag(sel.iso)} Country</div>
      <div className="card-title">{sel.name}</div>
      {s ? <><div className="kv"><span>Threat index</span><b style={{ color: LEVEL_COLOR[s.level] }} className="num">{s.index}/100 · {s.level}</b></div>
        <div className="kv"><span>24h coded</span><b>{s.conflict} fighting · {s.attack} attacks · {s.military} military · {s.protest} protests{s.disaster ? ` · ${s.disaster} GDACS` : ''}</b></div>
        <Spark data={s.hourly} color={LEVEL_COLOR[s.level]} w={300} h={36} /></> : <div className="muted">No CAMEO-coded conflict reporting in the last 24 h.</div>}
      {r && <div className="kv"><span>7-day trend</span><b className={'trend ' + r.trend}>{r.trend === 'rising' ? '↗ Rising' : r.trend === 'falling' ? '↘ Falling' : '→ Stable'} <span className="muted num">({r.change > 0 ? '+' : ''}{r.change}%)</span> <span className="muted tiny">statistical, not a forecast</span></b></div>}
      <div className="mini-feed">{evs.map((e) => <div key={e.id} className="feed-item" onClick={() => flyTo(e)}><i className="f-dot" style={{ background: typeOf(e.type).color }} /><div className="f-body"><div className="f-title">{e.title}</div></div><span className="f-ago num">{timeAgo(e.t, now)}</span></div>)}</div>
    </div>);
  }
  return <EventCard e={sel} near={near} pick={pick} close={setSel} now={now} t={t} />;
}
const SEV = ['', 'Low', 'Moderate', 'High', 'Severe'];
const ALERT = { green: '#39d98a', orange: '#ff9f43', red: '#ff4d57' };
let regionNames; const countryName = (cc) => { try { return cc ? (regionNames ||= new Intl.DisplayNames(['en'], { type: 'region' })).of(cc) : null; } catch { return cc; } };
// Info card for any globe dot / feed item: shows only the fields the source actually provides (no blank rows).
function EventCard({ e, near, pick, close, now, t }) {
  const ty = typeOf(e.type); const cn = countryName(e.country);
  const place = e.place || cn; const showCountry = cn && e.place && !e.place.toLowerCase().includes(cn.toLowerCase());
  // description = the source's detail line minus parts already shown (alert badge, country, text in the title)
  const desc = (e.detail || '').split(' · ').filter((x) => x && !/ alert$/i.test(x) && x !== cn && !(e.mag != null && /^M\s?\d/.test(x)) && !(e.depthKm != null && /^depth /i.test(x)) && !e.title.toLowerCase().includes(x.toLowerCase())).join(' · ') || null;
  const metrics = [
    e.mag != null && ['Magnitude', 'M' + Number(e.mag).toFixed(1)],
    e.depthKm != null && ['Depth', Math.round(e.depthKm) + ' km'],
    e.severity != null && ['Severity', SEV[e.severity] || e.severity],
    e.numSources != null && ['Sources', e.numSources],
    e.numArticles != null && ['Articles', e.numArticles],
    e.goldstein != null && ['Goldstein', e.goldstein],
  ].filter(Boolean);
  const others = near.length > 1 ? near : [];
  const ref = useRef(null);
  useEffect(() => { ref.current?.closest('.card, .scroll')?.scrollTo(0, 0); }, [e.id]); // switching within a stack -> back to top
  return (<div className="detail ev-card" ref={ref}>
    <button className="x" onClick={close} aria-label="Close">×</button>
    <div className="ev-head">
      <span className="ev-badge" style={{ '--c': ty.color }}><i>{ty.icon}</i>{ty.label}</span>
      {e.alert && <span className="ev-alert" style={{ '--c': ALERT[e.alert.toLowerCase()] || '#9aa7b4' }}>{e.alert} alert</span>}
    </div>
    <div className="card-title">{e.title}</div>
    {desc && <div className="ev-desc">{desc}</div>}
    {metrics.length > 0 && <div className="ev-metrics">{metrics.map(([k, v]) => <div key={k}><span>{k}</span><b className="num">{v}</b></div>)}</div>}
    {!place && e.lat != null && <div className="kv"><span>Location</span><b className="num">{e.lat.toFixed(2)}, {e.lon.toFixed(2)}</b></div>}
    {place && <div className="kv"><span>Location</span><b>{flag(e.country)} {place}{showCountry ? ` · ${cn}` : ''}{e.precision === 'country' && <span className="muted tiny"> (approximate)</span>}<br /><span className="muted num tiny">{e.lat?.toFixed(2)}, {e.lon?.toFixed(2)}</span></b></div>}
    {e.time && <div className="kv"><span>Time</span><b>{timeAgo(e.time, now) === 'now' ? 'just now' : timeAgo(e.time, now) + ' ago'}<br /><span className="muted tiny">{fmtTime(e.time)} · Kosovo time</span></b></div>}
    {e.source && <div className="kv"><span>Source</span><b>{e.source}</b></div>}
    {e.cameo && <div className="kv"><span>Coding</span><b className="num">CAMEO {e.cameo}{e.tone != null ? ` · tone ${Number(e.tone).toFixed(1)}` : ''}</b></div>}
    {e.url && <a className="src-btn" href={e.url} target="_blank" rel="noreferrer">{t('Open source')} ↗</a>}
    {e.source === 'GDELT 2.0' && <div className="muted tiny">Machine-coded from news reporting; may be misclassified. Verify in the linked article.</div>}
    {others.length > 0 && <div className="ev-near">
      <div className="ev-near-h">{others.length} events at this spot</div>
      {others.slice(0, 20).map((o) => <div key={o.id} className={'feed-item' + (o.id === e.id ? ' on' : '')} onClick={() => pick(o)}><i className="f-dot" style={{ background: typeOf(o.type).color }} /><div className="f-body"><div className="f-title">{o.title}</div><div className="f-meta">{typeOf(o.type).label} · {o.source}</div></div><span className="f-ago num">{timeAgo(o.t ?? o.time, now)}</span></div>)}
      {others.length > 20 && <div className="muted tiny">+{others.length - 20} more — zoom in to separate them</div>}
    </div>}
  </div>);
}
const lvl = (v) => (v == null ? 'GUARDED' : v >= 75 ? 'CRITICAL' : v >= 50 ? 'HIGH' : v >= 25 ? 'ELEVATED' : 'GUARDED');
export function hexA(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; }
function esc(s) { return String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
