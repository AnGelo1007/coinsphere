
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Table, TableBody, TableCell, TableRow, TableHeader, TableHead } from '@/components/ui/table';
import { format } from 'date-fns';
import { db, isConfigured } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Search, CheckCircle, Key, X } from 'lucide-react';
import type { Receipt, ReceiptStatus } from '@/lib/actions';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ApproveReceiptDialog } from './approve-receipt-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


const badgeColorMap: Record<ReceiptStatus, string> = {
    'Processing': 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50',
    'Successful': 'bg-green-500/20 text-green-500 border-green-500/50',
    'Failed': 'bg-red-500/20 text-red-500 border-red-500/50',
};
const availableStatuses: ReceiptStatus[] = ['Processing', 'Successful', 'Failed'];

function ReceiptsTableSkeleton() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Deposit Receipts</CardTitle>
                <CardDescription>Review and approve user deposit submissions.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <Skeleton className="h-10 w-full md:w-1/3" />
                     <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Pair</TableHead>
                                    <TableHead>Transaction ID</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {Array.from({ length: 5 }).map((_, index) => (
                                    <TableRow key={index}>
                                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                                        <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export function AdminReceiptsTable() {
    const [receipts, setReceipts] = useState<Receipt[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<ReceiptStatus | null>(null);
    const [isApproveOpen, setIsApproveOpen] = useState(false);
    const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
    
    useEffect(() => {
        if (!isConfigured || !db) return;
        const receiptsRef = ref(db, 'receipts');
        
        const unsubscribe = onValue(receiptsRef, async (snapshot) => {
            const allReceipts: Receipt[] = [];
            if (snapshot.exists()) {
                snapshot.forEach(userSnapshot => {
                    const userReceipts = userSnapshot.val();
                    for (const receiptId in userReceipts) {
                        allReceipts.push({
                            id: `${userSnapshot.key}/${receiptId}`, // Composite ID
                            ...userReceipts[receiptId]
                        });
                    }
                });
            }
            setReceipts(allReceipts.sort((a, b) => (b.date || 0) - (a.date || 0)));
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const filteredReceipts = useMemo(() => {
        let filtered = receipts;

        if (selectedStatus) {
            filtered = filtered.filter(r => r.status === selectedStatus);
        }

        if (searchQuery) {
            filtered = filtered.filter(receipt =>
                (receipt.userEmail?.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (receipt.pair?.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (receipt.transactionId?.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (receipt.amount && receipt.amount.toString().includes(searchQuery))
            );
        }

        return filtered;
    }, [receipts, searchQuery, selectedStatus]);


    const handleApprove = (receipt: Receipt) => {
        setSelectedReceipt(receipt);
        setIsApproveOpen(true);
    };

    if (loading) {
        return <ReceiptsTableSkeleton />;
    }

    return (
        <Card>
             <CardHeader>
                <CardTitle>Deposit Receipts</CardTitle>
                <CardDescription>Review and approve user deposit submissions.</CardDescription>
            </CardHeader>
            <CardContent>
                <TooltipProvider>
                    <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
                        <div className="relative flex-1 min-w-[250px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by user, pair, TX ID..."
                                className="pl-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                             <Select value={selectedStatus || 'all'} onValueChange={(value) => setSelectedStatus(value === 'all' ? null : value as ReceiptStatus)}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Filter by status..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    {availableStatuses.map(status => (
                                        <SelectItem key={status} value={status}>{status}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {selectedStatus && (
                                <Button variant="ghost" size="icon" onClick={() => setSelectedStatus(null)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>
                    {filteredReceipts.length === 0 ? (
                        <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                            <p>No receipts found{searchQuery || selectedStatus ? ' matching your filters' : ''}.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table className="min-w-full">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Pair</TableHead>
                                        <TableHead>Transaction ID</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredReceipts.map((receipt) => (
                                        <TableRow key={receipt.id}>
                                            <TableCell className="font-medium truncate max-w-[150px] whitespace-nowrap">{receipt.userEmail}</TableCell>
                                            <TableCell className="whitespace-nowrap">
                                                {typeof receipt.date === 'number'
                                                  ? format(new Date(receipt.date), 'MM/dd/yy HH:mm')
                                                  : 'Processing...'}
                                            </TableCell>
                                            <TableCell>${typeof receipt.amount === 'number' ? receipt.amount.toLocaleString() : '0.00'}</TableCell>
                                            <TableCell>{receipt.pair}</TableCell>
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
                                            <TableCell>
                                                <Badge variant='outline' className={cn('text-xs', badgeColorMap[receipt.status])}>
                                                    {receipt.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {receipt.status === 'Processing' ? (
                                                    <Button onClick={() => handleApprove(receipt)} size="sm">
                                                        <CheckCircle className="mr-2 h-4 w-4" />
                                                        Review
                                                    </Button>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">Reviewed</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                    <ApproveReceiptDialog isOpen={isApproveOpen} onOpenChange={setIsApproveOpen} receipt={selectedReceipt} />
                </TooltipProvider>
            </CardContent>
        </Card>
    );
}
