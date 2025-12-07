import { createPortal } from 'react-dom';
import { X, Search, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getCountryByCode } from '@/data/countries';
import { Input } from '@/components/ui/input';

interface VisitedCountriesModalProps {
    isOpen: boolean;
    onClose: () => void;
    visitedCountries: string[];
}

export const VisitedCountriesModal = ({ isOpen, onClose, visitedCountries }: VisitedCountriesModalProps) => {
    const [search, setSearch] = useState('');

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

    if (!isOpen) return null;

    const filteredCountries = visitedCountries
        .map(code => getCountryByCode(code))
        .filter(c => c && (c.name.toLowerCase().includes(search.toLowerCase()) || c.code.includes(search.toUpperCase())))
        .sort((a, b) => (a?.name || '').localeCompare(b?.name || ''));

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
                onClick={onClose}
            />
            <div className="relative bg-[#0a0a0a] w-full max-w-md max-h-[85vh] rounded-2xl border border-white/10 shadow-2xl flex flex-col animate-zoom-in overflow-hidden">
                <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
                    <h3 className="font-display font-bold text-xl text-white">Visited Countries</h3>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full">
                        <X className="w-5 h-5 text-white/60" />
                    </button>
                </div>

                <div className="p-4 border-b border-white/5">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <Input
                            placeholder="Search your travels..."
                            className="bg-white/5 border-white/10 pl-9 text-white placeholder:text-white/30"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                    {filteredCountries.length === 0 ? (
                        <div className="text-center py-10 text-white/40">
                            <p>No countries found.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredCountries.map((country) => (
                                <div key={country?.code} className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{country?.flagEmoji}</span>
                                        <div>
                                            <div className="font-bold text-white">{country?.name}</div>
                                            <div className="text-xs text-white/40">{country?.continent}</div>
                                        </div>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                                        <Check className="w-4 h-4" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-4 bg-white/5 border-t border-white/10 text-center text-xs text-white/40">
                    {visitedCountries.length} countries visited total
                </div>
            </div>
        </div>,
        document.body
    );
};
