import { useState, useEffect } from 'react';
import { Shield, Moon, User, Heart, X, ChevronRight, Globe, Trophy } from 'lucide-react';
import { createPortal } from 'react-dom';
import { countries } from '@/data/countries';

interface SafetyWidgetProps {
    countryName: string;
    safetyScore: number;
    safetyRank?: number; // Global Gallup Law and Order ranking
    nightScore: number;
    personalScore: number;
    womenScore: number;
}

export const SafetyWidget = ({
    countryName = "Current Location",
    safetyScore = 67,
    safetyRank,
    nightScore = 56,
    personalScore = 50,
    womenScore = 75
}: SafetyWidgetProps) => {
    const [showModal, setShowModal] = useState(false);
    const [activeTab, setActiveTab] = useState<'score' | 'rankings'>('score');

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

    // Compute rankings on the fly
    const sortedCountries = [...countries]
        .filter(c => c.safetyScore !== undefined)
        .sort((a, b) => (b.safetyScore || 0) - (a.safetyScore || 0));

    const getScoreColor = (score: number) => {
        if (score >= 80) return "text-green-500";
        if (score >= 60) return "text-lime-500";
        if (score >= 40) return "text-yellow-500";
        return "text-red-500";
    };

    const getProgressColor = (score: number) => {
        if (score >= 80) return "bg-green-500";
        if (score >= 60) return "bg-lime-500";
        if (score >= 40) return "bg-yellow-500";
        return "bg-red-500";
    };

    return (
        <>
            <div
                onClick={() => setShowModal(true)}
                className="bg-gradient-card rounded-2xl border border-white/10 p-4 cursor-pointer active:scale-95 transition-transform hover-lift min-h-[140px] flex flex-col"
            >
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-white/60 font-medium text-sm">
                        <Shield className="w-4 h-4" />
                        <span>Safety Score</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/30" />
                </div>

                <div className="text-xs text-white/50 truncate mb-1 flex items-center gap-2">
                    {countryName}
                    {safetyRank && (
                        <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full text-[10px] font-medium">
                            #{safetyRank} in World
                        </span>
                    )}
                </div>

                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className={`text-4xl font-bold ${getScoreColor(safetyScore)}`}>{safetyScore}</div>
                        <div className="text-xs text-white/40 mt-1">
                            {safetyScore >= 90 ? 'Very Safe' : safetyScore >= 80 ? 'Safe' : safetyScore >= 70 ? 'Above Average' : safetyScore >= 60 ? 'Moderate' : 'Use Caution'}
                        </div>
                    </div>
                </div>

                <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-1000 ${getProgressColor(safetyScore)}`}
                        style={{ width: `${safetyScore}%` }}
                    />
                </div>
            </div>

            {showModal && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        onClick={() => setShowModal(false)}
                    />
                    <div className="relative bg-[#0a0a0a] w-full max-w-md max-h-[85vh] rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col animate-zoom-in">
                        {/* Header */}
                        <div className="bg-white/5 p-4 flex items-center justify-between border-b border-white/10 flex-shrink-0">
                            <div>
                                <h3 className="font-display font-bold text-xl text-white">Safety Score</h3>
                                <p className="text-xs text-white/40">Global Safety Index 2024</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/10 rounded-full">
                                <X className="w-5 h-5 text-white/60" />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-white/10">
                            <button
                                onClick={() => setActiveTab('score')}
                                className={`flex-1 py-3 text-sm font-medium transition-colors relative ${activeTab === 'score' ? 'text-white' : 'text-white/40 hover:text-white/60'}`}
                            >
                                Overview
                                {activeTab === 'score' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-white" />}
                            </button>
                            <button
                                onClick={() => setActiveTab('rankings')}
                                className={`flex-1 py-3 text-sm font-medium transition-colors relative ${activeTab === 'rankings' ? 'text-white' : 'text-white/40 hover:text-white/60'}`}
                            >
                                All Rankings
                                {activeTab === 'rankings' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-white" />}
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-4 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
                            {activeTab === 'score' ? (
                                <>
                                    {/* Location Card */}
                                    <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex items-center justify-between">
                                        <div>
                                            <h4 className="font-bold text-white">{countryName}</h4>
                                            <p className="text-white/50 text-sm">Current Country</p>
                                        </div>
                                        {safetyRank && (
                                            <div className="text-right">
                                                <div className="text-2xl font-bold text-white">#{safetyRank}</div>
                                                <div className="text-xs text-white/40">Global Rank</div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Main Score */}
                                    <div className="bg-gradient-card p-6 rounded-2xl border border-white/10 text-center">
                                        <h4 className="font-bold text-lg text-white mb-4">Law & Order Score</h4>
                                        <div className={`text-6xl font-display font-bold ${getScoreColor(safetyScore)}`}>{safetyScore}</div>
                                        <div className="text-white/50 font-medium mt-2">
                                            {safetyScore >= 90 ? 'Very Safe' : safetyScore >= 80 ? 'Safe' : safetyScore >= 70 ? 'Above Average' : safetyScore >= 60 ? 'Moderate' : 'Use Caution'}
                                        </div>
                                        <div className="mt-4 h-2 bg-white/10 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${getProgressColor(safetyScore)}`}
                                                style={{ width: `${safetyScore}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-white/30 mt-3">Out of 100 (Global avg: 83)</p>
                                    </div>

                                    {/* Night Safety */}
                                    <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
                                            <Moon className="w-5 h-5 text-white/50" />
                                        </div>
                                        <div className="flex-grow">
                                            <h4 className="font-bold text-white">Safety at Night</h4>
                                            <p className="text-xs text-white/40 mt-0.5">After dark safety score</p>
                                        </div>
                                        <div className={`text-2xl font-bold ${getScoreColor(nightScore)}`}>{nightScore}</div>
                                    </div>

                                    {/* Personal Safety */}
                                    <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
                                            <User className="w-5 h-5 text-white/50" />
                                        </div>
                                        <div className="flex-grow">
                                            <h4 className="font-bold text-white">Personal Safety</h4>
                                            <p className="text-xs text-white/40 mt-0.5">Physical security score</p>
                                        </div>
                                        <div className={`text-2xl font-bold ${getScoreColor(personalScore)}`}>{personalScore}</div>
                                    </div>

                                    {/* Women Safety */}
                                    <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
                                            <Heart className="w-5 h-5 text-white/50" />
                                        </div>
                                        <div className="flex-grow">
                                            <h4 className="font-bold text-white">Safety for Women</h4>
                                            <p className="text-xs text-white/40 mt-0.5">Equality and safety score</p>
                                        </div>
                                        <div className={`text-2xl font-bold ${getScoreColor(womenScore)}`}>{womenScore}</div>
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-2">
                                    {sortedCountries.length > 0 ? (
                                        sortedCountries.map((country, index) => (
                                            <div key={country.code} className={`p-3 rounded-xl border flex items-center gap-4 ${country.name === countryName ? 'bg-white/10 border-white/30' : 'bg-transparent border-white/5 hover:bg-white/5'}`}>
                                                <div className="font-display font-bold text-white/40 w-8 text-center">#{index + 1}</div>
                                                <div className="text-2xl">{country.flagEmoji}</div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-white truncate">{country.name}</div>
                                                    <div className="text-xs text-white/40">{country.continent}</div>
                                                </div>
                                                <div className={`font-bold ${getScoreColor(country.safetyScore || 0)}`}>{country.safetyScore}</div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-12 text-white/40">
                                            No ranking data available
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};
