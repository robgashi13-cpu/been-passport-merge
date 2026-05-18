// Recompute passportRank + visaFreeDestinations in countries.ts from the freshly generated visaMatrix.
const fs = require('fs');
const path = require('path');

const matrixPath = path.join(__dirname, '../src/data/visaMatrix.ts');
const matrixSrc = fs.readFileSync(matrixPath, 'utf8');
const jsonMatch = matrixSrc.match(/visaMatrix:[^=]*=\s*(\{[\s\S]*?\});\s*\n\nexport const availablePassports/);
if (!jsonMatch) { console.error('Could not parse matrix'); process.exit(1); }
const matrix = JSON.parse(jsonMatch[1]);

// Henley methodology: count destinations where holder gets visa-free, VoA, eTA, or e-visa
const ACCESS = new Set(['visa-free', 'visa-on-arrival', 'eta', 'e-visa']);
const scores = {};
for (const [passport, dests] of Object.entries(matrix)) {
    let n = 0;
    for (const v of Object.values(dests)) if (ACCESS.has(v.requirement)) n++;
    scores[passport] = n;
}

// Dense ranking (ties share rank, next rank = previous+1)
const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
const ranks = {};
let prevScore = null, currentRank = 0;
sorted.forEach(([code, score], i) => {
    if (score !== prevScore) { currentRank = currentRank + 1; prevScore = score; }
    ranks[code] = currentRank;
});

// Patch countries.ts
const countriesPath = path.join(__dirname, '../src/data/countries.ts');
let src = fs.readFileSync(countriesPath, 'utf8');

let updated = 0, missing = [];
src = src.replace(/\{ code: "([A-Z]{2})", ([^}]*) \}/g, (full, code, rest) => {
    const score = scores[code];
    if (score === undefined) { missing.push(code); return full; }
    const rank = ranks[code];
    // Replace passportRank: N and visaFreeDestinations: N if present
    let newRest = rest;
    if (/passportRank:\s*\d+/.test(newRest)) {
        newRest = newRest.replace(/passportRank:\s*\d+/, `passportRank: ${rank}`);
    } else {
        newRest = `passportRank: ${rank}, ` + newRest;
    }
    if (/visaFreeDestinations:\s*\d+/.test(newRest)) {
        newRest = newRest.replace(/visaFreeDestinations:\s*\d+/, `visaFreeDestinations: ${score}`);
    } else {
        newRest = newRest.replace(/passportRank:\s*\d+,?\s*/, m => m + `visaFreeDestinations: ${score}, `);
    }
    updated++;
    return `{ code: "${code}", ${newRest} }`;
});

fs.writeFileSync(countriesPath, src);
console.log('Updated', updated, 'countries. Missing from matrix:', missing.length ? missing.join(',') : 'none');
console.log('Sample ranks — JP:', ranks.JP, 'SG:', ranks.SG, 'US:', ranks.US, 'DE:', ranks.DE, 'FR:', ranks.FR, 'AF:', ranks.AF);
console.log('Sample scores — JP:', scores.JP, 'SG:', scores.SG, 'US:', scores.US);
