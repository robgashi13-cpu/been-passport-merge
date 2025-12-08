import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X, Calendar, DollarSign, MapPin, Sun, Cloud, Droplets, Thermometer, ArrowRight, Sparkles } from "lucide-react";
import { PopularDestination } from "@/data/destinations";
import { getCountryByCode } from "@/data/countries";

interface ExploreCityModalProps {
    isOpen: boolean;
    onClose: () => void;
    destination: PopularDestination & { imageUrl?: string } | null;
}

export const ExploreCityModal = ({ isOpen, onClose, destination }: ExploreCityModalProps) => {
    if (!destination) return null;

    const country = getCountryByCode(destination.countryCode);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[90vw] h-[85vh] md:max-w-2xl md:h-[85vh] p-0 border border-white/10 bg-[#0a0a0a] text-white overflow-hidden flex flex-col rounded-[2rem] shadow-2xl backdrop-blur-xl gap-0">
                {/* Close Button (Absolute) */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-colors"
                >
                    <X className="w-5 h-5 text-white" />
                    <span className="sr-only">Close</span>
                </button>

                {/* Hero Header */}
                <div className="relative h-[40%] flex-shrink-0">
                    <img
                        src={destination.imageUrl || `https://source.unsplash.com/1600x900/?${destination.cityName},landmark`}
                        alt={destination.cityName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null;
                            target.src = `https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=1000`;
                        }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/20 to-transparent" />

                    <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                        <div className="flex items-center gap-2 mb-2 animate-fade-in">
                            <span className="text-2xl shadow-black drop-shadow-md">{country?.flagEmoji}</span>
                            <span className="text-sm font-bold text-white/90 uppercase tracking-widest bg-black/30 backdrop-blur-md px-2 py-1 rounded-md border border-white/10">{country?.name}</span>
                        </div>
                        <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-1 animate-slide-up shadow-black drop-shadow-lg leading-tight">
                            {destination.cityName}
                        </h2>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 md:p-8 space-y-8 bg-[#0a0a0a] custom-scrollbar">

                    {/* Quick Stats Row */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/5 border border-white/5 p-3 rounded-xl backdrop-blur-sm flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
                                <Calendar className="w-4 h-4 text-sky-400" />
                            </div>
                            <div>
                                <div className="text-white/40 text-[10px] uppercase tracking-wider font-bold">Best Time</div>
                                <div className="text-sm font-bold text-white">{destination.bestMonth}</div>
                            </div>
                        </div>
                        <div className="bg-white/5 border border-white/5 p-3 rounded-xl backdrop-blur-sm flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
                                <DollarSign className="w-4 h-4 text-emerald-400" />
                            </div>
                            <div>
                                <div className="text-white/40 text-[10px] uppercase tracking-wider font-bold">Cost</div>
                                <div className="text-sm font-bold text-white">{destination.averageCost}</div>
                            </div>
                        </div>
                        <div className="bg-white/5 border border-white/5 p-3 rounded-xl backdrop-blur-sm flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
                                <Thermometer className="w-4 h-4 text-orange-400" />
                            </div>
                            <div>
                                <div className="text-white/40 text-[10px] uppercase tracking-wider font-bold">Weather</div>
                                <div className="text-sm font-bold text-white">24°C Avg</div>
                            </div>
                        </div>
                        <div className="bg-white/5 border border-white/5 p-3 rounded-xl backdrop-blur-sm flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
                                <MapPin className="w-4 h-4 text-purple-400" />
                            </div>
                            <div>
                                <div className="text-white/40 text-[10px] uppercase tracking-wider font-bold">Visitors</div>
                                <div className="text-sm font-bold text-white">{destination.visitorCount}</div>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <h3 className="font-display text-xl font-bold text-white mb-3 flex items-center gap-2">
                            <Sun className="w-5 h-5 text-yellow-400" /> About
                        </h3>
                        <p className="text-white/70 leading-relaxed text-sm bg-white/5 p-4 rounded-2xl border border-white/5">
                            {destination.description}
                        </p>
                    </div>

                    {/* Highlights */}
                    <div>
                        <h3 className="font-display text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-indigo-400" /> Why Visit?
                        </h3>
                        <div className="grid grid-cols-1 gap-2">
                            {destination.highlights.map((highlight, i) => (
                                <div key={i} className="flex items-center gap-3 bg-white/5 border border-white/5 p-3 rounded-xl hover:bg-white/10 transition-colors">
                                    <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                                        <ArrowRight className="w-3 h-3 text-blue-400" />
                                    </div>
                                    <span className="text-white/80 text-sm font-medium">{highlight}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="h-4" /> {/* Spacer */}
                </div>
            </DialogContent>
        </Dialog>
    );
};
