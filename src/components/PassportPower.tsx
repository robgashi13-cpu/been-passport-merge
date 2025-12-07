import { useState, useMemo } from 'react';
import { countries, Country, getCountryByCode } from '@/data/countries';
import { useUser } from '@/contexts/UserContext';
import {
  getVisaRequirementFromMatrix,
  getVisaRequirementColor,
  getVisaRequirementLabel,
  getPassportStats,
  availablePassports,
  VisaRequirement
} from '@/data/visaMatrix';
import { AVAILABLE_ADDITIONAL_VISAS, SCHENGEN_COUNTRIES, VISA_SUBSTITUTIONS, getVisaPowerGroups } from '@/data/visaSubstitutions';
import {
  Crown, Globe, Plane, TrendingUp, Search, MapPin, Users,
  CreditCard, Building, Landmark, Check, AlertCircle, ChevronDown, ChevronRight, X, Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// VisaCountryList Component - Shows all countries grouped by visa type
const VisaCountryList = ({ passportCode, heldVisas }: { passportCode: string, heldVisas: string[] }) => {
  const [expandedSection, setExpandedSection] = useState<string | null>('visa-free');
  const [searchQuery, setSearchQuery] = useState('');

  // Get power groups from held visas
  const powerGroups = getVisaPowerGroups(heldVisas);
  const substitutedDestinations = new Set<string>();
  powerGroups.forEach(group => {
    const dests = VISA_SUBSTITUTIONS[group] || [];
    dests.forEach(d => substitutedDestinations.add(d));
  });

  // Get all countries with their visa requirements
  const allCountries = countries
    .filter(c => c.code !== passportCode)
    .map(country => {
      const baseInfo = getVisaRequirementFromMatrix(passportCode, country.code);
      let effectiveRequirement = baseInfo?.requirement;
      let note = baseInfo?.notes;

      // Check for substitution
      if (effectiveRequirement === 'visa-required' && (substitutedDestinations.has(country.code) || heldVisas.includes(country.code))) {
        effectiveRequirement = 'visa-free';
        note = 'Unlocked by your held visa';
      }

      return {
        ...country,
        visaInfo: {
          ...baseInfo,
          requirement: effectiveRequirement,
          notes: note
        }
      };
    })
    .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

  // Group by requirement type
  const grouped: Record<VisaRequirement, typeof allCountries> = {
    'visa-free': allCountries.filter(c => c.visaInfo?.requirement === 'visa-free'),
    'visa-on-arrival': allCountries.filter(c => c.visaInfo?.requirement === 'visa-on-arrival'),
    'e-visa': allCountries.filter(c => c.visaInfo?.requirement === 'e-visa' || c.visaInfo?.requirement === 'eta'),
    'eta': [],
    'visa-required': allCountries.filter(c => c.visaInfo?.requirement === 'visa-required'),
  };

  const sections: { key: VisaRequirement; label: string; color: string }[] = [
    { key: 'visa-free', label: 'Visa Free', color: '#22c55e' },
    { key: 'visa-on-arrival', label: 'Visa on Arrival', color: '#166534' },
    { key: 'e-visa', label: 'e-Visa / ETA', color: '#eab308' },
    { key: 'visa-required', label: 'Visa Required', color: '#ef4444' },
  ];

  return (
    <div className="bg-gradient-card rounded-2xl border border-border/50 p-4">
      <h3 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
        <Globe className="w-5 h-5" />
        All Countries ({allCountries.length})
      </h3>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search countries..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-9 text-sm"
        />
      </div>

      <div className="space-y-2">
        {sections.map(section => {
          const sectionCountries = grouped[section.key];
          const isExpanded = expandedSection === section.key;

          return (
            <div key={section.key} className="border border-border/30 rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedSection(isExpanded ? null : section.key)}
                className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors"
                style={{ backgroundColor: isExpanded ? 'rgba(255,255,255,0.05)' : 'transparent' }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: section.color }}
                  />
                  <span className="font-medium">{section.label}</span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${section.color} 20`, color: section.color }}
                  >
                    {sectionCountries.length}
                  </span>
                </div>
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>

              {isExpanded && sectionCountries.length > 0 && (
                <div className="border-t border-border/30 p-3 grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                  {sectionCountries.map(country => (
                    <div
                      key={country.code}
                      className="flex items-center gap-2 p-2 rounded-lg bg-white/5 text-sm"
                    >
                      <span className="text-lg">{country.flagEmoji}</span>
                      <div className="flex flex-col min-w-0">
                        <span className="truncate font-medium">{country.name}</span>
                        {country.visaInfo.notes === 'Unlocked by your held visa' && (
                          <span className="text-[10px] text-green-400 flex items-center gap-1">
                            <Check className="w-3 h-3" /> Unlocked
                          </span>
                        )}
                        {country.visaInfo.duration && country.visaInfo.notes !== 'Unlocked by your held visa' && (
                          <span className="text-xs text-muted-foreground">{country.visaInfo.duration}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {isExpanded && sectionCountries.length === 0 && (
                <div className="border-t border-border/30 p-4 text-center text-muted-foreground text-sm">
                  No countries in this category
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};


interface PassportPowerProps {
  userPassport: string;
  setUserPassport: (code: string) => void;
  heldVisas: string[];
  onToggleHeldVisa?: (visaId: string) => void;
  userPassportScore?: number;
}

const PassportPower = ({ userPassport, setUserPassport, heldVisas = [], onToggleHeldVisa, userPassportScore }: PassportPowerProps) => {
  const [search, setSearch] = useState('');
  const [showAllVisas, setShowAllVisas] = useState(false);
  const [selectedVisaToAdd, setSelectedVisaToAdd] = useState('');

  const { user, isLoggedIn } = useUser();
  const effectivePassport = isLoggedIn && user ? user.passportCode : userPassport;
  const effectiveHeldVisas = isLoggedIn && user ? (user.heldVisas || []) : heldVisas;
  const selectedPassport = countries.find(c => c.code === effectivePassport);

  // Calculate dynamic stats including held visas
  const calculateDynamicStats = (passportCode: string, heldVisas: string[]) => {
    const baseStats = getPassportStats(passportCode);
    if (!baseStats) return null;

    // If no held visas, return base stats
    if (!heldVisas || heldVisas.length === 0) return { ...baseStats, totalScore: baseStats.visaFree + baseStats.visaOnArrival + baseStats.eta };

    // Get substituted destinations
    const powerGroups = getVisaPowerGroups(heldVisas);
    const substitutedDestinations = new Set<string>();
    powerGroups.forEach(group => {
      const dests = VISA_SUBSTITUTIONS[group] || [];
      dests.forEach(d => substitutedDestinations.add(d));
    });

    let newStats = { ...baseStats };
    let additionalAccess = 0;

    // Recalculate based on substitutions
    availablePassports.forEach(destCode => {
      if (destCode === passportCode) return;
      const baseReq = getVisaRequirementFromMatrix(passportCode, destCode)?.requirement;
      const isSubstituted = substitutedDestinations.has(destCode);

      // If substituted or directly held, it becomes effectively visa-free
      if (baseReq === 'visa-required' && (isSubstituted || heldVisas.includes(destCode))) {
        newStats.visaRequired--;
        newStats.visaFree++;
        additionalAccess++;
      }
    });

    return { ...newStats, totalScore: newStats.visaFree + newStats.visaOnArrival + newStats.eta };
  };

  const dynamicStats = selectedPassport ? calculateDynamicStats(effectivePassport, effectiveHeldVisas) : null;

  // Calculate all scores and ranks once
  const allPassportRanks = useMemo(() => {
    const scores = availablePassports.map(code => {
      const stats = getPassportStats(code);
      let score = stats.visaFree + stats.visaOnArrival + stats.eta;

      // If this is the user's passport, use their dynamic score (with extra visas)
      if (code === effectivePassport && dynamicStats) {
        score = dynamicStats.totalScore;
      }
      return { code, score };
    }).sort((a, b) => b.score - a.score);

    const rankMap = new Map<string, number>();
    let currentRank = 1;

    for (let i = 0; i < scores.length; i++) {
      if (i > 0 && scores[i].score < scores[i - 1].score) {
        currentRank++;
      }
      rankMap.set(scores[i].code, currentRank);
    }
    return rankMap;
  }, [effectivePassport, dynamicStats]);

  const dynamicRank = allPassportRanks.get(effectivePassport) || (selectedPassport?.passportRank || 100);

  const filteredCountries = availablePassports
    .map(code => {
      const country = getCountryByCode(code);
      if (!country) return null;
      let stats = getPassportStats(code);
      let score = stats.visaFree + stats.visaOnArrival + stats.eta;

      if (code === effectivePassport && dynamicStats) {
        score = dynamicStats.totalScore;
      }

      return {
        ...country,
        dynamicScore: score,
        currentRank: allPassportRanks.get(code) || 999
      };
    })
    .filter((c): c is NonNullable<typeof c> => !!c)
    // Filter search
    .filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    // Sort by dynamic score
    .sort((a, b) => b.dynamicScore - a.dynamicScore);

  const getRankBadge = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank} `;
  };

  const getRatingText = (rank: number) => {
    if (rank <= 5) return { text: 'Very Strong', color: 'text-green-400' };
    if (rank <= 10) return { text: 'Strong', color: 'text-green-500' };
    if (rank <= 20) return { text: 'Good', color: 'text-yellow-400' };
    if (rank <= 40) return { text: 'Moderate', color: 'text-orange-400' };
    if (rank <= 60) return { text: 'Limited', color: 'text-orange-500' };
    return { text: 'Restricted', color: 'text-red-400' };
  };

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in">
      <div className="text-center py-4 md:py-6">
        <h2 className="font-display text-2xl md:text-4xl font-bold mb-2">
          Your <span className="text-gradient-white">Passport</span>
        </h2>
        <p className="text-sm md:text-base text-muted-foreground">
          Discover your passport power and visa access
        </p>
      </div>

      <Tabs defaultValue="your-passport" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-sm mx-auto">
          <TabsTrigger value="your-passport" className="text-sm">Your Passport</TabsTrigger>
          <TabsTrigger value="world-passport" className="text-sm">World Rankings</TabsTrigger>
        </TabsList>

        {/* YOUR PASSPORT TAB */}
        <TabsContent value="your-passport" className="mt-6 space-y-6">
          {selectedPassport ? (
            <>
              {/* Main Passport Card - Compact */}
              <div className="bg-gradient-to-br from-white/10 to-white/5 rounded-2xl border border-white/20 p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl" />
                <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-white/5 rounded-full blur-2xl" />

                <div className="relative z-10">
                  <div className="flex items-center gap-2 text-xs text-white/70 mb-3">
                    <Crown className="w-3.5 h-3.5" />
                    <span className="uppercase tracking-wider font-medium">Your Passport</span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                    {/* Flag & Name */}
                    <div className="flex-1 text-center sm:text-left">
                      <div className="text-5xl sm:text-6xl mb-1">{selectedPassport.flagEmoji}</div>
                      <h3 className="font-display text-xl sm:text-2xl font-bold">{selectedPassport.name}</h3>
                      <p className="text-xs text-muted-foreground mb-1">{selectedPassport.continent}</p>
                      <div className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/5 ${getRatingText(dynamicRank).color} border border-white/10`}>
                        {getRatingText(dynamicRank).text} Power
                      </div>
                    </div>

                    {/* Unified Stats Board - Compact */}
                    <div className="flex w-full sm:w-auto gap-4 items-center justify-center bg-black/20 p-3 rounded-xl backdrop-blur-sm border border-white/10">
                      {/* Rank */}
                      <div className="text-center min-w-[60px]">
                        <div className="font-display text-2xl sm:text-3xl font-bold text-gradient-white">
                          {getRankBadge(dynamicRank)}
                        </div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest leading-none mt-1">Global<br />Rank</p>
                      </div>

                      <div className="w-px h-8 bg-white/20"></div>

                      {/* Progress */}
                      <div className="text-center min-w-[60px]">
                        <div className="font-display text-2xl sm:text-3xl font-bold text-blue-400">
                          {Math.round(((dynamicStats?.totalScore || 0) / 199) * 100)}%
                        </div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest leading-none mt-1">World<br />Access</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Change Passport Section */}
              <div className="bg-gradient-card rounded-2xl border border-border/50 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-white/60" />
                  </div>
                  <div className="flex-1">
                    <label className="text-sm text-white/60 block mb-1">Change Passport</label>
                    <div className="relative">
                      <select
                        value={effectivePassport}
                        onChange={(e) => setUserPassport(e.target.value)}
                        className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-white/30 text-sm [color-scheme:dark]"
                      >
                        {countries
                          .slice()
                          .sort((a, b) => a.name.localeCompare(b.name))
                          .map(c => (
                            <option key={c.code} value={c.code} className="bg-black text-white">
                              {c.flagEmoji} {c.name}
                            </option>
                          ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Visas Section */}
              <div className="bg-gradient-card rounded-2xl border border-border/50 p-6">
                <h3 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Additional Visas
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Add valid visas you currently hold (e.g., US Visa, Schengen Visa) to see more destinations you can visit.
                </p>

                <div className="flex flex-wrap gap-3 mb-4">
                  {effectiveHeldVisas.map(visaId => {
                    const country = countries.find(c => c.code === visaId);
                    if (!country) return null;
                    const isSchengen = SCHENGEN_COUNTRIES.includes(visaId);
                    return (
                      <div key={visaId} className="bg-white/10 border border-white/20 rounded-full pl-3 pr-2 py-1.5 flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {country.flagEmoji} {country.name}
                          {isSchengen && <span className="ml-1 text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded-full">Schengen</span>}
                        </span>
                        <button
                          onClick={() => onToggleHeldVisa?.(visaId)}
                          className="p-1 hover:bg-white/10 rounded-full transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                  {effectiveHeldVisas.length === 0 && (
                    <span className="text-sm text-muted-foreground italic">No additional visas added</span>
                  )}
                </div>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <select
                      value={selectedVisaToAdd}
                      onChange={(e) => setSelectedVisaToAdd(e.target.value)}
                      className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-2.5 appearance-none focus:outline-none focus:ring-2 focus:ring-white/20"
                    >
                      <option value="" className="text-black">Select a visa to add...</option>
                      {countries
                        .filter(c => c.code !== effectivePassport) // Can't add visa for own passport
                        .slice()
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map(c => (
                          <option
                            key={c.code}
                            value={c.code}
                            disabled={effectiveHeldVisas.includes(c.code)}
                            className="text-black"
                          >
                            {c.flagEmoji} {c.name} {effectiveHeldVisas.includes(c.code) ? '(Added)' : ''}
                          </option>
                        ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      if (selectedVisaToAdd && onToggleHeldVisa) {
                        onToggleHeldVisa(selectedVisaToAdd);
                        setSelectedVisaToAdd('');
                      }
                    }}
                    disabled={!selectedVisaToAdd}
                    className="bg-white text-black hover:bg-white/90 rounded-xl"
                  >
                    Add
                  </Button>
                </div>
              </div>

              {/* Visa Statistics */}
              {dynamicStats && (
                <div className="bg-gradient-card rounded-2xl border border-border/50 p-6">
                  <h3 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Visa Access Breakdown
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="font-display text-3xl font-bold" style={{ color: '#22c55e' }}>
                        {dynamicStats.visaFree}
                      </div>
                      <div className="text-xs text-muted-foreground">Visa Free</div>
                      <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${(dynamicStats.visaFree / dynamicStats.total) * 100}% `, backgroundColor: '#22c55e' }}
                        />
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="font-display text-3xl font-bold" style={{ color: '#166534' }}>
                        {dynamicStats.visaOnArrival}
                      </div>
                      <div className="text-xs text-muted-foreground">On Arrival</div>
                      <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${(dynamicStats.visaOnArrival / dynamicStats.total) * 100}% `, backgroundColor: '#166534' }}
                        />
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="font-display text-3xl font-bold" style={{ color: '#eab308' }}>
                        {dynamicStats.eVisa}
                      </div>
                      <div className="text-xs text-muted-foreground">e-Visa / ETA</div>
                      <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${(dynamicStats.eVisa / dynamicStats.total) * 100}% `, backgroundColor: '#eab308' }}
                        />
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="font-display text-3xl font-bold" style={{ color: '#ef4444' }}>
                        {dynamicStats.visaRequired}
                      </div>
                      <div className="text-xs text-muted-foreground">Visa Required</div>
                      <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${(dynamicStats.visaRequired / dynamicStats.total) * 100}% `, backgroundColor: '#ef4444' }}
                        />
                      </div>
                    </div>
                  </div>
                  {/* SHOW GAINS */}
                  {dynamicStats.visaFree > (getPassportStats(effectivePassport)?.visaFree || 0) && (
                    <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center justify-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-400" />
                      <span className="text-green-400 font-medium">
                        Your held visas unlocked {dynamicStats.visaFree - (getPassportStats(effectivePassport)?.visaFree || 0)} new destinations!
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Complete Visa List */}
              <VisaCountryList passportCode={effectivePassport} heldVisas={effectiveHeldVisas} />

              {/* Change Passport */}
              <div className="bg-gradient-card rounded-xl border border-border/50 p-4">
                <button
                  onClick={() => setShowAllVisas(!showAllVisas)}
                  className="w-full flex items-center justify-between"
                >
                  <span className="font-medium">Change Your Passport</span>
                  <ChevronDown className={`w - 5 h - 5 transition - transform ${showAllVisas ? 'rotate-180' : ''} `} />
                </button>

                {showAllVisas && (
                  <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 h-9 text-sm"
                      />
                    </div>
                    {filteredCountries.slice(0, 20).map((country) => (
                      <button
                        key={country.code}
                        onClick={() => setUserPassport(country.code)}
                        className={`w - full flex items - center gap - 3 p - 2 rounded - lg transition - colors ${effectivePassport === country.code
                          ? 'bg-white/20 ring-1 ring-white/30'
                          : 'hover:bg-white/10'
                          } `}
                      >
                        <span className="text-xl">{country.flagEmoji}</span>
                        <span className="flex-1 text-left text-sm">{country.name}</span>
                        <span className="text-xs text-muted-foreground">#{country.passportRank}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              Select a passport to see details
            </div>
          )}
        </TabsContent>

        {/* WORLD PASSPORT TAB */}
        <TabsContent value="world-passport" className="mt-6 space-y-4">
          <div className="bg-gradient-card rounded-xl border border-border/50 p-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search passports..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-sm"
              />
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {filteredCountries.map((country) => (
                <button
                  key={country.code}
                  onClick={() => setUserPassport(country.code)}
                  className={`w - full flex items - center gap - 3 p - 3 rounded - xl transition - all ${effectivePassport === country.code
                    ? 'bg-white/20 ring-2 ring-white/30'
                    : 'bg-white/5 hover:bg-white/10'
                    } `}
                >
                  <div className="w-10 text-center font-display font-bold">
                    {getRankBadge(country.currentRank)}
                  </div>
                  <span className="text-2xl">{country.flagEmoji}</span>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-sm">{country.name}</div>
                    <div className="text-xs text-muted-foreground">{country.continent}</div>
                  </div>
                  <div className="text-right">
                    <div className={`font - display font - bold ${country.code === effectivePassport ? "text-blue-400" : "text-green-400"} `}>
                      {country.dynamicScore}
                    </div>
                    <div className="text-xs text-muted-foreground">visa-free</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PassportPower;
