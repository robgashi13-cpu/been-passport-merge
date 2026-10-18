// @ts-nocheck
import React from 'react';
import { useT } from '../i18n';
const I = {
  globe: <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.8 3 2.8 15 0 18M12 3c-2.8 3-2.8 15 0 18" /></svg>,
  tv: <svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12" rx="2.5" /><path d="M9 3l3 3 3-3" /></svg>,
  cams: <svg viewBox="0 0 24 24"><rect x="3" y="7" width="13" height="10" rx="2.5" /><path d="M16 11l5-3v8l-5-3" /></svg>,
  news: <svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2.5" /><path d="M8 9h8M8 13h8M8 17h5" /></svg>,
  pred: <svg viewBox="0 0 24 24"><path d="M4 19V5M4 19h16" /><path d="M7 15l4-4 3 3 5-6" /></svg>,
};
export const TAB_LABELS = [['globe', 'Globe'], ['tv', 'TV'], ['cams', 'Cameras'], ['news', 'News'], ['pred', 'Predictions']];
export default function TabBar({ tab, setTab }) {
  const t = useT();
  return (
    <nav className="tabbar">
      {TAB_LABELS.map(([id, l]) => (
        <button key={id} className={'tb' + (tab === id ? ' on' : '')} onClick={() => setTab(id)} aria-label={l}>{I[id]}<span>{t(l)}</span></button>
      ))}
    </nav>
  );
}
