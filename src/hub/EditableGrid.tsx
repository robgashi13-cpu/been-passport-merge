import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
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
import { Check, GripVertical, Minus, Pencil, Plus, RotateCcw } from "lucide-react";
import { usePref } from "./prefs";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { normalizeLayout, shouldRevealEdit, type Layout, type Size } from "./layout";
export type { Size } from "./layout";

export const SIZES: { id: Size; label: string; hint: string; cls: string }[] = [
  { id: "S", label: "S", hint: "Small 1×1", cls: "col-span-1 row-span-1" },
  { id: "M", label: "M", hint: "Wide 2×1", cls: "col-span-2 row-span-1" },
  { id: "T", label: "T", hint: "Tall 1×2", cls: "col-span-1 row-span-2" },
  { id: "L", label: "L", hint: "Large 2×2", cls: "col-span-2 row-span-2" },
];
const sizeCls = (s: Size) => SIZES.find((x) => x.id === s)?.cls ?? SIZES[0].cls;

export type CardDef = { id: string; label: string; icon: ReactNode; size: Size; optional?: boolean; render: () => ReactNode };

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
      className={`hq-tile relative min-h-0 min-w-0 ${sizeCls(size)} ${editing ? "hq-edit touch-none select-none" : ""} ${isDragging ? "hq-dragging" : ""}`}
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
          <div className="hq-edit-outline" />
          <button
            type="button"
            onPointerDown={stop}
            onClick={onRemove}
            className="hq-minus"
            aria-label={`Hide ${label}`}
          >
            <Minus className="h-4 w-4" strokeWidth={3} />
          </button>
          <span className="pointer-events-none absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center text-muted-foreground">
            <GripVertical className="h-4 w-4" />
          </span>
          <div
            onPointerDown={stop}
            className="hq-sizes glass-thin"
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
                className="hq-size press"
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
  const layout = useMemo(() => normalizeLayout(saved, defs), [saved, defs]);
  const [editing, setEditing] = useState(false);
  const [picker, setPicker] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [entered, setEntered] = useState(false);
  useEffect(() => { const t = window.setTimeout(() => setEntered(true), 1300); return () => window.clearTimeout(t); }, []);
  const gesture = useRef<{ x: number; y: number } | null>(null);
  useEffect(() => {
    const start = (e: TouchEvent) => {
      if (e.touches.length !== 1 || (e.target as Element)?.closest("input, textarea, select, [role=dialog]")) { gesture.current = null; return; }
      gesture.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const end = (e: TouchEvent) => {
      const t = e.changedTouches[0];
      if (gesture.current && t && shouldRevealEdit(gesture.current, { x: t.clientX, y: t.clientY })) setRevealed(true);
      gesture.current = null;
    };
    const wheel = (e: WheelEvent) => { if (e.deltaY < -20) setRevealed(true); };
    window.addEventListener("touchstart", start, { passive: true });
    window.addEventListener("touchend", end, { passive: true });
    window.addEventListener("wheel", wheel, { passive: true });
    return () => { window.removeEventListener("touchstart", start); window.removeEventListener("touchend", end); window.removeEventListener("wheel", wheel); };
  }, []);
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
    const overId = e.over.id;
    const to = layout.items.findIndex((i) => i.id === overId);
    if (from < 0 || to < 0) return;
    commit({ ...layout, items: arrayMove(layout.items, from, to) });
  };

  return (
    <>
      <div className={editing || revealed ? "hq-toolbar hq-edit-bar glass-strong" : "sr-only focus-within:not-sr-only focus-within:mb-3"}>
        {editing ? (
          <>
            <button type="button" onClick={() => setPicker(true)} className="hq-edit-btn">
              <Plus className="h-4 w-4" /> Add{layout.hidden.length ? ` (${layout.hidden.length})` : ""}
            </button>
            <button type="button" onClick={() => commit(normalizeLayout(null, defs))} className="hq-edit-btn">
              <RotateCcw className="h-4 w-4" /> Reset
            </button>
            <button
              type="button"
              data-primary="true"
              onClick={() => { setEditing(false); setPicker(false); setRevealed(false); }}
              className="hq-edit-btn"
            >
              <Check className="h-4 w-4" /> Done
            </button>
          </>
        ) : (
          <button type="button" onClick={() => setEditing(true)} className="hq-edit-btn">
            <Pencil className="h-4 w-4" /> Edit
          </button>
        )}
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={layout.items.map((i) => i.id)} strategy={rectSortingStrategy}>
          <div className={`${className} ${entered ? "hq-entered" : ""}`}>
            {layout.items.map((it, i) => {
              const d = byId.get(it.id);
              if (!d) return null;
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

      <Sheet open={picker} onOpenChange={setPicker}>
        <SheetContent side="bottom" aria-describedby={undefined} className="z-[70] max-h-[80dvh] overflow-y-auto sm:mx-auto sm:max-w-md">
          <SheetTitle className="t-title3">Add a card</SheetTitle>
          {layout.hidden.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">All cards are on your dashboard.</p>
          ) : (
            <ul className="mt-4 grid gap-2">
              {layout.hidden.map((id) => {
                const d = byId.get(id);
                if (!d) return null;
                return <li key={id}>
                  <button type="button" className="hq-picker-row"
                    onClick={() => { commit({ ...layout, hidden: layout.hidden.filter((h) => h !== id), items: [...layout.items, { id, size: d.size }] }); setPicker(false); }}>
                    <span className="hq-ico">{d.icon}</span>
                    <span className="t-body min-w-0 flex-1 font-medium">{d.label}</span>
                    <span className="hq-plus"><Plus className="h-4 w-4" /></span>
                  </button>
                </li>;
              })}
            </ul>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
