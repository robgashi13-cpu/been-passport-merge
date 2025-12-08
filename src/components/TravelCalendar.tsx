import { useState, useMemo } from 'react';
import { TripEntry, calculateDays, calculateDaysByCountry, getCurrentTrips } from '@/data/trips';
import { countries, getCountryByCode } from '@/data/countries';
import { ChevronLeft, ChevronRight, MapPin, Plane, Calendar, Clock } from 'lucide-react';

interface TravelCalendarProps {
    trips: TripEntry[];
    onDateClick?: (date: Date) => void;
    onClearAll?: () => void;
}

export const TravelCalendar = ({ trips, onDateClick, onClearAll }: TravelCalendarProps) => {
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
        <div className="space-y-4 animate-fade-in">
            {/* Header - Compact */}
            <div className="text-center py-2">
                <h2 className="font-display text-2xl font-bold mb-1 animate-slide-up">
                    Travel <span className="text-gradient-white">Calendar</span>
                </h2>
                <div className="flex items-center justify-center gap-2 animate-slide-up" style={{ animationDelay: "0.1s" }}>
                    <p className="text-xs text-muted-foreground">
                        Your travel timeline
                    </p>
                    {trips.length > 0 && (
                        <button
                            onClick={() => {
                                if (window.confirm('Are you sure you want to clear all trips? This cannot be undone.')) {
                                    onClearAll?.();
                                }
                            }}
                            className="text-[10px] text-red-400 hover:text-red-300 underline"
                        >
                            Clear All
                        </button>
                    )}
                </div>
            </div>

            {/* Currently Traveling Banner - Compact */}
            {activeTrips.length > 0 && (
                <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl border border-green-500/30 p-3 animate-pulse-slow">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-500/30 flex items-center justify-center">
                            <Plane className="w-4 h-4 text-green-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm text-green-400">Currently Traveling!</h3>
                            {activeTrips.map((trip, idx) => (
                                <p key={idx} className="text-xs text-muted-foreground line-clamp-1">
                                    {getCountryByCode(trip.countryCode)?.flagEmoji} {trip.countryName}
                                </p>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Stats Row - Compact */}
            <div className="grid grid-cols-4 gap-2">
                <div className="bg-gradient-card rounded-lg border border-border/50 p-2 text-center">
                    <div className="font-display text-lg font-bold">{totalDays}</div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Days</div>
                </div>
                <div className="bg-gradient-card rounded-lg border border-border/50 p-2 text-center">
                    <div className="font-display text-lg font-bold">{trips.length}</div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Trips</div>
                </div>
                <div className="bg-gradient-card rounded-lg border border-border/50 p-2 text-center">
                    <div className="font-display text-lg font-bold">{Object.keys(daysByCountry).length}</div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Countries</div>
                </div>
                <div className="bg-gradient-card rounded-lg border border-border/50 p-2 text-center">
                    <div className="font-display text-lg font-bold">
                        {trips.length > 0 ? Math.round(totalDays / trips.length) : 0}
                    </div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Avg</div>
                </div>
            </div>

            {/* Calendar - Compact */}
            <div className="bg-gradient-card rounded-xl border border-border/50 p-3 overflow-hidden">
                {/* Month Navigation */}
                <div className="flex items-center justify-between mb-4">
                    <button
                        onClick={previousMonth}
                        className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <h3 className="font-display text-base font-bold">
                        {monthNames[currentMonth]} {currentYear}
                    </h3>
                    <button
                        onClick={nextMonth}
                        className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>

                {/* Day Headers */}
                <div className="grid grid-cols-7 gap-1 mb-1">
                    {dayNames.map(day => (
                        <div key={day} className="text-center text-[10px] text-muted-foreground font-medium py-1">
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
                                onClick={() => {
                                    if (dayData.day && onDateClick) {
                                        const clickedDate = new Date(currentYear, currentMonth, dayData.day);
                                        // Adjust for timezone offset to avoid previous day issues if treated as UTC
                                        clickedDate.setHours(12, 0, 0, 0);
                                        onDateClick(clickedDate);
                                    }
                                }}
                                className={`
                  aspect-square rounded-md flex flex-col items-center justify-start pt-1 transition-all duration-200 relative
                  ${dayData.day ? 'hover:bg-white/10 cursor-pointer active:scale-95' : ''}
                  ${hasTrips ? 'bg-white/10 ring-1 ring-white/20' : 'bg-white/2'}
                  ${isToday ? 'ring-1 ring-primary' : ''}
                `}
                            >
                                {dayData.day && (
                                    <>
                                        <span className={`text-[10px] font-medium leading-none ${hasTrips ? 'text-white' : 'text-muted-foreground'}`}>
                                            {dayData.day}
                                        </span>
                                        {hasTrips && (
                                            <div className="flex flex-col items-center justify-center flex-1 w-full -mt-1">
                                                {dayData.trips.slice(0, 1).map((trip: TripEntry) => (
                                                    <div key={trip.id} className="flex flex-col items-center">
                                                        <span className="text-xs leading-none transform scale-90">
                                                            {getCountryByCode(trip.countryCode)?.flagEmoji}
                                                        </span>
                                                    </div>
                                                ))}
                                                {dayData.trips.length > 1 && (
                                                    <div className="w-1 h-1 rounded-full bg-white/50 mt-0.5" />
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

            {/* Days by Country - Compact List */}
            {Object.keys(daysByCountry).length > 0 && (
                <div className="bg-gradient-card rounded-xl border border-border/50 p-4">
                    <h3 className="font-display text-sm font-bold mb-3">Days Per Country</h3>
                    <div className="space-y-2">
                        {Object.entries(daysByCountry)
                            .sort(([, a], [, b]) => b - a)
                            .slice(0, 5) // Limit to top 5 to save space
                            .map(([code, days]) => {
                                const country = getCountryByCode(code);
                                const percentage = totalDays > 0 ? (days / totalDays) * 100 : 0;

                                return (
                                    <div key={code} className="space-y-1">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="flex items-center gap-1.5">
                                                <span className="text-base">{country?.flagEmoji}</span>
                                                <span className="font-medium truncate max-w-[120px]">{country?.name || code}</span>
                                            </span>
                                            <span className="text-muted-foreground">{days}d</span>
                                        </div>
                                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-white/60 to-white/90 rounded-full"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        {Object.keys(daysByCountry).length > 5 && (
                            <div className="text-center pt-1">
                                <span className="text-[10px] text-muted-foreground italic">
                                    + {Object.keys(daysByCountry).length - 5} more countries
                                </span>
                            </div>
                        )}
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
