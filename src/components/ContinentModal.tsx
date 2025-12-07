import { createPortal } from 'react-dom';
import { X, Trophy, Globe, Map } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useEffect } from 'react';

interface ContinentModalProps {
    isOpen: boolean;
    onClose: () => void;
    continentStats: {
        name: string;
        visited: number;
        total: number;
    }[];
}

const continentEmojis: Record<string, string> = {
    "Europe": "🇪🇺",
    "Asia": "🌏",
    "North America": "🌎",
    "South America": "🌎",
    "Africa": "🌍",
    "Oceania": "🏝️",
};

export const ContinentModal = ({ isOpen, onClose, continentStats }: ContinentModalProps) => {
    // Body scroll lock
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

    // Calculate percentage for sorting
    const sortedStats = [...continentStats].sort((a, b) => {
        const pA = a.total > 0 ? (a.visited / a.total) : 0;
        const pB = b.total > 0 ? (b.visited / b.total) : 0;
        return pB - pA;
    });

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
                onClick={onClose}
            />

            <div className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-zoom-in flex flex-col max-h-[85vh]">
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex items-center justify-between flex-shrink-0 bg-[#0a0a0a]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                            <Globe className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-display font-bold">World Continents</h2>
                            <p className="text-white/60 text-sm">Explore your global footprint</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-white/10">
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {sortedStats.map((continent) => {
                            const percentage = continent.total > 0
                                ? Math.round((continent.visited / continent.total) * 100)
                                : 0;

                            const isUnlocked = continent.visited > 0;

                            return (
                                <div
                                    key={continent.name}
                                    className={`relative overflow-hidden rounded-xl border p-4 transition-all ${isUnlocked
                                            ? 'bg-gradient-to-br from-white/10 to-white/5 border-white/10'
                                            : 'bg-white/5 border-white/5 opacity-70'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{continentEmojis[continent.name]}</span>
                                            <div>
                                                <h3 className="font-bold text-lg">{continent.name}</h3>
                                                <p className="text-xs text-white/40">
                                                    {isUnlocked ? 'Explorer' : 'Not Visited'}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="font-display font-bold text-2xl text-white/90">
                                            {percentage}%
                                        </span>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="relative h-2 bg-black/40 rounded-full overflow-hidden mb-2">
                                        <div
                                            className="absolute top-0 left-0 h-full bg-blue-500 rounded-full transition-all duration-1000"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>

                                    <div className="flex justify-between text-xs text-white/40 font-medium">
                                        <span>{continent.visited} visited</span>
                                        <span>{continent.total} total</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};
