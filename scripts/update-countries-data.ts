import fs from 'fs';
import path from 'path';
import axios from 'axios';

// Define the interface matching src/data/countries.ts
interface CountryInterface {
    code: string;
    name: string;
    continent: string;
    passportRank?: number;
    visaFreeDestinations?: number;
    flagEmoji: string;
    region?: string;
    capital?: string;
    population?: number;
    officialVisaWebsite?: string;
    coordinates?: [number, number]; // [lat, lng]
    hdi?: number; // Human Development Index (0-1)
    gdp?: number; // GDP per capita in USD
    currency?: string; // Currency Code (e.g. USD, EUR)
    safetyScore?: number; // 0-100 Gallup Law and Order Index
    safetyLevel?: 'Very High' | 'High' | 'Moderate' | 'Low';
}

// Helper to determine safety level
const getSafetyLevel = (score: number) => {
    if (score >= 90) return 'Very High';
    if (score >= 75) return 'High';
    if (score >= 60) return 'Moderate';
    return 'Low';
};

// Continent Mapping (RestCountries region -> App Continent)
const continentMap: Record<string, string> = {
    'Europe': 'Europe',
    'Asia': 'Asia',
    'Africa': 'Africa',
    'Oceania': 'Oceania',
    'Americas': 'North America', // Default, logic below will refine
    'Antarctic': 'Antarctica'
};

const updateCountries = async () => {
    try {
        console.log('Fetching live country data...');
        const response = await axios.get('https://restcountries.com/v3.1/all?fields=cca2,name,population,capital,latlng,currencies,region,subregion,flags');
        const apiData = response.data;


        const countriesPath = path.join(process.cwd(), 'src/data/countries.ts');
        const fileContent = fs.readFileSync(countriesPath, 'utf-8');

        // Extract the existing countries array using regex or simple evaluation
        // NOTE: Evaluating TS file is tricky. Instead, we'll regex capture the object start/end
        // Or we can import it if we handle TS execution.
        // SIMPLER: Let's read the file, and for each country code in our list, update dynamic fields.

        // 1. Parse current file to get the list of existing countries (to preserve our custom fields like Rank, VisaFree, Safety, manually set names)
        // We will assume the file structure is `export const countries: Country[] = [ ... ]`

        // Regex to match objects: { code: "AL", ... },
        const countryEntryRegex = /\{ code: "([A-Z]{2})",[^}]+\},?/g;

        let newFileContent = fileContent;
        let match;

        // We will build a map of updates
        const updates = new Map<string, Partial<CountryInterface>>();

        apiData.forEach((c: any) => {
            const code = c.cca2;
            const update: any = {};

            // Population
            if (c.population) update.population = c.population;

            // Capital
            if (c.capital && c.capital.length > 0) update.capital = c.capital[0];

            // Coordinates
            if (c.latlng) update.coordinates = c.latlng;

            // Currency (Just the code)
            if (c.currencies) update.currency = Object.keys(c.currencies)[0];

            // Subregion -> Region
            if (c.subregion) update.region = c.subregion;

            // Continent Logic (Americas split)
            if (c.region === 'Americas') {
                if (c.subregion?.includes('South')) {
                    update.continent = 'South America';
                } else {
                    update.continent = 'North America';
                }
            } else if (continentMap[c.region]) {
                update.continent = continentMap[c.region];
            }

            updates.set(code, update);
        });

        // Now Replace in file
        // We iterate line by line to be safer? Or use replace with callback?

        newFileContent = newFileContent.replace(countryEntryRegex, (fullMatch, code) => {
            const update = updates.get(code);

            if (!update) {
                console.log(`No update found for ${code}`);
                return fullMatch; // Keep as is
            }

            // Parse the object (rough) to preserve static fields
            // This is brittle. A better way: Recostruct the string.

            // Extract Name (preserve our name)
            const nameMatch = fullMatch.match(/name: "([^"]+)"/);
            const name = nameMatch ? nameMatch[1] : '';

            // Extract existing fields we WANT to keep if not in API (e.g. rank)
            const rankMatch = fullMatch.match(/passportRank: (\d+)/);
            const rank = rankMatch ? rankMatch[1] : undefined;

            const vfMatch = fullMatch.match(/visaFreeDestinations: (\d+)/);
            const vf = vfMatch ? vfMatch[1] : undefined;

            const flagMatch = fullMatch.match(/flagEmoji: "([^"]+)"/);
            const flag = flagMatch ? flagMatch[1] : '';

            const safetyMatch = fullMatch.match(/safetyScore: (\d+)/);
            const safetyScore = safetyMatch ? parseInt(safetyMatch[1]) : undefined;

            const safetyLevelMatch = fullMatch.match(/safetyLevel: "([^"]+)"/);
            let safetyLevel = safetyLevelMatch ? safetyLevelMatch[1] : undefined;

            // Logic to preserve or update
            // We prioritize API for: population, capital, coordinates, region, currency
            // We prioritize Local for: name, rank, visafree, flag (sometimes API flags are different chars), safety

            const finalPop = update.population || 0;
            const finalCap = update.capital || 'N/A';
            const finalCoord = update.coordinates ? `[${update.coordinates[0]}, ${update.coordinates[1]}]` : '[0, 0]';
            const finalRegion = update.region || '';
            const finalContinent = update.continent || 'Europe'; // Default fallback
            const finalCurrency = update.currency || '';

            // Reconstruct line
            // { code: "AL", name: "Albania", continent: "Europe", passportRank: 49, visaFreeDestinations: 119, flagEmoji: "🇦🇱", capital: "Tirana", population: 2877797, coordinates: [41.15, 20.16], safetyScore: 78, safetyLevel: "High" },

            let newLine = `  { code: "${code}", name: "${name}", continent: "${finalContinent}", `;

            if (rank) newLine += `passportRank: ${rank}, `;
            if (vf) newLine += `visaFreeDestinations: ${vf}, `;

            newLine += `flagEmoji: "${flag}", `;
            newLine += `capital: "${finalCap}", `;
            newLine += `population: ${finalPop}, `;
            newLine += `coordinates: ${finalCoord}, `;

            if (finalRegion) newLine += `region: "${finalRegion}", `;
            if (finalCurrency) newLine += `currency: "${finalCurrency}", `;

            // Safety
            if (safetyScore !== undefined) {
                newLine += `safetyScore: ${safetyScore}, `;
                newLine += `safetyLevel: "${safetyLevel || getSafetyLevel(safetyScore)}"`;
            }

            newLine += ` },`;

            return newLine;
        });

        console.log('Writing updated data...');
        fs.writeFileSync(countriesPath, newFileContent);
        console.log('Done!');

    } catch (e) {
        console.error('Error updating countries:', e);
    }
};

updateCountries();
