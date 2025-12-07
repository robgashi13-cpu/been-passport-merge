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
