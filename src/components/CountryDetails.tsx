import { fetchCountryData, CountryExtendedData, getStaticTravelInfo, getRichCountryData, RichCountryInfo, fetchCountryCities, fetchCountryStates, fetchStateCities } from '@/services/countryService';
import { fetchCountrySummary, WikiSummary } from '@/services/wikiService';
import { useUser } from '@/contexts/UserContext';
import { useEffect, useState, useMemo } from 'react';
import { Country, getCountryByCode, countries } from '@/data/countries';
import { getVisaRequirementFromMatrix, getVisaRequirementColor, getVisaRequirementLabel } from '@/data/visaMatrix';
import { X, Globe, Users, MapPin, Plane, CreditCard, Check, AlertCircle, Phone, Plug, AlertTriangle, Calendar as CalendarIcon, Tag, Heart, DollarSign, CloudSun, Sparkles, Car, Droplet, Syringe, Beer, TrendingUp, Briefcase, Activity, Building, Search, ArrowRight, Home, Bookmark, ShieldAlert, Cloud, Info } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CountryDetailsProps {
    country: Country;
    userPassportCode?: string;
    isVisited: boolean;
    onClose: () => void;
    onToggleVisited: () => void;
    isModal?: boolean;
}

export const CountryDetails = ({
    country,
    userPassportCode,
    isVisited,
    onClose,
    onToggleVisited,
    isModal = true
}: CountryDetailsProps) => {
    const { visitedCities, updateVisitedCities, bucketList, updateBucketList, livedCountries, updateLivedCountries } = useUser();
    const [userPassport, setUserPassport] = useState<Country | undefined>(undefined);
    const [userVisaInfo, setUserVisaInfo] = useState<any>(null);
    const [extendedData, setExtendedData] = useState<CountryExtendedData | null>(null);
    const [richData, setRichData] = useState<RichCountryInfo | null>(null);
    const [wikiSummary, setWikiSummary] = useState<WikiSummary | null>(null);

    const [exchangeRate, setExchangeRate] = useState<number | null>(null);
    const [exchangeLoading, setExchangeLoading] = useState(false);
    const [allHolidaysOpen, setAllHolidaysOpen] = useState(false);
    const [isDescExpanded, setDescExpanded] = useState(false);

    // Cities State
    const [cities, setCities] = useState<string[]>([]);
    const [citySearch, setCitySearch] = useState('');
    const [isLoadingCities, setIsLoadingCities] = useState(false);
    const [visibleCitiesCount, setVisibleCitiesCount] = useState(50);
    const [activeTab, setActiveTab] = useState("overview");

    // Region State
    const [regions, setRegions] = useState<{ name: string; state_code: string }[]>([]);
    const [viewMode, setViewMode] = useState<'all' | 'regions'>('all');
    const [expandedRegion, setExpandedRegion] = useState<string | null>(null);
    const [regionCities, setRegionCities] = useState<Record<string, string[]>>({});
    const [isLoadingRegionCities, setIsLoadingRegionCities] = useState<string | null>(null);

    // Helper to check if visited
    const isCityVisited = (cityName: string) => visitedCities.includes(`${cityName}|${country.code}`);

    // Toggle City Logic
    const toggleCity = (cityName: string) => {
        const cityKey = `${cityName}|${country.code}`;
        let newVisitedCities = [...visitedCities];
        if (newVisitedCities.includes(cityKey)) {
            newVisitedCities = newVisitedCities.filter(c => c !== cityKey);
        } else {
            newVisitedCities.push(cityKey);
        }
        updateVisitedCities(newVisitedCities);
    };

    // Handle Region Click
    const handleRegionClick = async (stateName: string) => {
        if (expandedRegion === stateName) {
            setExpandedRegion(null);
            return;
        }

        setExpandedRegion(stateName);

        if (!regionCities[stateName]) {
            setIsLoadingRegionCities(stateName);
            const cities = await fetchStateCities(country.name, stateName);
            setRegionCities(prev => ({ ...prev, [stateName]: cities }));
            setIsLoadingRegionCities(null);
        }
    };

    // Calculation for progress
    const visitedCountInCountry = cities.filter(c => isCityVisited(c)).length;
    const progressPercentage = cities.length > 0 ? (visitedCountInCountry / cities.length) * 100 : 0;

    // Initial data fetch
    useEffect(() => {
        if (country?.code) {
            // Parallel fetches
            fetchCountryData(country.code).then(data => {
                setExtendedData(data);
            });

            const rich = getRichCountryData(country.code);
            setRichData(rich);


            // AI/Wiki Data
            fetchCountrySummary(country.name).then(summary => {
                if (summary) setWikiSummary(summary);
            });

            // Fetch Cities
            setIsLoadingCities(true);
            setVisibleCitiesCount(50);
            fetchCountryCities(country.name).then(cityList => {
                setCities(cityList);
                setIsLoadingCities(false);
            });

            // Fetch Regions
            fetchCountryStates(country.name).then(states => {
                if (states && states.length > 0) {
                    setRegions(states);
                    setViewMode('regions'); // Default to regions if available
                }
            });
        }
    }, [country?.code, country.name]);

    // Update passport info when it changes
    useEffect(() => {
        if (userPassportCode) {
            const passport = getCountryByCode(userPassportCode);
            setUserPassport(passport);
            if (passport) {
                const visaInfo = getVisaRequirementFromMatrix(passport.code, country.code);
                setUserVisaInfo(visaInfo);
            }
        }
    }, [userPassportCode, country.code]);

    // Fetch exchange rate
    useEffect(() => {
        const currencyCode = extendedData?.currencies ? Object.keys(extendedData.currencies)[0] : null;
        if (!currencyCode) return;

        const fetchExchangeRate = async () => {
            if (currencyCode === 'USD') {
                setExchangeRate(1);
                return;
            }
            setExchangeLoading(true);
            try {
                const res = await fetch(`https://api.exchangerate-api.com/v4/latest/USD`);
                const data = await res.json();
                if (data.rates && data.rates[currencyCode]) {
                    setExchangeRate(data.rates[currencyCode]);
                }
            } catch (err) {
                console.warn('Failed to fetch exchange rate', err);
            } finally {
                setExchangeLoading(false);
            }
        };
        fetchExchangeRate();
    }, [extendedData?.currencies]);

    // ESC key to close modal
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isModal) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isModal, onClose]);

    const currencyStr = extendedData?.currencies
        ? Object.values(extendedData.currencies).map(c => `${c.name} (${c.symbol})`).join(', ')
        : 'Loading...';

    const currencyCode = extendedData?.currencies ? Object.keys(extendedData.currencies)[0] : null;

    const visaFreeAccessList = countries.filter(c => {
        const req = getVisaRequirementFromMatrix(country.code, c.code);
        return req?.requirement === 'visa-free' || req?.requirement === 'visa-on-arrival';
    }).slice(0, 50);

    const filteredCities = useMemo(() => {
        if (!citySearch) return cities;
        return cities.filter(c => c.toLowerCase().includes(citySearch.toLowerCase()));
    }, [cities, citySearch]);

    const content = (
        <div className={`bg-background/95 backdrop-blur-2xl border border-border/50 w-full animate-scale-in flex flex-col relative overflow-hidden ${isModal ? 'rounded-2xl max-w-2xl max-h-[90vh]' : 'h-full bg-transparent border-none animate-none'}`}>

            {/* Modal Close Button (Fixed Overlay) */}
            {isModal && (
                <button
                    onClick={onClose}
                    aria-label="Close country details"
                    className="absolute top-4 right-4 z-50 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-sm focus-visible:ring-2 focus-visible:ring-blue-400 border border-white/10 text-white/70"
                >
                    <X className="w-5 h-5" />
                </button>
            )}

            {/* Scrollable Area containing Header & Tabs */}
            <div className="flex-1 overflow-y-auto no-scrollbar">

                {/* Header (Scrolls away) */}
                <div className="p-5 pb-2 pt-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <span className="text-5xl drop-shadow-2xl">{country.flagEmoji}</span>
                            <div>
                                <h2 className="font-display text-2xl font-bold tracking-tight text-foreground leading-tight">{country.name}</h2>
                                <p className="text-muted-foreground text-[10px] uppercase tracking-wider font-medium">{country.continent} • {country.code}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 pr-10">
                            {/* NEW: Regions Visited Pill (Visible without scrolling tabs) */}
                            {cities.length > 0 && (
                                <div className="hidden min-[400px]:flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 border border-border/50 backdrop-blur-md self-center">
                                    <MapPin className={`w-3.5 h-3.5 ${visitedCountInCountry > 0 ? 'text-green-500' : 'text-muted-foreground'}`} />
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-xs text-muted-foreground/80">Regions</span>
                                        <span className="text-sm font-bold text-foreground font-numbers">{visitedCountInCountry}</span>
                                        <span className="text-xs text-muted-foreground/60">/ {cities.length}</span>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center gap-2">
                                {/* Lived Toggle */}
                                <button
                                    onClick={() => updateLivedCountries(livedCountries.includes(country.code) ? livedCountries.filter(c => c !== country.code) : [...livedCountries, country.code])}
                                    className={`flex items-center justify-center w-10 h-10 rounded-full transition-all border group relative
                                    ${livedCountries.includes(country.code)
                                            ? 'bg-blue-500/20 text-blue-500 border-blue-500/30'
                                            : 'bg-secondary/50 text-muted-foreground/50 hover:bg-secondary border-border/20 hover:border-border/50'
                                        }`}
                                    title="Mark as Lived"
                                >
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-popover border border-border px-2 py-1 rounded text-[10px] text-popover-foreground opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                                        Lived
                                    </div>
                                    <Home className="w-5 h-5" />
                                </button>

                                {/* Bucket List Toggle */}
                                <button
                                    onClick={() => updateBucketList(bucketList.includes(country.code) ? bucketList.filter(c => c !== country.code) : [...bucketList, country.code])}
                                    className={`flex items-center justify-center w-10 h-10 rounded-full transition-all border group relative
                                    ${bucketList.includes(country.code)
                                            ? 'bg-orange-500/20 text-orange-500 border-orange-500/30'
                                            : 'bg-secondary/50 text-muted-foreground/50 hover:bg-secondary border-border/20 hover:border-border/50'
                                        }`}
                                    title="Bucket List"
                                >
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-popover border border-border px-2 py-1 rounded text-[10px] text-popover-foreground opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                                        Bucket List
                                    </div>
                                    <Bookmark className="w-5 h-5" />
                                </button>

                                {/* Visited Toggle */}
                                <button
                                    onClick={onToggleVisited}
                                    className={`flex items-center justify-center w-10 h-10 rounded-full transition-all border group relative
                                    ${isVisited
                                            ? 'bg-green-500/20 text-green-500 border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.2)]'
                                            : 'bg-secondary/50 text-muted-foreground hover:bg-secondary border-border/20 hover:border-border/50'
                                        }`}
                                    title="Mark as Visited"
                                >
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-popover border border-border px-2 py-1 rounded text-[10px] text-popover-foreground opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                                        Visited
                                    </div>
                                    {isVisited ? <Check className="w-5 h-5" /> : <Plane className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 pt-2">
                    <Tabs defaultValue="overview" className="w-full space-y-4">
                        <div className="sticky top-0 z-40 bg-gradient-to-b from-black/95 via-black/90 to-transparent pt-3 pb-4 -mx-4 px-4 backdrop-blur-2xl border-b border-white/5">
                            <TabsList className="flex w-full gap-1 p-1 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10 rounded-2xl border border-blue-500/20 shadow-lg shadow-blue-500/5 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory">
                                <TabsTrigger value="overview" className="flex-shrink-0 snap-start rounded-xl px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/50 text-white/60 hover:text-white/80 focus-visible:ring-2 focus-visible:ring-blue-400">Overview</TabsTrigger>
                                <TabsTrigger value="cities" className="flex-shrink-0 snap-start rounded-xl px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/50 text-white/60 hover:text-white/80 focus-visible:ring-2 focus-visible:ring-blue-400">Cities</TabsTrigger>
                                <TabsTrigger value="visa" className="flex-shrink-0 snap-start rounded-xl px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/50 text-white/60 hover:text-white/80 focus-visible:ring-2 focus-visible:ring-blue-400">Visa</TabsTrigger>
                                <TabsTrigger value="transport" className="flex-shrink-0 snap-start rounded-xl px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/50 text-white/60 hover:text-white/80 focus-visible:ring-2 focus-visible:ring-blue-400">Transit</TabsTrigger>
                                <TabsTrigger value="weather" className="flex-shrink-0 snap-start rounded-xl px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/50 text-white/60 hover:text-white/80 focus-visible:ring-2 focus-visible:ring-blue-400">Weather</TabsTrigger>
                                <TabsTrigger value="details" className="flex-shrink-0 snap-start rounded-xl px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/50 text-white/60 hover:text-white/80 focus-visible:ring-2 focus-visible:ring-blue-400">Details</TabsTrigger>
                            </TabsList>
                        </div>

                        {/* OVERVIEW TAB - Modern Bento Grid */}
                        <TabsContent value="overview" className="space-y-4 mt-0 animate-slide-up">
                            {/* Summary Card with AI Badge */}
                            {/* Summary Card with AI Badge */}
                            <div className="relative bg-gradient-card rounded-3xl p-5 border border-border/50 overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-50">
                                    <Sparkles className="w-24 h-24 text-white/5 -rotate-12" />
                                </div>

                                <div className="flex items-center gap-2 mb-3">
                                    <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-lg shadow-purple-500/20">
                                        <Sparkles className="w-3 h-3" /> AI Summary
                                    </div>
                                </div>

                                <div className="relative z-10">
                                    <p className={`text-foreground/80 leading-relaxed font-light text-sm transition-all overflow-hidden ${isDescExpanded ? 'max-h-full' : 'max-h-[4.5em] line-clamp-3'}`}>
                                        {wikiSummary?.extract || richData?.description || "Loading detailed information..."}
                                    </p>
                                    {(wikiSummary?.extract || richData?.description) && (
                                        <button
                                            onClick={() => setDescExpanded(!isDescExpanded)}
                                            className="text-[10px] font-bold uppercase tracking-wider text-blue-400 mt-2 hover:text-blue-300 flex items-center gap-1"
                                        >
                                            {isDescExpanded ? 'Show Less' : 'Read More'}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-secondary/50 rounded-2xl p-5 border border-border/50 hover:border-border transition-colors">
                                    <div className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-2 flex items-center gap-1.5"><Users className="w-3 h-3" /> Population</div>
                                    <div className="font-numbers text-xl md:text-2xl text-foreground font-medium">
                                        {extendedData?.population ? (extendedData.population / 1000000).toFixed(1) + 'M' : '-'}
                                    </div>
                                </div>
                                <div className="bg-secondary/50 rounded-2xl p-5 border border-border/50 hover:border-border transition-colors">
                                    <div className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-2 flex items-center gap-1.5"><MapPin className="w-3 h-3" /> Capital</div>
                                    <div className="font-display text-lg text-foreground font-medium truncate">
                                        {extendedData?.capital?.[0] || 'N/A'}
                                    </div>
                                </div>
                                <div className="bg-secondary/50 rounded-2xl p-5 border border-border/50 hover:border-border transition-colors">
                                    <div className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-2 flex items-center gap-1.5"><Globe className="w-3 h-3" /> Language</div>
                                    <div className="font-display text-lg text-foreground font-medium truncate">
                                        {extendedData?.languages ? Object.values(extendedData.languages)[0] : 'N/A'}
                                    </div>
                                </div>
                                <div className="bg-secondary/50 rounded-2xl p-5 border border-border/50 hover:border-border transition-colors">
                                    <div className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-2 flex items-center gap-1.5"><Heart className="w-3 h-3" /> Religion</div>
                                    <div className="font-display text-lg text-foreground font-medium truncate">
                                        {richData?.majorReligion || 'N/A'}
                                    </div>
                                </div>
                            </div>

                            {/* Tags */}
                            {richData?.knownFor && (
                                <div className="flex flex-wrap gap-2">
                                    {richData.knownFor.map((tag, i) => (
                                        <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/50 border border-border/50 text-xs font-medium text-foreground/70 hover:bg-secondary/70 transition-colors cursor-default">
                                            <Tag className="w-3 h-3 opacity-50" />
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Holidays */}
                            <div className="bg-secondary/30 rounded-3xl p-6 border border-border/50">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-display font-bold text-lg flex items-center gap-2"><CalendarIcon className="w-4 h-4 text-muted-foreground" /> Public Holidays</h3>
                                    <a
                                        href={`https://www.google.com/search?q=public+holidays+in+${country.name}+2025`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[10px] font-bold text-muted-foreground hover:text-foreground transition-colors bg-secondary/50 px-3 py-1.5 rounded-full flex items-center gap-1 uppercase tracking-wider"
                                    >
                                        Search Google ↗
                                    </a>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {richData?.publicHolidays.slice(0, 4).map((h, i) => (
                                        <div key={i} className="flex justify-between items-center bg-secondary/20 p-3 rounded-xl border border-border/20">
                                            <span className="font-medium text-sm text-foreground/90">{h.name}</span>
                                            <span className="font-numbers text-xs text-muted-foreground bg-secondary/30 px-2 py-1 rounded-md">{h.date}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </TabsContent>

                        {/* CITIES TAB */}
                        <TabsContent value="cities" className="space-y-4 mt-2 animate-slide-up">
                            <div className="bg-secondary/30 rounded-3xl p-5 border border-border/50 min-h-[300px]">
                                <div className="flex justify-between items-end mb-4">
                                    <div>
                                        <h3 className="font-display font-bold text-lg flex items-center gap-2"><Building className="w-5 h-5 text-muted-foreground" /> Cities</h3>
                                        <p className="text-xs text-muted-foreground mt-1">Tap to mark as visited</p>
                                    </div>
                                    <div className="text-right flex flex-col items-end">
                                        <div className="font-numbers text-2xl font-bold text-foreground">
                                            {visitedCountInCountry} <span className="text-muted-foreground text-lg">/ {cities.length}</span>
                                        </div>
                                        <div className="w-24 h-1 bg-secondary/50 rounded-full mt-2 overflow-hidden mb-2">
                                            <div
                                                className="h-full bg-green-400 transition-all duration-500 ease-out"
                                                style={{ width: `${progressPercentage}%` }}
                                            />
                                        </div>

                                        {/* View Mode Toggle */}
                                        {regions.length > 0 && (
                                            <div className="flex bg-muted p-1 rounded-lg border border-border/20">
                                                <button
                                                    onClick={() => setViewMode('all')}
                                                    className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${viewMode === 'all' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                                >
                                                    All
                                                </button>
                                                <button
                                                    onClick={() => setViewMode('regions')}
                                                    className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${viewMode === 'regions' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                                >
                                                    Regions
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {viewMode === 'all' ? (
                                    <>
                                        {/* Search */}
                                        <div className="relative mb-4">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
                                            <input
                                                type="text"
                                                placeholder="Search cities..."
                                                value={citySearch}
                                                onChange={(e) => setCitySearch(e.target.value)}
                                                className="w-full bg-black/20 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors"
                                            />
                                        </div>

                                        {isLoadingCities ? (
                                            <div className="flex flex-col items-center justify-center py-10 opacity-50">
                                                <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin mb-2" />
                                                <span className="text-xs text-white/50">Loading cities...</span>
                                            </div>
                                        ) : cities.length > 0 ? (
                                            <>
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-1 content-start">
                                                    {filteredCities.slice(0, visibleCitiesCount).map((city, i) => {
                                                        const visited = isCityVisited(city);
                                                        return (
                                                            <button
                                                                key={i}
                                                                onClick={() => toggleCity(city)}
                                                                className={`flex items-center gap-2 p-3 rounded-xl transition-all border group text-left relative overflow-hidden
                                                                    ${visited
                                                                        ? 'bg-green-500/10 border-green-500/30 hover:bg-green-500/20'
                                                                        : 'bg-secondary/50 border-border/20 hover:bg-secondary hover:border-border/50'
                                                                    }
                                                                `}
                                                            >
                                                                <div className={`w-4 h-4 rounded-full flex items-center justify-center border transition-colors flex-shrink-0
                                                                    ${visited ? 'bg-green-500 border-green-500' : 'border-white/20 group-hover:border-white/40'}
                                                                `}>
                                                                    {visited && <Check className="w-2.5 h-2.5 text-black font-bold" />}
                                                                </div>
                                                                <span className={`text-sm truncate font-medium transition-colors ${visited ? 'text-white' : 'text-white/80 group-hover:text-white'}`}>
                                                                    {city}
                                                                </span>
                                                                {visited && (
                                                                    <div className="absolute inset-0 bg-green-400/5 pointer-events-none" />
                                                                )}
                                                            </button>
                                                        );
                                                    })}

                                                    {/* Load More Trigger */}
                                                    {visibleCitiesCount < filteredCities.length && (
                                                        <div className="col-span-full flex justify-center py-4">
                                                            <button
                                                                onClick={() => setVisibleCitiesCount(prev => prev + 50)}
                                                                className="text-xs text-white/50 hover:text-white border border-white/10 rounded-full px-4 py-2 transition-all hover:bg-white/5"
                                                            >
                                                                Load More Cities ({filteredCities.length - visibleCitiesCount} remaining)
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="mt-4 text-[10px] text-white/50 text-center uppercase tracking-widest flex justify-between px-2">
                                                    <span>Showing {Math.min(visibleCitiesCount, filteredCities.length)} of {filteredCities.length}</span>
                                                    <span>{Math.round((Math.min(visibleCitiesCount, filteredCities.length) / filteredCities.length) * 100)}% Loaded</span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-center py-10 text-muted-foreground text-sm">
                                                No cities found.
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    // REGIONS VIEW
                                    <div className="space-y-2 max-h-[450px] overflow-y-auto custom-scrollbar pr-1">
                                        {regions.map((region, i) => {
                                            const isExpanded = expandedRegion === region.name;
                                            const cities = regionCities[region.name] || [];
                                            const loading = isLoadingRegionCities === region.name;
                                            const visitedCount = cities.filter(c => isCityVisited(c)).length;
                                            const isRegionVisited = cities.length > 0 && visitedCount > 0;

                                            return (
                                                <div key={i} className="bg-secondary/20 rounded-xl border border-border/20 overflow-hidden transition-all">
                                                    <button
                                                        onClick={() => handleRegionClick(region.name)}
                                                        className={`w-full flex items-center justify-between p-4 hover:bg-secondary/40 transition-colors ${isExpanded ? 'bg-secondary/40' : ''}`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-colors
                                                                ${isRegionVisited ? 'bg-green-500/20 border-green-500/30 text-green-500' : 'bg-secondary border-border/20 text-muted-foreground'}
                                                            `}>
                                                                {isRegionVisited ? <Check className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                                                            </div>
                                                            <div className="text-left">
                                                                <div className="font-bold text-sm text-foreground">{region.name}</div>
                                                                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{region.state_code}</div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {cities.length > 0 && (
                                                                <span className="text-xs text-muted-foreground font-numbers">{visitedCount}/{cities.length}</span>
                                                            )}
                                                            <ArrowRight className={`w-4 h-4 text-white/50 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} />
                                                        </div>
                                                    </button>

                                                    {isExpanded && (
                                                        <div className="p-4 pt-0 border-t border-border/10 bg-muted/10 animate-fade-in">
                                                            {loading ? (
                                                                <div className="flex justify-center py-4">
                                                                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                                                </div>
                                                            ) : cities.length > 0 ? (
                                                                <div className="grid grid-cols-2 gap-2 mt-4">
                                                                    {cities.map((city, idx) => {
                                                                        const visited = isCityVisited(city);
                                                                        return (
                                                                            <button
                                                                                key={idx}
                                                                                onClick={() => toggleCity(city)}
                                                                                className={`flex items-center gap-2 p-2.5 rounded-lg transition-all border text-left
                                                                                    ${visited
                                                                                        ? 'bg-green-500/10 border-green-500/20 hover:bg-green-500/20'
                                                                                        : 'bg-background border-border/20 hover:bg-secondary hover:border-border/50'
                                                                                    }
                                                                                `}
                                                                            >
                                                                                <div className={`w-3 h-3 rounded-full flex items-center justify-center border flex-shrink-0
                                                                                    ${visited ? 'bg-green-500 border-green-500' : 'border-white/20'}
                                                                                `}>
                                                                                    {visited && <Check className="w-2 h-2 text-black font-bold" />}
                                                                                </div>
                                                                                <span className={`text-xs truncate font-medium ${visited ? 'text-white' : 'text-white/70'}`}>
                                                                                    {city}
                                                                                </span>
                                                                            </button>
                                                                        )
                                                                    })}
                                                                </div>
                                                            ) : (
                                                                <div className="text-center py-4 text-xs text-white/50">
                                                                    No cities found in this region.
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        {/* VISA TAB */}
                        <TabsContent value="visa" className="space-y-6 mt-2 animate-slide-up">
                            {userPassportCode && userPassportCode !== country.code && (
                                <div className="bg-gradient-to-r from-blue-600/20 to-indigo-600/20 rounded-3xl p-1 border border-blue-500/30">
                                    <div className="bg-card/40 backdrop-blur-md rounded-[22px] p-6">
                                        <h3 className="text-muted-foreground uppercase tracking-wider text-xs font-bold mb-4 flex items-center gap-2">
                                            <CreditCard className="w-3.5 h-3.5" />
                                            Visa Requirement for {userPassport?.name}
                                        </h3>

                                        {userVisaInfo ? (
                                            <div className="flex flex-col gap-4">
                                                <div className="flex items-center justify-between">
                                                    <span
                                                        className="font-display text-2xl md:text-3xl font-bold"
                                                        style={{ color: getVisaRequirementColor(userVisaInfo.requirement) }}
                                                    >
                                                        {getVisaRequirementLabel(userVisaInfo.requirement)}
                                                    </span>
                                                    {userVisaInfo.duration && (
                                                        <span className="font-numbers text-lg font-medium text-foreground/80 bg-secondary/30 px-3 py-1 rounded-lg">
                                                            {userVisaInfo.duration} Days
                                                        </span>
                                                    )}
                                                </div>
                                                {userVisaInfo.notes && (
                                                    <p className="text-sm text-muted-foreground bg-secondary/20 p-3 rounded-xl border border-border/20">
                                                        ℹ️ {userVisaInfo.notes}
                                                    </p>
                                                )}
                                                <a
                                                    href={`https://en.wikipedia.org/wiki/Visa_requirements_for_${userPassport?.name?.replace(/ /g, '_')}_citizens`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 mt-2"
                                                >
                                                    Verify on Wikipedia ↗
                                                </a>
                                            </div>
                                        ) : (
                                            <div className="text-yellow-400 flex items-center gap-2">
                                                <AlertTriangle className="w-5 h-5" /> Data unavailable
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Power List */}
                            <div className="space-y-4">
                                <h3 className="font-display font-bold text-xl px-2">Passport Power 🌍</h3>
                                <div className="bg-secondary/20 rounded-3xl p-1 border border-border/20">
                                    <div className="max-h-[400px] overflow-y-auto no-scrollbar rounded-[20px] bg-background/40">
                                        <table className="w-full text-left border-collapse">
                                            <thead className="bg-secondary/40 sticky top-0 backdrop-blur-md z-10">
                                                <tr>
                                                    <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Destination</th>
                                                    <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Access</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border/10">
                                                {visaFreeAccessList.map(c => (
                                                    <tr key={c.code} className="hover:bg-secondary/10 transition-colors">
                                                        <td className="p-4 flex items-center gap-3">
                                                            <span className="text-2xl">{c.flagEmoji}</span>
                                                            <span className="font-medium text-sm text-foreground/90">{c.name}</span>
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <span className="bg-green-500/20 text-green-400 text-[10px] font-bold px-2 py-1 rounded-full border border-green-500/20">
                                                                VISA FREE
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* TRANSPORT TAB */}
                        <TabsContent value="transport" className="space-y-6 mt-2 animate-slide-up">
                            <div className="grid grid-cols-1 gap-4">
                                {/* Airports */}
                                <div className="bg-secondary/20 rounded-3xl p-6 border border-border/20 relative overflow-hidden">
                                    <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2 relative z-10"><Plane className="w-5 h-5 text-muted-foreground" /> Major Airports</h3>
                                    <div className="space-y-3 relative z-10">
                                        {richData?.mainAirports && richData.mainAirports.length > 0 ? (
                                            richData.mainAirports.map(airport => (
                                                <div key={airport.code} className="flex justify-between items-center bg-secondary/20 p-4 rounded-2xl border border-border/20 hover:border-border/50 transition-colors">
                                                    <div>
                                                        <div className="font-bold text-base text-foreground">{airport.name}</div>
                                                        <div className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">International</div>
                                                    </div>
                                                    <div className="font-mono text-xl font-bold text-muted-foreground/50 tracking-widest">{airport.code}</div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-6">
                                                <p className="text-muted-foreground mb-4 text-sm">Airport details are being updated.</p>
                                                <a
                                                    href={`https://www.google.com/travel/flights?q=Flights+to+${country.name}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold transition-all shadow-lg shadow-blue-500/20"
                                                >
                                                    <Plane className="w-4 h-4" />
                                                    Find Flights to {country.name}
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                    {richData?.mainAirports && richData.mainAirports.length > 0 && (
                                        <a
                                            href={`https://www.google.com/travel/flights?q=Flights+to+${country.name}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="mt-4 flex items-center justify-center gap-2 w-full p-3 rounded-xl bg-secondary/50 hover:bg-secondary border border-border/20 text-sm font-medium transition-colors"
                                        >
                                            Check Flight Prices on Google
                                        </a>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-secondary/20 rounded-3xl p-6 border border-border/20 flex flex-col items-center justify-center text-center">
                                        <Car className="w-8 h-8 text-muted-foreground mb-3" />
                                        <div className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">Driving Side</div>
                                        <div className="font-display text-2xl font-bold capitalize text-foreground">{extendedData?.car?.side || 'Right'}</div>
                                    </div>
                                    <div className="bg-secondary/20 rounded-3xl p-6 border border-border/20 flex flex-col items-center justify-center text-center">
                                        <MapPin className="w-8 h-8 text-muted-foreground mb-3" />
                                        <div className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">Maps</div>
                                        <a href={extendedData?.maps?.googleMaps} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline font-bold text-lg">Open Map ↗</a>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* WEATHER TAB */}
                        <TabsContent value="weather" className="space-y-6 mt-2 animate-slide-up">
                            {/* Climate Info - Prominent */}
                            <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-3xl p-8 border border-border/20 shadow-glow relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:opacity-30 transition-opacity">
                                    <CloudSun className="w-32 h-32 text-foreground" />
                                </div>

                                <div className="relative z-10">
                                    <div className="bg-background/20 backdrop-blur-md w-fit px-3 py-1 rounded-full text-xs font-bold text-foreground mb-4 flex items-center gap-2 border border-border/10">
                                        <Sparkles className="w-3 h-3 text-yellow-400" />
                                        Climate Analysis
                                    </div>

                                    <h4 className="font-display text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                                        <span className="text-4xl">{richData?.climate.seasonEmojis || '🌍'}</span>
                                        Climate Overview
                                    </h4>

                                    <p className="text-lg text-foreground/80 leading-relaxed font-light">
                                        {richData?.climate.text || "Climate data is currently being updated for this region."}
                                    </p>

                                    <div className="mt-8 flex flex-wrap gap-3">
                                        <div className="bg-background/20 backdrop-blur-md px-4 py-3 rounded-2xl border border-border/10 flex items-center gap-3">
                                            <div className="bg-green-500/20 p-2 rounded-full text-green-400">
                                                <CalendarIcon className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Best Time</div>
                                                <div className="text-foreground font-bold">{richData?.climate.bestTime || "Year-round"}</div>
                                            </div>
                                        </div>

                                        <a
                                            href={`https://www.google.com/search?q=weather+in+${extendedData?.capital?.[0] || country.name}+forecast`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="bg-background/20 hover:bg-background/30 backdrop-blur-md px-4 py-3 rounded-2xl border border-border/10 flex items-center gap-2 transition-all group/btn"
                                        >
                                            <span className="text-sm font-medium text-foreground group-hover/btn:text-blue-300">View Detailed Forecast</span>
                                            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover/btn:translate-x-1 transition-transform" />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* DETAILS / SAFETY TAB */}
                        <TabsContent value="details" className="space-y-6 mt-2 animate-slide-up">

                            {/* Demographics / Religion */}
                            {richData?.religionDistribution && (
                                <div className="bg-secondary/20 rounded-3xl p-6 border border-border/20">
                                    <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2 text-foreground"><Users className="w-5 h-5 text-muted-foreground" /> Religious Diversity</h3>
                                    <div className="space-y-4">
                                        {richData.religionDistribution.map((rel, i) => (
                                            <div key={i}>
                                                <div className="flex justify-between text-sm mb-1.5">
                                                    <span className="text-foreground/80 font-medium">{rel.name}</span>
                                                    <span className="text-muted-foreground font-numbers">{rel.percentage}%</span>
                                                </div>
                                                <div className="h-2 w-full bg-secondary/50 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full"
                                                        style={{ width: `${rel.percentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Macro Stats (GDP / HDI) */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-secondary/20 rounded-3xl p-5 border border-border/20 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-10">
                                        <Briefcase className="w-16 h-16 text-foreground" />
                                    </div>
                                    <div className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5 min-h-[20px]"><Briefcase className="w-3.5 h-3.5" /> GDP</div>
                                    <div className="font-numbers text-xl font-bold text-foreground">{richData?.gdp || 'N/A'}</div>
                                </div>
                                <div className="bg-secondary/20 rounded-3xl p-5 border border-border/20 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-10">
                                        <Activity className="w-16 h-16 text-foreground" />
                                    </div>
                                    <div className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5 min-h-[20px]"><Activity className="w-3.5 h-3.5" /> HDI</div>
                                    <div className="font-numbers text-xl font-bold text-foreground">{richData?.hdi || 'N/A'}</div>
                                </div>
                                <div className="bg-secondary/20 rounded-3xl p-5 border border-border/20 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-10">
                                        <Globe className="w-16 h-16 text-foreground" />
                                    </div>
                                    <div className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5 min-h-[20px]"><Globe className="w-3.5 h-3.5" /> Area</div>
                                    <div className="font-numbers text-xl font-bold text-foreground">{richData?.area ? `${richData.area.toLocaleString()} km²` : 'N/A'}</div>
                                </div>
                                <div className="bg-secondary/20 rounded-3xl p-5 border border-border/20 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-10">
                                        <TrendingUp className="w-16 h-16 text-foreground" />
                                    </div>
                                    <div className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5 min-h-[20px]"><TrendingUp className="w-3.5 h-3.5" /> Gini</div>
                                    <div className="font-numbers text-xl font-bold text-foreground">{richData?.gini || 'N/A'}</div>
                                </div>
                            </div>
                            {/* Emergency Grid */}
                            <div className="grid grid-cols-1 gap-4">
                                <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-6 relative overflow-hidden">
                                    <div className="absolute right-0 top-0 p-4 opacity-5 pointer-events-none">
                                        <ShieldAlert className="w-32 h-32" />
                                    </div>
                                    <h3 className="text-red-400 font-bold uppercase tracking-wider text-xs mb-4 flex items-center gap-2 relative z-10">
                                        <ShieldAlert className="w-4 h-4" /> Emergency Contacts
                                    </h3>
                                    <div className="grid grid-cols-3 gap-3 relative z-10">
                                        <div className="bg-secondary/20 backdrop-blur-sm rounded-2xl p-3 text-center border border-red-500/10">
                                            <div className="font-numbers text-xl font-bold text-red-500">{richData?.emergency.police || '112'}</div>
                                            <div className="text-[10px] text-red-500/60 uppercase font-bold mt-1">Police</div>
                                        </div>
                                        <div className="bg-secondary/20 backdrop-blur-sm rounded-2xl p-3 text-center border border-red-500/10">
                                            <div className="font-numbers text-xl font-bold text-red-500">{richData?.emergency.ambulance || '112'}</div>
                                            <div className="text-[10px] text-red-500/60 uppercase font-bold mt-1">Ambulance</div>
                                        </div>
                                        <div className="bg-secondary/20 backdrop-blur-sm rounded-2xl p-3 text-center border border-red-500/10">
                                            <div className="font-numbers text-xl font-bold text-red-500">{richData?.emergency.fire || '112'}</div>
                                            <div className="text-[10px] text-red-500/60 uppercase font-bold mt-1">Fire</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Health & Safety Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-blue-500/10 border border-blue-500/20 rounded-3xl p-5 relative overflow-hidden group">
                                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Droplet className="w-16 h-16" />
                                    </div>
                                    <div className="relative z-10">
                                        <div className="text-blue-300 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5"><Droplet className="w-3.5 h-3.5" /> Water</div>
                                        <div className="font-display text-lg font-bold text-foreground">{richData?.waterRating || 'Check Local Advice'}</div>
                                    </div>
                                </div>

                                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-3xl p-5 relative overflow-hidden group">
                                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Syringe className="w-16 h-16" />
                                    </div>
                                    <div className="relative z-10">
                                        <div className="text-yellow-600 dark:text-yellow-300 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5"><Syringe className="w-3.5 h-3.5" /> Vaccinations</div>
                                        <div className="font-display text-lg font-bold text-foreground">{richData?.vaccinations || 'Routine'}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Local Law & Tech */}
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="bg-secondary/20 rounded-3xl p-5 border border-border/20 hover:border-border/50 transition-colors">
                                    <div className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5"><Beer className="w-3.5 h-3.5" /> Alcohol Age</div>
                                    <div className="flex items-baseline gap-1">
                                        <div className="font-numbers text-2xl font-bold text-foreground">{richData?.alcohol ? richData.alcohol.drinkingAge : '18'}</div>
                                        <div className="text-xs text-muted-foreground">Drinking</div>
                                    </div>
                                </div>

                                <div className="bg-secondary/20 rounded-3xl p-5 border border-border/20 hover:border-border/50 transition-colors">
                                    <div className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Dial Code</div>
                                    <div className="font-numbers text-2xl font-bold">{richData?.dialCode && richData.dialCode !== 'N/A' ? richData.dialCode : (extendedData?.idd?.root ? `${extendedData.idd.root}${extendedData.idd.suffixes?.length === 1 ? extendedData.idd.suffixes[0] : ''}` : '--')}</div>
                                </div>

                                <div className="bg-secondary/20 rounded-3xl p-5 border border-border/20 hover:border-border/50 transition-colors col-span-2 lg:col-span-1">
                                    <div className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5"><Plug className="w-3.5 h-3.5" /> Plugs</div>
                                    <div className="font-display text-lg font-bold text-foreground">{richData?.plugs ? richData.plugs.map(p => p.type).join(' + ') : '--'}</div>
                                </div>
                            </div>

                            {/* Currency */}
                            <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-3xl p-6 border border-emerald-500/20 flex items-center justify-between">
                                <div>
                                    <div className="text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5" /> Currency</div>
                                    <div className="font-display text-xl font-bold text-foreground flex items-center gap-2">
                                        {currencyStr}
                                        {exchangeRate && <span className="text-sm font-normal text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-lg border border-border/20">1 USD = {exchangeRate.toFixed(2)}</span>}
                                    </div>
                                </div>
                            </div>

                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );

    if (!isModal) return content;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fade-in">
            <div className="absolute inset-0" onClick={onClose} />
            {content}
        </div>
    );
};

function AlertCertificate(props: any) {
    return <AlertTriangle {...props} />;
}
