// @ts-nocheck
import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
/** iOS-style bottom sheet. Drag the grabber/header; release springs to the nearest snap point (velocity-aware).
 *  Only `transform` is animated, driven by requestAnimationFrame with a damped spring - no layout, no React renders per frame. */
const Sheet = forwardRef(function Sheet({ snaps = [0.18, 0.5, 0.92], initial = 0, header, children, onSnap, className = '' }, ref) {
  const el = useRef(null);
  const st = useRef({ y: 0, v: 0, target: 0, raf: 0, idx: initial, drag: null });
  const vh = () => window.innerHeight;
  const posFor = (i) => vh() * (1 - snaps[i]); // translateY in px from top of full-height sheet
  const apply = (y) => { el.current.style.transform = `translate3d(0,${y}px,0)`; };
  const animateTo = (i, v0 = 0) => {
    const s = st.current; s.idx = i; s.target = posFor(i); s.v = v0; onSnap?.(i);
    el.current.style.setProperty('--visible', Math.round(vh() * snaps[i]) + 'px'); // set once per snap, not per frame
    cancelAnimationFrame(s.raf);
    let last = performance.now();
    const k = 520, c = 2 * Math.sqrt(k) * 0.86; // stiffness / slightly under-damped
    const step = (now) => {
      const dt = Math.min(0.032, (now - last) / 1000); last = now;
      const a = -k * (s.y - s.target) - c * s.v; s.v += a * dt; s.y += s.v * dt; apply(s.y);
      if (Math.abs(s.v) < 4 && Math.abs(s.y - s.target) < 0.5) { s.y = s.target; apply(s.y); return; }
      s.raf = requestAnimationFrame(step);
    };
    s.raf = requestAnimationFrame(step);
  };
  useImperativeHandle(ref, () => ({ snapTo: (i) => animateTo(i), get index() { return st.current.idx; } }));
  useEffect(() => {
    const s = st.current; s.y = posFor(initial); apply(s.y); el.current.style.setProperty('--visible', Math.round(vh() * snaps[initial]) + 'px');
    const onResize = () => { s.y = posFor(s.idx); apply(s.y); };
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('resize', onResize); cancelAnimationFrame(s.raf); };
  }, []);
  const down = (e) => {
    if (e.target.closest('button,select,input,a')) return;
    const s = st.current; cancelAnimationFrame(s.raf);
    s.drag = { y0: e.clientY, start: s.y, samples: [[performance.now(), e.clientY]] };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const move = (e) => {
    const s = st.current; if (!s.drag) return;
    let y = s.drag.start + (e.clientY - s.drag.y0);
    const min = posFor(snaps.length - 1), max = posFor(0);
    if (y < min) y = min - (min - y) * 0.25; if (y > max) y = max + (y - max) * 0.25; // rubber-band
    s.y = y; apply(y);
    s.drag.samples.push([performance.now(), e.clientY]); if (s.drag.samples.length > 5) s.drag.samples.shift();
  };
  const up = () => {
    const s = st.current; if (!s.drag) return;
    const sm = s.drag.samples, [t0, y0] = sm[0], [t1, y1] = sm[sm.length - 1];
    const v = t1 > t0 ? ((y1 - y0) / (t1 - t0)) * 1000 : 0; const moved = Math.abs(y1 - s.drag.y0); s.drag = null;
    const projected = s.y + v * 0.18; // project momentum
    let best = 0, bd = Infinity; snaps.forEach((_, i) => { const d = Math.abs(posFor(i) - projected); if (d < bd) { bd = d; best = i; } });
    if (moved < 4 && s.idx === best) best = (s.idx + 1) % snaps.length; // tap toggles
    animateTo(best, v);
  };
  return (
    <div ref={el} className={'sheet ' + className}>
      <div className="sheet-head" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
        <div className="grabber" />
        {header}
      </div>
      <div className="sheet-body">{children}</div>
    </div>
  );
});
export default Sheet;
