import StatCard from './StatCard';
import { MapPin, Globe, Trophy, Shield, Bell, BellOff, LayoutGrid, X, LogOut } from 'lucide-react';

import ProgressRing from './ProgressRing';
// Removed: import ContinentBreakdown from './ContinentBreakdown';
import { TripEntry } from '@/data/trips';
import { LevelCard } from './Achievements';
import { GeoPassport } from './GeoPassport';
import { SafetyWidget } from './SafetyWidget';
import { useSmartLocation } from '@/hooks/useSmartLocation';
import { useLocationNotifications } from '@/hooks/useLocationNotifications';
import { getCountryByCode, countries } from '@/data/countries';
import { VisitedCountriesModal } from './VisitedCountriesModal';
import { PassportDetailsModal } from './PassportDetailsModal';
import { FlightBoardModal } from './FlightBoardModal';
import { CountryBrowserModal } from './CountryBrowserModal';
import { ContinentModal } from './ContinentModal';
import { useState, useMemo } from 'react';
import { useTravelData } from '@/hooks/useTravelData';
import { useUser } from '@/contexts/UserContext';
import WorldMap from './WorldMap';
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
  const { logout, isLoggedIn } = useUser();

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
    <div className="flex flex-col min-h-full pb-20 animate-fade-in relative z-0">
      {/* Content */}
      <div className="space-y-4 flex-1 px-1">
        {/* Passport Visual */}
        <GeoPassport />

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
              <MapPin className="w-3 h-3" />
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
              <Globe className="w-3 h-3" />
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
              <Trophy className="w-3 h-3" />
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

        {/* Local Airport Traffic Button */}
        <button
          onClick={() => setShowFlightModal(true)}
          className="bg-gradient-card rounded-2xl border border-border/50 p-4 flex items-center justify-between group cursor-pointer w-full text-left hover:border-border/80 transition-all active:scale-[0.99]"
        >
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-full bg-blue-500/20 flex items-center justify-center">
              <span className="text-xl">✈️</span>
            </div>
            <div>
              <h3 className="font-bold text-foreground text-sm">Local Airport Traffic</h3>
              <p className="text-xs text-muted-foreground">View live flights from Pristina (PRN)</p>
            </div>
          </div>
          <div className="bg-secondary p-2 rounded-full">
            <Globe className="w-4 h-4 text-muted-foreground" />
          </div>
        </button>
      </div>

      {/* Sign Out - Fixed at bottom */}
      <div className="mt-auto pt-6 pb-6 px-1">
        {isLoggedIn && (
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors border border-red-500/20"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        )}
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
        airportCode="PRN"
        airportName="Pristina International"
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
    </div>
  );
};

export default Dashboard;
