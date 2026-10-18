import { useMemo, useState, type ReactNode } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check, GripVertical, Minus, Pencil, Plus, RotateCcw, X } from "lucide-react";
import { usePref } from "./prefs";

export type Size = "S" | "M" | "T" | "L";
export const SIZES: { id: Size; label: string; hint: string; cls: string }[] = [
  { id: "S", label: "S", hint: "Small 1×1", cls: "col-span-1 row-span-1" },
  { id: "M", label: "M", hint: "Wide 2×1", cls: "col-span-2 row-span-1" },
  { id: "T", label: "T", hint: "Tall 1×2", cls: "col-span-1 row-span-2" },
  { id: "L", label: "L", hint: "Large 2×2", cls: "col-span-2 row-span-2" },
];
const sizeCls = (s: Size) => SIZES.find((x) => x.id === s)?.cls ?? SIZES[0].cls;

export type CardDef = { id: string; label: string; icon: ReactNode; size: Size; render: () => ReactNode };
type Layout = { v: 1; items: { id: string; size: Size }[]; hidden: string[] };

function normalize(saved: Layout | null, defs: CardDef[]): Layout {
  const known = new Map(defs.map((d) => [d.id, d]));
  if (!saved || saved.v !== 1 || !Array.isArray(saved.items)) {
    return { v: 1, items: defs.map((d) => ({ id: d.id, size: d.size })), hidden: [] };
  }
  const items = saved.items.filter((i) => known.has(i.id) && SIZES.some((s) => s.id === i.size));
  const hidden = (saved.hidden || []).filter((h) => known.has(h) && !items.some((i) => i.id === h));
  // cards added to the app after the layout was saved appear at the end
  for (const d of defs) if (!items.some((i) => i.id === d.id) && !hidden.includes(d.id)) items.push({ id: d.id, size: d.size });
  return { v: 1, items, hidden };
}

function Tile({
  id,
  size,
  editing,
  index,
  label,
  onRemove,
  onSize,
  children,
}: {
  id: string;
  size: Size;
  editing: boolean;
  index: number;
  label: string;
  onRemove: () => void;
  onSize: (s: Size) => void;
  children: ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled: !editing });
  const style = { transform: CSS.Translate.toString(transform), transition, zIndex: isDragging ? 30 : undefined };
  const stop = (e: { stopPropagation: () => void }) => e.stopPropagation();
  return (
    <div
      ref={setNodeRef}
      style={style}
      data-card={id}
      className={`relative min-h-0 ${sizeCls(size)} ${editing ? "hq-edit touch-none select-none" : ""} ${isDragging ? "hq-dragging" : ""}`}
      {...(editing ? { ...attributes, ...listeners, "aria-label": `${label}. Drag to reorder` } : {})}
    >
      <div
        className={`h-full ${editing ? "pointer-events-none" : ""}`}
        style={editing ? { animationDelay: `${(index % 5) * -0.11}s` } : undefined}
      >
        <div className={`h-full ${editing ? "hq-jiggle" : ""}`} style={editing ? { animationDelay: `${(index % 5) * -0.11}s` } : undefined}>
          {children}
        </div>
      </div>
      {editing && (
        <>
          <div className="pointer-events-none absolute inset-0 rounded-3xl ring-2 ring-sky/50 ring-offset-0" />
          <button
            type="button"
            onPointerDown={stop}
            onClick={onRemove}
            className="absolute -left-2 -top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-zinc-200 text-black shadow-lg ring-2 ring-black/60 active:scale-90"
            aria-label={`Hide ${label}`}
          >
            <Minus className="h-4 w-4" strokeWidth={3} />
          </button>
          <span className="pointer-events-none absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white/80 backdrop-blur">
            <GripVertical className="h-4 w-4" />
          </span>
          <div
            onPointerDown={stop}
            className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 gap-0.5 rounded-full bg-black/70 p-0.5 ring-1 ring-white/15 backdrop-blur"
            role="group"
            aria-label={`${label} size`}
          >
            {SIZES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onSize(s.id)}
                title={s.hint}
                aria-pressed={size === s.id}
                className={`h-7 min-w-7 rounded-full px-2 text-[11px] font-semibold transition ${size === s.id ? "bg-white text-black" : "text-white/70 hover:text-white"}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function EditableGrid({ defs, prefKey, className }: { defs: CardDef[]; prefKey: string; className: string }) {
  const [saved, setSaved] = usePref<Layout | null>(prefKey, null);
  const layout = useMemo(() => normalize(saved, defs), [saved, defs]);
  const [editing, setEditing] = useState(false);
  const [picker, setPicker] = useState(false);
  const byId = useMemo(() => new Map(defs.map((d) => [d.id, d])), [defs]);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const commit = (l: Layout) => setSaved(l);
  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const from = layout.items.findIndex((i) => i.id === e.active.id);
    const to = layout.items.findIndex((i) => i.id === e.over!.id);
    commit({ ...layout, items: arrayMove(layout.items, from, to) });
  };

  return (
    <>
      <div className="mb-3 flex min-h-9 items-center justify-end gap-2">
        {editing ? (
          <>
            <span className="mr-auto hidden text-xs text-muted-foreground sm:block">Drag to reorder. Long-press on iPhone. Tap a size or − to hide.</span>
            <button
              onClick={() => setPicker(true)}
              className="flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/80 hover:text-white"
            >
              <Plus className="h-3.5 w-3.5" /> Add card{layout.hidden.length ? ` (${layout.hidden.length})` : ""}
            </button>
            <button
              onClick={() => commit(normalize(null, defs))}
              className="flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/80 hover:text-white"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </button>
            <button
              onClick={() => { setEditing(false); setPicker(false); }}
              className="flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-black"
            >
              <Check className="h-3.5 w-3.5" /> Done
            </button>
          </>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/60 transition hover:border-white/20 hover:text-white"
          >
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
        )}
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={layout.items.map((i) => i.id)} strategy={rectSortingStrategy}>
          <div className={className}>
            {layout.items.map((it, i) => {
              const d = byId.get(it.id)!;
              return (
                <Tile
                  key={it.id}
                  id={it.id}
                  size={it.size}
                  index={i}
                  label={d.label}
                  editing={editing}
                  onRemove={() => commit({ ...layout, items: layout.items.filter((x) => x.id !== it.id), hidden: [...layout.hidden, it.id] })}
                  onSize={(s) => commit({ ...layout, items: layout.items.map((x) => (x.id === it.id ? { ...x, size: s } : x)) })}
                >
                  {d.render()}
                </Tile>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      {picker && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center" onClick={() => setPicker(false)}>
          <div className="hq-card m-0 w-full max-w-md rounded-b-none p-4 sm:m-4 sm:rounded-b-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold">Add a card</div>
              <button onClick={() => setPicker(false)} className="rounded-full p-1.5 hover:bg-white/10" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>
            {layout.hidden.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">All cards are on your dashboard.</p>
            ) : (
              <ul className="grid gap-2">
                {layout.hidden.map((id) => {
                  const d = byId.get(id)!;
                  return (
                    <li key={id}>
                      <button
                        onClick={() => { commit({ ...layout, hidden: layout.hidden.filter((h) => h !== id), items: [...layout.items, { id, size: d.size }] }); setPicker(false); }}
                        className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-left text-sm hover:bg-white/[0.07]"
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06]">{d.icon}</span>
                        <span className="flex-1">{d.label}</span>
                        <Plus className="h-4 w-4 text-white/50" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </>
  );
}
