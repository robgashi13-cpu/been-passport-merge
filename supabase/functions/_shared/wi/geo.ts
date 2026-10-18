// @ts-nocheck
// Reverse-geocode lat/lon -> ISO2 country using Natural Earth 110m polygons (bundled), plus region mapping.
import geo from '../data/countries.geo.json' with { type: 'json' };

const FIX = { France: 'FR', Norway: 'NO', 'N. Cyprus': 'CY', Somaliland: 'SO', Kosovo: 'XK' };

export const REGIONS = {
  'western-europe': { name: 'Western Europe', center: [48, 6], alt: 1.1,
    countries: ['GB','IE','FR','BE','NL','LU','DE','AT','CH','LI','IT','ES','PT','AD','MC','SM','VA','MT','DK','NO','SE','FI','IS'] },
  balkans: { name: 'Balkans', center: [42.6, 20.9], alt: 0.55,
    countries: ['XK','AL','RS','MK','ME','BA','HR','SI','BG','RO','GR','MD'] },
  'eastern-europe': { name: 'Eastern Europe', center: [52, 32], alt: 1.2,
    countries: ['UA','RU','BY','PL','CZ','SK','HU','LT','LV','EE','GE','AM','AZ','MD'] },
  'middle-east': { name: 'Middle East', center: [29, 45], alt: 1.2,
    countries: ['TR','SY','LB','IL','PS','JO','IQ','IR','SA','YE','OM','AE','QA','BH','KW','EG','CY'] },
  africa: { name: 'Africa', center: [3, 20], alt: 1.8,
    countries: ['DZ','AO','BJ','BW','BF','BI','CV','CM','CF','TD','KM','CD','CG','CI','DJ','GQ','ER','SZ','ET','GA','GM','GH','GN','GW','KE','LS','LR','LY','MG','MW','ML','MR','MU','MA','MZ','NA','NE','NG','RW','ST','SN','SC','SL','SO','ZA','SS','SD','TZ','TG','TN','UG','EH','ZM','ZW'] },
  'asia-pacific': { name: 'Asia-Pacific', center: [20, 105], alt: 2.0,
    countries: ['AF','PK','IN','BD','LK','NP','BT','MV','CN','TW','HK','MN','KP','KR','JP','MM','TH','LA','KH','VN','MY','SG','ID','PH','BN','TL','PG','AU','NZ','FJ','SB','VU','NC','KZ','KG','TJ','TM','UZ'] },
  americas: { name: 'Americas', center: [15, -80], alt: 2.2,
    countries: ['US','CA','MX','GT','BZ','SV','HN','NI','CR','PA','CU','HT','DO','JM','PR','BS','TT','BB','CO','VE','EC','PE','BO','BR','PY','UY','AR','CL','GY','SR','GF','GL'] },
};
const REGION_OF = {};
for (const [id, r] of Object.entries(REGIONS)) for (const c of r.countries) REGION_OF[c] ||= id;
export const regionOf = (iso) => REGION_OF[iso] || null;

const polys = geo.features.map((f) => {
  const p = f.properties;
  let iso = p.ISO_A2;
  if (!iso || iso === '-99') iso = FIX[p.NAME] || (p.ISO_A2_EH && p.ISO_A2_EH !== '-99' ? p.ISO_A2_EH : null);
  const rings = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
  const bbox = [180, 90, -180, -90];
  for (const poly of rings) for (const [x, y] of poly[0]) { bbox[0] = Math.min(bbox[0], x); bbox[1] = Math.min(bbox[1], y); bbox[2] = Math.max(bbox[2], x); bbox[3] = Math.max(bbox[3], y); }
  return { iso, name: p.NAME, rings, bbox };
});
export const COUNTRY_NAMES = Object.fromEntries(polys.filter((p) => p.iso).map((p) => [p.iso, p.name]));

function inRing(x, y, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
export function countryAt(lat, lon) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  for (const p of polys) {
    const b = p.bbox;
    if (lon < b[0] || lon > b[2] || lat < b[1] || lat > b[3]) continue;
    for (const poly of p.rings) if (inRing(lon, lat, poly[0])) return p.iso;
  }
  return null;
}
export function tagGeo(item) {
  const iso = item.country || countryAt(item.lat, item.lon);
  return { ...item, country: iso, region: regionOf(iso) };
}
