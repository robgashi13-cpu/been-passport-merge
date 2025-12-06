import { Globe, MapPin, Plane, Trophy, Target, TrendingUp } from 'lucide-react';
import StatCard from './StatCard';
import ProgressRing from './ProgressRing';
import ContinentBreakdown from './ContinentBreakdown';
import { TravelStats } from '@/hooks/useTravelData';

import { TripEntry } from '@/data/trips';
import { LevelCard, AchievementList } from './Achievements';

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
    } | null;
  };
  visitedCountries: string[];
}

const Dashboard = ({ stats, visitedCountries }: DashboardProps) => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero Section: Level & Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LevelCard visitedCountries={visitedCountries} />

        <div className="bg-gradient-card rounded-2xl border border-border/50 p-6 flex items-center justify-center min-h-[200px]">
          <ProgressRing
            percentage={stats.percentage}
            visited={stats.visitedCount}
            total={stats.totalCountries}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Countries Visited"
          value={stats.visitedCount}
          subtitle={`of ${stats.totalCountries} countries`}
          icon={MapPin}
          variant="gold"
        />
        <StatCard
          title="World Explored"
          value={`${stats.percentage}%`}
          subtitle="Keep exploring!"
          icon={Globe}
          variant="accent"
        />
        <StatCard
          title="Passport Power"
          value={stats.passportScore}
          subtitle="Visa-free destinations"
          icon={Plane}
        />
        <StatCard
          title="Global Rank"
          value={`#${stats.userPassport?.passportRank || '-'}`}
          subtitle={stats.userPassport?.name || 'Select passport'}
          icon={Trophy}
        />
      </div>

      {/* Continent Breakdown */}
      <ContinentBreakdown continentStats={stats.continentStats} />

      {/* Achievements Teaser */}
      <div className="bg-gradient-card rounded-2xl border border-border/50 p-8 text-center">
        <div className="inline-flex p-4 rounded-2xl bg-primary/10 mb-4">
          <Target className="w-8 h-8 text-primary" />
        </div>
        <h3 className="font-display text-2xl font-semibold mb-2">Set Your Goals</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Add countries to your bucket list and track your progress toward visiting them all.
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-primary">
          <TrendingUp className="w-4 h-4" />
          <span>Start exploring the Countries tab</span>
        </div>
      </div>

      {/* Achievements */}
      <AchievementList visitedCountries={visitedCountries} />
    </div>
  );
};

export default Dashboard;
