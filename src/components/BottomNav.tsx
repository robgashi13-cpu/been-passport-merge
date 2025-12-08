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
            <nav className="pointer-events-auto max-w-sm mx-auto bg-black/80 backdrop-blur-2xl border border-white/10 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden ring-1 ring-white/5">
                <div className="flex items-center justify-around px-2 py-1">
                    {navItems.map((item) => {
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => {
                                    setActiveTab(item.id);
                                    if (window.navigator && window.navigator.vibrate) {
                                        window.navigator.vibrate(5);
                                    }
                                }}
                                className={`relative flex flex-col items-center justify-center w-16 h-16 transition-all duration-300 ${isActive ? '-translate-y-1' : 'opacity-60 hover:opacity-100'}`}
                            >
                                {/* Active Glow Background */}
                                {isActive && (
                                    <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full" />
                                )}

                                <div className={`relative p-2.5 rounded-2xl transition-all duration-500 ${isActive ? 'bg-gradient-to-tr from-white/10 to-transparent border border-white/20 shadow-[0_0_15px_rgba(56,189,248,0.3)]' : ''}`}>
                                    <item.icon
                                        className={`w-6 h-6 transition-all duration-500 ${isActive ? 'text-blue-400 fill-blue-400/20 stroke-[2.5px] drop-shadow-[0_0_8px_rgba(96,165,250,0.8)]' : 'text-white'}`}
                                    />
                                </div>

                                {isActive && (
                                    <span className="absolute -bottom-2 text-[9px] font-bold text-blue-400 tracking-wider animate-slide-up">
                                        {item.label.toUpperCase()}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </nav>
        </div >
    );
};
