/**
 * Ship grouping — a port of KorAuto Manager's `lib/ships.ts` + the grouping in `components/cars-view.tsx`,
 * so the hub divides cars into the same shipment groups, with the same labels and order.
 */
export const UNASSIGNED_SHIP_KEY = "unassigned";
export const SOLD_KEY = "__sold_archive__";
export const ARCHIVE_KEY = "__archived__";
const KNOWN = ["ah shin", "hae shin", "young shin", "sang shin", "gmt astro"];
const UNASSIGNED_ALIASES = ["cig", "unassigned", "미배정", "unassigned · 미배정"];

type AnyCar = Record<string, unknown> & { id: string };
const str = (v: unknown) => (v === null || v === undefined ? "" : String(v));

const isUnassigned = (raw: string) => UNASSIGNED_ALIASES.some((a) => raw.includes(a));

export function shipBaseKey(name?: string | null): string {
  const raw = (name ?? "").toLowerCase().replace(/[^a-z0-9가-힣]+/g, " ").trim();
  if (!raw) return "";
  if (isUnassigned(raw)) return UNASSIGNED_SHIP_KEY;
  return KNOWN.find((k) => raw.includes(k)) ?? raw;
}

export function voyageCode(name?: string | null): string {
  const raw = (name ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  if (!raw) return "";
  const base = KNOWN.find((k) => raw.includes(k)) ?? (isUnassigned(raw) ? UNASSIGNED_SHIP_KEY : undefined);
  const rest = base ? raw.replace(base, " ") : raw;
  const m = rest.match(/\bv?\s?(\d{3,5}[a-z]?)\b/);
  return m ? m[1] : "";
}

export function shipKey(name?: string | null): string {
  const base = shipBaseKey(name);
  if (!base) return "";
  const v = voyageCode(name);
  return v ? `${base} ${v}` : base;
}

export function splitGroupKey(key: string): { base: string; arrival: string } {
  const i = key.indexOf("@");
  return i === -1 ? { base: key, arrival: "" } : { base: key.slice(0, i), arrival: key.slice(i + 1) };
}

/** Vessel + voyage + arrival date in Durrës; every unassigned car shares one group. */
export function shipGroupKey(name?: string | null, arrival?: string | null): string {
  const base = shipKey(name);
  if (!base) return "";
  if (base === UNASSIGNED_SHIP_KEY || base.startsWith(`${UNASSIGNED_SHIP_KEY} `)) return UNASSIGNED_SHIP_KEY;
  const a = (arrival ?? "").toString().slice(0, 10);
  return a ? `${base}@${a}` : base;
}

export function shipLabel(key: string, fallback = "No shipment"): string {
  if (!key) return fallback;
  const { base, arrival } = splitGroupKey(key);
  const suffix = arrival ? ` · ${arrival.split("-").reverse().join("/")}` : "";
  if (base === UNASSIGNED_SHIP_KEY || base.startsWith(`${UNASSIGNED_SHIP_KEY} `)) return `Unassigned${suffix}`;
  const m = base.match(/^(.*?)\s(\d{3,5}[a-z]?)$/);
  if (m) return `${m[1].replace(/\b\w/g, (c) => c.toUpperCase())} V.${m[2].toUpperCase()}${suffix}`;
  return base.replace(/\b\w/g, (m2) => m2.toUpperCase()) + suffix;
}

export const carVessel = (c: AnyCar): string => str(c.shipping_name) || str(c.tracking_vessel);

/** Newest relevant date for a car — arrival/ETA first, then departure. */
export function carShipDate(c: AnyCar): string {
  const all = [c.tracking_eta, c.shipping_date, c.tracking_etd, c.sale_date].filter(Boolean).map(String).sort();
  return all.length ? all[all.length - 1] : "";
}

const fdate = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export type SortMode = "eta_asc" | "eta_desc";
export type ShipGroup<T> = { key: string; label: string; span: string; list: T[] };

/**
 * Same as KorAuto Manager's `grouped`: archived cars → "Archived", sold cars in Autosallon → "Sold — archive",
 * everything else by ship. "No shipment"/"Unassigned" are pinned to the bottom (order swapped on the Sales tab).
 * Default sort: Sales = arriving soonest first, other tabs = newest shipment first.
 */
export function groupByShip<T extends AnyCar>(rows: T[], stage?: string, sort: SortMode = stage === "sales" ? "eta_asc" : "eta_desc"): ShipGroup<T>[] {
  const map = new Map<string, T[]>();
  for (const c of rows) {
    const key = str(c.status) === "archived" ? ARCHIVE_KEY
      : stage === "autosallon" && c.status === "sold" ? SOLD_KEY
        : shipGroupKey(carVessel(c), str(c.tracking_eta) || carShipDate(c) || "");
    map.set(key, [...(map.get(key) ?? []), c]);
  }
  const latest = (list: T[]) => list.map(carShipDate).filter(Boolean).sort().pop() ?? "";
  const soonest = (list: T[]) => list.map(carShipDate).filter(Boolean).sort()[0] ?? "";
  const pin = (k: string) => {
    const noShip = !k;
    const unassigned = splitGroupKey(k).base === UNASSIGNED_SHIP_KEY;
    if (stage === "sales") {
      if (noShip) return 4;
      if (unassigned) return 3;
    } else {
      if (unassigned) return 4;
      if (noShip) return 3;
    }
    if (k === ARCHIVE_KEY) return 2;
    if (k === SOLD_KEY) return 1;
    return 0;
  };
  return [...map.entries()]
    .sort((a, b) => {
      if (pin(a[0]) !== pin(b[0])) return pin(a[0]) - pin(b[0]);
      if (sort === "eta_asc") {
        const sa = soonest(a[1]), sb = soonest(b[1]);
        if (sa !== sb) return (sa || "9999").localeCompare(sb || "9999");
        return b[1].length - a[1].length;
      }
      const la = latest(a[1]), lb = latest(b[1]);
      if (la !== lb) return lb.localeCompare(la);
      return b[1].length - a[1].length;
    })
    .map(([key, list]) => {
      if (key === SOLD_KEY || key === ARCHIVE_KEY) {
        return {
          key,
          label: key === SOLD_KEY ? "Sold — archive" : "Archived",
          span: "",
          list: [...list].sort((a, b) => shipLabel(shipKey(carVessel(a))).localeCompare(shipLabel(shipKey(carVessel(b))))),
        };
      }
      const dates = list.map((c) => str(c.shipping_date)).filter(Boolean).sort();
      const departure = !dates.length ? "" : dates[0] === dates[dates.length - 1] ? fdate(dates[0]) : `${fdate(dates[0])} – ${fdate(dates[dates.length - 1])}`;
      const etas = list.map((c) => str(c.tracking_eta)).filter(Boolean).sort();
      const arrived = list.length > 0 && list.every((c) => c.tracking_active === false);
      const eta = etas.length ? `${arrived ? "Arrival" : "ETA"} ${fdate(etas[etas.length - 1])}` : "";
      return { key, label: shipLabel(key), span: [departure, eta].filter(Boolean).join(" · "), list };
    });
}
