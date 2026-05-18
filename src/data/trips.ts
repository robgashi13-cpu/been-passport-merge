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

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export const normalizeTripDate = (value: Date | string): Date => {
    const date = value instanceof Date ? new Date(value) : new Date(value);
    date.setHours(0, 0, 0, 0);
    return date;
};

const dateKey = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const getTripDateKeys = (trip: TripEntry): string[] => {
    const start = normalizeTripDate(trip.startDate);
    const end = normalizeTripDate(trip.endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return [];

    const rangeStart = start <= end ? start : end;
    const rangeEnd = start <= end ? end : start;
    const keys: string[] = [];

    for (let cursor = new Date(rangeStart); cursor <= rangeEnd; cursor.setDate(cursor.getDate() + 1)) {
        keys.push(dateKey(cursor));
    }

    return keys;
};

// Calculate days between two dates or from a trip entry
export const calculateDays = (startOrTrip: Date | TripEntry, end?: Date): number => {
    let s: Date, e: Date;

    if (typeof startOrTrip === 'object' && 'startDate' in startOrTrip) {
        s = normalizeTripDate(startOrTrip.startDate);
        e = normalizeTripDate(startOrTrip.endDate);
    } else {
        s = normalizeTripDate(startOrTrip as Date);
        e = normalizeTripDate(end as Date);
    }

    if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return 0;

    // Calculate difference in milliseconds
    const diffTime = Math.abs(e.getTime() - s.getTime());

    // If same day, return 1
    if (diffTime === 0) return 1;

    // Otherwise, calculate days and add 1 to include both start and end
    const diffDays = diffTime / MS_PER_DAY;
    return Math.floor(diffDays) + 1;
};

// Calculate total days from multiple trips
export const calculateTotalDays = (trips: TripEntry[]): number => {
    const uniqueTravelDays = new Set<string>();
    trips.forEach(trip => {
        getTripDateKeys(trip).forEach(key => uniqueTravelDays.add(`${trip.countryCode}:${key}`));
    });
    return uniqueTravelDays.size;
};

// Calculate days per country (returns by countryCode for flag lookup)
export const calculateDaysByCountry = (trips: TripEntry[]): Record<string, number> => {
    const daysByCountry: Record<string, number> = {};

    const daysByCountrySet: Record<string, Set<string>> = {};

    trips.forEach(trip => {
        const code = trip.countryCode;
        if (!daysByCountrySet[code]) daysByCountrySet[code] = new Set<string>();
        getTripDateKeys(trip).forEach(key => daysByCountrySet[code].add(key));
    });

    Object.entries(daysByCountrySet).forEach(([code, days]) => {
        daysByCountry[code] = days.size;
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
    const now = normalizeTripDate(new Date());
    return trips.filter(trip => {
        const start = normalizeTripDate(trip.startDate);
        const end = normalizeTripDate(trip.endDate);
        return start <= now && end >= now;
    });
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
