import { useState } from 'react';
import { useUser } from '@/contexts/UserContext';
import { TravelCalendar } from '@/components/TravelCalendar';
// import { PhotoUpload } from '@/components/PhotoUpload';
import { TripEntry } from '@/data/trips';

const CalendarPage = () => {
    const { trips } = useUser();

    return (
        <div className="min-h-screen p-4 md:p-8">
            <h1 className="text-2xl font-bold mb-6 font-display">Travel Calendar</h1>
            <TravelCalendar trips={trips} />
        </div>
    );
};

export default CalendarPage;
