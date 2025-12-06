import { useState, useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';
import { countries, Country } from '@/data/countries';
import { getVisaRequirementFromMatrix } from '@/data/visaMatrix';
import { VISA_SUBSTITUTIONS, getVisaPowerGroups } from '@/data/visaSubstitutions';

export interface TravelStats {
  visitedCount: number;
  totalCountries: number;
  percentage: number;
  continentStats: {
    name: string;
    visited: number;
    total: number;
  }[];
  passportScore: number;
  userPassport: Country | null;
}

export const useTravelData = () => {
  const { user, updateVisitedCountries, updateHeldVisas, updateBucketList, updatePassport } = useUser();

  // Guest State (Fallback)
  const [guestVisited, setGuestVisited] = useState<string[]>([]);
  const [guestPassport, setGuestPassport] = useState<string>("US");
  const [guestBucket, setGuestBucket] = useState<string[]>([]);
  const [guestHeld, setGuestHeld] = useState<string[]>([]);

  // Init Guest Data from redundant local keys (optional, or just start fresh)
  useEffect(() => {
    if (!user) {
      const savedVisited = localStorage.getItem('visitedCountries');
      if (savedVisited) setGuestVisited(JSON.parse(savedVisited));
      const savedPassport = localStorage.getItem('userPassport');
      if (savedPassport) setGuestPassport(savedPassport);
      const savedBucket = localStorage.getItem('bucketList');
      if (savedBucket) setGuestBucket(JSON.parse(savedBucket));
      const savedHeld = localStorage.getItem('heldVisas');
      if (savedHeld) setGuestHeld(JSON.parse(savedHeld));
    }
  }, [user]);

  // Persist Guest Data
  useEffect(() => {
    if (!user) {
      localStorage.setItem('visitedCountries', JSON.stringify(guestVisited));
      localStorage.setItem('userPassport', guestPassport);
      localStorage.setItem('bucketList', JSON.stringify(guestBucket));
      localStorage.setItem('heldVisas', JSON.stringify(guestHeld));
    }
  }, [guestVisited, guestPassport, guestBucket, guestHeld, user]);

  // Unified Data Accessors
  const visitedCountries = user ? user.visitedCountries : guestVisited;
  const userPassport = user ? user.passportCode : guestPassport;
  const bucketList = user ? user.bucketList : guestBucket;
  const heldVisas = user ? user.heldVisas : guestHeld;

  // Unified Setters
  const toggleVisited = (code: string) => {
    const newList = visitedCountries.includes(code)
      ? visitedCountries.filter(c => c !== code)
      : [...visitedCountries, code];

    if (user) updateVisitedCountries(newList);
    else setGuestVisited(newList);
  };

  const toggleBucketList = (code: string) => {
    const newList = bucketList.includes(code)
      ? bucketList.filter(c => c !== code)
      : [...bucketList, code];

    if (user) updateBucketList(newList);
    else setGuestBucket(newList);
  };

  const toggleHeldVisa = (visaId: string) => {
    const newList = heldVisas.includes(visaId)
      ? heldVisas.filter(v => v !== visaId)
      : [...heldVisas, visaId];

    if (user) updateHeldVisas(newList);
    else setGuestHeld(newList);
  };

  const setUserPassport = (code: string) => {
    if (user) updatePassport(code);
    else setGuestPassport(code);
  };

  const isVisited = (code: string) => visitedCountries.includes(code);
  const isInBucketList = (code: string) => bucketList.includes(code);

  const getStats = (): TravelStats => {
    const continentData = ["Europe", "Asia", "North America", "South America", "Africa", "Oceania"].map(continent => {
      const continentCountries = countries.filter(c => c.continent === continent);
      const visitedInContinent = continentCountries.filter(c => visitedCountries.includes(c.code));
      return {
        name: continent,
        visited: visitedInContinent.length,
        total: continentCountries.length,
      };
    });

    const passport = countries.find(c => c.code === userPassport) || null;

    // Calculate dynamic score including held visas
    let dynamicScore = passport?.visaFreeDestinations || 0;

    if (passport && heldVisas.length > 0) {
      dynamicScore = countries.reduce((acc, dest) => {
        // Skip own country
        if (dest.code === passport.code) return acc;

        // 1. Check Base Passport Access
        const req = getVisaRequirementFromMatrix(passport.code, dest.code);
        if (req?.requirement === 'visa-free') return acc + 1;

        // 2. Check Held Visas (Direct)
        if (heldVisas.includes(dest.code)) return acc + 1;

        // 3. Check Substitutions
        const powerGroups = getVisaPowerGroups(heldVisas);
        const hasAccess = powerGroups.some(g => VISA_SUBSTITUTIONS[g]?.includes(dest.code));
        if (hasAccess) return acc + 1;

        return acc;
      }, 0);
    }

    return {
      visitedCount: visitedCountries.length,
      totalCountries: countries.length,
      percentage: Math.round((visitedCountries.length / countries.length) * 100),
      continentStats: continentData,
      passportScore: dynamicScore,
      userPassport: passport,
    };
  };

  return {
    visitedCountries,
    bucketList,
    userPassport,
    setUserPassport,
    toggleVisited,
    toggleBucketList,
    isVisited,
    isInBucketList,
    heldVisas,
    toggleHeldVisa,
    getStats,
  };
};
