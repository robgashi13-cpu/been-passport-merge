import { countries, Country } from "@/data/countries";
import { refreshCache } from "./offlineCache";
import { refreshExchangeRates } from "./exchangeService";

export interface SyncProgress {
    step: string;
    done: number;
    total: number;
    /** 0..1 */
    pct: number;
}

export interface ColdSyncOptions {
    /** Countries to prioritize for deep refresh (passport + visited + bucket + lived). */
    priorityIsoCodes?: string[];
    /** Max countries to refresh deeply in this run. Default 24. */
    maxDeep?: number;
    /** Called after every step. */
    onProgress?: (p: SyncProgress) => void;
    /** Hard cap on total run time. After this, sync resolves so the splash dismisses. */
    timeoutMs?: number;
}

const SYNC_KEY = "wp_last_sync_at";
export const getLastSyncAt = (): number => {
    try {
        return Number(localStorage.getItem(SYNC_KEY) || 0);
    } catch {
        return 0;
    }
};
export const setLastSyncAt = (ts: number) => {
    try {
        localStorage.setItem(SYNC_KEY, String(ts));
    } catch {
        /* noop */
    }
};

// Restcountries
const fetchCountryDataNetwork = async (code: string) => {
    const res = await fetch(`https://restcountries.com/v3.1/alpha/${code}`);
    if (!res.ok) throw new Error(`restcountries ${code} ${res.status}`);
    const json = await res.json();
    const d = json[0];
    return {
        currencies: d.currencies,
        languages: d.languages,
        car: d.car,
        maps: d.maps,
        timezones: d.timezones,
        demonyms: d.demonyms,
        flags: d.flags,
        coatOfArms: d.coatOfArms,
        capital: d.capital,
        capitalInfo: d.capitalInfo,
        idd: d.idd,
        population: d.population,
        region: d.region,
        subregion: d.subregion,
        continents: d.continents,
        area: d.area,
    };
};

const fetchWikiNetwork = async (countryName: string) => {
    const res = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(countryName)}`
    );
    if (!res.ok) throw new Error(`wiki ${countryName} ${res.status}`);
    return res.json();
};

const fetchCitiesNetwork = async (countryName: string): Promise<string[]> => {
    const res = await fetch("https://countriesnow.space/api/v0.1/countries/cities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country: countryName }),
    });
    if (!res.ok) throw new Error(`cities ${countryName} ${res.status}`);
    const data = await res.json();
    if (data.error) return [];
    return data.data as string[];
};

const fetchStatesNetwork = async (countryName: string) => {
    const res = await fetch("https://countriesnow.space/api/v0.1/countries/states", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country: countryName }),
    });
    if (!res.ok) throw new Error(`states ${countryName} ${res.status}`);
    const data = await res.json();
    if (data.error) return [];
    return (data.data?.states || []) as { name: string; state_code: string }[];
};

const chunk = <T,>(arr: T[], size: number): T[][] => {
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
};

/**
 * Cold-open sync. Refreshes exchange rates + prioritized country bundles
 * (metadata, wiki summary, cities, states). Idempotent and safe to abort.
 */
export const runColdSync = async (opts: ColdSyncOptions = {}): Promise<void> => {
    const {
        priorityIsoCodes = [],
        maxDeep = 24,
        onProgress,
        timeoutMs = 9000,
    } = opts;

    const started = Date.now();
    const timeLeft = () => timeoutMs - (Date.now() - started);

    // Deduplicate + clamp priority list. Fall back to a small default set
    // covering the top travel hubs so first-time users still get something.
    const defaultSeed = ["US", "GB", "FR", "DE", "IT", "ES", "JP", "CN", "AU", "BR"];
    const wanted = Array.from(new Set([...priorityIsoCodes, ...defaultSeed]))
        .filter(code => countries.some(c => c.code === code))
        .slice(0, maxDeep);

    const steps: Array<{ label: string; run: () => Promise<unknown> }> = [];

    // 1) Exchange rates (single call).
    steps.push({
        label: "Refreshing exchange rates",
        run: () => refreshExchangeRates(),
    });

    // 2) Per-country bundle (metadata + wiki + cities + states).
    for (const code of wanted) {
        const country: Country | undefined = countries.find(c => c.code === code);
        if (!country) continue;
        steps.push({
            label: `Updating ${country.name}`,
            run: async () => {
                await Promise.allSettled([
                    refreshCache(`country:${code}`, () => fetchCountryDataNetwork(code)),
                    refreshCache(`wiki:${country.name}`, () => fetchWikiNetwork(country.name)),
                    refreshCache(`cities:${country.name}`, () => fetchCitiesNetwork(country.name)),
                    refreshCache(`states:${country.name}`, () => fetchStatesNetwork(country.name)),
                ]);
            },
        });
    }

    const total = steps.length;
    let done = 0;
    onProgress?.({ step: "Starting sync…", done, total, pct: 0 });

    // Run sequentially in tiny chunks so the splash bar advances smoothly
    // and we don't slam any single API.
    for (const batch of chunk(steps, 3)) {
        if (timeLeft() <= 0) break;
        await Promise.allSettled(
            batch.map(async (s) => {
                onProgress?.({ step: s.label, done, total, pct: done / total });
                await s.run();
                done += 1;
                onProgress?.({ step: s.label, done, total, pct: done / total });
            })
        );
    }

    onProgress?.({ step: "Up to date", done: total, total, pct: 1 });
    setLastSyncAt(Date.now());
};
