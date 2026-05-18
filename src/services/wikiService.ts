import axios from 'axios';

export interface WikiSummary {
    title: string;
    extract: string;
    thumbnail?: {
        source: string;
        width: number;
        height: number;
    };
    content_urls?: {
        desktop: {
            page: string;
        };
    };
}

const SUMMARY_CACHE_KEY = 'wanderpass_country_insight_cache_v1';

const readSummaryCache = (): Record<string, WikiSummary> => {
    if (typeof window === 'undefined') return {};

    try {
        const cached = window.localStorage.getItem(SUMMARY_CACHE_KEY);
        return cached ? JSON.parse(cached) : {};
    } catch (error) {
        console.warn('Failed to read country insight cache', error);
        return {};
    }
};

const writeSummaryCache = (cache: Record<string, WikiSummary>) => {
    if (typeof window === 'undefined') return;

    try {
        window.localStorage.setItem(SUMMARY_CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
        console.warn('Failed to persist country insight cache', error);
    }
};

export const getCachedCountrySummary = (countryCode: string): WikiSummary | null => {
    return readSummaryCache()[countryCode] || null;
};

export const cacheCountrySummary = (countryCode: string, summary: WikiSummary) => {
    const cache = readSummaryCache();
    cache[countryCode] = summary;
    writeSummaryCache(cache);
};

export const fetchCountrySummary = async (countryName: string): Promise<WikiSummary | null> => {
    try {
        // Handle common name mismatches 
        const searchName = countryName
            .replace(/United States/, "United States")
            .replace(/United Kingdom/, "United Kingdom")
            .replace(/Korea, Republic of/, "South Korea");

        const response = await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(searchName)}`);
        return response.data;
    } catch (error) {
        console.warn(`Failed to fetch wiki summary for ${countryName}`, error);
        return null;
    }
};
