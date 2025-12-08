import { Trophy, Medal, Map, Star, Globe2, Plane, Compass, Award, Mountain, Users, Landmark, Crown, X, Sparkles, Heart, Waves, TreesIcon as Trees, Building2, MapPin } from 'lucide-react';
import { Country, countries, getCountryByCode } from '@/data/countries';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

// Level System
export const LEVELS = [
    { min: 0, title: 'Couch Surfer', color: 'text-stone-400', icon: Map, emoji: '🛋️' },
    { min: 5, title: 'Weekend Wanderer', color: 'text-blue-400', icon: Compass, emoji: '🚶' },
    { min: 10, title: 'Backpacker', color: 'text-green-400', icon: Plane, emoji: '🎒' },
    { min: 25, title: 'Frequent Flyer', color: 'text-purple-400', icon: Globe2, emoji: '✈️' },
    { min: 50, title: 'Global Nomad', color: 'text-orange-400', icon: Star, emoji: '🌏' },
    { min: 100, title: 'World Citizen', color: 'text-cyan-400', icon: Trophy, emoji: '👽' }, // Platinum/Diamond look
];

export const getLevel = (count: number) => {
    return [...LEVELS].reverse().find(l => count >= l.min) || LEVELS[0];
};

export const getNextLevel = (count: number) => {
    return LEVELS.find(l => l.min > count) || null;
};

// Countries with special attributes
const MOST_POPULATED = ['CN', 'IN', 'US', 'ID', 'PK', 'BR', 'NG', 'BD', 'RU', 'MX']; // Top 10
const LEAST_POPULATED = ['VA', 'MC', 'SM', 'LI', 'MT', 'IS', 'AD', 'MH', 'SC', 'PW']; // Smallest
const WORLD_WONDERS = ['CN', 'IN', 'EG', 'PE', 'MX', 'IT', 'BR', 'JO']; // 7 wonders locations
const ISLAND_NATIONS = ['MV', 'FJ', 'BS', 'MT', 'CY', 'IS', 'JM', 'PH', 'ID', 'JP', 'NZ', 'AU', 'GB', 'IE'];
const LANDLOCKED = ['CH', 'AT', 'CZ', 'SK', 'HU', 'BY', 'MD', 'RS', 'MK', 'UZ', 'KZ', 'MN', 'LA', 'NP', 'BT', 'AF', 'AM', 'AZ'];
const NORDIC_COUNTRIES = ['NO', 'SE', 'DK', 'FI', 'IS'];
const BALKAN_COUNTRIES = ['AL', 'BA', 'BG', 'HR', 'XK', 'ME', 'MK', 'RO', 'RS', 'SI'];

// Achievement Definitions
export type Achievement = {
    id: string;
    title: string;
    description: string;
    icon: any;
    category: 'milestone' | 'region' | 'special' | 'explorer';
    check: (visited: string[]) => boolean;
};

const getContinentCount = (visited: string[], continent: string) => {
    return visited.filter(code => getCountryByCode(code)?.continent === continent).length;
};

export const ACHIEVEMENTS: Achievement[] = [
    // Milestone Achievements
    {
        id: 'first_step',
        title: 'First Step',
        description: 'Visit your first country',
        icon: Map,
        category: 'milestone',
        check: (v) => v.length >= 1
    },
    {
        id: 'travel_bug',
        title: 'Travel Bug',
        description: 'Visit 10 countries',
        icon: Plane,
        category: 'milestone',
        check: (v) => v.length >= 10
    },
    {
        id: 'explorer',
        title: 'True Explorer',
        description: 'Visit 20 countries',
        icon: Compass,
        category: 'milestone',
        check: (v) => v.length >= 20
    },
    {
        id: 'expert',
        title: 'World Expert',
        description: 'Visit 50 countries',
        icon: Medal,
        category: 'milestone',
        check: (v) => v.length >= 50
    },
    {
        id: 'legend',
        title: 'Living Legend',
        description: 'Visit 100 countries',
        icon: Trophy,
        category: 'milestone',
        check: (v) => v.length >= 100
    },

    // Region Achievements
    {
        id: 'euro_trip',
        title: 'Euro Tripper',
        description: 'Visit 5 European countries',
        icon: Globe2,
        category: 'region',
        check: (v) => getContinentCount(v, 'Europe') >= 5
    },
    {
        id: 'asian_adventurer',
        title: 'Asian Adventurer',
        description: 'Visit 5 Asian countries',
        icon: Award,
        category: 'region',
        check: (v) => getContinentCount(v, 'Asia') >= 5
    },
    {
        id: 'african_explorer',
        title: 'African Explorer',
        description: 'Visit 5 African countries',
        icon: Trees,
        category: 'region',
        check: (v) => getContinentCount(v, 'Africa') >= 5
    },
    {
        id: 'americas_wanderer',
        title: 'Americas Wanderer',
        description: 'Visit 5 countries in the Americas',
        icon: Compass,
        category: 'region',
        check: (v) => getContinentCount(v, 'North America') + getContinentCount(v, 'South America') >= 5
    },
    {
        id: 'nordic_viking',
        title: 'Nordic Viking',
        description: 'Visit all 5 Nordic countries',
        icon: Mountain,
        category: 'region',
        check: (v) => NORDIC_COUNTRIES.every(c => v.includes(c))
    },
    {
        id: 'balkan_explorer',
        title: 'Balkan Explorer',
        description: 'Visit 5 Balkan countries',
        icon: MapPin,
        category: 'region',
        check: (v) => v.filter(c => BALKAN_COUNTRIES.includes(c)).length >= 5
    },
    {
        id: 'continent_hopper',
        title: 'Continent Hopper',
        description: 'Visit 3 different continents',
        icon: Globe2,
        category: 'region',
        check: (v) => {
            const continents = new Set(v.map(code => getCountryByCode(code)?.continent).filter(Boolean));
            return continents.size >= 3;
        }
    },
    {
        id: 'all_continents',
        title: 'Continental Champion',
        description: 'Visit all 6 continents',
        icon: Crown,
        category: 'region',
        check: (v) => {
            const continents = new Set(v.map(code => getCountryByCode(code)?.continent).filter(Boolean));
            return continents.size >= 6;
        }
    },

    // Special Achievements
    {
        id: 'most_populated',
        title: 'Population Giant',
        description: 'Visit one of the top 10 most populated countries',
        icon: Users,
        category: 'special',
        check: (v) => v.some(c => MOST_POPULATED.includes(c))
    },
    {
        id: 'least_populated',
        title: 'Hidden Gem',
        description: 'Visit one of the least populated countries',
        icon: Sparkles,
        category: 'special',
        check: (v) => v.some(c => LEAST_POPULATED.includes(c))
    },
    {
        id: 'world_wonder',
        title: 'Wonder Seeker',
        description: 'Visit a country with a World Wonder',
        icon: Landmark,
        category: 'special',
        check: (v) => v.some(c => WORLD_WONDERS.includes(c))
    },
    {
        id: 'all_wonders',
        title: 'Wonder Collector',
        description: 'Visit all World Wonder countries',
        icon: Crown,
        category: 'special',
        check: (v) => WORLD_WONDERS.every(c => v.includes(c))
    },
    {
        id: 'island_life',
        title: 'Island Life',
        description: 'Visit 3 island nations',
        icon: Waves,
        category: 'special',
        check: (v) => v.filter(c => ISLAND_NATIONS.includes(c)).length >= 3
    },
    {
        id: 'landlocked',
        title: 'Landlocked Lover',
        description: 'Visit 3 landlocked countries',
        icon: Mountain,
        category: 'special',
        check: (v) => v.filter(c => LANDLOCKED.includes(c)).length >= 3
    },
    {
        id: 'city_state',
        title: 'City State Collector',
        description: 'Visit Vatican City, Monaco, or San Marino',
        icon: Building2,
        category: 'special',
        check: (v) => v.some(c => ['VA', 'MC', 'SM'].includes(c))
    },

    // Explorer Achievements
    {
        id: 'speed_traveler',
        title: 'Speed Traveler',
        description: 'Visit 5 countries',
        icon: Plane,
        category: 'explorer',
        check: (v) => v.length >= 5
    },
    {
        id: 'diversified',
        title: 'Diversified',
        description: 'Visit countries on 4 continents',
        icon: Globe2,
        category: 'explorer',
        check: (v) => {
            const continents = new Set(v.map(code => getCountryByCode(code)?.continent).filter(Boolean));
            return continents.size >= 4;
        }
    },
    {
        id: 'halfway',
        title: 'Halfway There',
        description: 'Visit 50% of all countries',
        icon: Star,
        category: 'explorer',
        check: (v) => v.length >= Math.floor(countries.length / 2)
    },
];

interface AchievementsProps {
    visitedCountries: string[];
}

// Achievement List Component (Hoisted)
export const AchievementList = ({ visitedCountries }: AchievementsProps) => {
    const unlocked = ACHIEVEMENTS.filter(a => a.check(visitedCountries));

    // Group achievements by category
    const grouped = ACHIEVEMENTS.reduce((acc, ach) => {
        if (!acc[ach.category]) acc[ach.category] = [];
        acc[ach.category].push(ach);
        return acc;
    }, {} as Record<string, Achievement[]>);

    const categories = [
        { id: 'milestone', label: 'Milestones', icon: Trophy },
        { id: 'region', label: 'Regions', icon: Globe2 },
        { id: 'special', label: 'Special', icon: Star },
        { id: 'explorer', label: 'Explorer', icon: Compass },
    ];

    return (
        <div className="space-y-8">
            <h3 className="font-display text-lg font-bold flex items-center gap-2">
                <Medal className="w-5 h-5 text-yellow-400" />
                Achievements ({unlocked.length}/{ACHIEVEMENTS.length})
            </h3>

            {categories.map(cat => {
                const categoryAchievements = grouped[cat.id] || [];
                if (categoryAchievements.length === 0) return null;

                const categoryUnlocked = categoryAchievements.filter(a => a.check(visitedCountries));

                return (
                    <div key={cat.id} className="space-y-3">
                        <h4 className="flex items-center gap-2 text-sm font-bold text-white/60 uppercase tracking-wider">
                            <cat.icon className="w-4 h-4" />
                            {cat.label} <span className="text-white/50">({categoryUnlocked.length}/{categoryAchievements.length})</span>
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {categoryAchievements.map(ach => {
                                const isUnlocked = ach.check(visitedCountries);
                                return (
                                    <div
                                        key={ach.id}
                                        className={`p-4 rounded-xl flex items-center gap-4 transition-all ${isUnlocked
                                            ? 'bg-gradient-card border border-green-500/30 group hover:bg-white/5'
                                            : 'bg-white/5 border border-white/10 opacity-50 grayscale hover:grayscale-0'
                                            }`}
                                    >
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform ${isUnlocked
                                            ? 'bg-green-500/20 text-green-400 group-hover:scale-110'
                                            : 'bg-white/5 text-white/60'
                                            }`}>
                                            <ach.icon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className={`font-bold ${isUnlocked ? 'text-green-400' : 'text-white/60'}`}>
                                                {ach.title}
                                            </div>
                                            <div className="text-xs text-muted-foreground">{ach.description}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export const LevelCard = ({ visitedCountries }: AchievementsProps) => {
    const [showModal, setShowModal] = useState(false);
    const count = visitedCountries.length;
    const level = getLevel(count);
    const nextLevel = getNextLevel(count);

    const progress = nextLevel
        ? ((count - level.min) / (nextLevel.min - level.min)) * 100
        : 100;

    // Body scroll lock when modal is open
    useEffect(() => {
        if (showModal) {
            document.body.style.overflow = 'hidden';
            document.body.classList.add('modal-open');
        } else {
            document.body.style.overflow = '';
            document.body.classList.remove('modal-open');
        }
        return () => {
            document.body.style.overflow = '';
            document.body.classList.remove('modal-open');
        };
    }, [showModal]);

    return (
        <>
            <div
                onClick={() => setShowModal(true)}
                className="bg-gradient-card rounded-2xl border border-white/10 p-4 relative overflow-hidden min-h-[120px] flex flex-col cursor-pointer hover-lift active:scale-95 transition-transform group"
            >
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-colors" />

                <div className="flex items-center gap-4 mb-3">
                    <div className="text-4xl animate-bounce-slow">
                        {level.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-white/50 font-medium">Current Rank</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded bg-white/5 ${level.color} border border-white/5`}>
                                Lvl {LEVELS.indexOf(level) + 1}
                            </span>
                        </div>
                        <h3 className={`font-display text-xl font-bold ${level.color} truncate`}>{level.title}</h3>
                    </div>
                </div>

                <div className="mt-auto">
                    <div className="flex justify-between text-xs mb-1.5 text-white/60">
                        <span className="font-medium text-white/60">{count} Countries</span>
                        {nextLevel && <span>Next: {nextLevel.title} ({nextLevel.min})</span>}
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-1000 ${level.color.replace('text', 'bg')}`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Achievements Modal */}
            {showModal && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        onClick={() => setShowModal(false)}
                    />
                    <div className="relative bg-[#0a0a0a] w-full max-w-2xl max-h-[85vh] rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col animate-zoom-in">
                        {/* Header */}
                        <div className="bg-white/5 p-4 flex items-center justify-between border-b border-white/10 flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center ${level.color}`}>
                                    <level.icon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className={`font-display font-bold text-xl ${level.color}`}>{level.title}</h3>
                                    <p className="text-sm text-white/50">Level {LEVELS.indexOf(level) + 1} • {count} countries</p>
                                </div>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/10 rounded-full">
                                <X className="w-5 h-5 text-white/60" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-4 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
                            {/* Level Progress */}
                            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-white/60">Progress to next level</span>
                                    {nextLevel ? (
                                        <span className="text-white/80">{count}/{nextLevel.min}</span>
                                    ) : (
                                        <span className="text-yellow-400">Max Level!</span>
                                    )}
                                </div>
                                <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full ${level.color.replace('text', 'bg')}`}
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                                {nextLevel && (
                                    <p className="text-xs text-white/60 mt-2">
                                        {nextLevel.min - count} more countries to become {nextLevel.title}
                                    </p>
                                )}
                            </div>

                            {/* Categorized Achievement List (Reusing AchievementList) */}
                            <AchievementList visitedCountries={visitedCountries} />
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};
