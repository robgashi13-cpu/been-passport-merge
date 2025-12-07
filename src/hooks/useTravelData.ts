import { useState, useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';
import { countries, Country } from '@/data/countries';
import { getVisaRequirementFromMatrix, getPassportStats, availablePassports } from '@/data/visaMatrix';
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
  passportRank: number;
  heldVisas: string[];
  userPassport: (Country & { code: string }) | null;
}

export const useTravelData = () => {
  const {
    user,
    isLoggedIn,
    visitedCountries,
    visitedCities,
    bucketList,
    heldVisas,
    passportCode,
    updateVisitedCountries,
    updateHeldVisas,
    updateBucketList,
    updatePassport,
    updateVisitedCities
  } = useUser();

  // Unified Setters (Context handles user vs guest logic now)
  const toggleVisited = (code: string) => {
    const newList = visitedCountries.includes(code)
      ? visitedCountries.filter(c => c !== code)
      : [...visitedCountries, code];
    updateVisitedCountries(newList);
  };

  const toggleCityVisited = (cityKey: string) => {
    const newList = visitedCities.includes(cityKey)
      ? visitedCities.filter(c => c !== cityKey)
      : [...visitedCities, cityKey];
    updateVisitedCities(newList);
  };

  const toggleBucketList = (code: string) => {
    const newList = bucketList.includes(code)
      ? bucketList.filter(c => c !== code)
      : [...bucketList, code];
    updateBucketList(newList);
  };

  const toggleHeldVisa = (visaId: string) => {
    const newList = heldVisas.includes(visaId)
      ? heldVisas.filter(v => v !== visaId)
      : [...heldVisas, visaId];
    updateHeldVisas(newList);
  };

  const setUserPassport = (code: string) => {
    updatePassport(code);
  };

  const isVisited = (code: string) => visitedCountries.includes(code);
  const isInBucketList = (code: string) => bucketList.includes(code);

  const getStats = (): TravelStats => {
    const continentData = ["Europe", "Asia", "North America", "South America", "Africa", "Oceania", "Antarctica"].map(continent => {
      const continentCountries = countries.filter(c => c.continent === continent);
      const visitedInContinent = continentCountries.filter(c => visitedCountries.includes(c.code));
      return {
        name: continent,
        visited: visitedInContinent.length,
        total: continentCountries.length,
      };
    });

    const passport = countries.find(c => c.code === passportCode) || null;

    // Calculate dynamic score including held visas
    let dynamicScore = 0;

    if (passport) {
      // 1. Get Base Score (VF + VOA + ETA)
      const baseStats = getPassportStats(passport.code);
      if (baseStats) {
        dynamicScore = baseStats.visaFree + baseStats.visaOnArrival + baseStats.eta;
      }

      // 2. Add Held Visas (if any)
      if (heldVisas.length > 0) {
        // We need to fetch substitutions and ADD only if the country was originally REQUIRED
        const powerGroups = getVisaPowerGroups(heldVisas);
        const substitutedDestinations = new Set<string>();
        powerGroups.forEach(group => {
          const dests = VISA_SUBSTITUTIONS[group] || [];
          dests.forEach(d => substitutedDestinations.add(d));
        });

        // Increase score for destinations that become accessible
        countries.forEach(dest => {
          if (dest.code === passport.code) return;

          // Check if we gained access
          const req = getVisaRequirementFromMatrix(passport.code, dest.code)?.requirement;
          const isSubstituted = substitutedDestinations.has(dest.code);

          // If originally required but now substituted, we add 1 to score
          if (req === 'visa-required' && isSubstituted) {
            dynamicScore++;
          }
        });
      }
    }

    // 3. Calculate Global Rank with Dynamic Score
    let myRank = 0;
    if (passport) {
      const allScores = availablePassports.map(code => {
        if (code === passport.code) return { code, score: dynamicScore };
        const stats = getPassportStats(code);
        return { code, score: stats ? (stats.visaFree + stats.visaOnArrival + stats.eta) : 0 };
      }).sort((a, b) => b.score - a.score);

      let currentRank = 1;
      for (let i = 0; i < allScores.length; i++) {
        if (i > 0 && allScores[i].score < allScores[i - 1].score) {
          currentRank++;
        }
        if (allScores[i].code === passport.code) {
          myRank = currentRank;
          break;
        }
      }
    }

    return {
      visitedCount: visitedCountries.length,
      totalCountries: countries.length,
      percentage: Math.round((visitedCountries.length / countries.length) * 100),
      continentStats: continentData,
      passportScore: dynamicScore,
      passportRank: myRank || (passport?.passportRank ?? 0),
      heldVisas: heldVisas || [],
      userPassport: passport ? { ...passport, code: passport.code } : null,
    };
  };

  return {
    visitedCountries,
    visitedCities,
    bucketList,
    userPassport: passportCode,
    setUserPassport,
    toggleVisited,
    toggleBucketList,
    toggleCityVisited,
    isVisited,
    isInBucketList,
    heldVisas,
    toggleHeldVisa,
    getStats,
  };
};
