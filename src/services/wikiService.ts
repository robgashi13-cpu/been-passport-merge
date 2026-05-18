import { cachedFetch } from '@/services/offlineCache';

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

const WIKI_TTL = 1000 * 60 * 60 * 24 * 30; // 30d

const fetchFromNetwork = async (countryName: string): Promise<WikiSummary> => {
    const searchName = countryName
        .replace(/United States/, 'United States')
        .replace(/United Kingdom/, 'United Kingdom')
        .replace(/Korea, Republic of/, 'South Korea');
    const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(searchName)}`);
    if (!res.ok) throw new Error(`wiki ${res.status}`);
    return res.json();
};

export const fetchCountrySummary = async (countryName: string): Promise<WikiSummary | null> => {
    try {
        return await cachedFetch(`wiki:${countryName}`, () => fetchFromNetwork(countryName), { ttlMs: WIKI_TTL });
    } catch (error) {
        console.warn(`Failed to fetch wiki summary for ${countryName}`, error);
        return null;
    }
};
