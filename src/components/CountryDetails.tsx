import { useState } from 'react';
import { Country, getCountryByCode } from '@/data/countries';
import { getVisaRequirementFromMatrix, getVisaRequirementColor, getVisaRequirementLabel, availablePassports } from '@/data/visaMatrix';
import { X, Globe, Users, MapPin, Plane, CreditCard, Check, AlertCircle, Info } from 'lucide-react';

interface CountryDetailsProps {
    country: Country;
    userPassportCode?: string;
    isVisited: boolean;
    onClose: () => void;
    onToggleVisited: () => void;
}

export const CountryDetails = ({
    country,
    userPassportCode,
    isVisited,
    onClose,
    onToggleVisited
}: CountryDetailsProps) => {
    const [showAllVisas, setShowAllVisas] = useState(false);

    // Get visa requirement for user's passport
    const userVisaInfo = userPassportCode
        ? getVisaRequirementFromMatrix(userPassportCode, country.code)
        : null;

    const userPassport = userPassportCode ? getCountryByCode(userPassportCode) : null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-gradient-card border border-border/50 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-card border-b border-border/50 p-4 md:p-6 flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <span className="text-5xl md:text-6xl">{country.flagEmoji}</span>
                        <div>
                            <h2 className="font-display text-2xl md:text-3xl font-bold">{country.name}</h2>
                            <p className="text-muted-foreground">{country.continent}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 md:p-6 space-y-6">
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

                    {/* Country Info */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {country.capital && (
                            <div className="bg-white/5 rounded-xl p-4">
                                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                                    <MapPin className="w-4 h-4" />
                                    Capital
                                </div>
                                <div className="font-bold">{country.capital}</div>
                            </div>
                        )}
                        {country.population && (
                            <div className="bg-white/5 rounded-xl p-4">
                                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                                    <Users className="w-4 h-4" />
                                    Population
                                </div>
                                <div className="font-bold">{(country.population / 1000000).toFixed(1)}M</div>
                            </div>
                        )}
                        {country.passportRank && (
                            <div className="bg-white/5 rounded-xl p-4">
                                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                                    <CreditCard className="w-4 h-4" />
                                    Passport Rank
                                </div>
                                <div className="font-bold">#{country.passportRank}</div>
                            </div>
                        )}
                        {country.visaFreeDestinations && (
                            <div className="bg-white/5 rounded-xl p-4">
                                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                                    <Globe className="w-4 h-4" />
                                    Visa-Free Access
                                </div>
                                <div className="font-bold">{country.visaFreeDestinations} countries</div>
                            </div>
                        )}
                        <div className="bg-white/5 rounded-xl p-4">
                            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                                <Globe className="w-4 h-4" />
                                Region
                            </div>
                            <div className="font-bold">{country.continent}</div>
                        </div>
                        <div className="bg-white/5 rounded-xl p-4">
                            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                                <Info className="w-4 h-4" />
                                ISO Code
                            </div>
                            <div className="font-bold">{country.code}</div>
                        </div>
                    </div>

                    {/* Visa Requirements for Your Passport */}
                    {userPassportCode && userPassportCode !== country.code && (
                        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-500/20 p-4">
                            <h3 className="font-display text-lg font-bold mb-3 flex items-center gap-2">
                                <CreditCard className="w-5 h-5" />
                                Visa Requirement for {userPassport?.flagEmoji} {userPassport?.name}
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
                                    <span>Visa information not available. Please check official embassy.</span>
                                </div>
                            )}

                            {userVisaInfo?.notes && (
                                <p className="mt-2 text-sm text-muted-foreground">{userVisaInfo.notes}</p>
                            )}
                        </div>
                    )}

                    {/* Visa from Other Passports */}
                    <div className="bg-white/5 rounded-xl p-4">
                        <button
                            onClick={() => setShowAllVisas(!showAllVisas)}
                            className="w-full flex items-center justify-between font-display text-lg font-bold"
                        >
                            <span>Visa Requirements by Passport</span>
                            <span className="text-muted-foreground text-sm">
                                {showAllVisas ? 'Hide' : 'Show all'}
                            </span>
                        </button>

                        {showAllVisas && (
                            <div className="mt-4 space-y-2">
                                {availablePassports.filter(p => p !== country.code).map(passportCode => {
                                    const passport = getCountryByCode(passportCode);
                                    const visaInfo = getVisaRequirementFromMatrix(passportCode, country.code);

                                    return (
                                        <div key={passportCode} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xl">{passport?.flagEmoji}</span>
                                                <span className="font-medium">{passport?.name}</span>
                                            </div>
                                            {visaInfo ? (
                                                <span
                                                    className="px-3 py-1 rounded-full text-xs font-medium"
                                                    style={{
                                                        backgroundColor: `${getVisaRequirementColor(visaInfo.requirement)}20`,
                                                        color: getVisaRequirementColor(visaInfo.requirement)
                                                    }}
                                                >
                                                    {getVisaRequirementLabel(visaInfo.requirement)}
                                                    {visaInfo.duration && ` • ${visaInfo.duration}`}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">No data</span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Embassy Info Note */}
                    <p className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>
                            Visa requirements may change. Always verify with official embassy websites before travel.
                            Data sourced from Passport Index 2025 Dataset.
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
};
