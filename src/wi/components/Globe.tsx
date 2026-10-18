// @ts-nocheck
// globe.gl wrapper: vector-only globe (no raster/terrain texture). Solid dark ocean sphere, subtle land fill
// (polygons layer, 50m), crisp 1px country borders + coastlines as a single LineSegments draw call
// (Natural Earth 50m; swapped for 10m when zoomed in) and lazily loaded 10m admin-1 borders at close zoom.
// WebGL lines are always 1 device px, so line width stays constant at every zoom level.
// 120 Hz budget: antialias on, pixel ratio min(dpr,2), render loop paused when hidden / inactive.
import Globe from 'globe.gl';
import * as THREE from 'three';
import ConicPolygonGeometry from 'three-conic-polygon-geometry';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { geoContains } from 'd3-geo';

let geoCache = null;
export async function countriesGeo() {
  if (!geoCache) geoCache = fetch('/geo/countries-50m.geojson').then((r) => r.json());
  return geoCache;
}
export const DPR = Math.min(window.devicePixelRatio || 1, 2);

const OCEAN = '#0b1018';
const binCache = {};
function loadLines(name) {
  return (binCache[name] ||= fetch(`/geo/${name}.bin`).then((r) => r.arrayBuffer()).then((buf) => {
    const dv = new DataView(buf); const nl = dv.getUint32(0, true); const np = dv.getUint32(4, true);
    return { lens: new Uint32Array(buf, 8, nl), coords: new Float32Array(buf, 8 + nl * 4, np * 2), np };
  }));
}
// Builds LineSegments for a line set. cell>0 splits segments into lat/lon tiles (one object each, with its own
// bounding sphere) so three.js frustum-culls off-screen detail when zoomed in.
function buildLines({ lens, coords, np }, R, color, opacity, cell = 0) {
  const pos = new Float32Array(np * 3); const D = Math.PI / 180;
  for (let i = 0; i < np; i++) {
    const lon = coords[2 * i] * D, lat = coords[2 * i + 1] * D, c = Math.cos(lat);
    // three-globe convention: x = r cos(lat) sin(lon), y = r sin(lat), z = r cos(lat) cos(lon)
    pos[3 * i] = R * c * Math.sin(lon); pos[3 * i + 1] = R * Math.sin(lat); pos[3 * i + 2] = R * c * Math.cos(lon);
  }
  const buckets = new Map(); let o = 0;
  for (const n of lens) {
    for (let j = 0; j < n - 1; j++) {
      const a = o + j; const key = cell ? Math.floor((coords[2 * a + 1] + 90) / cell) * 1000 + Math.floor((coords[2 * a] + 180) / cell) : 0;
      let b = buckets.get(key); if (!b) buckets.set(key, (b = []));
      b.push(a, a + 1);
    }
    o += n;
  }
  const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false });
  const grp = new THREE.Group(); const posAttr = new THREE.BufferAttribute(pos, 3);
  for (const idx of buckets.values()) {
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', posAttr); geo.setIndex(new THREE.BufferAttribute(new Uint32Array(idx), 1));
    // bounding sphere from the used vertices only (shared position buffer)
    const box = new THREE.Box3(), v = new THREE.Vector3();
    for (let i = 0; i < idx.length; i++) box.expandByPoint(v.fromArray(pos, idx[i] * 3));
    geo.boundingBox = box; geo.boundingSphere = box.getBoundingSphere(new THREE.Sphere());
    const m = new THREE.LineSegments(geo, mat); m.renderOrder = 2; grp.add(m);
  }
  grp.material = mat; return grp;
}

export function makeGlobe(el) {
  const g = new Globe(el, { rendererConfig: { antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: false }, animateIn: false })
    .globeImageUrl(null)
    .globeMaterial(new THREE.MeshBasicMaterial({ color: OCEAN, polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 2 }))
    .backgroundColor('rgba(0,0,0,0)')
    .showAtmosphere(true).atmosphereColor('#5aa6e6').atmosphereAltitude(0.12)
    .width(el.clientWidth).height(el.clientHeight);
  g.renderer().setPixelRatio(DPR);
  const c = g.controls();
  c.autoRotate = true; c.autoRotateSpeed = 0.3; c.enableDamping = true; c.dampingFactor = 0.08;
  const R = g.getGlobeRadius();
  c.minDistance = R * 1.004; // ~25 km above the surface
  const cam = g.camera();
  // Zoom-out limit: globe.gl defaults maxDistance to 100 R, so full zoom-out shrank the Earth to a few pixels with
  // the (constant pixel size) markers piled on top. Clamp so the globe always spans >= ~52% of the viewport's
  // shorter axis (works for landscape desktop and portrait phones alike); recomputed on resize.
  function fitMaxDistance() {
    const tanV = Math.tan((cam.fov * Math.PI) / 360); const tanMin = tanV * Math.min(1, cam.aspect || 1);
    c.maxDistance = R / Math.sin(Math.atan(0.52 * tanMin));
    if (cam.position.length() > c.maxDistance) { cam.position.setLength(c.maxDistance); c.update(); }
  }
  let raf = 0;
  const ro = new ResizeObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => { if (el.clientWidth) { g.width(el.clientWidth).height(el.clientHeight); fitMaxDistance(); } }); });
  ro.observe(el);
  fitMaxDistance();

  // vector line layers (each one draw call), switched by camera altitude
  const layers = {}; const group = new THREE.Group(); g.scene().add(group);
  const want = { 'borders-ov': [1.0016, '#9fb4c8', 0.40], 'borders-50m': [1.0016, '#9fb4c8', 0.42], 'borders-10m': [1.0016, '#b5c7d8', 0.55], 'admin1-10m': [1.0014, '#7f93a6', 0.30] };
  function ensure(name) {
    if (layers[name]) return layers[name];
    layers[name] = { obj: null, loading: loadLines(name).then((d) => { const [r, col, op] = want[name]; const o = buildLines(d, R * r, col, op, name.endsWith('10m') ? 6 : 0); o.visible = false; group.add(o); layers[name].obj = o; forceUpdate(); }) };
    return layers[name];
  }
  // Per-frame (scene.onBeforeRender, i.e. synchronously before every draw, also during pointOfView tweens):
  // 1) dynamic near plane: near = 30% of the distance to the surface. With globe.gl's fixed near=0.05 and
  //    far=125000, depth precision at overview distance (~0.1 units) was coarser than the land/line separation
  //    (0.08 units) -> z-fighting flicker when zoomed out. Dynamic near keeps precision ~1e-4 units at any zoom.
  // 2) LOD switching with hysteresis (enter/exit thresholds) so layers never toggle back and forth; loaded
  //    layers are kept (only visibility changes), nothing is re-created on camera change.
  const st = { mid: false, detail: false, admin: false };
  const hyst = (on, alt, enter, exit) => (on ? alt < exit : alt < enter);
  let lastAlt = -1;
  function update() {
    const d = cam.position.length(); const alt = d / R - 1;
    const near = Math.min(40, Math.max(0.01, (d - R) * 0.3));
    if (Math.abs(near - cam.near) > cam.near * 0.01) { cam.near = near; cam.updateProjectionMatrix(); }
    if (Math.abs(alt - lastAlt) < 0.0005) return; lastAlt = alt;
    st.mid = hyst(st.mid, alt, 1.2, 1.35); st.detail = hyst(st.detail, alt, 0.42, 0.5); st.admin = hyst(st.admin, alt, 0.14, 0.17);
    const ov = ensure('borders-ov');
    const b50 = st.mid ? ensure('borders-50m') : layers['borders-50m'];
    const b10 = st.detail ? ensure('borders-10m') : layers['borders-10m'];
    const top = st.detail && b10?.obj ? 'b10' : st.mid && b50?.obj ? 'b50' : 'ov';
    if (ov.obj) { ov.obj.visible = top === 'ov'; ov.obj.material.opacity = 0.40 - 0.16 * Math.min(1, Math.max(0, (alt - 1.6) / 1.6)); } // thinner look on the small far-out globe
    if (b50?.obj) b50.obj.visible = top === 'b50';
    if (b10?.obj) b10.obj.visible = top === 'b10';
    const a1 = st.admin ? ensure('admin1-10m') : layers['admin1-10m'];
    // admin-1 fades in/out with altitude instead of popping
    if (a1?.obj) { const op = Math.max(0, Math.min(0.36, (0.17 - alt) / 0.08 * 0.36)); a1.obj.visible = st.admin && op > 0.01; a1.obj.material.opacity = op; }
    g.__alt = alt; g.__onAlt?.(alt);
  }
  ensure('borders-ov');
  g.scene().onBeforeRender = update;
  function forceUpdate() { lastAlt = -1; update(); }

  const vis = () => (document.hidden ? g.pauseAnimation() : g.__active !== false && g.resumeAnimation());
  document.addEventListener('visibilitychange', vis);
  g.__ro = ro; g.__vis = vis; g.__group = group;
  return g;
}
// Land fill: ALL country polygons merged into ONE mesh (one draw call; per-vertex colours pre-blended over the
// ocean so it stays opaque). Replaces globe.gl's polygons layer, which costs several draw calls per polygon.
// Depth: the OCEAN sphere is polygon-offset backwards (see makeGlobe), not the land. Offsetting the land back made
// its flat triangles (which sag below the sphere between vertices) lose the depth test against the ocean at overview
// distance / near the limb -> missing land and dark triangle holes when zoomed out.
const landGeoCache = new WeakMap();
function featureGeoms(f, R) {
  let arr = landGeoCache.get(f);
  if (!arr) {
    const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
    arr = polys.map((rings) => { const geo = new ConicPolygonGeometry(rings, R * 1.0008, R * 1.0008, false, true, false, 3); return geo.index ? geo.toNonIndexed() : geo; });
    landGeoCache.set(f, arr);
  }
  return arr;
}
const _c = new THREE.Color();
const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
// blend in sRGB (what the eye/CSS expects), then hand three.js an sRGB colour
function blend(hex, a) { const c = rgb(hex), o = rgb(OCEAN); return _c.setRGB(o[0] + (c[0] - o[0]) * a, o[1] + (c[1] - o[1]) * a, o[2] + (c[2] - o[2]) * a, THREE.SRGBColorSpace); }
export function setLand(g, features, colorFn) {
  const R = g.getGlobeRadius(); const parts = [];
  for (const f of features) {
    const [hex, a] = colorFn(f); const c = blend(hex, a);
    for (const geo of featureGeoms(f, R)) {
      const n = geo.attributes.position.count; const col = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { col[3 * i] = c.r; col[3 * i + 1] = c.g; col[3 * i + 2] = c.b; }
      const gg = new THREE.BufferGeometry(); gg.setAttribute('position', geo.attributes.position); gg.setAttribute('color', new THREE.BufferAttribute(col, 3));
      parts.push(gg);
    }
  }
  const merged = parts.length ? mergeGeometries(parts, false) : new THREE.BufferGeometry();
  if (!g.__land) { g.__land = new THREE.Mesh(merged, new THREE.MeshBasicMaterial({ vertexColors: true })); g.__land.renderOrder = 1; g.__group.add(g.__land); }
  else { g.__land.geometry.dispose(); g.__land.geometry = merged; }
}
export function countryAt(features, lat, lng) { if (lat == null) return null; return features.find((f) => geoContains(f, [lng, lat])) || null; }
export function setActive(g, on) { if (!g) return; g.__active = on; on && !document.hidden ? g.resumeAnimation() : g.pauseAnimation(); }
export function destroyGlobe(g) {
  try {
    g.__ro?.disconnect(); document.removeEventListener('visibilitychange', g.__vis); g.pauseAnimation();
    g.__group?.traverse((o) => { o.geometry?.dispose(); o.material?.dispose(); }); g._destructor?.();
  } catch {}
}
