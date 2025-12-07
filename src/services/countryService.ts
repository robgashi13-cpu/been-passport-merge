import axios from 'axios';

export interface CountryExtendedData {
    currencies?: Record<string, { name: string; symbol: string }>;
    languages?: Record<string, string>;
    car?: { side: 'right' | 'left'; signs?: string[] };
    maps?: { googleMaps: string };
    timezones?: string[];
    demonyms?: { eng: { f: string; m: string } };
    flags?: { png: string; svg: string };
    coatOfArms?: { png: string; svg: string };
    capital?: string[];
    population?: number;
}

const CACHE_KEY = 'country_data_cache';
const CACHE_DURATION = 1000 * 60 * 60 * 24; // 24 hours

interface CacheEntry {
    data: CountryExtendedData;
    timestamp: number;
}

export const fetchCountryData = async (code: string): Promise<CountryExtendedData | null> => {
    try {
        // Check local cache
        const cacheRaw = localStorage.getItem(CACHE_KEY);
        const cache: Record<string, CacheEntry> = cacheRaw ? JSON.parse(cacheRaw) : {};

        if (cache[code] && Date.now() - cache[code].timestamp < CACHE_DURATION) {
            return cache[code].data;
        }

        // Fetch from API
        const response = await axios.get(`https://restcountries.com/v3.1/alpha/${code}`);
        const data = response.data[0];

        // Transform/simplify if needed
        const extendedData: CountryExtendedData = {
            currencies: data.currencies,
            languages: data.languages,
            car: data.car,
            maps: data.maps,
            timezones: data.timezones,
            demonyms: data.demonyms,
            flags: data.flags,
            coatOfArms: data.coatOfArms,
            capital: data.capital,
            population: data.population
        };

        // Update cache
        cache[code] = {
            data: extendedData,
            timestamp: Date.now()
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));

        return extendedData;

    } catch (error) {
        console.warn("Failed to fetch rich country data", error);
        return null; // Graceful fallback
    }
};

// Placeholder/Static data for things not in basic APIs (like Voltage, Water)
// In a real app, this would come from a proprietary backend/database.
export const getStaticTravelInfo = (code: string) => {
    // This is a simplified lookup. To do "all infos Skratch offers" perfectly, 
    // we'd need a massive database. We'll populate a default for now.
    return {
        voltage: "230V",
        plugs: "Type C/F",
        waterRating: "Check Local Advice", // Safe/Unsafe is complex per region
        vaccinations: "Routine",
        emergency: "112 / 911"
    };
};
