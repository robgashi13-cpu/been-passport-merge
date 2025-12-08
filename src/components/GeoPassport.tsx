import { useEffect, useState } from 'react';
import { MapPin, Check, X, Bell } from 'lucide-react';
import { createPortal } from 'react-dom';
import { getCountryByCode } from '@/data/countries';
import { useUser } from '@/contexts/UserContext';
import { toast } from 'sonner';
import { useTravelNotifications } from '@/hooks/useTravelNotifications';

export const GeoPassport = () => {
    const { user, updatePassport } = useUser();
    const [detectedCountryCode, setDetectedCountryCode] = useState<string | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Use our new hook
    const { hasPermission, requestPermissions } = useTravelNotifications();
    const [showEnablePrompt, setShowEnablePrompt] = useState(false);

    useEffect(() => {
        // If user is logged in and we haven't enabled permissions yet
        if (user) {
            checkSimpleLocation();

            // If we don't have permission yet, show the "Enable Travel Notifications" prompt once
            if (!hasPermission && !localStorage.getItem('dismissed_notification_prompt')) {
                const timer = setTimeout(() => setShowEnablePrompt(true), 3000);
                return () => clearTimeout(timer);
            }
        }
    }, [user, hasPermission]);

    const checkSimpleLocation = () => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                // Reverse geocoding for passport update logic
                try {
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
                    );
                    const data = await response.json();

                    if (data && data.address && data.address.country_code) {
                        const code = data.address.country_code.toUpperCase();
                        if (code !== user?.passportCode) {
                            setDetectedCountryCode(code);
                            setShowPrompt(true);
                        }
                    }
                } catch (error) { console.error("GeoPassport Error:", error); }
            },
            (error) => console.log("Location check error", error)
        );
    };

    const handleConfirmPassport = async () => {
        if (!detectedCountryCode) return;
        setIsLoading(true);
        try {
            await updatePassport(detectedCountryCode);
            toast.success(`Passport updated to ${getCountryByCode(detectedCountryCode)?.name}`);
            setShowPrompt(false);
        } catch (e) {
            toast.error("Failed to update passport");
        } finally {
            setIsLoading(false);
        }
    };

    const handleEnableNotifications = async () => {
        const granted = await requestPermissions();
        if (granted) {
            toast.success("Travel Mode Activated! We'll welcome you when you cross borders.");
        } else {
            toast.info("Permissions denied.");
        }
        setShowEnablePrompt(false);
    };

    const dismissPrompt = () => {
        setShowEnablePrompt(false);
        localStorage.setItem('dismissed_notification_prompt', 'true');
    };

    const renderNotificationPrompt = () => {
        if (!showEnablePrompt) return null;
        return createPortal(
            <div className="fixed bottom-4 left-4 z-[9999] animate-slide-in-up">
                <div className="bg-luxury-charcoal/90 backdrop-blur-md border border-blue-500/30 p-4 rounded-xl shadow-2xl max-w-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center flex-shrink-0 text-blue-400">
                        <Bell className="w-6 h-6" />
                    </div>
                    <div className="flex-grow">
                        <h4 className="font-bold text-white text-sm">Enable Travel Notifications?</h4>
                        <p className="text-xs text-white/60">
                            Get "Welcome to [Country]" alerts automatically!
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={dismissPrompt}
                            className="p-2 hover:bg-white/10 rounded-full text-white/60 hover:text-white transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                        <button
                            onClick={handleEnableNotifications}
                            className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-400 transition-colors shadow-lg shadow-blue-500/20"
                        >
                            <Check className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>,
            document.body
        );
    };

    const renderPassportPrompt = () => {
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
                            className="p-2 hover:bg-white/10 rounded-full text-white/60 hover:text-white transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                        <button
                            onClick={handleConfirmPassport}
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

    return (
        <>
            {renderNotificationPrompt()}
            {renderPassportPrompt()}
        </>
    );
};
