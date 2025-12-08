import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

export interface UserData {
    id: string;
    name: string;
    email: string;
    passportCode: string;
    avatarUrl?: string; // Added
    visitedCountries: string[];
    bucketList: string[];
    livedCountries: string[]; // Added
    visitedCities: string[];
    heldVisas: string[];
    createdAt: Date;
}

interface UserContextType {
    user: UserData | null;
    isLoggedIn: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<boolean>;
    signup: (name: string, email: string, password: string, passportCode: string) => Promise<{ success: boolean; message?: string }>;
    logout: () => void;
    updatePassport: (passportCode: string) => void;
    updatePassword: (password: string) => Promise<boolean>;
    updateAvatar: (url: string) => Promise<boolean>; // Added
    updateVisitedCountries: (countries: string[]) => void;
    updateVisitedCities: (cities: string[]) => void;
    updateBucketList: (countries: string[]) => void;
    updateLivedCountries: (countries: string[]) => void; // Added
    updateHeldVisas: (visas: string[]) => void;
    trips: any[];
    addTrip: (trip: any) => void;
    updateTrips: (trips: any[]) => void;
    // Unified Data Access (Guest + User)
    visitedCountries: string[];
    visitedCities: string[];
    bucketList: string[];
    heldVisas: string[];
    passportCode: string;
    livedCountries: string[]; // Added
}

const UserContext = createContext<UserContextType | null>(null);

export const UserProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<UserData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [trips, setTrips] = useState<any[]>([]);

    // Guest State
    const [guestVisited, setGuestVisited] = useState<string[]>([]);
    const [guestPassport, setGuestPassport] = useState<string>("US");
    const [guestBucket, setGuestBucket] = useState<string[]>([]);
    const [guestLived, setGuestLived] = useState<string[]>([]); // Added
    const [guestHeld, setGuestHeld] = useState<string[]>([]);
    const [guestCities, setGuestCities] = useState<string[]>([]);

    // Load Guest Data
    useEffect(() => {
        if (!user) {
            try {
                const savedVisited = localStorage.getItem('visitedCountries');
                if (savedVisited) setGuestVisited(JSON.parse(savedVisited));
                const savedPassport = localStorage.getItem('userPassport');
                if (savedPassport) setGuestPassport(savedPassport);
                const savedBucket = localStorage.getItem('bucketList');
                if (savedBucket) setGuestBucket(JSON.parse(savedBucket));
                const savedLived = localStorage.getItem('livedCountries');
                if (savedLived) setGuestLived(JSON.parse(savedLived));
                const savedHeld = localStorage.getItem('heldVisas');
                if (savedHeld) setGuestHeld(JSON.parse(savedHeld));
                const savedCities = localStorage.getItem('visitedCities');
                if (savedCities) setGuestCities(JSON.parse(savedCities));
            } catch (e) { console.error("Error loading guest data", e); }
        }
    }, [user]);

    // Persist Guest Data
    useEffect(() => {
        if (!user) {
            localStorage.setItem('visitedCountries', JSON.stringify(guestVisited));
            localStorage.setItem('userPassport', guestPassport);
            localStorage.setItem('bucketList', JSON.stringify(guestBucket));
            localStorage.setItem('livedCountries', JSON.stringify(guestLived));
            localStorage.setItem('heldVisas', JSON.stringify(guestHeld));
            localStorage.setItem('visitedCities', JSON.stringify(guestCities));
        }
    }, [guestVisited, guestPassport, guestBucket, guestLived, guestHeld, guestCities, user]);

    useEffect(() => {
        const savedTrips = localStorage.getItem('wanderlust_trips');
        if (savedTrips) {
            try {
                setTrips(JSON.parse(savedTrips));
            } catch (e) { console.error(e); }
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('wanderlust_trips', JSON.stringify(trips));
    }, [trips]);

    const addTrip = (trip: any) => {
        setTrips(prev => [...prev, trip]);
    };

    const updateTrips = (newTrips: any[]) => {
        setTrips(newTrips);
    };

    // Cache User Data
    useEffect(() => {
        if (user) {
            localStorage.setItem('cached_user_profile', JSON.stringify(user));
        }
    }, [user]);

    const fetchUserData = async (userId: string, email?: string, metadata?: any) => {
        try {
            // Fetch profile and travel data separately
            const [profileResult, travelResult] = await Promise.all([
                supabase.from('profiles').select('*').eq('user_id', userId).single(),
                supabase.from('user_travel_data').select('*').eq('user_id', userId).single()
            ]);

            const profile = profileResult.data;
            const travelData = travelResult.data;

            // If data exists, set user
            if (profile || travelData) {
                const userData: UserData = {
                    id: userId,
                    name: profile?.display_name || metadata?.name || 'Traveler',
                    email: email || '',
                    passportCode: travelData?.passport_code || metadata?.passport_code || 'US',
                    avatarUrl: profile?.avatar_url || metadata?.avatar_url, // Populate
                    visitedCountries: travelData?.visited_countries || [],
                    bucketList: travelData?.bucket_list || [],
                    // @ts-ignore
                    livedCountries: travelData?.lived_countries || [],
                    visitedCities: travelData?.visited_cities || [],
                    heldVisas: travelData?.held_visas || [],
                    createdAt: new Date(profile?.created_at || travelData?.created_at || Date.now())
                };
                setUser(userData);
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
            // Try loading from cache if offline
            if (!user) {
                try {
                    const cached = localStorage.getItem('cached_user_profile');
                    if (cached) {
                        const cachedUser = JSON.parse(cached);
                        if (cachedUser.id === userId) {
                            setUser(cachedUser);
                        }
                    }
                } catch (e) { console.error("Cache load error", e); }
            }
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (email: string, password: string): Promise<boolean> => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            if (data.user) {
                await fetchUserData(data.user.id, data.user.email || undefined, data.user.user_metadata);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Login error:', error);
            return false;
        }
    };

    const signup = async (name: string, email: string, password: string, passportCode: string): Promise<{ success: boolean; message?: string }> => {
        try {
            const redirectUrl = `${window.location.origin}/`;

            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: redirectUrl,
                    data: {
                        name,
                        passport_code: passportCode,
                    },
                },
            });

            if (error) {
                return { success: false, message: error.message };
            }

            if (data.user) {
                if (data.session) {
                    await fetchUserData(data.user.id, data.user.email || undefined, data.user.user_metadata);
                    return { success: true };
                } else {
                    return { success: true, message: 'Account created! Please check your email to confirm before logging in.' };
                }
            }
            return { success: false, message: 'Unexpected signup response.' };
        } catch (error: any) {
            console.error('Signup error:', error);
            return { success: false, message: error.message || 'An unknown error occurred.' };
        }
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        localStorage.removeItem('cached_user_profile');
    };

    const updatePassword = async (password: string): Promise<boolean> => {
        try {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Update password error:', error);
            return false;
        }
    };

    const updateAvatar = async (url: string): Promise<boolean> => {
        if (!user) return false;
        try {
            setUser(prev => prev ? { ...prev, avatarUrl: url } : null);

            // Update auth metadata
            await supabase.auth.updateUser({
                data: { avatar_url: url }
            });

            // Update profiles table
            const { error } = await supabase
                .from('profiles')
                .update({ avatar_url: url })
                .eq('user_id', user.id);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Update avatar error:', error);
            return false;
        }
    };

    // Check active session on mount
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) {
                setTimeout(() => {
                    fetchUserData(session.user.id, session.user.email || undefined, session.user.user_metadata);
                }, 0);
            } else {
                setUser(null);
                setIsLoading(false);
            }
        });

        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                fetchUserData(session.user.id, session.user.email || undefined, session.user.user_metadata);
            } else {
                setIsLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const updatePassport = async (passportCode: string) => {
        if (user) {
            setUser(prev => prev ? { ...prev, passportCode } : null);
            try {
                await supabase.from('user_travel_data').update({ passport_code: passportCode }).eq('user_id', user.id);
            } catch (e) { console.error(e); }
        } else {
            setGuestPassport(passportCode);
        }
    };

    const updateVisitedCountries = async (countries: string[]) => {
        if (user) {
            setUser(prev => prev ? { ...prev, visitedCountries: countries } : null);
            try {
                await supabase.from('user_travel_data').update({ visited_countries: countries }).eq('user_id', user.id);
            } catch (e) { console.error(e); }
        } else {
            setGuestVisited(countries);
        }
    };

    const updateVisitedCities = async (cities: string[]) => {
        if (user) {
            setUser(prev => prev ? { ...prev, visitedCities: cities } : null);
            try {
                await supabase.from('user_travel_data').update({ visited_cities: cities }).eq('user_id', user.id);
            } catch (e) { console.error(e); }
        } else {
            setGuestCities(cities);
        }
    };

    const updateBucketList = async (list: string[]) => {
        if (user) {
            setUser(prev => prev ? { ...prev, bucketList: list } : null);
            try {
                await supabase.from('user_travel_data').update({ bucket_list: list }).eq('user_id', user.id);
            } catch (e) { console.error(e); }
        } else {
            setGuestBucket(list);
        }
    };

    const updateLivedCountries = async (list: string[]) => {
        if (user) {
            setUser(prev => prev ? { ...prev, livedCountries: list } : null);
            try {
                // @ts-ignore
                await supabase.from('user_travel_data').update({ lived_countries: list }).eq('user_id', user.id);
            } catch (e) { console.error(e); }
        } else {
            setGuestLived(list);
        }
    };

    const updateHeldVisas = async (visas: string[]) => {
        if (user) {
            setUser(prev => prev ? { ...prev, heldVisas: visas } : null);
            try {
                await supabase.from('user_travel_data').update({ held_visas: visas }).eq('user_id', user.id);
            } catch (e) { console.error(e); }
        } else {
            setGuestHeld(visas);
        }
    };

    // Derived State (Unified)
    const visitedCountries = user ? user.visitedCountries : guestVisited;
    const bucketList = user ? user.bucketList : guestBucket;
    const visitedCities = user ? user.visitedCities : guestCities;
    const heldVisas = user ? user.heldVisas : guestHeld;
    const passportCode = user ? user.passportCode : guestPassport;
    const livedCountries = user ? user.livedCountries : guestLived;

    return (
        <UserContext.Provider value={{
            user,
            isLoggedIn: !!user,
            isLoading,
            login,
            signup,
            logout,
            updatePassword,
            updateAvatar,
            updatePassport,
            updateVisitedCountries,
            updateVisitedCities,
            updateBucketList,
            updateHeldVisas,
            updateLivedCountries,
            trips,
            addTrip,
            updateTrips,
            // Exposed Unified Data
            visitedCountries,
            visitedCities,
            bucketList,
            heldVisas,
            passportCode,
            livedCountries
        }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = (): UserContextType => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};