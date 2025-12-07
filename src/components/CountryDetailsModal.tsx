import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
// import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"; // Removed in favor of custom flex layout
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Check, X, MapPin, Users, Crown, Globe, CreditCard, Info, AlertCircle, Plane, Shield, Calendar } from "lucide-react";
import { getCountryByCode } from "@/data/countries";
import { getCitiesForCountry } from "@/data/cities";
import { useTravelData } from "@/hooks/useTravelData";
import { getVisaRequirementFromMatrix, getVisaRequirementColor, getVisaRequirementLabel, availablePassports } from '@/data/visaMatrix';
import { AddTripModal } from './AddTripModal';

interface CountryDetailsModalProps {
    countryCode: string | null;
    onClose: () => void;
}

export const CountryDetailsModal = ({ countryCode, onClose }: CountryDetailsModalProps) => {
    const country = countryCode ? getCountryByCode(countryCode) : null;
    const cities = countryCode ? getCitiesForCountry(countryCode) : [];

    const {
        visitedCountries, toggleVisited,
        visitedCities, toggleCityVisited,
        bucketList, toggleBucketList,
        userPassport
    } = useTravelData();

    const isVisited = countryCode ? visitedCountries.includes(countryCode) : false;
    // const isBucketListed = countryCode ? bucketList.includes(countryCode) : false; // Not used yet but available

    const [showAllVisas, setShowAllVisas] = useState(false);
    const [showAddTrip, setShowAddTrip] = useState(false);

    // Body scroll lock when modal is open
    useEffect(() => {
        if (countryCode) {
            document.body.style.overflow = 'hidden';
            document.body.classList.add('modal-open');
        } else {
            document.body.style.overflow = '';
            document.body.classList.remove('modal-open');
        }
        return () => {
            document.body.style.overflow = '';
            document.body.classList.remove('modal-open');
        };
    }, [countryCode]);

    if (!country) return null;

    // Visa Logic
    const userPassportCode = userPassport;
    const userPassportCountry = userPassportCode ? getCountryByCode(userPassportCode) : null;

    const userVisaInfo = userPassportCode
        ? getVisaRequirementFromMatrix(userPassportCode, country.code)
        : null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
                onClick={onClose}
            />
            <div className="relative w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl shadow-2xl animate-zoom-in flex flex-col border border-white/10 bg-[#0a0a0a]">

                {/* Header */}
                <div className="flex-shrink-0 bg-[#0a0a0a] z-10 border-b border-white/10 p-6 flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <span className="text-5xl md:text-6xl">{country.flagEmoji}</span>
                        <div>
                            <h2 className="font-display text-2xl md:text-3xl font-bold mb-1">{country.name}</h2>
                            <p className="text-white/60">{country.continent}</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-white/10">
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar">
                    {/* Visited Status Toggle & Add Trip */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <button
                            onClick={() => countryCode && toggleVisited(countryCode)}
                            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all ${isVisited
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                : 'bg-white/10 hover:bg-white/20'
                                }`}
                        >
                            {isVisited ? <Check className="w-5 h-5" /> : <Plane className="w-5 h-5" />}
                            {isVisited ? 'Visited' : 'Mark Visited'}
                        </button>
                        <button
                            onClick={() => setShowAddTrip(true)}
                            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all bg-luxury-gold/20 text-luxury-gold border border-luxury-gold/30 hover:bg-luxury-gold/30"
                        >
                            <Calendar className="w-5 h-5" />
                            Add Trip
                        </button>
                    </div>

                    <Tabs defaultValue="overview" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 bg-white/5 h-12 mb-6">
                            <TabsTrigger value="overview" className="text-base">Overview</TabsTrigger>
                            <TabsTrigger value="stats" className="text-base">Stats</TabsTrigger>
                            <TabsTrigger value="cities" className="text-base">
                                Cities
                                {cities.length > 0 && (
                                    <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${visitedCities.filter(c => c.startsWith(countryCode + '-')).length > 0 ? 'bg-green-500/20 text-green-400' : 'bg-white/20'}`}>
                                        {visitedCities.filter(c => c.startsWith(countryCode + '-')).length} / {cities.length}
                                    </span>
                                )}
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="space-y-6 animate-fade-in mt-0">
                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                                <div className="bg-white/5 rounded-xl p-3 md:p-4 border border-white/5">
                                    <div className="flex items-center gap-2 text-white/40 text-sm mb-1">
                                        <Users className="w-4 h-4" />
                                        Population
                                    </div>
                                    <div className="font-bold text-base md:text-lg">{(country.population ? (country.population / 1000000).toFixed(1) + 'M' : 'N/A')}</div>
                                </div>
                                <div className="bg-white/5 rounded-xl p-3 md:p-4 border border-white/5">
                                    <div className="flex items-center gap-2 text-white/40 text-sm mb-1">
                                        <Crown className="w-4 h-4" />
                                        Rank
                                    </div>
                                    <div className="font-bold text-base md:text-lg">#{country.passportRank || '-'}</div>
                                </div>
                                <div className="bg-white/5 rounded-xl p-3 md:p-4 border border-white/5">
                                    <div className="flex items-center gap-2 text-white/40 text-sm mb-1">
                                        <Globe className="w-4 h-4" />
                                        Visa Free
                                    </div>
                                    <div className="font-bold text-base md:text-lg">{country.visaFreeDestinations || 0}</div>
                                </div>
                                {country.capital && (
                                    <div className="bg-white/5 rounded-xl p-3 md:p-4 border border-white/5">
                                        <div className="flex items-center gap-2 text-white/40 text-sm mb-1">
                                            <MapPin className="w-4 h-4" />
                                            Capital
                                        </div>
                                        <div className="font-bold text-base md:text-lg truncate">{country.capital}</div>
                                    </div>
                                )}
                                <div className="bg-white/5 rounded-xl p-3 md:p-4 border border-white/5 col-span-2 md:col-span-1">
                                    <div className="flex items-center gap-2 text-white/40 text-sm mb-1">
                                        <Info className="w-4 h-4" />
                                        ISO Code
                                    </div>
                                    <div className="font-bold text-base md:text-lg">{country.code}</div>
                                </div>
                            </div>

                            {/* Visa Requirements for User */}
                            {userPassportCode && userPassportCode !== country.code && (
                                <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-500/20 p-4 md:p-5">
                                    <h3 className="font-display text-lg font-bold mb-3 flex items-center gap-2">
                                        <CreditCard className="w-5 h-5 text-blue-400" />
                                        Visa Requirement for {userPassportCountry?.flagEmoji} {userPassportCountry?.name} Citizens
                                    </h3>

                                    {userVisaInfo ? (
                                        <div className="flex items-center gap-3 mb-2">
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
                                                <span className="text-white/60">Up to {userVisaInfo.duration}</span>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-yellow-400">
                                            <AlertCircle className="w-5 h-5" />
                                            <span>Visa information not available.</span>
                                        </div>
                                    )}

                                    {userVisaInfo?.notes && (
                                        <p className="mt-2 text-sm text-white/60">{userVisaInfo.notes}</p>
                                    )}

                                    {country.officialVisaWebsite && (
                                        <a
                                            href={country.officialVisaWebsite}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="mt-4 flex items-center justify-center gap-2 w-full p-2.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors text-sm font-medium border border-blue-500/20"
                                        >
                                            Visit Official Visa Application Site
                                        </a>
                                    )}
                                </div>
                            )}

                            {/* Disclaimer */}
                            <p className="flex items-start gap-2 text-xs text-white/30 pt-4 border-t border-white/5">
                                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <span>
                                    Visa requirements may change. Always verify with official embassy websites before travel.
                                </span>
                            </p>
                        </TabsContent>



                        <TabsContent value="stats" className="mt-0 animate-fade-in space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                                    <div className="text-white/40 text-sm mb-1">GDP per Capita</div>
                                    <div className="font-bold text-xl">{country.gdp ? `$${country.gdp.toLocaleString()}` : 'N/A'}</div>
                                </div>
                                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                                    <div className="text-white/40 text-sm mb-1">HDI Score</div>
                                    <div className="font-bold text-xl">{country.hdi ? country.hdi.toFixed(3) : 'N/A'}</div>
                                </div>
                                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                                    <div className="text-white/40 text-sm mb-1">Currency</div>
                                    <div className="font-bold text-xl">{country.currency || 'N/A'}</div>
                                </div>
                                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                                    <div className="text-white/40 text-sm mb-1">Dialing Code</div>
                                    <div className="font-bold text-xl">--</div>
                                </div>
                            </div>

                            {country.safetyScore && (
                                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <Shield className={`w-4 h-4 ${country.safetyScore >= 80 ? 'text-green-400' : country.safetyScore >= 60 ? 'text-yellow-400' : 'text-red-400'}`} />
                                            <span className="text-white/60 text-sm">Safety Score (Gallup)</span>
                                        </div>
                                        <span className={`font-bold ${country.safetyScore >= 80 ? 'text-green-400' : country.safetyScore >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                                            {country.safetyScore}/100
                                        </span>
                                    </div>
                                    <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ${country.safetyScore >= 80 ? 'bg-green-500' : country.safetyScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                            style={{ width: `${country.safetyScore}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-white/30 mt-2">
                                        Based on Gallup Law and Order Index (2024 Proxy)
                                    </p>
                                </div>
                            )}

                            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                                <h4 className="font-bold mb-2">Sources</h4>
                                <p className="text-sm text-white/40">
                                    Economic and development data sourced from World Bank and UNDP reports (2024).
                                </p>
                            </div>
                        </TabsContent>

                        <TabsContent value="cities" className="mt-0 animate-fade-in">
                            {cities.length === 0 ? (
                                <div className="text-center py-12 text-white/40 bg-white/5 rounded-xl border border-white/5">
                                    <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                    <p className="text-lg font-medium">No major cities data available</p>
                                    <p className="text-sm">We are expanding our database.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-sm text-white/40 px-2 mb-2">
                                        <span>City Name</span>
                                        <span>Visited?</span>
                                    </div>

                                    <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                        {cities.map((city) => {
                                            const cityKey = `${country.code}-${city.name}`;
                                            const cityVisited = visitedCities.includes(cityKey);

                                            return (
                                                <div
                                                    key={city.name}
                                                    className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer group ${cityVisited
                                                        ? 'bg-green-500/10 border-green-500/30'
                                                        : 'bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/10'
                                                        }`}
                                                    onClick={() => toggleCityVisited(cityKey)}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className={`p-2 rounded-full ${cityVisited ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/40'}`}>
                                                            {city.isCapital ? <Crown className="w-5 h-5" /> : <MapPin className="w-5 h-5" />}
                                                        </div>
                                                        <div>
                                                            <h4 className={`font-bold text-lg ${cityVisited ? 'text-green-400' : 'text-white'}`}>{city.name}</h4>
                                                            <div className="flex items-center gap-3 text-sm text-white/40">
                                                                {city.isCapital && <span className="text-yellow-500/80 font-medium">Capital</span>}
                                                                {city.population && (
                                                                    <span>{(city.population / 1000000).toFixed(2)}M people</span>
                                                                )}
                                                                {city.bestSeason && (
                                                                    <span className="flex items-center gap-1 text-green-400">
                                                                        <Calendar className="w-3 h-3" />
                                                                        {city.bestSeason}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${cityVisited
                                                        ? 'bg-green-500 border-green-500'
                                                        : 'border-white/20 group-hover:border-white/50'
                                                        }`}>
                                                        {cityVisited && <Check className="w-5 h-5 text-black" strokeWidth={3} />}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
            {/* Add Trip Modal */}
            <AddTripModal
                isOpen={showAddTrip}
                onClose={() => setShowAddTrip(false)}
                initialCountryCode={country.code}
            />
        </div>,
        document.body
    );
};
