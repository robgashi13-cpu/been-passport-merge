import { useRef, useState } from "react";
import { Upload, Plane, Check, AlertCircle, Trash2, FileText, X } from "lucide-react";
import { useUser, FlightLog } from "@/contexts/UserContext";
import { countries } from "@/data/countries";
import iataToIso2 from "@/data/iataToIso2.json";
import { toast } from "sonner";

type ParsedFlight = {
    date: number;
    from: string;       // ISO2
    to: string;         // ISO2
    fromIata: string;
    toIata: string;
    airline?: string;
    flight?: string;
    depTime?: string;
    arrTime?: string;
    durationMin?: number;
    distanceKm?: number;
    aircraft?: string;
    tailNumber?: string;
    seat?: string;
    cabin?: string;
    confirmation?: string;
    notes?: string;
};

const IATA_MAP = iataToIso2 as Record<string, string>;

const normaliseHeader = (h: string) => h.trim().toLowerCase().replace(/[\s_-]+/g, "");

const findColumn = (headers: string[], candidates: string[]): number => {
    const map = headers.map(normaliseHeader);
    for (const c of candidates) {
        const idx = map.indexOf(normaliseHeader(c));
        if (idx !== -1) return idx;
    }
    return -1;
};

/** Tiny CSV parser supporting quoted fields. */
const parseCsv = (text: string): string[][] => {
    const rows: string[][] = [];
    let row: string[] = [];
    let cur = "";
    let inQ = false;
    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (inQ) {
            if (ch === '"') {
                if (text[i + 1] === '"') { cur += '"'; i++; } else { inQ = false; }
            } else cur += ch;
        } else {
            if (ch === '"') inQ = true;
            else if (ch === ",") { row.push(cur); cur = ""; }
            else if (ch === "\r") { /* skip */ }
            else if (ch === "\n") { row.push(cur); rows.push(row); row = []; cur = ""; }
            else cur += ch;
        }
    }
    if (cur.length || row.length) { row.push(cur); rows.push(row); }
    return rows.filter(r => r.some(c => c.trim().length > 0));
};

const extractIata = (value: string): string => {
    if (!value) return "";
    // matches a 3-letter code, possibly inside parentheses like "Frankfurt (FRA)"
    const m = value.match(/\b([A-Z]{3})\b/);
    return m ? m[1] : "";
};

const parseDate = (value: string): number => {
    if (!value) return Date.now();
    const t = Date.parse(value);
    if (!isNaN(t)) return t;
    // Try DD/MM/YYYY
    const m = value.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
    if (m) {
        const [, d, mo, y] = m;
        const year = y.length === 2 ? 2000 + parseInt(y) : parseInt(y);
        return new Date(year, parseInt(mo) - 1, parseInt(d)).getTime();
    }
    return Date.now();
};

const parseFlighty = (csv: string): { flights: ParsedFlight[]; skipped: number; total: number } => {
    const rows = parseCsv(csv);
    if (rows.length < 2) return { flights: [], skipped: 0, total: 0 };
    const headers = rows[0];

    const iDate = findColumn(headers, ["date", "depdate", "departuredate", "departure", "departuresched", "departurescheduled"]);
    const iFrom = findColumn(headers, ["from", "origin", "fromairport", "departure", "departureairport"]);
    const iTo = findColumn(headers, ["to", "destination", "destinationairport", "arrivalairport", "arrival"]);
    const iAirline = findColumn(headers, ["airline", "carrier"]);
    const iFlight = findColumn(headers, ["flight", "flightnumber", "flightno", "flightcode"]);
    const iFromCountry = findColumn(headers, ["fromcountry", "origincountry"]);
    const iToCountry = findColumn(headers, ["tocountry", "destinationcountry"]);
    const iDepTime = findColumn(headers, ["deptime", "departuretime", "depscheduled", "scheduleddeparture", "deparctualtime", "deplocal"]);
    const iArrTime = findColumn(headers, ["arrtime", "arrivaltime", "arrscheduled", "scheduledarrival", "arractualtime", "arrlocal"]);
    const iDuration = findColumn(headers, ["duration", "scheduledduration", "blocktime", "flighttime"]);
    const iDistance = findColumn(headers, ["distance", "distancekm", "distancemiles", "distancemi"]);
    const iAircraft = findColumn(headers, ["aircraft", "aircrafttype", "equipment", "plane", "planemodel"]);
    const iTail = findColumn(headers, ["tail", "tailnumber", "registration", "reg"]);
    const iSeat = findColumn(headers, ["seat", "seatnumber"]);
    const iCabin = findColumn(headers, ["cabin", "class", "seatclass", "cabinclass"]);
    const iConf = findColumn(headers, ["confirmation", "pnr", "bookingref", "recordlocator"]);
    const iNotes = findColumn(headers, ["notes", "note", "remarks"]);

    if (iFrom === -1 || iTo === -1) {
        return { flights: [], skipped: rows.length - 1, total: rows.length - 1 };
    }

    const flights: ParsedFlight[] = [];
    let skipped = 0;

    const toMin = (v: string): number | undefined => {
        if (!v) return undefined;
        const m = v.match(/(\d+):(\d+)/);
        if (m) return parseInt(m[1]) * 60 + parseInt(m[2]);
        const n = parseFloat(v);
        return isNaN(n) ? undefined : Math.round(n);
    };
    const toKm = (v: string, headerIdx: number): number | undefined => {
        if (!v) return undefined;
        const n = parseFloat(v.replace(/[^\d.]/g, ""));
        if (isNaN(n)) return undefined;
        const isMiles = headerIdx === iDistance && /mi/i.test(headers[headerIdx] || "");
        return isMiles ? Math.round(n * 1.60934) : Math.round(n);
    };

    for (let r = 1; r < rows.length; r++) {
        const row = rows[r];
        const fromVal = row[iFrom] || "";
        const toVal = row[iTo] || "";
        const fromIata = extractIata(fromVal);
        const toIata = extractIata(toVal);
        // Resolve country: prefer explicit country columns, then IATA map
        const fromCountryRaw = iFromCountry !== -1 ? (row[iFromCountry] || "").trim().toUpperCase() : "";
        const toCountryRaw = iToCountry !== -1 ? (row[iToCountry] || "").trim().toUpperCase() : "";
        let fromIso = (fromCountryRaw.length === 2 ? fromCountryRaw : null) || (fromIata ? IATA_MAP[fromIata] : null);
        let toIso = (toCountryRaw.length === 2 ? toCountryRaw : null) || (toIata ? IATA_MAP[toIata] : null);

        // RELAXED: if one side resolved, mirror to the other (likely domestic)
        if (!fromIso && toIso) fromIso = toIso;
        if (!toIso && fromIso) toIso = fromIso;

        // Skip ONLY if the row is genuinely empty (no airport info at all on either side)
        const hasAnySignal = !!(fromIata || toIata || fromVal.trim() || toVal.trim());
        if (!hasAnySignal) { skipped++; continue; }

        // Fallback ISO so the flight is still imported even when truly unknown
        if (!fromIso) fromIso = "XX";
        if (!toIso) toIso = "XX";

        flights.push({
            date: parseDate(iDate !== -1 ? row[iDate] : ""),
            from: fromIso,
            to: toIso,
            fromIata: fromIata || fromVal.slice(0, 6),
            toIata: toIata || toVal.slice(0, 6),
            airline: iAirline !== -1 ? row[iAirline] : undefined,
            flight: iFlight !== -1 ? row[iFlight] : undefined,
            depTime: iDepTime !== -1 ? row[iDepTime] : undefined,
            arrTime: iArrTime !== -1 ? row[iArrTime] : undefined,
            durationMin: iDuration !== -1 ? toMin(row[iDuration]) : undefined,
            distanceKm: iDistance !== -1 ? toKm(row[iDistance], iDistance) : undefined,
            aircraft: iAircraft !== -1 ? row[iAircraft] : undefined,
            tailNumber: iTail !== -1 ? row[iTail] : undefined,
            seat: iSeat !== -1 ? row[iSeat] : undefined,
            cabin: iCabin !== -1 ? row[iCabin] : undefined,
            confirmation: iConf !== -1 ? row[iConf] : undefined,
            notes: iNotes !== -1 ? row[iNotes] : undefined,
        });
    }

    flights.sort((a, b) => a.date - b.date);
    return { flights, skipped, total: rows.length - 1 };
};

export const FlightyImport = () => {
    const inputRef = useRef<HTMLInputElement>(null);
    const { importFlights, flightHistory, clearFlightHistory } = useUser();
    const [parsed, setParsed] = useState<ParsedFlight[] | null>(null);
    const [skipped, setSkipped] = useState(0);
    const [total, setTotal] = useState(0);
    const [filename, setFilename] = useState<string>("");
    const [busy, setBusy] = useState(false);

    const handleFile = async (file: File) => {
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) { toast.error("File too large (max 10MB)"); return; }
        setBusy(true);
        try {
            const text = await file.text();
            const { flights, skipped, total } = parseFlighty(text);
            setParsed(flights);
            setSkipped(skipped);
            setTotal(total);
            setFilename(file.name);
            if (flights.length === 0) toast.error("No flights could be parsed from this CSV");
            else toast.success(`${flights.length} flights ready to import`);
        } catch {
            toast.error("Could not read the file");
        } finally {
            setBusy(false);
        }
    };

    const onPick = () => inputRef.current?.click();

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const f = e.dataTransfer.files?.[0];
        if (f) handleFile(f);
    };

    const onConfirm = () => {
        if (!parsed || parsed.length === 0) return;
        const logs: FlightLog[] = parsed.map(p => ({
            from: p.from,
            to: p.to,
            at: p.date,
            fromIata: p.fromIata || undefined,
            toIata: p.toIata || undefined,
            airline: p.airline || undefined,
            flightNo: p.flight || undefined,
            depTime: p.depTime || undefined,
            arrTime: p.arrTime || undefined,
            durationMin: p.durationMin,
            distanceKm: p.distanceKm,
            aircraft: p.aircraft || undefined,
            tailNumber: p.tailNumber || undefined,
            seat: p.seat || undefined,
            cabin: p.cabin || undefined,
            confirmation: p.confirmation || undefined,
            notes: p.notes || undefined,
        }));
        const added = importFlights(logs);
        toast.success(`Imported ${added} new flight${added === 1 ? "" : "s"}`);
        setParsed(null);
        setFilename("");
    };

    const onClearImport = () => {
        setParsed(null);
        setFilename("");
        setSkipped(0);
        setTotal(0);
    };

    const countryName = (iso: string) => countries.find(c => c.code === iso)?.name || iso;
    const countryFlag = (iso: string) => countries.find(c => c.code === iso)?.flagEmoji || "";

    return (
        <section
            aria-labelledby="flighty-import-heading"
            className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-5 backdrop-blur-xl"
        >
            <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                    <h3 id="flighty-import-heading" className="text-lg font-display font-semibold text-white flex items-center gap-2">
                        <Plane className="w-4 h-4 text-luxury-gold" aria-hidden />
                        Import from Flighty
                    </h3>
                    <p className="text-xs text-white/55 mt-1">
                        Upload your Flighty CSV export to bring in your full flight history.
                        Drag &amp; drop or browse · CSV only.
                    </p>
                </div>
                {flightHistory.length > 0 && (
                    <button
                        onClick={() => { if (confirm(`Clear all ${flightHistory.length} stored flights?`)) clearFlightHistory(); }}
                        className="text-[10px] uppercase tracking-widest text-white/40 hover:text-red-300 inline-flex items-center gap-1 min-h-9 px-2"
                        aria-label="Clear all stored flights"
                    >
                        <Trash2 className="w-3 h-3" aria-hidden /> Clear all
                    </button>
                )}
            </div>

            {!parsed && (
                <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={onDrop}
                    className="relative grid place-items-center rounded-xl border border-dashed border-white/15 bg-white/[0.02] hover:bg-white/[0.04] transition-colors px-6 py-10 text-center cursor-pointer"
                    onClick={onPick}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onPick(); }}
                    aria-label="Choose a Flighty CSV file to import"
                >
                    <input
                        ref={inputRef}
                        type="file"
                        accept=".csv,text/csv"
                        className="sr-only"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.currentTarget.value = ""; }}
                    />
                    <div className="flex flex-col items-center gap-2 text-white/70">
                        <div className="w-12 h-12 rounded-full bg-luxury-gold/10 grid place-items-center ring-1 ring-luxury-gold/30">
                            <Upload className="w-5 h-5 text-luxury-gold" aria-hidden />
                        </div>
                        <div className="text-sm font-medium text-white">Drop your Flighty CSV here</div>
                        <div className="text-xs text-white/50">or click to browse · supports Flighty / general flight CSVs</div>
                        {busy && <div className="mt-2 text-xs text-luxury-gold">Reading file…</div>}
                    </div>
                </div>
            )}

            {parsed && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between gap-3 rounded-xl bg-white/5 border border-white/10 px-3 py-2">
                        <div className="flex items-center gap-2 min-w-0">
                            <FileText className="w-4 h-4 text-luxury-gold shrink-0" aria-hidden />
                            <span className="text-sm text-white truncate">{filename}</span>
                            <span className="text-xs text-white/40">·</span>
                            <span className="text-xs text-emerald-300 inline-flex items-center gap-1">
                                <Check className="w-3 h-3" aria-hidden /> {parsed.length} parsed
                            </span>
                            {skipped > 0 && (
                                <>
                                    <span className="text-xs text-white/40">·</span>
                                    <span className="text-xs text-amber-300 inline-flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" aria-hidden /> {skipped} skipped
                                    </span>
                                </>
                            )}
                        </div>
                        <button
                            onClick={onClearImport}
                            aria-label="Discard parsed file"
                            className="text-white/50 hover:text-white p-1 min-h-9 min-w-9 grid place-items-center"
                        >
                            <X className="w-4 h-4" aria-hidden />
                        </button>
                    </div>

                    {parsed.length > 0 && (
                        <div className="max-h-72 overflow-y-auto rounded-xl border border-white/10 divide-y divide-white/5">
                            {parsed.slice(0, 200).map((f, i) => (
                                <div key={i} className="flex items-center gap-3 px-3 py-2 text-xs">
                                    <span className="font-mono text-white/40 w-20 shrink-0">{new Date(f.date).toLocaleDateString()}</span>
                                    <span className="flex items-center gap-1.5 min-w-0">
                                        <span aria-hidden>{countryFlag(f.from)}</span>
                                        <span className="text-white/85 truncate">{countryName(f.from)}</span>
                                        <span className="text-white/30 font-mono">{f.fromIata}</span>
                                    </span>
                                    <span className="text-white/30">→</span>
                                    <span className="flex items-center gap-1.5 min-w-0">
                                        <span aria-hidden>{countryFlag(f.to)}</span>
                                        <span className="text-white/85 truncate">{countryName(f.to)}</span>
                                        <span className="text-white/30 font-mono">{f.toIata}</span>
                                    </span>
                                    {f.flight && (
                                        <span className="ml-auto text-white/40 font-mono">{f.flight}</span>
                                    )}
                                </div>
                            ))}
                            {parsed.length > 200 && (
                                <div className="px-3 py-2 text-[11px] text-white/40 text-center">
                                    +{parsed.length - 200} more flights not shown in preview
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex justify-end gap-2">
                        <button
                            onClick={onClearImport}
                            className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white/70 hover:bg-white/10 hover:text-white min-h-11"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={parsed.length === 0}
                            className="rounded-full bg-luxury-gold px-5 py-2 text-xs font-bold uppercase tracking-widest text-black hover:brightness-110 disabled:opacity-40 min-h-11"
                        >
                            Import {parsed.length} flights
                        </button>
                    </div>

                    <div className="text-[11px] text-white/40 leading-relaxed">
                        Tip: in Flighty go to <em>Settings → Export</em> and pick the full CSV.
                        We dedupe against your existing history so you can re-import safely.
                    </div>
                </div>
            )}
        </section>
    );
};

export default FlightyImport;
