import { useState, useMemo } from 'react';
import { TripEntry, calculateDays, calculateDaysByCountry, getCurrentTrips } from '@/data/trips';
import { countries, getCountryByCode } from '@/data/countries';
import { ChevronLeft, ChevronRight, MapPin, Plane, Calendar, Clock } from 'lucide-react';

interface TravelCalendarProps {
    trips: TripEntry[];
}

export const TravelCalendar = ({ trips }: TravelCalendarProps) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    // Get first day of month and total days
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Create calendar days array
    const calendarDays = useMemo(() => {
        const days = [];

        // Add empty cells for days before the first day of month
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push({ day: null, trips: [] as TripEntry[] });
        }

        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentYear, currentMonth, day);

            // Find trips that include this date
            const dayTrips = trips.filter(trip => {
                const start = new Date(trip.startDate);
                const end = new Date(trip.endDate);
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
                date.setHours(12, 0, 0, 0);
                return date >= start && date <= end;
            });

            days.push({ day, trips: dayTrips });
        }

        return days;
    }, [currentYear, currentMonth, trips, firstDayOfMonth, daysInMonth]);

    // Navigation
    const previousMonth = () => {
        setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
    };

    // Current trips
    const activeTrips = getCurrentTrips(trips);
    const daysByCountry = calculateDaysByCountry(trips);
    const totalDays = trips.reduce((sum, trip) => sum + calculateDays(trip), 0);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="text-center py-4">
                <h2 className="font-display text-3xl md:text-4xl font-bold mb-2 animate-slide-up">
                    Travel <span className="text-gradient-white">Calendar</span>
                </h2>
                <p className="text-muted-foreground animate-slide-up" style={{ animationDelay: "0.1s" }}>
                    Track your travel days and see where you've been
                </p>
            </div>

            {/* Currently Traveling Banner */}
            {activeTrips.length > 0 && (
                <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl border border-green-500/30 p-6 animate-pulse-slow">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-green-500/30 flex items-center justify-center">
                            <Plane className="w-6 h-6 text-green-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-green-400">Currently Traveling!</h3>
                            {activeTrips.map((trip, idx) => (
                                <p key={idx} className="text-muted-foreground">
                                    {getCountryByCode(trip.countryCode)?.flagEmoji} {trip.countryName}
                                    {trip.cityName && ` - ${trip.cityName}`}
                                </p>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-card rounded-xl border border-border/50 p-4 text-center hover-lift">
                    <Calendar className="w-6 h-6 text-primary mx-auto mb-2" />
                    <div className="font-display text-2xl font-bold">{totalDays}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Total Days</div>
                </div>
                <div className="bg-gradient-card rounded-xl border border-border/50 p-4 text-center hover-lift">
                    <Plane className="w-6 h-6 text-primary mx-auto mb-2" />
                    <div className="font-display text-2xl font-bold">{trips.length}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Trips</div>
                </div>
                <div className="bg-gradient-card rounded-xl border border-border/50 p-4 text-center hover-lift">
                    <MapPin className="w-6 h-6 text-primary mx-auto mb-2" />
                    <div className="font-display text-2xl font-bold">{Object.keys(daysByCountry).length}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Countries</div>
                </div>
                <div className="bg-gradient-card rounded-xl border border-border/50 p-4 text-center hover-lift">
                    <Clock className="w-6 h-6 text-primary mx-auto mb-2" />
                    <div className="font-display text-2xl font-bold">
                        {trips.length > 0 ? Math.round(totalDays / trips.length) : 0}
                    </div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Avg. Days</div>
                </div>
            </div>

            {/* Calendar */}
            <div className="bg-gradient-card rounded-2xl border border-border/50 p-6 overflow-hidden">
                {/* Month Navigation */}
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={previousMonth}
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h3 className="font-display text-xl font-bold">
                        {monthNames[currentMonth]} {currentYear}
                    </h3>
                    <button
                        onClick={nextMonth}
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>

                {/* Day Headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                    {dayNames.map(day => (
                        <div key={day} className="text-center text-xs text-muted-foreground font-medium py-2">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((dayData, idx) => {
                        const hasTrips = dayData.trips.length > 0;
                        const isToday = dayData.day === new Date().getDate() &&
                            currentMonth === new Date().getMonth() &&
                            currentYear === new Date().getFullYear();

                        return (
                            <div
                                key={idx}
                                className={`
                  aspect-square rounded-lg flex flex-col items-center justify-center p-1 transition-all duration-200 relative
                  ${dayData.day ? 'hover:bg-white/10 cursor-pointer' : ''}
                  ${hasTrips ? 'bg-white/20 ring-1 ring-white/30' : 'bg-white/5'}
                  ${isToday ? 'ring-2 ring-primary' : ''}
                `}
                            >
                                {dayData.day && (
                                    <>
                                        <span className={`text-sm font-medium ${hasTrips ? 'text-white' : 'text-muted-foreground'}`}>
                                            {dayData.day}
                                        </span>
                                        {hasTrips && (
                                            <div className="flex gap-1 mt-1 flex-wrap justify-center">
                                                {dayData.trips.slice(0, 1).map((trip: TripEntry) => {
                                                    const start = new Date(trip.startDate);
                                                    start.setHours(0, 0, 0, 0);
                                                    const current = new Date(currentYear, currentMonth, dayData.day);
                                                    current.setHours(0, 0, 0, 0);
                                                    const diffTime = current.getTime() - start.getTime();
                                                    const dayNum = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

                                                    return (
                                                        <div key={trip.id} className="flex flex-col items-center">
                                                            <span className="text-xs">
                                                                {getCountryByCode(trip.countryCode)?.flagEmoji}
                                                            </span>
                                                            <span className="text-[10px] text-luxury-gold font-bold leading-none">
                                                                {dayNum}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                                {dayData.trips.length > 1 && (
                                                    <span className="text-[10px] text-white/50">+</span>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Days by Country */}
            {Object.keys(daysByCountry).length > 0 && (
                <div className="bg-gradient-card rounded-2xl border border-border/50 p-6">
                    <h3 className="font-display text-lg font-bold mb-4">Days Per Country</h3>
                    <div className="space-y-3">
                        {Object.entries(daysByCountry)
                            .sort(([, a], [, b]) => b - a)
                            .map(([code, days]) => {
                                const country = getCountryByCode(code);
                                const percentage = totalDays > 0 ? (days / totalDays) * 100 : 0;

                                return (
                                    <div key={code} className="space-y-1">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="flex items-center gap-2">
                                                <span className="text-lg">{country?.flagEmoji}</span>
                                                <span className="font-medium">{country?.name || code}</span>
                                            </span>
                                            <span className="text-muted-foreground">{days} days</span>
                                        </div>
                                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-white/60 to-white/90 rounded-full transition-all duration-500"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {trips.length === 0 && (
                <div className="bg-gradient-card rounded-2xl border border-border/50 p-12 text-center">
                    <div className="text-6xl mb-4">🌍</div>
                    <h3 className="font-display text-xl font-bold mb-2">No trips yet</h3>
                    <p className="text-muted-foreground">
                        Import photos with location data to see your travel history on the calendar
                    </p>
                </div>
            )}
        </div>
    );
};
