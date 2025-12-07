import { getTopDestinations, PopularDestination } from '@/data/destinations';
import { getCountryByCode } from '@/data/countries';
import { MapPin, Star, Calendar, DollarSign, TrendingUp, Sparkles, Plane, Globe, ArrowRight, Users } from 'lucide-react';

interface ExploreDestinationsProps {
    onCountryClick?: (countryCode: string) => void;
}

export const ExploreDestinations = ({ onCountryClick }: ExploreDestinationsProps) => {
    const topDestinations = getTopDestinations(12);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500/20 via-pink-500/10 to-orange-500/20 border border-white/10 p-6 md:p-8">
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-pink-500/20 rounded-full blur-3xl" />

                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
                        <span className="text-sm text-yellow-400 font-medium uppercase tracking-wider">Trending 2025</span>
                    </div>

                    <h2 className="font-display text-3xl md:text-5xl font-bold mb-2">
                        Explore the <span className="text-gradient-white">World</span>
                    </h2>
                    <p className="text-muted-foreground text-sm md:text-base max-w-lg">
                        Discover the most popular destinations travelers are visiting this year
                    </p>

                    <div className="flex items-center gap-4 mt-6">
                        <div className="flex -space-x-2">
                            {topDestinations.slice(0, 4).map((d, i) => (
                                <div
                                    key={d.id}
                                    className="w-10 h-10 rounded-full bg-gradient-card border-2 border-background flex items-center justify-center text-xl"
                                    style={{ zIndex: 4 - i }}
                                >
                                    {d.image}
                                </div>
                            ))}
                        </div>
                        <span className="text-sm text-muted-foreground">+{topDestinations.length} destinations</span>
                    </div>
                </div>
            </div>

            {/* Featured #1 Destination */}
            <div
                className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 p-6 hover-lift cursor-pointer"
                onClick={() => onCountryClick?.(topDestinations[0].countryCode)}
            >
                <div className="absolute top-3 right-3">
                    <span className="bg-yellow-500 text-black text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                        <Star className="w-3 h-3 fill-current" /> #1 Destination
                    </span>
                </div>

                <div className="flex flex-col md:flex-row items-start gap-6">
                    <div className="text-7xl md:text-8xl group-hover:scale-110 transition-transform duration-300">
                        {topDestinations[0].image}
                    </div>
                    <div className="flex-1">
                        <h3 className="font-display text-2xl md:text-3xl font-bold">{topDestinations[0].cityName}</h3>
                        <p className="text-muted-foreground flex items-center gap-2 mt-1">
                            <span className="text-xl">{getCountryByCode(topDestinations[0].countryCode)?.flagEmoji}</span>
                            {topDestinations[0].countryName}
                        </p>
                        <p className="text-sm text-muted-foreground mt-3">{topDestinations[0].description}</p>

                        <div className="flex flex-wrap gap-2 mt-4">
                            {topDestinations[0].highlights.map((h, i) => (
                                <span key={i} className="text-xs bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">
                                    {h}
                                </span>
                            ))}
                        </div>

                        <div className="flex items-center gap-6 mt-4 text-sm">
                            <span className="flex items-center gap-1 text-green-400">
                                <Calendar className="w-4 h-4" />
                                {topDestinations[0].bestMonth}
                            </span>
                            <span className="flex items-center gap-1 text-yellow-400">
                                <DollarSign className="w-4 h-4" />
                                {topDestinations[0].averageCost}
                            </span>
                        </div>
                    </div>
                    <ArrowRight className="hidden md:block w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3">
                <div className="bg-gradient-card rounded-xl p-4 text-center hover-lift flex flex-col justify-center">
                    <Globe className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                    <div className="font-display text-2xl font-bold">{topDestinations.length}</div>
                    <div className="text-xs text-muted-foreground">Top Cities</div>
                </div>
                <div className="bg-gradient-card rounded-xl p-4 text-center hover-lift flex flex-col justify-center">
                    <TrendingUp className="w-6 h-6 text-green-400 mx-auto mb-2" />
                    <div className="font-display text-2xl font-bold">2025</div>
                    <div className="text-xs text-muted-foreground">Trending Now</div>
                </div>
                <div className="bg-gradient-card rounded-xl p-4 text-center hover-lift flex flex-col justify-center">
                    <Plane className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                    <div className="font-display text-2xl font-bold">12+</div>
                    <div className="text-xs text-muted-foreground">Countries</div>
                </div>
            </div>

            {/* Destination Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {topDestinations.slice(1).map((destination, idx) => (
                    <DestinationCard
                        key={destination.id}
                        destination={destination}
                        rank={idx + 2}
                        onClick={() => onCountryClick?.(destination.countryCode)}
                    />
                ))}
            </div>
        </div>
    );
};

interface DestinationCardProps {
    destination: PopularDestination;
    rank: number;
    onClick?: () => void;
}

const DestinationCard = ({ destination, rank, onClick }: DestinationCardProps) => {
    const country = getCountryByCode(destination.countryCode);

    return (
        <div
            className="group bg-gradient-card rounded-xl border border-border/50 p-4 hover-lift cursor-pointer transition-all hover:border-white/30"
            onClick={onClick}
        >
            <div className="flex items-start gap-3">
                <div className="text-4xl group-hover:scale-110 transition-transform">
                    {destination.image}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h4 className="font-bold truncate">{destination.cityName}</h4>
                        <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full">#{rank}</span>
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <span>{country?.flagEmoji}</span>
                        {destination.countryName}
                    </p>
                </div>
            </div>

            <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {destination.bestMonth}
                </span>
                <span className="flex items-center gap-1 text-yellow-400">
                    <Users className="w-3 h-3" />
                    {destination.visitorCount} visitors
                </span>
            </div>

            <div className="flex flex-wrap gap-1 mt-2">
                {destination.highlights.slice(0, 2).map((h, i) => (
                    <span key={i} className="text-xs bg-white/5 px-2 py-0.5 rounded-full truncate">
                        {h}
                    </span>
                ))}
            </div>
        </div>
    );
};
