import StatCard from './StatCard';
import { MapPin, Globe, Trophy, Shield, Bell, BellOff, LayoutGrid, X, LogOut, Flag, Earth, BookMarked } from 'lucide-react';

import ProgressRing from './ProgressRing';
// Removed: import ContinentBreakdown from './ContinentBreakdown';
import { TripEntry } from '@/data/trips';
import { LevelCard } from './Achievements';
import { SafetyWidget } from './SafetyWidget';
import { useSmartLocation } from '@/hooks/useSmartLocation';
import { useLocationNotifications } from '@/hooks/useLocationNotifications';
import { getCountryByCode, countries } from '@/data/countries';
import { VisitedCountriesModal } from './VisitedCountriesModal';
import { PassportDetailsModal } from './PassportDetailsModal';
import { FlightBoardModal } from './FlightBoardModal';
import { openRouteExplorer } from './RouteExplorerModal';
import { TravelSearchModal } from './TravelSearchModal';
import { Plane, Hotel, Car, Sparkles } from 'lucide-react';
import { CountryBrowserModal } from './CountryBrowserModal';
import { ContinentModal } from './ContinentModal';
import { useState, useMemo, useEffect } from 'react';
import { useTravelData } from '@/hooks/useTravelData';
import { useUser } from '@/contexts/UserContext';
import { ExploreDestinations } from './ExploreDestinations';

interface DashboardProps {
  stats: {
    visitedCount: number;
    totalCountries: number;
    percentage: number;
    continentStats: {
      name: string;
      visited: number;
      total: number;
    }[];
    passportScore: number;
    userPassport: {
      passportRank?: number;
      name: string;
      code: string;
    } | null;
  };
  visitedCountries: string[];
  // New props for Map
  toggleVisited: (code: string) => void;
  bucketList: string[];
  heldVisas: string[];
  onCountryClick: (code: string) => void;
}

const Dashboard = ({ stats, visitedCountries, toggleVisited, bucketList, heldVisas, onCountryClick }: DashboardProps) => {
  // Use smart location which also handles auto-logging
  const { location } = useSmartLocation();
  const { logout, isLoggedIn, user } = useUser();
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 5) return 'Good night';
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  })();
  const firstName = user?.name?.split(' ')[0] || 'Traveler';

  // Location-based notifications
  const { hasPermission, requestPermission, isSupported } = useLocationNotifications(
    location.countryCode,
    location.countryName
  );

  // Modal state
  const [showVisitedModal, setShowVisitedModal] = useState(false);
  const [showPassportModal, setShowPassportModal] = useState(false);
  const [showFlightModal, setShowFlightModal] = useState(false);
  const [showCountryBrowser, setShowCountryBrowser] = useState(false);
  const [showContinentModal, setShowContinentModal] = useState(false);
  const [showRouteExplorer, setShowRouteExplorer] = useState(false);
  const [travelSearchMode, setTravelSearchMode] = useState<null | 'flight' | 'hotel' | 'car'>(null);

  // Local-airport picker (persisted). Falls back to PRN when nothing chosen.
  const [airportCode, setAirportCode] = useState<string>(() => {
    try { return (localStorage.getItem('wp.localAirport') || '').toUpperCase() || 'PRN'; }
    catch { return 'PRN'; }
  });
  const [editingAirport, setEditingAirport] = useState(false);
  const [airportDraft, setAirportDraft] = useState(airportCode);
  useEffect(() => { try { localStorage.setItem('wp.localAirport', airportCode); } catch { /* ignore */ } }, [airportCode]);

  // Get safety data from country info
  const currentCountry = location.countryCode ? getCountryByCode(location.countryCode) : null;
  const safetyScore = currentCountry?.safetyScore || 0;
  const isDetectingLocation = !location.countryCode; // If no country code, we are detecting

  // Calculate global safety ranking based on Gallup scores
  const safetyRank = useMemo(() => {
    if (!currentCountry?.safetyScore) return undefined;

    // Sort countries by safety score descending and find rank
    const countriesWithScores = countries
      .filter(c => c.safetyScore !== undefined)
      .sort((a, b) => (b.safetyScore || 0) - (a.safetyScore || 0));

    const rank = countriesWithScores.findIndex(c => c.code === currentCountry.code) + 1;
    return rank > 0 ? rank : undefined;
  }, [currentCountry]);

  // Granular scores based on main score with realistic variance
  const nightScore = Math.max(0, Math.min(100, safetyScore - 8));
  const personalScore = Math.max(0, Math.min(100, safetyScore - 3));
  const womenScore = Math.max(0, Math.min(100, safetyScore + 2));

  // Continents Logic (Unlocked = visited > 0)
  const unlockedContinents = stats.continentStats.filter(c => c.visited > 0);
  const unlockedContinentCount = unlockedContinents.length;
  const totalContinents = stats.continentStats.length; // usually 6 or 7 depending on data model

  return (
    <div className="flex flex-col pb-4 animate-fade-in relative z-0">
      {/* Content */}
      {/* Liquid Hero Greeting */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.07] via-white/[0.03] to-transparent backdrop-blur-2xl px-5 py-5 mb-4 mx-1">
        <div className="pointer-events-none absolute -top-16 -right-10 w-48 h-48 rounded-full bg-primary/30 blur-3xl animate-pulse" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 w-56 h-56 rounded-full bg-accent/20 blur-3xl" />
        <div className="relative flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/80 font-semibold">{greeting}</p>
            <h1 className="font-display font-bold text-2xl text-foreground truncate mt-0.5">{firstName}</h1>
            <p className="text-xs text-muted-foreground mt-1">{stats.visitedCount} countries · {unlockedContinents.length}/{totalContinents} continents</p>
          </div>
          <div className="relative shrink-0">
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary/50 to-accent/40 blur-md" />
            <div className="relative w-14 h-14 rounded-full bg-black/60 border border-white/15 flex items-center justify-center backdrop-blur-xl">
              <span className="font-display font-bold text-lg bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent">
                {firstName.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 px-1">

        {/* Level Card - Compact */}
        <LevelCard visitedCountries={visitedCountries} />

        {/* Stats Grid - Clean 3-column layout */}
        <div className="grid grid-cols-3 gap-3">
          {/* Countries */}
          <button
            onClick={() => setShowVisitedModal(true)}
            className="bg-gradient-card rounded-2xl border border-border/50 p-4 text-left hover:border-border/80 transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-2">
              <Flag className="w-3 h-3" />
              <span>Countries</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-display font-bold text-2xl text-foreground">{stats.visitedCount}</span>
              <span className="text-xs text-muted-foreground">/{stats.totalCountries}</span>
            </div>
          </button>

          {/* Continents */}
          <button
            onClick={() => setShowContinentModal(true)}
            className="bg-gradient-card rounded-2xl border border-border/50 p-4 text-left hover:border-border/80 transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-2">
              <Earth className="w-3 h-3" />
              <span>Continents</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-display font-bold text-2xl text-foreground">{unlockedContinentCount}</span>
              <span className="text-xs text-muted-foreground">/{totalContinents}</span>
            </div>
          </button>

          {/* Passport Power */}
          <button
            onClick={() => setShowPassportModal(true)}
            className="bg-gradient-card rounded-2xl border border-border/50 p-4 text-left hover:border-border/80 transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-2">
              <BookMarked className="w-3 h-3" />
              <span>Passport</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-display font-bold text-2xl text-foreground">#{stats.userPassport?.passportRank || '--'}</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1 truncate">{stats.userPassport?.name || 'Select'}</p>
          </button>
        </div>

        {/* Safety Widget */}
        <SafetyWidget
          countryName={location.countryName || currentCountry?.name || "Detecting..."}
          safetyScore={safetyScore}
          safetyRank={safetyRank}
          nightScore={nightScore}
          personalScore={personalScore}
          womenScore={womenScore}
          isDetecting={isDetectingLocation}
        />

        {/* Local Airport Traffic */}
        <div className="bg-gradient-card rounded-2xl border border-border/50 p-4 group">
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => setShowFlightModal(true)}
              className="flex items-center gap-4 min-w-0 flex-1 text-left active:scale-[0.99] transition-transform"
            >
              <div className="w-11 h-11 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                <span className="text-xl">✈️</span>
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-foreground text-sm truncate">Local Airport Traffic</h3>
                <p className="text-xs text-muted-foreground truncate">Departures & arrivals from {airportCode}</p>
              </div>
            </button>
            <button
              onClick={() => { setAirportDraft(airportCode); setEditingAirport(v => !v); }}
              className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground border border-border/50 rounded-full px-2.5 py-1"
            >
              {editingAirport ? 'Close' : 'Change'}
            </button>
          </div>
          {editingAirport && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const v = airportDraft.trim().toUpperCase().slice(0, 3);
                if (v.length === 3) { setAirportCode(v); setEditingAirport(false); }
              }}
              className="mt-3 flex items-center gap-2"
            >
              <input
                value={airportDraft}
                onChange={(e) => setAirportDraft(e.target.value.toUpperCase().slice(0, 3))}
                placeholder="IATA (e.g. VIE, JFK)"
                className="flex-1 bg-black/40 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-luxury-gold/50 uppercase tracking-widest"
                maxLength={3}
                autoFocus
              />
              <button type="submit" className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-foreground text-xs font-semibold">Save</button>
            </form>
          )}
        </div>

        {/* AI Travel Search — Flights & Hotels */}
        <div className="relative overflow-hidden rounded-2xl border border-[hsl(var(--gold)/0.3)] bg-gradient-to-br from-[hsl(var(--gold)/0.12)] via-white/[0.03] to-amber-500/10 backdrop-blur-xl p-4">
          <div className="pointer-events-none absolute -top-10 -right-10 w-40 h-40 rounded-full bg-[hsl(var(--gold)/0.25)] blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-[hsl(var(--gold))]" />
              <h3 className="font-display font-bold text-foreground text-sm">AI Travel Search</h3>
              <span className="text-[9px] uppercase tracking-widest text-[hsl(var(--gold))] border border-[hsl(var(--gold)/0.4)] rounded-full px-2 py-0.5">New</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">Curated across all major platforms — cheapest, fastest, best value & AI's top pick.</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setTravelSearchMode('flight')}
                className="flex flex-col items-center justify-center gap-1 py-3 rounded-xl bg-white/8 hover:bg-white/12 border border-white/10 text-xs font-semibold text-foreground active:scale-[0.98] transition-all"
              >
                <Plane className="w-4 h-4 text-sky-300" /> Flights
              </button>
              <button
                onClick={() => setTravelSearchMode('hotel')}
                className="flex flex-col items-center justify-center gap-1 py-3 rounded-xl bg-white/8 hover:bg-white/12 border border-white/10 text-xs font-semibold text-foreground active:scale-[0.98] transition-all"
              >
                <Hotel className="w-4 h-4 text-fuchsia-300" /> Hotels
              </button>
              <button
                onClick={() => setTravelSearchMode('car')}
                className="flex flex-col items-center justify-center gap-1 py-3 rounded-xl bg-white/8 hover:bg-white/12 border border-white/10 text-xs font-semibold text-foreground active:scale-[0.98] transition-all"
              >
                <Car className="w-4 h-4 text-emerald-300" /> Cars
              </button>
            </div>
          </div>
        </div>

        {/* Route Explorer Globe */}
        <button
          onClick={openRouteExplorer}
          className="w-full group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-blue-500/15 via-white/[0.04] to-purple-500/15 backdrop-blur-xl p-4 text-left active:scale-[0.99] transition-all hover:border-white/20"
        >
          <div className="pointer-events-none absolute -top-10 -right-10 w-40 h-40 rounded-full bg-blue-500/20 blur-3xl group-hover:bg-blue-500/30 transition-all" />
          <div className="relative flex items-center gap-4">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 border border-white/15 flex items-center justify-center shrink-0">
              <Earth className="w-5 h-5 text-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-foreground text-sm truncate">Route Explorer Globe</h3>
              <p className="text-xs text-muted-foreground truncate">3,900+ airports · live route arcs</p>
            </div>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground border border-white/15 rounded-full px-2.5 py-1 shrink-0">Open</span>
          </div>
        </button>

      </div>


      {/* Modals */}
      <VisitedCountriesModal
        isOpen={showVisitedModal}
        onClose={() => setShowVisitedModal(false)}
        visitedCountries={visitedCountries}
      />
      <PassportDetailsModal
        isOpen={showPassportModal}
        onClose={() => setShowPassportModal(false)}
        userPassportCode={stats.userPassport?.code || null}
        passportScore={stats.passportScore}
        passportRank={stats.userPassport?.passportRank}
        heldVisas={heldVisas}
      />
      <FlightBoardModal
        isOpen={showFlightModal}
        onClose={() => setShowFlightModal(false)}
        airportCode={airportCode}
        airportName={`${airportCode} Airport`}
      />
      <CountryBrowserModal
        isOpen={showCountryBrowser}
        onClose={() => setShowCountryBrowser(false)}
        visitedCountries={visitedCountries}
        onToggleVisited={toggleVisited} // Updated to use prop
      />
      <ContinentModal
        isOpen={showContinentModal}
        onClose={() => setShowContinentModal(false)}
        continentStats={stats.continentStats}
      />
      <TravelSearchModal
        isOpen={travelSearchMode !== null}
        onClose={() => setTravelSearchMode(null)}
        initialMode={travelSearchMode ?? 'flight'}
      />
    </div>
  );
};

export default Dashboard;
