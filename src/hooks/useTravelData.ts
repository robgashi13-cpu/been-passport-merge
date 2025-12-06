import { useState, useEffect } from 'react';
import { countries, Country } from '@/data/countries';

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
  const [visitedCountries, setVisitedCountries] = useState<string[]>([]);
  const [userPassport, setUserPassport] = useState<string>("US");
  const [bucketList, setBucketList] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('visitedCountries');
    const savedPassport = localStorage.getItem('userPassport');
    const savedBucket = localStorage.getItem('bucketList');
    
    if (saved) setVisitedCountries(JSON.parse(saved));
    if (savedPassport) setUserPassport(savedPassport);
    if (savedBucket) setBucketList(JSON.parse(savedBucket));
  }, []);

  useEffect(() => {
    localStorage.setItem('visitedCountries', JSON.stringify(visitedCountries));
  }, [visitedCountries]);

  useEffect(() => {
    localStorage.setItem('userPassport', userPassport);
  }, [userPassport]);

  useEffect(() => {
    localStorage.setItem('bucketList', JSON.stringify(bucketList));
  }, [bucketList]);

  const toggleVisited = (code: string) => {
    setVisitedCountries(prev => 
      prev.includes(code) 
        ? prev.filter(c => c !== code)
        : [...prev, code]
    );
  };

  const toggleBucketList = (code: string) => {
    setBucketList(prev => 
      prev.includes(code) 
        ? prev.filter(c => c !== code)
        : [...prev, code]
    );
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

    return {
      visitedCount: visitedCountries.length,
      totalCountries: countries.length,
      percentage: Math.round((visitedCountries.length / countries.length) * 100),
      continentStats: continentData,
      passportScore: passport?.visaFreeDestinations || 0,
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
    getStats,
  };
};
