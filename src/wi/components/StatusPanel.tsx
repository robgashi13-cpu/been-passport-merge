// @ts-nocheck
import React from 'react';
import { timeAgo } from '../api';
const C = { ok: 'green', degraded: 'amber', down: 'red', pending: 'amber', disabled: 'grey' };
export default function StatusList({ status, compact }) {
  const srcs = (status?.sources || []).filter((s) => !s.id.startsWith('rss:') || !compact);
  const rss = (status?.sources || []).filter((s) => s.id.startsWith('rss:'));
  const rssOk = rss.filter((s) => s.state === 'ok').length;
  return (
    <div className="status-list">
      {srcs.filter((s) => !s.id.startsWith('rss:')).map((s) => (
        <div key={s.id} className="status-row" title={s.error || ''}>
          <i className={'lamp ' + (C[s.state] || 'grey')} />
          <span className="s-name">{s.label || s.id}</span>
          <span className="s-meta">{s.state === 'disabled' ? 'NO KEY' : s.state === 'ok' ? `${s.count ?? ''} · ${timeAgo(s.lastOk)}` : (s.state || '').toUpperCase()}</span>
        </div>
      ))}
      {rss.length > 0 && <div className="status-row" title={rss.filter((s) => s.state !== 'ok').map((s) => s.id + ': ' + s.error).join('\n')}>
        <i className={'lamp ' + (rssOk === rss.length ? 'green' : rssOk ? 'amber' : 'red')} />
        <span className="s-name">RSS feeds</span><span className="s-meta">{rssOk}/{rss.length} OK</span></div>}
    </div>
  );
}
