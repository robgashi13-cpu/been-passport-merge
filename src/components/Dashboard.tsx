import StatCard from './StatCard';
import { MapPin, Globe, Trophy, Shield, Bell, BellOff } from 'lucide-react';

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
import { AchievementCelebration, useAchievementTracker } from './AchievementCelebration';
import { useState, useMemo } from 'react';
import { useTravelData } from '@/hooks/useTravelData';

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
}

const Dashboard = ({ stats, visitedCountries }: DashboardProps) => {
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

  // Get toggleVisited from travel data
  const { toggleVisited } = useTravelData();

  // Achievement celebration tracker
  const { newAchievement, clearAchievement, duration } = useAchievementTracker(visitedCountries);

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
      {/* Header is global in Index */}
      <GeoPassport />

      {/* Main Stats Area - 2 columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Left Column: Level Card */}
        <LevelCard visitedCountries={visitedCountries} />

        {/* Right Column: Safety + Rank (already merged in SafetyWidget) */}
        <SafetyWidget
          countryName={location.countryName || currentCountry?.name || "Detecting..."}
          safetyScore={safetyScore}
          safetyRank={safetyRank}
          nightScore={nightScore}
          personalScore={personalScore}
          womenScore={womenScore}
        />
      </div>

      {/* Second Row: Stats Merged Card */}
      <div className="bg-gradient-card rounded-2xl border border-white/10 p-4">
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-4">

          {/* Progress Ring - Clickable - Larger size */}
          <div
            onClick={() => setShowCountryBrowser(true)}
            className="cursor-pointer hover:scale-105 transition-transform flex flex-col items-center justify-center sm:block"
          >
            <ProgressRing
              percentage={stats.percentage}
              visited={stats.visitedCount}
              total={stats.totalCountries}
              size={100}
            />
          </div>

          {/* Divider (Desktop Only) */}
          <div className="hidden sm:block w-px h-12 bg-white/10 flex-shrink-0" />

          {/* Countries Visited */}
          <div
            onClick={() => setShowVisitedModal(true)}
            className="flex-1 min-w-[100px] cursor-pointer hover:bg-white/5 rounded-xl p-2 transition-colors flex flex-col justify-center items-center sm:items-start text-center sm:text-left"
          >
            <div className="flex items-center gap-2 text-white/60 text-[10px] uppercase font-bold tracking-wider mb-1">
              <MapPin className="w-3 h-3" />
              <span>Countries</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-display font-bold text-2xl md:text-3xl">{stats.visitedCount}</span>
              <span className="text-xs text-white/40 font-medium">/{stats.totalCountries}</span>
            </div>
          </div>

          {/* Divider (Desktop Only) */}
          <div className="hidden sm:block w-px h-12 bg-white/10 flex-shrink-0" />

          {/* Continents Unlocked (New Section) */}
          <div
            onClick={() => setShowContinentModal(true)}
            className="flex-1 min-w-[100px] cursor-pointer hover:bg-white/5 rounded-xl p-2 transition-colors flex flex-col justify-center items-center sm:items-start text-center sm:text-left h-full"
          >
            <div className="flex items-center gap-2 text-white/60 text-[10px] uppercase font-bold tracking-wider mb-1">
              <Globe className="w-3 h-3" />
              <span>Continents</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-display font-bold text-2xl md:text-3xl">{unlockedContinentCount}</span>
              <span className="text-xs text-white/40 font-medium">/{totalContinents}</span>
            </div>
            {unlockedContinentCount > 0 && (
              <p className="text-[10px] text-white/50 leading-tight mt-1">
                {unlockedContinents.map(c => c.name).join(', ')}
              </p>
            )}
          </div>

          {/* Divider (Desktop Only) */}
          <div className="hidden sm:block w-px h-12 bg-white/10 flex-shrink-0" />

          {/* Passport Power */}
          <div
            onClick={() => setShowPassportModal(true)}
            className="flex-1 min-w-[100px] cursor-pointer hover:bg-white/5 rounded-xl p-2 transition-colors flex flex-col justify-center items-center sm:items-start text-center sm:text-left h-full"
          >
            <div className="flex items-center gap-2 text-white/60 text-xs mb-1">
              <Trophy className="w-3 h-3" />
              <span>Passport</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-display font-bold text-2xl md:text-3xl">#{stats.userPassport?.passportRank || '-'}</span>
            </div>
            <p className="text-xs text-white/40 mt-1 leading-tight">{stats.userPassport?.name || 'Select Passport'}</p>
          </div>
        </div>
      </div>

      {/* Local Airport Traffic Button */}
      <button
        onClick={() => setShowFlightModal(true)}
        className="bg-gradient-card rounded-2xl border border-white/10 p-4 hover-lift flex items-center justify-between group cursor-pointer w-full text-left"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
            <span className="text-2xl">✈️</span>
          </div>
          <div>
            <h3 className="font-bold text-white group-hover:text-blue-400 transition-colors">Local Airport Traffic</h3>
            <p className="text-sm text-muted-foreground">View live flights from Pristina (PRN)</p>
          </div>
        </div>
        <div className="bg-white/10 p-2 rounded-full group-hover:bg-blue-500/20 transition-colors">
          <Globe className="w-5 h-5 text-white/70 group-hover:text-blue-400" />
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
        onToggleVisited={toggleVisited}
      />
      <ContinentModal
        isOpen={showContinentModal}
        onClose={() => setShowContinentModal(false)}
        continentStats={stats.continentStats}
      />

      {/* Achievement Celebration */}
      <AchievementCelebration
        achievement={newAchievement}
        onClose={clearAchievement}
        duration={duration}
      />
    </div>
  );
};

export default Dashboard;
