// Comprehensive visa requirement data based on real passport power rankings
// Source: Henley Passport Index and official embassy information

export interface PassportData {
    code: string;
    name: string;
    flagEmoji: string;
    rank: number;
    visaFreeCount: number;
    // Countries visa-free or visa on arrival for this passport holder
    visaFree: string[];
    visaOnArrival: string[];
    eVisa: string[];
    visaRequired: string[];
}

export interface VisaInfo {
    id: string;
    name: string;
    type: string;
    description: string;
    // Countries this visa grants access to
    grantsAccessTo: string[];
}

// Major visas that unlock additional countries
export const commonVisas: VisaInfo[] = [
    {
        id: "schengen",
        name: "Schengen Visa",
        type: "Short-stay",
        description: "Allows travel to 27 Schengen Area countries for up to 90 days within 180 days",
        grantsAccessTo: [
            "AT", "BE", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IS", "IT",
            "LV", "LI", "LT", "LU", "MT", "NL", "NO", "PL", "PT", "SK", "SI", "ES",
            "SE", "CH",
            // Countries that accept Schengen visa holders
            "AL", "GE", "MK", "ME", "RS", "TR", "CO", "MX"
        ]
    },
    {
        id: "us-visa",
        name: "US Visa (B1/B2)",
        type: "Tourist/Business",
        description: "US visitor visa allows entry to United States and unlocks additional countries",
        grantsAccessTo: [
            "US",
            // Countries that accept US visa holders without additional visa
            "MX", "PA", "CO", "PE", "CR", "GT", "SV", "HN", "NI", "DO", "GE", "PH",
            "AL", "BA", "MK", "ME", "RS", "TR", "JO", "KW", "OM", "QA", "BH", "AE"
        ]
    },
    {
        id: "uk-visa",
        name: "UK Visa",
        type: "Standard Visitor",
        description: "UK Standard Visitor visa allows entry to United Kingdom and unlocks additional countries",
        grantsAccessTo: [
            "GB",
            // Countries that accept UK visa holders
            "IE", "MX", "PA", "CO", "PE", "CR", "GT", "DO", "GE", "JO", "AL", "BA",
            "MK", "ME", "RS", "TR", "BH", "OM", "AE"
        ]
    },
    {
        id: "canada-visa",
        name: "Canada Visa",
        type: "Visitor Visa",
        description: "Canadian visitor visa allows entry to Canada and unlocks additional countries",
        grantsAccessTo: [
            "CA",
            // Countries that accept Canadian visa holders
            "MX", "PA", "CO", "CR", "GE", "AL", "ME", "RS", "TR"
        ]
    },
    {
        id: "australia-visa",
        name: "Australia Visa",
        type: "Visitor Visa",
        description: "Australian visitor visa allows entry to Australia and New Zealand",
        grantsAccessTo: ["AU", "NZ"]
    },
    {
        id: "japan-visa",
        name: "Japan Visa",
        type: "Short-term Stay",
        description: "Japanese visa for tourism/business visits",
        grantsAccessTo: ["JP", "KR"]
    }
];

// Simplified passport data for most common passports
// Based on Henley Passport Index 2024
export const passportData: PassportData[] = [
    {
        code: "DE",
        name: "Germany",
        flagEmoji: "🇩🇪",
        rank: 2,
        visaFreeCount: 193,
        visaFree: ["AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE", "US", "CA", "AU", "NZ", "JP", "KR", "SG", "MY", "TH", "ID", "PH", "GB", "NO", "CH", "IS", "BR", "AR", "CL", "MX", "CO", "PE", "ZA", "AE", "QA", "TR"],
        visaOnArrival: ["EG", "JO", "KE", "TZ", "ET", "MD", "GE", "AM"],
        eVisa: ["IN", "VN", "KH", "MM", "LK", "OM", "BH", "KW", "SA", "AU", "NZ"],
        visaRequired: ["CN", "RU", "IR", "IQ", "SY", "AF", "PK", "BD", "NG", "GH"]
    },
    {
        code: "US",
        name: "United States",
        flagEmoji: "🇺🇸",
        rank: 7,
        visaFreeCount: 188,
        visaFree: ["CA", "MX", "GB", "DE", "FR", "IT", "ES", "PT", "NL", "BE", "AT", "CH", "SE", "NO", "DK", "FI", "IE", "JP", "KR", "SG", "AU", "NZ", "IL", "CL", "BR", "AR", "CO", "PE", "CR", "PA", "ZA", "AE", "QA", "BH", "JO", "GR", "HR", "CZ", "PL", "HU", "SK", "SI", "EE", "LV", "LT", "MT", "CY", "BG", "RO"],
        visaOnArrival: ["EG", "JO", "KE", "TZ", "ET", "BT", "MV", "NP", "ID", "TH", "MY", "PH", "KH", "LA"],
        eVisa: ["IN", "VN", "MM", "LK", "OM", "KW", "SA", "TR", "GE", "AM", "AZ"],
        visaRequired: ["CN", "RU", "BR", "IR", "IQ", "SY", "AF", "PK", "BD", "NG"]
    },
    {
        code: "GB",
        name: "United Kingdom",
        flagEmoji: "🇬🇧",
        rank: 4,
        visaFreeCount: 191,
        visaFree: ["DE", "FR", "IT", "ES", "PT", "NL", "BE", "AT", "CH", "SE", "NO", "DK", "FI", "IE", "US", "CA", "AU", "NZ", "JP", "KR", "SG", "MY", "TH", "IL", "CL", "BR", "AR", "CO", "PE", "MX", "ZA", "AE", "QA", "BH", "JO", "GR", "HR", "CZ", "PL", "HU", "SK", "SI", "EE", "LV", "LT", "MT", "CY", "BG", "RO", "TR"],
        visaOnArrival: ["EG", "JO", "KE", "TZ", "ET", "BT", "MV", "NP", "ID", "PH", "KH", "LA"],
        eVisa: ["IN", "VN", "MM", "LK", "OM", "KW", "SA", "GE", "AM", "AZ"],
        visaRequired: ["CN", "RU", "IR", "IQ", "SY", "AF", "PK", "BD", "NG"]
    },
    {
        code: "JP",
        name: "Japan",
        flagEmoji: "🇯🇵",
        rank: 1,
        visaFreeCount: 194,
        visaFree: ["US", "CA", "GB", "DE", "FR", "IT", "ES", "PT", "NL", "BE", "AT", "CH", "SE", "NO", "DK", "FI", "IE", "AU", "NZ", "KR", "SG", "MY", "TH", "ID", "PH", "IL", "CL", "BR", "AR", "CO", "PE", "MX", "ZA", "AE", "QA", "BH", "JO", "TR", "GR", "HR", "CZ", "PL", "HU", "SK", "SI", "EE", "LV", "LT", "MT", "CY", "BG", "RO"],
        visaOnArrival: ["EG", "JO", "KE", "TZ", "ET", "BT", "MV", "NP", "KH", "LA"],
        eVisa: ["IN", "VN", "MM", "LK", "OM", "KW", "SA", "GE", "AM", "AZ"],
        visaRequired: ["CN", "RU", "IR", "IQ", "SY", "AF", "PK", "BD", "NG"]
    },
    {
        code: "XK",
        name: "Kosovo",
        flagEmoji: "🇽🇰",
        rank: 93,
        visaFreeCount: 48,
        visaFree: ["AL", "ME", "MK", "RS", "TR", "BA"],
        visaOnArrival: ["JO", "MV"],
        eVisa: ["GE", "AZ", "AM"],
        visaRequired: ["DE", "FR", "IT", "ES", "GB", "US", "CA", "AU", "NZ", "JP", "KR", "SG", "MY", "TH", "ID", "PH", "CN", "RU", "IN", "BR", "AR", "MX", "ZA", "AE", "QA", "SA"]
    },
    {
        code: "AL",
        name: "Albania",
        flagEmoji: "🇦🇱",
        rank: 49,
        visaFreeCount: 119,
        visaFree: ["ME", "MK", "RS", "BA", "XK", "TR", "GE", "AZ", "MD", "UA"],
        visaOnArrival: ["EG", "JO", "MV", "ID"],
        eVisa: ["IN", "VN", "AU"],
        visaRequired: ["DE", "FR", "IT", "ES", "GB", "US", "CA", "JP", "KR", "SG", "CN", "RU", "BR", "AR", "MX", "ZA", "AE", "QA", "SA"]
    },
    {
        code: "IN",
        name: "India",
        flagEmoji: "🇮🇳",
        rank: 82,
        visaFreeCount: 59,
        visaFree: ["NP", "BT", "MV", "MU", "FJ", "JM", "TT"],
        visaOnArrival: ["TH", "ID", "LA", "KH", "JO", "EG", "KE", "TZ", "ET", "MW", "ZM", "ZW", "MG"],
        eVisa: ["VN", "MM", "LK", "GE", "AZ", "AM", "TR", "AE", "OM", "BH"],
        visaRequired: ["DE", "FR", "IT", "ES", "GB", "US", "CA", "AU", "NZ", "JP", "KR", "SG", "MY", "CN", "RU", "BR", "AR", "MX", "ZA", "QA", "SA"]
    },
    {
        code: "CN",
        name: "China",
        flagEmoji: "🇨🇳",
        rank: 64,
        visaFreeCount: 85,
        visaFree: ["RS", "BA", "AL", "ME", "MK", "BE", "BY", "AE", "QA", "MU", "FJ", "TH", "SG", "MY", "ID"],
        visaOnArrival: ["EG", "JO", "KE", "TZ", "ET", "KH", "LA", "NP", "MV"],
        eVisa: ["IN", "VN", "MM", "LK", "GE", "AZ", "AM", "TR"],
        visaRequired: ["DE", "FR", "IT", "ES", "GB", "US", "CA", "AU", "NZ", "JP", "KR", "BR", "AR", "MX", "ZA", "SA"]
    },
    {
        code: "RU",
        name: "Russia",
        flagEmoji: "🇷🇺",
        rank: 50,
        visaFreeCount: 118,
        visaFree: ["RS", "BA", "ME", "MK", "AL", "TR", "GE", "AZ", "AM", "BY", "KZ", "KG", "TJ", "UZ", "MD", "CU", "VE", "AR", "BR", "TH", "ID", "MY", "PH", "VN"],
        visaOnArrival: ["EG", "JO", "KE", "TZ", "ET", "KH", "LA", "NP", "MV"],
        eVisa: ["IN", "LK", "OM", "BH", "SA"],
        visaRequired: ["DE", "FR", "IT", "ES", "GB", "US", "CA", "AU", "NZ", "JP", "KR", "SG", "CN", "MX", "ZA", "AE", "QA"]
    }
];

// Get passport data by country code
export const getPassportByCode = (code: string): PassportData | undefined => {
    return passportData.find(p => p.code === code);
};

// Get visa access type for a destination country
export const getVisaRequirement = (passportCode: string, destinationCode: string): 'visa-free' | 'visa-on-arrival' | 'e-visa' | 'visa-required' => {
    const passport = getPassportByCode(passportCode);
    if (!passport) return 'visa-required';

    if (passport.visaFree.includes(destinationCode)) return 'visa-free';
    if (passport.visaOnArrival.includes(destinationCode)) return 'visa-on-arrival';
    if (passport.eVisa.includes(destinationCode)) return 'e-visa';
    return 'visa-required';
};

// Get all countries accessible with a specific visa
export const getCountriesWithVisa = (visaId: string): string[] => {
    const visa = commonVisas.find(v => v.id === visaId);
    return visa ? visa.grantsAccessTo : [];
};

// Get combined countries accessible with passport + selected visas
export const getTotalAccessibleCountries = (passportCode: string, selectedVisaIds: string[]): string[] => {
    const passport = getPassportByCode(passportCode);
    if (!passport) return [];

    const accessible = new Set([
        ...passport.visaFree,
        ...passport.visaOnArrival,
        ...passport.eVisa
    ]);

    for (const visaId of selectedVisaIds) {
        const visaCountries = getCountriesWithVisa(visaId);
        visaCountries.forEach(c => accessible.add(c));
    }

    return Array.from(accessible);
};
