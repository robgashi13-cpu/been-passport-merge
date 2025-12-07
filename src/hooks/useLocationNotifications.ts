import { useEffect, useRef, useState } from 'react';
import { getCountryByCode } from '@/data/countries';

// Check if the browser supports notifications
const isNotificationSupported = () => {
    return 'Notification' in window;
};

// Request notification permission
export const requestNotificationPermission = async (): Promise<boolean> => {
    if (!isNotificationSupported()) {
        console.log('Notifications not supported');
        return false;
    }

    if (Notification.permission === 'granted') {
        return true;
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }

    return false;
};

// Send a notification
const sendNotification = (title: string, body: string, icon?: string) => {
    if (!isNotificationSupported() || Notification.permission !== 'granted') {
        return;
    }

    const notification = new Notification(title, {
        body,
        icon: icon || '/logo.png',
        badge: '/logo.png',
        tag: 'location-change',
    });

    // Auto-close after 5 seconds
    setTimeout(() => notification.close(), 5000);
};

// Hook to track country changes and send notifications
export const useLocationNotifications = (countryCode: string | null, countryName: string | null) => {
    const previousCountryRef = useRef<string | null>(null);
    const [hasPermission, setHasPermission] = useState<boolean>(false);
    const [isFirstLoad, setIsFirstLoad] = useState(true);

    // Check permission status on mount
    useEffect(() => {
        if (isNotificationSupported()) {
            setHasPermission(Notification.permission === 'granted');
        }
    }, []);

    // Track country changes
    useEffect(() => {
        if (!countryCode) return;

        // Skip first load to avoid notification when app opens
        if (isFirstLoad) {
            previousCountryRef.current = countryCode;
            setIsFirstLoad(false);
            return;
        }

        // If country changed
        if (previousCountryRef.current && previousCountryRef.current !== countryCode) {
            const country = getCountryByCode(countryCode);

            if (country && hasPermission) {
                sendNotification(
                    `Welcome to ${country.name}! ${country.flagEmoji}`,
                    `You've arrived in a new country. ${country.continent}`,
                    '/logo.png'
                );
            }
        }

        previousCountryRef.current = countryCode;
    }, [countryCode, hasPermission, isFirstLoad]);

    // Function to request permission
    const requestPermission = async () => {
        const granted = await requestNotificationPermission();
        setHasPermission(granted);
        return granted;
    };

    return {
        hasPermission,
        requestPermission,
        isSupported: isNotificationSupported(),
    };
};
