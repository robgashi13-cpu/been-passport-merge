import { CountryDetails } from './CountryDetails';
import { getCountryByCode } from '@/data/countries';
import { createPortal } from 'react-dom';
import { useEffect } from 'react';
import { X } from 'lucide-react';

interface CountryDetailSheetProps {
    countryCode: string | null;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    userPassportCode?: string;
    isVisited: boolean;
    onToggleVisited: () => void;
}

/**
 * Centered, fixed liquid-glass modal that overlays everything on the screen
 * when a country is tapped on the globe. Replaces the previous bottom drawer.
 */
export const CountryDetailSheet = ({
    countryCode,
    isOpen,
    onOpenChange,
    userPassportCode,
    isVisited,
    onToggleVisited
}: CountryDetailSheetProps) => {
    const country = countryCode ? getCountryByCode(countryCode) : null;

    // ESC to close + lock body scroll while open
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onOpenChange(false); };
        window.addEventListener('keydown', onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            window.removeEventListener('keydown', onKey);
            document.body.style.overflow = prev;
        };
    }, [isOpen, onOpenChange]);

    if (!isOpen || !country) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[100000] flex items-center justify-center p-3 sm:p-6 animate-fade-in"
            role="dialog"
            aria-modal="true"
            aria-label={`${country.name} details`}
        >
            {/* Backdrop */}
            <button
                aria-label="Close"
                onClick={() => onOpenChange(false)}
                className="absolute inset-0 bg-black/65 backdrop-blur-md"
            />

            {/* Card */}
            <div
                className="relative w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden
                           rounded-[28px] border border-white/12 bg-[#06080f]/85 backdrop-blur-2xl
                           shadow-[0_30px_120px_-20px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.04)_inset]
                           animate-scale-in"
            >
                {/* Liquid glow ring */}
                <div
                    aria-hidden
                    className="pointer-events-none absolute -inset-px rounded-[28px] opacity-60"
                    style={{
                        background:
                            'radial-gradient(120% 60% at 50% 0%, rgba(124,198,255,0.18), transparent 60%)',
                    }}
                />

                {/* Close button */}
                <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    aria-label="Close details"
                    className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full
                               border border-white/12 bg-white/5 text-white/80 backdrop-blur-xl
                               transition hover:bg-white/12 hover:text-white"
                >
                    <X className="h-4 w-4" />
                </button>

                <div className="flex-1 overflow-y-auto overscroll-contain">
                    <CountryDetails
                        country={country}
                        userPassportCode={userPassportCode}
                        isVisited={isVisited}
                        onClose={() => onOpenChange(false)}
                        onToggleVisited={onToggleVisited}
                        isModal={false}
                    />
                </div>
            </div>
        </div>,
        document.body
    );
};
