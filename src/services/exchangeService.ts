import { cachedFetch, refreshCache } from "./offlineCache";

const TTL = 1000 * 60 * 60 * 6; // 6h

/** Fetch all USD-base exchange rates as { CODE: rate }. */
const fetchRatesFromNetwork = async (): Promise<Record<string, number>> => {
    const res = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
    if (!res.ok) throw new Error(`exchange rates HTTP ${res.status}`);
    const json = await res.json();
    return json.rates as Record<string, number>;
};

export const getExchangeRates = (): Promise<Record<string, number>> =>
    cachedFetch("rates:USD", fetchRatesFromNetwork, { ttlMs: TTL });

export const refreshExchangeRates = (): Promise<Record<string, number> | null> =>
    refreshCache("rates:USD", fetchRatesFromNetwork);

export const getRateFor = async (currencyCode: string): Promise<number | null> => {
    if (!currencyCode) return null;
    if (currencyCode === "USD") return 1;
    try {
        const rates = await getExchangeRates();
        return rates?.[currencyCode] ?? null;
    } catch {
        return null;
    }
};
