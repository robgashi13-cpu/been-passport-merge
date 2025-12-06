import { useState } from 'react';
import Header from '@/components/Header';
import Dashboard from '@/components/Dashboard';
import WorldMap from '@/components/WorldMap';
import CountryList from '@/components/CountryList';
import PassportPower from '@/components/PassportPower';
import { TravelCalendar } from '@/components/TravelCalendar';
import { PhotoUpload } from '@/components/PhotoUpload';
import { ExploreDestinations } from '@/components/ExploreDestinations';
import { VisaChecker } from '@/components/VisaChecker';
import { LoginModal } from '@/components/LoginModal';
import { TripEntry } from '@/data/trips';
import { useTravelData } from '@/hooks/useTravelData';
import { useUser } from '@/contexts/UserContext';
import { Helmet } from 'react-helmet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User } from 'lucide-react';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [trips, setTrips] = useState<TripEntry[]>([]);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const { user, isLoggedIn, updateHeldVisas } = useUser();

  const {
    visitedCountries,
    bucketList,
    userPassport,
    setUserPassport,
    toggleVisited,
    toggleBucketList,
    getStats,
    heldVisas,
    toggleHeldVisa,
  } = useTravelData();

  const stats = getStats();

  const handleTripsDetected = (detectedTrips: Partial<TripEntry>[]) => {
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
    setTrips([...trips, ...newTrips]);
  };

  // Use user's passport and visas if logged in
  const effectivePassport = isLoggedIn && user ? user.passportCode : userPassport;
  const effectiveHeldVisas = isLoggedIn && user ? (user.heldVisas || []) : heldVisas;

  const handleToggleHeldVisa = (visaId: string) => {
    if (isLoggedIn && user && updateHeldVisas) {
      const current = user.heldVisas || [];
      const next = current.includes(visaId)
        ? current.filter(id => id !== visaId)
        : [...current, visaId];
      updateHeldVisas(next);
    } else {
      toggleHeldVisa(visaId);
    }
  };

  return (
    <>
      <Helmet>
        <title>WanderPass - Track Your Global Journey</title>
        <meta name="description" content="Track visited countries, check visa requirements, and plan your next adventure with Travel World." />
      </Helmet>

      <div className="min-h-screen bg-black bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-black to-black">
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onLoginClick={() => setShowLoginModal(true)}
        />


        <main className="container mx-auto px-3 md:px-4 pt-20 md:pt-24 pb-8 md:pb-12">
          {activeTab === 'dashboard' && (
            <div className="space-y-8 md:space-y-12">
              <Dashboard stats={stats} visitedCountries={visitedCountries} />

              <div className="pt-4 border-t border-white/10">
                <h3 className="font-display text-2xl font-bold mb-6">Explore Destinations</h3>
                <ExploreDestinations
                  onCountryClick={(code) => {
                    toggleVisited(code);
                    setActiveTab('map');
                  }}
                />
              </div>
            </div>
          )}

          {activeTab === 'map' && (
            <div className="space-y-8">
              <WorldMap
                visitedCountries={visitedCountries}
                toggleVisited={toggleVisited}
                userPassportCode={effectivePassport}
                heldVisas={effectiveHeldVisas}
              />

              <div id="country-list-section" className="pt-4 border-t border-white/10">
                <h3 className="font-display text-2xl font-bold mb-6 px-2">All Countries</h3>
                <CountryList
                  visitedCountries={visitedCountries}
                  bucketList={bucketList}
                  toggleVisited={toggleVisited}
                  toggleBucketList={toggleBucketList}
                />
              </div>
            </div>
          )}



          {activeTab === 'calendar' && (
            <Tabs defaultValue="calendar" className="w-full">
              <TabsList className="grid w-full grid-cols-2 max-w-xs mx-auto">
                <TabsTrigger value="calendar" className="text-sm">Calendar</TabsTrigger>
                <TabsTrigger value="import" className="text-sm">Import</TabsTrigger>
              </TabsList>

              <TabsContent value="calendar" className="mt-6">
                <TravelCalendar trips={trips} />
              </TabsContent>

              <TabsContent value="import" className="mt-6">
                <PhotoUpload onTripsDetected={handleTripsDetected} />
              </TabsContent>
            </Tabs>
          )}

          {activeTab === 'passport' && (
            <Tabs defaultValue="power" className="w-full">
              <TabsList className="grid w-full grid-cols-2 max-w-xs mx-auto mb-6">
                <TabsTrigger value="power" className="text-sm">Passport Power</TabsTrigger>
                <TabsTrigger value="visa" className="text-sm">Visa Check</TabsTrigger>
              </TabsList>

              <TabsContent value="power">
                <PassportPower
                  userPassport={effectivePassport}
                  setUserPassport={setUserPassport}
                  heldVisas={effectiveHeldVisas}
                  onToggleHeldVisa={toggleHeldVisa}
                  userPassportScore={stats.passportScore}
                />
              </TabsContent>

              <TabsContent value="visa">
                <VisaChecker
                  selectedPassport={effectivePassport}
                  onPassportChange={setUserPassport}
                />
              </TabsContent>
            </Tabs>
          )}
        </main>

        {/* Login Modal */}
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
        />

        {/* Ambient background elements */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
          <div className="absolute top-1/4 -left-20 w-64 md:w-96 h-64 md:h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 -right-20 w-64 md:w-96 h-64 md:h-96 bg-accent/5 rounded-full blur-3xl" />
        </div>
      </div>
    </>
  );
};

export default Index;
