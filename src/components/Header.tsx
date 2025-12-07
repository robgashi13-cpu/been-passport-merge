import { Globe2, Map, LayoutDashboard, Flag, CreditCard, CalendarDays, User, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser } from '@/contexts/UserContext';
import { Capacitor } from '@capacitor/core';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLoginClick: () => void;
  showDesktopNav?: boolean;
}

const Header = ({ activeTab, setActiveTab, onLoginClick, showDesktopNav = true }: HeaderProps) => {
  const { user, isLoggedIn } = useUser();
  const isNative = Capacitor.isNativePlatform();

  // Web: Fixed at top, large padding to clear safe area + spacing
  // Native: Floating below safe area (visual gap), internal padding normal
  const headerStyle = isNative
    ? { top: 'calc(env(safe-area-inset-top) + 60px)', paddingTop: '12px' }
    : { top: '60px', paddingTop: '12px' };

  const navItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'map', label: 'World Map', icon: Globe2 },
    // Merged Countries into Map
    { id: 'calendar', label: 'Calendar', icon: CalendarDays },
    { id: 'passport', label: 'Your Passport', icon: CreditCard },
  ];

  return (
    <header
      className="fixed left-0 right-0 z-50 border-b border-white/10 bg-black/40 backdrop-blur-xl supports-[backdrop-filter]:bg-black/20 pb-3 transition-all duration-300"
      style={headerStyle}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            {/* Logo Only */}
            <div className="relative group hover:scale-105 transition-transform duration-500">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white/5 flex items-center justify-center overflow-hidden border border-white/10 shadow-lg shadow-black/20">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-cover p-1 opacity-100 invert" />
              </div>
              <div className="absolute -inset-2 bg-luxury-gold/20 rounded-full blur-xl -z-10 group-hover:bg-luxury-gold/30 transition-all duration-500" />
            </div>
          </div>

          {/* Desktop Navigation */}
          {showDesktopNav && (
            <nav className="hidden lg:flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/10 backdrop-blur-md">
              {navItems.map((item) => (
                <Button
                  key={item.id}
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveTab(item.id)}
                  className={`gap-2 rounded-full px-4 transition-all duration-300 ${activeTab === item.id
                    ? 'bg-white text-black shadow-lg shadow-white/10 hover:bg-white/90'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Button>
              ))}
            </nav>
          )}

          {/* User / Mobile Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onLoginClick}
              className="hidden sm:flex items-center gap-2 rounded-full border border-white/10 hover:bg-white/10 hover:text-white text-white/80 transition-all"
            >
              {isLoggedIn && user ? (
                <>
                  <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-[10px] font-bold text-white border border-white/20">
                    {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <span className="max-w-[80px] truncate">{user.name || user.email?.split('@')[0] || 'User'}</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </>
              )}
            </Button>

            {/* Mobile Menu Toggle could go here, but using bottom tab bar or simplified header for mobile might be better. 
                For now keeping existing mobile nav logic which was just icons row in previous design, but usually mobile nav is bottom bar.
                Reverting to previous icon row style for mobile but cleaner.
            */}
            <div className="lg:hidden flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={onLoginClick}
                className="w-9 h-9 rounded-full bg-white/5 border border-white/10"
              >
                {isLoggedIn && user ? (
                  <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                ) : (
                  <User className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

      </div>
    </header>
  );
};

export default Header;
