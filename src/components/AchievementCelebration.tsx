import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Trophy, Sparkles, X } from 'lucide-react';
import { Achievement, ACHIEVEMENTS } from './Achievements';

interface AchievementCelebrationProps {
    achievement: Achievement | null;
    onClose: () => void;
    duration?: number;
}

export const AchievementCelebration = ({ achievement, onClose, duration = 3000 }: AchievementCelebrationProps) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (achievement) {
            setIsVisible(true);
            // Auto-close after dynamic duration
            const timer = setTimeout(() => {
                setIsVisible(false);
                setTimeout(onClose, 300);
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [achievement, onClose, duration]);

    if (!achievement) return null;

    const Icon = achievement.icon;

    return createPortal(
        <div
            className={`fixed inset-0 z-[10000] flex items-center justify-center p-4 transition-all duration-300 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
                onClick={() => {
                    setIsVisible(false);
                    setTimeout(onClose, 300);
                }}
            />

            {/* Celebration content */}
            <div className={`relative bg-[#0a0a0a] w-full max-w-md rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col transition-all duration-500 ${isVisible ? 'scale-100 translate-y-0 opacity-100' : 'scale-90 translate-y-8 opacity-0'
                }`}>

                {/* Header - Consistent with standard Modals */}
                <div className="bg-white/5 p-4 flex items-center justify-between border-b border-white/10">
                    <div className="flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-yellow-400 animate-bounce" />
                        <h3 className="font-display font-bold text-lg text-white">Achievement Unlocked!</h3>
                    </div>
                    <button
                        onClick={() => {
                            setIsVisible(false);
                            setTimeout(onClose, 300);
                        }}
                        className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-white/60" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 text-center relative overflow-hidden">
                    {/* Glow effect */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl -z-10" />

                    {/* Sparkles decoration */}
                    <div className="absolute top-4 left-4 text-yellow-400/50 animate-pulse">
                        <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="absolute bottom-4 right-4 text-yellow-400/50 animate-pulse" style={{ animationDelay: '0.5s' }}>
                        <Sparkles className="w-4 h-4" />
                    </div>

                    {/* Achievement Icon */}
                    <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                        <Icon className="w-10 h-10 text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.5)]" />
                    </div>

                    {/* Achievement Details */}
                    <h3 className="text-xl font-bold text-white mb-2">{achievement.title}</h3>
                    <p className="text-white/60 text-sm leading-relaxed mb-4">{achievement.description}</p>

                    {/* Celebration message */}
                    <div className="inline-block px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] text-white/60 font-medium">
                        Keep exploring to unlock more!
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

// Hook to track achievement progress with persistence and queue
export const useAchievementTracker = (visitedCountries: string[]) => {
    const [queue, setQueue] = useState<Achievement[]>([]);

    // Ref to track achievements queued in this session to prevent race conditions/duplicates
    const recentlyQueued = useState(() => new Set<string>())[0];

    // Initialize from local storage to prevent re-celebrating
    const [previouslyUnlocked, setPreviouslyUnlocked] = useState<Set<string>>(() => {
        try {
            const saved = localStorage.getItem('celebrated_achievements');
            return saved ? new Set(JSON.parse(saved)) : new Set();
        } catch {
            return new Set();
        }
    });

    useEffect(() => {
        if (visitedCountries.length === 0) return;

        // Get currently unlocked achievements based on rules
        const currentlyUnlocked = ACHIEVEMENTS.filter(a => a.check(visitedCountries));

        const newBatch: Achievement[] = [];
        const nextUnlocked = new Set(previouslyUnlocked);
        let hasNew = false;

        // Check for newly unlocked achievements
        // Double check fresh LocalStorage to be absolutely sure we didn't miss a write or state update
        const freshStorage = localStorage.getItem('celebrated_achievements');
        const freshSet = freshStorage ? new Set(JSON.parse(freshStorage)) : new Set();

        for (const achievement of currentlyUnlocked) {
            // Check against permanent history (State & Storage) AND temporary session queue
            if (!nextUnlocked.has(achievement.id) &&
                !recentlyQueued.has(achievement.id) &&
                !freshSet.has(achievement.id)) {

                newBatch.push(achievement);
                nextUnlocked.add(achievement.id);
                recentlyQueued.add(achievement.id);
                hasNew = true;
            }
        }

        if (hasNew) {
            // Add batch to queue
            setQueue(prev => [...prev, ...newBatch]);

            // Update persistence immediately for all new items
            setPreviouslyUnlocked(nextUnlocked);
            localStorage.setItem('celebrated_achievements', JSON.stringify([...nextUnlocked]));
        }

    }, [visitedCountries, previouslyUnlocked, recentlyQueued]);
    // removed previouslyUnlocked from dependency

    const clearAchievement = () => {
        // Remove first item
        setQueue(prev => prev.slice(1));
    };

    const currentAchievement = queue.length > 0 ? queue[0] : null;
    // Shorter duration if more in queue
    const duration = queue.length > 1 ? 2000 : 3000;

    return {
        newAchievement: currentAchievement,
        clearAchievement,
        duration
    };
};
