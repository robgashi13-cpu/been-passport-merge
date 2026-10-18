// @ts-nocheck
import React, { useLayoutEffect, useRef, useState } from 'react';
/** Fixed-row-height virtualised list: only rows in (and just around) the viewport are mounted; rows are positioned
 *  with transform (compositor-only). Scroll handling is rAF-coalesced. */
export default function VirtualList({ items, rowHeight, render, className = '', overscan = 6, empty = null, header = null }) {
  const ref = useRef(null);
  const [range, setRange] = useState([0, 30]);
  useLayoutEffect(() => {
    const el = ref.current; if (!el) return;
    let raf = 0;
    const calc = () => { raf = 0; const top = el.scrollTop, h = el.clientHeight || 600; const a = Math.max(0, Math.floor(top / rowHeight) - overscan), b = Math.min(items.length, Math.ceil((top + h) / rowHeight) + overscan); setRange((r) => (r[0] === a && r[1] === b ? r : [a, b])); };
    const on = () => { if (!raf) raf = requestAnimationFrame(calc); };
    calc();
    el.addEventListener('scroll', on, { passive: true });
    const ro = new ResizeObserver(on); ro.observe(el);
    return () => { el.removeEventListener('scroll', on); ro.disconnect(); cancelAnimationFrame(raf); };
  }, [items.length, rowHeight, overscan]);
  const [a, b] = range;
  return (
    <div ref={ref} className={'vlist ' + className}>
      {header}
      <div className="vlist-inner" style={{ height: items.length * rowHeight }}>
        {items.slice(a, b).map((it, i) => (
          <div key={it.id ?? it.key ?? a + i} className="vrow" style={{ height: rowHeight, transform: `translate3d(0,${(a + i) * rowHeight}px,0)` }}>{render(it, a + i)}</div>
        ))}
      </div>
      {!items.length && empty}
    </div>
  );
}
