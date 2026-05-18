import { createPortal } from 'react-dom';
import { useEffect } from 'react';
import { getCountryByCode } from "@/data/countries";
import { useTravelData } from "@/hooks/useTravelData";
import { CountryDetails } from './CountryDetails';

interface CountryDetailsModalProps {
    countryCode: string | null;
    onClose: () => void;
}

export const CountryDetailsModal = ({ countryCode, onClose }: CountryDetailsModalProps) => {
    const country = countryCode ? getCountryByCode(countryCode) : null;

    const { visitedCountries, toggleVisited, userPassport } = useTravelData();
    const isVisited = countryCode ? visitedCountries.includes(countryCode) : false;

    useEffect(() => {
        if (!country) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            window.removeEventListener('keydown', onKey);
            document.body.style.overflow = prev;
        };
    }, [country, onClose]);

    if (!country) return null;

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
                onClick={onClose}
                className="absolute inset-0 bg-black/65 backdrop-blur-md"
            />

            {/* Centered floating window */}
            <div className="relative w-full max-w-4xl max-h-[92vh] flex">
                <CountryDetails
                    country={country}
                    userPassportCode={userPassport}
                    isVisited={isVisited}
                    onClose={onClose}
                    onToggleVisited={() => countryCode && toggleVisited(countryCode)}
                    isModal={true}
                />
            </div>
        </div>,
        document.body
    );
};
