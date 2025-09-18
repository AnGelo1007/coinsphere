
'use client';

import HomePageClient from '@/components/home-page-client';
import type { TickerData } from '@/services/crypto-service';
import { useEffect, useState } from 'react';

// This is the correct way to fetch data on the client side for the homepage
// to ensure it works in all hosting environments.
async function fetchMarketData(): Promise<TickerData[]> {
    try {
        const res = await fetch(`/api/market-data`, { next: { revalidate: 60 } });
        if (!res.ok) {
            console.error('Failed to fetch market data from API route');
            return [];
        }
        return res.json();
    } catch (error) {
        console.error('Error fetching from /api/market-data:', error);
        return [];
    }
}


export default function HomePage() {
  const [initialMarketData, setInitialMarketData] = useState<TickerData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMarketData().then(data => {
      setInitialMarketData(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    // You can return a loading skeleton here if you want
    return <HomePageClient initialMarketData={[]} />;
  }

  return <HomePageClient initialMarketData={initialMarketData} />;
}
