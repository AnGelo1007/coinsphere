
'use client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from './ui/button';
import { Triangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Skeleton } from './ui/skeleton';
import { getCryptoIcon } from './crypto-icons';
import { useLanguage } from '@/contexts/language-context';
import { useMarketData } from '@/contexts/market-data-context';
import type { TickerData } from '@/services/crypto-service';
import { useAuth } from '@/contexts/auth-context';

export default function LiveMarketTable({ initialData }: { initialData: TickerData[] }) {
  const { t } = useLanguage();
  const { marketData, priceDirections, loading } = useMarketData();
  const { user } = useAuth();
  const data = marketData.length > 0 ? marketData : initialData;
  const tradeHref = user ? '/trader-dashboard/trade' : '/login';

  return (
    <div className="bg-card/50 border rounded-lg p-4 overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('asset')}</TableHead>
            <TableHead>{t('price')}</TableHead>
            <TableHead>{t('change24h')}</TableHead>
            <TableHead>{t('marketCap')}</TableHead>
            <TableHead className="text-right">{t('trade')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading && data.length === 0 ? (
            Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                    <TableCell><div className='flex items-center gap-2'><Skeleton className='h-8 w-8 rounded-full' /><Skeleton className='h-6 w-24' /></div></TableCell>
                    <TableCell><Skeleton className='h-6 w-32' /></TableCell>
                    <TableCell><Skeleton className='h-6 w-20' /></TableCell>
                    <TableCell><Skeleton className='h-6 w-28' /></TableCell>
                    <TableCell className='text-right'><Skeleton className='h-10 w-24 ml-auto' /></TableCell>
                </TableRow>
            ))
          ) : data.map((crypto) => {
            const Icon = getCryptoIcon(crypto.symbol);
            const direction = priceDirections[crypto.symbol];
            return (
              <TableRow key={crypto.symbol}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 flex items-center justify-center">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold">{crypto.name}</span>
                      <span className="text-muted-foreground ml-2">{crypto.symbol}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className={cn("font-mono transition-colors duration-200", {
                    'animate-flash-green': direction === 'up',
                    'animate-flash-red': direction === 'down',
                })}>{crypto.price}</TableCell>
                <TableCell>
                  <div
                    className={cn(
                      'flex items-center',
                      crypto.changeRaw >= 0 ? 'text-green-500' : 'text-red-500'
                    )}
                  >
                    <Triangle
                      className={cn(
                        'h-3 w-3 fill-current mr-1',
                        crypto.changeRaw >= 0 ? 'rotate-0' : 'rotate-180'
                      )}
                    />
                    {crypto.change}
                  </div>
                </TableCell>
                <TableCell>{crypto.marketCap}</TableCell>
                <TableCell className="text-right">
                  <Button variant="secondary" size="sm" asChild>
                    <Link href={tradeHref}>{t('trade')}</Link>
                  </Button>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  );
}
