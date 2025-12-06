import { Globe2, Map, LayoutDashboard, Flag, CreditCard, CalendarDays, User, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser } from '@/contexts/UserContext';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLoginClick: () => void;
}

const Header = ({ activeTab, setActiveTab, onLoginClick }: HeaderProps) => {
  const { user, isLoggedIn } = useUser();

  const navItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'map', label: 'World Map', icon: Globe2 },
    // Merged Countries into Map
    { id: 'calendar', label: 'Calendar', icon: CalendarDays },
    { id: 'passport', label: 'Your Passport', icon: CreditCard },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/40 backdrop-blur-xl supports-[backdrop-filter]:bg-black/20">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center overflow-hidden border border-white/20 shadow-lg group-hover:scale-105 transition-transform duration-300">
                <img src="/logo.png" alt="Travel World Logo" className="w-full h-full object-cover p-1 opacity-90" />
              </div>
              <div className="absolute -inset-2 bg-white/5 rounded-full blur-xl -z-10 group-hover:bg-white/10 transition-all duration-500" />
            </div>
            <div className="hidden sm:block">
              <h1 className="font-display text-xl font-bold tracking-tight bg-gradient-to-r from-white via-white/90 to-white/70 bg-clip-text text-transparent">
                WanderPass
              </h1>
              <p className="text-[10px] uppercase tracking-widest text-white/50 font-medium">Explore & Track</p>
            </div>
          </div>

          {/* Desktop Navigation */}
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
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="max-w-[80px] truncate">{user.name}</span>
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

        {/* Mobile Navigation Row (Horizontal Scroll) */}
        <div className="lg:hidden mt-3 -mx-4 px-4 overflow-x-auto no-scrollbar pb-1">
          <div className="flex items-center gap-2 min-w-max">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${activeTab === item.id
                  ? 'bg-white text-black shadow-md'
                  : 'bg-white/5 text-white/60 border border-white/5'
                  }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
