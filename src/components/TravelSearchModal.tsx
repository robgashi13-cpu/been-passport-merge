import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
    X, Plane, Hotel, Loader2, Sparkles, Star, DollarSign, Zap, Award,
    ArrowRight, Clock, MapPin, ExternalLink, Search, Users, Building2
} from "lucide-react";

type Mode = "flight" | "hotel";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    initialMode?: Mode;
}

interface FlightOption {
    category: "cheapest" | "fastest" | "best_value" | "ai_pick";
    airline: string;
    flightNumber?: string;
    from: string;
    to: string;
    stops: number;
    stopCities?: string[];
    departTime: string;
    arriveTime: string;
    durationMinutes: number;
    priceUSD: number;
    cabin?: string;
    aircraft?: string;
    rating: number;
    whyPick: string;
    bookingPlatforms: string[];
}

interface HotelOption {
    category: "cheapest" | "best_value" | "luxury" | "ai_pick";
    name: string;
    neighborhood: string;
    starClass: number;
    rating: number;
    priceUSDPerNight: number;
    totalUSD: number;
    amenities: string[];
    distanceToCenter?: string;
    whyPick: string;
    bookingPlatforms: string[];
}

const CATEGORY_META: Record<string, { label: string; icon: any; tone: string }> = {
    cheapest: { label: "Cheapest", icon: DollarSign, tone: "from-emerald-500/30 to-emerald-500/5 border-emerald-400/30 text-emerald-200" },
    fastest: { label: "Fastest", icon: Zap, tone: "from-sky-500/30 to-sky-500/5 border-sky-400/30 text-sky-200" },
    best_value: { label: "Best Value", icon: Award, tone: "from-amber-500/30 to-amber-500/5 border-amber-400/30 text-amber-200" },
    luxury: { label: "Luxury", icon: Award, tone: "from-fuchsia-500/30 to-fuchsia-500/5 border-fuchsia-400/30 text-fuchsia-200" },
    ai_pick: { label: "AI Pick", icon: Sparkles, tone: "from-[hsl(var(--gold)/0.45)] to-[hsl(var(--gold)/0.05)] border-[hsl(var(--gold)/0.45)] text-[hsl(var(--gold))]" },
};

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
    const [results, setResults] = useState<{ summary: string; disclaimer: string; options: (FlightOption | HotelOption)[] } | null>(null);

    // Flight form
    const [fFrom, setFFrom] = useState("");
    const [fTo, setFTo] = useState("");
    const [fDepart, setFDepart] = useState(todayPlus(14));
    const [fReturn, setFReturn] = useState(todayPlus(21));
    const [fPax, setFPax] = useState(1);
    const [fCabin, setFCabin] = useState<"economy" | "premium" | "business" | "first">("economy");

    // Hotel form
    const [hCity, setHCity] = useState("");
    const [hIn, setHIn] = useState(todayPlus(14));
    const [hOut, setHOut] = useState(todayPlus(17));
    const [hGuests, setHGuests] = useState(2);
    const [hBudget, setHBudget] = useState<"any" | "budget" | "mid" | "luxury">("any");
    const [hVibe, setHVibe] = useState("");

    if (!isOpen) return null;

    const run = async () => {
        setLoading(true); setError(null); setResults(null);
        const body = mode === "flight"
            ? { type: "flight", from: fFrom, to: fTo, departDate: fDepart, returnDate: fReturn || undefined, passengers: fPax, cabin: fCabin }
            : { type: "hotel", city: hCity, checkIn: hIn, checkOut: hOut, guests: hGuests, budget: hBudget, vibe: hVibe || undefined };

        const { data, error } = await supabase.functions.invoke("travel-search-ai", { body });
        if (error || !data?.ok) {
            setError(error?.message || data?.error || "Search failed");
        } else {
            setResults(data.data);
        }
        setLoading(false);
    };

    const canSubmit = mode === "flight"
        ? fFrom.trim().length >= 2 && fTo.trim().length >= 2 && fDepart
        : hCity.trim().length >= 2 && hIn && hOut;

    return (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full sm:max-w-2xl h-[92dvh] sm:h-[88dvh] sm:rounded-3xl rounded-t-3xl border border-white/10 bg-[hsl(var(--card)/0.97)] backdrop-blur-2xl shadow-[0_30px_80px_-20px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[hsl(var(--gold))] to-amber-600 flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-black" />
                        </div>
                        <div>
                            <div className="font-display text-lg font-semibold text-white">AI Travel Search</div>
                            <div className="text-[11px] text-white/50">Flights & stays, curated for you</div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-white/70" aria-label="Close">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Mode switch */}
                <div className="px-4 pt-3">
                    <div className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-white/5 border border-white/10">
                        {(["flight", "hotel"] as Mode[]).map(m => (
                            <button
                                key={m}
                                onClick={() => { setMode(m); setResults(null); setError(null); }}
                                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${mode === m ? "bg-gradient-to-br from-[hsl(var(--gold))] to-amber-600 text-black shadow" : "text-white/70 hover:text-white"}`}
                            >
                                {m === "flight" ? <Plane className="w-4 h-4" /> : <Hotel className="w-4 h-4" />}
                                {m === "flight" ? "Flights" : "Hotels"}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                    {/* Form */}
                    {mode === "flight" ? (
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="From" icon={MapPin}>
                                <input value={fFrom} onChange={e => setFFrom(e.target.value)} placeholder="City or IATA (e.g. VIE)" className={inputCls} />
                            </Field>
                            <Field label="To" icon={MapPin}>
                                <input value={fTo} onChange={e => setFTo(e.target.value)} placeholder="City or IATA (e.g. NRT)" className={inputCls} />
                            </Field>
                            <Field label="Depart">
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
                    ) : (
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="City" icon={Building2}>
                                <input value={hCity} onChange={e => setHCity(e.target.value)} placeholder="e.g. Lisbon" className={inputCls} />
                            </Field>
                            <Field label="Guests" icon={Users}>
                                <input type="number" min={1} max={8} value={hGuests} onChange={e => setHGuests(Math.max(1, Math.min(8, +e.target.value || 1)))} className={inputCls} />
                            </Field>
                            <Field label="Check-in">
                                <input type="date" value={hIn} onChange={e => setHIn(e.target.value)} className={inputCls} />
                            </Field>
                            <Field label="Check-out">
                                <input type="date" value={hOut} onChange={e => setHOut(e.target.value)} className={inputCls} />
                            </Field>
                            <Field label="Budget">
                                <select value={hBudget} onChange={e => setHBudget(e.target.value as any)} className={inputCls}>
                                    <option value="any">Any</option>
                                    <option value="budget">Budget ($)</option>
                                    <option value="mid">Mid-range ($$)</option>
                                    <option value="luxury">Luxury ($$$+)</option>
                                </select>
                            </Field>
                            <Field label="Vibe (optional)">
                                <input value={hVibe} onChange={e => setHVibe(e.target.value)} placeholder="e.g. near old town, walkable" className={inputCls} />
                            </Field>
                        </div>
                    )}

                    <button
                        onClick={run}
                        disabled={!canSubmit || loading}
                        className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[hsl(var(--gold))] to-amber-600 text-black font-semibold py-3 disabled:opacity-40 hover:scale-[1.01] active:scale-[0.99] transition-transform"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                        {loading ? "AI is searching across platforms…" : `Search ${mode === "flight" ? "Flights" : "Hotels"} with AI`}
                    </button>

                    {error && <div className="text-red-300 text-sm bg-red-500/10 border border-red-400/30 rounded-xl px-3 py-2">{error}</div>}

                    {/* Results */}
                    {results && (
                        <div className="space-y-3 pt-2">
                            <div className="text-sm text-white/80">{results.summary}</div>
                            {results.options
                                .slice()
                                .sort((a, b) => (a.category === "ai_pick" ? -1 : b.category === "ai_pick" ? 1 : 0))
                                .map((opt, i) => (
                                    mode === "flight"
                                        ? <FlightCard key={i} opt={opt as FlightOption} />
                                        : <HotelCard key={i} opt={opt as HotelOption} />
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

const Field = ({ label, icon: Icon, children }: { label: string; icon?: any; children: React.ReactNode }) => (
    <label className="flex flex-col gap-1">
        <span className="text-[11px] uppercase tracking-wider text-white/50 font-semibold flex items-center gap-1.5">
            {Icon && <Icon className="w-3 h-3" />}
            {label}
        </span>
        {children}
    </label>
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
        <div className="flex items-center justify-between">
            {stars(opt.rating)}
        </div>
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
