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

    const diffTime = Math.abs(e.getTime() - s.getTime());
    return Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1; // Round is safer for normalized dates
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
