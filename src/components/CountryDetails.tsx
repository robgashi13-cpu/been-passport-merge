import { fetchCountryData, CountryExtendedData, getStaticTravelInfo } from '@/services/countryService';
import { useEffect, useState } from 'react';
import { Country, getCountryByCode } from '@/data/countries';
import { getVisaRequirementFromMatrix, getVisaRequirementColor, getVisaRequirementLabel, availablePassports } from '@/data/visaMatrix';
import { X, Globe, Users, MapPin, Plane, CreditCard, Check, AlertCircle, Info } from 'lucide-react';
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
    const [staticInfo, setStaticInfo] = useState<any>(null);

    // Initial data fetch
    useEffect(() => {
        if (country?.code) {
            fetchCountryData(country.code).then(setExtendedData);
            setStaticInfo(getStaticTravelInfo(country.code));
        }
    }, [country?.code]);

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

    const currencyStr = extendedData?.currencies
        ? Object.values(extendedData.currencies).map(c => `${c.name} (${c.symbol})`).join(', ')
        : 'Loading...';

    const driveSide = extendedData?.car?.side ? (extendedData.car.side === 'right' ? 'Right' : 'Left') : 'Loading...';

    const content = (
        <div className={`bg-gradient-card border border-border/50 w-full overflow-y-auto animate-scale-in ${isModal ? 'rounded-2xl max-w-2xl max-h-[90vh]' : 'h-full bg-transparent border-none animate-none'}`}>
            {/* Header */}
            <div className="sticky top-0 bg-gradient-card border-b border-border/50 p-4 md:p-6 flex items-start justify-between z-10">
                <div className="flex items-center gap-4">
                    <span className="text-5xl md:text-6xl">{country.flagEmoji}</span>
                    <div>
                        <h2 className="font-display text-2xl md:text-3xl font-bold">{country.name}</h2>
                        <p className="text-muted-foreground">{country.continent}</p>
                    </div>
                </div>
                {isModal && (
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            <div className="p-4 md:p-6">
                <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="w-full grid grid-cols-4 bg-white/5 mb-6 rounded-xl p-1">
                        <TabsTrigger value="overview" className="rounded-lg">Overview</TabsTrigger>
                        <TabsTrigger value="visa" className="rounded-lg">Visa</TabsTrigger>
                        <TabsTrigger value="travel" className="rounded-lg">Details</TabsTrigger>
                        <TabsTrigger value="health" className="rounded-lg">Safety</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6 mt-0">
                        {/* Visited Status */}
                        <button
                            onClick={onToggleVisited}
                            className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all ${isVisited
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                : 'bg-white/10 hover:bg-white/20'
                                }`}
                        >
                            {isVisited ? (
                                <>
                                    <Check className="w-5 h-5" />
                                    Visited ✓
                                </>
                            ) : (
                                <>
                                    <Plane className="w-5 h-5" />
                                    Mark as Visited
                                </>
                            )}
                        </button>

                        {/* Core Stats */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/5 rounded-xl p-4">
                                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                                    <Users className="w-4 h-4" />
                                    Population
                                </div>
                                <div className="font-bold">{extendedData?.population ? (extendedData.population / 1000000).toFixed(1) + 'M' : (country.population ? (country.population / 1000000).toFixed(1) + 'M' : 'N/A')}</div>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4">
                                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                                    <MapPin className="w-4 h-4" />
                                    Capital
                                </div>
                                <div className="font-bold">{extendedData?.capital?.[0] || country.capital || 'N/A'}</div>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4">
                                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                                    <Globe className="w-4 h-4" />
                                    Continent
                                </div>
                                <div className="font-bold">{country.continent}</div>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4">
                                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                                    <Info className="w-4 h-4" />
                                    Currency
                                </div>
                                <div className="font-bold text-sm truncate">{currencyStr}</div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="visa" className="space-y-6 mt-0">
                        {/* Visa Requirements for Your Passport */}
                        {userPassportCode && userPassportCode !== country.code && (
                            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-500/20 p-4">
                                <h3 className="font-display text-lg font-bold mb-3 flex items-center gap-2">
                                    <CreditCard className="w-5 h-5" />
                                    Visa for {userPassport?.flagEmoji} {userPassport?.name}
                                </h3>

                                {userVisaInfo ? (
                                    <div className="flex items-center gap-3">
                                        <span
                                            className="px-4 py-2 rounded-full font-bold text-lg"
                                            style={{
                                                backgroundColor: `${getVisaRequirementColor(userVisaInfo.requirement)}30`,
                                                color: getVisaRequirementColor(userVisaInfo.requirement)
                                            }}
                                        >
                                            {getVisaRequirementLabel(userVisaInfo.requirement)}
                                        </span>
                                        {userVisaInfo.duration && (
                                            <span className="text-muted-foreground">Up to {userVisaInfo.duration}</span>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-yellow-400">
                                        <AlertCircle className="w-5 h-5" />
                                        <span>Visa information not available.</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Visa-Free Access Info */}
                        <div className="bg-white/5 rounded-xl p-4">
                            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                                <Globe className="w-4 h-4" />
                                Global Access
                            </div>
                            <div className="font-bold">{country.visaFreeDestinations || 0} destinations visa-free</div>
                        </div>
                    </TabsContent>

                    <TabsContent value="travel" className="space-y-4 mt-0">
                        <h3 className="font-bold text-lg">Travel Essentials</h3>
                        <div className="grid grid-cols-1 gap-3">
                            <div className="bg-white/5 rounded-xl p-4 flex justify-between items-center">
                                <span>🔌 Power Sockets</span>
                                <span className="text-muted-foreground">{staticInfo?.voltage || '230V'} • {staticInfo?.plugs || 'Type C'}</span>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4 flex justify-between items-center">
                                <span>🚗 Driving Side</span>
                                <span className="text-muted-foreground capitalize">{driveSide}</span>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4 flex justify-between items-center">
                                <span>🗣️ Languages</span>
                                <span className="text-muted-foreground text-right max-w-[50%] truncate">
                                    {extendedData?.languages ? Object.values(extendedData.languages).join(', ') : 'Loading...'}
                                </span>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4 flex justify-between items-center">
                                <span>💵 Tipping</span>
                                <span className="text-muted-foreground">10-15% (Est.)</span>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="health" className="space-y-4 mt-0">
                        <h3 className="font-bold text-lg">Health & Safety</h3>
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                            <div className="font-bold text-red-400 mb-1">🚑 Emergency Numbers</div>
                            <div className="text-lg">{staticInfo?.emergency || '112 / 911'}</div>
                        </div>

                        <div className="bg-white/5 rounded-xl p-4">
                            <div className="font-bold mb-1">💧 Tap Water</div>
                            <div className="text-muted-foreground">{staticInfo?.waterRating || 'Check Local Advice'}</div>
                        </div>

                        <div className="bg-white/5 rounded-xl p-4">
                            <div className="font-bold mb-1">💉 Vaccinations</div>
                            <div className="text-muted-foreground">Standard Routine recommended.</div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );

    if (!isModal) return content;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            {content}
        </div>
    );
};
