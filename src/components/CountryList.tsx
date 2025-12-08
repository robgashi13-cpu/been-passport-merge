import { useState } from 'react';
import { countries, Country } from '@/data/countries';
import { useUser } from '@/contexts/UserContext';
import { Check, Heart, Search, Filter, Info, Globe, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface CountryListProps {
  visitedCountries: string[];
  bucketList: string[];
  toggleVisited: (code: string) => void;
  toggleBucketList: (code: string) => void;
  onCountryClick: (code: string) => void;
}

const CountryList = ({
  visitedCountries,
  bucketList,
  toggleVisited,
  toggleBucketList,
  onCountryClick
}: CountryListProps) => {
  const [search, setSearch] = useState('');
  const [filterVisited, setFilterVisited] = useState<'all' | 'visited' | 'unvisited'>('all');
  const [showAll, setShowAll] = useState(false);

  const filteredCountries = countries.filter(country => {
    const matchesSearch = country.name.toLowerCase().includes(search.toLowerCase());
    const matchesVisited = filterVisited === 'all' ||
      (filterVisited === 'visited' && visitedCountries.includes(country.code)) ||
      (filterVisited === 'unvisited' && !visitedCountries.includes(country.code));

    return matchesSearch && matchesVisited;
  }).sort((a, b) => {
    const aVisited = visitedCountries.includes(a.code);
    const bVisited = visitedCountries.includes(b.code);
    if (aVisited && !bVisited) return -1;
    if (!aVisited && bVisited) return 1;
    return a.name.localeCompare(b.name);
  });

  const initialLimit = 6;
  const displayCountries = (showAll || search) ? filteredCountries : filteredCountries.slice(0, initialLimit);

  return (
    <div className="bg-gradient-card rounded-2xl border border-border/50 p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h3 className="font-display text-xl font-bold">All Countries</h3>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-full sm:w-64"
            />
          </div>

          <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
            <button
              onClick={() => setFilterVisited('all')}
              className={`px-3 py-1.5 rounded-md text-sm transition-all ${filterVisited === 'all' ? 'bg-white/10 text-white' : 'text-muted-foreground hover:text-white'}`}
            >
              All
            </button>
            <button
              onClick={() => setFilterVisited('visited')}
              className={`px-3 py-1.5 rounded-md text-sm transition-all ${filterVisited === 'visited' ? 'bg-white/10 text-white' : 'text-muted-foreground hover:text-white'}`}
            >
              Visited
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {displayCountries.map((country) => {
          const isVisited = visitedCountries.includes(country.code);
          const isBucket = bucketList.includes(country.code);

          return (
            <div
              key={country.code}
              onClick={() => onCountryClick?.(country.code)}
              className={`
                group flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer
                ${isVisited
                  ? 'bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20'
                  : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20'
                }
              `}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{country.flagEmoji}</span>
                <div className="text-left">
                  <div className={`font-medium ${isVisited ? 'text-green-400' : 'text-white'}`}>
                    {country.name}
                  </div>
                  <div className="text-xs text-muted-foreground">{country.continent}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); toggleBucketList(country.code); }}
                  className={`p-2 rounded-full transition-colors ${isBucket
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-white/5 text-white/60 hover:bg-white/20 hover:text-red-400'
                    }`}
                >
                  <Heart className={`w-4 h-4 ${isBucket ? 'fill-current' : ''}`} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleVisited(country.code);
                  }}
                  className={`p-2 rounded-full transition-colors ${isVisited
                    ? 'bg-green-500 text-black shadow-[0_0_10px_rgba(34,197,94,0.4)]'
                    : 'bg-white/5 text-white/60 hover:bg-white/20'
                    }`}
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {!showAll && !search && filteredCountries.length > initialLimit && (
        <div className="mt-6 text-center">
          <button
            onClick={() => setShowAll(true)}
            className="px-6 py-2 rounded-xl bg-white/10 border border-white/10 text-sm font-medium hover:bg-white/20 transition-all flex items-center gap-2 mx-auto"
          >
            Show All Countries ({filteredCountries.length})
          </button>
        </div>
      )}

      {showAll && (
        <div className="mt-6 text-center">
          <button
            onClick={() => setShowAll(false)}
            className="px-6 py-2 rounded-xl bg-white/10 border border-white/10 text-sm font-medium hover:bg-white/20 transition-all flex items-center gap-2 mx-auto"
          >
            Show Less
          </button>
        </div>
      )}

      {filteredCountries.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No countries found
        </div>
      )}
    </div>
  );
};

export default CountryList;
