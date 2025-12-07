import { LayoutDashboard, Globe2, CalendarDays, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface BottomNavProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

export const BottomNav = ({ activeTab, setActiveTab }: BottomNavProps) => {
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

    // Hide on scroll down, show on scroll up (optional liquid feel)
    useEffect(() => {
        const controlNavbar = () => {
            if (typeof window !== 'undefined') {
                if (window.scrollY > lastScrollY && window.scrollY > 100) {
                    setIsVisible(false);
                } else {
                    setIsVisible(true);
                }
                setLastScrollY(window.scrollY);
            }
        };

        window.addEventListener('scroll', controlNavbar);
        return () => window.removeEventListener('scroll', controlNavbar);
    }, [lastScrollY]);

    const navItems = [
        { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
        { id: 'map', label: 'Map', icon: Globe2 },
        { id: 'calendar', label: 'Trips', icon: CalendarDays },
        { id: 'passport', label: 'Passport', icon: CreditCard },
    ];

    return (
        <div className={cn(
            "fixed bottom-0 left-0 right-0 z-50 p-4 pb-[env(safe-area-inset-bottom)] transition-transform duration-300 pointer-events-none",
            isVisible ? "translate-y-0" : "translate-y-full"
        )}>
            {/* Floating Glass Bar */}
            <nav className="pointer-events-auto max-w-md mx-auto bg-black/60 backdrop-blur-3xl border border-white/15 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden ring-1 ring-white/5">
                <ul className="flex items-center justify-between px-2 py-2">
                    {navItems.map((item) => {
                        const isActive = activeTab === item.id;
                        return (
                            <li key={item.id} className="relative flex-1">
                                <button
                                    onClick={() => {
                                        setActiveTab(item.id);
                                        // Haptic feedback
                                        if (navigator.vibrate) navigator.vibrate(10);
                                    }}
                                    className={cn(
                                        "relative w-full flex flex-col items-center justify-center gap-1 py-3 px-1 transition-all duration-300 ease-spring",
                                        isActive ? "text-white" : "text-white/50 hover:text-white/80"
                                    )}
                                >
                                    {/* Liquid Active Indicator Background */}
                                    {isActive && (
                                        <div className="absolute inset-0 bg-white/10 rounded-full -z-10 animate-fade-in scale-95" />
                                    )}

                                    {/* Icon */}
                                    <item.icon
                                        className={cn(
                                            "w-6 h-6 transition-transform duration-300",
                                            isActive ? "scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" : "scale-100"
                                        )}
                                        strokeWidth={isActive ? 2.5 : 2}
                                    />

                                    {/* Label (Optional: Hide on very small screens or keep minimal) */}
                                    <span className={cn(
                                        "text-[10px] font-medium transition-all duration-300",
                                        isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 hidden"
                                    )}>
                                        {item.label}
                                    </span>

                                    {/* Active Dot */}
                                    {isActive && (
                                        <div className="absolute bottom-1 w-1 h-1 bg-white rounded-full shadow-[0_0_5px_white]" />
                                    )}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </nav>
        </div>
    );
};
