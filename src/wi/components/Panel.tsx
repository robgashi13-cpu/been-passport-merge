// @ts-nocheck
import React, { useState } from 'react';
export default function Panel({ title, right, children, className = '', collapsible = true, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className={'panel ' + className + (open ? '' : ' closed')}>
      <header className="panel-h" onClick={() => collapsible && setOpen(!open)}>
        <span className="panel-title">{title}</span>
        <span className="panel-right" onClick={(e) => e.stopPropagation()}>{right}</span>
        {collapsible && <span className={'chev' + (open ? ' open' : '')}>›</span>}
      </header>
      {open && <div className="panel-b">{children}</div>}
    </section>
  );
}
