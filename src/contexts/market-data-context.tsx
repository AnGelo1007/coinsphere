
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { TickerData } from '@/services/crypto-service';
import { useAuth } from './auth-context';

type PriceDirection = 'up' | 'down' | 'neutral';

interface MarketDataContextType {
  marketData: TickerData[];
  marketDataMap: Record<string, TickerData>;
  priceDirections: Record<string, PriceDirection>;
  valueDirections: Record<string, PriceDirection>; // For wallet values
  loading: boolean;
}

const MarketDataContext = createContext<MarketDataContextType | undefined>(undefined);

export const MarketDataProvider = ({ children }: { children: ReactNode }) => {
  const { userProfile } = useAuth();
  const [marketData, setMarketData] = useState<TickerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [priceDirections, setPriceDirections] = useState<Record<string, PriceDirection>>({});
  const [valueDirections, setValueDirections] = useState<Record<string, PriceDirection>>({});
  
  const prevPricesRef = useRef<Record<string, number>>({});
  const prevValuesRef = useRef<Record<string, number>>({});
  const prevTotalValueRef = useRef<number>(0);

  const fetchMarketData = useCallback(async () => {
    try {
      const response = await fetch('/api/market-data');
      if (!response.ok) {
        // If the request fails, log the error but don't crash the app.
        // The component will continue to use the last known data or the initial state.
        console.error('Failed to fetch market data:', response.status, response.statusText);
        // Optionally, you could set an error state here to show a message in the UI.
        return;
      }
      
      const newData: TickerData[] = await response.json();
      
      const newPriceDirections: Record<string, PriceDirection> = {};
      const newValueDirections: Record<string, PriceDirection> = {};
      
      const marketDataMap = newData.reduce((acc, ticker) => {
          acc[ticker.symbol] = ticker;
          return acc;
      }, {} as Record<string, TickerData>);

      // Calculate price directions
      newData.forEach(item => {
        const prevPrice = prevPricesRef.current[item.symbol];
        if (prevPrice !== undefined) {
          if (item.priceRaw > prevPrice) {
            newPriceDirections[item.symbol] = 'up';
          } else if (item.priceRaw < prevPrice) {
            newPriceDirections[item.symbol] = 'down';
          }
        }
        prevPricesRef.current[item.symbol] = item.priceRaw;
      });

      // Calculate value directions for wallet assets
      if (userProfile?.portfolio) {
          let currentTotalValue = 0;
          Object.entries(userProfile.portfolio).forEach(([symbol, amount]) => {
              const price = marketDataMap[symbol]?.priceRaw || (symbol === 'USDT' ? 1 : 0);
              const currentValue = amount * price;
              currentTotalValue += currentValue;

              const prevValue = prevValuesRef.current[symbol];
              if (prevValue !== undefined) {
                  if (currentValue > prevValue) {
                      newValueDirections[symbol] = 'up';
                  } else if (currentValue < prevValue) {
                      newValueDirections[symbol] = 'down';
                  }
              }
              prevValuesRef.current[symbol] = currentValue;
          });
          
          // Calculate direction for total balance
          if (prevTotalValueRef.current !== 0) {
               if (currentTotalValue > prevTotalValueRef.current) {
                  newValueDirections['total'] = 'up';
              } else if (currentTotalValue < prevTotalValueRef.current) {
                  newValueDirections['total'] = 'down';
              }
          }
          prevTotalValueRef.current = currentTotalValue;
      }


      setMarketData(newData);
      setPriceDirections(newPriceDirections);
      setValueDirections(newValueDirections);

      setTimeout(() => {
          setPriceDirections({});
          setValueDirections({});
      }, 500);
      
    } catch (error) {
      console.error('An error occurred while fetching market data:', error);
    } finally {
        if(loading) setLoading(false);
    }
  }, [userProfile, loading]);

  useEffect(() => {
    // Fetch immediately on mount, then set up the interval.
    fetchMarketData(); 
    const interval = setInterval(fetchMarketData, 5000);
    return () => clearInterval(interval);
  }, [fetchMarketData]);

  const marketDataMap = useMemo(() => {
    return marketData.reduce((acc, ticker) => {
        acc[ticker.symbol] = ticker;
        return acc;
    }, {} as Record<string, TickerData>)
  }, [marketData]);

  const value = {
    marketData,
    marketDataMap,
    priceDirections,
    valueDirections,
    loading,
  };

  return (
    <MarketDataContext.Provider value={value}>
      {children}
    </MarketDataContext.Provider>
  );
};

export const useMarketData = () => {
  const context = useContext(MarketDataContext);
  if (context === undefined) {
    throw new Error('useMarketData must be used within a MarketDataProvider');
  }
  return context;
};
