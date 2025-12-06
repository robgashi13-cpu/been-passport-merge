import { useState } from 'react';
import { countries, continents, Country } from '@/data/countries';
import { Check, Heart, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface CountryListProps {
  visitedCountries: string[];
  bucketList: string[];
  toggleVisited: (code: string) => void;
  toggleBucketList: (code: string) => void;
}

const CountryList = ({ 
  visitedCountries, 
  bucketList, 
  toggleVisited, 
  toggleBucketList 
}: CountryListProps) => {
  const [search, setSearch] = useState('');
  const [selectedContinent, setSelectedContinent] = useState('All');
  const [filterVisited, setFilterVisited] = useState<'all' | 'visited' | 'unvisited'>('all');

  const filteredCountries = countries.filter(country => {
    const matchesSearch = country.name.toLowerCase().includes(search.toLowerCase());
    const matchesContinent = selectedContinent === 'All' || country.continent === selectedContinent;
    const matchesVisited = filterVisited === 'all' || 
      (filterVisited === 'visited' && visitedCountries.includes(country.code)) ||
      (filterVisited === 'unvisited' && !visitedCountries.includes(country.code));
    
    return matchesSearch && matchesContinent && matchesVisited;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center py-6">
        <h2 className="font-display text-3xl md:text-4xl font-bold mb-2">
          All <span className="text-gradient-gold">Countries</span>
        </h2>
        <p className="text-muted-foreground">
          Track visited countries and build your bucket list
        </p>
      </div>

      {/* Filters */}
      <div className="bg-gradient-card rounded-2xl border border-border/50 p-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search countries..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-secondary/50 border-border/50"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {continents.map(continent => (
            <Button
              key={continent}
              variant={selectedContinent === continent ? "gold" : "secondary"}
              size="sm"
              onClick={() => setSelectedContinent(continent)}
            >
              {continent}
            </Button>
          ))}
        </div>

        <div className="flex gap-2">
          <Button
            variant={filterVisited === 'all' ? "gold" : "secondary"}
            size="sm"
            onClick={() => setFilterVisited('all')}
          >
            All
          </Button>
          <Button
            variant={filterVisited === 'visited' ? "gold" : "secondary"}
            size="sm"
            onClick={() => setFilterVisited('visited')}
          >
            <Check className="w-4 h-4 mr-1" /> Visited
          </Button>
          <Button
            variant={filterVisited === 'unvisited' ? "gold" : "secondary"}
            size="sm"
            onClick={() => setFilterVisited('unvisited')}
          >
            Unvisited
          </Button>
        </div>
      </div>

      {/* Country Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCountries.map((country, index) => {
          const isVisited = visitedCountries.includes(country.code);
          const isInBucket = bucketList.includes(country.code);

          return (
            <div
              key={country.code}
              className="bg-gradient-card rounded-xl border border-border/50 p-4 hover:border-primary/30 transition-all duration-300 animate-scale-in"
              style={{ animationDelay: `${Math.min(index * 30, 500)}ms` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{country.flagEmoji}</span>
                  <div>
                    <h3 className="font-medium">{country.name}</h3>
                    <p className="text-xs text-muted-foreground">{country.continent}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleBucketList(country.code)}
                    className={`p-2 rounded-lg transition-colors ${
                      isInBucket 
                        ? 'bg-destructive/20 text-destructive' 
                        : 'bg-secondary hover:bg-secondary/80 text-muted-foreground'
                    }`}
                    title={isInBucket ? 'Remove from bucket list' : 'Add to bucket list'}
                  >
                    <Heart className={`w-5 h-5 ${isInBucket ? 'fill-current' : ''}`} />
                  </button>
                  <button
                    onClick={() => toggleVisited(country.code)}
                    className={`p-2 rounded-lg transition-colors ${
                      isVisited 
                        ? 'bg-accent/20 text-accent' 
                        : 'bg-secondary hover:bg-secondary/80 text-muted-foreground'
                    }`}
                    title={isVisited ? 'Mark as not visited' : 'Mark as visited'}
                  >
                    <Check className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Passport info */}
              {country.passportRank && (
                <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Passport Rank: #{country.passportRank}</span>
                  <span>{country.visaFreeDestinations} visa-free</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredCountries.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No countries found matching your filters
        </div>
      )}
    </div>
  );
};

export default CountryList;
