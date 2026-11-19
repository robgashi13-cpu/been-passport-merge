/**
 * KorAuto Manager car fields, labels and edit rules — mirrors korautomanager's
 * `car-form-dialog.tsx` (same fields, same tabs, same value conversion) so a save
 * from the hub writes exactly what the manager's own Edit dialog would, but only
 * for the fields the user actually changed.
 */
export type Role = "admin" | "worker" | "accountant";
export type FieldKind = "text" | "int" | "money" | "date" | "textarea" | "select" | "readonly";
export type GroupKey = "vehicle" | "buyer" | "payments" | "shipment" | "record" | "other";
export type FieldDef = {
  key: string;
  label: string;
  kind: FieldKind;
  group: GroupKey;
  /** Editable in korautomanager's Edit dialog. */
  edit?: boolean;
  /** Only admins see/edit it in the manager's Edit dialog (Payments tab). */
  adminOnly?: boolean;
  options?: [string, string][];
  wide?: boolean;
  /** Money values (formatted as €). */
  money?: boolean;
};

export const GROUPS: { key: GroupKey; label: string }[] = [
  { key: "vehicle", label: "Vehicle" },
  { key: "buyer", label: "Buyer" },
  { key: "payments", label: "Payments" },
  { key: "shipment", label: "Shipment" },
  { key: "record", label: "Record" },
  { key: "other", label: "Other" },
];

export const SALE_STAGES: [string, string][] = [["sales", "Sales"], ["shipped", "Shipped"], ["autosallon", "Autosalloni"], ["completed", "Completed"]];
export const STOCK_STATUS: [string, string][] = [["in_stock", "In stock"], ["sold", "Sold"]];
export const DELIVERY: [string, string][] = [
  ["coming_to_stock", "Coming to stock"], ["stock", "Stok"], ["not_started", "Not started"],
  ["preparing", "Preparing"], ["in_transit", "In transit"], ["delivered", "Delivered"],
];
export const PAYMENT_METHODS: [string, string][] = [["Cash", "Cash"], ["Bank", "Bank"], ["Mixed", "Mixed"]];

const f = (key: string, label: string, kind: FieldKind, group: GroupKey, extra: Partial<FieldDef> = {}): FieldDef => ({ key, label, kind, group, ...extra });

export const FIELDS: FieldDef[] = [
  // Vehicle tab (everyone)
  f("make", "Make", "text", "vehicle", { edit: true }),
  f("model", "Model", "text", "vehicle", { edit: true }),
  f("year", "Year", "int", "vehicle", { edit: true }),
  f("km", "KM", "int", "vehicle", { edit: true }),
  f("color", "Color", "text", "vehicle", { edit: true }),
  f("plate_number", "Plate number", "text", "vehicle", { edit: true }),
  f("vin", "VIN", "text", "vehicle", { edit: true, wide: true }),
  f("shipping_name", "Ship name", "text", "vehicle", { edit: true }),
  f("shipping_date", "Ship date", "date", "vehicle", { edit: true }),
  f("seller", "Seller (partner)", "text", "vehicle", { edit: true }),
  f("sale_status", "Stage", "select", "vehicle", { edit: true, options: SALE_STAGES }),
  f("status", "Stock status", "select", "vehicle", { edit: true, options: STOCK_STATUS }),
  f("delivery_status", "Delivery", "select", "vehicle", { edit: true, options: DELIVERY }),
  f("notes", "Notes", "textarea", "vehicle", { edit: true, wide: true }),
  f("image_url", "Image URL", "readonly", "vehicle", { wide: true }),
  // Buyer tab (everyone)
  f("buyer", "Buyer name", "text", "buyer", { edit: true }),
  f("buyer_personal_id", "Personal ID", "text", "buyer", { edit: true }),
  f("buyer_phone", "Phone", "text", "buyer", { edit: true }),
  f("buyer_address", "Address", "text", "buyer", { edit: true }),
  f("invoice_description", "Invoice description", "textarea", "buyer", { edit: true, wide: true }),
  f("delivery_notes", "Delivery notes", "textarea", "buyer", { edit: true, wide: true }),
  // Payments tab (admin only in the manager)
  f("buy_price", "Cost to buy (Korea)", "money", "payments", { edit: true, adminOnly: true, money: true }),
  f("sale_price", "Sold price (client)", "money", "payments", { edit: true, adminOnly: true, money: true }),
  f("amount_paid_to_korea", "Paid to Korea", "money", "payments", { edit: true, adminOnly: true, money: true }),
  f("paid_date_to_korea", "Paid to Korea date", "date", "payments", { edit: true, adminOnly: true }),
  f("amount_paid_cash", "Paid by client — cash", "money", "payments", { edit: true, adminOnly: true, money: true }),
  f("amount_paid_bank", "Paid by client — bank", "money", "payments", { edit: true, adminOnly: true, money: true }),
  f("deposit", "Deposit", "money", "payments", { edit: true, adminOnly: true, money: true }),
  f("deposit_date", "Deposit date", "date", "payments", { edit: true, adminOnly: true }),
  f("services_cost", "Services cost", "money", "payments", { edit: true, adminOnly: true, money: true }),
  f("tax", "Tax", "money", "payments", { edit: true, adminOnly: true, money: true }),
  f("paid_date_from_client", "Client payment date", "date", "payments", { edit: true, adminOnly: true }),
  f("payment_method", "Payment method", "select", "payments", { edit: true, adminOnly: true, options: PAYMENT_METHODS }),
  f("transport_cost", "Transport cost", "money", "payments", { edit: true, adminOnly: true, money: true }),
  f("buy_date", "Buy date", "date", "payments", { edit: true, adminOnly: true }),
  f("sale_date", "Sale date", "date", "payments", { edit: true, adminOnly: true }),
  f("amount_paid_by_client", "Total paid by client (saved)", "readonly", "payments", { money: true }),
  f("transport_paid", "Transport paid", "readonly", "payments"),
  // Shipment / tracking (maintained by the manager's tracker — read-only there too)
  f("car_group", "Car group", "readonly", "shipment"),
  f("shipment_group_key", "Shipment group key", "readonly", "shipment"),
  f("tracking_status_label", "Tracking status", "readonly", "shipment"),
  f("tracking_status", "Tracking code", "readonly", "shipment"),
  f("tracking_vessel", "Vessel", "readonly", "shipment"),
  f("tracking_voyage", "Voyage", "readonly", "shipment"),
  f("tracking_container", "Container", "readonly", "shipment"),
  f("tracking_booking", "Booking", "readonly", "shipment"),
  f("tracking_departure_port", "Departure port", "readonly", "shipment"),
  f("tracking_arrival_port", "Arrival port", "readonly", "shipment"),
  f("tracking_destination", "Destination", "readonly", "shipment"),
  f("tracking_etd", "ETD", "readonly", "shipment"),
  f("tracking_eta", "ETA", "readonly", "shipment"),
  f("tracking_active", "Tracking active", "readonly", "shipment"),
  f("tracking_scan_status", "Scan status", "readonly", "shipment"),
  f("tracking_checked_at", "Last checked", "readonly", "shipment"),
  f("tracking_error", "Tracking error", "readonly", "shipment", { wide: true }),
  f("tracking_missing", "Missing info", "readonly", "shipment", { wide: true }),
  f("tracking_source_url", "Tracking source", "readonly", "shipment", { wide: true }),
  f("tracking_steps", "Tracking steps", "readonly", "shipment", { wide: true }),
  f("original_sales_group_label", "Original sales group", "readonly", "shipment"),
  f("original_sales_group_key", "Original sales group key", "readonly", "shipment"),
  f("original_sales_group_source", "Original group source", "readonly", "shipment"),
  f("original_sales_group_captured_at", "Original group captured", "readonly", "shipment"),
  // Record
  f("approval_status", "Approval", "readonly", "record"),
  f("rejection_reason", "Rejection reason", "readonly", "record", { wide: true }),
  f("approved_at", "Approved at", "readonly", "record"),
  f("approved_by", "Approved by", "readonly", "record"),
  f("created_by", "Created by", "readonly", "record"),
  f("created_at", "Created", "readonly", "record"),
  f("updated_at", "Updated", "readonly", "record"),
  f("id", "Record ID", "readonly", "record", { wide: true }),
];

export const FIELD_BY_KEY = new Map(FIELDS.map((d) => [d.key, d]));

/** Every key of the row gets a place: known fields in their group, anything new under "Other". */
export function fieldsFor(row: Record<string, unknown>): FieldDef[] {
  const known = FIELDS.filter((d) => d.key in row);
  const extra = Object.keys(row)
    .filter((k) => !FIELD_BY_KEY.has(k))
    .sort()
    .map((k) => f(k, k.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase()), "readonly", "other", { wide: true }));
  return [...known, ...extra];
}

export const canEditField = (d: FieldDef, isAdmin: boolean) => !!d.edit && (!d.adminOnly || isAdmin);

/** String form value, like the manager's `s()` helper. */
export const toForm = (v: unknown) => (v === null || v === undefined ? "" : String(v));

export type FormState = Record<string, string>;

export function initialForm(row: Record<string, unknown>, isAdmin: boolean): FormState {
  const out: FormState = {};
  for (const d of FIELDS) if (canEditField(d, isAdmin)) out[d.key] = toForm(row[d.key]);
  return out;
}

const MONEY_ZERO_DEFAULT = new Set(["buy_price", "transport_cost", "amount_paid_cash", "amount_paid_bank", "deposit", "services_cost", "tax", "amount_paid_to_korea"]);

/** Convert one form value to what korautomanager's form would send for that column. */
export function toDb(key: string, v: string): unknown {
  const d = FIELD_BY_KEY.get(key);
  if (!d) return v;
  if (key === "make" || key === "model") return v.trim();
  if (d.kind === "int") return v === "" ? null : Number(v);
  if (d.kind === "money") {
    if (key === "sale_price") return v === "" ? null : Number(v);
    return v === "" ? (MONEY_ZERO_DEFAULT.has(key) ? 0 : null) : Number(v);
  }
  if (d.kind === "select") return v;
  return v === "" ? null : v;
}

export type Change = { key: string; label: string; from: string; to: string };

/** Fields the user changed (compared as form strings, so untouched fields never get rewritten). */
export function diffForm(row: Record<string, unknown>, form: FormState): Change[] {
  const out: Change[] = [];
  for (const [key, val] of Object.entries(form)) {
    const before = toForm(row[key]);
    const norm = (s: string) => (FIELD_BY_KEY.get(key)?.kind === "money" || FIELD_BY_KEY.get(key)?.kind === "int" ? (s === "" ? "" : String(Number(s))) : s);
    if (norm(before) !== norm(val)) out.push({ key, label: FIELD_BY_KEY.get(key)?.label ?? key, from: before, to: val });
  }
  return out;
}

/** Validation the manager applies (make/model required) plus numeric sanity for number inputs. */
export function validate(form: FormState): string | null {
  if ("make" in form && !form.make.trim()) return "Make and model required";
  if ("model" in form && !form.model.trim()) return "Make and model required";
  for (const [key, v] of Object.entries(form)) {
    const d = FIELD_BY_KEY.get(key);
    if (!d || v === "") continue;
    if ((d.kind === "int" || d.kind === "money") && !Number.isFinite(Number(v))) return `${d.label} must be a number`;
    if (d.kind === "int" && !Number.isInteger(Number(v))) return `${d.label} must be a whole number`;
    if (d.kind === "date" && !/^\d{4}-\d{2}-\d{2}$/.test(v)) return `${d.label} must be a date`;
  }
  return null;
}

/**
 * The update payload: only changed columns, converted like the manager does, plus the two
 * derived columns the manager recomputes (`amount_paid_by_client`, `car_group`) when their inputs change.
 */
export function buildPatch(row: Record<string, unknown>, form: FormState): Record<string, unknown> {
  const changes = diffForm(row, form);
  const patch: Record<string, unknown> = {};
  for (const c of changes) patch[c.key] = toDb(c.key, c.to);
  const changed = new Set(changes.map((c) => c.key));
  const val = (k: string) => (k in form ? form[k] : toForm(row[k]));
  if (["amount_paid_cash", "amount_paid_bank", "deposit"].some((k) => changed.has(k))) {
    const n = (k: string) => (val(k) === "" ? 0 : Number(val(k)));
    patch.amount_paid_by_client = n("amount_paid_cash") + n("amount_paid_bank") + n("deposit");
  }
  if (changed.has("shipping_name") || changed.has("shipping_date")) {
    const name = val("shipping_name");
    const date = val("shipping_date");
    patch.car_group = name ? `${date ? `${date} ` : ""}${name}` : null;
  }
  return patch;
}

/** Role resolution exactly like korautomanager's `useMyAccess`. */
export function resolveRole(roles: string[]): Role {
  return roles.includes("admin") ? "admin" : roles.includes("accountant") ? "accountant" : "worker";
}
export const ACCOUNTANT_TABS = ["sales", "shipped", "customs"];
/** Can this account open a car (`/cars/:id` belongs to the "cars" tab in the manager)? */
export function canOpenCars(role: Role, allowedTabs: string[] | null | undefined): boolean {
  if (role === "admin") return true;
  if (role === "accountant") return ACCOUNTANT_TABS.includes("cars");
  const a = allowedTabs ?? [];
  return a.includes("*") || a.includes("cars");
}

export const money = (v: unknown) => {
  const n = Number(v);
  if (v === null || v === undefined || v === "" || !Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(n);
};
