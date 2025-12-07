import { useState } from 'react';
import { commonVisas, getCountriesWithVisa } from '@/data/visas';
import { countries } from '@/data/countries';
import { Check, Plus } from 'lucide-react';

interface VisaManagerProps {
    selectedVisas: string[];
    onVisaToggle: (visaId: string) => void;
}

export const VisaManager = ({ selectedVisas, onVisaToggle }: VisaManagerProps) => {
    const [expanded, setExpanded] = useState(true);

    // Calculate unlocked countries from selected visas
    const getUnlockedCountries = () => {
        const unlocked = new Set<string>();
        selectedVisas.forEach(visaId => {
            const countries = getCountriesWithVisa(visaId);
            countries.forEach(c => unlocked.add(c));
        });
        return Array.from(unlocked);
    };

    const unlockedCountries = getUnlockedCountries();
    const unlockedCount = unlockedCountries.length;

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-display text-2xl font-bold">
                        My Visas
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        {unlockedCount > 0
                            ? `Unlocks ${unlockedCount} additional countries`
                            : 'Select visas you hold to unlock more countries'}
                    </p>
                </div>
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    {expanded ? 'Collapse' : 'Expand'}
                </button>
            </div>

            {/* Visa Selection Grid */}
            {expanded && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {commonVisas.map((visa) => {
                        const isSelected = selectedVisas.includes(visa.id);

                        return (
                            <button
                                key={visa.id}
                                onClick={() => onVisaToggle(visa.id)}
                                className={`
                  relative p-4 rounded-xl border transition-all duration-300
                  ${isSelected
                                        ? 'border-primary bg-primary/10 shadow-glow'
                                        : 'border-border/50 bg-gradient-card hover:border-primary/50'}
                  hover-lift
                `}
                            >
                                {/* Selection indicator */}
                                <div className="absolute top-3 right-3">
                                    {isSelected ? (
                                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                                            <Check className="w-4 h-4 text-primary-foreground" />
                                        </div>
                                    ) : (
                                        <div className="w-6 h-6 rounded-full border-2 border-muted flex items-center justify-center">
                                            <Plus className="w-4 h-4 text-muted-foreground" />
                                        </div>
                                    )}
                                </div>

                                {/* Visa Info */}
                                <div className="text-left pr-8">
                                    <div className="font-display text-lg font-bold mb-1">
                                        {visa.name}
                                    </div>
                                    <div className="text-xs text-muted-foreground mb-2">
                                        {visa.type}
                                    </div>
                                    <div className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                        {visa.description}
                                    </div>

                                    {/* Stats */}
                                    <div className="flex items-center gap-4 text-xs">
                                        <div className="flex items-center gap-1">
                                            <span className="text-muted-foreground">Unlocks:</span>
                                            <span className="font-bold text-primary">
                                                {visa.grantsAccessTo.length}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Stats Summary */}
            {selectedVisas.length > 0 && (
                <div className="bg-gradient-card rounded-xl border border-border/50 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <div className="text-muted-foreground text-sm mb-1">
                                Selected Visas
                            </div>
                            <div className="font-display text-3xl font-bold">
                                {selectedVisas.length}
                            </div>
                        </div>
                        <div>
                            <div className="text-muted-foreground text-sm mb-1">
                                Unlocked Countries
                            </div>
                            <div className="font-display text-3xl font-bold text-primary">
                                +{unlockedCount}
                            </div>
                        </div>
                        <div>
                            <div className="text-muted-foreground text-sm mb-1">
                                Total Access
                            </div>
                            <div className="font-display text-3xl font-bold">
                                {countries.length + unlockedCount}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};