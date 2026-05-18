import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { FlightLog } from "@/contexts/UserContext";

const TTL_MS = 1000 * 60 * 60 * 24; // 1 day

interface CacheEntry { at: number; hash: string; data: any }

function hashFlights(flights: FlightLog[]) {
    return `${flights.length}:${flights[0]?.at || 0}:${flights[flights.length - 1]?.at || 0}`;
}

function summarize(flights: FlightLog[]) {
    const topAirports: Record<string, number> = {};
    const topRoutes: Record<string, number> = {};
    const topAirlines: Record<string, number> = {};
    const aircraft: Record<string, number> = {};
    const yearCounts: Record<number, number> = {};
    let totalKm = 0;
    let longestLegKm = 0;
    let longestLegRoute = "";
    const countries = new Set<string>();
    for (const f of flights) {
        if (f.fromIata) topAirports[f.fromIata] = (topAirports[f.fromIata] || 0) + 1;
        if (f.toIata) topAirports[f.toIata] = (topAirports[f.toIata] || 0) + 1;
        if (f.fromIata && f.toIata) {
            const route = `${f.fromIata}-${f.toIata}`;
            topRoutes[route] = (topRoutes[route] || 0) + 1;
        }
        if (f.airline) topAirlines[f.airline] = (topAirlines[f.airline] || 0) + 1;
        if (f.aircraft) aircraft[f.aircraft] = (aircraft[f.aircraft] || 0) + 1;
        if (f.distanceKm) {
            totalKm += f.distanceKm;
            if (f.distanceKm > longestLegKm) {
                longestLegKm = f.distanceKm;
                longestLegRoute = `${f.fromIata || f.from}-${f.toIata || f.to}`;
            }
        }
        const y = new Date(f.at).getFullYear();
        yearCounts[y] = (yearCounts[y] || 0) + 1;
        if (f.from && f.from !== "XX") countries.add(f.from);
        if (f.to && f.to !== "XX") countries.add(f.to);
    }
    const pickTop = (m: Record<string, number>, n: number) =>
        Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => ({ k, v }));
    const years = Object.entries(yearCounts).map(([y, c]) => [Number(y), c] as [number, number]);
    const busiest = years.sort((a, b) => b[1] - a[1])[0];
    const sortedYears = years.map(([y]) => y).sort((a, b) => a - b);
    return {
        totalFlights: flights.length,
        countries: countries.size,
        totalKm: Math.round(totalKm),
        topAirports: pickTop(topAirports, 8),
        topRoutes: pickTop(topRoutes, 8),
        topAirlines: pickTop(topAirlines, 6),
        aircraft: pickTop(aircraft, 8),
        firstYear: sortedYears[0],
        lastYear: sortedYears[sortedYears.length - 1],
        busiestYear: busiest?.[0],
        busiestYearCount: busiest?.[1],
        longestLegKm: Math.round(longestLegKm),
        longestLegRoute,
    };
}

export function useFlightFactsAI(flights: FlightLog[]) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const stats = useMemo(() => (flights.length ? summarize(flights) : null), [flights]);
    const hash = useMemo(() => hashFlights(flights), [flights]);

    useEffect(() => {
        if (!flights.length) { setData(null); return; }
        const key = "ai:flight-facts";
        try {
            const raw = localStorage.getItem(key);
            if (raw) {
                const entry = JSON.parse(raw) as CacheEntry;
                if (entry.hash === hash && Date.now() - entry.at < TTL_MS) {
                    setData(entry.data);
                    return;
                }
            }
        } catch { /* ignore */ }

        let cancelled = false;
        setLoading(true);
        setError(null);
        supabase.functions.invoke("flight-facts-ai", { body: { stats } })
            .then(({ data: res, error: err }) => {
                if (cancelled) return;
                if (err) { setError(err.message); return; }
                if (!res?.ok) { setError(res?.error || "AI unavailable"); return; }
                try { localStorage.setItem(key, JSON.stringify({ at: Date.now(), hash, data: res.data } as CacheEntry)); } catch { /* ignore */ }
                setData(res.data);
            })
            .catch((e) => !cancelled && setError(String(e)))
            .finally(() => !cancelled && setLoading(false));

        return () => { cancelled = true; };
    }, [hash, flights.length, stats]);

    return { data, loading, error };
}
