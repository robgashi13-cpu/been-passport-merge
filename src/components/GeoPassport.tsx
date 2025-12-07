import { useEffect, useState } from 'react';
import { MapPin, Check, X, Bell } from 'lucide-react';
import { createPortal } from 'react-dom';
import { getCountryByCode, countries } from '@/data/countries';
import { useUser } from '@/contexts/UserContext';
import { toast } from 'sonner';
import { requestNotificationPermission } from '@/hooks/useLocationNotifications';

export const GeoPassport = () => {
    const { user, updatePassport } = useUser();
    const [detectedCountryCode, setDetectedCountryCode] = useState<string | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);

    useEffect(() => {
        // Only check if user hasn't set a passport or we want to offer updates
        // For now, let's just run it once on mount if we can
        // But we shouldn't spam. Maybe user triggered?
        // User request: "add location request from app so when user allow location the app checks what country is user and make the your passport that location country"

        // We will trigger this automatically on first load ONLY if we haven't asked before (could store in local storage)
        // For this demo, let's trigger it if the user is logged in.

        if (user) {
            checkLocation();
        }
    }, [user?.passportCode]); // Re-run if passport changes? No.

    const checkLocation = () => {
        if (!navigator.geolocation) return;

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                // Reverse geocoding (OpenStreetMap Nominatim free API)
                // Note: Need to throttle this or use carefully.
                try {
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
                    );
                    const data = await response.json();

                    if (data && data.address && data.address.country_code) {
                        const code = data.address.country_code.toUpperCase();

                        // If detected country matches current passport, do nothing
                        if (code !== user?.passportCode) {
                            setDetectedCountryCode(code);
                            setShowPrompt(true);
                        }
                    }
                } catch (error) {
                    console.error("GeoPassport Error:", error);
                }
            },
            (error) => {
                console.log("Location access denied or error:", error);
            }
        );
    };

    const handleConfirm = async () => {
        if (!detectedCountryCode) return;
        setIsLoading(true);
        try {
            await updatePassport(detectedCountryCode);
            toast.success(`Passport updated to ${getCountryByCode(detectedCountryCode)?.name}`);
            setShowPrompt(false);

            // Ask for notification permission after passport is set
            if ('Notification' in window && Notification.permission === 'default') {
                setShowNotificationPrompt(true);
            }
        } catch (e) {
            toast.error("Failed to update passport");
        } finally {
            setIsLoading(false);
        }
    };

    const handleNotificationPermission = async () => {
        const granted = await requestNotificationPermission();
        if (granted) {
            toast.success("Notifications enabled! We'll notify you when you travel to a new country.");
        } else {
            toast.info("Notifications disabled. You can enable them later in settings.");
        }
        setShowNotificationPrompt(false);
    };

    // Notification permission prompt
    if (showNotificationPrompt) {
        return createPortal(
            <div className="fixed bottom-4 right-4 z-[9999] animate-slide-in-up">
                <div className="bg-luxury-charcoal/90 backdrop-blur-md border border-blue-500/30 p-4 rounded-xl shadow-2xl max-w-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center flex-shrink-0 text-blue-400">
                        <Bell className="w-6 h-6" />
                    </div>
                    <div className="flex-grow">
                        <h4 className="font-bold text-white text-sm">Enable Travel Notifications?</h4>
                        <p className="text-xs text-white/60">
                            Get notified when you arrive in a new country!
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowNotificationPrompt(false)}
                            className="p-2 hover:bg-white/10 rounded-full text-white/40 hover:text-white transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                        <button
                            onClick={handleNotificationPermission}
                            className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-400 transition-colors shadow-lg shadow-blue-500/20"
                        >
                            <Bell className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>,
            document.body
        );
    }

    if (!showPrompt || !detectedCountryCode) return null;

    const country = getCountryByCode(detectedCountryCode);
    if (!country) return null;

    return createPortal(
        <div className="fixed bottom-4 right-4 z-[9999] animate-slide-in-up">
            <div className="bg-luxury-charcoal/90 backdrop-blur-md border border-luxury-gold/30 p-4 rounded-xl shadow-2xl max-w-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-luxury-gold/10 rounded-full flex items-center justify-center flex-shrink-0 text-luxury-gold">
                    <MapPin className="w-6 h-6" />
                </div>
                <div className="flex-grow">
                    <h4 className="font-bold text-white text-sm">Update Passport?</h4>
                    <p className="text-xs text-white/60">
                        It looks like you are in {country.name} {country.flagEmoji}. Set as your passport?
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowPrompt(false)}
                        className="p-2 hover:bg-white/10 rounded-full text-white/40 hover:text-white transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isLoading}
                        className="p-2 bg-luxury-gold text-black rounded-full hover:bg-luxury-gold-light transition-colors shadow-lg shadow-luxury-gold/20"
                    >
                        <Check className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
