import { useState, useEffect, useRef } from 'react';
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
import { User, Plus } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { Capacitor } from '@capacitor/core';
import { Button } from "@/components/ui/button";
import { AddTripModal } from '@/components/AddTripModal';
import { CountryDetailsModal } from '@/components/CountryDetailsModal';
import { useSwipeable } from 'react-swipeable';
import TabBar from '@/plugins/TabBar';
import { AchievementCelebration, useAchievementTracker } from '@/components/AchievementCelebration';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const isNative = Capacitor.isNativePlatform();
  // trips now from context
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAddTripModal, setShowAddTripModal] = useState(false);
  const [selectedCountryCode, setSelectedCountryCode] = useState<string | null>(null);

  const { user, isLoggedIn, updateHeldVisas, trips, updateTrips } = useUser();

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

  // Achievement Tracker (Global) - Hoisted from Dashboard to persist across tab switches
  const { newAchievement, clearAchievement, duration } = useAchievementTracker(visitedCountries);

  const tabOrder = ['dashboard', 'map', 'calendar', 'passport'];

  // Ref to prevent echo loops
  const skipNativeSync = useRef(false);

  // Sync with Native Tab Bar
  useEffect(() => {
    if (!isNative) return;

    // Global handler for Swift to call
    (window as any).onNativeTabChange = (tabId: string) => {
      console.log('Native tab request:', tabId);
      if (!skipNativeSync.current) {
        skipNativeSync.current = true;
        setActiveTab(tabId);
        setTimeout(() => {
          skipNativeSync.current = false;
        }, 50);
      }
    };

    // Initial sync
    TabBar.getActiveTab().then(({ tab }) => {
      if (tab) setActiveTab(tab);
    }).catch(() => { });

    return () => {
      delete (window as any).onNativeTabChange;
    };
  }, [isNative]);

  // Sync React State -> Native
  useEffect(() => {
    if (!isNative) return;
    if (skipNativeSync.current) return;

    TabBar.setActiveTab({ tab: activeTab }).catch(() => { });
  }, [activeTab, isNative]);

  const handleTripsDetected = (newTrips: Partial<TripEntry>[]) => {
    // Convert partial trips to full trips with IDs
    const completeTrips: TripEntry[] = newTrips.map(t => ({
      id: crypto.randomUUID(),
      countryCode: t.countryCode!,
      countryName: t.countryName!,
      cityName: t.cityName,
      startDate: t.startDate || new Date(),
      endDate: t.endDate || new Date(),
      transportMode: 'plane',
      createdAt: new Date(),
      ...t
    }));

    updateTrips([...trips, ...completeTrips]);

    // Auto-mark as visited
    const newCountryCodes = [...new Set(completeTrips.map(t => t.countryCode))];
    if (updateHeldVisas && user) {
      newCountryCodes.forEach(code => {
        if (code && !visitedCountries.includes(code)) {
          toggleVisited(code);
        }
      });
    }

    setActiveTab('calendar');
  };

  const handleManualTripSave = (newTrip: TripEntry) => {
    // This is now handled by AddTripModal internal context usage,
    // but if we need a callback we can keep it. 
    // Actually AddTripModal now adds to context directly.
    // So we just close the modal.
    setShowAddTripModal(false);
  };

  // Use user's passport and visas if logged in
  const effectivePassport = isLoggedIn && user ? user.passportCode : userPassport;
  const effectiveHeldVisas = isLoggedIn && user ? (user.heldVisas || []) : heldVisas;

  const handlers = useSwipeable({
    onSwipedLeft: () => {
      if (isNative) return; // Disable on native
      const currentIndex = tabOrder.indexOf(activeTab);
      if (currentIndex < tabOrder.length - 1) {
        setActiveTab(tabOrder[currentIndex + 1]);
      }
    },
    onSwipedRight: () => {
      if (isNative) return; // Disable on native
      const currentIndex = tabOrder.indexOf(activeTab);
      if (currentIndex > 0) {
        setActiveTab(tabOrder[currentIndex - 1]);
      }
    },
    trackMouse: false,
    preventScrollOnSwipe: false,
    delta: 20
  });

  return (
    <div {...handlers} className="min-h-screen bg-black text-white selection:bg-white/20">
      <Helmet>
        <title>WanderPass | Your Travel Passport</title>
        <meta name="description" content="Track your travels, visualize your passport power, and manage your visa requirements with WanderPass." />
      </Helmet>

      <div className="pb-24 lg:pb-8">
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onLoginClick={() => setShowLoginModal(true)}
          showDesktopNav={true}
        />

        <main className="container mx-auto px-4 pb-32" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 80px)' }}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsContent value="dashboard" className="space-y-6 animate-fade-in focus-visible:outline-none">
              <Dashboard
                stats={stats}
                visitedCountries={visitedCountries}
                toggleVisited={toggleVisited}
                bucketList={bucketList || []}
                heldVisas={heldVisas}
                onCountryClick={(code) => setSelectedCountryCode(code)}
              />

              <div className="pt-4 border-t border-white/10">
                <h3 className="font-display text-2xl font-bold mb-6">Explore Destinations</h3>
                <ExploreDestinations
                  onCountryClick={(code) => setSelectedCountryCode(code)}
                />
              </div>
            </TabsContent>

            <TabsContent value="map" className="h-[calc(100vh-12rem)] animate-fade-in focus-visible:outline-none pb-48">
              <div className="h-full rounded-2xl border border-white/10 bg-white/5 overflow-hidden backdrop-blur-sm">
                <WorldMap
                  visitedCountries={visitedCountries}
                  bucketList={bucketList || []}
                  onCountryClick={(code) => setSelectedCountryCode(code)}
                  userPassportCode={userPassport}
                  heldVisas={heldVisas}
                />
              </div>

              <div className="mt-6 pt-6 border-t border-white/10">
                <CountryList
                  visitedCountries={visitedCountries}
                  bucketList={bucketList || []}
                  toggleVisited={toggleVisited}
                  toggleBucketList={toggleBucketList}
                  onCountryClick={(code) => setSelectedCountryCode(code)}
                />
              </div>
            </TabsContent>

            <TabsContent value="calendar" className="pb-24 lg:pb-8 focus-visible:outline-none">
              <Tabs defaultValue="calendar" className="w-full">
                <div className="flex justify-between items-center mb-4">
                  <TabsList className="grid w-64 grid-cols-2">
                    <TabsTrigger value="calendar">Calendar</TabsTrigger>
                    <TabsTrigger value="import">Import</TabsTrigger>
                  </TabsList>
                  <Button
                    onClick={() => setShowAddTripModal(true)}
                    className="bg-white/10 hover:bg-white/20 text-white border border-white/20 gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Trip
                  </Button>
                </div>

                <TabsContent value="calendar" className="mt-0">
                  <TravelCalendar trips={trips} />
                </TabsContent>

                <TabsContent value="import" className="mt-0">
                  <PhotoUpload onTripsDetected={handleTripsDetected} />
                </TabsContent>
              </Tabs>
            </TabsContent>

            <TabsContent value="passport" className="space-y-6 pb-24 lg:pb-8 animate-fade-in focus-visible:outline-none">
              <PassportPower
                userPassport={effectivePassport}
                setUserPassport={setUserPassport}
                heldVisas={effectiveHeldVisas}
                onToggleHeldVisa={toggleHeldVisa}
                userPassportScore={stats.passportScore || 0}
              />
            </TabsContent>
          </Tabs>
        </main>

        {/* Mobile Bottom Navigation - Hide on native iOS (uses real iOS tab bar) */}
        {!isNative && (
          <div className="lg:hidden">
            <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
          </div>
        )}

        <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
        <AddTripModal
          isOpen={showAddTripModal}
          onClose={() => setShowAddTripModal(false)}
        />
        <CountryDetailsModal
          countryCode={selectedCountryCode}
          onClose={() => setSelectedCountryCode(null)}
        />

        {/* Achievement Celebration (Global) */}
        <AchievementCelebration
          achievement={newAchievement}
          onClose={clearAchievement}
          duration={duration}
        />
      </div>
    </div>
  );
};

export default Index;
