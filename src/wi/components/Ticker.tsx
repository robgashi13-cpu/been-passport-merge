// @ts-nocheck
import React, { useMemo } from 'react';
import { usePoll, timeAgo } from '../api';

export default function Ticker() {
  const news = usePoll('/api/news?scope=world', 300e3);
  const q = usePoll('/api/quakes', 120e3);
  const g = usePoll('/api/gdacs', 120e3);
  const items = useMemo(() => {
    const out = [];
    for (const e of (q.data?.items || []).filter((x) => x.mag >= 5).slice(0, 6)) out.push({ tag: 'QUAKE', cls: 'cy', text: e.title, url: e.url, time: e.time });
    for (const e of (g.data?.items || []).filter((x) => x.severity >= 2).slice(0, 6)) out.push({ tag: 'GDACS ' + e.alert?.toUpperCase(), cls: e.severity === 3 ? 'rd' : 'am', text: e.title, url: e.url, time: e.time });
    for (const n of (news.data?.items || []).slice(0, 24)) out.push({ tag: n.source?.toUpperCase(), cls: 'gr', text: n.title, url: n.url, time: n.time });
    return out.sort((a, b) => b.time.localeCompare(a.time));
  }, [news.data, q.data, g.data]);
  if (!items.length) return <div className="ticker"><span className="ticker-label">● LIVE WIRE</span><span className="muted">connecting to sources…</span></div>;
  const row = items.map((i, k) => (
    <a key={k} className="tick" href={i.url} target="_blank" rel="noreferrer"><b className={i.cls}>{i.tag}</b> {i.text} <em>{timeAgo(i.time)} ago</em><span className="sep">◆</span></a>
  ));
  return (
    <div className="ticker">
      <span className="ticker-label">● LIVE WIRE</span>
      <div className="ticker-track" style={{ animationDuration: `${Math.max(60, items.length * 7)}s` }}>{row}{row}</div>
    </div>
  );
}
