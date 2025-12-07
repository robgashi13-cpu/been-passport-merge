import { fetchCountryData, CountryExtendedData, getStaticTravelInfo, getRichCountryData, RichCountryInfo, fetchCapitalWeather, getWeatherDescription } from '@/services/countryService';
import { fetchCountrySummary, WikiSummary } from '@/services/wikiService';
import { useEffect, useState } from 'react';
import { Country, getCountryByCode, countries } from '@/data/countries';
import { getVisaRequirementFromMatrix, getVisaRequirementColor, getVisaRequirementLabel } from '@/data/visaMatrix';
import { X, Globe, Users, MapPin, Plane, CreditCard, Check, AlertCircle, Phone, Plug, AlertTriangle, Calendar as CalendarIcon, Tag, Heart, DollarSign, CloudSun, Sparkles, Car } from 'lucide-react';
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
    const [userPassport, setUserPassport] = useState<Country | undefined>(undefined);
    const [userVisaInfo, setUserVisaInfo] = useState<any>(null);
    const [extendedData, setExtendedData] = useState<CountryExtendedData | null>(null);
    const [richData, setRichData] = useState<RichCountryInfo | null>(null);
    const [wikiSummary, setWikiSummary] = useState<WikiSummary | null>(null);
    const [weather, setWeather] = useState<any>(null);
    const [weatherDesc, setWeatherDesc] = useState<{ text: string; emoji: string } | null>(null);

    const [exchangeRate, setExchangeRate] = useState<number | null>(null);
    const [exchangeLoading, setExchangeLoading] = useState(false);
    const [allHolidaysOpen, setAllHolidaysOpen] = useState(false);

    // Initial data fetch
    useEffect(() => {
        if (country?.code) {
            // Parallel fetches
            fetchCountryData(country.code).then(data => {
                setExtendedData(data);
                if (data?.capitalInfo?.latlng) {
                    fetchCapitalWeather(data.capitalInfo.latlng[0], data.capitalInfo.latlng[1]).then(w => {
                        setWeather(w);
                        if (w?.current?.weather_code !== undefined) {
                            setWeatherDesc(getWeatherDescription(w.current.weather_code));
                        }
                    });
                }
            });

            setRichData(getRichCountryData(country.code));

            // AI/Wiki Data
            fetchCountrySummary(country.name).then(summary => {
                if (summary) setWikiSummary(summary);
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

    // Passport Power List (Where they can go)
    const visaFreeAccessList = countries.filter(c => {
        const req = getVisaRequirementFromMatrix(country.code, c.code);
        return req?.requirement === 'visa-free' || req?.requirement === 'visa-on-arrival';
    }).slice(0, 50);

    const content = (
        <div className={`bg-black/95 backdrop-blur-2xl border border-white/10 w-full overflow-y-auto animate-scale-in flex flex-col ${isModal ? 'rounded-2xl max-w-2xl max-h-[90vh]' : 'h-full bg-transparent border-none animate-none'}`}>

            {/* Ultra-Premium Header */}
            <div className="sticky top-0 bg-black/80 backdrop-blur-xl border-b border-white/10 p-5 z-20">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-5">
                        <div className="relative group">
                            <span className="text-6xl md:text-7xl drop-shadow-2xl transition-transform group-hover:scale-110 block">{country.flagEmoji}</span>
                            <div className="absolute -bottom-2 -right-2 bg-black/50 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/20 text-[10px] text-white/80 font-mono">
                                {country.code}
                            </div>
                        </div>
                        <div>
                            <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-white mb-1">{country.name}</h2>
                            <p className="text-white/50 text-sm font-medium flex items-center gap-2">
                                <Globe className="w-3.5 h-3.5" />
                                <span className="uppercase tracking-wider text-[10px]">{country.continent} • {extendedData?.subregion || 'Earth'}</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={onToggleVisited}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all border
                                ${isVisited
                                    ? 'bg-green-500/20 text-green-400 border-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.2)]'
                                    : 'bg-white/5 text-white/70 hover:bg-white/10 border-white/10 hover:border-white/20'
                                }`}
                        >
                            {isVisited ? <Check className="w-4 h-4" /> : <Plane className="w-4 h-4" />}
                            <span className="hidden sm:inline">{isVisited ? 'Visited' : 'Mark as Visited'}</span>
                        </button>

                        {isModal && (
                            <button
                                onClick={onClose}
                                className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-colors"
                            >
                                <X className="w-5 h-5 text-white/70" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="p-5 md:p-8 flex-1 overflow-y-auto no-scrollbar">
                <Tabs defaultValue="overview" className="w-full space-y-8">
                    <div className="sticky top-[88px] z-10 bg-black/95 pb-2 -mt-2">
                        <TabsList className="w-full grid grid-cols-5 bg-white/5 p-1 rounded-2xl border border-white/5">
                            <TabsTrigger value="overview" className="rounded-xl data-[state=active]:bg-white/10 data-[state=active]:text-white text-xs py-2.5 font-medium">Overview</TabsTrigger>
                            <TabsTrigger value="visa" className="rounded-xl data-[state=active]:bg-white/10 data-[state=active]:text-white text-xs py-2.5 font-medium">Visa</TabsTrigger>
                            <TabsTrigger value="transport" className="rounded-xl data-[state=active]:bg-white/10 data-[state=active]:text-white text-xs py-2.5 font-medium">Transport</TabsTrigger>
                            <TabsTrigger value="weather" className="rounded-xl data-[state=active]:bg-white/10 data-[state=active]:text-white text-xs py-2.5 font-medium">Weather</TabsTrigger>
                            <TabsTrigger value="details" className="rounded-xl data-[state=active]:bg-white/10 data-[state=active]:text-white text-xs py-2.5 font-medium">Details</TabsTrigger>
                        </TabsList>
                    </div>

                    {/* OVERVIEW TAB - Modern Bento Grid */}
                    <TabsContent value="overview" className="space-y-6 mt-2 animate-slide-up">
                        {/* Summary Card with AI Badge */}
                        <div className="relative bg-gradient-to-br from-white/10 to-white/5 rounded-3xl p-6 border border-white/10 overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-50">
                                <Sparkles className="w-24 h-24 text-white/5 -rotate-12" />
                            </div>

                            <div className="flex items-center gap-2 mb-3">
                                <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-lg shadow-purple-500/20">
                                    <Sparkles className="w-3 h-3" /> AI Summary
                                </div>
                            </div>

                            <p className="text-white/80 leading-relaxed font-light text-sm md:text-base relative z-10">
                                {wikiSummary?.extract || richData?.description || "Loading detailed information..."}
                            </p>
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
                                <button
                                    onClick={() => setAllHolidaysOpen(!allHolidaysOpen)}
                                    className="text-xs font-bold text-white/50 hover:text-white transition-colors bg-white/5 px-3 py-1 rounded-full"
                                >
                                    {allHolidaysOpen ? "Show Less" : "View All"}
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {richData?.publicHolidays.slice(0, allHolidaysOpen ? undefined : 4).map((h, i) => (
                                    <div key={i} className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/5">
                                        <span className="font-medium text-sm text-white/90">{h.name}</span>
                                        <span className="font-numbers text-xs text-white/50 bg-white/5 px-2 py-1 rounded-md">{h.date}</span>
                                    </div>
                                ))}
                            </div>
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
                            <div className="bg-white/5 rounded-3xl p-6 border border-white/5">
                                <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2"><Plane className="w-5 h-5 text-white/60" /> Major Airports</h3>
                                <div className="space-y-3">
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
                                        <div className="text-white/40 italic">Airport data loading...</div>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/5 rounded-3xl p-6 border border-white/5 flex flex-col items-center justify-center text-center">
                                    <Car className="w-8 h-8 text-white/40 mb-3" />
                                    <div className="text-xs text-white/40 uppercase tracking-wider font-bold mb-1">Driving Side</div>
                                    <div className="font-display text-2xl font-bold capitalize">{extendedData?.car?.side || 'Right'}</div>
                                </div>
                                <div className="bg-white/5 rounded-3xl p-6 border border-white/5 flex flex-col items-center justify-center text-center">
                                    <Phone className="w-8 h-8 text-white/40 mb-3" />
                                    <div className="text-xs text-white/40 uppercase tracking-wider font-bold mb-1">Rideshare</div>
                                    <div className="font-display text-lg font-bold">Uber / Bolt</div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* WEATHER TAB */}
                    <TabsContent value="weather" className="space-y-6 mt-2 animate-slide-up">
                        {/* Live Weather Card */}
                        <div className="relative bg-gradient-to-br from-blue-500 to-cyan-400 rounded-3xl p-8 border border-white/10 shadow-glow text-white overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                            <div className="relative z-10 flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2 mb-2 opacity-80">
                                        <MapPin className="w-4 h-4" />
                                        <span className="text-sm font-bold uppercase tracking-widest">{extendedData?.capital?.[0] || country.name}</span>
                                    </div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="font-numbers text-7xl font-bold tracking-tight">
                                            {weather?.current?.temperature_2m !== undefined ? Math.round(weather.current.temperature_2m) : '--'}
                                        </span>
                                        <span className="text-3xl font-light opacity-60">°C</span>
                                    </div>
                                    <div className="mt-4 text-xl font-medium flex items-center gap-2">
                                        {weatherDesc?.emoji} {weatherDesc?.text || 'Loading...'}
                                    </div>
                                </div>

                                <CloudSun className="w-20 h-20 text-white/30" />
                            </div>
                        </div>

                        {/* Climate Info */}
                        <div className="bg-white/5 rounded-3xl p-6 border border-white/5">
                            <div className="flex items-start gap-4">
                                <div className="bg-white/10 p-3 rounded-full text-2xl">
                                    {richData?.climate.seasonEmojis || '🌍'}
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg mb-1">Climate Overview</h4>
                                    <p className="text-sm text-white/70 leading-relaxed mb-4">{richData?.climate.text}</p>

                                    <div className="inline-flex items-center gap-2 bg-green-500/10 text-green-400 px-3 py-1.5 rounded-full text-xs font-bold border border-green-500/20">
                                        <Check className="w-3 h-3" /> Best time: {richData?.climate.bestTime}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* DETAILS / SAFETY TAB */}
                    <TabsContent value="details" className="space-y-6 mt-2 animate-slide-up">
                        {/* Emergency Grid */}
                        <div className="grid grid-cols-1 gap-4">
                            <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-6">
                                <h3 className="text-red-400 font-bold uppercase tracking-wider text-xs mb-4 flex items-center gap-2">
                                    <AlertCertificate className="w-4 h-4" /> Emergency Contacts
                                </h3>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="bg-red-500/10 rounded-2xl p-3 text-center">
                                        <div className="font-numbers text-xl font-bold text-red-100">{richData?.emergency.police || '112'}</div>
                                        <div className="text-[10px] text-red-300/60 uppercase font-bold mt-1">Police</div>
                                    </div>
                                    <div className="bg-red-500/10 rounded-2xl p-3 text-center">
                                        <div className="font-numbers text-xl font-bold text-red-100">{richData?.emergency.ambulance || '112'}</div>
                                        <div className="text-[10px] text-red-300/60 uppercase font-bold mt-1">Ambulance</div>
                                    </div>
                                    <div className="bg-red-500/10 rounded-2xl p-3 text-center">
                                        <div className="font-numbers text-xl font-bold text-red-100">{richData?.emergency.fire || '112'}</div>
                                        <div className="text-[10px] text-red-300/60 uppercase font-bold mt-1">Fire</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/5 rounded-3xl p-5 border border-white/5">
                                <div className="text-white/40 text-xs font-bold uppercase tracking-wider mb-2">Dial Code</div>
                                <div className="font-numbers text-2xl font-bold">{richData?.dialCode}</div>
                            </div>
                            <div className="bg-white/5 rounded-3xl p-5 border border-white/5">
                                <div className="text-white/40 text-xs font-bold uppercase tracking-wider mb-2">Plugs</div>
                                <div className="font-display text-xl font-bold">{richData?.plugs.map(p => p.type).join(' / ')}</div>
                            </div>
                        </div>

                        {/* Currency Mini */}
                        <div className="bg-white/5 rounded-3xl p-6 border border-white/5 flex items-center justify-between">
                            <div>
                                <div className="text-white/40 text-xs font-bold uppercase tracking-wider mb-1">Currency</div>
                                <div className="font-display text-xl font-bold">{currencyStr}</div>
                            </div>
                            <div className="bg-white/10 p-3 rounded-full">
                                <DollarSign className="w-6 h-6 text-white/60" />
                            </div>
                        </div>

                    </TabsContent>
                </Tabs>
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
