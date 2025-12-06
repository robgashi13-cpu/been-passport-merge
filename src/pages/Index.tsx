import { useState } from 'react';
import Header from '@/components/Header';
import Dashboard from '@/components/Dashboard';
import WorldMap from '@/components/WorldMap';
import CountryList from '@/components/CountryList';
import PassportPower from '@/components/PassportPower';
import { useTravelData } from '@/hooks/useTravelData';
import { Helmet } from 'react-helmet';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const {
    visitedCountries,
    bucketList,
    userPassport,
    setUserPassport,
    toggleVisited,
    toggleBucketList,
    getStats,
  } = useTravelData();

  const stats = getStats();

  return (
    <>
      <Helmet>
        <title>Wanderlust - Track Your Travel Adventures</title>
        <meta name="description" content="Track visited countries, discover your passport power, and plan your next adventure. Your ultimate travel companion." />
      </Helmet>
      
      <div className="min-h-screen bg-gradient-dark">
        <Header activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <main className="container mx-auto px-4 pt-24 pb-12">
          {activeTab === 'dashboard' && (
            <Dashboard stats={stats} />
          )}
          
          {activeTab === 'map' && (
            <WorldMap 
              visitedCountries={visitedCountries}
              toggleVisited={toggleVisited}
            />
          )}
          
          {activeTab === 'countries' && (
            <CountryList
              visitedCountries={visitedCountries}
              bucketList={bucketList}
              toggleVisited={toggleVisited}
              toggleBucketList={toggleBucketList}
            />
          )}
          
          {activeTab === 'passport' && (
            <PassportPower
              userPassport={userPassport}
              setUserPassport={setUserPassport}
            />
          )}
        </main>

        {/* Ambient background elements */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
          <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        </div>
      </div>
    </>
  );
};

export default Index;
