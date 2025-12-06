const fs = require('fs');
const path = require('path');

// 1. Load Country Mappings from source code
// We regex extract { code: "XX", name: "Name" } from countries.ts
const countriesPath = path.join(__dirname, '../src/data/countries.ts');
const countriesContent = fs.readFileSync(countriesPath, 'utf8');

const nameToCode = {};
const codeToName = {};

// Regex to capture code and name
const regex = /{ code: "([A-Z]{2})", name: "([^"]+)"/g;
let match;
while ((match = regex.exec(countriesContent)) !== null) {
    const code = match[1];
    const name = match[2].toLowerCase();
    nameToCode[name] = code;
    codeToName[code] = match[2]; // formatted name
}

// Manual Normalizations for Passport Index CSV compatibility
const mappings = {
    "united states": "US",
    "united states of america": "US",
    "united kingdom": "GB",
    "korea, south": "KR",
    "south korea": "KR",
    "korea (rep.)": "KR",
    "korea, north": "KP",
    "north korea": "KP",
    "congo (dem. rep.)": "CD",
    "dr congo": "CD",
    "congo": "CG",
    "congo (rep.)": "CG",
    "cote d'ivoire": "CI",
    "ivory coast": "CI",
    "vatican city": "VA",
    "vatican": "VA",
    "holy see": "VA",
    "micronesia": "FM",
    "monaco": "MC",
    "macao": "MO",
    "macau": "MO",
    "hong kong": "HK",
    "palestine": "PS",
    "palestinian territory": "PS",
    "palestinian territories": "PS",
    "myanmar": "MM",
    "myanmar [burma]": "MM",
    "burma": "MM",
    "eswatini": "SZ",
    "swaziland": "SZ",
    "north macedonia": "MK",
    "macedonia": "MK",
    "czech republic": "CZ",
    "czechia": "CZ",
    "timor-leste": "TL",
    "east timor": "TL",
    "guinea-bissau": "GW",
    "cabo verde": "CV",
    "cape verde": "CV",
    "bosnia and herzegovina": "BA",
    "sao tome and principe": "ST",
    "antigua and barbuda": "AG",
    "st. kitts and nevis": "KN",
    "saint kitts and nevis": "KN",
    "st. lucia": "LC",
    "saint lucia": "LC",
    "st. vincent and the grenadines": "VC",
    "saint vincent and the grenadines": "VC",
    "trinidad and tobago": "TT",
    "brunei": "BN",
    "brunei darussalam": "BN",
    "syria": "SY",
    "syrian arab republic": "SY",
    "laos": "LA",
    "lao people's dem. rep.": "LA",
    "russia": "RU",
    "russian federation": "RU",
    "moldova": "MD",
    "vietnam": "VN",
    "viet nam": "VN",
    "tanzania": "TZ",
    "united republic of tanzania": "TZ",
    "iran": "IR",
    "gambiae": "GM",
    "gambia": "GM",
    "bahamas": "BS", // often "the bahamas"
    "the bahamas": "BS"
};

Object.entries(mappings).forEach(([k, v]) => {
    nameToCode[k] = v;
});

// 2. Parse CSV
const csvPath = path.join(__dirname, '../temp_visa_matrix.csv');
const csvContent = fs.readFileSync(csvPath, 'utf8');

const lines = csvContent.split('\n');
const headerLine = lines[0];
const headerCols = headerLine.split(',').map(c => c.trim().toLowerCase());

// Map column index to destination country code
const colIndexToCode = {};
headerCols.forEach((col, idx) => {
    if (idx === 0) return;
    const code = nameToCode[col] || nameToCode[col.replace(/^the /, '')];
    if (code) {
        colIndexToCode[idx] = code;
    } else {
        // console.log(`Warning: Could not map header "${col}" to a country code.`);
    }
});

// Build Matrix
const visaMatrix = {}; // Record<passport, Record<dest, { ... }>>

for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    // Split logic handling basics (assuming no quoted headers in this specific dataset)
    const cols = line.split(',').map(c => c.trim());
    const passportNameRaw = cols[0].toLowerCase();
    const passportCode = nameToCode[passportNameRaw] || nameToCode[passportNameRaw.replace(/^the /, '')];

    if (!passportCode) {
        // console.log(`Warning: Could not map row "${cols[0]}" to a passport code.`);
        continue;
    }

    visaMatrix[passportCode] = {};

    for (let j = 1; j < cols.length; j++) {
        const destCode = colIndexToCode[j];
        if (!destCode) continue;
        if (destCode === passportCode) continue;

        let val = cols[j];
        if (val === '-1' || val === '' || val === undefined) continue;

        // Normalize value
        // Possible values: "visa required", "visa on arrival", "e-visa", "eta", "visa-free", number (days)
        let requirement = 'visa-required';
        let duration = undefined;

        val = val.toLowerCase();

        if (val === 'visa required') requirement = 'visa-required';
        else if (val === 'visa on arrival' || val === 'voa') requirement = 'visa-on-arrival';
        else if (val === 'e-visa' || val === 'evisa') requirement = 'e-visa';
        else if (val === 'eta') requirement = 'eta'; // mapped to e-visa in old system, but we have 'eta' type
        else if (val === 'visa-free' || val === 'visa free') requirement = 'visa-free';
        else if (!isNaN(parseInt(val))) {
            requirement = 'visa-free';
            duration = val + ' days';
        }

        visaMatrix[passportCode][destCode] = { requirement };
        if (duration) visaMatrix[passportCode][destCode].duration = duration;
    }
}

// 3. Generate Output File Content
const outputPath = path.join(__dirname, '../src/data/visaMatrix.ts');

const tsContent = `// Comprehensive Visa Requirements Database
// Sourced from Passport Index 2025 Dataset (github.com/ilyankou/passport-index-dataset)
// Generated automatically on ${new Date().toISOString()}

export type VisaRequirement = 'visa-free' | 'visa-on-arrival' | 'e-visa' | 'visa-required' | 'eta';

export interface VisaMatrixEntry {
    requirement: VisaRequirement;
    duration?: string;
    notes?: string;
}

// Visa requirements matrix: passportCode -> destinationCode -> requirement
export const visaMatrix: Record<string, Record<string, VisaMatrixEntry>> = ${JSON.stringify(visaMatrix, null, 2)};

// List of available passports in the matrix
export const availablePassports = Object.keys(visaMatrix);

/**
 * Get visa requirement for a specific route
 */
export const getVisaRequirementFromMatrix = (passportCode: string, destinationCode: string): VisaMatrixEntry | undefined => {
    const passportData = visaMatrix[passportCode];
    if (passportData && passportData[destinationCode]) {
        return passportData[destinationCode];
    }
    // Default to visa-required if no data found (and not same country)
    if (passportCode === destinationCode) return undefined;
    
    return { requirement: 'visa-required', notes: 'Requirement unknown, check official sources' };
};

/**
 * Get visa requirement color for UI
 */
export const getVisaRequirementColor = (requirement: VisaRequirement): string => {
    switch (requirement) {
        case 'visa-free': return '#22c55e'; // green
        case 'visa-on-arrival': return '#84cc16'; // lime
        case 'e-visa': return '#eab308'; // yellow
        case 'eta': return '#f97316'; // orange
        case 'visa-required': return '#ef4444'; // red
        default: return '#6b7280'; // gray
    }
};

/**
 * Get visa requirement label
 */
export const getVisaRequirementLabel = (requirement: VisaRequirement): string => {
    switch (requirement) {
        case 'visa-free': return 'Visa Free';
        case 'visa-on-arrival': return 'Visa on Arrival';
        case 'e-visa': return 'e-Visa';
        case 'eta': return 'ETA Required';
        case 'visa-required': return 'Visa Required';
        default: return 'Unknown';
    }
};

/**
 * Get passport statistics for all countries
 */
export const getPassportStats = (passportCode: string) => {
    const passportData = visaMatrix[passportCode];
    if (!passportData) return null;

    let stats = { visaFree: 0, visaOnArrival: 0, eVisa: 0, visaRequired: 0 };
    let total = 0;

    // Use countries list from matrix keys to ensure we count valid destinations
    // Or iterate the map entries. 
    // The matrix only stores "exceptions" or "knowns".
    // We should iterate ALL countries to get a correct 'visaRequired' count (implied).
    
    // We'll iterate availablePassports as the universe of countries.
    availablePassports.forEach(destCode => {
        if (destCode === passportCode) return;
        total++;
        const entry = passportData[destCode];
        const req = entry ? entry.requirement : 'visa-required';

        switch (req) {
            case 'visa-free': stats.visaFree++; break;
            case 'visa-on-arrival': stats.visaOnArrival++; break;
            case 'e-visa':
            case 'eta': stats.eVisa++; break;
            case 'visa-required': stats.visaRequired++; break;
        }
    });

    return {
        total,
        ...stats
    };
};
`;

fs.writeFileSync(outputPath, tsContent);
console.log("Successfully generated visaMatrix.ts with", Object.keys(visaMatrix).length, "passports.");
