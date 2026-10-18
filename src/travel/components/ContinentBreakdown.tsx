import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ContinentBreakdownProps {
  continentStats: {
    name: string;
    visited: number;
    total: number;
  }[];
}

const continentEmojis: Record<string, string> = {
  "Europe": "🇪🇺",
  "Asia": "🌏",
  "North America": "🌎",
  "South America": "🌎",
  "Africa": "🌍",
  "Oceania": "🏝️",
};

const ContinentBreakdown = ({ continentStats }: ContinentBreakdownProps) => {
  const [expanded, setExpanded] = useState(false);

  // Sort by percentage (descending)
  const sortedStats = [...continentStats].sort((a, b) => {
    const pA = a.total > 0 ? (a.visited / a.total) : 0;
    const pB = b.total > 0 ? (b.visited / b.total) : 0;
    return pB - pA;
  });

  const displayedStats = expanded ? sortedStats : sortedStats.slice(0, 2);

  return (
    <div className="bg-gradient-card rounded-2xl border border-border/50 p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-display text-xl font-semibold">Continent Progress</h3>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-sm text-muted-foreground hover:text-white flex items-center gap-1 transition-colors"
        >
          {expanded ? (
            <>Less <ChevronUp className="w-4 h-4" /></>
          ) : (
            <>See All <ChevronDown className="w-4 h-4" /></>
          )}
        </button>
      </div>

      <div className={`grid grid-cols-2 ${expanded ? 'md:grid-cols-3 lg:grid-cols-6' : ''} gap-4`}>
        {displayedStats.map((continent, index) => {
          const percentage = continent.total > 0
            ? Math.round((continent.visited / continent.total) * 100)
            : 0;

          return (
            <div
              key={continent.name}
              className="text-center p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors animate-scale-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="text-3xl mb-2">{continentEmojis[continent.name]}</div>
              <div className="text-sm text-muted-foreground mb-2 truncate">
                {continent.name}
              </div>
              <div className="font-display text-2xl font-bold text-foreground">
                {percentage}%
              </div>
              <div className="text-xs text-muted-foreground">
                {continent.visited}/{continent.total}
              </div>
              {/* Mini progress bar */}
              <div className="mt-3 h-1 bg-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-gold transition-all duration-700"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ContinentBreakdown;
