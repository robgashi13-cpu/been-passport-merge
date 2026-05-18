import { lazy, Suspense, useState, useEffect, useRef } from 'react';
import Header from '@/components/Header';
import Dashboard from '@/components/Dashboard';
// import { WidgetMapGenerator } from '@/components/WidgetMapGenerator';
// import WorldMap from '@/components/WorldMap';
import CountryList from '@/components/CountryList';
import PassportPower from '@/components/PassportPower';
import { TravelCalendar } from '@/components/TravelCalendar';
import { FlightyImport } from '@/components/FlightyImport';
// import { PhotoUpload } from '@/components/PhotoUpload';
import { ExploreDestinations } from '@/components/ExploreDestinations';
import { VisaChecker } from '@/components/VisaChecker';
import { LoginModal } from '@/components/LoginModal';
import { TripEntry } from '@/data/trips';
import { useTravelData } from '@/hooks/useTravelData';
import { useUser } from '@/contexts/UserContext';
import { Helmet } from 'react-helmet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Plus, Upload, CalendarDays, ChevronDown } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { Capacitor } from '@capacitor/core';
import { Button } from "@/components/ui/button";
import { AddTripModal } from '@/components/AddTripModal';
import { CountryDetailsModal } from '@/components/CountryDetailsModal';
import { useSwipeable } from 'react-swipeable';
import TabBar from '@/plugins/TabBar';
import { AchievementCelebration, useAchievementTracker } from '@/components/AchievementCelebration';
import { getLevel, LEVELS } from '@/components/Achievements';
import { InstallPrompt } from '@/components/InstallPrompt';
import { AIAssistant } from '@/components/AIAssistant';
import { AIRecommendations } from '@/components/AIRecommendations';
import FlightHistoryPanel from '@/components/FlightHistoryPanel';
import { FlightHistoryList } from '@/components/FlightHistoryList';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
const GlobeMap = lazy(() => import('@/components/GlobeMap'));

type NativeTabWindow = Window & {
  onNativeTabChange?: (tabId: string) => void;
};

const CollapsibleCalendar = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-white/[0.04] transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <CalendarDays className="w-4 h-4 text-luxury-gold" />
          <span className="font-display text-base font-bold text-white">Travel Calendar</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-white/60 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="p-3 sm:p-4 border-t border-white/10">{children}</div>}
    </div>
  );
};

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const isNative = Capacitor.isNativePlatform();
  // trips now from context
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAddTripModal, setShowAddTripModal] = useState(false);
  const [selectedCountryCode, setSelectedCountryCode] = useState<string | null>(null);
  const [selectedSheetCountry, setSelectedSheetCountry] = useState<string | null>(null);
  const [isSheetOpen, setSheetOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedFlightIndex, setSelectedFlightIndex] = useState<number | null>(null);
  const [showImport, setShowImport] = useState(false);

  const { user, isLoggedIn, updateHeldVisas, trips, updateTrips, livedCountries } = useUser();

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
    flightHistory,
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
    const nativeWindow = window as NativeTabWindow;

    // Global handler for Swift to call
    nativeWindow.onNativeTabChange = (tabId: string) => {
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
      delete nativeWindow.onNativeTabChange;
    };
  }, [isNative]);

  // Sync React State -> Native
  useEffect(() => {
    if (!isNative) return;
    if (skipNativeSync.current) return;

    TabBar.setActiveTab({ tab: activeTab }).catch(() => { });
  }, [activeTab, isNative]);

  // Close login modal when switching tabs
  useEffect(() => {
    if (showLoginModal) {
      setShowLoginModal(false);
    }
  }, [activeTab]);


  // Welcome-country notifications removed per user request.


  // Sync Data -> Widget - REMOVED

  // handleWidgetSnapshot - REMOVED

  // handleTripsDetected - REMOVED


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

  // Swipe-to-change-tabs disabled by request — only the bottom nav switches tabs.
  const handlers = {} as Record<string, never>;

  return (
    <div {...handlers} className="min-h-screen bg-black text-white selection:bg-white/20">
      <Helmet>
        <title>WanderPass | Your Travel Passport</title>
        <meta name="description" content="Track your travels, visualize your passport power, and manage your visa requirements with WanderPass." />
      </Helmet>

      <div>
        {/* Hide header on map tab for fullscreen experience */}
        {activeTab !== 'map' && (
          <Header
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onLoginClick={() => setShowLoginModal(true)}
            showDesktopNav={true}
          />
        )}

        <main
          className={activeTab === 'map' ? '' : 'container mx-auto px-4'}
          style={{
            paddingTop: activeTab === 'map' ? '0' : 'calc(env(safe-area-inset-top) + 80px)',
            paddingBottom: activeTab === 'map'
              ? '0'
              : 'calc(env(safe-area-inset-bottom) + 8.5rem)',
          }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className={activeTab === 'map' ? '' : "space-y-6"}>
            <TabsContent value="dashboard" className="space-y-6 animate-fade-in focus-visible:outline-none">
              <Dashboard
                stats={stats}
                visitedCountries={visitedCountries}
                toggleVisited={toggleVisited}
                bucketList={bucketList || []}
                heldVisas={heldVisas}
                onCountryClick={(code) => setSelectedCountryCode(code)}
              />

              <AIRecommendations
                passportCode={effectivePassport}
                visitedCountries={visitedCountries}
                bucketList={bucketList || []}
              />

              <div className="pt-3 border-t border-white/10">
                <h3 className="font-display text-2xl font-bold mb-6">Explore Destinations</h3>
                <ExploreDestinations
                  onCountryClick={(code) => setSelectedCountryCode(code)}
                />
              </div>

            </TabsContent>

            <TabsContent value="map" className="h-[100dvh] md:h-[calc(100dvh-4rem)] w-full p-0 m-0 data-[state=inactive]:hidden focus-visible:outline-none">
              <div className="relative w-full h-full">
                {/* 3D Globe Map */}
                <Suspense fallback={<div className="h-full w-full bg-background" />}>
                  <GlobeMap
                    visitedCountries={visitedCountries}
                    toggleVisited={toggleVisited}
                    userPassportCode={userPassport || undefined}
                    heldVisas={heldVisas}
                    flightHistory={flightHistory}
                    selectedFlightIndex={selectedFlightIndex}
                    onCountryClick={(code) => {
                      setSelectedSheetCountry(code);
                      setSheetOpen(true);
                    }}
                  />
                </Suspense>

                {/* Flight history panel — positioned above the zoom/recenter controls */}
                <div
                  className="absolute right-3 z-[20]"
                  style={{ top: "calc(env(safe-area-inset-top) + 5rem)" }}
                >
                  <FlightHistoryPanel
                    selectedIndex={selectedFlightIndex}
                    onSelect={setSelectedFlightIndex}
                  />
                </div>

                {isSheetOpen && (
                  <CountryDetailsModal
                    countryCode={selectedSheetCountry}
                    onClose={() => { setSheetOpen(false); setSelectedSheetCountry(null); }}
                  />
                )}
              </div>
            </TabsContent>

            <TabsContent value="calendar" className="focus-visible:outline-none space-y-4">
              <div className="flex justify-between items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold font-display">Flight Log</h2>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowImport(true)}
                    variant="outline"
                    size="sm"
                    className="bg-white/5 hover:bg-white/10 text-white border-white/20 gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Import
                  </Button>
                  <Button
                    onClick={() => setShowAddTripModal(true)}
                    size="sm"
                    className="bg-white/10 hover:bg-white/20 text-white border border-white/20 gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Trip
                  </Button>
                </div>
              </div>

              <FlightHistoryList />

              {/* Collapsible Travel Calendar */}
              <CollapsibleCalendar>
                <TravelCalendar
                  trips={trips}
                  onClearAll={() => updateTrips([])}
                  onDateClick={(date) => {
                    setSelectedDate(date);
                    setShowAddTripModal(true);
                  }}
                />
              </CollapsibleCalendar>

              {/* Import dialog */}
              <Dialog open={showImport} onOpenChange={setShowImport}>
                <DialogContent className="max-w-2xl bg-black/90 border-white/10 text-white p-0 overflow-hidden">
                  <DialogHeader className="px-5 pt-5">
                    <DialogTitle className="font-display text-xl">Import Flight History</DialogTitle>
                  </DialogHeader>
                  <div className="p-5 pt-3 max-h-[80vh] overflow-y-auto">
                    <FlightyImport />
                  </div>
                </DialogContent>
              </Dialog>
            </TabsContent>

            <TabsContent value="passport" className="space-y-6 animate-fade-in focus-visible:outline-none">
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
        {
          !isNative && (
            <div className="lg:hidden">
              <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
            </div>
          )
        }

        {!isNative && <InstallPrompt />}
        {!isNative && <AIAssistant />}
        <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
        <AddTripModal
          isOpen={showAddTripModal}
          onClose={() => {
            setShowAddTripModal(false);
            setSelectedDate(undefined); // Reset date on close
          }}
          initialDate={selectedDate}
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
      </div >
    </div >
  );
};

export default Index;
