// @ts-nocheck
import React, { useEffect, useMemo, useState } from 'react';
import { usePoll, timeAgo, useNow } from '../api';
import { Outlook } from './Outlook';
import VirtualList from '../ui/VirtualList';

// Polymarket public Gamma API. The server proxies + caches it; if the server's region is geo-blocked (HTTP 451)
// the browser fetches the same public endpoint directly (read-only odds, no account, no trading).
const BAD = /(sports|nba|nfl|soccer|crypto|bitcoin|ethereum|mention|tweet|box office|oscars|grammy|weather|temperature)/i;
function normalize(lists) {
  const seen = new Set(), out = [];
  for (const [tag, events] of lists) for (const ev of events || []) {
    if (!ev || ev.closed || seen.has(ev.id) || BAD.test(ev.title)) continue; seen.add(ev.id);
    const markets = (ev.markets || []).filter((m) => m.active && !m.closed && m.outcomePrices).map((m) => { let p = [], o = []; try { p = JSON.parse(m.outcomePrices).map(Number); o = JSON.parse(m.outcomes); } catch {} return { id: m.id, question: m.question, label: m.groupItemTitle || o[0] || 'Yes', yes: p[0], change24h: m.oneDayPriceChange ?? null, volume24h: m.volume24hr || 0 }; }).filter((m) => Number.isFinite(m.yes)).sort((a, b) => b.volume24h - a.volume24h);
    if (markets.length) out.push({ id: ev.id, title: ev.title, url: `https://polymarket.com/event/${ev.slug}`, tag, volume24h: ev.volume24hr || 0, markets: markets.slice(0, 6) });
  }
  return out.sort((a, b) => b.volume24h - a.volume24h).slice(0, 60);
}
const TAGS = { all: 'All', geopolitics: 'Geopolitics', world: 'World', politics: 'Politics', elections: 'Elections' };

export default function PredictionsView({ meta, region }) {
  const now = useNow(60000);
  const srv = usePoll('/api/predictions', 180e3);
  const risk = usePoll('/api/risk', 1800e3);
  const mf = usePoll('/api/predictions/manifold', 300e3);
  const [src, setSrc] = useState('polymarket');
  const [client, setClient] = useState(null);
  const [tag, setTag] = useState('all');
  const [q, setQ] = useState('');
  const [tab, setTab] = useState('markets');
  useEffect(() => {
    if (!srv.data?.blocked || client) return;
    let dead = false;
    Promise.all(srv.data.clientUrls.map(([t, u]) => fetch(u).then((r) => (r.ok ? r.json() : [])).then((d) => [t, d]).catch(() => [t, []])))
      .then((lists) => !dead && setClient({ events: normalize(lists), via: 'browser', updated: new Date().toISOString(), failed: lists.every(([, d]) => !d.length) }));
    return () => { dead = true; };
  }, [srv.data]);
  const pmData = srv.data?.blocked ? client : srv.data;
  const pmEmpty = pmData && !pmData.events?.length;
  useEffect(() => { if (pmEmpty && mf.data?.events?.length && src === 'polymarket') setSrc('manifold'); }, [pmEmpty, mf.data]);
  const data = src === 'manifold' ? mf.data : pmData;
  const ql = q.trim().toLowerCase();
  const events = useMemo(() => (data?.events || []).filter((e) => (tag === 'all' || e.tag === tag) && (!ql || e.title.toLowerCase().includes(ql))), [data, tag, ql]);
  const regionCountries = region !== 'global' && meta ? meta.regions[region].countries : null;
  const row = (e) => (
    <a className="pm-card" href={e.url} target="_blank" rel="noreferrer">
      <div className="pm-title">{e.title}</div>
      {e.markets.slice(0, 3).map((m) => (
        <div key={m.id} className="pm-row">
          <span className="pm-label">{m.label}</span>
          <span className="pm-bar"><i style={{ transform: `scaleX(${m.yes})` }} /></span>
          <b className="num">{Math.round(m.yes * 100)}%</b>
          <span className={'num pm-ch ' + (m.change24h > 0 ? 'up' : m.change24h < 0 ? 'down' : '')}>{m.change24h == null ? '' : `${m.change24h > 0 ? '+' : ''}${Math.round(m.change24h * 100)}`}</span>
        </div>))}
      <div className="pm-meta muted num">{TAGS[e.tag]} · {e.bettors != null ? `${e.bettors} forecasters · Manifold (play money) ↗` : `$${fmtK(e.volume24h)} 24h vol${e.markets.length > 3 ? ` · +${e.markets.length - 3} more` : ''} · Polymarket ↗`}</div>
    </a>
  );
  return (
    <div className="pred-view">
      <div className="pred-head">
        <div className="seg-mini wide"><button className={tab === 'markets' ? 'on' : ''} onClick={() => setTab('markets')}>Markets</button><button className={tab === 'outlook' ? 'on' : ''} onClick={() => setTab('outlook')}>Risk outlook</button></div>
      </div>
      {tab === 'markets' ? <>
        <div className="pred-controls">
          <div className="seg-mini"><button className={src === 'polymarket' ? 'on' : ''} onClick={() => setSrc('polymarket')}>Polymarket</button><button className={src === 'manifold' ? 'on' : ''} onClick={() => setSrc('manifold')}>Manifold</button></div>
          <div className="seg-mini scroll-x">{Object.entries(TAGS).map(([k, v]) => <button key={k} className={tag === k ? 'on' : ''} onClick={() => setTag(k)}>{v}</button>)}</div>
          <input className="search" placeholder="Search markets" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="muted tiny note">{src === 'polymarket' ? <>Crowd-priced odds from Polymarket (public Gamma API, read-only). % = implied probability of “Yes”; ± = 24h change in points. {pmData?.via === 'browser' ? 'Loaded by your browser (server region is geo-blocked by Polymarket). ' : ''}{pmEmpty ? 'Polymarket is not reachable from this network right now. ' : ''}</> : <>Community forecasts from Manifold Markets (public API, play-money). % = current probability. </>}Not advice, not our forecast.{data?.updated ? ` Updated ${timeAgo(data.updated, now)} ago.` : ''}</div>
        <VirtualList className="pm-list" items={events} rowHeight={src === 'manifold' ? 124 : 164} render={row}
          empty={<div className="muted pad">{src === 'manifold' ? (mf.loading ? 'Loading forecasts…' : 'No matching markets.') : srv.loading || (srv.data?.blocked && !client) ? 'Loading markets…' : client?.failed ? 'Polymarket is not reachable from this network/region — switch to Manifold.' : 'No matching markets.'}</div>} />
      </> : <div className="pred-outlook"><Outlook data={risk.data} regionCountries={regionCountries} /></div>}
    </div>
  );
}
const fmtK = (n) => (n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? Math.round(n / 1e3) + 'k' : Math.round(n));
