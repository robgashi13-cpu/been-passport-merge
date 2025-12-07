export interface CountryExtendedData {
    currencies?: Record<string, { name: string; symbol: string }>;
    languages?: Record<string, string>;
    car?: { side: 'right' | 'left'; signs?: string[] };
    maps?: { googleMaps: string };
    timezones?: string[];
    demonyms?: { eng: { f: string; m: string } };
    flags?: { png: string; svg: string; alt?: string };
    coatOfArms?: { png: string; svg: string };
    capital?: string[];
    capitalInfo?: { latlng?: [number, number] };
    idd?: { root: string; suffixes: string[] };
    population?: number;
    region?: string;
    subregion?: string;
    continents?: string[];
}

export interface RichCountryInfo {
    description: string;
    knownFor: string[];
    majorReligion: string;
    dialCode: string;
    mobileOperators: string[];
    plugs: { type: string; url?: string }[];
    voltage: string;
    publicHolidays: { date: string; name: string }[];
    mainAirports: { code: string; name: string }[];
    climate: {
        text: string;
        bestTime: string;
        seasonEmojis: string;
    };
    emergency: {
        police: string;
        ambulance: string;
        fire: string;
    };
    alcohol: {
        drinkingAge: number;
        purchaseAge: number;
    };
    waterRating: string;
    vaccinations: string;
    hdi?: number;
    gdp?: string;
    visitors2025?: string;
}
