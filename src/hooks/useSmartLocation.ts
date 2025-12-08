import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getCountryByCode } from '@/data/countries';
import { useUser } from '@/contexts/UserContext';
import { TripEntry } from '@/data/trips';
import { v4 as uuidv4 } from 'uuid';

interface LocationState {
    countryCode: string | null;
    countryName: string | null;
    city: string | null;
    latitude?: number | null;
    longitude?: number | null;
    loading: boolean;
    error: string | null;
}

export const useSmartLocation = () => {
    const { user, trips, addTrip, updateTrips } = useUser();
    const [location, setLocation] = useState<LocationState>({
        countryCode: null,
        countryName: null,
        city: null,
        loading: true,
        error: null
    });

    const [hasCheckedToday, setHasCheckedToday] = useState(false);

    // Initial check - only once per session
    useEffect(() => {
        // Check if we already have cached location for this session
        const cachedLocation = sessionStorage.getItem('userLocation');
        if (cachedLocation) {
            try {
                const parsed = JSON.parse(cachedLocation);
                setLocation(parsed);
                return; // Use cached, don't check again
            } catch (e) {
                console.error('Failed to parse cached location', e);
            }
        }
        // No cache or invalid cache - check location
        checkLocation();
    }, []);

    // Check location
    const checkLocation = () => {
        if (!navigator.geolocation) {
            setLocation(prev => ({ ...prev, loading: false, error: "Geolocation not supported" }));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=3&addressdetails=1`,
                        { headers: { 'User-Agent': 'WanderPass/1.0' } }
                    );

                    if (!response.ok) throw new Error('Geocoding failed');

                    const data = await response.json();
                    const code = data.address?.country_code?.toUpperCase();
                    const name = data.address?.country;
                    const city = data.address?.city || data.address?.town || data.address?.village || data.address?.state;

                    if (code && name) {
                        const locationData = {
                            countryCode: code,
                            countryName: name,
                            city: city || null,
                            latitude,
                            longitude,
                            loading: false,
                            error: null
                        };
                        setLocation(locationData);

                        // Cache in sessionStorage for this session
                        sessionStorage.setItem('userLocation', JSON.stringify(locationData));

                        // Handle Auto-Log Logic
                        handleAutoLog(code, name, city);
                    }
                } catch (err) {
                    console.error(err);
                    setLocation(prev => ({ ...prev, loading: false, error: "Failed to detect location" }));
                }
            },
            (err) => {
                setLocation(prev => ({ ...prev, loading: false, error: err.message }));
            }
        );
    };

    // Auto-Log Logic (Smart Calendar)
    const handleAutoLog = (code: string, name: string, city: string | null) => {
        if (hasCheckedToday) return;
        setHasCheckedToday(true); // Prevent multi-log on re-renders

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Check if there is already a trip covering today in this country
        const activeTrip = trips.find(t => {
            const start = new Date(t.startDate);
            const end = new Date(t.endDate);
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            return t.countryCode === code && today >= start && today <= end;
        });

        if (activeTrip) {
            console.log("Already active trip for today:", activeTrip.countryName);
            return;
        }

        // Check if the MOST RECENT trip was to this country and ended yesterday (Streak Continuation)
        // Sort trips by end date descending
        const sortedTrips = [...trips].sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());
        const lastTrip = sortedTrips[0];

        if (lastTrip && lastTrip.countryCode === code) {
            const lastEnd = new Date(lastTrip.endDate);
            lastEnd.setHours(0, 0, 0, 0);
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            // If last trip ended yesterday (or today, covered above), extend it!
            if (lastEnd.getTime() === yesterday.getTime() || lastEnd.getTime() === today.getTime()) {
                console.log("Extending trip streak for:", name);
                const updatedTrip = { ...lastTrip, endDate: new Date() }; // Extend to now

                // Update global trips
                const others = trips.filter(t => t.id !== lastTrip.id);
                updateTrips([...others, updatedTrip]);
                toast.success(`Extended your trip in ${name}! 📍`);
                return;
            }
        }

        // Otherwise, start a NEW trip if we are not home? 
        // Or just log it. For now, we auto-log a new single day trip.
        // But maybe we only auto-log if user confirmed? 
        // "add that country based on location on the date... check every day on background"
        // Implicitly implies auto-add.

        console.log("Starting new auto-trip for:", name);
        const newTrip: TripEntry = {
            id: uuidv4(),
            countryCode: code,
            countryName: name,
            cityName: city || undefined,
            startDate: new Date(),
            endDate: new Date(), // Single day initially
            transportMode: 'plane', // Default
            notes: 'Auto-detected',
            createdAt: new Date()
        };
        addTrip(newTrip);
        toast.success(`Welcome to ${name}! Trip started. 🌍`);
    };

    return { location, checkLocation };
};
