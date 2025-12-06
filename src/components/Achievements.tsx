import { Trophy, Medal, Map, Star, Globe2, Plane, Compass, Award } from 'lucide-react';
import { Country, countries, getCountryByCode } from '@/data/countries';

// Level System
export const LEVELS = [
    { min: 0, title: 'Couch Surfer', color: 'text-stone-400', icon: Map },
    { min: 5, title: 'Weekend Wanderer', color: 'text-blue-400', icon: Compass },
    { min: 10, title: 'Backpacker', color: 'text-green-400', icon: Plane },
    { min: 25, title: 'Frequent Flyer', color: 'text-purple-400', icon: Globe2 },
    { min: 50, title: 'Global Nomad', color: 'text-orange-400', icon: Star },
    { min: 100, title: 'World Citizen', color: 'text-yellow-400', icon: Trophy },
];

export const getLevel = (count: number) => {
    return [...LEVELS].reverse().find(l => count >= l.min) || LEVELS[0];
};

export const getNextLevel = (count: number) => {
    return LEVELS.find(l => l.min > count) || null;
};

// Achievement Definitions
export type Achievement = {
    id: string;
    title: string;
    description: string;
    icon: any;
    check: (visited: string[]) => boolean;
};

const getContinentCount = (visited: string[], continent: string) => {
    return visited.filter(code => getCountryByCode(code)?.continent === continent).length;
};

export const ACHIEVEMENTS: Achievement[] = [
    {
        id: 'first_step',
        title: 'First Step',
        description: 'Visit your first country',
        icon: Map,
        check: (v) => v.length >= 1
    },
    {
        id: 'euro_trip',
        title: 'Euro Tripper',
        description: 'Visit 5 European countries',
        icon: Globe2,
        check: (v) => getContinentCount(v, 'Europe') >= 5
    },
    {
        id: 'asian_adventurer',
        title: 'Asian Adventurer',
        description: 'Visit 5 Asian countries',
        icon: Award,
        check: (v) => getContinentCount(v, 'Asia') >= 5
    },
    {
        id: 'travel_bug',
        title: 'Travel Bug',
        description: 'Visit 10 countries',
        icon: Plane,
        check: (v) => v.length >= 10
    },
    {
        id: 'explorer',
        title: 'True Explorer',
        description: 'Visit 20 countries',
        icon: Compass,
        check: (v) => v.length >= 20
    },
    {
        id: 'expert',
        title: 'World Expert',
        description: 'Visit 50 countries',
        icon: Medal,
        check: (v) => v.length >= 50
    },
    {
        id: 'legend',
        title: 'Living Legend',
        description: 'Visit 100 countries',
        icon: Trophy,
        check: (v) => v.length >= 100
    }
];

interface AchievementsProps {
    visitedCountries: string[];
}

export const LevelCard = ({ visitedCountries }: AchievementsProps) => {
    const count = visitedCountries.length;
    const level = getLevel(count);
    const nextLevel = getNextLevel(count);

    const progress = nextLevel
        ? ((count - level.min) / (nextLevel.min - level.min)) * 100
        : 100;

    return (
        <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-2xl border border-indigo-500/20 p-5 relative overflow-hidden h-full flex flex-col justify-center">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl" />

            <div className="flex items-center gap-4 relative z-10">
                <div className={`w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10 ${level.color} shrink-0`}>
                    <level.icon className="w-6 h-6" />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Current Rank</span>
                        <div className={`text-[10px] px-1.5 py-px rounded-full bg-white/5 border border-white/10 ${level.color}`}>
                            Lvl {LEVELS.indexOf(level) + 1}
                        </div>
                    </div>
                    <h3 className={`font-display text-xl font-bold ${level.color} truncate`}>{level.title}</h3>

                    <div className="mt-2.5">
                        <div className="flex justify-between text-[10px] mb-1.5 text-muted-foreground">
                            <span className="font-medium text-white/70">{count} Countries</span>
                            {nextLevel && <span>Next: {nextLevel.title} ({nextLevel.min})</span>}
                        </div>
                        <div className="h-1.5 bg-black/20 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-1000 ${level.color.replace('text', 'bg')}`}
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const AchievementList = ({ visitedCountries }: AchievementsProps) => {
    const unlocked = ACHIEVEMENTS.filter(a => a.check(visitedCountries));
    const locked = ACHIEVEMENTS.filter(a => !a.check(visitedCountries));

    // Show all unlocked + next 3 locked
    const displayLocked = locked.slice(0, 3);

    return (
        <div className="space-y-4">
            <h3 className="font-display text-lg font-bold flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                Achievements ({unlocked.length}/{ACHIEVEMENTS.length})
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {unlocked.map(ach => (
                    <div key={ach.id} className="bg-gradient-card border border-green-500/30 p-4 rounded-xl flex items-center gap-4 group hover:bg-white/5 transition-colors">
                        <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 group-hover:scale-110 transition-transform">
                            <ach.icon className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="font-bold text-green-400">{ach.title}</div>
                            <div className="text-xs text-muted-foreground">{ach.description}</div>
                        </div>
                    </div>
                ))}

                {displayLocked.map(ach => (
                    <div key={ach.id} className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center gap-4 opacity-50 grayscale hover:grayscale-0 transition-all">
                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                            <ach.icon className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="font-bold">{ach.title}</div>
                            <div className="text-xs text-muted-foreground">{ach.description}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
