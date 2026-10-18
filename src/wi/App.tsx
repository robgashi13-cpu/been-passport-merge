// @ts-nocheck
// WORLD // INTEL inside Robert HQ. Auth is handled by the hub (Lovable Cloud session); this only renders the terminal.
import React, { Suspense, lazy, useEffect, useState } from 'react';
import '@fontsource-variable/inter';
import '@fontsource/jetbrains-mono/400.css';
import './styles.css';
import { usePoll, useMobile } from './api';
import { LangCtx } from './i18n';
import TopBar from './components/TopBar';
import TabBar from './components/TabBar';
import Ticker from './components/Ticker';
import GlobeView from './components/GlobeView';
// lazy-load everything that isn't the hero globe
const TvView = lazy(() => import('./components/TvView'));
const CamerasView = lazy(() => import('./components/CamerasView'));
const NewsView = lazy(() => import('./components/NewsView'));
const PredictionsView = lazy(() => import('./components/PredictionsView'));

const TABS = ['globe', 'tv', 'cams', 'news', 'pred'];
const initialTab = () => { const h = (location.hash.replace('#', '') || 'globe').split('/')[0]; return TABS.includes(h) ? h : 'globe'; };

export default function App() {
  const mobile = useMobile();
  const [tab, setTab] = useState(initialTab());
  const [region, setRegion] = useState(() => localStorage.getItem('region') || 'global');
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'en');
  const meta = usePoll('/api/meta', 3600e3);
  const status = usePoll('/api/status', 60e3);
  useEffect(() => { history.replaceState(history.state, '', location.pathname + '#' + tab); }, [tab]);
  useEffect(() => { localStorage.setItem('region', region); }, [region]);
  useEffect(() => { localStorage.setItem('lang', lang); }, [lang]);
  const m = meta.data;
  const props = { meta: m, region };
  return (
    <LangCtx.Provider value={lang}>
      <div className="wi-root">
        <div className={'app' + (mobile ? ' mobile' : '')}>
          <TopBar tab={tab} setTab={setTab} region={region} setRegion={setRegion} regions={m?.regions} lang={lang} setLang={setLang} status={status.data} mobile={mobile} />
          {!mobile && <Ticker />}
          <main className="main">
            {/* globe stays mounted so the WebGL scene is not rebuilt on tab switches; its render loop is paused when hidden */}
            <div className="view" style={{ visibility: tab === 'globe' ? 'visible' : 'hidden' }}><GlobeView meta={m} region={region} setRegion={setRegion} status={status.data} active={tab === 'globe'} /></div>
            <Suspense fallback={<div className="view loading-view"><div className="boot-mark" /></div>}>
              {tab === 'tv' && <div className="view"><TvView {...props} /></div>}
              {tab === 'cams' && <div className="view"><CamerasView {...props} /></div>}
              {tab === 'news' && <div className="view"><NewsView {...props} /></div>}
              {tab === 'pred' && <div className="view"><PredictionsView {...props} /></div>}
            </Suspense>
          </main>
          {mobile && <TabBar tab={tab} setTab={setTab} />}
        </div>
      </div>
    </LangCtx.Provider>
  );
}
