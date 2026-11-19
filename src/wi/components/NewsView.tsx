// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { usePoll, timeAgo, fmtTime, flag, useNow, useMobile } from '../api';
import { useT } from '../i18n';

function Column({ title, data, loading, now, extra }) {
  return (
    <section className="news-col">
      <header className="news-h"><span className="pdot live" /> {title} {extra}<span className="muted right">{data?.items?.length || 0}</span></header>
      <div className="news-list">
        {(data?.items || []).map((n) => (
          <a key={n.url} className="news-item" href={n.url} target="_blank" rel="noreferrer">
            <div className="n-meta"><b className={'via ' + (n.via === 'X API' ? 'x' : n.via === 'RSS' ? 'rss' : 'gd')}>{n.via}</b> <span className="n-src">{n.source}</span><span className="n-ago" title={fmtTime(n.time)}>{timeAgo(n.time, now)} ago</span></div>
            <div className="n-title">{n.title}</div>
            {n.summary && <div className="n-sum">{n.summary}</div>}
          </a>
        ))}
        {loading && !data && <div className="muted pad">Loading…</div>}
        {data && !data.items.length && <div className="muted pad">No items returned by the sources right now.{data.errors?.length ? ' Errors: ' + data.errors.join('; ') : ''}</div>}
      </div>
    </section>
  );
}

export default function NewsView({ meta, region }) {
  const t = useT();
  const mobile = useMobile();
  const [mtab, setMtab] = useState('world');
  const now = useNow(30000);
  const scopes = meta?.newsScopes || {};
  const regionCountries = region !== 'global' && meta ? meta.regions[region].countries : null;
  const opts = Object.entries(scopes).filter(([k]) => k !== 'world' && (!regionCountries || regionCountries.includes(k)));
  const [cc, setCc] = useState(() => localStorage.getItem('newsCountry') || 'XK');
  useEffect(() => { localStorage.setItem('newsCountry', cc); }, [cc]);
  useEffect(() => { if (opts.length && !opts.find(([k]) => k === cc)) setCc(opts[0][0]); }, [region]);
  const ms = (meta?.newsRefreshSec || 300) * 1000;
  const world = usePoll('/api/news?scope=world', ms);
  const local = usePoll(`/api/news?scope=${cc}`, ms);
  const kev = usePoll('/api/kev', 3600e3);
  const gd = usePoll('/api/gdacs', 120e3);
  const alerts = { items: (gd.data?.items || []).filter((x) => x.severity >= 2).sort((a, b) => b.time.localeCompare(a.time)).map((x) => ({ ...x, via: 'GDACS', source: x.alert + ' alert' })) };
  return (
    <div className="news-view">
      {mobile && <div className="pad" style={{ paddingTop: 0, paddingBottom: 8 }}><div className="seg-mini wide">{[['world', t('World')], ['local', cc === 'XK' ? 'Kosovo' : (scopes[cc]?.name || cc)], ['alerts', 'Alerts'], ['cyber', 'Cyber']].map(([k, l]) => <button key={k} className={mtab === k ? 'on' : ''} onClick={() => setMtab(k)}>{l}</button>)}</div></div>}
      <div className="news-cols">
        {(!mobile || mtab === 'world') && <Column title={'\uD83C\uDF10 ' + t('World')} data={world.data} loading={world.loading} now={now} />}
        {(!mobile || mtab === 'local') && <Column title={<>{flag(cc)} <select value={cc} onChange={(e) => setCc(e.target.value)} className="inline-select">{opts.map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}</select></>} data={local.data} loading={local.loading} now={now} />}
        {(!mobile || mtab === 'alerts' || mtab === 'cyber') && <div className="news-stack" style={mobile ? { display: 'block' } : null}>
          {(!mobile || mtab === 'alerts') && <Column title={'\u26A0 ' + t('DISASTER ALERTS') + ' (GDACS)'} data={alerts} now={now} />}
          {(!mobile || mtab === 'cyber') && <Column title={'\u2301 ' + t('CYBER \u00B7 KEV')} data={kev.data && { items: kev.data.items.map((k) => ({ ...k, via: 'CISA', summary: k.detail })) }} now={now} />}
        </div>}
      </div>
    </div>
  );
}
