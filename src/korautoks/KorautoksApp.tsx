import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, CarFront, ChevronDown, ExternalLink, Lock, Search, ShieldCheck } from "lucide-react";
import { FN_BASE } from "@/lib/fn";
import { useAuth } from "@/hub/auth";

/** korautoks.com car lookup. Read-only: the edge function `korautoks` only issues GETs. */
const API = `${FN_BASE}/korautoks`;

type Item = {
  id: string; name?: string; brand?: string; model?: string; year?: number; price?: number; mileage?: string; mileage_num?: number;
  fuel?: string; transmission?: string; lot?: string; vin?: string; plate_number?: string; primary_image_url?: string; image_count?: number;
  is_published?: boolean; inventory_hidden?: boolean; sold_status?: string | null; external_source?: string; origin_country?: string;
  updated_at?: string; _match?: string;
};
type Detail = { car: Record<string, any>; images: string[]; publicUrl: string; mode?: string };

async function api<T>(path: string, token: string | null): Promise<T> {
  const r = await fetch(`${API}/${path}`, { headers: { Authorization: `Bearer ${token || ""}` } });
  const j = await r.json().catch(() => ({ error: `HTTP ${r.status}` }));
  if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
  return j as T;
}

const eur = (n?: number | null) => (n == null || !Number.isFinite(Number(n)) ? "—" : `€${Number(n).toLocaleString("de-DE")}`);
const dt = (iso?: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(+d) ? String(iso) : d.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Belgrade" }) + " CEST";
};
const yes = (v: any) => (v === true ? "Yes" : v === false ? "No" : v == null || v === "" ? "—" : String(v));
const title = (c: Partial<Item>) => c.name || [c.brand, c.model].filter(Boolean).join(" ") || "Car";

function Chip({ tone = "zinc", children }: { tone?: "green" | "amber" | "red" | "zinc" | "sky"; children: ReactNode }) {
  const cls = { green: "bg-emerald-400/12 text-emerald-200", amber: "bg-amber-300/12 text-amber-200", red: "bg-red-400/12 text-red-200", zinc: "bg-white/[0.07] text-white/75", sky: "bg-sky-400/12 text-sky-200" }[tone];
  return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${cls}`}>{children}</span>;
}

function StatusChips({ c }: { c: Partial<Item> & Record<string, any> }) {
  return (
    <div className="flex flex-wrap gap-1">
      {c.is_published ? <Chip tone="green">Published</Chip> : <Chip tone="amber">Not published</Chip>}
      {c.inventory_hidden && <Chip tone="red">Hidden</Chip>}
      {c.sold_status && <Chip tone="red">{c.sold_status}</Chip>}
      {c.price_locked && <Chip tone="sky"><Lock className="h-2.5 w-2.5" /> Price locked</Chip>}
      {c.description_locked && <Chip tone="sky"><Lock className="h-2.5 w-2.5" /> Description locked</Chip>}
      {c.duplicate_of_original && <Chip>Duplicate</Chip>}
    </div>
  );
}

function Rows({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
      {rows.map(([k, v]) => (
        <div key={k} className="flex items-start justify-between gap-3 border-b border-white/[0.05] py-1.5 text-[13px]">
          <dt className="shrink-0 text-muted-foreground">{k}</dt>
          <dd className="min-w-0 break-words text-right text-white">{v ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

function Section({ title, children, open = true, testid }: { title: string; children: ReactNode; open?: boolean; testid?: string }) {
  const [o, setO] = useState(open);
  return (
    <section className="hq-card p-4" data-testid={testid}>
      <button onClick={() => setO(!o)} className="flex w-full items-center justify-between text-left">
        <h3 className="t-headline">{title}</h3>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${o ? "rotate-180" : ""}`} />
      </button>
      {o && <div className="mt-3">{children}</div>}
    </section>
  );
}

/** Collapsible tree for the complete raw record (every field). */
function Tree({ v, depth = 0, name }: { v: any; depth?: number; name?: string }) {
  const [open, setOpen] = useState(depth < 1);
  const isObj = v && typeof v === "object";
  if (!isObj)
    return (
      <div className="flex gap-2 py-0.5 font-mono text-[11.5px]">
        {name != null && <span className="shrink-0 text-primary">{name}:</span>}
        <span className="min-w-0 break-all text-white/85">{v === null ? "null" : typeof v === "string" ? v : JSON.stringify(v)}</span>
      </div>
    );
  const entries = Array.isArray(v) ? v.map((x, i) => [String(i), x] as const) : Object.entries(v);
  return (
    <div className="font-mono text-[11.5px]">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-1 py-0.5 text-left text-primary">
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? "" : "-rotate-90"}`} />
        {name ?? "record"} <span className="text-muted-foreground">{Array.isArray(v) ? `[${v.length}]` : `{${entries.length}}`}</span>
      </button>
      {open && <div className="ml-3 border-l border-white/[0.07] pl-2">{entries.map(([k, x]) => <Tree key={k} name={k} v={x} depth={depth + 1} />)}</div>}
    </div>
  );
}

function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const [i, setI] = useState(0);
  useEffect(() => setI(0), [images]);
  if (!images.length) return <div className="flex aspect-[16/10] items-center justify-center rounded-2xl bg-foreground/[0.05]"><CarFront className="h-10 w-10 text-white/55" /></div>;
  return (
    <div data-testid="kks-gallery" className="min-w-0">
      <div className="on-media relative aspect-[16/10] overflow-hidden rounded-2xl bg-black">
        <img src={images[i]} alt={alt} referrerPolicy="no-referrer" className="h-full w-full object-contain" />
        <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] text-white">{i + 1} / {images.length}</span>
      </div>
      <div className="no-scrollbar mt-2 flex gap-1.5 overflow-x-auto">
        {images.map((src, k) => (
          <button key={src + k} onClick={() => setI(k)} className={`h-12 w-16 shrink-0 overflow-hidden rounded-xl ring-2 transition-opacity ${k === i ? "ring-primary" : "ring-transparent opacity-70"}`} aria-label={`Photo ${k + 1}`}>
            <img src={src} alt="" loading="lazy" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}

function CarDetail({ d, onBack }: { d: Detail; onBack: () => void }) {
  const c = d.car;
  const x = c.details || {};
  const ins = x.insurance || {};
  const fr = x.first_registration;
  const images = d.images.length ? d.images : (x.images?.big || (x.photos || []).map((p: any) => p.url) || []).filter(Boolean);
  const opts = (x.options?.entries || []) as { labelEn?: string; labelKo?: string; group?: string }[];
  const diag = (x.diagnosis?.items || []) as { name?: string; resultEn?: string; result?: string; resultCode?: string }[];
  const inspImgs = ((x.inspectionReport?.images || x.inspect?.images || []) as { path?: string; title?: string }[]).filter((p) => p.path);
  const desc = c.description || x.descriptionEn || x.description || "";
  return (
    <article className="space-y-3" data-testid="kks-detail">
      <button onClick={onBack} className="press flex items-center gap-1.5 text-[15px] text-primary lg:hidden"><ArrowLeft className="h-4 w-4" /> Results</button>
      <div className="hq-card p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <Gallery images={images} alt={title(c)} />
          <div className="min-w-0">
            <h2 className="t-title2 text-white" data-testid="kks-title">{title(c)} <span className="text-white/45">{c.year}</span></h2>
            <div className="mt-1 text-[13px] text-muted-foreground">{[c.generation, c.version].filter(Boolean).join(" · ")}</div>
            <div className="mt-3 flex items-baseline gap-3">
              <span className="hq-num hq-big text-white">{eur(c.price)}</span>
              {x.original_price && x.discount_pct ? <span className="text-sm text-white/45 line-through">{eur(x.original_price)}</span> : null}
            </div>
            <div className="mt-2"><StatusChips c={c} /></div>
            <Rows rows={[["VIN", <span className="font-mono">{c.vin || "—"}</span>], ["Lot", <span className="font-mono">{c.lot || "—"}</span>], ["Plate", <span className="font-mono">{c.plate_number || "—"}</span>], ["Mileage", c.mileage || (c.mileage_num != null ? `${c.mileage_num} km` : "—")]]} />
            <div className="mt-3 flex flex-wrap gap-2">
              <a href={d.publicUrl} target="_blank" rel="noopener noreferrer" className="hq-btn" data-testid="kks-public-link">
                View on korautoks.com <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
              {c.external_url && <a href={c.external_url} target="_blank" rel="noopener noreferrer" className="hq-btn" data-tone="plain">Source listing <ExternalLink className="h-3.5 w-3.5" /></a>}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <Section title="Status & admin" testid="kks-admin">
          <Rows rows={[
            ["Published", yes(c.is_published)], ["Hidden from inventory", yes(c.inventory_hidden)], ["Sold status", c.sold_status || "—"], ["Sold detected", dt(c.sold_detected_at)],
            ["Price locked", yes(c.price_locked)], ["Description locked", yes(c.description_locked)], ["Duplicate of original", yes(c.duplicate_of_original)], ["Verified", dt(c.verified_at)],
            ["Badges", (c.badges || []).length ? (c.badges as string[]).join(", ") : "—"], ["Price before discount", x.discount_pct && x.original_price ? eur(x.original_price) : "—"], ["Discount", x.discount_pct ? `${x.discount_pct}%` : "—"],
            ["Pricing mode", x.pricing_mode || x.pricing?.formula || "—"], ["Source price (KRW)", x.pricing?.originalKrw ? Number(x.pricing.originalKrw).toLocaleString("de-DE") : x.priceKrw ? String(x.priceKrw) : "—"],
            ["Created", dt(c.created_at)], ["Updated", dt(c.updated_at)],
          ]} />
        </Section>
        <Section title="Identifiers & source">
          <Rows rows={[
            ["Catalog id", <span className="font-mono text-[11.5px]">{c.id}</span>], ["VIN", c.vin || "—"], ["Lot", c.lot || "—"], ["Plate", c.plate_number || "—"], ["Plate last 4", c.plate_last4 || "—"],
            ["Source", c.source_label || c.external_source || "—"], ["External id", c.external_id || "—"], ["Encar vehicle id", x.encarVehicleId ?? "—"], ["API car id", x.apiCarId ?? "—"],
            ["External URL", c.external_url ? <a className="text-primary underline" href={c.external_url} target="_blank" rel="noopener noreferrer">open</a> : "—"], ["Origin", c.origin_country || "—"],
            ["Location", [x.location?.city?.name, x.location?.country?.name].filter(Boolean).join(", ") || "—"],
          ]} />
        </Section>
        <Section title="Specs">
          <Rows rows={[
            ["Brand", c.brand], ["Model", c.model], ["Generation", c.generation || "—"], ["Version", c.version || "—"], ["Year", c.year ?? "—"],
            ["First registration", fr ? `${fr.day ?? ""}.${fr.month ?? ""}.${fr.year ?? ""}` : "—"], ["Mileage", c.mileage || "—"], ["Fuel", c.fuel || "—"], ["Transmission", c.transmission || "—"],
            ["Drivetrain", c.drivetrain || "—"], ["Body", c.body_type || x.bodyTypeEn || "—"], ["Colour", c.color || "—"], ["Seats", c.seats ?? "—"], ["Engine", x.engineCc ? `${x.engineCc} cc` : "—"],
            ["Power", c.horse_power ? `${c.horse_power} hp` : "—"], ["Photos", c.image_count ?? images.length],
          ]} />
        </Section>
        <Section title="Condition & history" testid="kks-history">
          <Rows rows={[
            ["Accident free", yes(c.accident_free)], ["Total accidents", c.total_accidents ?? "—"], ["Summary", x.accidentHistory?.summary || "—"],
            ["Owner changes", ins.ownerChangeCnt ?? "—"], ["Plate changes", ins.carNoChangeCnt ?? "—"], ["Insurance first date", ins.firstDate || "—"],
            ["Own-damage claims", ins.myAccidentCnt != null ? `${ins.myAccidentCnt} (${Number(ins.myAccidentCost || 0).toLocaleString("de-DE")} KRW)` : "—"],
            ["Other-party claims", ins.otherAccidentCnt != null ? `${ins.otherAccidentCnt} (${Number(ins.otherAccidentCost || 0).toLocaleString("de-DE")} KRW)` : "—"],
            ["Total loss", ins.totalLossCnt ?? "—"], ["Flood", ins.floodTotalLossCnt || ins.floodPartLossCnt ? "Yes" : ins.floodDate ? ins.floodDate : "No"], ["Theft", ins.robberCnt ?? "—"],
            ["Use", (ins.useLabels || []).map((u: any) => u.labelEn).filter(Boolean).join(", ") || "—"], ["Rental / business", yes(ins.business ? true : ins.business === 0 ? false : null)],
            ["Waterlog flag", yes(x.inspectFlags?.waterlog)], ["Simple repair flag", yes(x.inspectFlags?.simpleRepair)], ["Warranty", x.warranty?.companyNameEn || x.warranty?.companyName || "—"],
          ]} />
        </Section>
      </div>

      {diag.length > 0 && (
        <Section title={`Diagnosis (${diag.length})`} open={false}>
          <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
            {diag.map((g, i) => (
              <li key={i} className="flex justify-between gap-2 rounded-xl bg-foreground/[0.045] px-3 py-2 text-[13px]">
                <span className="text-white/80">{String(g.name || "").replace(/_/g, " ").toLowerCase()}</span>
                <span className={g.resultCode === "NORMAL" ? "text-[hsl(var(--success))]" : "text-[hsl(var(--orange))]"}>{g.resultEn || g.result}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}
      {(inspImgs.length > 0 || x.inspectionReport?.pageUrl) && (
        <Section title="Inspection report" open={false}>
          <div className="flex flex-wrap gap-2">
            {inspImgs.map((p, i) => (
              <a key={i} href={`https://ci.encar.com${p.path}`} target="_blank" rel="noopener noreferrer" className="hq-btn !h-8" data-tone="plain">{(p.title || `Page ${i + 1}`).split("\n")[0]} ↗</a>
            ))}
            {x.inspectionReport?.pageUrl && <a href={x.inspectionReport.pageUrl} target="_blank" rel="noopener noreferrer" className="hq-btn !h-8" data-tone="plain">Full report on Encar ↗</a>}
          </div>
        </Section>
      )}
      {opts.length > 0 && (
        <Section title={`Options (${opts.length})`} open={false}>
          <ul className="flex flex-wrap gap-1.5">
            {opts.map((o, i) => <li key={i} className="rounded-full bg-foreground/[0.06] px-2.5 py-1 text-[13px] text-white/80">{o.labelEn || o.labelKo}</li>)}
          </ul>
        </Section>
      )}
      {desc && (
        <Section title="Description" open={false}>
          <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-white/85">{desc}</p>
        </Section>
      )}
      <Section title="All fields (raw record)" open={false} testid="kks-raw">
        <div className="max-h-[70vh] overflow-auto"><Tree v={c} /></div>
      </Section>
    </article>
  );
}

export default function KorautoksApp() {
  const { token } = useAuth();
  const [params, setParams] = useSearchParams();
  const q = params.get("q") || "";
  const carId = params.get("car") || "";
  const [input, setInput] = useState(q);
  const [res, setRes] = useState<{ items: Item[]; kinds: string[]; loading: boolean; error: string | null; mode?: string }>({ items: [], kinds: [], loading: false, error: null });
  const [detail, setDetail] = useState<{ d: Detail | null; loading: boolean; error: string | null }>({ d: null, loading: false, error: null });

  useEffect(() => setInput(q), [q]);
  useEffect(() => {
    if (!token || q.trim().length < 3) { setRes({ items: [], kinds: [], loading: false, error: null }); return; }
    let alive = true;
    setRes((r) => ({ ...r, loading: true, error: null }));
    api<{ items: Item[]; kinds: string[]; mode?: string }>(`search?q=${encodeURIComponent(q)}`, token)
      .then((j) => {
        if (!alive) return;
        setRes({ items: j.items, kinds: j.kinds, loading: false, error: null, mode: j.mode });
        if (!carId && j.items.length === 1) setParams((p) => { p.set("car", j.items[0].id); return p; }, { replace: true });
      })
      .catch((e) => alive && setRes({ items: [], kinds: [], loading: false, error: String(e.message || e) }));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, token]);
  useEffect(() => {
    if (!token || !carId) { setDetail({ d: null, loading: false, error: null }); return; }
    let alive = true;
    setDetail({ d: null, loading: true, error: null });
    api<Detail>(`car?id=${encodeURIComponent(carId)}`, token)
      .then((d) => alive && setDetail({ d, loading: false, error: null }))
      .catch((e) => alive && setDetail({ d: null, loading: false, error: String(e.message || e) }));
    return () => { alive = false; };
  }, [carId, token]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = input.trim();
    setParams(v ? { q: v } : {});
  };
  const open = (id: string) => setParams((p) => { p.set("car", id); return p; });
  const back = () => setParams((p) => { p.delete("car"); return p; });
  const kindLabel = useMemo(() => res.kinds.map((k) => ({ vin: "VIN", lot: "lot", plate: "plate", id: "id" }[k] || k)).join(" / "), [res.kinds]);

  return (
    <main className="mx-auto max-w-[1440px] px-3 pb-12 pt-4 sm:px-5" data-testid="korautoks-page">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="sr-only">korautoks.com</h1>
          <p className="flex items-center gap-1.5 text-[13px] text-muted-foreground"><ShieldCheck className="h-3.5 w-3.5" /> Search &amp; view only — nothing here can change the website.</p>
        </div>
        <a href="https://korautoks.com" target="_blank" rel="noopener noreferrer" className="press flex items-center gap-1 text-[14px] text-primary">Open website <ArrowUpRight className="h-3 w-3" /></a>
      </div>
      <form onSubmit={submit} className="mt-3 flex gap-2">
        <label className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="VIN, lot ID or plate (e.g. 179가 3084)"
            className="w-full rounded-full bg-foreground/[0.07] py-2.5 pl-10 pr-4 text-[16px] text-white placeholder:text-white/55 focus:outline-none focus:ring-2 focus:ring-primary/40"
            aria-label="Search korautoks.com cars"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            data-testid="kks-search"
          />
        </label>
        <button className="hq-btn !h-11 !px-5 shrink-0">Search</button>
      </form>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[380px_minmax(0,1fr)]">
        <section className={`${carId ? "hidden lg:block" : ""} min-w-0`}>
          <div className="mb-2 text-[13px] text-muted-foreground">
            {res.loading ? "Searching…" : q.trim().length >= 3 ? `${res.items.length} result${res.items.length === 1 ? "" : "s"}${kindLabel ? ` · matched by ${kindLabel}` : ""}${res.mode === "public" ? " · published cars" : ""}` : "Search by VIN (17 chars), Encar lot number, or Korean plate (spaces/dashes ignored)."}
          </div>
          {res.error && <div className="rounded-2xl bg-[hsl(var(--destructive)/.12)] p-3 text-sm text-[hsl(var(--destructive))]">{res.error}</div>}
          <ul className="space-y-2.5" data-testid="kks-results">
            {res.items.map((c) => (
              <li key={c.id}>
                <button onClick={() => open(c.id)} className={`press flex w-full gap-3 rounded-2xl p-2 text-left transition-colors ${carId === c.id ? "bg-primary/15 ring-2 ring-primary/50" : "bg-foreground/[0.045]"}`}>
                  <div className="h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-foreground/[0.06]">
                    {c.primary_image_url ? <img src={c.primary_image_url} alt="" loading="lazy" referrerPolicy="no-referrer" className="h-full w-full object-cover" /> : <CarFront className="m-auto mt-5 h-6 w-6 text-white/55" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="truncate text-sm font-medium text-white">{title(c)} <span className="text-white/45">{c.year}</span></div>
                      <div className="hq-num shrink-0 text-sm text-white">{eur(c.price)}</div>
                    </div>
                    <div className="truncate font-mono text-[12px] text-white/55">{[c.lot && `Lot ${c.lot}`, c.plate_number, c.vin].filter(Boolean).join(" · ")}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-1">
                      {c._match && <Chip tone="sky">{c._match.toUpperCase()} match</Chip>}
                      <StatusChips c={c} />
                    </div>
                  </div>
                </button>
              </li>
            ))}
            {!res.loading && q.trim().length >= 3 && !res.items.length && !res.error && (
              <li className="rounded-2xl bg-foreground/[0.045] p-6 text-center text-sm text-muted-foreground">No car found for “{q}”.</li>
            )}
          </ul>
        </section>
        <section className={`${carId ? "" : "hidden lg:block"} min-w-0`}>
          {detail.loading && <div className="hq-card h-80 animate-pulse" />}
          {detail.error && <div className="rounded-2xl bg-[hsl(var(--destructive)/.12)] p-3 text-sm text-[hsl(var(--destructive))]">{detail.error}</div>}
          {detail.d && <CarDetail d={detail.d} onBack={back} />}
          {!carId && <div className="hq-card flex h-60 items-center justify-center text-sm text-muted-foreground">Select a car to see every field.</div>}
        </section>
      </div>
    </main>
  );
}
