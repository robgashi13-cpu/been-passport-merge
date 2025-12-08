import { fetchCountryData, CountryExtendedData, getStaticTravelInfo, getRichCountryData, RichCountryInfo, fetchCountryCities, fetchCountryStates, fetchStateCities } from '@/services/countryService';
import { fetchCountrySummary, WikiSummary } from '@/services/wikiService';
import { useUser } from '@/contexts/UserContext';
import { useEffect, useState, useMemo } from 'react';
import { Country, getCountryByCode, countries } from '@/data/countries';
import { getVisaRequirementFromMatrix, getVisaRequirementColor, getVisaRequirementLabel } from '@/data/visaMatrix';
import { X, Globe, Users, MapPin, Plane, CreditCard, Check, AlertCircle, Phone, Plug, AlertTriangle, Calendar as CalendarIcon, Tag, Heart, DollarSign, CloudSun, Sparkles, Car, Droplet, Syringe, Beer, TrendingUp, Briefcase, Activity, Building, Search, ArrowRight } from 'lucide-react';
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
    const { visitedCities, updateVisitedCities } = useUser();
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
        <div className={`bg-black/95 backdrop-blur-2xl border border-white/10 w-full animate-scale-in flex flex-col relative overflow-hidden ${isModal ? 'rounded-2xl max-w-2xl max-h-[90vh]' : 'h-full bg-transparent border-none animate-none'}`}>

            {/* Modal Close Button (Fixed Overlay) */}
            {isModal && (
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-50 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-white/70 hover:bg-white/10 transition-colors"
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
                                <h2 className="font-display text-2xl font-bold tracking-tight text-white leading-tight">{country.name}</h2>
                                <p className="text-white/50 text-[10px] uppercase tracking-wider font-medium">{country.continent} • {country.code}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 pr-10">
                            {/* NEW: Cities Visited Pill (Visible without scrolling tabs) */}
                            {cities.length > 0 && (
                                <div className="hidden min-[400px]:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                                    <MapPin className={`w-3 h-3 ${visitedCountInCountry > 0 ? 'text-green-400' : 'text-white/40'}`} />
                                    <span className="text-xs font-bold text-white/90 font-numbers">{visitedCountInCountry} <span className="text-white/40">/ {cities.length}</span></span>
                                </div>
                            )}

                            <button
                                onClick={onToggleVisited}
                                className={`flex items-center justify-center w-10 h-10 rounded-full transition-all border
                                    ${isVisited
                                        ? 'bg-green-500/20 text-green-400 border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.2)]'
                                        : 'bg-white/5 text-white/70 hover:bg-white/10 border-white/10 hover:border-white/20'
                                    }`}
                            >
                                {isVisited ? <Check className="w-5 h-5" /> : <Plane className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-4 pt-2">
                    <Tabs defaultValue="overview" className="w-full space-y-4">
                        <div className="sticky top-0 z-40 bg-transparent pt-2 pb-2 -mx-4 px-4 backdrop-blur-xl transition-all">
                            <TabsList className="flex w-full overflow-x-auto no-scrollbar gap-2 bg-transparent p-0 border-none h-auto">
                                <TabsTrigger value="overview" className="flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-all data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:backdrop-blur-md data-[state=active]:border-white/10 text-white/40 hover:text-white/80 border border-transparent">Overview</TabsTrigger>
                                <TabsTrigger value="cities" className="flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-all data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:backdrop-blur-md data-[state=active]:border-white/10 text-white/40 hover:text-white/80 border border-transparent">Cities</TabsTrigger>
                                <TabsTrigger value="visa" className="flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-all data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:backdrop-blur-md data-[state=active]:border-white/10 text-white/40 hover:text-white/80 border border-transparent">Visa</TabsTrigger>
                                <TabsTrigger value="transport" className="flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-all data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:backdrop-blur-md data-[state=active]:border-white/10 text-white/40 hover:text-white/80 border border-transparent">Transport</TabsTrigger>
                                <TabsTrigger value="weather" className="flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-all data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:backdrop-blur-md data-[state=active]:border-white/10 text-white/40 hover:text-white/80 border border-transparent">Weather</TabsTrigger>
                                <TabsTrigger value="details" className="flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-all data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:backdrop-blur-md data-[state=active]:border-white/10 text-white/40 hover:text-white/80 border border-transparent">Details</TabsTrigger>
                            </TabsList>
                        </div>

                        {/* OVERVIEW TAB - Modern Bento Grid */}
                        <TabsContent value="overview" className="space-y-4 mt-0 animate-slide-up">
                            {/* Summary Card with AI Badge */}
                            <div className="relative bg-gradient-to-br from-white/10 to-white/5 rounded-3xl p-5 border border-white/10 overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-50">
                                    <Sparkles className="w-24 h-24 text-white/5 -rotate-12" />
                                </div>

                                <div className="flex items-center gap-2 mb-3">
                                    <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-lg shadow-purple-500/20">
                                        <Sparkles className="w-3 h-3" /> AI Summary
                                    </div>
                                </div>

                                <div className="relative z-10">
                                    <p className={`text-white/80 leading-relaxed font-light text-sm transition-all overflow-hidden ${isDescExpanded ? 'max-h-full' : 'max-h-[4.5em] line-clamp-3'}`}>
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
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div className="bg-white/5 rounded-2xl p-4 border border-white/5 hover:border-white/10 transition-colors">
                                    <div className="text-white/40 text-[10px] uppercase font-bold tracking-wider mb-2 flex items-center gap-1.5"><Users className="w-3 h-3" /> Population</div>
                                    <div className="font-numbers text-xl md:text-2xl text-white font-medium">
                                        {extendedData?.population ? (extendedData.population / 1000000).toFixed(1) + 'M' : '-'}
                                    </div>
                                </div>
                                <div className="bg-white/5 rounded-2xl p-4 border border-white/5 hover:border-white/10 transition-colors">
                                    <div className="text-white/40 text-[10px] uppercase font-bold tracking-wider mb-2 flex items-center gap-1.5"><MapPin className="w-3 h-3" /> Capital</div>
                                    <div className="font-display text-lg text-white font-medium truncate">
                                        {extendedData?.capital?.[0] || 'N/A'}
                                    </div>
                                </div>
                                <div className="bg-white/5 rounded-2xl p-4 border border-white/5 hover:border-white/10 transition-colors">
                                    <div className="text-white/40 text-[10px] uppercase font-bold tracking-wider mb-2 flex items-center gap-1.5"><Globe className="w-3 h-3" /> Language</div>
                                    <div className="font-display text-lg text-white font-medium truncate">
                                        {extendedData?.languages ? Object.values(extendedData.languages)[0] : 'N/A'}
                                    </div>
                                </div>
                                <div className="bg-white/5 rounded-2xl p-4 border border-white/5 hover:border-white/10 transition-colors">
                                    <div className="text-white/40 text-[10px] uppercase font-bold tracking-wider mb-2 flex items-center gap-1.5"><Heart className="w-3 h-3" /> Religion</div>
                                    <div className="font-display text-lg text-white font-medium truncate">
                                        {richData?.majorReligion || 'N/A'}
                                    </div>
                                </div>
                            </div>

                            {/* Tags */}
                            {richData?.knownFor && (
                                <div className="flex flex-wrap gap-2">
                                    {richData.knownFor.map((tag, i) => (
                                        <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-white/70 hover:bg-white/10 transition-colors cursor-default">
                                            <Tag className="w-3 h-3 opacity-50" />
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Holidays */}
                            <div className="bg-white/5 rounded-3xl p-6 border border-white/5">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-display font-bold text-lg flex items-center gap-2"><CalendarIcon className="w-4 h-4 text-white/60" /> Public Holidays</h3>
                                    <a
                                        href={`https://www.google.com/search?q=public+holidays+in+${country.name}+2025`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[10px] font-bold text-white/50 hover:text-white transition-colors bg-white/5 px-3 py-1.5 rounded-full flex items-center gap-1 uppercase tracking-wider"
                                    >
                                        Search Google ↗
                                    </a>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {richData?.publicHolidays.slice(0, 4).map((h, i) => (
                                        <div key={i} className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/5">
                                            <span className="font-medium text-sm text-white/90">{h.name}</span>
                                            <span className="font-numbers text-xs text-white/50 bg-white/5 px-2 py-1 rounded-md">{h.date}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </TabsContent>

                        {/* CITIES TAB */}
                        <TabsContent value="cities" className="space-y-4 mt-2 animate-slide-up">
                            <div className="bg-white/5 rounded-3xl p-5 border border-white/5 min-h-[300px]">
                                <div className="flex justify-between items-end mb-4">
                                    <div>
                                        <h3 className="font-display font-bold text-lg flex items-center gap-2"><Building className="w-5 h-5 text-white/60" /> Cities</h3>
                                        <p className="text-xs text-white/40 mt-1">Tap to mark as visited</p>
                                    </div>
                                    <div className="text-right flex flex-col items-end">
                                        <div className="font-numbers text-2xl font-bold text-white">
                                            {visitedCountInCountry} <span className="text-white/30 text-lg">/ {cities.length}</span>
                                        </div>
                                        <div className="w-24 h-1 bg-white/10 rounded-full mt-2 overflow-hidden mb-2">
                                            <div
                                                className="h-full bg-green-400 transition-all duration-500 ease-out"
                                                style={{ width: `${progressPercentage}%` }}
                                            />
                                        </div>

                                        {/* View Mode Toggle */}
                                        {regions.length > 0 && (
                                            <div className="flex bg-black/20 p-1 rounded-lg border border-white/5">
                                                <button
                                                    onClick={() => setViewMode('all')}
                                                    className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${viewMode === 'all' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}
                                                >
                                                    All
                                                </button>
                                                <button
                                                    onClick={() => setViewMode('regions')}
                                                    className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${viewMode === 'regions' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}
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
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
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
                                                                        : 'bg-black/20 border-white/5 hover:bg-white/10 hover:border-white/10'
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
                                                <div className="mt-4 text-[10px] text-white/30 text-center uppercase tracking-widest flex justify-between px-2">
                                                    <span>Showing {Math.min(visibleCitiesCount, filteredCities.length)} of {filteredCities.length}</span>
                                                    <span>{Math.round((Math.min(visibleCitiesCount, filteredCities.length) / filteredCities.length) * 100)}% Loaded</span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-center py-10 text-white/40 text-sm">
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
                                                <div key={i} className="bg-black/20 rounded-xl border border-white/5 overflow-hidden transition-all">
                                                    <button
                                                        onClick={() => handleRegionClick(region.name)}
                                                        className={`w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors ${isExpanded ? 'bg-white/5' : ''}`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-colors
                                                                ${isRegionVisited ? 'bg-green-500/20 border-green-500/30 text-green-400' : 'bg-white/5 border-white/10 text-white/40'}
                                                            `}>
                                                                {isRegionVisited ? <Check className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                                                            </div>
                                                            <div className="text-left">
                                                                <div className="font-bold text-sm text-white">{region.name}</div>
                                                                <div className="text-[10px] text-white/40 uppercase tracking-wider">{region.state_code}</div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {cities.length > 0 && (
                                                                <span className="text-xs text-white/40 font-numbers">{visitedCount}/{cities.length}</span>
                                                            )}
                                                            <ArrowRight className={`w-4 h-4 text-white/30 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} />
                                                        </div>
                                                    </button>

                                                    {isExpanded && (
                                                        <div className="p-4 pt-0 border-t border-white/5 bg-black/10 animate-fade-in">
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
                                                                                        : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
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
                                                                <div className="text-center py-4 text-xs text-white/30">
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
                                    <div className="bg-black/40 backdrop-blur-md rounded-[22px] p-6">
                                        <h3 className="text-white/60 uppercase tracking-wider text-xs font-bold mb-4 flex items-center gap-2">
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
                                                        <span className="font-numbers text-lg font-medium text-white/80 bg-white/10 px-3 py-1 rounded-lg">
                                                            {userVisaInfo.duration} Days
                                                        </span>
                                                    )}
                                                </div>
                                                {userVisaInfo.notes && (
                                                    <p className="text-sm text-white/60 bg-white/5 p-3 rounded-xl border border-white/5">
                                                        ℹ️ {userVisaInfo.notes}
                                                    </p>
                                                )}
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
                                <div className="bg-white/5 rounded-3xl p-1 border border-white/10">
                                    <div className="max-h-[400px] overflow-y-auto no-scrollbar rounded-[20px] bg-black/20">
                                        <table className="w-full text-left border-collapse">
                                            <thead className="bg-white/5 sticky top-0 backdrop-blur-md z-10">
                                                <tr>
                                                    <th className="p-4 text-xs font-bold text-white/40 uppercase tracking-wider">Destination</th>
                                                    <th className="p-4 text-xs font-bold text-white/40 uppercase tracking-wider text-right">Access</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {visaFreeAccessList.map(c => (
                                                    <tr key={c.code} className="hover:bg-white/5 transition-colors">
                                                        <td className="p-4 flex items-center gap-3">
                                                            <span className="text-2xl">{c.flagEmoji}</span>
                                                            <span className="font-medium text-sm text-white/90">{c.name}</span>
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
                                <div className="bg-white/5 rounded-3xl p-6 border border-white/5 relative overflow-hidden">
                                    <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2 relative z-10"><Plane className="w-5 h-5 text-white/60" /> Major Airports</h3>
                                    <div className="space-y-3 relative z-10">
                                        {richData?.mainAirports && richData.mainAirports.length > 0 ? (
                                            richData.mainAirports.map(airport => (
                                                <div key={airport.code} className="flex justify-between items-center bg-black/40 p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                                                    <div>
                                                        <div className="font-bold text-base text-white">{airport.name}</div>
                                                        <div className="text-xs text-white/40 uppercase tracking-wider mt-0.5">International</div>
                                                    </div>
                                                    <div className="font-mono text-xl font-bold text-white/20 tracking-widest">{airport.code}</div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-6">
                                                <p className="text-white/40 mb-4 text-sm">Airport details are being updated.</p>
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
                                            className="mt-4 flex items-center justify-center gap-2 w-full p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium transition-colors"
                                        >
                                            Check Flight Prices on Google
                                        </a>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white/5 rounded-3xl p-6 border border-white/5 flex flex-col items-center justify-center text-center">
                                        <Car className="w-8 h-8 text-white/40 mb-3" />
                                        <div className="text-xs text-white/40 uppercase tracking-wider font-bold mb-1">Driving Side</div>
                                        <div className="font-display text-2xl font-bold capitalize">{extendedData?.car?.side || 'Right'}</div>
                                    </div>
                                    <div className="bg-white/5 rounded-3xl p-6 border border-white/5 flex flex-col items-center justify-center text-center">
                                        <MapPin className="w-8 h-8 text-white/40 mb-3" />
                                        <div className="text-xs text-white/40 uppercase tracking-wider font-bold mb-1">Maps</div>
                                        <a href={extendedData?.maps?.googleMaps} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline font-bold text-lg">Open Map ↗</a>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* WEATHER TAB */}
                        <TabsContent value="weather" className="space-y-6 mt-2 animate-slide-up">
                            {/* Climate Info - Prominent */}
                            <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-3xl p-8 border border-white/10 shadow-glow relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:opacity-30 transition-opacity">
                                    <CloudSun className="w-32 h-32 text-white" />
                                </div>

                                <div className="relative z-10">
                                    <div className="bg-white/10 backdrop-blur-md w-fit px-3 py-1 rounded-full text-xs font-bold text-white mb-4 flex items-center gap-2 border border-white/10">
                                        <Sparkles className="w-3 h-3 text-yellow-400" />
                                        Climate Analysis
                                    </div>

                                    <h4 className="font-display text-2xl font-bold text-white mb-4 flex items-center gap-3">
                                        <span className="text-4xl">{richData?.climate.seasonEmojis || '🌍'}</span>
                                        Climate Overview
                                    </h4>

                                    <p className="text-lg text-white/80 leading-relaxed font-light">
                                        {richData?.climate.text || "Climate data is currently being updated for this region."}
                                    </p>

                                    <div className="mt-8 flex flex-wrap gap-3">
                                        <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 flex items-center gap-3">
                                            <div className="bg-green-500/20 p-2 rounded-full text-green-400">
                                                <CalendarIcon className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="text-[10px] uppercase text-white/50 font-bold tracking-wider">Best Time</div>
                                                <div className="text-white font-bold">{richData?.climate.bestTime || "Year-round"}</div>
                                            </div>
                                        </div>

                                        <a
                                            href={`https://www.google.com/search?q=weather+in+${extendedData?.capital?.[0] || country.name}+forecast`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="bg-white/5 hover:bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 flex items-center gap-2 transition-all group/btn"
                                        >
                                            <span className="text-sm font-medium text-white group-hover/btn:text-blue-300">View Detailed Forecast</span>
                                            <ArrowRight className="w-4 h-4 text-white/50 group-hover/btn:translate-x-1 transition-transform" />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* DETAILS / SAFETY TAB */}
                        <TabsContent value="details" className="space-y-6 mt-2 animate-slide-up">

                            {/* Demographics / Religion */}
                            {richData?.religionDistribution && (
                                <div className="bg-white/5 rounded-3xl p-6 border border-white/5">
                                    <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2 text-white"><Users className="w-5 h-5 text-white/60" /> Religious Diversity</h3>
                                    <div className="space-y-4">
                                        {richData.religionDistribution.map((rel, i) => (
                                            <div key={i}>
                                                <div className="flex justify-between text-sm mb-1.5">
                                                    <span className="text-white/80 font-medium">{rel.name}</span>
                                                    <span className="text-white/40 font-numbers">{rel.percentage}%</span>
                                                </div>
                                                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
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
                                <div className="bg-white/5 rounded-3xl p-5 border border-white/5 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-10">
                                        <Briefcase className="w-16 h-16 text-white" />
                                    </div>
                                    <div className="text-white/40 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5" /> GDP</div>
                                    <div className="font-numbers text-xl font-bold">{richData?.gdp || 'N/A'}</div>
                                </div>
                                <div className="bg-white/5 rounded-3xl p-5 border border-white/5 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-10">
                                        <Activity className="w-16 h-16 text-white" />
                                    </div>
                                    <div className="text-white/40 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" /> HDI</div>
                                    <div className="font-numbers text-xl font-bold">{richData?.hdi || 'N/A'}</div>
                                </div>
                            </div>
                            {/* Emergency Grid */}
                            <div className="grid grid-cols-1 gap-4">
                                <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-6 relative overflow-hidden">
                                    <div className="absolute right-0 top-0 p-4 opacity-5 pointer-events-none">
                                        <AlertCertificate className="w-32 h-32" />
                                    </div>
                                    <h3 className="text-red-400 font-bold uppercase tracking-wider text-xs mb-4 flex items-center gap-2 relative z-10">
                                        <AlertCertificate className="w-4 h-4" /> Emergency Contacts
                                    </h3>
                                    <div className="grid grid-cols-3 gap-3 relative z-10">
                                        <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-3 text-center border border-red-500/10">
                                            <div className="font-numbers text-xl font-bold text-red-100">{richData?.emergency.police || '112'}</div>
                                            <div className="text-[10px] text-red-300/60 uppercase font-bold mt-1">Police</div>
                                        </div>
                                        <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-3 text-center border border-red-500/10">
                                            <div className="font-numbers text-xl font-bold text-red-100">{richData?.emergency.ambulance || '112'}</div>
                                            <div className="text-[10px] text-red-300/60 uppercase font-bold mt-1">Ambulance</div>
                                        </div>
                                        <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-3 text-center border border-red-500/10">
                                            <div className="font-numbers text-xl font-bold text-red-100">{richData?.emergency.fire || '112'}</div>
                                            <div className="text-[10px] text-red-300/60 uppercase font-bold mt-1">Fire</div>
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
                                        <div className="font-display text-lg font-bold text-white">{richData?.waterRating || 'Check Local Advice'}</div>
                                    </div>
                                </div>

                                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-3xl p-5 relative overflow-hidden group">
                                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Syringe className="w-16 h-16" />
                                    </div>
                                    <div className="relative z-10">
                                        <div className="text-yellow-300 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5"><Syringe className="w-3.5 h-3.5" /> Vaccinations</div>
                                        <div className="font-display text-lg font-bold text-white">{richData?.vaccinations || 'Routine'}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Local Law & Tech */}
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="bg-white/5 rounded-3xl p-5 border border-white/5 hover:bg-white/10 transition-colors">
                                    <div className="text-white/40 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5"><Beer className="w-3.5 h-3.5" /> Alcohol Age</div>
                                    <div className="flex items-baseline gap-1">
                                        <div className="font-numbers text-2xl font-bold">{richData?.alcohol ? richData.alcohol.drinkingAge : '18'}</div>
                                        <div className="text-xs text-white/40">Drinking</div>
                                    </div>
                                </div>

                                <div className="bg-white/5 rounded-3xl p-5 border border-white/5 hover:bg-white/10 transition-colors">
                                    <div className="text-white/40 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Dial Code</div>
                                    <div className="font-numbers text-2xl font-bold">{richData?.dialCode && richData.dialCode !== 'N/A' ? richData.dialCode : (extendedData?.idd?.root ? `${extendedData.idd.root}${extendedData.idd.suffixes?.length === 1 ? extendedData.idd.suffixes[0] : ''}` : '--')}</div>
                                </div>

                                <div className="bg-white/5 rounded-3xl p-5 border border-white/5 hover:bg-white/10 transition-colors col-span-2 lg:col-span-1">
                                    <div className="text-white/40 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5"><Plug className="w-3.5 h-3.5" /> Plugs</div>
                                    <div className="font-display text-lg font-bold">{richData?.plugs ? richData.plugs.map(p => p.type).join(' + ') : '--'}</div>
                                </div>
                            </div>

                            {/* Currency */}
                            <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-3xl p-6 border border-emerald-500/20 flex items-center justify-between">
                                <div>
                                    <div className="text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5" /> Currency</div>
                                    <div className="font-display text-xl font-bold text-white flex items-center gap-2">
                                        {currencyStr}
                                        {exchangeRate && <span className="text-sm font-normal text-white/50 bg-black/20 px-2 py-0.5 rounded-lg border border-white/10">1 USD = {exchangeRate.toFixed(2)}</span>}
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

// Start of Helper Component
function AlertCertificate(props: any) {
    return <AlertTriangle {...props} />
}
