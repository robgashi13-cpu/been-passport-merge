import { Drawer } from 'vaul';
import { CountryDetails } from './CountryDetails'; // Reuse existing component if possible
import { Country, getCountryByCode } from '@/data/countries';
import { useState, useEffect } from 'react';

interface CountryDetailSheetProps {
    countryCode: string | null;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    userPassportCode?: string;
    isVisited: boolean;
    onToggleVisited: () => void;
}

export const CountryDetailSheet = ({
    countryCode,
    isOpen,
    onOpenChange,
    userPassportCode,
    isVisited,
    onToggleVisited
}: CountryDetailSheetProps) => {
    const country = countryCode ? getCountryByCode(countryCode) : null;

    if (!country) return null;

    return (
        <Drawer.Root open={isOpen} onOpenChange={onOpenChange} shouldScaleBackground>
            <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 bg-black/40" />
                <Drawer.Content className="bg-[#1a1a1a] flex flex-col rounded-t-[10px] h-[96%] mt-24 fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 outline-none">
                    <div className="p-4 bg-[#1a1a1a] rounded-t-[10px] flex-1">
                        <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-zinc-600 mb-8" />
                        <div className="max-w-md mx-auto h-full overflow-y-auto custom-scrollbar">
                            <Drawer.Title className="font-medium mb-4 text-white sr-only">
                                {country.name} Details
                            </Drawer.Title>
                            {/* We pass a stripped down onClose for safety, essentially closing the drawer */}
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
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    );
};
