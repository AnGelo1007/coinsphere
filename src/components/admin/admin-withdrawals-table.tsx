
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Table, TableBody, TableCell, TableRow, TableHeader, TableHead } from '@/components/ui/table';
import { format } from 'date-fns';
import { db } from '@/lib/firebase';
import { ref, onValue, query, orderByChild, update, runTransaction, push, serverTimestamp } from 'firebase/database';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Search, MoreVertical, Filter, X } from 'lucide-react';
import type { Withdrawal, WithdrawalStatus } from '@/lib/actions';
import { Button } from '../ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '../ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '../ui/tooltip';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const badgeColorMap: Record<WithdrawalStatus, string> = {
    'Pending': 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50',
    'Successful': 'bg-green-500/20 text-green-500 border-green-500/50',
    'Failed': 'bg-red-500/20 text-red-500 border-red-500/50',
};
const availableStatuses: WithdrawalStatus[] = ['Pending', 'Successful', 'Failed'];

function WithdrawalsTableSkeleton() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Withdrawal Requests</CardTitle>
                <CardDescription>Review and manage all user withdrawal requests.</CardDescription>
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
                                    <TableHead>Asset</TableHead>
                                    <TableHead>Address</TableHead>
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
                                        <TableCell><Skeleton className="h-5 w-40" /></TableCell>
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

export function AdminWithdrawalsTable() {
    const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<WithdrawalStatus | null>(null);
    const { toast } = useToast();
    
    useEffect(() => {
        const withdrawalsRef = ref(db, 'withdrawals');
        const allWithdrawalsQuery = query(withdrawalsRef, orderByChild('date'));
        
        const unsubscribe = onValue(allWithdrawalsQuery, (snapshot) => {
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
    }, []);

    const filteredWithdrawals = useMemo(() => {
        let filtered = withdrawals;

        if (selectedStatus) {
            filtered = filtered.filter(w => w.status === selectedStatus);
        }

        if (searchQuery) {
            filtered = filtered.filter(w =>
                (w.userEmail?.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (w.asset?.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (w.walletAddress?.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (w.amount.toString().includes(searchQuery))
            );
        }
        
        return filtered;
    }, [withdrawals, searchQuery, selectedStatus]);


    const handleStatusChange = async (withdrawal: Withdrawal, status: WithdrawalStatus) => {
        const userRef = ref(db, `users/${withdrawal.userId}`);

        try {
            const updates: { [key: string]: any } = {};
            updates[`withdrawals/${withdrawal.id}/status`] = status;

            if (status === 'Successful') {
                await runTransaction(userRef, (currentData) => {
                    if (currentData) {
                        const currentBalance = currentData.portfolio?.[withdrawal.asset] || 0;
                        if (currentBalance < withdrawal.amount) {
                           // Not enough funds, abort transaction by returning undefined
                           // This could happen if the user spent the funds after requesting
                           return; 
                        }
                        if (!currentData.portfolio) currentData.portfolio = {};
                        currentData.portfolio[withdrawal.asset] = currentBalance - withdrawal.amount;
                    }
                    return currentData;
                });
            } else if (status === 'Failed' && withdrawal.status === 'Pending') {
                 // No action needed for failed if funds weren't pre-deducted.
                 // This block is only relevant if you were to change the logic to pre-deduct.
            }
            
            const message = `Your withdrawal of ${withdrawal.amount} ${withdrawal.asset} is now ${status}.`;
            const newNotificationRef = push(ref(db, `notifications/${withdrawal.userId}`));
            updates[`notifications/${withdrawal.userId}/${newNotificationRef.key}`] = {
                message: message,
                type: 'withdrawal',
                link: '/trader-dashboard/receipts?tab=withdrawals',
                timestamp: serverTimestamp(),
                read: false,
            };

            const adminMessage = `Withdrawal for ${withdrawal.userEmail} (${withdrawal.amount} ${withdrawal.asset}) marked as ${status}.`;
            const newAdminNotifRef = push(ref(db, 'admin-notifications'));
            updates[`admin-notifications/${newAdminNotifRef.key}`] = {
                message: adminMessage,
                type: 'withdrawal',
                link: '/trader-dashboard/admin/withdrawals',
                timestamp: serverTimestamp(),
                read: false,
            };
            
            await update(ref(db), updates);
            toast({ title: 'Status Updated', description: `Withdrawal status set to ${status}.` });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Update Failed', description: error.message || 'Failed to update withdrawal status. The user might not have had sufficient funds.' });
        }
    };
    

    if (loading) {
        return <WithdrawalsTableSkeleton />;
    }

    return (
        <Card>
             <CardHeader>
                <CardTitle>Withdrawal Requests</CardTitle>
                <CardDescription>Review and manage all user withdrawal requests.</CardDescription>
            </CardHeader>
            <CardContent>
                <TooltipProvider>
                    <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
                        <div className="relative flex-1 min-w-[250px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by user, asset, address..."
                                className="pl-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                             <Select value={selectedStatus || 'all'} onValueChange={(value) => setSelectedStatus(value === 'all' ? null : value as WithdrawalStatus)}>
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
                    {filteredWithdrawals.length === 0 ? (
                        <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                            <p>No withdrawal requests found{searchQuery || selectedStatus ? ' matching your filters' : ''}.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table className="min-w-full">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Asset</TableHead>
                                        <TableHead>Address</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredWithdrawals.map((withdrawal) => (
                                        <TableRow key={withdrawal.id}>
                                            <TableCell className="font-medium truncate max-w-[150px] whitespace-nowrap">{withdrawal.userEmail}</TableCell>
                                            <TableCell className="whitespace-nowrap">{format(new Date(withdrawal.date), 'MM/dd/yy HH:mm')}</TableCell>
                                            <TableCell>{withdrawal.amount.toLocaleString()}</TableCell>
                                            <TableCell>{withdrawal.asset}</TableCell>
                                            <TableCell>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <span className="text-muted-foreground cursor-default truncate block max-w-[120px]">{withdrawal.walletAddress}</span>
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
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-7 w-7">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        {availableStatuses.filter(s => s !== withdrawal.status).map(status => (
                                                            <DropdownMenuItem key={status} onSelect={() => handleStatusChange(withdrawal, status)}>
                                                                Mark as {status}
                                                            </DropdownMenuItem>
                                                        ))}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </TooltipProvider>
            </CardContent>
        </Card>
    );
}

    