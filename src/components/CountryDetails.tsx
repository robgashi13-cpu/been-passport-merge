import { fetchCountryData, CountryExtendedData, getStaticTravelInfo, getRichCountryData, RichCountryInfo, fetchCountryCities, fetchCountryStates, fetchStateCities } from '@/services/countryService';
import { fetchCountrySummary, WikiSummary } from '@/services/wikiService';
import { useUser } from '@/contexts/UserContext';
import { useEffect, useState, useMemo } from 'react';
import { Country, getCountryByCode, countries } from '@/data/countries';
import { getVisaRequirementFromMatrix, getVisaRequirementColor, getVisaRequirementLabel } from '@/data/visaMatrix';
import { X, Globe, Users, MapPin, Plane, CreditCard, Check, AlertCircle, Phone, Plug, AlertTriangle, Calendar as CalendarIcon, Tag, Heart, DollarSign, CloudSun, Sparkles, Car, Droplet, Syringe, Beer, TrendingUp, Briefcase, Activity, Building, Search, ArrowRight, Home, Bookmark, ShieldAlert, Cloud, Info, ChevronRight } from 'lucide-react';
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

    return (
        <div className={`bg-black/95 backdrop-blur-3xl w-full h-full animate-in fade-in zoom-in-95 duration-300 flex flex-col relative overflow-hidden ${isModal ? 'rounded-3xl max-w-4xl max-h-[92vh] border border-white/10 shadow-2xl shadow-black/50' : 'h-full bg-transparent border-none animate-none'}`}>

            {/* Modal Close Button (Floating) */}
            {isModal && (
                <button
                    onClick={onClose}
                    aria-label="Close country details"
                    className="absolute top-5 right-5 z-50 p-2.5 bg-black/40 hover:bg-black/60 rounded-full transition-all backdrop-blur-md border border-white/10 text-white/80 hover:text-white hover:rotate-90 duration-300"
                >
                    <X className="w-5 h-5" />
                </button>
            )}

            {/* Premium Header with Dynamic Gradient Mesh */}
            <div className="relative pt-10 pb-8 px-6 md:px-10 overflow-hidden shrink-0">
                {/* Dynamic Background */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/20 blur-[120px] rounded-full mix-blend-screen" />
                    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/10 blur-[100px] rounded-full mix-blend-screen" />
                </div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-4">
                            <span className="text-7xl md:text-8xl drop-shadow-2xl hover:scale-105 transition-transform cursor-default select-none">
                                {country.flagEmoji}
                            </span>
                            <div className="flex flex-col justify-center">
                                <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight text-white leading-none mb-2">
                                    {country.name}
                                </h2>
                                <div className="flex items-center gap-3">
                                    <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs font-bold uppercase tracking-wider text-white/80 backdrop-blur-sm">
                                        {country.continent}
                                    </span>
                                    <span className="text-white/40 text-xs font-mono">{country.code}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => updateLivedCountries(livedCountries.includes(country.code) ? livedCountries.filter(c => c !== country.code) : [...livedCountries, country.code])}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-full transition-all border font-medium text-sm
                            ${livedCountries.includes(country.code)
                                    ? 'bg-blue-500 text-white border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.5)]'
                                    : 'bg-white/5 text-white/60 hover:bg-white/10 border-white/10 hover:border-white/20 hover:text-white'
                                }`}
                        >
                            <Home className="w-4 h-4" />
                            {livedCountries.includes(country.code) ? 'Lived' : 'Lived'}
                        </button>

                        <button
                            onClick={onToggleVisited}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-full transition-all border font-bold text-sm
                            ${isVisited
                                    ? 'bg-emerald-500 text-white border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.5)]'
                                    : 'bg-white/5 text-white/60 hover:bg-white/10 border-white/10 hover:border-white/20 hover:text-white'
                                }`}
                        >
                            {isVisited ? <Check className="w-4 h-4" /> : <Plane className="w-4 h-4" />}
                            {isVisited ? 'Visited' : 'Mark Visited'}
                        </button>

                        <button
                            onClick={() => updateBucketList(bucketList.includes(country.code) ? bucketList.filter(c => c !== country.code) : [...bucketList, country.code])}
                            className={`flex items-center justify-center w-10 h-10 rounded-full transition-all border
                            ${bucketList.includes(country.code)
                                    ? 'bg-orange-500 text-white border-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.5)]'
                                    : 'bg-white/5 text-white/60 hover:bg-white/10 border-white/10 hover:border-white/20 hover:text-white'
                                }`}
                        >
                            <Bookmark className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto no-scrollbar bg-black/20">
                <div className="px-4 md:px-10 pb-10">
                    <Tabs defaultValue="overview" className="w-full space-y-6">
                        <div className="sticky top-0 z-40 bg-black/80 pt-4 pb-4 -mx-4 px-8 backdrop-blur-xl border-b border-white/5 flex gap-2 overflow-x-auto no-scrollbar snap-x">
                            {['overview', 'cities', 'visa', 'transport', 'weather', 'details'].map((tab) => (
                                <TabsTrigger
                                    key={tab}
                                    value={tab}
                                    className="snap-start rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-lg text-white/50 hover:text-white border border-transparent data-[state=active]:scale-105"
                                >
                                    {tab}
                                </TabsTrigger>
                            ))}
                        </div>

                        {/* OVERVIEW TAB */}
                        <TabsContent value="overview" className="space-y-6 mt-0 animate-in slide-in-from-bottom-5 duration-500">
                            {/* Hero Summary */}
                            <div className="relative bg-gradient-to-br from-white/10 to-white/5 rounded-3xl p-6 border border-white/10 overflow-hidden">
                                <Sparkles className="absolute top-4 right-4 w-6 h-6 text-yellow-400/50" />
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="px-2 py-0.5 rounded-md bg-gradient-to-r from-purple-500 to-indigo-500 text-[10px] font-bold text-white uppercase tracking-wider">
                                        AI Insight
                                    </div>
                                </div>
                                <p className="text-white/80 leading-relaxed font-light text-base md:text-lg">
                                    {isDescExpanded ? (wikiSummary?.extract || richData?.description) : (wikiSummary?.extract || richData?.description)?.slice(0, 200) + "..."}
                                </p>
                                <button
                                    onClick={() => setDescExpanded(!isDescExpanded)}
                                    className="text-xs font-bold text-blue-400 mt-3 hover:text-blue-300 flex items-center gap-1 uppercase tracking-wider"
                                >
                                    {isDescExpanded ? 'Read Less' : 'Read More'} <ChevronRight className="w-3 h-3" />
                                </button>
                            </div>

                            {/* Key Stats Bento Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <StatCard icon={<Users />} label="Population" value={extendedData?.population ? (extendedData.population / 1000000).toFixed(1) + 'M' : 'N/A'} />
                                <StatCard icon={<MapPin />} label="Capital" value={extendedData?.capital?.[0] || 'N/A'} />
                                <StatCard icon={<Globe />} label="Language" value={extendedData?.languages ? Object.values(extendedData.languages)[0] : 'N/A'} />
                                <StatCard icon={<Heart />} label="Vibe" value={richData?.majorReligion || 'Diverse'} />
                            </div>

                            {/* Tags */}
                            {richData?.knownFor && (
                                <div className="flex flex-wrap gap-2">
                                    {richData.knownFor.map((tag, i) => (
                                        <span key={i} className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-white/70 hover:bg-white/10 transition-colors cursor-default">
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Holidays Section */}
                            <div className="bg-white/5 rounded-3xl p-6 border border-white/10 hover:border-white/20 transition-colors">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="font-display font-bold text-xl text-white flex items-center gap-2">
                                        <CalendarIcon className="w-5 h-5 text-white/50" /> Public Holidays
                                    </h3>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {richData?.publicHolidays.slice(0, 4).map((h, i) => (
                                        <div key={i} className="flex justify-between items-center bg-black/20 p-4 rounded-2xl border border-white/5">
                                            <span className="font-medium text-sm text-white/90">{h.name}</span>
                                            <span className="font-mono text-xs text-white/50 bg-white/5 px-2 py-1 rounded-md border border-white/5">{h.date}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </TabsContent>

                        {/* CITIES TAB */}
                        <TabsContent value="cities" className="space-y-6 mt-0 animate-in slide-in-from-bottom-5 duration-500">
                            <div className="bg-gradient-to-br from-emerald-500/10 to-blue-500/10 rounded-3xl p-8 border border-emerald-500/20 relative overflow-hidden">
                                <div className="flex flex-col md:flex-row justify-between items-end gap-6 relative z-10">
                                    <div>
                                        <h3 className="text-2xl font-bold text-white mb-2">Exploration Status</h3>
                                        <div className="flex items-center gap-2 text-white/60 text-sm">
                                            <span>{visitedCountInCountry} regions visited</span>
                                            <span className="w-1 h-1 bg-white/40 rounded-full"></span>
                                            <span>{Math.round(progressPercentage)}% complete</span>
                                        </div>
                                    </div>
                                    <div className="w-full md:w-64">
                                        <div className="h-2 w-full bg-black/20 rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-500 transition-all duration-1000 ease-out" style={{ width: `${progressPercentage}%` }} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Search & Filter */}
                            <div className="flex gap-3">
                                <div className="relative flex-1">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                                    <input
                                        type="text"
                                        placeholder="Search cities..."
                                        value={citySearch}
                                        onChange={(e) => setCitySearch(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-10 pr-4 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors focus:bg-white/10"
                                    />
                                </div>
                                {regions.length > 0 && (
                                    <button
                                        onClick={() => setViewMode(viewMode === 'all' ? 'regions' : 'all')}
                                        className="px-5 rounded-2xl bg-white/5 border border-white/10 text-sm font-bold text-white/80 hover:bg-white/10 transition-colors uppercase tracking-wider"
                                    >
                                        {viewMode === 'all' ? 'Regions' : 'All Cities'}
                                    </button>
                                )}
                            </div>

                            {/* Grid */}
                            <div className="min-h-[300px]">
                                {isLoadingCities ? (
                                    <div className="flex flex-col items-center justify-center py-20 text-white/30">
                                        <div className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin mb-4" />
                                        <span className="text-xs uppercase tracking-widest">Loading Cities...</span>
                                    </div>
                                ) : (
                                    cityListRender(
                                        viewMode === 'all' ? filteredCities.slice(0, visibleCitiesCount) : regions,
                                        viewMode,
                                        isCityVisited,
                                        toggleCity,
                                        handleRegionClick,
                                        expandedRegion,
                                        regionCities,
                                        isLoadingRegionCities,
                                        visitedCities,
                                        country
                                    )
                                )}
                            </div>
                            {viewMode === 'all' && visibleCitiesCount < filteredCities.length && (
                                <button
                                    onClick={() => setVisibleCitiesCount(prev => prev + 50)}
                                    className="w-full py-4 text-xs font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors border-t border-white/5 hover:bg-white/5"
                                >
                                    Load More
                                </button>
                            )}
                        </TabsContent>

                        {/* VISA TAB */}
                        <TabsContent value="visa" className="space-y-6 mt-0 animate-in slide-in-from-bottom-5 duration-500">
                            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
                                <div className="absolute top-0 right-0 p-8 opacity-20">
                                    <CreditCard className="w-32 h-32 rotate-12" />
                                </div>

                                <h3 className="text-white/80 text-sm font-bold uppercase tracking-wider mb-2">Visa Requirement</h3>
                                <div className="relative z-10">
                                    {userPassportCode && userPassportCode !== country.code ? (
                                        userVisaInfo ? (
                                            <>
                                                <div className="text-5xl font-display font-bold mb-4">{getVisaRequirementLabel(userVisaInfo.requirement)}</div>
                                                {userVisaInfo.duration && (
                                                    <div className="inline-block bg-white/20 border border-white/20 rounded-lg px-3 py-1 text-sm font-medium mb-4">
                                                        Allowed Stay: {userVisaInfo.duration} Days
                                                    </div>
                                                )}
                                                {userVisaInfo.notes && (
                                                    <p className="text-white/80 max-w-lg bg-black/20 p-4 rounded-xl border border-white/10 text-sm leading-relaxed">
                                                        {userVisaInfo.notes}
                                                    </p>
                                                )}
                                            </>
                                        ) : (
                                            <div className="text-2xl font-bold flex items-center gap-2"><AlertTriangle /> Info Unavailable</div>
                                        )
                                    ) : (
                                        <div className="text-2xl font-bold">Domestic Travel / Home Country</div>
                                    )}
                                </div>
                            </div>

                            {/* Visa Free Access List */}
                            <div className="space-y-4">
                                <h4 className="text-lg font-bold text-white px-2">Visa-Free Access from {country.name}</h4>
                                <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
                                    {visaFreeAccessList.map((c, i) => (
                                        <div key={i} className="flex items-center justify-between p-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl">{c.flagEmoji}</span>
                                                <span className="text-sm font-medium text-white/90">{c.name}</span>
                                            </div>
                                            <span className="text-[10px] font-bold text-green-400 bg-green-500/10 px-2 py-1 rounded-full uppercase tracking-wider">Visa Free</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </TabsContent>

                        {/* TRANSPORT TAB */}
                        <TabsContent value="transport" className="space-y-4 mt-0 animate-in slide-in-from-bottom-5 duration-500">
                            {/* Airports */}
                            <div className="space-y-4">
                                {richData?.mainAirports?.map((airport) => (
                                    <div key={airport.code} className="bg-white/5 border border-white/10 rounded-2xl p-5 flex justify-between items-center group hover:border-white/20 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center">
                                                <Plane className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-lg text-white group-hover:text-blue-400 transition-colors">{airport.code}</div>
                                                <div className="text-sm text-white/60">{airport.name}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/5 rounded-3xl p-6 border border-white/10 flex flex-col items-center justify-center text-center">
                                    <Car className="w-8 h-8 text-white/50 mb-3" />
                                    <div className="text-xs text-white/40 uppercase tracking-widest font-bold mb-1">Driving Side</div>
                                    <div className="font-display text-2xl font-bold capitalize text-white">{extendedData?.car?.side || 'Right'}</div>
                                </div>
                                <div className="bg-white/5 rounded-3xl p-6 border border-white/10 flex flex-col items-center justify-center text-center">
                                    <MapPin className="w-8 h-8 text-white/50 mb-3" />
                                    <div className="text-xs text-white/40 uppercase tracking-widest font-bold mb-1">Maps</div>
                                    <a href={extendedData?.maps?.googleMaps} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 font-bold text-lg">Open Google Maps ↗</a>
                                </div>
                            </div>
                        </TabsContent>

                        {/* WEATHER TAB */}
                        <TabsContent value="weather" className="space-y-4 mt-0 animate-in slide-in-from-bottom-5 duration-500">
                            <div className="bg-gradient-to-br from-orange-400 to-pink-500 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
                                <CloudSun className="absolute -right-4 -top-4 w-40 h-40 text-white/20" />
                                <div className="relative z-10">
                                    <h4 className="text-lg font-bold mb-2">Climate Overview</h4>
                                    <div className="text-5xl mb-4">{richData?.climate.seasonEmojis}</div>
                                    <p className="text-white/90 font-light text-lg leading-relaxed">{richData?.climate.text}</p>
                                </div>
                            </div>

                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col items-center">
                                <h5 className="text-sm font-bold uppercase tracking-wider text-white/60 mb-2">Best Time to Visit</h5>
                                <p className="text-xl font-medium text-white text-center">{richData?.climate.bestTime}</p>
                            </div>
                        </TabsContent>

                        {/* DETAILS TAB */}
                        <TabsContent value="details" className="space-y-6 mt-0 animate-in slide-in-from-bottom-5 duration-500">
                            {/* Religious Breakdown */}
                            {richData?.religionDistribution && (
                                <div className="space-y-4">
                                    <h3 className="text-lg font-bold text-white px-2">Religious Distribution</h3>
                                    <div className="space-y-1">
                                        {richData.religionDistribution.map((rel, i) => (
                                            <div key={i} className="group">
                                                <div className="flex justify-between text-sm mb-2 px-2">
                                                    <span className="text-white/80">{rel.name}</span>
                                                    <span className="text-white/50">{rel.percentage}%</span>
                                                </div>
                                                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                                    <div className="h-full bg-indigo-500 group-hover:bg-indigo-400 transition-colors" style={{ width: `${rel.percentage}%` }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Economic Stats */}
                            <div className="grid grid-cols-2 gap-4">
                                <StatCard icon={<DollarSign />} label="GDP" value={richData?.gdp || 'N/A'} sub="Annual" />
                                <StatCard icon={<Activity />} label="HDI" value={richData?.hdi || 'N/A'} sub="Human Dev Index" />
                            </div>
                        </TabsContent>

                    </Tabs>
                </div>
            </div>
        </div>
    );
};

// Helper Components for Cleaner Code
const StatCard = ({ icon, label, value, sub }: { icon: any, label: string, value: string | number, sub?: string }) => (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/5 hover:bg-white/10 transition-colors">
        <div className="text-white/30 w-5 h-5 mb-3">{icon}</div>
        <div className="text-[10px] uppercase font-bold tracking-wider text-white/50 mb-1">{label}</div>
        <div className="text-xl font-bold text-white truncate">{value}</div>
        {sub && <div className="text-[10px] text-white/30 mt-1">{sub}</div>}
    </div>
);

// Extracted City List Logic to avoid deep nesting
const cityListRender = (
    items: any[],
    viewMode: string,
    isCityVisited: any,
    toggleCity: any,
    handleRegionClick: any,
    expandedRegion: any,
    regionCities: any,
    isLoadingRegionCities: any,
    visitedCities: any,
    country: any
) => {
    if (viewMode === 'all') {
        return (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {items.map((city, i) => {
                    const visited = isCityVisited(city);
                    return (
                        <button
                            key={i}
                            onClick={() => toggleCity(city)}
                            className={`relative text-left p-4 rounded-xl border transition-all ${visited ? 'bg-emerald-500/20 border-emerald-500/40' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${visited ? 'bg-emerald-500 border-emerald-500' : 'border-white/20'}`}>
                                    {visited && <Check className="w-2.5 h-2.5 text-black" />}
                                </div>
                            </div>
                            <span className={`text-sm font-medium ${visited ? 'text-white' : 'text-white/70'}`}>{city}</span>
                        </button>
                    )
                })}
            </div>
        )
    } else {
        return (
            <div className="space-y-3">
                {items.map((region: any, i: number) => {
                    const isExpanded = expandedRegion === region.name;
                    const cities = regionCities[region.name] || [];
                    const loading = isLoadingRegionCities === region.name;
                    const citiesInRegionCount = cities.length;
                    const visitedCount = cities.filter((c: string) => visitedCities.includes(`${c}|${country.code}`)).length;

                    return (
                        <div key={i} className="bg-white/5 rounded-2xl border border-white/5 overflow-hidden">
                            <button onClick={() => handleRegionClick(region.name)} className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${visitedCount > 0 ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-500' : 'bg-white/5 border-white/10 text-white/30'}`}>
                                        <MapPin className="w-5 h-5" />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-bold text-white">{region.name}</div>
                                        <div className="text-xs text-white/40">{region.state_code}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {cities.length > 0 && <span className="text-xs text-white/40">{visitedCount}/{cities.length}</span>}
                                    <ChevronRight className={`w-4 h-4 text-white/30 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                </div>
                            </button>

                            {isExpanded && (
                                <div className="p-4 pt-0 bg-black/20 border-t border-white/5">
                                    {loading ? (
                                        <div className="py-4 text-center text-xs text-white/30">Loading Regions...</div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-2 mt-4">
                                            {cities.map((city: string, idx: number) => {
                                                const visited = visitedCities.includes(`${city}|${country.code}`);
                                                return (
                                                    <button key={idx} onClick={() => toggleCity(city)} className={`text-left p-3 rounded-xl border transition-all flex items-center gap-3 ${visited ? 'bg-emerald-500/20 border-emerald-500/40' : 'bg-white/5 border-white/5'}`}>
                                                        <div className={`w-3 h-3 rounded-full border flex-shrink-0 flex items-center justify-center ${visited ? 'bg-emerald-500 border-emerald-500' : 'border-white/20'}`}>
                                                            {visited && <Check className="w-2 h-2 text-black" />}
                                                        </div>
                                                        <span className={`text-xs font-medium truncate ${visited ? 'text-white' : 'text-white/60'}`}>{city}</span>
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        )
    }
}
