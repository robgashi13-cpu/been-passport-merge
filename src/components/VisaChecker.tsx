import { useState } from 'react';
import { countries, getCountryByCode } from '@/data/countries';
import {
    visaMatrix,
    getVisaRequirementFromMatrix,
    getPassportStats,
    getVisaRequirementColor,
    getVisaRequirementLabel,
    availablePassports,
    VisaRequirement
} from '@/data/visaMatrix';
import { Plane, Globe, CreditCard, AlertCircle, Check, Search } from 'lucide-react';

interface VisaCheckerProps {
    selectedPassport?: string;
    onPassportChange?: (code: string) => void;
}

export const VisaChecker = ({ selectedPassport, onPassportChange }: VisaCheckerProps) => {
    const [passport, setPassport] = useState(selectedPassport || 'DE');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<VisaRequirement | 'all'>('all');

    const stats = getPassportStats(passport);
    const passportCountry = getCountryByCode(passport);

    const handlePassportChange = (code: string) => {
        setPassport(code);
        onPassportChange?.(code);
    };

    // Filter countries based on search and filter type
    const filteredCountries = countries
        .filter(country => {
            if (country.code === passport) return false; // Exclude own country
            if (searchQuery && !country.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            if (filterType !== 'all') {
                const req = getVisaRequirementFromMatrix(passport, country.code);
                if (!req || req.requirement !== filterType) return false;
            }
            return true;
        })
        .sort((a, b) => a.name.localeCompare(b.name));

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="text-center py-4">
                <h2 className="font-display text-3xl md:text-4xl font-bold mb-2 animate-slide-up">
                    Visa <span className="text-gradient-white">Checker</span>
                </h2>
                <p className="text-muted-foreground animate-slide-up" style={{ animationDelay: "0.1s" }}>
                    Check visa requirements for your passport
                </p>
            </div>

            {/* Passport Selector */}
            <div className="bg-gradient-card rounded-2xl border border-border/50 p-6">
                <h3 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Select Your Passport
                </h3>
                <div className="relative">
                    <select
                        value={passport}
                        onChange={(e) => handlePassportChange(e.target.value)}
                        className="w-full bg-white/5 border border-white/20 rounded-xl p-4 text-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/20"
                    >
                        {countries
                            .slice()
                            .sort((a, b) => a.name.localeCompare(b.name))
                            .map(country => (
                                <option key={country.code} value={country.code} className="text-black">
                                    {country.flagEmoji} {country.name}
                                </option>
                            ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                </div>
            </div>

            {/* Stats Overview */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-gradient-card rounded-xl border border-border/50 p-4 text-center hover-lift">
                        <Globe className="w-6 h-6 text-primary mx-auto mb-2" />
                        <div className="font-display text-2xl font-bold">{stats.total}</div>
                        <div className="text-xs text-muted-foreground">Destinations</div>
                    </div>
                    <div
                        className="bg-gradient-card rounded-xl border border-border/50 p-4 text-center hover-lift cursor-pointer"
                        onClick={() => setFilterType(filterType === 'visa-free' ? 'all' : 'visa-free')}
                        style={{ borderColor: filterType === 'visa-free' ? '#22c55e' : undefined }}
                    >
                        <Check className="w-6 h-6 mx-auto mb-2" style={{ color: '#22c55e' }} />
                        <div className="font-display text-2xl font-bold" style={{ color: '#22c55e' }}>
                            {stats.visaFree}
                        </div>
                        <div className="text-xs text-muted-foreground">Visa Free</div>
                    </div>
                    <div
                        className="bg-gradient-card rounded-xl border border-border/50 p-4 text-center hover-lift cursor-pointer"
                        onClick={() => setFilterType(filterType === 'visa-on-arrival' ? 'all' : 'visa-on-arrival')}
                        style={{ borderColor: filterType === 'visa-on-arrival' ? '#166534' : undefined }}
                    >
                        <Plane className="w-6 h-6 mx-auto mb-2" style={{ color: '#166534' }} />
                        <div className="font-display text-2xl font-bold" style={{ color: '#166534' }}>
                            {stats.visaOnArrival}
                        </div>
                        <div className="text-xs text-muted-foreground">On Arrival</div>
                    </div>
                    <div
                        className="bg-gradient-card rounded-xl border border-border/50 p-4 text-center hover-lift cursor-pointer"
                        onClick={() => setFilterType(filterType === 'e-visa' ? 'all' : 'e-visa')}
                        style={{ borderColor: filterType === 'e-visa' ? '#eab308' : undefined }}
                    >
                        <CreditCard className="w-6 h-6 mx-auto mb-2" style={{ color: '#eab308' }} />
                        <div className="font-display text-2xl font-bold" style={{ color: '#eab308' }}>
                            {stats.eVisa}
                        </div>
                        <div className="text-xs text-muted-foreground">e-Visa</div>
                    </div>
                    <div
                        className="bg-gradient-card rounded-xl border border-border/50 p-4 text-center hover-lift cursor-pointer"
                        onClick={() => setFilterType(filterType === 'visa-required' ? 'all' : 'visa-required')}
                        style={{ borderColor: filterType === 'visa-required' ? '#ef4444' : undefined }}
                    >
                        <AlertCircle className="w-6 h-6 mx-auto mb-2" style={{ color: '#ef4444' }} />
                        <div className="font-display text-2xl font-bold" style={{ color: '#ef4444' }}>
                            {stats.visaRequired}
                        </div>
                        <div className="text-xs text-muted-foreground">Visa Required</div>
                    </div>
                </div>
            )}

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Search countries..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-gradient-card border border-border/50 rounded-xl py-3 pl-12 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-white/20"
                />
            </div>

            {/* Filter pills */}
            <div className="flex flex-wrap gap-2">
                {(['all', 'visa-free', 'visa-on-arrival', 'e-visa', 'visa-required'] as const).map(type => (
                    <button
                        key={type}
                        onClick={() => setFilterType(type)}
                        className={`
              px-4 py-2 rounded-full text-sm font-medium transition-all
              ${filterType === type
                                ? 'bg-white text-black'
                                : 'bg-white/10 text-white hover:bg-white/20'
                            }
            `}
                    >
                        {type === 'all' ? 'All' : getVisaRequirementLabel(type)}
                    </button>
                ))}
            </div>

            {/* Country Grid */}
            <div className="bg-gradient-card rounded-2xl border border-border/50 p-6">
                <h3 className="font-display text-lg font-bold mb-4">
                    {passportCountry?.flagEmoji} {passportCountry?.name} Passport →
                    {filterType === 'all' ? ' All Countries' : ` ${getVisaRequirementLabel(filterType)}`}
                    <span className="text-muted-foreground font-normal ml-2">({filteredCountries.length})</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto pr-2">
                    {filteredCountries.map(country => {
                        const visaInfo = getVisaRequirementFromMatrix(passport, country.code);
                        const color = visaInfo ? getVisaRequirementColor(visaInfo.requirement) : '#6b7280';

                        return (
                            <div
                                key={country.code}
                                className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                            >
                                <span className="text-2xl">{country.flagEmoji}</span>
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium truncate">{country.name}</div>
                                    {visaInfo && (
                                        <div className="flex flex-col gap-2 mt-1">
                                            <div className="flex items-center gap-2 text-xs">
                                                <span
                                                    className="px-2 py-0.5 rounded-full font-medium"
                                                    style={{ backgroundColor: `${color}20`, color }}
                                                >
                                                    {getVisaRequirementLabel(visaInfo.requirement)}
                                                </span>
                                                {visaInfo.duration && (
                                                    <span className="text-muted-foreground">{visaInfo.duration}</span>
                                                )}
                                            </div>
                                            {country.officialVisaWebsite && (
                                                <a
                                                    href={country.officialVisaWebsite}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-[10px] text-blue-400 hover:text-blue-300 underline flex items-center gap-1 w-fit"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    Official Government Site
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                                </a>
                                            )}
                                        </div>
                                    )}
                                    {!visaInfo && (
                                        <div className="text-xs text-muted-foreground">No data available</div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {filteredCountries.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                        No countries match your search
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="bg-muted/20 rounded-lg p-4 text-sm text-muted-foreground">
                <p className="mb-2"><strong>Data Sources:</strong></p>
                <ul className="list-disc list-inside space-y-1">
                    <li>Passport Index 2025 Dataset</li>
                    <li>Official Government Immigration Websites</li>
                    <li>IATA TIMATIC Database (Reference)</li>
                </ul>
                <p className="mt-2 text-xs">
                    ⚠️ Always verify with official sources before travel. Requirements may change.
                </p>
            </div>
        </div>
    );
};
