import { Globe, Map, BarChart3, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Header = ({ activeTab, setActiveTab }: HeaderProps) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'map', label: 'World Map', icon: Map },
    { id: 'countries', label: 'Countries', icon: Globe },
    { id: 'passport', label: 'Passport Power', icon: Compass },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-gold flex items-center justify-center shadow-gold">
                <Globe className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="absolute -inset-1 bg-primary/20 rounded-xl blur-lg -z-10" />
            </div>
            <div>
              <h1 className="font-display text-xl font-semibold tracking-tight">
                Wanderlust
              </h1>
              <p className="text-xs text-muted-foreground">Track your world</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Button
                key={item.id}
                variant={activeTab === item.id ? "nav-active" : "nav"}
                size="sm"
                onClick={() => setActiveTab(item.id)}
                className="gap-2"
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Button>
            ))}
          </nav>

          <div className="md:hidden flex items-center gap-1">
            {navItems.map((item) => (
              <Button
                key={item.id}
                variant={activeTab === item.id ? "nav-active" : "ghost"}
                size="icon"
                onClick={() => setActiveTab(item.id)}
              >
                <item.icon className="w-5 h-5" />
              </Button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
