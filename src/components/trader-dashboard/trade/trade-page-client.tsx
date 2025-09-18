
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ShieldAlert, Briefcase, History, Info, ChevronDown, Loader2, ListOrdered, Repeat } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { TradingChart } from './trading-chart';
import { OrderForm } from './order-form';
import { OrderBook } from './order-book';
import { TradeHistory } from './trade-history';
import { useToast } from '@/hooks/use-toast';
import type { Order, Trade, CandlestickData, TickerData } from './types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getCryptoIcon } from '../../crypto-icons';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { OrderHistory } from './order-history';
import { AdminOrderHistory } from './admin-order-history';
import { useMarketData } from '@/contexts/market-data-context';
import { db } from '@/lib/firebase';
import { ref, runTransaction, push, set, serverTimestamp } from 'firebase/database';
import { ConvertAssetCard } from './convert-asset-form';

function VerificationRequiredCard() {
    return (
        <Card className="max-w-md mx-auto mt-10">
            <CardHeader className="text-center">
                <ShieldAlert className="mx-auto h-12 w-12 text-primary" />
                <CardTitle className="mt-4">Account Verification Required</CardTitle>
                <CardDescription>
                    To ensure the security of our platform, you must verify your account before you can start trading.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground text-center">
                    Please go to your account page to complete the verification process.
                </p>
            </CardContent>
            <CardFooter>
                <Button className="w-full" asChild>
                    <Link href="/trader-dashboard/account">
                        Verify Account
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
}

function LoadingState() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-3 space-y-4">
                <Skeleton className="h-[400px] w-full" />
                <Skeleton className="h-[300px] w-full" />
                <Skeleton className="h-[200px] w-full" />
            </div>
            <div className="lg:col-span-1 space-y-4">
                <Skeleton className="h-[300px] w-full" />
                <Skeleton className="h-[300px] w-full" />
            </div>
        </div>
    );
}

const tradingPairs = ['BTC', 'ETH', 'SOL', 'BNB', 'DOGE', 'ADA', 'LINK', 'MATIC'];
const timeframes = ['1m', '5m', '15m', '30m', '1h', '1d'];


function PairsList({ pairs, currentPair, onPairSelect }: { pairs: string[], currentPair: string, onPairSelect: (pair: string) => void }) {
    const { marketDataMap, priceDirections } = useMarketData();

    return (
        <ScrollArea className="h-full max-h-[300px] md:max-h-none pr-4">
            <Table>
                 <TableHeader>
                    <TableRow>
                        <TableHead className="h-8 p-2 text-xs">Pair</TableHead>
                        <TableHead className="h-8 p-2 text-xs text-right">Price</TableHead>
                    </TableRow>
                 </TableHeader>
                <TableBody>
                    {pairs.map(pair => {
                        const data = marketDataMap[pair];
                        const direction = priceDirections[pair];
                        if (!data) return null;
                        
                        return (
                        <TableRow key={pair} data-active={currentPair === pair} onClick={() => onPairSelect(pair)} className="cursor-pointer">
                            <TableCell className="p-2">
                                 <div className="flex items-center gap-2">
                                     {React.createElement(getCryptoIcon(pair), { className: 'w-4 h-4' })}
                                    <span className="font-semibold text-xs">{pair}/USDT</span>
                                 </div>
                            </TableCell>
                            <TableCell className={cn("p-2 text-right text-xs transition-colors duration-200", {
                                'text-green-500': direction === 'up',
                                'text-red-500': direction === 'down',
                            })}>
                                {data.price}
                            </TableCell>
                        </TableRow>
                    )})}
                </TableBody>
            </Table>
        </ScrollArea>
    )
}

export function TradePageClient({ initialMarketData }: { initialMarketData: TickerData[] }) {
    const { user, isVerified, isAdmin, userProfile, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const { marketDataMap } = useMarketData();
    
    const [selectedPair, setSelectedPair] = useState('BTC');
    const [selectedInterval, setSelectedInterval] = useState('1h');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [candlestickData, setCandlestickData] = useState<CandlestickData[]>([]);
    const [orderBook, setOrderBook] = useState<{ bids: Order[]; asks: Order[] }>({ bids: [], asks: [] });
    const [tradeHistory, setTradeHistory] = useState<Trade[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);

    const PairIcon = getCryptoIcon(selectedPair);
    
    const timezone = userProfile?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

    const currentPrice = useMemo(() => {
        const livePrice = marketDataMap[selectedPair]?.priceRaw;
        if (livePrice) {
            return livePrice;
        }
        if (candlestickData.length > 0) {
            return candlestickData[candlestickData.length - 1].close;
        }
        return 0;
    }, [marketDataMap, selectedPair, candlestickData]);
    
    const fetchTradeData = useCallback(async (pair: string, interval: string) => {
        setIsLoadingData(true);
        try {
            const response = await fetch(`/api/trade-data/${pair}?interval=${interval}`);
            if (!response.ok) {
                throw new Error('Failed to fetch trade data');
            }
            const data = await response.json();
            
            setCandlestickData(data.candlestickData);
            setOrderBook(data.orderBook);
            setTradeHistory(data.trades);

        } catch (error) {
            console.error("Failed to fetch live trade data:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Could not load live market data. Please try again later.",
            });
        } finally {
            setIsLoadingData(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchTradeData(selectedPair, selectedInterval);
        const intervalId = setInterval(() => fetchTradeData(selectedPair, selectedInterval), 60000);
        return () => clearInterval(intervalId);
    }, [selectedPair, selectedInterval, fetchTradeData]);
    
    const handleOrderSubmit = async (data: { amount: number; timeframe: string; profitRate: number; orderType: 'Buy Up' | 'Buy Down' }) => {
        if (!user || !userProfile) {
            toast({ variant: "destructive", title: "Not Logged In" });
            return;
        }

        setIsSubmitting(true);
        
        try {
            const userRef = ref(db, `users/${user.uid}`);
            const transactionResult = await runTransaction(userRef, (currentData) => {
                if (currentData) {
                    const currentBalance = currentData.portfolio?.['USDT'] || 0;
                    if (currentBalance < data.amount) {
                        return; // Abort transaction
                    }
                    currentData.portfolio['USDT'] = currentBalance - data.amount;
                }
                return currentData;
            });

            if (!transactionResult.committed) {
                toast({
                    variant: "destructive",
                    title: "Order Failed",
                    description: 'Insufficient funds to place the order.',
                });
                setIsSubmitting(false);
                return;
            }

            const ordersRef = ref(db, 'orders');
            const newOrderRef = push(ordersRef);
            
            const now = Date.now();
            const timeParts = data.timeframe.split(' ');
            const durationValue = parseInt(timeParts[0]);
            let durationMs = 0;
            if (timeParts[1].startsWith('minute')) {
                durationMs = durationValue * 60 * 1000;
            } else if (timeParts[1].startsWith('hour')) {
                durationMs = durationValue * 60 * 60 * 1000;
            } else if (timeParts[1].startsWith('day')) {
                durationMs = durationValue * 24 * 60 * 60 * 1000;
            }
            
            const transactionId = `ORD-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

            await set(newOrderRef, {
                userId: user.uid,
                userEmail: user.email || 'N/A',
                pair: selectedPair,
                type: data.orderType,
                amount: data.amount,
                asset: 'USDT',
                timeframe: data.timeframe,
                profitRate: data.profitRate,
                currentPrice: currentPrice,
                date: now,
                expiresAt: now + durationMs,
                total: data.amount,
                price: currentPrice,
                status: 'Pending',
                transactionId: transactionId
            });

            // Notify Admin
            const adminNotificationsRef = ref(db, 'admin-notifications');
            const newAdminNotificationRef = push(adminNotificationsRef);
            await set(newAdminNotificationRef, {
                message: `${user.email} placed a new order for ${selectedPair}/USDT (ID: ${transactionId}).`,
                type: 'order',
                link: '/trader-dashboard/trade',
                timestamp: serverTimestamp(),
                read: false,
            });

            toast({
                title: 'Order Placed',
                description: `Your ${data.orderType.toLowerCase()} order for ${data.amount} USDT on ${selectedPair} has been submitted.`,
            });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Order Failed",
                description: error.message || 'An unexpected error occurred while placing your order.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (authLoading) {
        return <LoadingState />;
    }

    if (!isVerified && !isAdmin) {
        return <VerificationRequiredCard />;
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Main Content Column */}
            <div className="lg:col-span-3 space-y-4">
                 <Card>
                    <CardHeader className="flex-col items-start gap-4">
                        <div className="flex items-start justify-between w-full flex-wrap gap-4">
                            <div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="p-2 h-auto text-left">
                                            <div className="flex items-center gap-2">
                                                 <PairIcon className="w-8 h-8" />
                                                <div>
                                                    <CardTitle className="flex items-center gap-2">
                                                        {selectedPair}/USDT <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                                    </CardTitle>
                                                    <CardDescription>
                                                       <span className="text-muted-foreground">Select Pair</span>
                                                    </CardDescription>
                                                </div>
                                            </div>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        {tradingPairs.map(pair => (
                                            <DropdownMenuItem key={pair} onSelect={() => setSelectedPair(pair)}>
                                                {pair}/USDT
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-muted-foreground">Last Price</p>
                                {isLoadingData && currentPrice === 0 ? <Skeleton className="h-8 w-32 mt-1" /> : (
                                    <p className="text-2xl font-bold">
                                        ${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-1 flex-wrap">
                            {timeframes.map(tf => (
                                <Button 
                                    key={tf} 
                                    variant={selectedInterval === tf ? 'secondary' : 'ghost'} 
                                    size="sm" 
                                    className="h-7 px-2 text-xs"
                                    onClick={() => setSelectedInterval(tf)}
                                >
                                    {tf.toUpperCase()}
                                </Button>
                            ))}
                        </div>
                    </CardHeader>
                    <CardContent className="h-[450px] p-0">
                        {isLoadingData ? <div className="w-full h-full flex justify-center items-center"><Loader2 className="h-8 w-8 animate-spin" /></div> : <TradingChart candlestickData={candlestickData} timezone={timezone} />}
                    </CardContent>
                </Card>
                
                {!isAdmin && (
                    <>
                        <ConvertAssetCard />
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Briefcase /> Place Order</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <OrderForm 
                                    onSubmit={handleOrderSubmit}
                                    isSubmitting={isSubmitting}
                                />
                            </CardContent>
                        </Card>
                    </>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><ListOrdered /> Order History</CardTitle>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                       {isAdmin ? <AdminOrderHistory /> : <OrderHistory userId={user?.uid} />}
                    </CardContent>
                </Card>
            </div>

             {/* Sidebar Column */}
            <div className="lg:col-span-1 space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Pairs</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <PairsList pairs={tradingPairs} currentPair={selectedPair} onPairSelect={setSelectedPair} />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Order Book</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <OrderBook bids={orderBook.bids} asks={orderBook.asks} />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base"><History /> Trade History</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <TradeHistory trades={tradeHistory} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
