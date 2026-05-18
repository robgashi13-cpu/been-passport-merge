import { useMemo, useState } from "react";
import { Plane, Trash2, Search, ChevronDown, ChevronRight, Sparkles, AlertTriangle } from "lucide-react";
import { useUser, type FlightLog } from "@/contexts/UserContext";
import { countries } from "@/data/countries";
import airportCoords from "@/data/airportCoords.json";
import { FlightDetailModal } from "./FlightDetailModal";
import { useFlightFactsAI } from "@/hooks/useFlightFactsAI";

const AIRPORTS = airportCoords as unknown as Record<string, [number, number, string]>;
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const flagOf = (code: string): string => {
    if (!code || code === "XX") return "🌐";
    try { return code.toUpperCase().replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0))); }
    catch { return ""; }
};
const nameOf = (code: string) => countries.find(c => c.code === code)?.name || code;
const cityOf = (iata?: string) => (iata && AIRPORTS[iata]?.[2]) || "";
const fmtDate = (ms: number) => new Date(ms).toLocaleDateString(undefined, { day: "numeric", month: "short" });

type MonthGroup = { month: number; flights: { f: FlightLog; idx: number }[] };
type YearGroup = { year: number; months: MonthGroup[]; total: number };

export const FlightHistoryList = () => {
    const { flightHistory, clearFlightHistory } = useUser();
    const [q, setQ] = useState("");
    const [selected, setSelected] = useState<FlightLog | null>(null);
    const [openYears, setOpenYears] = useState<Set<number>>(new Set());
    const [openMonths, setOpenMonths] = useState<Set<string>>(new Set());

    const filtered = useMemo(() => {
        const indexed = flightHistory.map((f, idx) => ({ f, idx }));
        if (!q.trim()) return indexed;
        const needle = q.trim().toLowerCase();
        return indexed.filter(({ f }) => [
            f.from, f.to, f.fromIata, f.toIata, f.airline, f.flightNo,
            nameOf(f.from), nameOf(f.to), cityOf(f.fromIata), cityOf(f.toIata),
        ].filter(Boolean).join(" ").toLowerCase().includes(needle));
    }, [flightHistory, q]);

    const grouped = useMemo<YearGroup[]>(() => {
        const reversed = [...filtered].reverse();
        const yearMap = new Map<number, Map<number, { f: FlightLog; idx: number }[]>>();
        for (const entry of reversed) {
            const d = new Date(entry.f.at);
            const y = d.getFullYear();
            const m = d.getMonth();
            if (!yearMap.has(y)) yearMap.set(y, new Map());
            const mm = yearMap.get(y)!;
            if (!mm.has(m)) mm.set(m, []);
            mm.get(m)!.push(entry);
        }
        return Array.from(yearMap.entries())
            .sort((a, b) => b[0] - a[0])
            .map(([year, mm]) => {
                const months = Array.from(mm.entries())
                    .sort((a, b) => b[0] - a[0])
                    .map(([month, flights]) => ({ month, flights }));
                const total = months.reduce((s, m) => s + m.flights.length, 0);
                return { year, months, total };
            });
    }, [filtered]);

    const { data: aiFacts, loading: aiLoading, error: aiError } = useFlightFactsAI(flightHistory);

    if (flightHistory.length === 0) return null;

    const toggleYear = (y: number) => setOpenYears(prev => {
        const n = new Set(prev); n.has(y) ? n.delete(y) : n.add(y); return n;
    });
    const toggleMonth = (k: string) => setOpenMonths(prev => {
        const n = new Set(prev); n.has(k) ? n.delete(k) : n.add(k); return n;
    });

    const totalKm = flightHistory.reduce((acc, f) => {
        const a = AIRPORTS[f.fromIata || ""]; const b = AIRPORTS[f.toIata || ""];
        if (!a || !b) return acc;
        const toRad = (d: number) => (d * Math.PI) / 180;
        const R = 6371;
        const dLat = toRad(b[0] - a[0]); const dLng = toRad(b[1] - a[1]);
        const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2;
        return acc + 2 * R * Math.asin(Math.sqrt(h));
    }, 0);
    const uniqCountries = new Set<string>();
    flightHistory.forEach(f => { uniqCountries.add(f.from); uniqCountries.add(f.to); });

    return (
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.01] p-4 sm:p-5 backdrop-blur-2xl">
            <div className="pointer-events-none absolute -top-20 -left-20 h-64 w-64 rounded-full bg-cyan-400/15 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-amber-300/10 blur-3xl" />

            <header className="relative mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h3 className="font-display text-2xl font-bold text-white flex items-center gap-2">
                        <Plane className="w-5 h-5 text-luxury-gold" /> Flight Log
                    </h3>
                    <p className="text-xs text-white/55 mt-1">
                        {flightHistory.length} flights · {uniqCountries.size} countries{totalKm > 0 ? ` · ${Math.round(totalKm).toLocaleString()} km` : ""}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="search" value={q} onChange={(e) => setQ(e.target.value)}
                            placeholder="Search…"
                            className="pl-8 pr-3 py-2 rounded-full bg-white/5 border border-white/10 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-luxury-gold/40 w-40 sm:w-52"
                        />
                    </div>
                    <button
                        onClick={() => { if (confirm(`Clear all ${flightHistory.length} stored flights?`)) clearFlightHistory(); }}
                        className="text-[10px] uppercase tracking-widest text-white/40 hover:text-red-300 inline-flex items-center gap-1 min-h-9 px-2"
                    >
                        <Trash2 className="w-3 h-3" /> Clear
                    </button>
                </div>
            </header>

            {/* AI Facts */}
            <div className="relative mb-5 rounded-2xl border border-violet-300/20 bg-gradient-to-br from-violet-500/15 via-fuchsia-500/10 to-transparent p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-violet-200/90">
                    <Sparkles className="w-3.5 h-3.5" /> AI Flight Insights
                </div>
                {aiLoading && !aiFacts && (
                    <div className="flex items-center gap-2 text-xs text-white/60 py-2">
                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Analyzing your flights…
                    </div>
                )}
                {aiError && !aiFacts && (
                    <div className="flex items-center gap-2 text-xs text-amber-200">
                        <AlertTriangle className="w-3.5 h-3.5" /> Insights unavailable right now.
                    </div>
                )}
                {aiFacts && (
                    <>
                        {aiFacts.headline && <p className="text-sm font-medium text-white mb-3">{aiFacts.headline}</p>}
                        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                            {aiFacts.facts?.map((f: any, i: number) => (
                                <div key={i} className="min-w-[160px] shrink-0 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-3">
                                    <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest text-white/55 mb-1">
                                        {f.emoji && <span>{f.emoji}</span>}{f.label}
                                    </div>
                                    <div className="text-sm font-bold text-white leading-tight">{f.value}</div>
                                    {f.detail && <div className="text-[10px] text-white/55 mt-1 leading-snug">{f.detail}</div>}
                                </div>
                            ))}
                        </div>
                        {!!aiFacts.trivia?.length && (
                            <ul className="mt-3 space-y-1">
                                {aiFacts.trivia.map((t: string, i: number) => (
                                    <li key={i} className="text-[11px] text-white/70 flex gap-2"><span className="text-violet-300">•</span>{t}</li>
                                ))}
                            </ul>
                        )}
                    </>
                )}
            </div>

            {/* Year/Month accordions */}
            <div className="relative space-y-3">
                {grouped.map(({ year, months, total }) => {
                    const yOpen = openYears.has(year);
                    return (
                        <div key={year} className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
                            <button
                                onClick={() => toggleYear(year)}
                                className="w-full flex items-center justify-between gap-3 px-3 sm:px-4 py-3 hover:bg-white/[0.04] transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    {yOpen ? <ChevronDown className="w-4 h-4 text-luxury-gold" /> : <ChevronRight className="w-4 h-4 text-luxury-gold" />}
                                    <span className="font-display text-lg font-bold text-white">{year}</span>
                                </div>
                                <span className="text-[10px] uppercase tracking-widest text-white/50">{total} flight{total === 1 ? "" : "s"}</span>
                            </button>
                            {yOpen && (
                                <div className="px-2 pb-3 space-y-2">
                                    {months.map(({ month, flights }) => {
                                        const key = `${year}-${month}`;
                                        const mOpen = openMonths.has(key);
                                        return (
                                            <div key={key} className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden">
                                                <button
                                                    onClick={() => toggleMonth(key)}
                                                    className="w-full flex items-center justify-between gap-2 px-3 py-2 hover:bg-white/[0.04] transition-colors"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        {mOpen ? <ChevronDown className="w-3.5 h-3.5 text-white/60" /> : <ChevronRight className="w-3.5 h-3.5 text-white/60" />}
                                                        <span className="text-sm font-semibold text-white">{MONTH_NAMES[month]}</span>
                                                    </div>
                                                    <span className="text-[10px] text-white/40">{flights.length}</span>
                                                </button>
                                                {mOpen && (
                                                    <ul className="px-2 pb-2 space-y-1.5">
                                                        {flights.map(({ f, idx }) => (
                                                            <li key={`${f.at}-${idx}`}>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setSelected(f)}
                                                                    className="w-full text-left rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] hover:border-luxury-gold/30 transition-all p-2.5 flex items-center gap-2"
                                                                >
                                                                    <span className="font-mono text-[10px] text-white/40 w-12 shrink-0">{fmtDate(f.at)}</span>
                                                                    <span className="flex items-center gap-1 min-w-0">
                                                                        <span>{flagOf(f.from)}</span>
                                                                        <span className="font-mono text-xs font-bold text-white">{f.fromIata || "—"}</span>
                                                                    </span>
                                                                    <Plane className="w-3 h-3 text-luxury-gold/70 rotate-90 mx-1" />
                                                                    <span className="flex items-center gap-1 min-w-0">
                                                                        <span className="font-mono text-xs font-bold text-white">{f.toIata || "—"}</span>
                                                                        <span>{flagOf(f.to)}</span>
                                                                    </span>
                                                                    {(f.airline || f.flightNo) && (
                                                                        <span className="ml-auto text-[10px] text-white/50 truncate max-w-[110px]">
                                                                            {f.flightNo || f.airline}
                                                                        </span>
                                                                    )}
                                                                </button>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
                {filtered.length === 0 && (
                    <div className="text-center text-white/40 text-sm py-8">No flights match your search.</div>
                )}
            </div>

            <FlightDetailModal flight={selected} onClose={() => setSelected(null)} />
        </section>
    );
};

export default FlightHistoryList;
