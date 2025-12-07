import { useState } from 'react';
import { useUser } from '@/contexts/UserContext';
import { TravelCalendar } from '@/components/TravelCalendar';
import { PhotoUpload } from '@/components/PhotoUpload';
import { TripEntry } from '@/data/trips';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const CalendarPage = () => {
    const { trips, updateTrips } = useUser();

    const handleTripsDetected = (detectedTrips: Partial<TripEntry>[]) => {
        // Convert partial trips to full trips with IDs
        const newTrips: TripEntry[] = detectedTrips.map((trip, idx) => ({
            id: `photo-trip-${Date.now()}-${idx}`,
            countryCode: trip.countryCode || '',
            countryName: trip.countryName || '',
            cityName: trip.cityName,
            startDate: trip.startDate || new Date(),
            endDate: trip.endDate || new Date(),
            transportMode: trip.transportMode,
            notes: trip.notes,
            createdAt: new Date(),
        }));

        updateTrips([...trips, ...newTrips]);
    };

    return (
        <div className="min-h-screen p-4 md:p-8">
            <Tabs defaultValue="calendar" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
                    <TabsTrigger value="calendar">Calendar</TabsTrigger>
                    <TabsTrigger value="import">Import Photos</TabsTrigger>
                </TabsList>

                <TabsContent value="calendar" className="mt-8">
                    <TravelCalendar trips={trips} />
                </TabsContent>

                <TabsContent value="import" className="mt-8">
                    <PhotoUpload onTripsDetected={handleTripsDetected} />
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default CalendarPage;
