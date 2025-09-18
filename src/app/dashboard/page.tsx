
import CryptoGrid from '@/components/dashboard/crypto-grid';
import { getCryptoCardData, getCurrencyRates, getNewsFeed } from '@/services/crypto-service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import MarketBar from '@/components/dashboard/market-bar';
import NewsFeed from '@/components/dashboard/news-feed';
import Watchlist from '@/components/dashboard/watchlist';
import AiInsights from '@/components/dashboard/ai-insights';
import CurrencyRates from '@/components/dashboard/currency-rates';
import { CryptoCardSkeleton, DashboardSectionSkeleton } from '@/components/skeletons';
import { Suspense } from 'react';
import type { TickerData } from '@/services/crypto-service';

async function getTickerData() {
  // This function is now defined locally to fetch via the API route
  // This is a workaround for environments where direct external API calls from server components might be restricted.
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/market-data`, { next: { revalidate: 60 } });
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

async function CryptoGridData() {
  const initialCryptoData = await getCryptoCardData();
  return <CryptoGrid initialData={initialCryptoData} />
}

async function NewsFeedData() {
  const initialNewsData = await getNewsFeed();
  return <NewsFeed initialData={initialNewsData} />;
}

async function WatchlistData() {
  // For demonstration, watchlist shows top 5 tickers
  const initialTickerData: TickerData[] = await getTickerData();
  return <Watchlist initialData={initialTickerData.slice(0, 5)} />;
}

async function AiInsightsData() {
    const initialNewsData = await getNewsFeed();
    const initialMarketData: TickerData[] = await getTickerData();
    return <AiInsights initialNewsData={initialNewsData} initialMarketData={initialMarketData} />
}

async function CurrencyRatesData() {
    const initialCurrencyData = await getCurrencyRates();
    return <CurrencyRates initialData={initialCurrencyData} />
}

export default async function DashboardPage() {
  const initialTickerData: TickerData[] = await getTickerData();
  
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <MarketBar initialData={initialTickerData} />
      <main className="flex-1 p-4 md:p-6 space-y-6">
        <Suspense fallback={
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <CryptoCardSkeleton />
            <CryptoCardSkeleton />
            <CryptoCardSkeleton />
            <CryptoCardSkeleton />
          </div>
        }>
          <CryptoGridData />
        </Suspense>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Suspense fallback={<DashboardSectionSkeleton />}>
                <AiInsightsData />
            </Suspense>
          </div>
          <div className="space-y-6">
             <Suspense fallback={<DashboardSectionSkeleton />}>
                <WatchlistData />
             </Suspense>
             <Suspense fallback={<DashboardSectionSkeleton />}>
                <NewsFeedData />
             </Suspense>
             <Suspense fallback={<DashboardSectionSkeleton />}>
                <CurrencyRatesData />
             </Suspense>
          </div>
        </div>
      </main>
    </div>
  );
}
