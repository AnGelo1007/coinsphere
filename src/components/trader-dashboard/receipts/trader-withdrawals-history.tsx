
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Table, TableBody, TableCell, TableRow, TableHeader, TableHead } from '@/components/ui/table';
import { format } from 'date-fns';
import { db } from '@/lib/firebase';
import { ref, onValue, query, orderByChild, equalTo } from 'firebase/database';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import type { Withdrawal, WithdrawalStatus } from '@/lib/actions';
import { useAuth } from '@/contexts/auth-context';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const badgeColorMap: Record<WithdrawalStatus, string> = {
    'Pending': 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50',
    'Successful': 'bg-green-500/20 text-green-500 border-green-500/50',
    'Failed': 'bg-red-500/20 text-red-500 border-red-500/50',
};


function WithdrawalsTableSkeleton() {
    return (
        <div className="space-y-4">
            <Skeleton className="h-10 w-full md:w-1/3" />
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Asset</TableHead>
                            <TableHead>Address</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Array.from({ length: 5 }).map((_, index) => (
                            <TableRow key={index}>
                                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                                <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}

export function TraderWithdrawalsHistory() {
    const { user } = useAuth();
    const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    
    useEffect(() => {
        if (!user?.uid) {
            setLoading(false);
            return;
        }
        const withdrawalsRef = ref(db, 'withdrawals');
        const userWithdrawalsQuery = query(withdrawalsRef, orderByChild('userId'), equalTo(user.uid));
        
        const unsubscribe = onValue(userWithdrawalsQuery, (snapshot) => {
            const data: Withdrawal[] = [];
            if (snapshot.exists()) {
                snapshot.forEach((childSnapshot) => {
                    data.push({ id: childSnapshot.key!, ...childSnapshot.val() });
                });
            }
            setWithdrawals(data.reverse()); // Show newest first
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user?.uid]);

    const filteredWithdrawals = useMemo(() => {
        if (!searchQuery) {
            return withdrawals;
        }
        return withdrawals.filter(w =>
            (w.asset?.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (w.walletAddress?.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (w.amount.toString().includes(searchQuery))
        );
    }, [withdrawals, searchQuery]);


    if (loading) {
        return <WithdrawalsTableSkeleton />;
    }

    return (
        <TooltipProvider>
            <div className="mb-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by asset, amount, address..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>
            {filteredWithdrawals.length === 0 ? (
                <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                    <p>You have not made any withdrawal requests.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Asset</TableHead>
                                <TableHead>Address</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredWithdrawals.map((withdrawal) => (
                                <TableRow key={withdrawal.id}>
                                    <TableCell className="text-xs">{format(new Date(withdrawal.date), 'MM/dd/yy HH:mm')}</TableCell>
                                    <TableCell>{withdrawal.amount.toLocaleString()}</TableCell>
                                    <TableCell>{withdrawal.asset}</TableCell>
                                    <TableCell>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                 <span className="text-xs text-muted-foreground cursor-default truncate block max-w-[120px]">{withdrawal.walletAddress}</span>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{withdrawal.walletAddress}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant='outline' className={cn('text-xs', badgeColorMap[withdrawal.status])}>
                                            {withdrawal.status}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </TooltipProvider>
    );
}
