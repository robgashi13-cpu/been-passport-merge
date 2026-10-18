// @ts-nocheck
export const TYPES = {
  conflict: { label: 'Armed conflict', sq: 'Konflikt i armatosur', color: '#ff5a5f', icon: '✕' },
  attack: { label: 'Attack / terror', sq: 'Sulm / terror', color: '#f06bd0', icon: '✸' },
  military: { label: 'Military posture', sq: 'Lëvizje ushtarake', color: '#a68bff', icon: '◆' },
  protest: { label: 'Protest / unrest', sq: 'Protesta', color: '#f5b83d', icon: '▲' },
  unrest: { label: 'Repression / threats', sq: 'Represion / kërcënime', color: '#ff8a4c', icon: '■' },
  quake: { label: 'Earthquake', sq: 'Tërmet', color: '#5cc8e8', icon: '◉' },
  fire: { label: 'Wildfire', sq: 'Zjarr', color: '#ff8f3a', icon: '♨' },
  storm: { label: 'Storm / cyclone', sq: 'Stuhi / ciklon', color: '#6ca8ff', icon: '@' },
  volcano: { label: 'Volcano', sq: 'Vullkan', color: '#ff6b81', icon: '⏶' },
  flood: { label: 'Flood', sq: 'Përmbytje', color: '#4f8dff', icon: '≈' },
  weather: { label: 'Severe weather (US)', sq: 'Mot ekstrem (SHBA)', color: '#8fcdf0', icon: '≋' },
  drought: { label: 'Drought / other', sq: 'Thatësirë / tjetër', color: '#c2a35a', icon: '◌' },
  disaster: { label: 'Other hazard', sq: 'Rrezik tjetër', color: '#9aa7b4', icon: '○' },
};
export const typeOf = (t) => TYPES[t] || TYPES.disaster;
export const normType = (t) => (TYPES[t] ? (t === 'ice' || t === 'dust' ? 'drought' : t) : t === 'ice' || t === 'dust' ? 'drought' : 'disaster');
export const LEVEL_COLOR = { CRITICAL: '#ff3b47', HIGH: '#ff8a4c', ELEVATED: '#ffb000', GUARDED: '#39ff88' };
