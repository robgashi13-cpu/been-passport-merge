import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CarFront, Check, KeyRound, Loader2, LogOut, Pencil, ShieldCheck, X } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { carName, STAGE_LABEL, type Car } from "./feed";
import { fetchKamCar, fetchKamExpenses, saveKamCar, type KamAccess, type KamCar } from "./kam";
import {
  GROUPS, buildPatch, canEditField, diffForm, fieldsFor, initialForm, money, validate,
  type Change, type FieldDef, type FormState,
} from "./kam-form";

const TZ = "Europe/Belgrade";
const isoTs = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

function show(d: FieldDef, v: unknown, opts: Record<string, string>): string {
  if (v === null || v === undefined || v === "") return "—";
  if (d.money) return money(v);
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (Array.isArray(v)) {
    if (!v.length) return "—";
    if (d.key === "tracking_steps") return v.map((s: { label?: string; date?: string | null; completed?: boolean; current?: boolean }) => `${s.completed ? "✓" : s.current ? "•" : "○"} ${s.label ?? ""}${s.date ? ` · ${s.date}` : ""}`).join("\n");
    return v.map((x) => (typeof x === "object" ? JSON.stringify(x) : String(x))).join(", ");
  }
  if (typeof v === "object") return JSON.stringify(v, null, 1);
  const s = String(v);
  if (opts[s]) return opts[s];
  if (isoTs.test(s)) {
    const t = new Date(s);
    if (!Number.isNaN(+t)) return `${t.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: TZ })} (Kosovo)`;
  }
  return s;
}

function SignIn({ onSignIn }: { onSignIn: (e: string, p: string) => Promise<void> }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  return (
    <form
      className="hq-group p-4"
      data-testid="kam-signin"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setErr(null);
        try {
          await onSignIn(email, password);
          setPassword("");
        } catch (x) {
          setErr(String((x as Error).message || x));
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="flex items-center gap-2 text-[15px] font-semibold"><KeyRound className="h-4 w-4" /> Sign in to KorAuto Manager</div>
      <p className="mt-1 text-[13px] text-muted-foreground">Use your own korautomanager.biz login. You see and edit exactly what that account can in KorAuto Manager.</p>
      <div className="mt-3 grid gap-2">
        <input className="hq-field w-full px-3 text-[16px]" type="email" autoComplete="username" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="hq-field w-full px-3 text-[16px]" type="password" autoComplete="current-password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>
      {err && <p className="mt-2 text-[13px] text-[hsl(var(--destructive))]" role="alert">{err}</p>}
      <button type="submit" disabled={busy} className="hq-btn mt-3 w-full">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Sign in</button>
    </form>
  );
}

function Input({ d, value, onChange }: { d: FieldDef; value: string; onChange: (v: string) => void }) {
  const cls = "hq-field !min-h-10 w-full rounded-xl px-3 text-[16px]";
  if (d.kind === "select") {
    const opts = d.options ?? [];
    const known = opts.some(([v]) => v === value);
    return (
      <select className={cls} value={value} onChange={(e) => onChange(e.target.value)} aria-label={d.label}>
        {!known && <option value={value}>{value || "—"}</option>}
        {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    );
  }
  if (d.kind === "textarea") return <textarea className={`${cls} min-h-[72px] py-2`} rows={2} value={value} onChange={(e) => onChange(e.target.value)} aria-label={d.label} />;
  if (d.kind === "date") return <input className={cls} type="date" value={value} onChange={(e) => onChange(e.target.value)} aria-label={d.label} />;
  if (d.kind === "int" || d.kind === "money") return <input className={cls} inputMode={d.kind === "int" ? "numeric" : "decimal"} value={value} onChange={(e) => onChange(e.target.value.replace(",", "."))} aria-label={d.label} />;
  return <input className={cls} value={value} onChange={(e) => onChange(e.target.value)} aria-label={d.label} />;
}

function Confirm({ changes, busy, onBack, onSave }: { changes: Change[]; busy: boolean; onBack: () => void; onSave: () => void }) {
  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/60 sm:items-center" data-testid="kam-confirm">
      <div className="hq-card w-full max-w-md rounded-b-none p-5 pb-[calc(20px+env(safe-area-inset-bottom))] sm:rounded-[28px]">
        <h3 className="text-[17px] font-semibold">Save {changes.length} change{changes.length === 1 ? "" : "s"} to KorAuto Manager?</h3>
        <p className="mt-1 text-[13px] text-muted-foreground">This writes to the live car record with your KorAuto Manager account.</p>
        <ul className="hq-group mt-3 max-h-[40dvh] overflow-y-auto">
          {changes.map((c) => (
            <li key={c.key} className="hq-row !items-start !py-2 text-[13px]">
              <span className="w-32 shrink-0 text-muted-foreground">{c.label}</span>
              <span className="min-w-0 flex-1 break-words"><span className="text-muted-foreground line-through">{c.from || "—"}</span> → <b>{c.to || "—"}</b></span>
            </li>
          ))}
        </ul>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button type="button" className="hq-btn" data-tone="plain" onClick={onBack} disabled={busy}>Back</button>
          <button type="button" className="hq-btn" onClick={onSave} disabled={busy} data-testid="kam-confirm-save">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save</button>
        </div>
      </div>
    </div>
  );
}

export default function CarDetail({
  variant = "sheet", carId, summary, session, access, accessError, onSignIn, onSignOut, onClose, onSaved,
}: {
  variant?: "sheet" | "pane";
  carId: string;
  summary?: Car | KamCar | null;
  session: Session | null;
  access: KamAccess | null;
  accessError?: string | null;
  onSignIn: (e: string, p: string) => Promise<void>;
  onSignOut: () => void;
  onClose: () => void;
  onSaved?: (car: KamCar) => void;
}) {
  const [car, setCar] = useState<KamCar | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [expenses, setExpenses] = useState<Awaited<ReturnType<typeof fetchKamExpenses>> | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<FormState>({});
  const [formErr, setFormErr] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<Change[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [tick, setTick] = useState(0);

  const ready = !!session && !!access && access.active && access.canOpenCars;
  useEffect(() => {
    if (!ready || !access) return;
    let alive = true;
    setLoadErr(null);
    fetchKamCar(carId, access.isAdmin).then((c) => alive && setCar(c)).catch((e) => alive && setLoadErr(String(e.message || e)));
    if (access.isAdmin) fetchKamExpenses(carId).then((x) => alive && setExpenses(x)).catch(() => alive && setExpenses(null));
    return () => {
      alive = false;
    };
  }, [carId, ready, access, tick]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !editing && variant === "sheet" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editing, onClose, variant]);

  const fields = useMemo(() => (car ? fieldsFor(car) : []), [car]);
  const head = (car ?? summary ?? null) as Record<string, unknown> | null;
  const title = head ? carName(head as Car) : "Car";
  const isAdmin = !!access?.isAdmin;
  const expTotal = (expenses ?? []).reduce((s, e) => s + Number(e.amount || 0), 0);

  const startEdit = () => {
    if (!car) return;
    setForm(initialForm(car, isAdmin));
    setFormErr(null);
    setSaveErr(null);
    setSaved(false);
    setEditing(true);
  };
  const cancelEdit = () => {
    setEditing(false);
    setConfirm(null);
    setFormErr(null);
  };
  const askSave = () => {
    if (!car) return;
    const v = validate(form);
    if (v) return setFormErr(v);
    const ch = diffForm(car, form);
    if (!ch.length) return setFormErr("Nothing changed.");
    setFormErr(null);
    setConfirm(ch);
  };
  const doSave = async () => {
    if (!car) return;
    setSaving(true);
    setSaveErr(null);
    try {
      await saveKamCar(car.id, buildPatch(car, form));
      setConfirm(null);
      setEditing(false);
      setSaved(true);
      const fresh = await fetchKamCar(car.id, isAdmin).catch(() => null);
      if (fresh) {
        setCar(fresh);
        onSaved?.(fresh);
      } else setTick((t) => t + 1);
    } catch (e) {
      setConfirm(null);
      setSaveErr(String((e as Error).message || e));
    } finally {
      setSaving(false);
    }
  };

  const optLabels = (d: FieldDef) => Object.fromEntries(d.options ?? []);

  const pane = variant === "pane";
  const card = (
      <div className={pane ? "hq-card flex h-full min-h-0 w-full flex-col !rounded-[18px] p-0" : "hq-card flex max-h-[92dvh] w-full max-w-xl flex-col !rounded-b-none !rounded-t-[22px] p-0"} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2.5 border-b border-white/10 px-3 py-2">
          <div className="h-9 w-12 shrink-0 overflow-hidden rounded-lg bg-foreground/[0.06]">
            {head?.image_url ? <img src={String(head.image_url)} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" /> : <div className="flex h-full items-center justify-center"><CarFront className="h-5 w-5 text-white/30" /></div>}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-[15px] font-semibold leading-5 text-white" data-testid="kam-car-title">{title} <span className="text-white/45">{head?.year ? String(head.year) : ""}</span></h2>
            <p className="truncate text-[11px] leading-4 text-muted-foreground">{[head?.plate_number, head?.vin, STAGE_LABEL[String(head?.sale_status ?? "")] || head?.sale_status].filter(Boolean).join(" · ") || "—"}</p>
          </div>
          {!editing && <button type="button" onClick={onClose} className="press flex h-10 w-10 items-center justify-center rounded-full bg-foreground/[0.07]" aria-label="Close"><X className="h-4 w-4" /></button>}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3 pt-2 overscroll-contain">
          {!session && (
            <div className="space-y-3">
              <SignIn onSignIn={onSignIn} />
              <p className="text-center text-[12px] text-muted-foreground">Without signing in, the hub only shows the summary from the read-only feed.</p>
            </div>
          )}
          {session && !access && !accessError && <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Checking your KorAuto Manager access…</div>}
          {session && accessError && <div className="rounded-2xl bg-[hsl(var(--destructive)/.12)] p-3 text-sm text-[hsl(var(--destructive))]">KorAuto Manager: {accessError}</div>}
          {session && access && !access.active && <div className="rounded-2xl bg-[hsl(var(--destructive)/.12)] p-3 text-sm">This KorAuto Manager account is deactivated.</div>}
          {session && access && access.active && !access.canOpenCars && <div className="rounded-2xl bg-foreground/[0.06] p-3 text-sm">Your KorAuto Manager account ({access.role}) has no access to “All cars”, so KorAuto Manager doesn’t let it open a car. Ask the admin to enable it.</div>}

          {ready && (
            <>
              <div className="mb-2 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="hq-chip"><ShieldCheck className="h-3.5 w-3.5" /> {access!.email} · {access!.role}</span>
                {!isAdmin && <span className="hq-chip">Payments are admin-only in KorAuto Manager</span>}
                <button type="button" className="hq-chip press" onClick={onSignOut}><LogOut className="h-3.5 w-3.5" /> Sign out</button>
              </div>
              {saved && <div className="mb-3 rounded-2xl bg-foreground/[0.08] p-3 text-sm" role="status">Saved to KorAuto Manager.</div>}
              {saveErr && <div className="mb-3 flex gap-2 rounded-2xl bg-[hsl(var(--destructive)/.12)] p-3 text-sm text-[hsl(var(--destructive))]" role="alert" data-testid="kam-save-error"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> <span>KorAuto Manager refused the change: {saveErr}</span></div>}
              {loadErr && <div className="rounded-2xl bg-[hsl(var(--destructive)/.12)] p-3 text-sm text-[hsl(var(--destructive))]">Couldn’t load this car: {loadErr}</div>}
              {!car && !loadErr && <div className="space-y-2">{[0, 1, 2, 3, 4].map((i) => <div key={i} className="hq-shimmer h-11 rounded-xl" />)}</div>}

              {car && isAdmin && (
                <div className="mb-3 grid grid-cols-3 gap-1.5" data-testid="kam-money">
                  {[
                    ["Buy price", money(car.buy_price)],
                    ["Expenses", expenses ? money(expTotal) : "—"],
                    ["Sale price", money(car.sale_price)],
                    ["Profit", car.sale_price != null ? money(Number(car.sale_price) - Number(car.buy_price || 0) - expTotal) : "—"],
                    ["Paid by client", money(Math.max(Number(car.amount_paid_cash || 0) + Number(car.amount_paid_bank || 0) + Number(car.deposit || 0), Number(car.amount_paid_by_client || 0)))],
                    ["Balance due", Number(car.sale_price || 0) ? money(Math.max(0, Number(car.sale_price) - Math.max(Number(car.amount_paid_cash || 0) + Number(car.amount_paid_bank || 0) + Number(car.deposit || 0), Number(car.amount_paid_by_client || 0)))) : money(0)],
                  ].map(([l, v]) => (
                    <div key={l} className="min-w-0 rounded-xl bg-foreground/[0.05] px-2 py-1.5">
                      <div className="truncate text-[10px] text-muted-foreground">{l}</div>
                      <div className="hq-num truncate text-[13px] font-semibold text-white">{v}</div>
                    </div>
                  ))}
                </div>
              )}

              {car && GROUPS.map((g) => {
                const list = fields.filter((d) => d.group === g.key);
                if (!list.length) return null;
                return (
                  <section key={g.key} className="mb-3" data-testid={`kam-group-${g.key}`}>
                    <h3 className="mb-1 px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{g.label}</h3>
                    <ul className="hq-group !rounded-xl">
                      {list.map((d) => {
                        const editable = editing && canEditField(d, isAdmin);
                        return (
                          <li key={d.key} className={`hq-row !min-h-[38px] !gap-2 !px-2.5 !py-1.5 ${editable ? "!flex-col !items-stretch !gap-1" : "!items-start"}`} data-field={d.key}>
                            <span className={`${editable ? "" : "w-[40%] shrink-0"} text-[12px] leading-5 text-muted-foreground`}>{d.label}</span>
                            {editable ? (
                              <Input d={d} value={form[d.key] ?? ""} onChange={(v) => setForm((f) => ({ ...f, [d.key]: v }))} />
                            ) : (
                              <span className="min-w-0 flex-1 whitespace-pre-wrap break-words text-right text-[13px] leading-5 text-white">{show(d, car[d.key], optLabels(d))}</span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                );
              })}

              {car && isAdmin && expenses && (
                <section className="mb-4" data-testid="kam-expenses">
                  <h3 className="mb-1 px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Costs · {expenses.length} · {money(expTotal)}</h3>
                  <ul className="hq-group">
                    {expenses.map((e) => (
                      <li key={e.id} className="hq-row !py-2 text-[14px]">
                        <span className="min-w-0 flex-1 truncate">{e.description}<span className="block text-[11px] text-muted-foreground">{[e.category, e.date].filter(Boolean).join(" · ")}</span></span>
                        <span className="hq-num">{money(e.amount)}</span>
                      </li>
                    ))}
                    {!expenses.length && <li className="hq-row text-[13px] text-muted-foreground">No expenses yet.</li>}
                  </ul>
                  <p className="mt-1 px-1 text-[11px] text-muted-foreground">Add or remove costs in KorAuto Manager.</p>
                </section>
              )}
            </>
          )}
        </div>

        {ready && car && (
          <div className={`border-t border-white/10 px-3 pt-2 ${pane ? "pb-2" : "pb-[calc(8px+env(safe-area-inset-bottom))]"}`}>
            {formErr && <p className="mb-2 text-[13px] text-[hsl(var(--destructive))]" role="alert">{formErr}</p>}
            {editing ? (
              <div className="grid grid-cols-2 gap-2">
                <button type="button" className="hq-btn !h-10" data-tone="plain" onClick={cancelEdit} data-testid="kam-cancel">Cancel</button>
                <button type="button" className="hq-btn !h-10" onClick={askSave} data-testid="kam-save">Save</button>
              </div>
            ) : (
              <button type="button" className="hq-btn !h-10 w-full" onClick={startEdit} data-testid="kam-edit"><Pencil className="h-4 w-4" /> Edit</button>
            )}
          </div>
        )}
      </div>
  );
  const dialog = confirm && <Confirm changes={confirm} busy={saving} onBack={() => setConfirm(null)} onSave={doSave} />;
  if (pane) return <div className="h-full min-h-0" data-testid="kam-car-detail">{card}{dialog}</div>;
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 backdrop-blur-sm" style={{ paddingLeft: "var(--sal)", paddingRight: "var(--sar)" }} onClick={() => !editing && onClose()} data-testid="kam-car-detail">
      {card}
      {dialog}
    </div>
  );
}
