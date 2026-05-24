import { useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/integrations/supabase/client";
import {
    X, Plane, Hotel, Car, Loader2, Sparkles, Star, DollarSign, Zap, Award,
    ArrowRight, Clock, MapPin, ExternalLink, Search, Users, Building2, AlertCircle
} from "lucide-react";

type Mode = "flight" | "hotel" | "car";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    initialMode?: Mode;
}

interface FlightOption {
    category: "cheapest" | "fastest" | "best_value" | "ai_pick";
    airline: string; flightNumber?: string;
    from: string; to: string;
    stops: number; stopCities?: string[];
    departTime: string; arriveTime: string;
    durationMinutes: number;
    priceUSD: number; cabin?: string; aircraft?: string;
    rating: number; whyPick: string; bookingPlatforms: string[];
}

interface HotelOption {
    category: "cheapest" | "best_value" | "luxury" | "ai_pick";
    name: string; neighborhood: string; starClass: number; rating: number;
    priceUSDPerNight: number; totalUSD: number;
    amenities: string[]; distanceToCenter?: string;
    whyPick: string; bookingPlatforms: string[];
}

interface CarOption {
    category: "cheapest" | "best_value" | "luxury" | "ai_pick";
    company: string; carModel: string; carType: string;
    seats?: number; transmission: "automatic" | "manual";
    pricePerDayUSD: number; totalUSD: number;
    pickupLocation: string; mileagePolicy?: string;
    rating: number; features?: string[];
    whyPick: string; bookingPlatforms: string[];
}

const CATEGORY_META: Record<string, { label: string; icon: any; tone: string }> = {
    cheapest: { label: "Cheapest", icon: DollarSign, tone: "from-emerald-500/30 to-emerald-500/5 border-emerald-400/30 text-emerald-200" },
    fastest: { label: "Fastest", icon: Zap, tone: "from-sky-500/30 to-sky-500/5 border-sky-400/30 text-sky-200" },
    best_value: { label: "Best Value", icon: Award, tone: "from-amber-500/30 to-amber-500/5 border-amber-400/30 text-amber-200" },
    luxury: { label: "Luxury", icon: Award, tone: "from-fuchsia-500/30 to-fuchsia-500/5 border-fuchsia-400/30 text-fuchsia-200" },
    ai_pick: { label: "AI Pick", icon: Sparkles, tone: "from-[hsl(var(--gold)/0.45)] to-[hsl(var(--gold)/0.05)] border-[hsl(var(--gold)/0.45)] text-[hsl(var(--gold))]" },
};

const POPULAR_CITIES = ["Lisbon", "Barcelona", "Paris", "Rome", "Tokyo", "Bangkok", "Dubai", "New York", "London", "Istanbul"];
const POPULAR_AIRPORTS = ["VIE", "LHR", "CDG", "JFK", "NRT", "DXB", "IST", "BCN", "FCO", "BKK"];

const fmtDur = (m: number) => `${Math.floor(m / 60)}h ${m % 60}m`;
const stars = (n: number) => {
    const full = Math.round(n);
    return (
        <span className="inline-flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} className={`w-3 h-3 ${i <= full ? "fill-[hsl(var(--gold))] text-[hsl(var(--gold))]" : "text-white/20"}`} />
            ))}
            <span className="ml-1 text-[11px] text-white/70">{n.toFixed(1)}</span>
        </span>
    );
};

const todayPlus = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
};

export const TravelSearchModal = ({ isOpen, onClose, initialMode = "flight" }: Props) => {
    const [mode, setMode] = useState<Mode>(initialMode);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [results, setResults] = useState<{ summary: string; disclaimer: string; options: any[] } | null>(null);

    // Flight
    const [fFrom, setFFrom] = useState("");
    const [fTo, setFTo] = useState("");
    const [fDepart, setFDepart] = useState(todayPlus(14));
    const [fReturn, setFReturn] = useState(todayPlus(21));
    const [fPax, setFPax] = useState(1);
    const [fCabin, setFCabin] = useState<"economy" | "premium" | "business" | "first">("economy");

    // Hotel
    const [hCity, setHCity] = useState("");
    const [hIn, setHIn] = useState(todayPlus(14));
    const [hOut, setHOut] = useState(todayPlus(17));
    const [hGuests, setHGuests] = useState(2);
    const [hBudget, setHBudget] = useState<"any" | "budget" | "mid" | "luxury">("any");
    const [hVibe, setHVibe] = useState("");

    // Car
    const [cCity, setCCity] = useState("");
    const [cIn, setCIn] = useState(todayPlus(14));
    const [cOut, setCOut] = useState(todayPlus(17));
    const [cType, setCType] = useState<"any" | "economy" | "compact" | "suv" | "luxury" | "van">("any");
    const [cDrivers, setCDrivers] = useState(1);

    if (!isOpen) return null;

    const reset = () => { setResults(null); setError(null); };
    const switchMode = (m: Mode) => { setMode(m); reset(); };

    const validation = (() => {
        if (mode === "flight") {
            if (!fFrom.trim()) return "Enter a departure city or airport code";
            if (!fTo.trim()) return "Enter a destination city or airport code";
            if (!fDepart) return "Pick a departure date";
            return null;
        }
        if (mode === "hotel") {
            if (!hCity.trim()) return "Enter a city";
            if (!hIn || !hOut) return "Pick check-in and check-out dates";
            if (new Date(hOut) <= new Date(hIn)) return "Check-out must be after check-in";
            return null;
        }
        if (!cCity.trim()) return "Enter a pickup city";
        if (!cIn || !cOut) return "Pick rental dates";
        if (new Date(cOut) <= new Date(cIn)) return "Drop-off must be after pickup";
        return null;
    })();

    const run = async () => {
        if (validation) { setError(validation); return; }
        setLoading(true); setError(null); setResults(null);
        const body: any = mode === "flight"
            ? { type: "flight", from: fFrom.trim(), to: fTo.trim(), departDate: fDepart, returnDate: fReturn || undefined, passengers: fPax, cabin: fCabin }
            : mode === "hotel"
                ? { type: "hotel", city: hCity.trim(), checkIn: hIn, checkOut: hOut, guests: hGuests, budget: hBudget, vibe: hVibe.trim() || undefined }
                : { type: "car", city: cCity.trim(), pickupDate: cIn, dropoffDate: cOut, carType: cType, drivers: cDrivers };

        const { data, error: err } = await supabase.functions.invoke("travel-search-ai", { body });
        if (err || !data?.ok) {
            setError(err?.message || data?.error || "Search failed — please try again.");
        } else {
            setResults(data.data);
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full sm:max-w-2xl h-[94dvh] sm:h-[90dvh] sm:rounded-3xl rounded-t-3xl border border-white/10 bg-[hsl(var(--card)/0.97)] backdrop-blur-2xl shadow-[0_30px_80px_-20px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[hsl(var(--gold))] to-amber-600 flex items-center justify-center shrink-0">
                            <Sparkles className="w-4 h-4 text-black" />
                        </div>
                        <div className="min-w-0">
                            <div className="font-display text-lg font-semibold text-white truncate">AI Travel Search</div>
                            <div className="text-[11px] text-white/50 truncate">Flights · Hotels · Cars — curated for you</div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-white/70" aria-label="Close">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Mode switch */}
                <div className="px-4 pt-3">
                    <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-white/5 border border-white/10">
                        {([
                            { id: "flight", icon: Plane, label: "Flights" },
                            { id: "hotel", icon: Hotel, label: "Hotels" },
                            { id: "car", icon: Car, label: "Cars" },
                        ] as { id: Mode; icon: any; label: string }[]).map(({ id, icon: Icon, label }) => (
                            <button
                                key={id}
                                onClick={() => switchMode(id)}
                                className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${mode === id ? "bg-gradient-to-br from-[hsl(var(--gold))] to-amber-600 text-black shadow" : "text-white/70 hover:text-white"}`}
                            >
                                <Icon className="w-4 h-4" />
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                    {/* Form */}
                    {mode === "flight" && (
                        <>
                            <div className="grid grid-cols-1 gap-3">
                                <Field label="From — city or airport" icon={MapPin} required>
                                    <CityInput value={fFrom} onChange={setFFrom} placeholder="e.g. Vienna or VIE" suggestions={POPULAR_AIRPORTS} />
                                </Field>
                                <Field label="To — city or airport" icon={MapPin} required>
                                    <CityInput value={fTo} onChange={setFTo} placeholder="e.g. Tokyo or NRT" suggestions={POPULAR_AIRPORTS} />
                                </Field>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="Depart" required>
                                    <input type="date" value={fDepart} onChange={e => setFDepart(e.target.value)} className={inputCls} />
                                </Field>
                                <Field label="Return (optional)">
                                    <input type="date" value={fReturn} onChange={e => setFReturn(e.target.value)} className={inputCls} />
                                </Field>
                                <Field label="Passengers" icon={Users}>
                                    <input type="number" min={1} max={9} value={fPax} onChange={e => setFPax(Math.max(1, Math.min(9, +e.target.value || 1)))} className={inputCls} />
                                </Field>
                                <Field label="Cabin">
                                    <select value={fCabin} onChange={e => setFCabin(e.target.value as any)} className={inputCls}>
                                        <option value="economy">Economy</option>
                                        <option value="premium">Premium Eco</option>
                                        <option value="business">Business</option>
                                        <option value="first">First</option>
                                    </select>
                                </Field>
                            </div>
                        </>
                    )}

                    {mode === "hotel" && (
                        <>
                            <Field label="Which city?" icon={Building2} required>
                                <CityInput value={hCity} onChange={setHCity} placeholder="e.g. Lisbon, Tokyo, New York" suggestions={POPULAR_CITIES} />
                            </Field>
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="Check-in" required>
                                    <input type="date" value={hIn} onChange={e => setHIn(e.target.value)} className={inputCls} />
                                </Field>
                                <Field label="Check-out" required>
                                    <input type="date" value={hOut} onChange={e => setHOut(e.target.value)} className={inputCls} />
                                </Field>
                                <Field label="Guests" icon={Users}>
                                    <input type="number" min={1} max={8} value={hGuests} onChange={e => setHGuests(Math.max(1, Math.min(8, +e.target.value || 1)))} className={inputCls} />
                                </Field>
                                <Field label="Budget">
                                    <select value={hBudget} onChange={e => setHBudget(e.target.value as any)} className={inputCls}>
                                        <option value="any">Any</option>
                                        <option value="budget">Budget ($)</option>
                                        <option value="mid">Mid-range ($$)</option>
                                        <option value="luxury">Luxury ($$$+)</option>
                                    </select>
                                </Field>
                            </div>
                            <Field label="Vibe (optional)">
                                <input value={hVibe} onChange={e => setHVibe(e.target.value)} placeholder="e.g. near old town, walkable, pool" className={inputCls} />
                            </Field>
                        </>
                    )}

                    {mode === "car" && (
                        <>
                            <Field label="Pickup city" icon={Building2} required>
                                <CityInput value={cCity} onChange={setCCity} placeholder="e.g. Lisbon, Miami, Rome" suggestions={POPULAR_CITIES} />
                            </Field>
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="Pickup date" required>
                                    <input type="date" value={cIn} onChange={e => setCIn(e.target.value)} className={inputCls} />
                                </Field>
                                <Field label="Drop-off date" required>
                                    <input type="date" value={cOut} onChange={e => setCOut(e.target.value)} className={inputCls} />
                                </Field>
                                <Field label="Car type">
                                    <select value={cType} onChange={e => setCType(e.target.value as any)} className={inputCls}>
                                        <option value="any">Any</option>
                                        <option value="economy">Economy</option>
                                        <option value="compact">Compact</option>
                                        <option value="suv">SUV</option>
                                        <option value="luxury">Luxury</option>
                                        <option value="van">Van / 7+ seats</option>
                                    </select>
                                </Field>
                                <Field label="Drivers" icon={Users}>
                                    <input type="number" min={1} max={4} value={cDrivers} onChange={e => setCDrivers(Math.max(1, Math.min(4, +e.target.value || 1)))} className={inputCls} />
                                </Field>
                            </div>
                        </>
                    )}

                    {/* Validation hint */}
                    {validation && !loading && (
                        <div className="flex items-center gap-2 text-xs text-amber-200/90 bg-amber-500/10 border border-amber-400/30 rounded-xl px-3 py-2">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            {validation}
                        </div>
                    )}

                    <button
                        onClick={run}
                        disabled={loading || !!validation}
                        className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[hsl(var(--gold))] to-amber-600 text-black font-semibold py-3 disabled:opacity-40 hover:scale-[1.01] active:scale-[0.99] transition-transform"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                        {loading
                            ? "AI is comparing across platforms…"
                            : `Search ${mode === "flight" ? "Flights" : mode === "hotel" ? "Hotels" : "Cars"} with AI`}
                    </button>

                    {error && <div className="text-red-300 text-sm bg-red-500/10 border border-red-400/30 rounded-xl px-3 py-2">{error}</div>}

                    {loading && <ResultsSkeleton />}

                    {results && !loading && (
                        <div className="space-y-3 pt-2">
                            <div className="text-sm text-white/80">{results.summary}</div>
                            {results.options
                                .slice()
                                .sort((a: any, b: any) => (a.category === "ai_pick" ? -1 : b.category === "ai_pick" ? 1 : 0))
                                .map((opt: any, i: number) => (
                                    mode === "flight" ? <FlightCard key={i} opt={opt} />
                                        : mode === "hotel" ? <HotelCard key={i} opt={opt} />
                                            : <CarCard key={i} opt={opt} city={cCity} />
                                ))}
                            <p className="text-[10px] text-white/40 italic pt-1">{results.disclaimer || "AI-curated estimates — verify on booking sites before purchasing."}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const inputCls = "w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-[hsl(var(--gold)/0.5)]";

const Field = ({ label, icon: Icon, required, children }: { label: string; icon?: any; required?: boolean; children: React.ReactNode }) => (
    <label className="flex flex-col gap-1">
        <span className="text-[11px] uppercase tracking-wider text-white/50 font-semibold flex items-center gap-1.5">
            {Icon && <Icon className="w-3 h-3" />}
            {label}
            {required && <span className="text-[hsl(var(--gold))]">*</span>}
        </span>
        {children}
    </label>
);

const CityInput = ({ value, onChange, placeholder, suggestions }: { value: string; onChange: (v: string) => void; placeholder: string; suggestions: string[] }) => (
    <div className="space-y-2">
        <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={inputCls} autoComplete="off" />
        {!value && (
            <div className="flex flex-wrap gap-1.5">
                {suggestions.slice(0, 6).map(s => (
                    <button key={s} type="button" onClick={() => onChange(s)} className="text-[11px] px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-colors">
                        {s}
                    </button>
                ))}
            </div>
        )}
    </div>
);

const ResultsSkeleton = () => (
    <div className="space-y-3 pt-2">
        {[0, 1, 2, 3].map(i => (
            <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-2 animate-pulse">
                <div className="h-4 w-24 bg-white/10 rounded-full" />
                <div className="h-6 w-48 bg-white/10 rounded" />
                <div className="h-3 w-full bg-white/10 rounded" />
                <div className="h-3 w-3/4 bg-white/10 rounded" />
            </div>
        ))}
    </div>
);

const CategoryBadge = ({ category }: { category: string }) => {
    const m = CATEGORY_META[category] || CATEGORY_META.best_value;
    const Icon = m.icon;
    return (
        <span className={`inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full border bg-gradient-to-br ${m.tone}`}>
            <Icon className="w-3 h-3" />
            {m.label}
        </span>
    );
};

const bookingUrl = (platform: string, query: string) => {
    const q = encodeURIComponent(query);
    const p = platform.toLowerCase();
    if (p.includes("google")) return `https://www.google.com/travel/flights?q=${q}`;
    if (p.includes("skyscanner")) return `https://www.skyscanner.net/transport/flights?query=${q}`;
    if (p.includes("kayak")) return `https://www.kayak.com/flights?query=${q}`;
    if (p.includes("booking")) return `https://www.booking.com/searchresults.html?ss=${q}`;
    if (p.includes("hotels")) return `https://www.hotels.com/search.do?q-destination=${q}`;
    if (p.includes("agoda")) return `https://www.agoda.com/search?q=${q}`;
    if (p.includes("rentalcars")) return `https://www.rentalcars.com/SearchResults.do?city=${q}`;
    if (p.includes("discovercars")) return `https://www.discovercars.com/?country=&pickupLocation=${q}`;
    if (p.includes("expedia")) return `https://www.expedia.com/Hotel-Search?destination=${q}`;
    return `https://www.google.com/search?q=${q}+${encodeURIComponent(platform)}`;
};

const FlightCard = ({ opt }: { opt: FlightOption }) => (
    <div className={`rounded-2xl border bg-gradient-to-br ${opt.category === "ai_pick" ? "from-[hsl(var(--gold)/0.12)] to-transparent border-[hsl(var(--gold)/0.4)]" : "from-white/[0.04] to-transparent border-white/10"} p-4 space-y-3`}>
        <div className="flex items-start justify-between gap-2">
            <CategoryBadge category={opt.category} />
            <div className="text-right">
                <div className="font-display text-2xl font-bold text-white">${opt.priceUSD}</div>
                <div className="text-[10px] text-white/50 uppercase">per person</div>
            </div>
        </div>
        <div className="flex items-center justify-between gap-3 text-white">
            <div className="text-center">
                <div className="font-bold text-lg">{opt.departTime}</div>
                <div className="text-[11px] text-white/60">{opt.from}</div>
            </div>
            <div className="flex-1 flex flex-col items-center text-[10px] text-white/50">
                <div className="flex items-center gap-1"><Clock className="w-3 h-3" />{fmtDur(opt.durationMinutes)}</div>
                <div className="w-full h-px bg-gradient-to-r from-transparent via-white/30 to-transparent my-1 relative">
                    <ArrowRight className="w-3 h-3 absolute right-0 -top-1.5 text-white/40" />
                </div>
                <div>{opt.stops === 0 ? "Nonstop" : `${opt.stops} stop${opt.stops > 1 ? "s" : ""}${opt.stopCities?.length ? ` · ${opt.stopCities.join(", ")}` : ""}`}</div>
            </div>
            <div className="text-center">
                <div className="font-bold text-lg">{opt.arriveTime}</div>
                <div className="text-[11px] text-white/60">{opt.to}</div>
            </div>
        </div>
        <div className="flex items-center justify-between text-xs text-white/70">
            <span>{opt.airline}{opt.flightNumber ? ` · ${opt.flightNumber}` : ""}{opt.aircraft ? ` · ${opt.aircraft}` : ""}</span>
            {stars(opt.rating)}
        </div>
        <p className="text-xs text-white/80 italic">"{opt.whyPick}"</p>
        <div className="flex flex-wrap gap-2 pt-1">
            {opt.bookingPlatforms.map(p => (
                <a key={p} href={bookingUrl(p, `${opt.from} to ${opt.to}`)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/15 text-white border border-white/10">
                    {p} <ExternalLink className="w-3 h-3" />
                </a>
            ))}
        </div>
    </div>
);

const HotelCard = ({ opt }: { opt: HotelOption }) => (
    <div className={`rounded-2xl border bg-gradient-to-br ${opt.category === "ai_pick" ? "from-[hsl(var(--gold)/0.12)] to-transparent border-[hsl(var(--gold)/0.4)]" : "from-white/[0.04] to-transparent border-white/10"} p-4 space-y-3`}>
        <div className="flex items-start justify-between gap-2">
            <CategoryBadge category={opt.category} />
            <div className="text-right">
                <div className="font-display text-2xl font-bold text-white">${opt.priceUSDPerNight}</div>
                <div className="text-[10px] text-white/50 uppercase">/ night · ${opt.totalUSD} total</div>
            </div>
        </div>
        <div>
            <h4 className="font-bold text-white text-base leading-tight">{opt.name}</h4>
            <p className="text-xs text-white/60 mt-0.5">{"★".repeat(opt.starClass)}{"☆".repeat(Math.max(0, 5 - opt.starClass))} · {opt.neighborhood}{opt.distanceToCenter ? ` · ${opt.distanceToCenter}` : ""}</p>
        </div>
        <div>{stars(opt.rating)}</div>
        <div className="flex flex-wrap gap-1.5">
            {opt.amenities.slice(0, 5).map(a => (
                <span key={a} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/70">{a}</span>
            ))}
        </div>
        <p className="text-xs text-white/80 italic">"{opt.whyPick}"</p>
        <div className="flex flex-wrap gap-2 pt-1">
            {opt.bookingPlatforms.map(p => (
                <a key={p} href={bookingUrl(p, opt.name)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/15 text-white border border-white/10">
                    {p} <ExternalLink className="w-3 h-3" />
                </a>
            ))}
        </div>
    </div>
);

const CarCard = ({ opt, city }: { opt: CarOption; city: string }) => (
    <div className={`rounded-2xl border bg-gradient-to-br ${opt.category === "ai_pick" ? "from-[hsl(var(--gold)/0.12)] to-transparent border-[hsl(var(--gold)/0.4)]" : "from-white/[0.04] to-transparent border-white/10"} p-4 space-y-3`}>
        <div className="flex items-start justify-between gap-2">
            <CategoryBadge category={opt.category} />
            <div className="text-right">
                <div className="font-display text-2xl font-bold text-white">${opt.pricePerDayUSD}</div>
                <div className="text-[10px] text-white/50 uppercase">/ day · ${opt.totalUSD} total</div>
            </div>
        </div>
        <div>
            <h4 className="font-bold text-white text-base leading-tight">{opt.company} — {opt.carModel}</h4>
            <p className="text-xs text-white/60 mt-0.5 capitalize">{opt.carType}{opt.seats ? ` · ${opt.seats} seats` : ""} · {opt.transmission}{opt.mileagePolicy ? ` · ${opt.mileagePolicy}` : ""}</p>
            <p className="text-[11px] text-white/50 mt-1 flex items-center gap-1"><MapPin className="w-3 h-3" />{opt.pickupLocation}</p>
        </div>
        <div>{stars(opt.rating)}</div>
        {opt.features?.length ? (
            <div className="flex flex-wrap gap-1.5">
                {opt.features.slice(0, 5).map(f => (
                    <span key={f} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/70">{f}</span>
                ))}
            </div>
        ) : null}
        <p className="text-xs text-white/80 italic">"{opt.whyPick}"</p>
        <div className="flex flex-wrap gap-2 pt-1">
            {opt.bookingPlatforms.map(p => (
                <a key={p} href={bookingUrl(p, `${city} ${opt.company}`)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/15 text-white border border-white/10">
                    {p} <ExternalLink className="w-3 h-3" />
                </a>
            ))}
        </div>
    </div>
);
