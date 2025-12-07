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

    const [snap, setSnap] = useState<number | string | null>(0.25);

    return (
        <Drawer.Root
            open={isOpen}
            onOpenChange={onOpenChange}
            snapPoints={[0.25, 0.45, 0.9]}
            activeSnapPoint={snap}
            setActiveSnapPoint={setSnap}
            shouldScaleBackground={false}
            modal={false}
        >
            <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 bg-transparent pointer-events-none z-[10001]" />
                <Drawer.Content className="bg-[#1a1a1a] flex flex-col rounded-t-[20px] h-[96%] fixed left-0 right-0 z-[10002] border-t border-white/10 outline-none shadow-2xl" style={{ bottom: 'calc(80px + env(safe-area-inset-bottom))' }}>
                    <div className="p-0 bg-[#1a1a1a] rounded-t-[20px] flex-1 h-full flex flex-col">
                        <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-zinc-600 my-4" />
                        <div className="max-w-md mx-auto h-full w-full overflow-y-auto custom-scrollbar px-4 pb-20">
                            <Drawer.Title className="font-medium mb-4 text-white sr-only">
                                {country.name} Details
                            </Drawer.Title>
                            {/* Content */}
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
