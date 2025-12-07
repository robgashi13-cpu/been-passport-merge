import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

export interface UserData {
    id: string;
    name: string;
    email: string;
    passportCode: string;
    visitedCountries: string[];
    bucketList: string[];
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
    updateVisitedCountries: (countries: string[]) => void;
    updateVisitedCities: (cities: string[]) => void;
    updateBucketList: (countries: string[]) => void;
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
}

const UserContext = createContext<UserContextType | null>(null);

const STORAGE_KEY = 'wanderlust_user';

export const UserProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<UserData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [trips, setTrips] = useState<any[]>([]);

    // Guest State
    const [guestVisited, setGuestVisited] = useState<string[]>([]);
    const [guestPassport, setGuestPassport] = useState<string>("US");
    const [guestBucket, setGuestBucket] = useState<string[]>([]);
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
            localStorage.setItem('heldVisas', JSON.stringify(guestHeld));
            localStorage.setItem('visitedCities', JSON.stringify(guestCities));
        }
    }, [guestVisited, guestPassport, guestBucket, guestHeld, guestCities, user]);

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

    const fetchProfile = async (userId: string, email?: string, metadata?: any) => {
        try {
            // Try enabling offline support / specific error handling
            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', userId)
                .single();

            // If profile not found, try to create it from metadata (Self-Healing)
            if (error && (error.code === 'PGRST116' || error.message.includes('JSON')) && metadata) {
                console.log("Profile missing, attempting auto-creation...");
                const newProfile = {
                    id: userId,
                    name: metadata.name || 'Traveler',
                    passport_code: metadata.passport_code || 'US',
                    visited_countries: [],
                    bucket_list: [],
                    visited_cities: [],
                    held_visas: []
                };

                const { error: insertError } = await supabase
                    .from('user_profiles')
                    .upsert(newProfile, { onConflict: 'id' });

                if (!insertError) {
                    // Start with basic profile
                    const userData: UserData = {
                        id: userId,
                        name: newProfile.name,
                        email: email || '',
                        passportCode: newProfile.passport_code,
                        visitedCountries: [],
                        bucketList: [],
                        visitedCities: [],
                        heldVisas: [],
                        createdAt: new Date()
                    };
                    setUser(userData);
                    return; // Success
                }
            }

            if (error) throw error;

            if (data) {
                // If email not passed, try to get from current user or cache
                let userEmail = email || '';
                if (!userEmail && user?.email) userEmail = user.email;

                const userData: UserData = {
                    id: data.id,
                    name: data.name,
                    email: userEmail,
                    passportCode: data.passport_code,
                    visitedCountries: data.visited_countries || [],
                    bucketList: data.bucket_list || [],
                    visitedCities: data.visited_cities || [],
                    heldVisas: data.held_visas || [],
                    createdAt: new Date(data.created_at)
                };
                setUser(userData);
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            // If fetch fails (offline), try loading from cache if IDs match
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
                await fetchProfile(data.user.id, data.user.email, data.user.user_metadata);
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
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
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
                // Explicitly ensure profile exists in database to support full login experience
                try {
                    await supabase.from('user_profiles').upsert({
                        id: data.user.id,
                        name: name,
                        passport_code: passportCode,
                        visited_countries: [],
                        bucket_list: [],
                        visited_cities: [],
                        held_visas: []
                    }, { onConflict: 'id', ignoreDuplicates: true });
                } catch (e) {
                    console.error("Profile auto-creation fallback error:", e);
                }

                if (data.session) {
                    await fetchProfile(data.user.id, data.user.email, data.user.user_metadata);
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

    // Check active session on mount
    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                await fetchProfile(session.user.id, session.user.email, session.user.user_metadata);
            } else {
                setIsLoading(false);
            }
        };

        checkSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) {
                fetchProfile(session.user.id, session.user.email, session.user.user_metadata);
            } else {
                setUser(null);
                setIsLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const updatePassport = async (passportCode: string) => {
        if (user) {
            setUser(prev => prev ? { ...prev, passportCode } : null);
            try {
                await supabase.from('user_profiles').update({ passport_code: passportCode }).eq('id', user.id);
            } catch (e) { console.error(e); }
        } else {
            setGuestPassport(passportCode);
        }
    };

    const updateVisitedCountries = async (countries: string[]) => {
        if (user) {
            setUser(prev => prev ? { ...prev, visitedCountries: countries } : null);
            try {
                await supabase.from('user_profiles').update({ visited_countries: countries }).eq('id', user.id);
            } catch (e) { console.error(e); }
        } else {
            setGuestVisited(countries);
        }
    };

    const updateVisitedCities = async (cities: string[]) => {
        if (user) {
            setUser(prev => prev ? { ...prev, visitedCities: cities } : null);
            try {
                await supabase.from('user_profiles').update({ visited_cities: cities }).eq('id', user.id);
            } catch (e) { console.error(e); }
        } else {
            setGuestCities(cities);
        }
    };

    const updateBucketList = async (list: string[]) => {
        if (user) {
            setUser(prev => prev ? { ...prev, bucketList: list } : null);
            try {
                await supabase.from('user_profiles').update({ bucket_list: list }).eq('id', user.id);
            } catch (e) { console.error(e); }
        } else {
            setGuestBucket(list);
        }
    };

    const updateHeldVisas = async (visas: string[]) => {
        if (user) {
            setUser(prev => prev ? { ...prev, heldVisas: visas } : null);
            try {
                await supabase.from('user_profiles').update({ held_visas: visas }).eq('id', user.id);
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

    return (
        <UserContext.Provider value={{
            user,
            isLoggedIn: !!user,
            isLoading,
            login,
            signup,
            logout,
            updatePassword,
            updatePassport,
            updateVisitedCountries,
            updateVisitedCities,
            updateBucketList,
            updateHeldVisas,
            trips,
            addTrip,
            updateTrips,
            // Exposed Unified Data
            visitedCountries,
            visitedCities,
            bucketList,
            heldVisas,
            passportCode
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
