import { countries, getCountryByCode } from './countries';
import { TripEntry } from './trips';

type UnknownFlightLog = Record<string, any>;

const airportCountryByCode: Record<string, string> = {
    PRN: 'XK',
    VIE: 'AT',
    ICN: 'KR',
    GMP: 'KR',
    SEL: 'KR',
    JFK: 'US',
    LAX: 'US',
    EWR: 'US',
    LHR: 'GB',
    LGW: 'GB',
    CDG: 'FR',
    ORY: 'FR',
    FRA: 'DE',
    MUC: 'DE',
    ZRH: 'CH',
    IST: 'TR',
    SAW: 'TR',
    DXB: 'AE',
    DOH: 'QA',
    SIN: 'SG',
    HND: 'JP',
    NRT: 'JP',
    BKK: 'TH',
    FCO: 'IT',
    MXP: 'IT',
    MAD: 'ES',
    BCN: 'ES',
    AMS: 'NL',
};

const getFlightDate = (flight: UnknownFlightLog): Date | null => {
    const value = flight.departureDate || flight.departureTime || flight.date || flight.startDate || flight.scheduledTime;
    if (!value) return null;

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
};

const getAirportCode = (flight: UnknownFlightLog, keys: string[]): string | null => {
    for (const key of keys) {
        const value = flight[key];
        if (typeof value === 'string' && value.trim()) {
            return value.trim().slice(0, 3).toUpperCase();
        }
    }
    return null;
};

const daysBetween = (start: Date, end: Date): number => {
    const s = new Date(start);
    const e = new Date(end);
    s.setHours(0, 0, 0, 0);
    e.setHours(0, 0, 0, 0);
    return Math.abs(e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24);
};

export const parseStoredFlightLogs = (): UnknownFlightLog[] => {
    if (typeof window === 'undefined') return [];

    const keys = ['wanderpass_flight_logs', 'flightLogs', 'flight_logs', 'flights'];
    for (const key of keys) {
        try {
            const raw = window.localStorage.getItem(key);
            if (!raw) continue;
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) return parsed;
            if (Array.isArray(parsed?.flights)) return parsed.flights;
            if (Array.isArray(parsed?.logs)) return parsed.logs;
        } catch (error) {
            console.warn(`Failed to parse ${key}`, error);
        }
    }

    return [];
};

export const deriveTripsFromFlightLogs = (flightLogs: UnknownFlightLog[]): TripEntry[] => {
    const segments = flightLogs
        .map(flight => {
            const origin = getAirportCode(flight, ['originCode', 'origin', 'fromCode', 'from', 'departureAirport']);
            const destination = getAirportCode(flight, ['destinationCode', 'destination', 'toCode', 'to', 'arrivalAirport']);
            const departureDate = getFlightDate(flight);
            return origin && destination && departureDate
                ? { origin, destination, departureDate }
                : null;
        })
        .filter(Boolean)
        .sort((a, b) => a!.departureDate.getTime() - b!.departureDate.getTime()) as {
            origin: string;
            destination: string;
            departureDate: Date;
        }[];

    const trips: TripEntry[] = [];

    for (let index = 0; index < segments.length; index++) {
        const arrival = segments[index];
        const destinationCountryCode = airportCountryByCode[arrival.destination];
        const originCountryCode = airportCountryByCode[arrival.origin];
        if (!destinationCountryCode || destinationCountryCode === originCountryCode) continue;

        const departure = segments
            .slice(index + 1)
            .find(segment => airportCountryByCode[segment.origin] === destinationCountryCode);

        if (!departure) continue;

        const stayLength = daysBetween(arrival.departureDate, departure.departureDate);
        if (stayLength < 1) continue;

        const country = getCountryByCode(destinationCountryCode) || countries.find(c => c.code === destinationCountryCode);
        if (!country) continue;

        trips.push({
            id: `flight-${arrival.destination}-${departure.origin}-${arrival.departureDate.toISOString()}-${departure.departureDate.toISOString()}`,
            countryCode: country.code,
            countryName: country.name,
            startDate: arrival.departureDate,
            endDate: departure.departureDate,
            transportMode: 'plane',
            notes: `Derived from flight logs: ${arrival.origin}-${arrival.destination}, return from ${departure.origin}`,
            createdAt: new Date(),
        });
    }

    return trips;
};
