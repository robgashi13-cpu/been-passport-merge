import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AISection = "overview" | "cities" | "visa" | "transport" | "climate" | "insights";

// Permanent cache — once an AI insight is generated for a country/section,
// keep it forever to avoid burning credits on repeat views. Use the refresh
// button to force a re-fetch.
const TTL_MS = Number.MAX_SAFE_INTEGER;

interface CacheEntry { at: number; data: any }

function cacheKey(code: string, section: AISection, passport?: string) {
    return `ai:country:${code}:${section}${section === "visa" && passport ? `:${passport}` : ""}`;
}

function readCache(key: string): any | null {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        const entry = JSON.parse(raw) as CacheEntry;
        if (Date.now() - entry.at > TTL_MS) return null;
        return entry.data;
    } catch { return null; }
}
function writeCache(key: string, data: any) {
    try { localStorage.setItem(key, JSON.stringify({ at: Date.now(), data })); } catch { /* ignore */ }
}

export function useCountryAI(opts: {
    countryCode: string;
    countryName: string;
    section: AISection;
    passportName?: string;
    enabled: boolean;
}) {
    const { countryCode, countryName, section, passportName, enabled } = opts;
    const [data, setData] = useState<any | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!enabled || !countryCode || !countryName) return;
        const key = cacheKey(countryCode, section, passportName);
        const cached = readCache(key);
        if (cached) { setData(cached); setError(null); return; }

        let cancelled = false;
        setData(null);
        setLoading(true);
        setError(null);

        supabase.functions
            .invoke("country-tab-ai", { body: { countryCode, countryName, section, passportName } })
            .then(({ data: res, error: err }) => {
                if (cancelled) return;
                if (err) { setError(err.message || "AI request failed"); return; }
                if (!res?.ok) { setError(res?.error || "AI unavailable"); return; }
                writeCache(key, res.data);
                setData(res.data);
            })
            .catch((e) => { if (!cancelled) setError(String(e)); })
            .finally(() => { if (!cancelled) setLoading(false); });

        return () => { cancelled = true; };
    }, [enabled, countryCode, countryName, section, passportName]);

    const refresh = () => {
        const key = cacheKey(countryCode, section, passportName);
        try { localStorage.removeItem(key); } catch { /* ignore */ }
        setData(null);
        setLoading(true);
        setError(null);
        supabase.functions
            .invoke("country-tab-ai", { body: { countryCode, countryName, section, passportName } })
            .then(({ data: res, error: err }) => {
                if (err) { setError(err.message || "AI request failed"); return; }
                if (!res?.ok) { setError(res?.error || "AI unavailable"); return; }
                writeCache(key, res.data);
                setData(res.data);
            })
            .catch((e) => setError(String(e)))
            .finally(() => setLoading(false));
    };

    return { data, loading, error, refresh };
}
