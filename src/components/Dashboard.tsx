import StatCard from './StatCard';
import { MapPin, Globe, Trophy, Shield, Bell, BellOff, LayoutGrid, X } from 'lucide-react';

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
  const safetyScore = currentCountry?.safetyScore || 83; // Fallback to global average

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
    <div className="space-y-6 pb-4 animate-fade-in relative z-0">
      <GeoPassport />

      {/* Level Card */}
      <LevelCard visitedCountries={visitedCountries} />

      {/* Stats Merged Card */}
      <div className="bg-gradient-card rounded-2xl border border-border/50 p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">

          {/* Progress Ring - Clickable - Smaller size */}
          <div
            onClick={() => setShowCountryBrowser(true)}
            className="cursor-pointer hover:scale-105 transition-transform flex flex-col items-center justify-center p-2"
          >
            <ProgressRing
              percentage={stats.percentage}
              visited={stats.visitedCount}
              total={stats.totalCountries}
              size={80}
            />
          </div>

          {/* Divider (Desktop Only) */}
          <div className="hidden sm:block w-px h-16 bg-border/20" />

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-2 w-full sm:w-auto">

            {/* Countries Visited */}
            <div
              onClick={() => setShowVisitedModal(true)}
              className="cursor-pointer hover:bg-white/5 dark:hover:bg-white/5 hover:bg-black/5 rounded-xl p-3 transition-colors flex flex-col items-center sm:items-start text-center sm:text-left"
            >
              <div className="flex items-center gap-1 text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-1">
                <MapPin className="w-3 h-3" />
                <span>Countries</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="font-display font-bold text-2xl text-foreground">{stats.visitedCount}</span>
                <span className="text-xs text-muted-foreground font-medium">/{stats.totalCountries}</span>
              </div>
            </div>

            {/* Continents Unlocked */}
            <div
              onClick={() => setShowContinentModal(true)}
              className="cursor-pointer hover:bg-white/5 dark:hover:bg-white/5 hover:bg-black/5 rounded-xl p-3 transition-colors flex flex-col items-center sm:items-start text-center sm:text-left"
            >
              <div className="flex items-center gap-1 text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-1">
                <Globe className="w-3 h-3" />
                <span>Continents</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="font-display font-bold text-2xl text-foreground">{unlockedContinentCount}</span>
                <span className="text-xs text-muted-foreground font-medium">/{totalContinents}</span>
              </div>
            </div>

            {/* Passport Power */}
            <div
              onClick={() => setShowPassportModal(true)}
              className="cursor-pointer hover:bg-white/5 dark:hover:bg-white/5 hover:bg-black/5 rounded-xl p-3 transition-colors flex flex-col items-center sm:items-start text-center sm:text-left"
            >
              <div className="flex items-center gap-1 text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-1">
                <Trophy className="w-3 h-3" />
                <span>Passport</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="font-display font-bold text-2xl text-foreground">{stats.userPassport?.passportRank || '-'}</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight truncate max-w-[80px]">{stats.userPassport?.name || 'Select'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Safety Widget (Moved Below Stats) */}
      <SafetyWidget
        countryName={location.countryName || currentCountry?.name || "Detecting..."}
        safetyScore={safetyScore}
        safetyRank={safetyRank}
        nightScore={nightScore}
        personalScore={personalScore}
        womenScore={womenScore}
      />

      {/* Local Airport Traffic Button */}
      <button
        onClick={() => setShowFlightModal(true)}
        className="bg-gradient-card rounded-2xl border border-border/50 p-4 hover-lift flex items-center justify-between group cursor-pointer w-full text-left"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
            <span className="text-2xl">✈️</span>
          </div>
          <div>
            <h3 className="font-bold text-foreground group-hover:text-blue-400 transition-colors">Local Airport Traffic</h3>
            <p className="text-sm text-muted-foreground">View live flights from Pristina (PRN)</p>
          </div>
        </div>
        <div className="bg-secondary p-2 rounded-full group-hover:bg-blue-500/20 transition-colors">
          <Globe className="w-5 h-5 text-muted-foreground group-hover:text-blue-400" />
        </div>
      </button>

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
