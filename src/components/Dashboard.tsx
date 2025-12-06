import { Globe, MapPin, Plane, Trophy, Target, TrendingUp } from 'lucide-react';
import StatCard from './StatCard';
import ProgressRing from './ProgressRing';
import ContinentBreakdown from './ContinentBreakdown';
import { TravelStats } from '@/hooks/useTravelData';

interface DashboardProps {
  stats: TravelStats;
}

const Dashboard = ({ stats }: DashboardProps) => {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Stats */}
      <div className="text-center py-8">
        <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
          Your Travel <span className="text-gradient-gold">Journey</span>
        </h2>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Track your adventures, discover your passport power, and plan your next destination.
        </p>
      </div>

      {/* Main Progress Ring */}
      <div className="flex justify-center py-8">
        <ProgressRing 
          percentage={stats.percentage} 
          visited={stats.visitedCount} 
          total={stats.totalCountries}
        />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Countries Visited"
          value={stats.visitedCount}
          subtitle={`of ${stats.totalCountries} countries`}
          icon={MapPin}
          variant="gold"
          delay={100}
        />
        <StatCard
          title="World Explored"
          value={`${stats.percentage}%`}
          subtitle="Keep exploring!"
          icon={Globe}
          variant="accent"
          delay={200}
        />
        <StatCard
          title="Passport Power"
          value={stats.passportScore}
          subtitle="Visa-free destinations"
          icon={Plane}
          delay={300}
        />
        <StatCard
          title="Global Rank"
          value={`#${stats.userPassport?.passportRank || '-'}`}
          subtitle={stats.userPassport?.name || 'Select passport'}
          icon={Trophy}
          delay={400}
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
    </div>
  );
};

export default Dashboard;
