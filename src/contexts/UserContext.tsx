import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface UserData {
    id: string;
    name: string;
    email: string;
    passportCode: string;
    visitedCountries: string[];
    bucketList: string[];
    heldVisas: string[];
    createdAt: Date;
}

interface UserContextType {
    user: UserData | null;
    isLoggedIn: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<boolean>;
    signup: (name: string, email: string, password: string, passportCode: string) => Promise<boolean>;
    logout: () => void;
    updatePassport: (passportCode: string) => void;
    updateVisitedCountries: (countries: string[]) => void;
    updateBucketList: (countries: string[]) => void;
    updateHeldVisas: (visas: string[]) => void;
}

const UserContext = createContext<UserContextType | null>(null);

const STORAGE_KEY = 'wanderlust_user';

export const UserProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<UserData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load user from localStorage on mount
    useEffect(() => {
        const savedUser = localStorage.getItem(STORAGE_KEY);
        if (savedUser) {
            try {
                const parsed = JSON.parse(savedUser);
                setUser({
                    ...parsed,
                    createdAt: new Date(parsed.createdAt),
                    heldVisas: parsed.heldVisas || []
                });
            } catch (e) {
                console.error('Error parsing saved user:', e);
            }
        }
        setIsLoading(false);
    }, []);

    // Save user to localStorage whenever it changes
    useEffect(() => {
        if (user) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
        }
    }, [user]);

    const login = async (email: string, password: string): Promise<boolean> => {
        // For demo: accept any login and check localStorage for existing user
        const savedUser = localStorage.getItem(STORAGE_KEY);
        if (savedUser) {
            const parsed = JSON.parse(savedUser);
            if (parsed.email === email) {
                setUser({
                    ...parsed,
                    ...parsed,
                    createdAt: new Date(parsed.createdAt),
                    heldVisas: parsed.heldVisas || []
                });
                return true;
            }
        }

        // Create demo user if email matches pattern
        if (email && password) {
            const newUser: UserData = {
                id: `user_${Date.now()}`,
                name: email.split('@')[0],
                email,
                passportCode: 'DE', // Default passport
                visitedCountries: [],
                bucketList: [],
                heldVisas: [],
                createdAt: new Date(),
            };
            setUser(newUser);
            return true;
        }

        return false;
    };

    const signup = async (
        name: string,
        email: string,
        password: string,
        passportCode: string
    ): Promise<boolean> => {
        if (!name || !email || !password || !passportCode) {
            return false;
        }

        const newUser: UserData = {
            id: `user_${Date.now()}`,
            name,
            email,
            passportCode,
            visitedCountries: [],
            bucketList: [],
            heldVisas: [],
            createdAt: new Date(),
        };

        setUser(newUser);
        return true;
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem(STORAGE_KEY);
    };

    const updatePassport = (passportCode: string) => {
        if (user) {
            setUser({ ...user, passportCode });
        }
    };

    const updateVisitedCountries = (countries: string[]) => {
        if (user) {
            setUser({ ...user, visitedCountries: countries });
        }
    };

    const updateBucketList = (countries: string[]) => {
        if (user) {
            setUser({ ...user, bucketList: countries });
        }
    };

    const updateHeldVisas = (visas: string[]) => {
        if (user) {
            setUser({ ...user, heldVisas: visas });
        }
    };

    return (
        <UserContext.Provider value={{
            user,
            isLoggedIn: !!user,
            isLoading,
            login,
            signup,
            logout,
            updatePassport,
            updateVisitedCountries,
            updateBucketList,
            updateHeldVisas,
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
