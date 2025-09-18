
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Table, TableBody, TableCell, TableRow, TableHeader, TableHead } from '@/components/ui/table';
import type { OrderHistoryItem } from './types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { db } from '@/lib/firebase';
import { ref, onValue, query, orderByChild, equalTo } from 'firebase/database';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface OrderHistoryProps {
  userId: string | undefined;
}

const badgeColorMap: Record<OrderHistoryItem['status'], string> = {
    'Pending': 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50',
    'Now Processing': 'bg-blue-500/20 text-blue-500 border-blue-500/50',
    'Completed': 'bg-green-500/20 text-green-500 border-green-500/50',
    'Failed': 'bg-red-500/20 text-red-500 border-red-500/50',
};

function OrderHistorySkeleton() {
    return (
        <div className="space-y-4">
            <Skeleton className="h-10 w-full md:w-1/3" />
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Pair</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Investment</TableHead>
                            <TableHead>Profit</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Array.from({ length: 3 }).map((_, index) => (
                            <TableRow key={index}>
                                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}

export function OrderHistory({ userId }: OrderHistoryProps) {
    const [orders, setOrders] = useState<OrderHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    
    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        };

        const ordersRef = ref(db, 'orders');
        const userOrdersQuery = query(ordersRef, orderByChild('userId'), equalTo(userId));
        
        const unsubscribe = onValue(userOrdersQuery, (snapshot) => {
            const ordersData: OrderHistoryItem[] = [];
            if (snapshot.exists()) {
                snapshot.forEach((childSnapshot) => {
                    ordersData.push({ id: childSnapshot.key!, ...childSnapshot.val() });
                });
            }
             // Sort by date descending
            setOrders(ordersData.sort((a, b) => b.date - a.date));
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userId]);

    const filteredOrders = useMemo(() => {
        if (!searchQuery) {
            return orders;
        }
        return orders.filter(order =>
            order.pair.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [orders, searchQuery]);


  if (loading) {
    return <OrderHistorySkeleton />;
  }

  return (
    <Card>
        <CardHeader>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                placeholder="Search by pair..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
        </CardHeader>
        <CardContent>
            {filteredOrders.length === 0 ? (
                <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                    <p>You have no open or past orders{searchQuery && ' matching your search'}.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Pair</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Entry Price</TableHead>
                            <TableHead>Investment</TableHead>
                            <TableHead>Profit/Loss</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {filteredOrders.map((order) => {
                            const profitLoss = order.status === 'Completed'
                                ? order.total * (order.profitRate / 100)
                                : order.status === 'Failed'
                                ? -order.total
                                : 0;
                            return (
                                <TableRow key={order.id}>
                                <TableCell className="text-xs whitespace-nowrap">{format(order.date, 'MM/dd/yy HH:mm:ss')}</TableCell>
                                <TableCell>{order.pair}/USDT</TableCell>
                                <TableCell
                                    className={cn(
                                    'font-medium',
                                    order.type === 'Buy Up' ? 'text-green-500' : 'text-red-500'
                                    )}
                                >
                                    {order.type}
                                </TableCell>
                                <TableCell>${order.price.toFixed(2)}</TableCell>
                                <TableCell>${order.total.toFixed(2)}</TableCell>
                                 <TableCell className={cn(
                                    'font-medium',
                                    profitLoss > 0 ? 'text-green-500' : profitLoss < 0 ? 'text-red-500' : ''
                                )}>
                                    {profitLoss >= 0 ? `+$${profitLoss.toFixed(2)}` : `-$${Math.abs(profitLoss).toFixed(2)}`}
                                </TableCell>
                                <TableCell>
                                    <Badge variant='outline' className={cn(badgeColorMap[order.status])}>
                                        {order.status}
                                    </Badge>
                                </TableCell>
                                </TableRow>
                            )
                        })}
                        </TableBody>
                    </Table>
                </div>
            )}
        </CardContent>
    </Card>
  );
}
