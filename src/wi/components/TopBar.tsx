// @ts-nocheck
import React from 'react';
import { useNow } from '../api';
import { useT } from '../i18n';
import { TAB_LABELS } from './TabBar';

const CLOCKS = [['UTC', 'UTC'], ['Prishtina', 'Europe/Belgrade'], ['New York', 'America/New_York'], ['Tokyo', 'Asia/Tokyo']];
const fmt = (now, tz) => new Date(now).toLocaleTimeString('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit' });

export default function TopBar({ tab, setTab, region, setRegion, regions, lang, setLang, status, mobile }) {
  const now = useNow(15000);
  const t = useT();
  const srcs = (status?.sources || []).filter((s) => s.state !== 'disabled');
  const ok = srcs.filter((s) => s.state === 'ok').length;
  const bad = srcs.filter((s) => s.state === 'down').length;
  return (
    <header className="topbar">
      <div className="brand"><span className="brand-mark" />World Intel</div>
      {!mobile && <nav className="tabs">{TAB_LABELS.map(([id, label]) => <button key={id} className={'tab' + (tab === id ? ' active' : '')} onClick={() => setTab(id)}>{t(label)}</button>)}</nav>}
      <div className="top-right">
        <select className="region-select" value={region} onChange={(e) => setRegion(e.target.value)} title={t('Region')}>
          <option value="global">{t('Global')}</option>
          {regions && Object.entries(regions).map(([id, r]) => <option key={id} value={id}>{r.name}</option>)}
        </select>
        {!mobile && <div className="clocks">{CLOCKS.map(([n, tz]) => <div key={n} className="clock"><span>{n}</span><b className="num">{fmt(now, tz)}</b></div>)}</div>}
        <div className={'sys-pill ' + (bad ? 'red' : 'green')} title="Sources OK / total"><i className="dot" /><span className="num">{ok}/{srcs.length}</span></div>
        <button className="lang ghost" onClick={() => setLang(lang === 'en' ? 'sq' : 'en')}>{lang === 'en' ? 'EN' : 'SQ'}</button>
      </div>
    </header>
  );
}
