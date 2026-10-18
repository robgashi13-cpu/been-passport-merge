// @ts-nocheck
import { createContext, useContext } from 'react';
const SQ = {
  'GLOBE': 'GLOBI', 'LIVE TV': 'TV LIVE', 'CAMERAS': 'KAMERA', 'NEWS': 'LAJME', 'GLOBAL': 'GLOBALE',
  'LAYERS': 'SHTRESAT', 'LIVE FEED': 'RRJEDHA LIVE', 'THREAT INDEX': 'INDEKSI I KËRCËNIMIT', 'SYSTEM STATUS': 'STATUSI I SISTEMIT',
  'LIVE STREAM': 'TRANSMETIM LIVE', 'REGIONS': 'RAJONET', 'HOTSPOTS': 'PIKAT E NXEHTA', 'Last updated': 'Përditësuar',
  'ALL': 'TË GJITHA', 'NONE': 'ASNJË', 'Search channels…': 'Kërko kanale…', 'Country': 'Shteti', 'World': 'Bota',
  'OFFICIAL YOUTUBE LIVE': 'YOUTUBE ZYRTAR LIVE', 'IPTV-ORG STREAMS': 'STREAM-E IPTV-ORG', 'Stream unavailable': 'Stream-i nuk është i disponueshëm',
  'Open source': 'Hap burimin', 'events': 'ngjarje', 'Region': 'Rajoni', 'PUBLIC CAMERAS': 'KAMERA PUBLIKE', 'Click a country': 'Kliko një shtet',
  'CYBER · KEV': 'KIBER · KEV', 'DISASTER ALERTS': 'ALARME FATKEQËSISH', 'window': 'dritarja', 'precision': 'saktësia',
};
Object.assign(SQ, { Globe: 'Globi', TV: 'TV', Cameras: 'Kamera', News: 'Lajme', Predictions: 'Parashikime', Global: 'Globale', Layers: 'Shtresat',
  'Live stream': 'Transmetim live', 'System status': 'Statusi', 'Threat index': 'Indeksi i kërcënimit', 'Live feed': 'Rrjedha live', Threat: 'Kërcënimi',
  Regions: 'Rajonet', Hotspots: 'Pikat e nxehta' });
export const LangCtx = createContext('en');
export function useT() {
  const lang = useContext(LangCtx);
  return (s) => (lang === 'sq' ? SQ[s] || s : s);
}
