
'use client';

import { useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { TickerData } from '@/services/crypto-service';
import { Button } from '../ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { getCryptoIcon } from '../crypto-icons';
import { useAuth } from '@/contexts/auth-context';
import { useMarketData } from '@/contexts/market-data-context';

export function MarketsTable({ initialData }: { initialData: TickerData[] }) {
  const { userProfile } = useAuth();
  const { marketData, priceDirections } = useMarketData();
  const data = marketData.length > 0 ? marketData : initialData;

  const renderTable = (tableData: TickerData[]) => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="p-2 md:p-4 text-xs md:text-sm">Coin</TableHead>
            <TableHead className="p-2 md:p-4 text-xs md:text-sm">Coin Price</TableHead>
            <TableHead className="p-2 md:p-4 text-xs md:text-sm">24H Change</TableHead>
            <TableHead className="text-right p-2 md:p-4 text-xs md:text-sm">Trade</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tableData.map((crypto) => {
            const Icon = getCryptoIcon(crypto.symbol);
            const direction = priceDirections[crypto.symbol];
            return (
              <TableRow key={crypto.symbol}>
                <TableCell className="p-2 md:p-4">
                  <div className="flex items-center gap-2 md:gap-4">
                    <div className="w-8 h-8 flex items-center justify-center">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold truncate max-w-[80px] sm:max-w-none text-xs md:text-sm">{crypto.name}</p>
                      <p className="text-muted-foreground text-xs">{crypto.symbol}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className={cn("font-mono p-2 md:p-4 text-xs md:text-sm transition-colors duration-200", {
                    'animate-flash-green': direction === 'up',
                    'animate-flash-red': direction === 'down',
                })}>{crypto.price}</TableCell>
                <TableCell className="p-2 md:p-4 text-xs md:text-sm">
                  <span
                    className={cn(
                      'whitespace-nowrap',
                      crypto.changeRaw >= 0 ? 'text-green-500' : 'text-red-500'
                    )}
                  >
                    {crypto.changeRaw >= 0 ? '+' : ''}{crypto.change}
                  </span>
                </TableCell>
                <TableCell className="text-right p-2 md:p-4">
                  <Button variant="ghost" size="sm" asChild className="text-xs md:text-sm h-8 px-2 md:px-3">
                    <Link href="/trader-dashboard/trade">Trade</Link>
                  </Button>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  );

  const walletData = useMemo(() => {
    if (!userProfile?.portfolio) return [];
    
    // Get symbols from the user's portfolio that have a balance > 0
    const walletSymbols = Object.keys(userProfile.portfolio).filter(
      (symbol) => userProfile.portfolio![symbol] > 0
    );

    // Filter the live market data to match the assets in the wallet
    return data.filter(crypto => walletSymbols.includes(crypto.symbol));
  }, [userProfile, data]);

  const topVolume = [...data].sort((a,b) => b.priceRaw - a.priceRaw).slice(0,5);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Markets</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="hot">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="hot">Hot</TabsTrigger>
            <TabsTrigger value="wallet">My Wallet</TabsTrigger>
            <TabsTrigger value="volume">24h Volume</TabsTrigger>
          </TabsList>
          <TabsContent value="hot">
            {renderTable(data)}
          </TabsContent>
          <TabsContent value="wallet">
            {walletData.length > 0 ? (
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="p-2 md:p-4 text-xs md:text-sm">Asset</TableHead>
                                <TableHead className="p-2 md:p-4 text-xs md:text-sm">Coin Price</TableHead>
                                <TableHead className="p-2 md:p-4 text-xs md:text-sm text-right">Available Balance</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {walletData.map((crypto) => {
                                const Icon = getCryptoIcon(crypto.symbol);
                                const availableBalance = userProfile?.portfolio?.[crypto.symbol] || 0;
                                const direction = priceDirections[crypto.symbol];
                                
                                return (
                                    <TableRow key={crypto.symbol}>
                                        <TableCell className="p-2 md:p-4">
                                            <div className="flex items-center gap-2 md:gap-4">
                                                <div className="w-8 h-8 flex items-center justify-center">
                                                    <Icon className="w-6 h-6" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold truncate max-w-[80px] sm:max-w-none text-xs md:text-sm">{crypto.name}</p>
                                                    <p className="text-muted-foreground text-xs">{crypto.symbol}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className={cn("font-mono p-2 md:p-4 text-xs md:text-sm transition-colors duration-200", {
                                            'animate-flash-green': direction === 'up',
                                            'animate-flash-red': direction === 'down',
                                        })}>{crypto.price}</TableCell>
                                        <TableCell className="font-mono p-2 md:p-4 text-xs md:text-sm text-right">
                                            {availableBalance.toFixed(6)}
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </div>
            ) : (
                <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                    <p>You have no assets in your wallet.</p>
                </div>
            )}
          </TabsContent>
          <TabsContent value="volume">
            {renderTable(topVolume)}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
