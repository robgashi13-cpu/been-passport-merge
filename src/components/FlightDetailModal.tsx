import { createPortal } from "react-dom";
import { useEffect } from "react";
import {
    X, Plane, Building2, Calendar as CalendarIcon, Clock, Ruler,
    Hash, Armchair, BadgeCheck, StickyNote, MapPin, Globe2, Tag, PlaneTakeoff, PlaneLanding,
} from "lucide-react";
import type { FlightLog } from "@/contexts/UserContext";
import { countries } from "@/data/countries";
import airportCoords from "@/data/airportCoords.json";

const AIRPORTS = airportCoords as unknown as Record<string, [number, number, string]>;

const flagOf = (code: string): string => {
    if (!code) return "";
    try {
        return code.toUpperCase().replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
    } catch { return ""; }
};
const nameOf = (code: string) => countries.find((c) => c.code === code)?.name || code;
const cityOf = (iata?: string) => (iata && AIRPORTS[iata]?.[2]) || "";

const greatCircleKm = (a: [number, number], b: [number, number]): number => {
    const toRad = (d: number) => (d * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(b[0] - a[0]);
    const dLng = toRad(b[1] - a[1]);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
};

const fmtDuration = (min?: number): string | null => {
    if (!min || min <= 0) return null;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const fmtTime = (s?: string): string | null => {
    if (!s) return null;
    const t = Date.parse(s);
    if (!isNaN(t)) return new Date(t).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
    return s;
};

interface Props {
    flight: FlightLog | null;
    onClose: () => void;
}

export const FlightDetailModal = ({ flight, onClose }: Props) => {
    useEffect(() => {
        if (!flight) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", onKey);
        return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); };
    }, [flight, onClose]);

    if (!flight) return null;

    const fromAir = flight.fromIata ? AIRPORTS[flight.fromIata] : undefined;
    const toAir = flight.toIata ? AIRPORTS[flight.toIata] : undefined;
    const fromCity = fromAir?.[2] || cityOf(flight.fromIata);
    const toCity = toAir?.[2] || cityOf(flight.toIata);

    const distance =
        flight.distanceKm ??
        (fromAir && toAir ? Math.round(greatCircleKm([fromAir[0], fromAir[1]], [toAir[0], toAir[1]])) : null);

    // Estimated duration: distance / 850 km/h + 30 min for taxi/climb/descent.
    const estDurationMin =
        flight.durationMin ??
        (distance && distance > 0 ? Math.round((distance / 850) * 60) + 30 : null);

    const dateObj = new Date(flight.at);
    const fullDate = dateObj.toLocaleDateString(undefined, {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
    });

    const rows: Array<{ icon: React.ReactNode; label: string; value: React.ReactNode }> = [
        { icon: <CalendarIcon className="w-4 h-4" />, label: "Date", value: fullDate },
        flight.flightNo ? { icon: <Hash className="w-4 h-4" />, label: "Flight number", value: <span className="font-mono">{flight.flightNo}</span> } : null,
        flight.airline ? { icon: <Building2 className="w-4 h-4" />, label: "Airline", value: flight.airline } : null,
        flight.aircraft ? { icon: <Plane className="w-4 h-4" />, label: "Aircraft", value: flight.aircraft } : null,
        flight.tailNumber ? { icon: <Tag className="w-4 h-4" />, label: "Registration", value: <span className="font-mono">{flight.tailNumber}</span> } : null,
        flight.cabin ? { icon: <BadgeCheck className="w-4 h-4" />, label: "Cabin", value: flight.cabin } : null,
        flight.seat ? { icon: <Armchair className="w-4 h-4" />, label: "Seat", value: <span className="font-mono">{flight.seat}</span> } : null,
        flight.confirmation ? { icon: <BadgeCheck className="w-4 h-4" />, label: "Confirmation", value: <span className="font-mono">{flight.confirmation}</span> } : null,
        fmtTime(flight.depTime) ? { icon: <PlaneTakeoff className="w-4 h-4" />, label: "Departure", value: fmtTime(flight.depTime) } : null,
        fmtTime(flight.arrTime) ? { icon: <PlaneLanding className="w-4 h-4" />, label: "Arrival", value: fmtTime(flight.arrTime) } : null,
        estDurationMin ? {
            icon: <Clock className="w-4 h-4" />,
            label: flight.durationMin ? "Duration" : "Est. duration",
            value: fmtDuration(estDurationMin),
        } : null,
        distance ? { icon: <Ruler className="w-4 h-4" />, label: "Distance", value: `${distance.toLocaleString()} km` } : null,
    ].filter(Boolean) as Array<{ icon: React.ReactNode; label: string; value: React.ReactNode }>;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} aria-hidden />
            <div
                role="dialog"
                aria-modal="true"
                aria-label="Flight details"
                className="relative w-full sm:max-w-lg sm:max-h-[88vh] bg-[#0a0a0a]/95 border border-white/10 sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden flex flex-col animate-zoom-in"
            >
                {/* Hero header */}
                <div className="relative px-6 pt-6 pb-5 border-b border-white/10 bg-gradient-to-br from-luxury-gold/10 via-transparent to-cyan-500/5">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-full bg-black/40 hover:bg-white/10 transition-colors"
                        aria-label="Close flight details"
                    >
                        <X className="w-5 h-5 text-white/80" />
                    </button>
                    <div className="text-[10px] uppercase tracking-[0.3em] text-luxury-gold mb-3">Flight details</div>

                    <div className="flex items-center gap-4">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl" aria-hidden>{flagOf(flight.from)}</span>
                                <span className="font-mono text-2xl font-bold text-white">{flight.fromIata || "—"}</span>
                            </div>
                            <div className="text-sm text-white/70 truncate mt-1">{fromCity || nameOf(flight.from)}</div>
                            <div className="text-[11px] text-white/40 truncate">{nameOf(flight.from)}</div>
                        </div>

                        <div className="flex flex-col items-center text-white/60 px-2">
                            <Plane className="w-5 h-5 text-luxury-gold rotate-90" aria-hidden />
                            {distance && <div className="text-[10px] mt-1 whitespace-nowrap">{distance.toLocaleString()} km</div>}
                        </div>

                        <div className="flex-1 min-w-0 text-right">
                            <div className="flex items-baseline gap-2 justify-end">
                                <span className="font-mono text-2xl font-bold text-white">{flight.toIata || "—"}</span>
                                <span className="text-3xl" aria-hidden>{flagOf(flight.to)}</span>
                            </div>
                            <div className="text-sm text-white/70 truncate mt-1">{toCity || nameOf(flight.to)}</div>
                            <div className="text-[11px] text-white/40 truncate">{nameOf(flight.to)}</div>
                        </div>
                    </div>
                </div>

                {/* Details grid */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-1">
                    {rows.map((row, i) => (
                        <div
                            key={i}
                            className="flex items-center justify-between gap-3 py-3 border-b border-white/5 last:border-0"
                        >
                            <div className="flex items-center gap-3 text-white/55 text-sm min-w-0">
                                <span className="text-luxury-gold/80 flex-shrink-0">{row.icon}</span>
                                <span className="truncate">{row.label}</span>
                            </div>
                            <div className="text-white text-sm font-medium text-right truncate max-w-[60%]">
                                {row.value}
                            </div>
                        </div>
                    ))}

                    {/* Airport meta */}
                    <div className="grid grid-cols-2 gap-3 pt-5">
                        <AirportCard side="From" iata={flight.fromIata} city={fromCity} countryCode={flight.from} />
                        <AirportCard side="To" iata={flight.toIata} city={toCity} countryCode={flight.to} />
                    </div>

                    {flight.notes && (
                        <div className="mt-4 p-3 rounded-xl bg-white/5 border border-white/10">
                            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/40 mb-1">
                                <StickyNote className="w-3 h-3" /> Notes
                            </div>
                            <p className="text-sm text-white/80 whitespace-pre-wrap">{flight.notes}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body,
    );
};

const AirportCard = ({
    side, iata, city, countryCode,
}: { side: string; iata?: string; city: string; countryCode: string }) => (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
        <div className="text-[10px] uppercase tracking-widest text-luxury-gold mb-1.5">{side}</div>
        <div className="flex items-center gap-1.5 text-white text-sm font-mono font-bold">
            <MapPin className="w-3 h-3 text-white/50" /> {iata || "—"}
        </div>
        {city && <div className="text-xs text-white/65 mt-1 truncate">{city}</div>}
        <div className="text-[11px] text-white/40 mt-0.5 flex items-center gap-1 truncate">
            <Globe2 className="w-3 h-3" /> {nameOf(countryCode)}
        </div>
    </div>
);

export default FlightDetailModal;
