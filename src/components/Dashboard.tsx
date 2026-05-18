import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  BadgeCheck,
  Bell,
  BellOff,
  ChevronRight,
  Compass,
  Globe,
  LogOut,
  MapPin,
  Plane,
  Trophy,
} from 'lucide-react';
import { getCountryByCode, getSafetyRankByCode } from '@/data/countries';
import { getLevel, getNextLevel, LEVELS } from './Achievements';
import { SafetyWidget } from './SafetyWidget';
import { useSmartLocation } from '@/hooks/useSmartLocation';
import { useLocationNotifications } from '@/hooks/useLocationNotifications';
import { useUser } from '@/contexts/UserContext';
import { VisitedCountriesModal } from './VisitedCountriesModal';
import { PassportDetailsModal } from './PassportDetailsModal';
import { FlightBoardModal } from './FlightBoardModal';
import { CountryBrowserModal } from './CountryBrowserModal';
import { ContinentModal } from './ContinentModal';

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
  toggleVisited: (code: string) => void;
  bucketList: string[];
  heldVisas: string[];
  onCountryClick: (code: string) => void;
}

const Dashboard = ({ stats, visitedCountries, toggleVisited, bucketList, heldVisas }: DashboardProps) => {
  const { location } = useSmartLocation();
  const { logout, isLoggedIn, user } = useUser();
  const [showVisitedModal, setShowVisitedModal] = useState(false);
  const [showPassportModal, setShowPassportModal] = useState(false);
  const [showFlightModal, setShowFlightModal] = useState(false);
  const [showCountryBrowser, setShowCountryBrowser] = useState(false);
  const [showContinentModal, setShowContinentModal] = useState(false);

  const currentCountry = location.countryCode ? getCountryByCode(location.countryCode) : null;
  const safetyScore = currentCountry?.safetyScore || 0;
  const safetyRank = useMemo(() => {
    if (!currentCountry?.safetyScore) return undefined;
    return getSafetyRankByCode(currentCountry.code);
  }, [currentCountry]);

  const { hasPermission, requestPermission, isSupported } = useLocationNotifications(
    location.countryCode,
    location.countryName
  );

  const level = getLevel(stats.visitedCount);
  const nextLevel = getNextLevel(stats.visitedCount);
  const levelIndex = LEVELS.indexOf(level) + 1;
  const levelProgress = nextLevel
    ? Math.min(100, ((stats.visitedCount - level.min) / (nextLevel.min - level.min)) * 100)
    : 100;
  const unlockedContinents = stats.continentStats.filter(continent => continent.visited > 0).length;
  const passportCountry = stats.userPassport?.code ? getCountryByCode(stats.userPassport.code) : null;
  const profileName = user?.name || user?.email?.split('@')[0] || 'Traveler';
  const locationLabel = location.countryName || currentCountry?.name || 'Detecting location';

  const nightScore = Math.max(0, Math.min(100, safetyScore - 8));
  const personalScore = Math.max(0, Math.min(100, safetyScore - 3));
  const womenScore = Math.max(0, Math.min(100, safetyScore + 2));

  const MetricButton = ({
    icon,
    label,
    value,
    detail,
    onClick,
  }: {
    icon: ReactNode;
    label: string;
    value: string | number;
    detail: string;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className="group min-h-[112px] rounded-2xl border border-white/10 bg-white/[0.055] p-4 text-left shadow-[0_18px_60px_rgba(0,0,0,0.22)] transition-all duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.085] active:scale-[0.98]"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-black/20 text-white/70 transition-colors group-hover:text-white">
          {icon}
        </div>
        <ChevronRight className="h-4 w-4 text-white/35 transition-transform group-hover:translate-x-0.5 group-hover:text-white/70" />
      </div>
      <div className="mt-4">
        <div className="font-display text-2xl font-bold leading-none text-white">{value}</div>
        <div className="mt-2 text-[11px] font-bold uppercase tracking-wider text-white/45">{label}</div>
        <div className="mt-1 truncate text-xs text-white/55">{detail}</div>
      </div>
    </button>
  );

  return (
    <div className="space-y-5 pb-20 animate-fade-in">
      <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.12),rgba(255,255,255,0.035))] p-5 shadow-[0_24px_90px_rgba(0,0,0,0.34)]">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

        <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 shadow-inner shadow-white/10">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/18 to-transparent" />
              <span className="relative text-2xl font-bold text-white">
                {profileName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-bold uppercase tracking-wider text-white/45">Profile Dashboard</p>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                  <BadgeCheck className="h-3 w-3" />
                  Level {levelIndex}
                </span>
              </div>
              <h2 className="mt-1 truncate font-display text-3xl font-bold text-white md:text-4xl">
                {profileName}
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-white/60">
                <span className={level.color}>{level.title}</span>
                <span className="h-1 w-1 rounded-full bg-white/30" />
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {locationLabel}
                </span>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {isSupported && (
              <button
                onClick={requestPermission}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition-all duration-300 hover:bg-white/10 hover:text-white active:scale-95"
                aria-label="Travel notifications"
              >
                {hasPermission ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
              </button>
            )}
            {isLoggedIn && (
              <button
                onClick={logout}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition-all duration-300 hover:bg-white/10 hover:text-white active:scale-95"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="relative mt-6 grid gap-3 md:grid-cols-[1.3fr_0.7fr] md:items-end">
          <div>
            <div className="mb-2 flex items-center justify-between text-xs text-white/55">
              <span>{stats.visitedCount} of {stats.totalCountries} countries</span>
              <span>{Math.round(stats.percentage)}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-300 via-emerald-300 to-white transition-all duration-1000 ease-out"
                style={{ width: `${Math.max(4, stats.percentage)}%` }}
              />
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-white/45">
              <span>{nextLevel ? `Next: ${nextLevel.title}` : 'Highest travel level reached'}</span>
              {nextLevel && <span>{Math.round(levelProgress)}% to next level</span>}
            </div>
          </div>

          <button
            onClick={() => setShowPassportModal(true)}
            className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 p-4 text-left transition-all duration-300 hover:border-white/20 hover:bg-white/[0.07] active:scale-[0.98]"
          >
            <div className="min-w-0">
              <div className="text-[11px] font-bold uppercase tracking-wider text-white/40">Passport</div>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xl">{passportCountry?.flagEmoji || '🌐'}</span>
                <span className="truncate text-sm font-semibold text-white">{stats.userPassport?.name || 'Select passport'}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="font-display text-2xl font-bold text-white">#{stats.userPassport?.passportRank || '--'}</div>
              <div className="text-[10px] uppercase tracking-wider text-white/40">Rank</div>
            </div>
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MetricButton
          icon={<MapPin className="h-5 w-5" />}
          label="Countries"
          value={`${stats.visitedCount}/${stats.totalCountries}`}
          detail="Visited places"
          onClick={() => setShowVisitedModal(true)}
        />
        <MetricButton
          icon={<Globe className="h-5 w-5" />}
          label="Continents"
          value={`${unlockedContinents}/${stats.continentStats.length}`}
          detail="Regional coverage"
          onClick={() => setShowContinentModal(true)}
        />
        <MetricButton
          icon={<Trophy className="h-5 w-5" />}
          label="Passport Power"
          value={stats.passportScore || '--'}
          detail={`${bucketList.length} saved destinations`}
          onClick={() => setShowPassportModal(true)}
        />
      </section>

      <section className="grid gap-3 lg:grid-cols-[0.95fr_1.05fr]">
        <SafetyWidget
          countryName={locationLabel}
          safetyScore={safetyScore}
          safetyRank={safetyRank}
          nightScore={nightScore}
          personalScore={personalScore}
          womenScore={womenScore}
          isDetecting={!location.countryCode}
        />

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <button
            onClick={() => setShowFlightModal(true)}
            className="group flex min-h-[140px] items-center justify-between rounded-2xl border border-white/10 bg-white/[0.055] p-5 text-left shadow-[0_18px_60px_rgba(0,0,0,0.22)] transition-all duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.085] active:scale-[0.98]"
          >
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-sky-300/20 bg-sky-400/10 text-sky-200">
                <Plane className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-display text-lg font-bold text-white">Local Airport Traffic</h3>
                <p className="mt-1 text-sm text-white/55">Live PRN departures and arrivals</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-white/35 transition-transform group-hover:translate-x-0.5 group-hover:text-white/70" />
          </button>

          <button
            onClick={() => setShowCountryBrowser(true)}
            className="group flex min-h-[140px] items-center justify-between rounded-2xl border border-white/10 bg-white/[0.055] p-5 text-left shadow-[0_18px_60px_rgba(0,0,0,0.22)] transition-all duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.085] active:scale-[0.98]"
          >
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-400/10 text-emerald-200">
                <Compass className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-display text-lg font-bold text-white">Country Manager</h3>
                <p className="mt-1 text-sm text-white/55">Add, review, and refine your visited countries</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-white/35 transition-transform group-hover:translate-x-0.5 group-hover:text-white/70" />
          </button>
        </div>
      </section>

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
        onToggleVisited={toggleVisited}
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
