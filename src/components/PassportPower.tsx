import { useState } from 'react';
import { countries, Country } from '@/data/countries';
import { Crown, Globe, Plane, TrendingUp, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface PassportPowerProps {
  userPassport: string;
  setUserPassport: (code: string) => void;
}

const PassportPower = ({ userPassport, setUserPassport }: PassportPowerProps) => {
  const [search, setSearch] = useState('');
  
  const sortedByRank = [...countries]
    .filter(c => c.passportRank)
    .sort((a, b) => (a.passportRank || 999) - (b.passportRank || 999));

  const filteredCountries = sortedByRank.filter(country =>
    country.name.toLowerCase().includes(search.toLowerCase())
  );

  const selectedPassport = countries.find(c => c.code === userPassport);

  const getRankColor = (rank: number) => {
    if (rank <= 3) return 'text-primary';
    if (rank <= 10) return 'text-accent';
    if (rank <= 20) return 'text-foreground';
    return 'text-muted-foreground';
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center py-6">
        <h2 className="font-display text-3xl md:text-4xl font-bold mb-2">
          Passport <span className="text-gradient-gold">Power</span>
        </h2>
        <p className="text-muted-foreground">
          Discover the power of passports around the world
        </p>
      </div>

      {/* Your Passport Card */}
      {selectedPassport && (
        <div className="bg-gradient-card rounded-2xl border border-primary/30 p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-sm text-primary mb-4">
              <Crown className="w-4 h-4" />
              <span className="uppercase tracking-wider font-medium">Your Passport</span>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="text-6xl">{selectedPassport.flagEmoji}</div>
              <div className="flex-1">
                <h3 className="font-display text-2xl font-bold">{selectedPassport.name}</h3>
                <p className="text-muted-foreground">{selectedPassport.continent}</p>
              </div>
              <div className="text-right">
                <div className="font-display text-4xl font-bold text-gradient-gold">
                  #{selectedPassport.passportRank}
                </div>
                <p className="text-sm text-muted-foreground">Global Rank</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-border/50">
              <div className="text-center">
                <Plane className="w-5 h-5 text-primary mx-auto mb-2" />
                <div className="font-display text-xl font-bold">{selectedPassport.visaFreeDestinations}</div>
                <div className="text-xs text-muted-foreground">Visa-Free</div>
              </div>
              <div className="text-center">
                <Globe className="w-5 h-5 text-accent mx-auto mb-2" />
                <div className="font-display text-xl font-bold">
                  {Math.round((selectedPassport.visaFreeDestinations || 0) / 195 * 100)}%
                </div>
                <div className="text-xs text-muted-foreground">World Access</div>
              </div>
              <div className="text-center">
                <TrendingUp className="w-5 h-5 text-foreground mx-auto mb-2" />
                <div className="font-display text-xl font-bold">
                  {selectedPassport.passportRank! <= 10 ? 'Strong' : 
                   selectedPassport.passportRank! <= 30 ? 'Good' : 'Moderate'}
                </div>
                <div className="text-xs text-muted-foreground">Rating</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Rankings */}
      <div className="bg-gradient-card rounded-2xl border border-border/50 p-4">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search to select your passport..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-secondary/50 border-border/50"
          />
        </div>

        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {filteredCountries.map((country, index) => (
            <button
              key={country.code}
              onClick={() => setUserPassport(country.code)}
              className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-200 ${
                userPassport === country.code 
                  ? 'bg-primary/20 border border-primary/30' 
                  : 'bg-secondary/30 hover:bg-secondary/50 border border-transparent'
              }`}
            >
              <div className={`w-10 text-center font-display font-bold ${getRankColor(country.passportRank || 999)}`}>
                {getRankBadge(country.passportRank || 999)}
              </div>
              <span className="text-2xl">{country.flagEmoji}</span>
              <div className="flex-1 text-left">
                <div className="font-medium">{country.name}</div>
                <div className="text-xs text-muted-foreground">{country.continent}</div>
              </div>
              <div className="text-right">
                <div className="font-display font-bold">{country.visaFreeDestinations}</div>
                <div className="text-xs text-muted-foreground">visa-free</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PassportPower;
