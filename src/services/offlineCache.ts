import { get, set, del, keys } from "idb-keyval";

/**
 * Lightweight offline cache backed by IndexedDB (via idb-keyval).
 * Strategy: stale-while-revalidate.
 *   - Returns the cached value immediately if present.
 *   - Kicks off a background refresh if the entry is older than `ttlMs`
 *     OR if no cached value exists yet (in which case we await the fetch).
 *   - Persists fresh values back.
 *
 * If the network is unavailable, the cached value (even when stale) is
 * returned — the goal is full offline usability.
 */

export interface CacheEntry<T> {
    data: T;
    ts: number;
}

export interface CachedFetchOpts {
    /** Time-to-live in ms before a refresh is attempted. Default 24h. */
    ttlMs?: number;
    /** Force a network call regardless of cache freshness. */
    forceRefresh?: boolean;
}

const DEFAULT_TTL = 1000 * 60 * 60 * 24; // 24h

const inflight = new Map<string, Promise<unknown>>();

const isFresh = (ts: number, ttlMs: number) => Date.now() - ts < ttlMs;

export async function readCache<T>(key: string): Promise<CacheEntry<T> | null> {
    try {
        const entry = await get<CacheEntry<T>>(`oc:${key}`);
        return entry ?? null;
    } catch {
        return null;
    }
}

export async function writeCache<T>(key: string, data: T): Promise<void> {
    try {
        await set(`oc:${key}`, { data, ts: Date.now() } as CacheEntry<T>);
    } catch {
        // IndexedDB can be unavailable (private mode / quota); fail silently.
    }
}

export async function clearCachePrefix(prefix: string): Promise<void> {
    try {
        const all = await keys();
        await Promise.all(
            all
                .filter(k => typeof k === "string" && (k as string).startsWith(`oc:${prefix}`))
                .map(k => del(k))
        );
    } catch {
        // ignore
    }
}

/**
 * Read-through cache. Returns cached data fast; refreshes in the background
 * when stale. If nothing is cached, awaits the fetcher.
 */
export async function cachedFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    opts: CachedFetchOpts = {}
): Promise<T> {
    const { ttlMs = DEFAULT_TTL, forceRefresh = false } = opts;
    const cached = await readCache<T>(key);

    const doFetch = (): Promise<T> => {
        const existing = inflight.get(key) as Promise<T> | undefined;
        if (existing) return existing;
        const p = (async () => {
            try {
                const fresh = await fetcher();
                if (fresh !== undefined && fresh !== null) {
                    await writeCache(key, fresh);
                }
                return fresh;
            } finally {
                inflight.delete(key);
            }
        })();
        inflight.set(key, p);
        return p;
    };

    // No cache → must wait for network.
    if (!cached) {
        try {
            return await doFetch();
        } catch (err) {
            // Network failed and nothing cached — rethrow so callers can fall back.
            throw err;
        }
    }

    // Cached + fresh + not forced → return cached, no work.
    if (!forceRefresh && isFresh(cached.ts, ttlMs)) {
        return cached.data;
    }

    // Cached but stale (or forced) → return cached now, refresh in background.
    doFetch().catch(() => {
        // Swallow background errors — user already has data.
    });

    return cached.data;
}

/** Force a refresh and wait for it (used by the cold-sync). */
export async function refreshCache<T>(key: string, fetcher: () => Promise<T>): Promise<T | null> {
    try {
        const fresh = await fetcher();
        if (fresh !== undefined && fresh !== null) {
            await writeCache(key, fresh);
        }
        return fresh ?? null;
    } catch {
        return null;
    }
}
