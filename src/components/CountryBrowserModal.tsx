import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, Check, Plus, MapPin, Users } from 'lucide-react';
import { countries } from '@/data/countries';
import { RICH_COUNTRIES_DB } from '@/data/rich-country-data';
import { Input } from '@/components/ui/input';

interface CountryBrowserModalProps {
    isOpen: boolean;
    onClose: () => void;
    visitedCountries: string[];
    onToggleVisited: (code: string) => void;
}

export const CountryBrowserModal = ({
    isOpen,
    onClose,
    visitedCountries,
    onToggleVisited
}: CountryBrowserModalProps) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedContinent, setSelectedContinent] = useState<string | null>(null);

    // Body scroll lock when modal is open
    useEffect(() => {
        if (isOpen) {
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
    }, [isOpen]);

    const continents = useMemo(() => {
        const unique = [...new Set(countries.map(c => c.continent))];
        return unique.sort();
    }, []);

    const filteredCountries = useMemo(() => {
        return countries
            .filter(c => {
                const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
                const matchesContinent = !selectedContinent || c.continent === selectedContinent;
                return matchesSearch && matchesContinent;
            })
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [searchQuery, selectedContinent]);

    const visitedCount = visitedCountries.length;

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
                onClick={onClose}
            />
            <div className="relative bg-[#0a0a0a] w-full max-w-2xl max-h-[85vh] rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col animate-zoom-in">
                {/* Header */}
                <div className="bg-white/5 p-4 border-b border-white/10 flex-shrink-0">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <h3 className="font-display font-bold text-xl text-white">Browse Countries</h3>
                            <p className="text-sm text-white/50">{visitedCount} visited · {countries.length - visitedCount} remaining</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full">
                            <X className="w-5 h-5 text-white/60" />
                        </button>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search countries..."
                            className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus-visible:ring-white/20"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Continent Filter */}
                    <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                        <button
                            onClick={() => setSelectedContinent(null)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${!selectedContinent
                                ? 'bg-white text-black'
                                : 'bg-white/10 text-white/60 hover:bg-white/20'
                                }`}
                        >
                            All
                        </button>
                        {continents.map(continent => (
                            <button
                                key={continent}
                                onClick={() => setSelectedContinent(continent)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${selectedContinent === continent
                                    ? 'bg-white text-black'
                                    : 'bg-white/10 text-white/60 hover:bg-white/20'
                                    }`}
                            >
                                {continent}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Country List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {filteredCountries.map(country => {
                            const isVisited = visitedCountries.includes(country.code);
                            const visitors = RICH_COUNTRIES_DB[country.code]?.visitors2025;

                            return (
                                <button
                                    key={country.code}
                                    onClick={() => onToggleVisited(country.code)}
                                    className={`flex items-center gap-3 p-3 rounded-xl transition-all text-left ${isVisited
                                        ? 'bg-green-500/20 border border-green-500/30'
                                        : 'bg-white/5 border border-white/10 hover:bg-white/10'
                                        }`}
                                >
                                    <span className="text-2xl">{country.flagEmoji}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-white truncate">{country.name}</div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <div className="text-xs text-white/60">{country.continent}</div>
                                            {visitors && (
                                                <div className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                                                    <Users className="w-2.5 h-2.5 text-white/60" />
                                                    <span className="text-[10px] font-bold text-white/60 font-numbers">{visitors}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {isVisited ? (
                                        <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                                    ) : (
                                        <Plus className="w-5 h-5 text-white/50 flex-shrink-0" />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {filteredCountries.length === 0 && (
                        <div className="text-center py-12 text-white/60">
                            <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p>No countries found</p>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};
