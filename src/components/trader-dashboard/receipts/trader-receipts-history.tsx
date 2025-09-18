
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Table, TableBody, TableCell, TableRow, TableHeader, TableHead } from '@/components/ui/table';
import { format } from 'date-fns';
import { db, isConfigured } from '@/lib/firebase';
import { ref, onValue, query, orderByChild } from 'firebase/database';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Search, Key } from 'lucide-react';
import type { Receipt, ReceiptStatus } from '@/lib/actions';
import { useAuth } from '@/contexts/auth-context';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const badgeColorMap: Record<ReceiptStatus, string> = {
    'Processing': 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50',
    'Successful': 'bg-green-500/20 text-green-500 border-green-500/50',
    'Failed': 'bg-red-500/20 text-red-500 border-red-500/50',
};

function ReceiptsTableSkeleton() {
    return (
        <div className="space-y-4">
            <Skeleton className="h-10 w-full md:w-1/3" />
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Pair</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Transaction ID</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Array.from({ length: 5 }).map((_, index) => (
                            <TableRow key={index}>
                                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                                <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}

export function TraderReceiptsHistory() {
    const { user } = useAuth();
    const [receipts, setReceipts] = useState<Receipt[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    
    useEffect(() => {
        if (!user?.uid || !isConfigured || !db) {
            setLoading(false);
            return;
        }

        // Listen directly to the user's receipt path for real-time updates.
        const userReceiptsRef = query(ref(db, `receipts/${user.uid}`), orderByChild('date'));
        
        const unsubscribe = onValue(userReceiptsRef, (snapshot) => {
            const receiptsData: Receipt[] = [];
            if (snapshot.exists()) {
                snapshot.forEach((childSnapshot) => {
                    receiptsData.push({ id: childSnapshot.key!, ...childSnapshot.val() });
                });
            }
            // Firebase returns ascending, so we reverse to show newest first.
            setReceipts(receiptsData.reverse());
            setLoading(false);
        }, (error) => {
            console.error("Error fetching receipts:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user?.uid]);

    const filteredReceipts = useMemo(() => {
        if (!searchQuery) {
            return receipts;
        }
        return receipts.filter(receipt =>
            (receipt.pair?.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (receipt.transactionId?.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (receipt.status?.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (receipt.amount.toString().includes(searchQuery))
        );
    }, [receipts, searchQuery]);


    if (loading) {
        return <ReceiptsTableSkeleton />;
    }

    return (
        <TooltipProvider>
            <div className="mb-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by pair, amount, status, or transaction ID..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>
            {filteredReceipts.length === 0 ? (
                <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                    <p>You have not submitted any receipts.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Pair</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Transaction ID</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredReceipts.map((receipt) => (
                                <TableRow key={receipt.id}>
                                    <TableCell className="text-xs">{format(new Date(receipt.date), 'MM/dd/yy HH:mm')}</TableCell>
                                    <TableCell>${receipt.amount.toLocaleString()}</TableCell>
                                    <TableCell>{receipt.pair}</TableCell>
                                     <TableCell>
                                        <Badge variant='outline' className={cn('text-xs', badgeColorMap[receipt.status])}>
                                            {receipt.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                 <span className="flex items-center gap-2 text-xs text-muted-foreground cursor-default">
                                                    <Key className="h-4 w-4 shrink-0" />
                                                    <span className="truncate max-w-[120px] font-mono">{receipt.transactionId}</span>
                                                 </span>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p className="font-mono">{receipt.transactionId}</p>
                                            </TooltipContent>
                                        </Tooltip>
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
