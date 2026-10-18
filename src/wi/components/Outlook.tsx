// @ts-nocheck
import React, { useMemo, useState } from 'react';
import { flag } from '../api';
import VirtualList from '../ui/VirtualList';

export function Spark({ data = [], color = '#7cc4ff', w = 96, h = 22 }) {
  const max = Math.max(1, ...data);
  const pts = data.map((v, i) => `${((i / Math.max(1, data.length - 1)) * w).toFixed(1)},${(h - (v / max) * (h - 2) - 1).toFixed(1)}`).join(' ');
  return <svg className="spark" width={w} height={h} viewBox={`0 0 ${w} ${h}`}><polyline points={pts} fill="none" stroke={color} strokeWidth="1.4" strokeLinejoin="round" /></svg>;
}
const TREND = { rising: ['↗', 'Rising', '#ff8a5c'], falling: ['↘', 'Falling', '#5ad19a'], stable: ['→', 'Stable', '#8b95a3'] };

/** Statistical 7-day risk outlook (GDELT trend). Labelled as statistics, never as a forecast. */
export function Outlook({ data, regionCountries, compact, onPick }) {
  const [filter, setFilter] = useState('rising');
  const rows = useMemo(() => {
    let r = (data?.countries || []).filter((c) => !regionCountries || regionCountries.includes(c.country));
    if (filter !== 'all') r = r.filter((c) => c.trend === filter);
    return r.sort((a, b) => (filter === 'falling' ? a.change - b.change : filter === 'rising' ? b.change - a.change : b.total - a.total));
  }, [data, regionCountries, filter]);
  if (!data || data.pending) return <div className="muted pad">Building 7-day statistics from GDELT daily exports… (first run downloads ~30 MB, then cached)</div>;
  const row = (c) => { const [ic, lb, col] = TREND[c.trend]; return (
    <div className="out-row" onClick={() => onPick?.(c)}>
      <span className="o-name">{flag(c.country)} {c.name}</span>
      <Spark data={c.series} color={col} w={compact ? 64 : 96} />
      <span className="o-trend num" style={{ color: col }}>{ic} {c.change > 0 ? '+' : ''}{c.change}%</span>
      {!compact && <span className="o-meta muted num">{c.total} · {c.gdacsAlerts ? `${c.gdacsAlerts} GDACS` : ''}</span>}
    </div>); };
  return (
    <div className="outlook">
      <div className="seg-mini wide">{['rising', 'stable', 'falling', 'all'].map((k) => <button key={k} className={filter === k ? 'on' : ''} onClick={() => setFilter(k)}>{k[0].toUpperCase() + k.slice(1)}</button>)}</div>
      {compact ? rows.slice(0, 12).map((c) => <React.Fragment key={c.country}>{row(c)}</React.Fragment>) :
        <VirtualList className="out-list" items={rows.map((c) => ({ ...c, id: c.country }))} rowHeight={44} render={row} empty={<div className="muted pad">No countries in this group.</div>} />}
      <div className="muted tiny note">Statistical description of the last 7 days of CAMEO-coded conflict reporting (GDELT) — last 3 days vs prior 4, slope-confirmed. <b>Not a forecast.</b> {data.days?.length ? `Days: ${data.days[0]}–${data.days[data.days.length - 1]} UTC.` : ''}</div>
    </div>
  );
}
