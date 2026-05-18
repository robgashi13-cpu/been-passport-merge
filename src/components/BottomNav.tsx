import { House, Earth, Plane, BookMarked } from 'lucide-react';

interface BottomNavProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

export const BottomNav = ({ activeTab, setActiveTab }: BottomNavProps) => {
    const navItems = [
        { id: 'dashboard', label: 'Home', icon: House },
        { id: 'map', label: 'Map', icon: Earth },
        { id: 'calendar', label: 'Trips', icon: Plane },
        { id: 'passport', label: 'Passport', icon: BookMarked },
    ];

    return (
        <div
            className="fixed bottom-0 left-0 right-0 z-[100] px-3 pt-3 pointer-events-none"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 10px)' }}
        >
            <nav
                className="pointer-events-auto mx-auto flex items-center justify-around gap-1
                           w-[min(420px,calc(100%-1rem))] px-2 py-2
                           rounded-[28px] border border-white/10
                           bg-[hsl(var(--card)/0.55)] backdrop-blur-2xl
                           shadow-[0_12px_40px_-8px_rgba(0,0,0,0.7),inset_0_1px_0_0_rgba(255,255,255,0.08)]"
                aria-label="Primary"
            >
                {navItems.map((item) => {
                    const isActive = activeTab === item.id;
                    const Icon = item.icon;
                    return (
                        <button
                            key={item.id}
                            onClick={() => {
                                setActiveTab(item.id);
                                if (window.navigator?.vibrate) window.navigator.vibrate(6);
                            }}
                            aria-label={item.label}
                            aria-current={isActive ? 'page' : undefined}
                            className="relative flex-1 flex flex-col items-center justify-center
                                       h-12 rounded-2xl transition-transform duration-300"
                        >
                            {/* Active liquid pill */}
                            {isActive && (
                                <span
                                    className="absolute inset-0 rounded-2xl
                                               bg-gradient-to-br from-[hsl(var(--gold)/0.25)] to-[hsl(var(--gold)/0.05)]
                                               border border-[hsl(var(--gold)/0.4)]
                                               shadow-[0_0_24px_-6px_hsl(var(--gold)/0.6),inset_0_1px_0_0_rgba(255,255,255,0.12)]
                                               animate-fade-in"
                                />
                            )}

                            <span className="relative flex flex-col items-center gap-0.5">
                                <Icon
                                    className={`w-[22px] h-[22px] transition-all duration-300 ${
                                        isActive
                                            ? 'text-[hsl(var(--gold))] drop-shadow-[0_0_6px_hsl(var(--gold)/0.6)]'
                                            : 'text-white/65'
                                    }`}
                                    strokeWidth={isActive ? 2.4 : 2}
                                />
                                <span
                                    className={`text-[10px] font-semibold tracking-wide transition-colors ${
                                        isActive ? 'text-[hsl(var(--gold))]' : 'text-white/55'
                                    }`}
                                >
                                    {item.label}
                                </span>
                            </span>
                        </button>
                    );
                })}
            </nav>
        </div>
    );
};
