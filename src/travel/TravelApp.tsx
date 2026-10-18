// @ts-nocheck
/**
 * Travel tab (ex "Been Passport Merge" / WanderPass), modernised for Robert HQ.
 * - Hub handles auth + top navigation; Travel keeps its own sub-sections as a sticky segmented control.
 * - Removed: duplicate header, bottom nav (overlapped content on mobile), login modal, install prompt,
 *   Capacitor native tab-bar bridge, react-helmet, automatic background AI verify / cold sync.
 */
import { lazy, Suspense, useState } from "react";
import {
  Home,
  Map as MapIcon,
  Plane,
  BookMarked,
  Plus,
  Upload,
  CalendarDays,
  ChevronDown,
  Cloud,
  CloudOff,
  Loader2,
} from "lucide-react";
import Dashboard from "@/travel/components/Dashboard";
import PassportPower from "@/travel/components/PassportPower";
import { TravelCalendar } from "@/travel/components/TravelCalendar";
import { FlightyImport } from "@/travel/components/FlightyImport";
import { ExploreDestinations } from "@/travel/components/ExploreDestinations";
import { deriveTripsFromFlights, mergeTrips } from "@/travel/data/trips";
import { useTravelData } from "@/travel/hooks/useTravelData";
import { UserProvider, useUser } from "@/travel/contexts/UserContext";
import { Button } from "@/travel/components/ui/button";
import { AddTripModal } from "@/travel/components/AddTripModal";
import { CountryDetailsModal } from "@/travel/components/CountryDetailsModal";
import {
  AchievementCelebration,
  useAchievementTracker,
} from "@/travel/components/AchievementCelebration";
import { AIAssistant } from "@/travel/components/AIAssistant";
import { AIRecommendations } from "@/travel/components/AIRecommendations";
import FlightHistoryPanel from "@/travel/components/FlightHistoryPanel";
import { FlightHistoryList } from "@/travel/components/FlightHistoryList";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/travel/components/ui/dialog";
import { Toaster } from "@/travel/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./travel.css";

const GlobeMap = lazy(() => import("@/travel/components/GlobeMap"));

const SECTIONS = [
  { id: "dashboard", label: "Home", icon: Home },
  { id: "map", label: "Map", icon: MapIcon },
  { id: "calendar", label: "Flights", icon: Plane },
  { id: "passport", label: "Passport", icon: BookMarked },
] as const;
type Section = (typeof SECTIONS)[number]["id"];

const CollapsibleCalendar = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-white/[0.04]"
      >
        <div className="flex items-center gap-2.5">
          <CalendarDays className="h-4 w-4 text-luxury-gold" />
          <span className="font-display text-base font-bold text-white">
            Travel Calendar
          </span>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-white/60 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="border-t border-white/10 p-3 sm:p-4">{children}</div>
      )}
    </div>
  );
};

function SyncBadge() {
  const { syncState, isLoading } = useUser();
  if (isLoading)
    return (
      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        Loading
      </span>
    );
  if (syncState === "error")
    return (
      <span className="flex items-center gap-1 text-[11px] text-red-300">
        <CloudOff className="h-3 w-3" />
        Not saved
      </span>
    );
  if (syncState === "saving")
    return (
      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        Saving
      </span>
    );
  return (
    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
      <Cloud className="h-3 w-3" />
      Synced
    </span>
  );
}

function TravelInner() {
  const [active, setActive] = useState<Section>(() => {
    if (typeof window === "undefined") return "dashboard";
    const h = window.location.hash.replace("#", "") as Section;
    return SECTIONS.some((s) => s.id === h) ? h : "dashboard";
  });
  const [showAddTripModal, setShowAddTripModal] = useState(false);
  const [selectedCountryCode, setSelectedCountryCode] = useState<string | null>(
    null,
  );
  const [selectedSheetCountry, setSelectedSheetCountry] = useState<
    string | null
  >(null);
  const [isSheetOpen, setSheetOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedFlightIndex, setSelectedFlightIndex] = useState<number | null>(
    null,
  );
  const [showImport, setShowImport] = useState(false);

  const { trips, updateTrips } = useUser();
  const {
    visitedCountries,
    bucketList,
    userPassport,
    setUserPassport,
    toggleVisited,
    getStats,
    heldVisas,
    toggleHeldVisa,
    flightHistory,
  } = useTravelData();
  const stats = getStats();
  const { newAchievement, clearAchievement, duration } =
    useAchievementTracker(visitedCountries);

  const go = (id: Section) => {
    setActive(id);
    try {
      history.replaceState(null, "", `#${id}`);
    } catch {
      /* ignore */
    }
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="travel-root hq-ambient min-h-[calc(100dvh-var(--hub-h))] text-white">
      {/* Sticky section switcher */}
      <div
        className="sticky z-40 border-b border-white/[0.06] bg-[#07080a]/80 backdrop-blur-xl"
        style={{ top: "var(--hub-h)" }}
      >
        <div className="mx-auto flex h-12 max-w-6xl items-center gap-3 px-3 sm:px-5">
          <div className="no-scrollbar flex flex-1 gap-1 overflow-x-auto rounded-full border border-white/[0.07] bg-white/[0.03] p-1 sm:flex-none">
            {SECTIONS.map((s) => {
              const Icon = s.icon;
              const on = active === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => go(s.id)}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors sm:flex-none sm:px-4 ${
                    on
                      ? "bg-gradient-to-br from-[hsl(var(--gold-light))] to-[hsl(var(--gold-dark))] text-black shadow"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {s.label}
                </button>
              );
            })}
          </div>
          <div className="ml-auto hidden sm:block">
            <SyncBadge />
          </div>
        </div>
      </div>

      {active === "map" ? (
        <div
          className="relative w-full"
          style={{ height: "calc(100dvh - var(--hub-h) - 3rem)" }}
        >
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
          <div className="absolute bottom-4 right-3 z-[20]">
            <FlightHistoryPanel
              selectedIndex={selectedFlightIndex}
              onSelect={setSelectedFlightIndex}
            />
          </div>
          {isSheetOpen && (
            <CountryDetailsModal
              countryCode={selectedSheetCountry}
              onClose={() => {
                setSheetOpen(false);
                setSelectedSheetCountry(null);
              }}
            />
          )}
        </div>
      ) : (
        <main className="mx-auto max-w-6xl px-3 pb-28 pt-5 sm:px-5">
          {active === "dashboard" && (
            <div className="space-y-6">
              <Dashboard
                stats={stats}
                visitedCountries={visitedCountries}
                toggleVisited={toggleVisited}
                bucketList={bucketList || []}
                heldVisas={heldVisas}
                onCountryClick={(code) => setSelectedCountryCode(code)}
              />
              <AIRecommendations
                passportCode={userPassport}
                visitedCountries={visitedCountries}
                bucketList={bucketList || []}
              />
              <div className="border-t border-white/10 pt-4">
                <h3 className="mb-5 font-display text-2xl font-bold">
                  Explore destinations
                </h3>
                <ExploreDestinations
                  onCountryClick={(code) => setSelectedCountryCode(code)}
                />
              </div>
            </div>
          )}

          {active === "calendar" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-2xl font-bold">Flight log</h2>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowImport(true)}
                    variant="outline"
                    size="sm"
                    className="gap-2 rounded-full border-white/15 bg-white/5 text-white hover:bg-white/10"
                  >
                    <Upload className="h-4 w-4" /> Import
                  </Button>
                  <Button
                    onClick={() => setShowAddTripModal(true)}
                    size="sm"
                    className="gap-2 rounded-full bg-white text-black hover:bg-white/90"
                  >
                    <Plus className="h-4 w-4" /> Add trip
                  </Button>
                </div>
              </div>
              <FlightHistoryList />
              <CollapsibleCalendar>
                <TravelCalendar
                  trips={mergeTrips(
                    trips,
                    deriveTripsFromFlights(
                      flightHistory,
                      userPassport || undefined,
                    ),
                  )}
                  onClearAll={() => updateTrips([])}
                  onDateClick={(date) => {
                    setSelectedDate(date);
                    setShowAddTripModal(true);
                  }}
                />
              </CollapsibleCalendar>
              <Dialog open={showImport} onOpenChange={setShowImport}>
                <DialogContent className="max-w-2xl overflow-hidden border-white/10 bg-[#0b0d11] p-0 text-white">
                  <DialogHeader className="px-5 pt-5">
                    <DialogTitle className="font-display text-xl">
                      Import flight history
                    </DialogTitle>
                  </DialogHeader>
                  <div className="max-h-[80vh] overflow-y-auto p-5 pt-3">
                    <FlightyImport />
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {active === "passport" && (
            <div className="space-y-6">
              <PassportPower
                userPassport={userPassport}
                setUserPassport={setUserPassport}
                heldVisas={heldVisas}
                onToggleHeldVisa={toggleHeldVisa}
                userPassportScore={stats.passportScore || 0}
              />
            </div>
          )}
        </main>
      )}

      {active !== "map" && <AIAssistant />}
      <AddTripModal
        isOpen={showAddTripModal}
        onClose={() => {
          setShowAddTripModal(false);
          setSelectedDate(undefined);
        }}
        initialDate={selectedDate}
      />
      <CountryDetailsModal
        countryCode={selectedCountryCode}
        onClose={() => setSelectedCountryCode(null)}
      />
      <AchievementCelebration
        achievement={newAchievement}
        onClose={clearAchievement}
        duration={duration}
      />
    </div>
  );
}

export default function TravelApp() {
  return (
    <UserProvider>
      <TooltipProvider>
        <TravelInner />
        <Toaster />
      </TooltipProvider>
    </UserProvider>
  );
}
