import { useState } from 'react';
import { countries, continents, Country, getCountryByCode } from '@/data/countries';
import { CountryDetails } from '@/components/CountryDetails';
import { useUser } from '@/contexts/UserContext';
import { Check, Heart, Search, Filter, Info, Globe, CreditCard } from 'lucide-react';
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
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);

  const { user, isLoggedIn } = useUser();
  const userPassportCode = isLoggedIn && user ? user.passportCode : undefined;

  const filteredCountries = countries.filter(country => {
    const matchesSearch = country.name.toLowerCase().includes(search.toLowerCase());
    const matchesContinent = selectedContinent === 'All' || country.continent === selectedContinent;
    const matchesVisited = filterVisited === 'all' ||
      (filterVisited === 'visited' && visitedCountries.includes(country.code)) ||
      (filterVisited === 'unvisited' && !visitedCountries.includes(country.code));

    return matchesSearch && matchesContinent && matchesVisited;
  });

  const handleCountryClick = (country: Country) => {
    setSelectedCountry(country);
  };

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in">
      <div className="text-center py-4 md:py-6">
        <h2 className="font-display text-2xl md:text-4xl font-bold mb-2">
          All <span className="text-gradient-white">Countries</span>
        </h2>
        <p className="text-sm md:text-base text-muted-foreground">
          Click any country for detailed info & visa requirements
        </p>
      </div>

      {/* Filters - Mobile optimized */}
      <div className="bg-gradient-card rounded-xl md:rounded-2xl border border-border/50 p-3 md:p-4 space-y-3 md:space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
          <Input
            placeholder="Search countries..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 md:pl-10 bg-secondary/50 border-border/50 text-sm md:text-base"
          />
        </div>

        <div className="flex flex-wrap gap-1.5 md:gap-2">
          {continents.map(continent => (
            <Button
              key={continent}
              variant={selectedContinent === continent ? "default" : "secondary"}
              size="sm"
              onClick={() => setSelectedContinent(continent)}
              className="text-xs md:text-sm px-2 md:px-3"
            >
              {continent}
            </Button>
          ))}
        </div>

        <div className="flex gap-1.5 md:gap-2">
          <Button
            variant={filterVisited === 'all' ? "default" : "secondary"}
            size="sm"
            onClick={() => setFilterVisited('all')}
            className="text-xs md:text-sm"
          >
            All ({countries.length})
          </Button>
          <Button
            variant={filterVisited === 'visited' ? "default" : "secondary"}
            size="sm"
            onClick={() => setFilterVisited('visited')}
            className="text-xs md:text-sm"
          >
            <Check className="w-3 h-3 md:w-4 md:h-4 mr-1" />
            Visited ({visitedCountries.length})
          </Button>
          <Button
            variant={filterVisited === 'unvisited' ? "default" : "secondary"}
            size="sm"
            onClick={() => setFilterVisited('unvisited')}
            className="text-xs md:text-sm"
          >
            Unvisited ({countries.length - visitedCountries.length})
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 md:gap-4">
        <div className="bg-gradient-card rounded-lg md:rounded-xl p-3 md:p-4 text-center">
          <Globe className="w-5 h-5 md:w-6 md:h-6 mx-auto mb-1 text-primary" />
          <div className="font-display text-lg md:text-2xl font-bold">{visitedCountries.length}</div>
          <div className="text-xs text-muted-foreground">Visited</div>
        </div>
        <div className="bg-gradient-card rounded-lg md:rounded-xl p-3 md:p-4 text-center">
          <Heart className="w-5 h-5 md:w-6 md:h-6 mx-auto mb-1 text-red-400" />
          <div className="font-display text-lg md:text-2xl font-bold">{bucketList.length}</div>
          <div className="text-xs text-muted-foreground">Bucket List</div>
        </div>
        <div className="bg-gradient-card rounded-lg md:rounded-xl p-3 md:p-4 text-center">
          <CreditCard className="w-5 h-5 md:w-6 md:h-6 mx-auto mb-1 text-yellow-400" />
          <div className="font-display text-lg md:text-2xl font-bold">
            {Math.round((visitedCountries.length / countries.length) * 100)}%
          </div>
          <div className="text-xs text-muted-foreground">Complete</div>
        </div>
      </div>

      {/* Country Grid - Mobile optimized */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4">
        {filteredCountries.map((country, index) => {
          const isVisited = visitedCountries.includes(country.code);
          const isInBucket = bucketList.includes(country.code);

          return (
            <div
              key={country.code}
              className="bg-gradient-card rounded-lg md:rounded-xl border border-border/50 p-3 md:p-4 hover:border-primary/30 transition-all duration-300 animate-scale-in cursor-pointer group"
              style={{ animationDelay: `${Math.min(index * 20, 300)}ms` }}
              onClick={() => handleCountryClick(country)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                  <span className="text-2xl md:text-3xl">{country.flagEmoji}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm md:text-base truncate">{country.name}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      {country.continent}
                      {country.passportRank && (
                        <span className="text-yellow-400 ml-1">• #{country.passportRank}</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1 md:gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleBucketList(country.code); }}
                    className={`p-1.5 md:p-2 rounded-lg transition-colors ${isInBucket
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-secondary hover:bg-secondary/80 text-muted-foreground'
                      }`}
                    title={isInBucket ? 'Remove from bucket list' : 'Add to bucket list'}
                  >
                    <Heart className={`w-4 h-4 md:w-5 md:h-5 ${isInBucket ? 'fill-current' : ''}`} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleVisited(country.code); }}
                    className={`p-1.5 md:p-2 rounded-lg transition-colors ${isVisited
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-secondary hover:bg-secondary/80 text-muted-foreground'
                      }`}
                    title={isVisited ? 'Mark as not visited' : 'Mark as visited'}
                  >
                    <Check className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                </div>
              </div>

              {/* Show visa info preview */}
              <div className="mt-2 pt-2 border-t border-border/30 flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Info className="w-3 h-3 group-hover:text-white transition-colors" />
                  <span className="group-hover:text-white transition-colors">Click for details</span>
                </span>
                {country.visaFreeDestinations && (
                  <span className="text-green-400">{country.visaFreeDestinations} visa-free</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredCountries.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No countries found matching your filters
        </div>
      )}

      {/* Country Details Modal */}
      {selectedCountry && (
        <CountryDetails
          country={selectedCountry}
          userPassportCode={userPassportCode}
          isVisited={visitedCountries.includes(selectedCountry.code)}
          onClose={() => setSelectedCountry(null)}
          onToggleVisited={() => toggleVisited(selectedCountry.code)}
        />
      )}
    </div>
  );
};

export default CountryList;
