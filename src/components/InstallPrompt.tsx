import { useEffect, useState } from 'react';
import { Download, X, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Detect iOS Safari (which doesn't support beforeinstallprompt)
const isIOS = () => {
    if (typeof window === 'undefined') return false;
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
};

const isStandalone = () => {
    if (typeof window === 'undefined') return false;
    return (
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true
    );
};

const DISMISS_KEY = 'wp_install_dismissed_at';
const DISMISS_TTL = 1000 * 60 * 60 * 24 * 7; // 7 days

export const InstallPrompt = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [visible, setVisible] = useState(false);
    const [showIosHelp, setShowIosHelp] = useState(false);

    useEffect(() => {
        if (isStandalone()) return;

        // Respect recent dismissal
        const dismissed = localStorage.getItem(DISMISS_KEY);
        if (dismissed && Date.now() - Number(dismissed) < DISMISS_TTL) return;

        // iOS: no beforeinstallprompt — show manual hint after short delay
        if (isIOS()) {
            const t = setTimeout(() => setVisible(true), 4000);
            return () => clearTimeout(t);
        }

        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setVisible(true);
        };
        window.addEventListener('beforeinstallprompt', handler);

        const installedHandler = () => {
            setVisible(false);
            setDeferredPrompt(null);
        };
        window.addEventListener('appinstalled', installedHandler);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
            window.removeEventListener('appinstalled', installedHandler);
        };
    }, []);

    const handleInstall = async () => {
        if (isIOS()) {
            setShowIosHelp(true);
            return;
        }
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setVisible(false);
        }
        setDeferredPrompt(null);
    };

    const handleDismiss = () => {
        setVisible(false);
        setShowIosHelp(false);
        localStorage.setItem(DISMISS_KEY, String(Date.now()));
    };

    if (!visible) return null;

    return (
        <div
            className="fixed left-4 right-4 z-[60] bg-black/90 backdrop-blur-xl border border-white/15 rounded-2xl p-4 shadow-2xl animate-fade-in"
            style={{
                bottom: 'calc(env(safe-area-inset-bottom) + 96px)',
                maxWidth: '420px',
                marginLeft: 'auto',
                marginRight: 'auto',
            }}
            role="dialog"
            aria-label="Install WanderPass"
        >
            <button
                onClick={handleDismiss}
                aria-label="Dismiss"
                className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            >
                <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-3 pr-6">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                    <Download className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-display font-bold text-white text-base leading-tight">
                        Install WanderPass
                    </h3>
                    <p className="text-white/60 text-sm mt-0.5">
                        {showIosHelp
                            ? 'Tap the Share icon, then "Add to Home Screen".'
                            : 'Add to your home screen for a faster, app-like experience.'}
                    </p>

                    {showIosHelp ? (
                        <div className="mt-3 flex items-center gap-2 text-white/70 text-sm">
                            <Share className="w-4 h-4" />
                            <span>→ Add to Home Screen</span>
                        </div>
                    ) : (
                        <div className="mt-3 flex gap-2">
                            <Button
                                onClick={handleInstall}
                                size="sm"
                                className="bg-white text-black hover:bg-white/90 font-medium"
                            >
                                {isIOS() ? 'How to install' : 'Install'}
                            </Button>
                            <Button
                                onClick={handleDismiss}
                                size="sm"
                                variant="ghost"
                                className="text-white/60 hover:text-white hover:bg-white/10"
                            >
                                Not now
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
