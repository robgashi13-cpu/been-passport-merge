import axios from 'axios';
import { CountryExtendedData, RichCountryInfo } from '@/types/country';
import { countries } from '@/data/countries';
import { RICH_COUNTRIES_DB } from '@/data/rich-country-data';
export type { CountryExtendedData, RichCountryInfo }; // Re-export for consumers

// Backwards compatibility wrapper
export const getStaticTravelInfo = (code: string) => {
    const data = getRichCountryData(code);
    return {
        voltage: data.voltage,
        plugs: data.plugs.map(p => `Type ${p.type}`).join('/'),
        waterRating: data.waterRating,
        vaccinations: data.vaccinations,
        emergency: `${data.emergency.police} / ${data.emergency.ambulance}`
    };
};

const CACHE_KEY = 'country_data_cache';
const CACHE_DURATION = 1000 * 60 * 60 * 24; // 24 hours

interface CacheEntry {
    data: CountryExtendedData;
    timestamp: number;
}

// ------------------------------------------------------------------
// 1. Basic API Data (RestCountries)
// ------------------------------------------------------------------
export const fetchCountryData = async (code: string): Promise<CountryExtendedData | null> => {
    try {
        const cacheRaw = localStorage.getItem(CACHE_KEY);
        const cache: Record<string, CacheEntry> = cacheRaw ? JSON.parse(cacheRaw) : {};

        if (cache[code] && Date.now() - cache[code].timestamp < CACHE_DURATION) {
            return cache[code].data;
        }

        const response = await axios.get(`https://restcountries.com/v3.1/alpha/${code}`);
        const data = response.data[0];

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
            capitalInfo: data.capitalInfo,
            idd: data.idd,
            population: data.population,
            region: data.region,
            subregion: data.subregion,
            continents: data.continents
        };

        cache[code] = {
            data: extendedData,
            timestamp: Date.now()
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));

        return extendedData;

    } catch (error) {
        console.warn("Failed to fetch rich country data", error);
        return null;
    }
};

// ------------------------------------------------------------------
// 2. Weather API (Open-Meteo - Free, No Key)
// ------------------------------------------------------------------
export const fetchCapitalWeather = async (lat: number, lng: number) => {
    try {
        const res = await axios.get(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code&hourly=temperature_2m&daily=temperature_2m_max,temperature_2m_min&timezone=auto`
        );
        return res.data;
    } catch (error) {
        console.warn("Weather fetch failed", error);
        return null;
    }
};

export const getWeatherDescription = (code: number) => {
    // WMO Weather interpretation codes (WW)
    if (code === 0) return { text: "Clear sky", emoji: "☀️" };
    if (code >= 1 && code <= 3) return { text: "Partly cloudy", emoji: "⛅" };
    if (code === 45 || code === 48) return { text: "Fog", emoji: "🌫️" };
    if (code >= 51 && code <= 55) return { text: "Drizzle", emoji: "🌦️" };
    if (code >= 61 && code <= 65) return { text: "Rain", emoji: "🌧️" };
    if (code >= 71 && code <= 77) return { text: "Snow", emoji: "❄️" };
    if (code >= 95) return { text: "Thunderstorm", emoji: "⚡" };
    return { text: "Variable", emoji: "☁️" };
};

// ------------------------------------------------------------------
// 3. Rich Data (Manual + AI Verified)
// ------------------------------------------------------------------
const DEFAULT_RICH_DATA: RichCountryInfo = {
    description: "A fascinating country with unique culture and history waiting to be explored.",
    knownFor: ["Culture", "History", "Nature"],
    majorReligion: "Various",
    dialCode: "N/A",
    mobileOperators: ["Local Carriers"],
    plugs: [{ type: "C" }],
    voltage: "230V",
    publicHolidays: [],
    mainAirports: [],
    climate: { text: "Varied climate.", bestTime: "All Year", seasonEmojis: "🌍" },
    emergency: { police: "112", ambulance: "112", fire: "112" },
    alcohol: { drinkingAge: 18, purchaseAge: 18 },
    waterRating: "Check Advice",
    vaccinations: "Routine"
};

export const getRichCountryData = (code: string): RichCountryInfo => {
    // Try explicit code first
    if (RICH_COUNTRIES_DB[code]) return RICH_COUNTRIES_DB[code];

    // Fallback? We could try to map some logic, but for now return default
    return DEFAULT_RICH_DATA;
};

// ------------------------------------------------------------------
// 4. Cities Data (CountriesNow API)
// ------------------------------------------------------------------
// Helper to calculate Haversine distance in km
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
        ;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
}

function deg2rad(deg: number) {
    return deg * (Math.PI / 180);
}

export const findNearestCountry = (lat: number, lng: number): string | null => {
    let closestCountry: string | null = null;
    let minDistance = Infinity;

    // Iterate all countries to find closest centroid
    // Note: This is a rough approximation. For exact borders, we need a polygon check.
    countries.forEach(country => {
        const [cLat, cLng] = country.coordinates;
        const dist = getDistanceFromLatLonInKm(lat, lng, cLat, cLng);

        // Threshold: e.g., 500km tolerance to be "in" or "near" the country
        // But for "nearest", we usually just take the min. 
        // Let's enforce a max reasonable distance (e.g. 1000km) to avoid matching ocean points to random countries.
        if (dist < minDistance && dist < 1000) {
            minDistance = dist;
            closestCountry = country.code;
        }
    });

    return closestCountry;
};

export const fetchCountryCities = async (countryName: string): Promise<string[]> => {
    try {
        const response = await axios.post('https://countriesnow.space/api/v0.1/countries/cities', {
            country: countryName
        });
        if (response.data && !response.data.error && response.data.data.length > 0) {
            return response.data.data;
        }

        // Fallback: Use Capital from local data if API returns empty
        const localCountry = countries.find(c => c.name === countryName);
        if (localCountry?.capital) {
            return [localCountry.capital];
        }

        return [];
    } catch (error) {
        console.warn(`Failed to fetch cities for ${countryName}`, error);

        // Fallback on error too
        const localCountry = countries.find(c => c.name === countryName);
        if (localCountry?.capital) {
            return [localCountry.capital];
        }

        return [];
    }
};
