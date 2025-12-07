export interface AdditionalVisa {
    id: string;
    label: string;
    flag: string;
    description: string;
}

// 29 Schengen Countries (2025) - Fully implementing Schengen acqius
export const SCHENGEN_COUNTRIES = [
    'AT', 'BE', 'BG', 'HR', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IS',
    'IT', 'LV', 'LI', 'LT', 'LU', 'MT', 'NL', 'NO', 'PL', 'PT', 'RO', 'SK', 'SI',
    'ES', 'SE', 'CH'
];

export const AVAILABLE_ADDITIONAL_VISAS: AdditionalVisa[] = [
    {
        id: 'US',
        label: 'United States',
        flag: '🇺🇸',
        description: 'Valid multiple-entry US Visa'
    },
    {
        id: 'FR',
        label: 'Schengen (France)',
        flag: '🇫🇷',
        description: 'Valid multiple-entry Schengen Visa'
    },
    {
        id: 'GB',
        label: 'United Kingdom',
        flag: '🇬🇧',
        description: 'Valid UK Visa'
    },
    {
        id: 'CA',
        label: 'Canada',
        flag: '🇨🇦',
        description: 'Valid Canada Visa'
    }
];

// ISO Codes for substitutions
// Based on reliable 2025 travel data
export const VISA_SUBSTITUTIONS: Record<string, string[]> = {
    'US_VISA': [
        // North & Central America
        'MX', // Mexico
        'PA', // Panama
        'CR', // Costa Rica
        'GT', // Guatemala
        'HN', // Honduras
        'SV', // El Salvador
        'NI', // Nicaragua
        'BZ', // Belize
        'DO', // Dominican Republic

        // South America
        'CO', // Colombia
        // Note: Peru removed - requires separate visa

        // Europe
        'AL', // Albania
        'BA', // Bosnia & Herzegovina
        'MK', // North Macedonia
        'ME', // Montenegro
        'RS'  // Serbia
    ],

    'SCHENGEN_VISA': [
        // Non-Schengen Europe
        'AL', // Albania
        'BA', // Bosnia and Herzegovina
        'MK', // North Macedonia
        'ME', // Montenegro
        'RS', // Serbia
        'CY', // Cyprus
        'XK', // Kosovo
        'BY', // Belarus
        'GE', // Georgia
        'MD', // Moldova
        'TR', // Turkey (e-Visa specific conditions)

        // Americas
        'MX', // Mexico
        'PA', // Panama
        'DO', // Dominican Republic
        'CO', // Colombia
        'PE', // Peru

        // Middle East
        'SA', // Saudi Arabia
        'QA'  // Qatar
    ],

    'UK_VISA': [
        'IE', // Ireland (BIVS specific)
        'AL', // Albania
        'BS', // Bahamas
        'BY', // Belarus
        'CU', // Cuba
        'GE', // Georgia
        'GI', // Gibraltar
        'MX', // Mexico
        'ME', // Montenegro
        'MK', // North Macedonia
        'OM', // Oman
        'PE', // Peru
        'RS', // Serbia
        'SG', // Singapore
        'TR', // Turkey (e-Visa)
        'BM', // Bermuda
        'TC', // Turks and Caicos
        'KY', // Cayman Islands
        'VG', // British Virgin Islands
        'DO', // Dominican Republic
        'PA'  // Panama
    ],

    'CANADA_VISA': [
        // North & Central America
        'MX', // Mexico
        'PA', // Panama
        'CR', // Costa Rica
        'GT', // Guatemala
        'HN', // Honduras
        'SV', // El Salvador
        'NI', // Nicaragua
        'BZ', // Belize
        'DO', // Dominican Republic

        // South America
        'CO', // Colombia
        'PE', // Peru

        // Europe
        'AL', // Albania
        'BA', // Bosnia & Herzegovina
        'MK', // North Macedonia
        'ME', // Montenegro
        'RS'  // Serbia
    ]
};

// Map a specific held visa (Country Code) to a Power Group ID
export const getVisaPowerGroups = (heldVisas: string[]): string[] => {
    const groups = new Set<string>();

    heldVisas.forEach(code => {
        // Check key power visas
        if (code === 'US') groups.add('US_VISA');
        if (code === 'GB') groups.add('UK_VISA');
        if (code === 'CA') groups.add('CANADA_VISA');
        if (code === 'AU') groups.add('AUSTRALIA_VISA');

        // Check Schengen
        if (SCHENGEN_COUNTRIES.includes(code)) {
            groups.add('SCHENGEN_VISA');
        }
    });

    return Array.from(groups);
};
