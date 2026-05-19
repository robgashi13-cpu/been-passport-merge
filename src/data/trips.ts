export interface TripEntry {
    id: string;
    countryCode: string;
    countryName: string;
    cityName?: string;
    startDate: Date;
    endDate: Date;
    transportMode?: 'plane' | 'train' | 'car' | 'boat' | 'bus' | 'other';
    notes?: string;
    createdAt: Date;
}

export interface TripStatistics {
    totalDays: number;
    totalTrips: number;
    countriesVisited: number;
    longestTrip: {
        days: number;
        destination: string;
    };
    mostVisitedCountry: {
        name: string;
        days: number;
    };
    daysByCountry: Record<string, number>;
    daysByTransport: Record<string, number>;
}

// Calculate days between two dates or from a trip entry
export const calculateDays = (startOrTrip: Date | TripEntry, end?: Date): number => {
    let s: Date, e: Date;

    if (typeof startOrTrip === 'object' && 'startDate' in startOrTrip) {
        s = new Date(startOrTrip.startDate);
        e = new Date(startOrTrip.endDate);
    } else {
        s = new Date(startOrTrip as Date);
        e = new Date(end as Date);
    }

    // Normalize to midnight to ignore time differences
    s.setHours(0, 0, 0, 0);
    e.setHours(0, 0, 0, 0);

    // Calculate difference in milliseconds
    const diffTime = e.getTime() - s.getTime();

    // If same day, return 1
    if (diffTime === 0) return 1;

    // Otherwise, calculate days and add 1 to include both start and end
    const diffDays = Math.abs(diffTime) / (1000 * 60 * 60 * 24);
    return Math.floor(diffDays) + 1;
};

// Calculate total days from multiple trips
export const calculateTotalDays = (trips: TripEntry[]): number => {
    return trips.reduce((total, trip) => {
        return total + calculateDays(trip);
    }, 0);
};

// Calculate days per country (returns by countryCode for flag lookup)
export const calculateDaysByCountry = (trips: TripEntry[]): Record<string, number> => {
    const daysByCountry: Record<string, number> = {};

    trips.forEach(trip => {
        const days = calculateDays(trip);
        const code = trip.countryCode;

        if (daysByCountry[code]) {
            daysByCountry[code] += days;
        } else {
            daysByCountry[code] = days;
        }
    });

    return daysByCountry;
};

// Calculate statistics from trips
export const calculateTripStatistics = (trips: TripEntry[]): TripStatistics => {
    const totalDays = calculateTotalDays(trips);
    const daysByCountry = calculateDaysByCountry(trips);
    const uniqueCountries = new Set(trips.map(t => t.countryName)).size;

    // Find longest trip
    let longestTrip = { days: 0, destination: '' };
    trips.forEach(trip => {
        const days = calculateDays(trip);
        if (days > longestTrip.days) {
            longestTrip = {
                days,
                destination: trip.cityName || trip.countryName
            };
        }
    });

    // Find most visited country
    let mostVisitedCountry = { name: '', days: 0 };
    Object.entries(daysByCountry).forEach(([country, days]) => {
        if (days > mostVisitedCountry.days) {
            mostVisitedCountry = { name: country, days };
        }
    });

    // Days by transport mode
    const daysByTransport: Record<string, number> = {};
    trips.forEach(trip => {
        if (trip.transportMode) {
            const days = calculateDays(trip);
            if (daysByTransport[trip.transportMode]) {
                daysByTransport[trip.transportMode] += days;
            } else {
                daysByTransport[trip.transportMode] = days;
            }
        }
    });

    return {
        totalDays,
        totalTrips: trips.length,
        countriesVisited: uniqueCountries,
        longestTrip,
        mostVisitedCountry,
        daysByCountry,
        daysByTransport,
    };
};

// Find current active trips
export const getCurrentTrips = (trips: TripEntry[]): TripEntry[] => {
    const now = new Date();
    return trips.filter(trip =>
        trip.startDate <= now && trip.endDate >= now
    );
};

// Get trips for a specific month
export const getTripsForMonth = (trips: TripEntry[], year: number, month: number): TripEntry[] => {
    return trips.filter(trip => {
        const startDate = new Date(trip.startDate);
        const endDate = new Date(trip.endDate);
        const monthStart = new Date(year, month, 1);
        const monthEnd = new Date(year, month + 1, 0);

        // Trip overlaps with month if start is before month end and end is after month start
        return startDate <= monthEnd && endDate >= monthStart;
    });
};

/**
 * Derive trip entries from a chronological flight history.
 * Each "stay" in a destination country runs from the arrival flight (`to`)
 * until the NEXT flight whose `from` is the same country. If there is no
 * outbound flight, the stay runs until today (still travelling).
 * Domestic flights (from === to) are skipped for stay calculation.
 */
export interface FlightLogLike {
    from: string;
    to: string;
    at: number;
    flightNo?: string;
    airline?: string;
}

export const deriveTripsFromFlights = (
    flights: FlightLogLike[],
    homeCountry?: string,
): TripEntry[] => {
    if (!flights?.length) return [];
    const sorted = [...flights]
        .filter(f => f.to && f.to !== 'XX')
        .sort((a, b) => a.at - b.at);

    const derived: TripEntry[] = [];
    const now = Date.now();

    for (let i = 0; i < sorted.length; i++) {
        const arrival = sorted[i];
        // Skip if this arrival is back to home country (treat as end of previous trip only)
        if (homeCountry && arrival.to === homeCountry) continue;

        // Find next flight departing FROM this country
        let departureAt: number | null = null;
        for (let j = i + 1; j < sorted.length; j++) {
            if (sorted[j].from === arrival.to) {
                departureAt = sorted[j].at;
                break;
            }
        }
        const endAt = departureAt ?? Math.min(now, arrival.at + 30 * 86400_000);
        const start = new Date(arrival.at);
        const end = new Date(endAt);
        if (end.getTime() < start.getTime()) continue;

        derived.push({
            id: `flight-derived-${arrival.at}-${arrival.to}`,
            countryCode: arrival.to,
            countryName: arrival.to,
            startDate: start,
            endDate: end,
            transportMode: 'plane',
            createdAt: new Date(arrival.at),
        });
    }
    return derived;
};

/** Merge manual trips with flight-derived trips, removing dupes by overlap. */
export const mergeTrips = (manual: TripEntry[], derived: TripEntry[]): TripEntry[] => {
    const out = [...manual];
    for (const d of derived) {
        const dup = manual.some(m =>
            m.countryCode === d.countryCode &&
            Math.abs(new Date(m.startDate).getTime() - d.startDate.getTime()) < 2 * 86400_000,
        );
        if (!dup) out.push(d);
    }
    return out;
};
