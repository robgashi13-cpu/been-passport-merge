import { createPortal } from 'react-dom';
import { getCountryByCode } from "@/data/countries";
import { useTravelData } from "@/hooks/useTravelData";
import { CountryDetails } from './CountryDetails';

interface CountryDetailsModalProps {
    countryCode: string | null;
    onClose: () => void;
}

export const CountryDetailsModal = ({ countryCode, onClose }: CountryDetailsModalProps) => {
    const country = countryCode ? getCountryByCode(countryCode) : null;

    const {
        visitedCountries,
        toggleVisited,
        userPassport
    } = useTravelData();

    const isVisited = countryCode ? visitedCountries.includes(countryCode) : false;

    if (!country) return null;

    return createPortal(
        <CountryDetails
            country={country}
            userPassportCode={userPassport}
            isVisited={isVisited}
            onClose={onClose}
            onToggleVisited={() => countryCode && toggleVisited(countryCode)}
            isModal={true}
        />,
        document.body
    );
};
