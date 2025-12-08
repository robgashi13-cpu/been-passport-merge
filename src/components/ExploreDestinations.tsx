import { useState, useMemo } from 'react';
import { getTopDestinations, PopularDestination } from '@/data/destinations';
import { getCountryByCode } from '@/data/countries';
import { citiesByCountry } from '@/data/cities';
import { MapPin, Star, Calendar, DollarSign, TrendingUp, Sparkles, Plane, Globe, ArrowRight, Users, Navigation } from 'lucide-react';
import { ExploreCityModal } from './ExploreCityModal'; // Import new modal

interface ExploreDestinationsProps {
    onCountryClick?: (countryCode: string) => void;
}

export const ExploreDestinations = ({ onCountryClick }: ExploreDestinationsProps) => {
    const [selectedCity, setSelectedCity] = useState<(PopularDestination & { imageUrl?: string }) | null>(null);

    // Enrich destinations with real images from cities.ts
    const topDestinations = useMemo(() => {
        const raw = getTopDestinations(12);
        return raw.map(dest => {
            const countryCities = citiesByCountry[dest.countryCode] || [];
            const cityData = countryCities.find(c => c.name === dest.cityName);
            return {
                ...dest,
                imageUrl: cityData?.imageUrl
            };
        });
    }, []);

    const featured = topDestinations[0];

    const handleCityClick = (city: PopularDestination & { imageUrl?: string }) => {
        setSelectedCity(city);
    };

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 p-8 md:p-12 min-h-[400px] flex flex-col justify-end group cursor-pointer transition-all hover:border-white/20"
                onClick={() => handleCityClick(featured)}>

                {/* Background Image */}
                <div className="absolute inset-0 z-0">
                    <img
                        src={featured.imageUrl || "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=2613&auto=format&fit=crop"}
                        alt={featured.cityName}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                </div>

                <div className="relative z-10 animate-slide-up">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white border border-white/20 flex items-center gap-1.5 shadow-lg">
                            <Sparkles className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                            #1 Trending Destination 2025
                        </span>
                    </div>

                    <h2 className="font-display text-5xl md:text-7xl font-bold text-white mb-2 tracking-tight">
                        {featured.cityName}
                    </h2>
                    <div className="flex items-center gap-3 text-white/80 mb-6 text-lg">
                        <span className="text-2xl">{getCountryByCode(featured.countryCode)?.flagEmoji}</span>
                        <span className="font-medium">{featured.countryName}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
                        <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /> {featured.visitorCount} visitors</span>
                    </div>

                    <p className="text-white/70 max-w-xl text-lg mb-8 leading-relaxed line-clamp-2">
                        {featured.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-3">
                        {featured.highlights.map((h, i) => (
                            <span key={i} className="bg-white/10 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-xl text-sm text-white/90 hover:bg-white/20 transition-colors">
                                {h}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Quick Stats Grid - Removed per user request */}

            {/* Destination Grid */}
            <div>
                <h3 className="font-display text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Navigation className="w-5 h-5 text-sky-400" />
                    Popular Destinations
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {topDestinations.slice(1).map((destination, idx) => (
                        <DestinationCard
                            key={destination.id}
                            destination={destination}
                            rank={idx + 2}
                            onClick={() => handleCityClick(destination)}
                        />
                    ))}
                </div>
            </div>

            {/* Fullscreen City Modal */}
            <ExploreCityModal
                isOpen={!!selectedCity}
                onClose={() => setSelectedCity(null)}
                destination={selectedCity}
            />
        </div>
    );
};

interface DestinationCardProps {
    destination: PopularDestination & { imageUrl?: string };
    rank: number;
    onClick?: () => void;
}

const DestinationCard = ({ destination, rank, onClick }: DestinationCardProps) => {
    const country = getCountryByCode(destination.countryCode);

    return (
        <div
            className="group relative h-[320px] rounded-3xl overflow-hidden cursor-pointer border border-white/5 hover:border-white/20 transition-all duration-500 shadow-2xl"
            onClick={onClick}
        >
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
                <img
                    src={destination.imageUrl || `https://source.unsplash.com/1600x900/?${destination.cityName},landmark`}
                    alt={destination.cityName}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null; // Prevent infinite loop
                        // Fallback to a reliable source
                        target.src = `https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=1000&auto=format&fit=crop`;
                        // Or try dynamic again if needed, but static high-quality fallback is safer for "no empty icon"
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90 group-hover:opacity-80 transition-opacity" />
            </div>

            <div className="absolute inset-0 p-6 flex flex-col justify-end z-10">
                <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-white/80 uppercase tracking-wider flex items-center gap-1.5">
                            <span className="text-lg">{country?.flagEmoji}</span>
                            {destination.countryName}
                        </span>
                        <div className="bg-white/10 backdrop-blur-md px-2 py-0.5 rounded-lg border border-white/10 text-xs text-white font-medium flex items-center gap-1.5">
                            <Users className="w-3 h-3 text-white/70" />
                            {destination.visitorCount}
                        </div>
                    </div>

                    <h4 className="font-display text-3xl font-bold text-white mb-3 shadow-black drop-shadow-lg">{destination.cityName}</h4>

                    <div className="space-y-3 opacity-80 group-hover:opacity-100 transition-opacity delay-75">
                        <div className="flex items-center gap-4 text-xs font-medium text-white/90">
                            <span className="flex items-center gap-1 bg-black/20 backdrop-blur-sm px-2 py-1 rounded-md">
                                <Calendar className="w-3.5 h-3.5 text-sky-300" />
                                {destination.bestMonth}
                            </span>
                            <span className="flex items-center gap-1 bg-black/20 backdrop-blur-sm px-2 py-1 rounded-md">
                                <DollarSign className="w-3.5 h-3.5 text-emerald-300" />
                                {destination.averageCost}
                            </span>
                        </div>

                        <div className="flex flex-wrap gap-1.5 pt-1">
                            {destination.highlights.slice(0, 2).map((h, i) => (
                                <span key={i} className="text-[10px] bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-full text-white border border-white/10">
                                    {h}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
