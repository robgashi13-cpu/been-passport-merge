import { useEffect, useState, useRef } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { LocalNotifications } from '@capacitor/local-notifications';
import { getCountryByCode } from '@/data/countries';
import { toast } from 'sonner';

export const useTravelNotifications = () => {
    const [hasPermission, setHasPermission] = useState(false);
    const lastCountryRef = useRef<string | null>(localStorage.getItem('last_detected_country'));
    const isWatching = useRef(false);

    useEffect(() => {
        checkPermissions();
    }, []);

    const checkPermissions = async () => {
        try {
            const geoStatus = await Geolocation.checkPermissions();
            const notifStatus = await LocalNotifications.checkPermissions();

            if (geoStatus.location === 'granted' && notifStatus.display === 'granted') {
                setHasPermission(true);
                startWatching();
            }
        } catch (e) {
            console.error("Error checking permissions", e);
        }
    };

    const requestPermissions = async () => {
        try {
            const geoReq = await Geolocation.requestPermissions();
            const notifReq = await LocalNotifications.requestPermissions();

            if (geoReq.location === 'granted' && notifReq.display === 'granted') {
                setHasPermission(true);
                startWatching();
                return true;
            }
            return false;
        } catch (e) {
            console.error("Error requesting permissions", e);
            return false;
        }
    };

    const startWatching = () => {
        if (isWatching.current) return;
        isWatching.current = true;

        // Using watchPosition for continuous updates (while app is open/foreground)
        Geolocation.watchPosition({ enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }, (position, err) => {
            if (position) {
                checkCountry(position.coords.latitude, position.coords.longitude);
            }
        });
    };

    const checkCountry = async (lat: number, lon: number) => {
        try {
            // Using a simple throttle implicitly via effect or explicit time check if needed
            // For now, rely on API speed as throttle. Ideally use a dedicated geocoding service or offline cache in real app.

            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
            );
            const data = await response.json();

            if (data && data.address && data.address.country_code) {
                const currentCountryCode = data.address.country_code.toUpperCase();
                const lastCountryCode = lastCountryRef.current;

                if (currentCountryCode !== lastCountryCode) {
                    // Country Changed!
                    const country = getCountryByCode(currentCountryCode);
                    if (country) {
                        sendWelcomeNotification(country.name, country.flagEmoji);
                        // Update ref and storage
                        lastCountryRef.current = currentCountryCode;
                        localStorage.setItem('last_detected_country', currentCountryCode);
                    }
                }
            }
        } catch (error) {
            console.error("Geocoding error", error);
        }
    };

    const sendWelcomeNotification = async (countryName: string, flag: string) => {
        try {
            await LocalNotifications.schedule({
                notifications: [
                    {
                        title: "Welcome to " + countryName + "! " + flag,
                        body: "Don't forget to update your travel log!",
                        id: new Date().getTime(),
                        schedule: { at: new Date(Date.now() + 1000) }, // 1 sec from now
                        sound: undefined,
                        attachments: undefined,
                        actionTypeId: "",
                        extra: null
                    }
                ]
            });
            toast.success(`Welcome to ${countryName}! ${flag}`);
        } catch (e) {
            console.error("Notification Error", e);
            // Fallback to toast if notifications fail (e.g. web)
            toast.success(`Welcome to ${countryName}! ${flag}`);
        }
    };

    return {
        hasPermission,
        requestPermissions
    };
};
