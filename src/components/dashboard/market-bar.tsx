'use client';

import { Triangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TickerData } from '@/services/crypto-service';
import { useEffect, useState } from 'react';

type MarketBarProps = {
  initialData: TickerData[];
};

export default function MarketBar({ initialData }: MarketBarProps) {
  const [data, setData] = useState(initialData);

  // NOTE: This is a simple polling mechanism for demonstration.
  // In a real production app, you would use WebSockets for real-time updates.
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/market-data');
        if (response.ok) {
          const newData = await response.json();
          setData(newData);
        }
      } catch (error) {
        console.error('Failed to fetch market data for bar:', error);
      }
    }, 15000); // Poll every 15 seconds

    return () => clearInterval(interval);
  }, []);

  const renderMarqueeContent = () => (
    data.map((item, index) => (
      <div key={index} className="mx-4 flex items-center space-x-2 text-sm shrink-0">
        <span className="font-semibold text-foreground/80">{item.symbol}/USDT</span>
        <span className="text-muted-foreground">{item.price}</span>
        <div
          className={cn(
            'flex items-center text-xs',
            item.change.startsWith('-') ? 'text-red-500' : 'text-green-500'
          )}
        >
          <Triangle
            className={cn(
              'h-3 w-3 fill-current',
              item.change.startsWith('-') ? 'rotate-180' : 'rotate-0'
            )}
          />
          <span>{item.change.replace('-', '').replace('+', '')}</span>
        </div>
      </div>
    ))
  );

  return (
    <div className="w-full overflow-hidden border-b bg-card">
      <div className="relative flex overflow-x-hidden py-3">
        <div className="flex animate-marquee whitespace-nowrap">
          {renderMarqueeContent()}
        </div>
        <div className="absolute top-0 flex animate-marquee2 whitespace-nowrap py-3">
           {renderMarqueeContent()}
        </div>
      </div>
    </div>
  );
}
