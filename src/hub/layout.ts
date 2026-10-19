export type Size = "S" | "M" | "T" | "L";
export type Layout = { v: 1; items: { id: string; size: Size }[]; hidden: string[] };
export type LayoutDef = { id: string; size: Size; optional?: boolean };

export function normalizeLayout(saved: Layout | null, defs: LayoutDef[]): Layout {
  const known = new Map(defs.map((d) => [d.id, d]));
  const items: Layout["items"] = [];
  const valid = saved?.v === 1 && Array.isArray(saved.items);
  for (const i of valid ? saved.items : defs.filter((d) => !d.optional)) {
    if (i && known.has(i.id) && ["S", "M", "T", "L"].includes(i.size) && !items.some((x) => x.id === i.id)) items.push({ id: i.id, size: i.size });
  }
  const hidden = valid && Array.isArray(saved.hidden) ? [...new Set(saved.hidden.filter((id) => known.has(id) && !items.some((i) => i.id === id)))] : [];
  for (const d of defs) {
    if (items.some((i) => i.id === d.id) || hidden.includes(d.id)) continue;
    if (d.optional) hidden.push(d.id);
    else items.push({ id: d.id, size: d.size });
  }
  return { v: 1, items, hidden };
}

export function shouldRevealEdit(start: { x: number; y: number }, end: { x: number; y: number }) {
  return end.y - start.y >= 55 && Math.abs(end.x - start.x) < (end.y - start.y) * 0.7;
}