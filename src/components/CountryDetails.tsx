import { fetchCountryData, CountryExtendedData, getRichCountryData, RichCountryInfo, fetchCountryCities, fetchCountryStates, fetchStateCities } from '@/services/countryService';
import { fetchCountrySummary, WikiSummary } from '@/services/wikiService';
import { useUser } from '@/contexts/UserContext';
import { useEffect, useState, useMemo } from 'react';
import { Country, getCountryByCode, countries } from '@/data/countries';
import { getVisaRequirementFromMatrix, getVisaRequirementLabel } from '@/data/visaMatrix';
import {
    X, Globe, Users, MapPin, Plane, CreditCard, Check, AlertTriangle,
    Calendar as CalendarIcon, Heart, DollarSign, CloudSun, Sparkles, Car,
    TrendingUp, Activity, Search, Home, Bookmark, ChevronRight, ChevronDown,
    Languages, Wallet,
} from 'lucide-react';
import { AISectionPanel } from './AISectionPanel';

interface CountryDetailsProps {
    country: Country;
    userPassportCode?: string;
    isVisited: boolean;
    onClose: () => void;
    onToggleVisited: () => void;
    isModal?: boolean;
}

type SectionId = 'overview' | 'cities' | 'visa' | 'transport' | 'climate' | 'insights';

const SECTIONS: { id: SectionId; label: string; icon: any }[] = [
    { id: 'overview', label: 'Overview', icon: Sparkles },
    { id: 'cities', label: 'Cities', icon: MapPin },
    { id: 'visa', label: 'Visa', icon: CreditCard },
    { id: 'transport', label: 'Transport', icon: Plane },
    { id: 'climate', label: 'Climate', icon: CloudSun },
    { id: 'insights', label: 'Insights', icon: TrendingUp },
];

export const CountryDetails = ({
    country,
    userPassportCode,
    isVisited,
    onClose,
    onToggleVisited,
    isModal = true,
}: CountryDetailsProps) => {
    const { visitedCities, updateVisitedCities, bucketList, updateBucketList, livedCountries, updateLivedCountries } = useUser();

    const [userPassport, setUserPassport] = useState<Country | undefined>(undefined);
    const [userVisaInfo, setUserVisaInfo] = useState<ReturnType<typeof getVisaRequirementFromMatrix> | null>(null);
    const [extendedData, setExtendedData] = useState<CountryExtendedData | null>(null);
    const [richData, setRichData] = useState<RichCountryInfo | null>(null);
    const [wikiSummary, setWikiSummary] = useState<WikiSummary | null>(null);
    const [isDescExpanded, setDescExpanded] = useState(false);
    const [section, setSection] = useState<SectionId>('overview');

    // Cities
    const [cities, setCities] = useState<string[]>([]);
    const [citySearch, setCitySearch] = useState('');
    const [isLoadingCities, setIsLoadingCities] = useState(false);
    const [visibleCitiesCount, setVisibleCitiesCount] = useState(48);

    // Regions
    const [regions, setRegions] = useState<{ name: string; state_code: string }[]>([]);
    const [viewMode, setViewMode] = useState<'all' | 'regions'>('all');
    const [expandedRegion, setExpandedRegion] = useState<string | null>(null);
    const [regionCities, setRegionCities] = useState<Record<string, string[]>>({});
    const [isLoadingRegionCities, setIsLoadingRegionCities] = useState<string | null>(null);

    const isCityVisited = (cityName: string) => visitedCities.includes(`${cityName}|${country.code}`);

    const toggleCity = (cityName: string) => {
        const key = `${cityName}|${country.code}`;
        const next = visitedCities.includes(key)
            ? visitedCities.filter(c => c !== key)
            : [...visitedCities, key];
        updateVisitedCities(next);
    };

    const handleRegionClick = async (stateName: string) => {
        if (expandedRegion === stateName) {
            setExpandedRegion(null);
            return;
        }
        setExpandedRegion(stateName);
        if (!regionCities[stateName]) {
            setIsLoadingRegionCities(stateName);
            const list = await fetchStateCities(country.name, stateName);
            setRegionCities(prev => ({ ...prev, [stateName]: list }));
            setIsLoadingRegionCities(null);
        }
    };

    const visitedInCountry = cities.filter(c => isCityVisited(c)).length;
    const progressPct = cities.length > 0 ? (visitedInCountry / cities.length) * 100 : 0;

    // Data fetches
    useEffect(() => {
        if (!country?.code) return;
        fetchCountryData(country.code).then(setExtendedData);
        setRichData(getRichCountryData(country.code));
        fetchCountrySummary(country.name).then(s => s && setWikiSummary(s));
        setIsLoadingCities(true);
        setVisibleCitiesCount(48);
        fetchCountryCities(country.name).then(list => {
            setCities(list);
            setIsLoadingCities(false);
        });
        fetchCountryStates(country.name).then(s => {
            if (s?.length) {
                setRegions(s);
                setViewMode('regions');
            }
        });
    }, [country?.code, country.name]);

    useEffect(() => {
        if (!userPassportCode) return;
        const p = getCountryByCode(userPassportCode);
        setUserPassport(p);
        if (p) setUserVisaInfo(getVisaRequirementFromMatrix(p.code, country.code));
    }, [userPassportCode, country.code]);

    useEffect(() => {
        if (!isModal) return;
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isModal, onClose]);

    const filteredCities = useMemo(() => {
        if (!citySearch) return cities;
        const q = citySearch.toLowerCase();
        return cities.filter(c => c.toLowerCase().includes(q));
    }, [cities, citySearch]);

    const visaFreeAccessList = useMemo(() => {
        return countries.filter(c => {
            const req = getVisaRequirementFromMatrix(country.code, c.code);
            return req?.requirement === 'visa-free' || req?.requirement === 'visa-on-arrival';
        }).slice(0, 60);
    }, [country.code]);

    const summary = wikiSummary?.extract || richData?.description || '';
    const isLived = livedCountries.includes(country.code);
    const isBucket = bucketList.includes(country.code);

    return (
        <div
            className={
                `relative w-full overflow-hidden text-white ${isModal
                    ? 'h-full max-h-[92vh] max-w-4xl rounded-[28px] border border-white/10 shadow-[0_30px_120px_-20px_rgba(0,0,0,0.8)] flex flex-col animate-in fade-in zoom-in-95 duration-300'
                    : 'h-full flex flex-col'}`
            }
        >
            {/* Liquid background layer */}
            <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(120,180,255,0.18),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_rgba(255,180,120,0.14),_transparent_55%),linear-gradient(180deg,#06080f_0%,#0a0d18_60%,#05070d_100%)]" />
                <div className="absolute -top-20 -left-20 h-[420px] w-[420px] rounded-full bg-cyan-400/20 blur-[120px] animate-[liquidA_18s_ease-in-out_infinite_alternate]" />
                <div className="absolute -bottom-32 -right-20 h-[460px] w-[460px] rounded-full bg-fuchsia-400/15 blur-[140px] animate-[liquidB_22s_ease-in-out_infinite_alternate]" />
                <div className="absolute top-1/3 left-1/2 h-[260px] w-[260px] -translate-x-1/2 rounded-full bg-amber-300/10 blur-[100px] animate-[liquidC_16s_ease-in-out_infinite_alternate]" />
                {/* subtle grid */}
                <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,0.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.6)_1px,transparent_1px)] [background-size:40px_40px]" />
                {/* noise */}
                <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay [background-image:url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22120%22 height=%22120%22><filter id=%22n%22><feTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22/></filter><rect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/></svg>')]" />
            </div>

            <style>{`
                @keyframes liquidA { 0% { transform: translate(0,0) scale(1); } 100% { transform: translate(40px,30px) scale(1.15); } }
                @keyframes liquidB { 0% { transform: translate(0,0) scale(1); } 100% { transform: translate(-30px,-20px) scale(1.1); } }
                @keyframes liquidC { 0% { transform: translate(-50%, 0) scale(1); } 100% { transform: translate(-55%, -15px) scale(1.2); } }
                @keyframes shimmerLine { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
                .liquid-card {
                    background: linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02));
                    border: 1px solid rgba(255,255,255,0.08);
                    box-shadow: inset 0 1px 0 rgba(255,255,255,0.06), 0 10px 40px -20px rgba(0,0,0,0.6);
                    backdrop-filter: blur(20px) saturate(140%);
                    -webkit-backdrop-filter: blur(20px) saturate(140%);
                }
                .liquid-pill {
                    background: linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02));
                    border: 1px solid rgba(255,255,255,0.1);
                    backdrop-filter: blur(14px);
                    -webkit-backdrop-filter: blur(14px);
                }
                .liquid-pill-active {
                    background: linear-gradient(135deg, rgba(120,200,255,0.35), rgba(160,120,255,0.25));
                    border: 1px solid rgba(180,220,255,0.5);
                    box-shadow: 0 0 0 1px rgba(255,255,255,0.06) inset, 0 8px 24px -8px rgba(120,180,255,0.5);
                    color: #fff;
                }
                .shimmer {
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent);
                    background-size: 200% 100%;
                    animation: shimmerLine 2.5s linear infinite;
                }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>

            {/* Close (modal only) */}
            {isModal && (
                <button
                    onClick={onClose}
                    aria-label="Close"
                    className="absolute top-4 right-4 z-30 grid h-10 w-10 place-items-center rounded-full liquid-pill text-white/80 hover:text-white hover:rotate-90 transition-all duration-300"
                >
                    <X className="h-4 w-4" />
                </button>
            )}

            {/* HEADER */}
            <header className="relative z-10 shrink-0 px-5 pt-7 md:px-8 md:pt-9">
                <div className="flex items-start gap-4">
                    {/* Flag tile */}
                    <div className="relative shrink-0">
                        <div className="absolute -inset-2 rounded-3xl bg-gradient-to-br from-cyan-400/30 via-violet-400/20 to-amber-300/20 blur-xl" />
                        <div className="relative grid h-20 w-20 place-items-center rounded-3xl liquid-card text-5xl">
                            <span className="drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">{country.flagEmoji}</span>
                        </div>
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/50">
                            <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(120,220,255,0.9)]" />
                            {country.continent}
                            <span className="text-white/20">•</span>
                            <span className="font-mono text-white/40">{country.code}</span>
                        </div>
                        <h2 className="mt-1 font-display text-3xl font-bold leading-tight tracking-tight md:text-4xl">
                            {country.name}
                        </h2>
                        {extendedData?.capital?.[0] && (
                            <div className="mt-1 text-xs text-white/60">
                                Capital · <span className="text-white/90">{extendedData.capital[0]}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick action rail */}
                <div className="mt-5 flex flex-wrap items-center gap-2">
                    <ActionChip
                        active={isVisited}
                        onClick={onToggleVisited}
                        icon={isVisited ? <Check className="h-4 w-4" /> : <Plane className="h-4 w-4" />}
                        label={isVisited ? 'Visited' : 'Mark Visited'}
                        glow="rgba(80,220,160,0.55)"
                    />
                    <ActionChip
                        active={isLived}
                        onClick={() => updateLivedCountries(isLived ? livedCountries.filter(c => c !== country.code) : [...livedCountries, country.code])}
                        icon={<Home className="h-4 w-4" />}
                        label="Lived"
                        glow="rgba(120,180,255,0.55)"
                    />
                    <ActionChip
                        active={isBucket}
                        onClick={() => updateBucketList(isBucket ? bucketList.filter(c => c !== country.code) : [...bucketList, country.code])}
                        icon={<Bookmark className="h-4 w-4" />}
                        label="Bucket"
                        glow="rgba(255,170,90,0.55)"
                    />
                </div>

                {/* Section nav */}
                <nav className="mt-5 -mx-1 flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                    {SECTIONS.map(s => {
                        const Icon = s.icon;
                        const active = section === s.id;
                        return (
                            <button
                                key={s.id}
                                onClick={() => setSection(s.id)}
                                className={`group inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[11px] font-semibold uppercase tracking-wider transition-all ${active ? 'liquid-pill-active' : 'liquid-pill text-white/65 hover:text-white'}`}
                            >
                                <Icon className="h-3.5 w-3.5" />
                                {s.label}
                            </button>
                        );
                    })}
                </nav>

                {/* Hairline shimmer */}
                <div className="relative mt-4 h-px w-full overflow-hidden rounded-full bg-white/5">
                    <div className="absolute inset-0 shimmer opacity-60" />
                </div>
            </header>

            {/* CONTENT */}
            <main className="relative z-10 flex-1 overflow-y-auto no-scrollbar px-5 pb-10 pt-5 md:px-8">
                {section === 'overview' && (
                    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-300">
                        {/* Summary card */}
                        {summary && (
                            <div className="liquid-card relative overflow-hidden rounded-3xl p-5">
                                <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-cyan-400/15 blur-3xl" />
                                <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-200/90">
                                    <Sparkles className="h-3.5 w-3.5" /> About
                                </div>
                                <p className="text-[15px] font-light leading-relaxed text-white/85">
                                    {isDescExpanded ? summary : summary.slice(0, 220) + (summary.length > 220 ? '…' : '')}
                                </p>
                                {summary.length > 220 && (
                                    <button
                                        onClick={() => setDescExpanded(v => !v)}
                                        className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-cyan-300 hover:text-cyan-200"
                                    >
                                        {isDescExpanded ? 'Read less' : 'Read more'}
                                        <ChevronRight className={`h-3 w-3 transition-transform ${isDescExpanded ? 'rotate-90' : ''}`} />
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Stat bento */}
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                            <StatTile icon={<Users className="h-4 w-4" />} label="Population" value={extendedData?.population ? (extendedData.population / 1_000_000).toFixed(1) + 'M' : '—'} />
                            <StatTile icon={<MapPin className="h-4 w-4" />} label="Capital" value={extendedData?.capital?.[0] || '—'} />
                            <StatTile icon={<Languages className="h-4 w-4" />} label="Language" value={extendedData?.languages ? Object.values(extendedData.languages)[0] : '—'} />
                            <StatTile icon={<Wallet className="h-4 w-4" />} label="Currency" value={extendedData?.currencies ? Object.keys(extendedData.currencies)[0] : '—'} />
                        </div>

                        {/* Tags */}
                        {!!richData?.knownFor?.length && (
                            <div className="flex flex-wrap gap-2">
                                {richData.knownFor.map((t, i) => (
                                    <span key={i} className="liquid-pill rounded-full px-3 py-1.5 text-[11px] font-medium text-white/80">
                                        #{t}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Holidays */}
                        {!!richData?.publicHolidays?.length && (
                            <div className="liquid-card rounded-3xl p-5">
                                <div className="mb-4 flex items-center gap-2">
                                    <CalendarIcon className="h-4 w-4 text-white/60" />
                                    <h3 className="font-display text-lg font-semibold">Public Holidays</h3>
                                </div>
                                <div className="grid gap-2 sm:grid-cols-2">
                                    {richData.publicHolidays.slice(0, 6).map((h, i) => (
                                        <div key={i} className="liquid-pill flex items-center justify-between rounded-2xl px-3 py-2.5">
                                            <span className="truncate pr-3 text-sm text-white/90">{h.name}</span>
                                            <span className="shrink-0 rounded-md bg-white/5 px-2 py-0.5 font-mono text-[10px] text-white/60">{h.date}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <AISectionPanel countryCode={country.code} countryName={country.name} section="overview" />
                    </div>
                )}
                {section === 'cities' && (
                    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-300">
                        {/* Progress */}
                        <div className="liquid-card relative overflow-hidden rounded-3xl p-5">
                            <div className="flex items-end justify-between gap-4">
                                <div>
                                    <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300/90">Exploration</div>
                                    <div className="mt-1 text-2xl font-bold">{visitedInCountry}<span className="text-white/40 text-lg">/{cities.length || '—'}</span></div>
                                    <div className="text-xs text-white/60">{Math.round(progressPct)}% explored</div>
                                </div>
                                <div className="text-right text-4xl font-display font-bold text-white/90">{Math.round(progressPct)}<span className="text-base text-white/40">%</span></div>
                            </div>
                            <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-emerald-300 via-cyan-300 to-violet-300 transition-all duration-700"
                                    style={{ width: `${progressPct}%` }}
                                />
                            </div>
                        </div>

                        {/* Search + toggle */}
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                                <input
                                    value={citySearch}
                                    onChange={e => setCitySearch(e.target.value)}
                                    placeholder="Search cities…"
                                    className="liquid-pill w-full rounded-2xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/30 outline-none focus:border-cyan-300/40"
                                />
                            </div>
                            {regions.length > 0 && (
                                <button
                                    onClick={() => setViewMode(viewMode === 'all' ? 'regions' : 'all')}
                                    className="liquid-pill rounded-2xl px-4 text-[11px] font-bold uppercase tracking-wider text-white/80 hover:text-white"
                                >
                                    {viewMode === 'all' ? 'Regions' : 'All'}
                                </button>
                            )}
                        </div>

                        {/* List */}
                        {isLoadingCities ? (
                            <div className="flex flex-col items-center justify-center py-16 text-white/40">
                                <div className="mb-3 h-7 w-7 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                <span className="text-[10px] uppercase tracking-widest">Loading…</span>
                            </div>
                        ) : viewMode === 'all' ? (
                            <>
                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                    {filteredCities.slice(0, visibleCitiesCount).map((city, i) => {
                                        const visited = isCityVisited(city);
                                        return (
                                            <button
                                                key={i}
                                                onClick={() => toggleCity(city)}
                                                className={`group relative overflow-hidden rounded-2xl p-3 text-left transition-all ${visited
                                                    ? 'border border-emerald-300/40 bg-gradient-to-br from-emerald-400/20 to-cyan-400/10 shadow-[0_0_20px_-6px_rgba(80,220,160,0.5)]'
                                                    : 'liquid-pill hover:border-white/25'}`}
                                            >
                                                <div className="mb-2 flex items-start justify-between">
                                                    <div className={`grid h-4 w-4 place-items-center rounded-full border ${visited ? 'border-emerald-300 bg-emerald-400 text-black' : 'border-white/25'}`}>
                                                        {visited && <Check className="h-2.5 w-2.5" />}
                                                    </div>
                                                </div>
                                                <span className={`text-sm font-medium ${visited ? 'text-white' : 'text-white/75'}`}>{city}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                                {visibleCitiesCount < filteredCities.length && (
                                    <button
                                        onClick={() => setVisibleCitiesCount(v => v + 48)}
                                        className="liquid-pill w-full rounded-2xl py-3 text-[11px] font-bold uppercase tracking-widest text-white/70 hover:text-white"
                                    >
                                        Load more
                                    </button>
                                )}
                            </>
                        ) : (
                            <div className="space-y-2">
                                {regions.map((r, i) => {
                                    const expanded = expandedRegion === r.name;
                                    const list = regionCities[r.name] || [];
                                    return (
                                        <div key={i} className="liquid-card overflow-hidden rounded-2xl">
                                            <button
                                                onClick={() => handleRegionClick(r.name)}
                                                className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-white/5"
                                            >
                                                <span className="text-sm font-semibold">{r.name}</span>
                                                <ChevronDown className={`h-4 w-4 text-white/50 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                                            </button>
                                            {expanded && (
                                                <div className="border-t border-white/5 p-3">
                                                    {isLoadingRegionCities === r.name ? (
                                                        <div className="py-4 text-center text-[11px] uppercase tracking-widest text-white/40">Loading…</div>
                                                    ) : list.length === 0 ? (
                                                        <div className="py-3 text-center text-xs text-white/40">No cities</div>
                                                    ) : (
                                                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                                            {list.map((c, j) => {
                                                                const v = isCityVisited(c);
                                                                return (
                                                                    <button
                                                                        key={j}
                                                                        onClick={() => toggleCity(c)}
                                                                        className={`rounded-xl px-3 py-2 text-left text-xs transition-all ${v ? 'bg-emerald-400/20 text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'}`}
                                                                    >
                                                                        {c}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <AISectionPanel countryCode={country.code} countryName={country.name} section="cities" />
                    </div>
                )}
                {section === 'visa' && (
                    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-300">
                        <div className="liquid-card relative overflow-hidden rounded-3xl p-6">
                            <div className="absolute -right-8 -top-8 h-44 w-44 rounded-full bg-gradient-to-br from-cyan-400/40 to-violet-500/30 blur-3xl" />
                            <div className="relative">
                                <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-200/90">
                                    <CreditCard className="h-3.5 w-3.5" /> Visa Requirement
                                </div>
                                {userPassportCode && userPassportCode !== country.code ? (
                                    userVisaInfo ? (
                                        <>
                                            <div className="font-display text-4xl font-bold leading-tight">
                                                {getVisaRequirementLabel(userVisaInfo.requirement)}
                                            </div>
                                            {userPassport && (
                                                <div className="mt-2 text-xs text-white/60">
                                                    For <span className="text-white">{userPassport.flagEmoji} {userPassport.name}</span> passport holders
                                                </div>
                                            )}
                                            {userVisaInfo.duration && (
                                                <div className="liquid-pill mt-4 inline-block rounded-full px-3 py-1 text-xs font-semibold">
                                                    Up to {userVisaInfo.duration} days
                                                </div>
                                            )}
                                            {userVisaInfo.notes && (
                                                <p className="mt-4 rounded-2xl bg-black/30 p-4 text-sm leading-relaxed text-white/80">{userVisaInfo.notes}</p>
                                            )}
                                        </>
                                    ) : (
                                        <div className="flex items-center gap-2 text-lg font-semibold text-amber-300"><AlertTriangle className="h-5 w-5" /> Info unavailable</div>
                                    )
                                ) : (
                                    <div className="text-2xl font-semibold">Your home country 🏠</div>
                                )}
                            </div>
                        </div>

                        {!!visaFreeAccessList.length && (
                            <div className="liquid-card overflow-hidden rounded-3xl">
                                <div className="border-b border-white/5 px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-white/60">
                                    Visa-Free Access from {country.name}
                                </div>
                                <div className="max-h-[360px] overflow-y-auto no-scrollbar">
                                    {visaFreeAccessList.map((c, i) => (
                                        <div key={i} className="flex items-center justify-between border-b border-white/5 px-5 py-3 last:border-0 hover:bg-white/5">
                                            <div className="flex items-center gap-3">
                                                <span className="text-xl">{c.flagEmoji}</span>
                                                <span className="text-sm text-white/90">{c.name}</span>
                                            </div>
                                            <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">Free</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <AISectionPanel countryCode={country.code} countryName={country.name} section="visa" passportName={userPassport?.name} />
                    </div>
                )}
                {section === 'transport' && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-3 duration-300">
                        {!!richData?.mainAirports?.length && (
                            <div className="space-y-2">
                                {richData.mainAirports.map(a => (
                                    <div key={a.code} className="liquid-card flex items-center justify-between rounded-2xl p-4">
                                        <div className="flex items-center gap-4">
                                            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-cyan-400/30 to-violet-500/20 text-cyan-200">
                                                <Plane className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <div className="font-bold">{a.code}</div>
                                                <div className="text-xs text-white/60">{a.name}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="liquid-card rounded-2xl p-5 text-center">
                                <Car className="mx-auto mb-2 h-6 w-6 text-white/60" />
                                <div className="text-[10px] font-bold uppercase tracking-widest text-white/50">Drives on</div>
                                <div className="mt-1 font-display text-xl font-bold capitalize">{extendedData?.car?.side || '—'}</div>
                            </div>
                            {extendedData?.maps?.googleMaps && (
                                <a
                                    href={extendedData.maps.googleMaps}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="liquid-card rounded-2xl p-5 text-center transition-all hover:border-cyan-300/40"
                                >
                                    <MapPin className="mx-auto mb-2 h-6 w-6 text-white/60" />
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-white/50">Maps</div>
                                    <div className="mt-1 font-display text-base font-bold text-cyan-300">Open ↗</div>
                                </a>
                            )}
                        </div>

                        <AISectionPanel countryCode={country.code} countryName={country.name} section="transport" />
                    </div>
                )}
                {section === 'climate' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-300">
                        <div className="liquid-card relative overflow-hidden rounded-3xl p-6">
                            <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-gradient-to-br from-amber-400/40 to-rose-400/30 blur-3xl" />
                            <CloudSun className="absolute right-4 top-4 h-7 w-7 text-white/30" />
                            <div className="relative">
                                <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-300/90">Climate</div>
                                <div className="text-3xl">{richData?.climate?.seasonEmojis || '🌤️'}</div>
                                <p className="mt-3 text-sm leading-relaxed text-white/85">{richData?.climate?.text || 'Climate data unavailable.'}</p>
                            </div>
                        </div>
                        {richData?.climate?.bestTime && (
                            <div className="liquid-card rounded-2xl p-5 text-center">
                                <div className="text-[10px] font-bold uppercase tracking-widest text-white/50">Best time to visit</div>
                                <div className="mt-2 font-display text-xl font-semibold">{richData.climate.bestTime}</div>
                            </div>
                        )}

                        <AISectionPanel countryCode={country.code} countryName={country.name} section="climate" />
                    </div>
                )}
                {section === 'insights' && (
                    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-300">
                        {!!richData?.religionDistribution?.length && (
                            <div className="liquid-card rounded-3xl p-5">
                                <div className="mb-4 flex items-center gap-2">
                                    <Heart className="h-4 w-4 text-white/60" />
                                    <h3 className="font-display text-lg font-semibold">Religion</h3>
                                </div>
                                <div className="space-y-3">
                                    {richData.religionDistribution.map((r, i) => (
                                        <div key={i}>
                                            <div className="mb-1.5 flex justify-between text-xs">
                                                <span className="text-white/80">{r.name}</span>
                                                <span className="text-white/50">{r.percentage}%</span>
                                            </div>
                                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                                                <div className="h-full bg-gradient-to-r from-cyan-300 to-violet-300" style={{ width: `${r.percentage}%` }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-3">
                            <StatTile icon={<DollarSign className="h-4 w-4" />} label="GDP" value={richData?.gdp || '—'} />
                            <StatTile icon={<Activity className="h-4 w-4" />} label="HDI" value={richData?.hdi || '—'} />
                        </div>

                        <AISectionPanel countryCode={country.code} countryName={country.name} section="insights" />
                    </div>
                )}
            </main>
        </div>
    );
};

// === Sub-components ===

const ActionChip = ({
    active, onClick, icon, label, glow,
}: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; glow: string }) => (
    <button
        onClick={onClick}
        className={`group relative inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-all ${active ? 'liquid-pill-active' : 'liquid-pill text-white/75 hover:text-white'}`}
        style={active ? { boxShadow: `0 0 24px -6px ${glow}` } : undefined}
    >
        {icon}
        {label}
    </button>
);

const StatTile = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) => (
    <div className="liquid-card group relative overflow-hidden rounded-2xl p-4 transition-all hover:border-white/20">
        <div className="absolute -right-6 -top-6 h-16 w-16 rounded-full bg-white/5 blur-2xl opacity-0 transition-opacity group-hover:opacity-100" />
        <div className="mb-2 text-white/50">{icon}</div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-white/50">{label}</div>
        <div className="mt-1 truncate font-display text-lg font-bold text-white">{value}</div>
    </div>
);
