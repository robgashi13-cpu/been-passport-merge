const fs = require('fs');
const path = require('path');

const csvPath = '/tmp/visa_matrix.csv';
const csv = fs.readFileSync(csvPath, 'utf8').trim();
const lines = csv.split('\n');
const headers = lines[0].split(',').map(s => s.trim());
// headers[0] === 'Passport', rest are ISO2 destinations

const matrix = {};
for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(s => s.trim());
    const passport = cols[0];
    if (!passport) continue;
    matrix[passport] = {};
    for (let j = 1; j < cols.length; j++) {
        const dest = headers[j];
        if (!dest || dest === passport) continue;
        let val = (cols[j] || '').toLowerCase();
        if (!val || val === '-1') continue;
        let entry;
        if (val === 'visa required') entry = { requirement: 'visa-required' };
        else if (val === 'visa on arrival' || val === 'voa') entry = { requirement: 'visa-on-arrival' };
        else if (val === 'e-visa' || val === 'evisa') entry = { requirement: 'e-visa' };
        else if (val === 'eta') entry = { requirement: 'eta' };
        else if (val === 'visa free' || val === 'visa-free') entry = { requirement: 'visa-free' };
        else if (!isNaN(parseInt(val))) entry = { requirement: 'visa-free', duration: val + ' days' };
        else if (val === 'covid ban' || val.includes('not admitted') || val === 'no admission') entry = { requirement: 'visa-required', notes: 'Restricted entry' };
        else continue;
        matrix[passport][dest] = entry;
    }
}

const ts = `// Comprehensive Visa Requirements Database
// Sourced from Passport Index Dataset (github.com/ilyankou/passport-index-dataset)
// Generated automatically on ${new Date().toISOString()}

export type VisaRequirement = 'visa-free' | 'visa-on-arrival' | 'e-visa' | 'visa-required' | 'eta';

export interface VisaMatrixEntry {
    requirement: VisaRequirement;
    duration?: string;
    notes?: string;
}

export const visaMatrix: Record<string, Record<string, VisaMatrixEntry>> = ${JSON.stringify(matrix, null, 2)};

export const availablePassports = Object.keys(visaMatrix);

export const getVisaRequirementFromMatrix = (passportCode: string, destinationCode: string): VisaMatrixEntry | undefined => {
    const passportData = visaMatrix[passportCode];
    if (passportData && passportData[destinationCode]) {
        return passportData[destinationCode];
    }
    if (passportCode === destinationCode) return undefined;
    return { requirement: 'visa-required', notes: 'Requirement unknown, check official sources' };
};

export const getVisaRequirementColor = (requirement: VisaRequirement): string => {
    switch (requirement) {
        case 'visa-free': return '#22c55e';
        case 'visa-on-arrival': return '#84cc16';
        case 'e-visa': return '#eab308';
        case 'eta': return '#f97316';
        case 'visa-required': return '#ef4444';
        default: return '#6b7280';
    }
};

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

export const getPassportStats = (passportCode: string) => {
    const passportData = visaMatrix[passportCode];
    if (!passportData) return null;
    let stats = { visaFree: 0, visaOnArrival: 0, eVisa: 0, visaRequired: 0 };
    let total = 0;
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
    return { total, ...stats };
};
`;

fs.writeFileSync(path.join(__dirname, '../src/data/visaMatrix.ts'), ts);
const passports = Object.keys(matrix).length;
const sample = matrix['US'] ? Object.keys(matrix['US']).length : 0;
console.log('OK passports:', passports, 'US destinations:', sample);
