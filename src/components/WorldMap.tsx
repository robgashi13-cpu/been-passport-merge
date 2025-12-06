import { countries } from '@/data/countries';
import { MapPin, Check, Plus } from 'lucide-react';

interface WorldMapProps {
  visitedCountries: string[];
  toggleVisited: (code: string) => void;
}

const WorldMap = ({ visitedCountries, toggleVisited }: WorldMapProps) => {
  const visitedCount = visitedCountries.length;
  const percentage = Math.round((visitedCount / countries.length) * 100);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center py-6">
        <h2 className="font-display text-3xl md:text-4xl font-bold mb-2">
          World <span className="text-gradient-gold">Explorer</span>
        </h2>
        <p className="text-muted-foreground">
          Tap countries to mark them as visited
        </p>
      </div>

      {/* Visual Map Representation */}
      <div className="relative bg-gradient-card rounded-2xl border border-border/50 p-8 overflow-hidden">
        {/* Globe decoration */}
        <div className="absolute top-4 right-4 text-8xl opacity-10">🌍</div>
        
        <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-10 gap-2">
          {countries.map((country) => {
            const isVisited = visitedCountries.includes(country.code);
            return (
              <button
                key={country.code}
                onClick={() => toggleVisited(country.code)}
                className={`
                  relative aspect-square rounded-lg flex items-center justify-center text-2xl
                  transition-all duration-300 hover:scale-110 hover:z-10
                  ${isVisited 
                    ? 'bg-accent/30 ring-2 ring-accent shadow-lg' 
                    : 'bg-secondary/50 hover:bg-secondary'
                  }
                `}
                title={country.name}
              >
                {country.flagEmoji}
                {isVisited && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-accent rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-accent-foreground" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Stats overlay */}
        <div className="mt-8 flex items-center justify-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-accent/30 ring-2 ring-accent" />
            <span className="text-sm text-muted-foreground">Visited ({visitedCount})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-secondary/50" />
            <span className="text-sm text-muted-foreground">Not visited ({countries.length - visitedCount})</span>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-card rounded-xl border border-border/50 p-4 text-center">
          <MapPin className="w-6 h-6 text-primary mx-auto mb-2" />
          <div className="font-display text-2xl font-bold">{visitedCount}</div>
          <div className="text-xs text-muted-foreground">Countries</div>
        </div>
        <div className="bg-gradient-card rounded-xl border border-border/50 p-4 text-center">
          <div className="text-2xl mb-2">🎯</div>
          <div className="font-display text-2xl font-bold">{percentage}%</div>
          <div className="text-xs text-muted-foreground">World Explored</div>
        </div>
        <div className="bg-gradient-card rounded-xl border border-border/50 p-4 text-center">
          <div className="text-2xl mb-2">🏆</div>
          <div className="font-display text-2xl font-bold">
            {visitedCount >= 30 ? 'Explorer' : visitedCount >= 10 ? 'Traveler' : 'Beginner'}
          </div>
          <div className="text-xs text-muted-foreground">Rank</div>
        </div>
        <div className="bg-gradient-card rounded-xl border border-border/50 p-4 text-center">
          <div className="text-2xl mb-2">✨</div>
          <div className="font-display text-2xl font-bold">{countries.length - visitedCount}</div>
          <div className="text-xs text-muted-foreground">To Explore</div>
        </div>
      </div>
    </div>
  );
};

export default WorldMap;
