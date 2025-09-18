import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Image from 'next/image';
import { Triangle, GripVertical, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { TickerData } from '@/services/crypto-service';

type WatchlistProps = {
  initialData: TickerData[];
};

export default function Watchlist({ initialData }: WatchlistProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Watchlist</CardTitle>
            <CardDescription>Your favorite assets</CardDescription>
          </div>
          <Button variant="ghost" size="icon">
            <Star className="w-5 h-5 text-yellow-400 fill-current" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {initialData.map((item) => (
            <li key={item.symbol} className="flex items-center space-x-4 group">
              <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
              <Image src={item.logo} alt={item.name} width={32} height={32} data-ai-hint={`${item.name} logo`} />
              <div className="flex-1">
                <p className="font-semibold">{item.symbol}</p>
                <p className="text-sm text-muted-foreground">{item.name}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{item.price}</p>
                <div
                  className={cn(
                    'flex items-center justify-end text-xs',
                    item.change.startsWith('-') ? 'text-red-500' : 'text-green-500'
                  )}
                >
                  <Triangle
                    className={cn(
                      'h-3 w-3 fill-current',
                       item.change.startsWith('-') ? 'rotate-180' : 'rotate-0'
                    )}
                  />
                  <span>{item.change}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
