/**
 * Travel data context (Robert HQ).
 *
 * Rewritten for Robert HQ:
 *  - Auth comes from the hub (Lovable Cloud session); no separate travel login.
 *  - Everything (visited, cities, bucket list, lived, visas, passport, trips, flight history) is stored in
 *    public.user_travel_data and synced with a debounced upsert — trips/flights are no longer localStorage-only.
 *  - Missing profile/travel rows are created on first load (the old app silently did nothing).
 *  - Default passport is Kosovo (XK).
 *  - localStorage is only an offline cache of the last synced state.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hub/auth";

// Tables are created by db/002_hub_auth_travel.sql; typed loosely so this compiles before types regenerate.
const db = supabase as any;

export interface UserData {
  id: string;
  name: string;
  email: string;
  passportCode: string;
  avatarUrl?: string | undefined;
  visitedCountries: string[];
  bucketList: string[];
  livedCountries: string[];
  visitedCities: string[];
  heldVisas: string[];
  createdAt: Date;
}

export interface FlightLog {
  from: string;
  to: string;
  at: number;
  fromIata?: string;
  toIata?: string;
  airline?: string;
  flightNo?: string;
  depTime?: string;
  arrTime?: string;
  durationMin?: number;
  distanceKm?: number;
  aircraft?: string;
  tailNumber?: string;
  seat?: string;
  cabin?: string;
  confirmation?: string;
  notes?: string;
}

interface UserContextType {
  user: UserData | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  syncState: "idle" | "saving" | "saved" | "error";
  login: (email: string, password: string) => Promise<boolean>;
  signup: (
    name: string,
    email: string,
    password: string,
    passportCode: string,
  ) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  updatePassport: (passportCode: string) => void;
  updatePassword: (password: string) => Promise<boolean>;
  updateAvatar: (url: string) => Promise<boolean>;
  updateVisitedCountries: (countries: string[]) => void;
  updateVisitedCities: (cities: string[]) => void;
  updateBucketList: (countries: string[]) => void;
  updateLivedCountries: (countries: string[]) => void;
  updateHeldVisas: (visas: string[]) => void;
  trips: any[];
  addTrip: (trip: any) => void;
  updateTrips: (trips: any[]) => void;
  flightHistory: FlightLog[];
  logFlight: (from: string, to: string) => void;
  clearFlightHistory: () => void;
  importFlights: (logs: FlightLog[]) => number;
  visitedCountries: string[];
  visitedCities: string[];
  bucketList: string[];
  heldVisas: string[];
  passportCode: string;
  livedCountries: string[];
}

type TravelState = {
  visited_countries: string[];
  visited_cities: string[];
  bucket_list: string[];
  lived_countries: string[];
  held_visas: string[];
  passport_code: string;
  trips: any[];
  flight_history: FlightLog[];
};

const DEFAULT_PASSPORT = "XK";
const EMPTY: TravelState = {
  visited_countries: [],
  visited_cities: [],
  bucket_list: [],
  lived_countries: [],
  held_visas: [],
  passport_code: DEFAULT_PASSPORT,
  trips: [],
  flight_history: [],
};
const CACHE_KEY = (uid: string) => `hq_travel_cache_${uid}`;
const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

function normalize(row: any): TravelState {
  return {
    visited_countries: arr<string>(row?.visited_countries),
    visited_cities: arr<string>(row?.visited_cities),
    bucket_list: arr<string>(row?.bucket_list),
    lived_countries: arr<string>(row?.lived_countries),
    held_visas: arr<string>(row?.held_visas),
    passport_code: row?.passport_code || DEFAULT_PASSPORT,
    trips: arr<any>(row?.trips),
    flight_history: arr<FlightLog>(row?.flight_history),
  };
}

const UserContext = createContext<UserContextType | null>(null);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const { session, signOut } = useAuth();
  const authUser = session?.user ?? null;
  const uid = authUser?.id ?? null;

  const [state, setState] = useState<TravelState>(EMPTY);
  const [profile, setProfile] = useState<{
    display_name?: string | null;
    avatar_url?: string | null;
    created_at?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [syncState, setSyncState] =
    useState<UserContextType["syncState"]>("idle");

  const pending = useRef<Partial<TravelState>>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  // ---------- load ----------
  useEffect(() => {
    if (!uid) {
      setState(EMPTY);
      setIsLoading(false);
      return;
    }
    let alive = true;
    setIsLoading(true);
    try {
      const cached = localStorage.getItem(CACHE_KEY(uid));
      if (cached) setState(normalize(JSON.parse(cached)));
    } catch {
      /* ignore */
    }
    (async () => {
      const [p, t] = await Promise.all([
        db.from("profiles").select("*").eq("user_id", uid).maybeSingle(),
        db
          .from("user_travel_data")
          .select("*")
          .eq("user_id", uid)
          .maybeSingle(),
      ]);
      if (!alive) return;
      let prof = p.data as any;
      if (!prof && !p.error) {
        const name =
          (authUser?.user_metadata as any)?.name ||
          authUser?.email?.split("@")[0] ||
          "Robert";
        const ins = await db
          .from("profiles")
          .upsert({ user_id: uid, display_name: name } as any, {
            onConflict: "user_id",
          })
          .select()
          .maybeSingle();
        prof = ins.data;
      }
      setProfile(prof || null);
      let row = t.data as any;
      if (!row && !t.error) {
        const ins = await db
          .from("user_travel_data")
          .upsert({ user_id: uid, passport_code: DEFAULT_PASSPORT } as any, {
            onConflict: "user_id",
          })
          .select()
          .maybeSingle();
        row = ins.data;
      }
      if (row && alive) {
        const next = normalize(row);
        setState(next);
        try {
          localStorage.setItem(CACHE_KEY(uid), JSON.stringify(next));
        } catch {
          /* ignore */
        }
      }
      if (t.error) console.warn("travel data load failed", t.error.message);
      // One-time import of data the old WanderPass app kept only in this browser (same origin):
      // trips, flight history and lived-in countries. Only fills fields that are still empty in the DB.
      if (row && alive) {
        const flag = `hq_legacy_migrated_${uid}`;
        try {
          if (!localStorage.getItem(flag)) {
            const read = (k: string) => {
              try {
                const v = JSON.parse(localStorage.getItem(k) || "null");
                return Array.isArray(v) ? v : [];
              } catch {
                return [];
              }
            };
            const cur = normalize(row);
            const legacy: Partial<TravelState> = {};
            const oldTrips = read("wanderlust_trips");
            const oldFlights = read("flight_history");
            const oldLived = read("livedCountries").filter((x: unknown) => typeof x === "string");
            if (!cur.trips.length && oldTrips.length) legacy.trips = oldTrips;
            if (!cur.flight_history.length && oldFlights.length) legacy.flight_history = oldFlights;
            if (!cur.lived_countries.length && oldLived.length) legacy.lived_countries = oldLived;
            if (Object.keys(legacy).length) {
              const { error } = await db
                .from("user_travel_data")
                .update(legacy as any)
                .eq("user_id", uid);
              if (!error && alive) setState((prev) => ({ ...prev, ...legacy }));
              if (!error) localStorage.setItem(flag, new Date().toISOString());
            } else {
              localStorage.setItem(flag, new Date().toISOString());
            }
          }
        } catch {
          /* storage unavailable */
        }
      }
      setIsLoading(false);
    })().catch((e) => {
      console.warn("travel data load error", e);
      if (alive) setIsLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [uid]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------- debounced save ----------
  const flush = useCallback(async () => {
    if (!uid) return;
    const patch = pending.current;
    pending.current = {};
    if (!Object.keys(patch).length) return;
    setSyncState("saving");
    const { error } = await db
      .from("user_travel_data")
      .upsert(
        { user_id: uid, ...patch, updated_at: new Date().toISOString() } as any,
        { onConflict: "user_id" },
      );
    if (error) {
      console.warn("travel save failed", error.message);
      pending.current = { ...patch, ...pending.current }; // retry with next change
      setSyncState("error");
    } else {
      setSyncState("saved");
    }
  }, [uid]);

  const patch = useCallback(
    (p: Partial<TravelState>) => {
      setState((prev) => {
        const next = { ...prev, ...p };
        if (uid) {
          try {
            localStorage.setItem(CACHE_KEY(uid), JSON.stringify(next));
          } catch {
            /* ignore */
          }
        }
        return next;
      });
      pending.current = { ...pending.current, ...p };
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(flush, 600);
    },
    [flush, uid],
  );

  // flush when leaving the page
  useEffect(() => {
    const h = () => {
      if (timer.current) {
        clearTimeout(timer.current);
        flush();
      }
    };
    window.addEventListener("pagehide", h);
    return () => {
      window.removeEventListener("pagehide", h);
      h();
    };
  }, [flush]);

  // ---------- actions ----------
  const updateVisitedCountries = (list: string[]) =>
    patch({ visited_countries: [...new Set(list)] });
  const updateVisitedCities = (list: string[]) =>
    patch({ visited_cities: [...new Set(list)] });
  const updateBucketList = (list: string[]) =>
    patch({ bucket_list: [...new Set(list)] });
  const updateLivedCountries = (list: string[]) =>
    patch({ lived_countries: [...new Set(list)] });
  const updateHeldVisas = (list: string[]) =>
    patch({ held_visas: [...new Set(list)] });
  const updatePassport = (code: string) =>
    patch({ passport_code: code || DEFAULT_PASSPORT });
  const addTrip = (trip: any) =>
    patch({ trips: [...stateRef.current.trips, trip] });
  const updateTrips = (trips: any[]) => patch({ trips });

  const logFlight = (from: string, to: string) => {
    if (!from || !to) return;
    const prev = stateRef.current.flight_history;
    const last = prev[prev.length - 1];
    if (
      last &&
      last.from === from &&
      last.to === to &&
      Date.now() - last.at < 5000
    )
      return;
    patch({ flight_history: [...prev, { from, to, at: Date.now() }] });
  };
  const clearFlightHistory = () => patch({ flight_history: [] });
  const importFlights = (logs: FlightLog[]): number => {
    const prev = stateRef.current.flight_history;
    const key = (l: FlightLog) =>
      `${l.from}>${l.to}@${Math.floor(l.at / 86_400_000)}#${(l.flightNo || "").toUpperCase()}`;
    const existing = new Set(prev.map(key));
    const merged = [...prev];
    const newCountries = new Set<string>();
    let added = 0;
    for (const l of logs) {
      if (!l.from || !l.to || existing.has(key(l))) continue;
      existing.add(key(l));
      merged.push(l);
      if (l.from !== "XX") newCountries.add(l.from);
      if (l.to !== "XX") newCountries.add(l.to);
      added++;
    }
    merged.sort((a, b) => a.at - b.at);
    const visited = Array.from(
      new Set([...stateRef.current.visited_countries, ...newCountries]),
    );
    patch({ flight_history: merged, visited_countries: visited });
    return added;
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    return !error;
  };
  const updateAvatar = async (url: string) => {
    if (!uid) return false;
    setProfile((p) => ({ ...(p || {}), avatar_url: url }));
    const { error } = await db
      .from("profiles")
      .upsert({ user_id: uid, avatar_url: url } as any, {
        onConflict: "user_id",
      });
    return !error;
  };

  const user: UserData | null = useMemo(() => {
    if (!authUser) return null;
    return {
      id: authUser.id,
      name:
        profile?.display_name ||
        (authUser.user_metadata as any)?.name ||
        authUser.email?.split("@")[0] ||
        "Robert",
      email: authUser.email || "",
      passportCode: state.passport_code,
      avatarUrl: profile?.avatar_url || undefined,
      visitedCountries: state.visited_countries,
      bucketList: state.bucket_list,
      livedCountries: state.lived_countries,
      visitedCities: state.visited_cities,
      heldVisas: state.held_visas,
      createdAt: new Date(
        profile?.created_at || authUser.created_at || Date.now(),
      ),
    };
  }, [authUser, profile, state]);

  const value: UserContextType = {
    user,
    isLoggedIn: !!user,
    isLoading,
    syncState,
    // Login/signup live in the hub; these stay for API compatibility.
    login: async () => !!user,
    signup: async () => ({
      success: false,
      message: "Sign-up is handled on the login screen.",
    }),
    logout: () => {
      signOut();
    },
    updatePassword,
    updateAvatar,
    updatePassport,
    updateVisitedCountries,
    updateVisitedCities,
    updateBucketList,
    updateHeldVisas,
    updateLivedCountries,
    trips: state.trips,
    addTrip,
    updateTrips,
    flightHistory: state.flight_history,
    logFlight,
    clearFlightHistory,
    importFlights,
    visitedCountries: state.visited_countries,
    visitedCities: state.visited_cities,
    bucketList: state.bucket_list,
    heldVisas: state.held_visas,
    passportCode: state.passport_code,
    livedCountries: state.lived_countries,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within a UserProvider");
  return context;
};
