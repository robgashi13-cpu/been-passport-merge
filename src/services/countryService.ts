import axios from 'axios';

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
    population?: number;
    region?: string;
    subregion?: string;
    continents?: string[];
}

export interface RichCountryInfo {
    description: string;
    knownFor: string[];
    majorReligion: string;
    dialCode: string; // e.g. +1
    mobileOperators: string[];
    plugs: { type: string; url?: string }[];
    voltage: string;
    publicHolidays: { date: string; name: string }[];
    mainAirports: { code: string; name: string }[];
    climate: {
        text: string;
        bestTime: string; // e.g. "March - May"
        seasonEmojis: string; // e.g. "🌸☀️"
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
}

// ... (existing code)

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
    if (code >= 1 && code <= 3) return { text: "Partly cloudy", emoji: "chúc" };
    if (code === 45 || code === 48) return { text: "Fog", emoji: "🌫️" };
    if (code >= 51 && code <= 55) return { text: "Drizzle", emoji: "DRIZZLE" }; // Fix emoji later if needed
    if (code >= 61 && code <= 65) return { text: "Rain", emoji: "🌧️" };
    if (code >= 71 && code <= 77) return { text: "Snow", emoji: "❄️" };
    if (code >= 95) return { text: "Thunderstorm", emoji: "⚡" };
    return { text: "Variable", emoji: "⛅" };
};

// ------------------------------------------------------------------
// 3. Manual Rich Data (The "Skratch/Wikipedia" Data)
// ------------------------------------------------------------------
const DEFAULT_RICH_DATA: RichCountryInfo = {
    description: "A fascinating country with unique culture and history waiting to be explored.",
    knownFor: ["Culture", "History", "Food"],
    majorReligion: "Various",
    dialCode: "+",
    mobileOperators: ["Local Carriers"],
    plugs: [{ type: "C", url: "https://example.com/plug-c" }],
    voltage: "230V",
    publicHolidays: [{ date: "Dec 25", name: "Christmas Day" }, { date: "Jan 1", name: "New Year's Day" }],
    mainAirports: [{ code: "MAIN", name: "International Airport" }],
    climate: { text: "Varied climate depending on region.", bestTime: "All Year", seasonEmojis: "🌍" },
    emergency: { police: "112", ambulance: "112", fire: "112" },
    alcohol: { drinkingAge: 18, purchaseAge: 18 },
    waterRating: "Check Local Advice",
    vaccinations: "Routine"
};

// We define data for key countries to show the "Premium" feel. 
// Ideally this would be 200+ entries.
const RICH_DATA_DB: Record<string, RichCountryInfo> = {
    "JP": {
        description: "An island nation in East Asia, Japan blends ancient traditions with futuristic technology. Famous for cherry blossoms, anime, and sushi.",
        knownFor: ["Sushi", "Cherry Blossoms", "Anime", "Technology", "Temples"],
        majorReligion: "Shintoism & Buddhism",
        dialCode: "+81",
        mobileOperators: ["NTT Docomo", "SoftBank", "au"],
        plugs: [{ type: "A" }, { type: "B" }],
        voltage: "100V",
        publicHolidays: [
            { date: "Jan 1", name: "New Year's Day" },
            { date: "Feb 11", name: "National Foundation Day" },
            { date: "Feb 23", name: "Emperor's Birthday" },
            { date: "Apr 29", name: "Shōwa Day" },
            { date: "May 3", name: "Constitution Memorial Day" }
        ],
        mainAirports: [
            { code: "HND", name: "Haneda Airport" },
            { code: "NRT", name: "Narita International Airport" },
            { code: "KIX", name: "Kansai International Airport" }
        ],
        climate: {
            text: "Temperate with four distinct seasons. Hot, humid summers and cool to cold winters.",
            bestTime: "March-May or Oct-Nov",
            seasonEmojis: "🌸🍂"
        },
        emergency: { police: "110", ambulance: "119", fire: "119" },
        waterRating: "Safe",
        vaccinations: "Routine",
        alcohol: { drinkingAge: 20, purchaseAge: 20 }
    },
    "GB": {
        description: "The United Kingdom consists of England, Scotland, Wales, and Northern Ireland. A global cultural and financial hub with deep history.",
        knownFor: ["Royal Family", "Tea", "History", "Music", "Football"],
        majorReligion: "Christianity",
        dialCode: "+44",
        mobileOperators: ["EE", "O2", "Vodafone", "Three"],
        plugs: [{ type: "G" }],
        voltage: "230V",
        publicHolidays: [
            { date: "Dec 25", name: "Christmas Day" },
            { date: "Dec 26", name: "Boxing Day" },
            { date: "Jan 1", name: "New Year's Day" },
            { date: "Varies", name: "Good Friday" }
        ],
        mainAirports: [
            { code: "LHR", name: "Heathrow Airport" },
            { code: "LGW", name: "Gatwick Airport" },
            { code: "MAN", name: "Manchester Airport" }
        ],
        climate: {
            text: "Temperate maritime climate. Mild temperatures, frequent rain, and changeable weather.",
            bestTime: "June-August",
            seasonEmojis: "⛅☔"
        },
        emergency: { police: "999", ambulance: "999", fire: "999" },
        waterRating: "Safe",
        vaccinations: "Routine",
        alcohol: { drinkingAge: 18, purchaseAge: 18 }
    },
    "US": {
        description: "A country of 50 states covering a vast swath of North America, with Alaska in the northwest and Hawaii extending the nation’s presence into the Pacific Ocean.",
        knownFor: ["Hollywood", "Technology", "Music", "National Parks", "Burgers"],
        majorReligion: "Christianity",
        dialCode: "+1",
        mobileOperators: ["Verizon", "T-Mobile", "AT&T"],
        plugs: [{ type: "A" }, { type: "B" }],
        voltage: "120V",
        publicHolidays: [
            { date: "Jul 4", name: "Independence Day" },
            { date: "Dec 25", name: "Christmas Day" },
            { date: "Nov 28", name: "Thanksgiving" }
        ],
        mainAirports: [
            { code: "ATL", name: "Hartsfield-Jackson" },
            { code: "LAX", name: "Los Angeles Intl" },
            { code: "JFK", name: "John F. Kennedy" }
        ],
        climate: {
            text: "Extremely varied. Tropical in Florida/Hawaii, arctic in Alaska, arid in the Southwest, temperate elsewhere.",
            bestTime: "Spring or Fall",
            seasonEmojis: "☀️🍂"
        },
        emergency: { police: "911", ambulance: "911", fire: "911" },
        waterRating: "Safe",
        vaccinations: "Routine",
        alcohol: { drinkingAge: 21, purchaseAge: 21 }
    },
    "FR": {
        description: "France, in Western Europe, encompasses medieval cities, alpine villages and Mediterranean beaches. Paris, its capital, is famed for its fashion houses, classical art museums including the Louvre and monuments like the Eiffel Tower.",
        knownFor: ["Wine", "Cheese", "Art", "Fashion", "Riviera"],
        majorReligion: "Christianity (Catholicism)",
        dialCode: "+33",
        mobileOperators: ["Orange", "SFR", "Bouygues", "Free"],
        plugs: [{ type: "C" }, { type: "E" }],
        voltage: "230V",
        publicHolidays: [
            { date: "Jul 14", name: "Bastille Day" },
            { date: "Dec 25", name: "Christmas Day" },
            { date: "May 1", name: "Labour Day" }
        ],
        mainAirports: [
            { code: "CDG", name: "Charles de Gaulle" },
            { code: "ORY", name: "Orly Airport" },
            { code: "NCE", name: "Nice Côte d'Azur" }
        ],
        climate: {
            text: "Generally cool winters and mild summers, but mild winters and hot summers along the Mediterranean.",
            bestTime: "April-June or Sept-Nov",
            seasonEmojis: "🍇🍷"
        },
        emergency: { police: "112/17", ambulance: "112/15", fire: "112/18" },
        waterRating: "Safe",
        vaccinations: "Routine",
        alcohol: { drinkingAge: 18, purchaseAge: 18 }
    },
    "AL": {
        description: "Albania is a small country with Adriatic and Ionian coastlines and an interior crossed by the Albanian Alps. It has many castles and archaeological sites.",
        knownFor: ["Beaches", "Mountains", "Hospitality", "History"],
        majorReligion: "Islam & Christianity",
        dialCode: "+355",
        mobileOperators: ["Vodafone", "One"],
        plugs: [{ type: "C" }, { type: "F" }],
        voltage: "230V",
        publicHolidays: [
            { date: "Nov 28", name: "Independence Day" },
            { date: "Nov 29", name: "Liberation Day" },
            { date: "Mar 14", name: "Summer Day" }
        ],
        mainAirports: [
            { code: "TIA", name: "Tirana International" }
        ],
        climate: {
            text: "Mild temperate climate. Cool, wet winters and hot, dry summers.",
            bestTime: "May-June or Sept-Oct",
            seasonEmojis: "🏖️⛰️"
        },
        emergency: { police: "129", ambulance: "127", fire: "128" },
        waterRating: "Safe",
        vaccinations: "Routine",
        alcohol: { drinkingAge: 18, purchaseAge: 18 }
    },
    "XK": {
        description: "Kosovo is a young, partially recognized state in the Balkans. It features rugged mountains, medieval monasteries, and a vibrant cafe culture.",
        knownFor: ["Coffee Culture", "Young Population", "Mountains", "History"],
        majorReligion: "Islam",
        dialCode: "+383",
        mobileOperators: ["IPKO", "Vala"],
        plugs: [{ type: "C" }, { type: "F" }],
        voltage: "230V",
        publicHolidays: [
            { date: "Feb 17", name: "Independence Day" },
            { date: "Apr 9", name: "Constitution Day" }
        ],
        mainAirports: [
            { code: "PRN", name: "Pristina International" }
        ],
        climate: {
            text: "Continental climate with warm summers and cold, snowy winters.",
            bestTime: "Spring or Summer",
            seasonEmojis: "⛷️☕"
        },
        emergency: { police: "192", ambulance: "194", fire: "193" },
        alcohol: { drinkingAge: 18, purchaseAge: 18 }
    }
};

export const getRichCountryData = (code: string): RichCountryInfo => {
    return RICH_DATA_DB[code] || DEFAULT_RICH_DATA;
};
