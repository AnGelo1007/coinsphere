

'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Table, TableBody, TableCell, TableRow, TableHeader, TableHead } from '@/components/ui/table';
import type { OrderHistoryItem } from './types';
import { format, formatDistanceToNowStrict } from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { db } from '@/lib/firebase';
import { ref, onValue, query, orderByChild, update, push, serverTimestamp, set, get } from 'firebase/database';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Search, CheckCircle, XCircle, User, X, Filter, Wand2, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { ResolveOrderDialog } from './resolve-order-dialog';
import type { UserProfile } from '@/services/user-service';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { processExpiredOrdersAction, createNotification, updateManipulationModeAction, sendExpirationRemindersAction } from '@/lib/actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';

function CountdownProgress({ expiresAt, onComplete }: { expiresAt: number, onComplete: () => void }) {
    const totalDuration = 60 * 1000; // Assuming all pending are within 1 minute for this simple UI
    const [timeLeft, setTimeLeft] = useState(expiresAt - Date.now());

    useEffect(() => {
        const interval = setInterval(() => {
            const newTimeLeft = expiresAt - Date.now();
            if (newTimeLeft <= 0) {
                setTimeLeft(0);
                clearInterval(interval);
                onComplete();
            } else {
                setTimeLeft(newTimeLeft);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [expiresAt, onComplete]);

    const progress = Math.max(0, (timeLeft / totalDuration) * 100);
    const secondsLeft = Math.ceil(timeLeft / 1000);

    if (timeLeft <= 0) {
        return <Badge variant='outline' className={cn('text-xs', badgeColorMap['Now Processing'])}>Now Processing</Badge>;
    }

    return (
        <div className="flex items-center gap-2">
            <Progress value={progress} className="h-2 w-20" />
            <span className="text-xs text-muted-foreground">{secondsLeft}s</span>
        </div>
    );
}

const OrderRow = ({ order, onResolveClick, manipulationMode, isSelected, onToggleRow, onStatusChange }: { order: OrderHistoryItem, onResolveClick: (order: OrderHistoryItem, status: 'Completed' | 'Failed') => void, manipulationMode: boolean, isSelected: boolean, onToggleRow: (id: string, checked: boolean) => void, onStatusChange: (orderId: string, newStatus: 'Now Processing') => void }) => {
    const isPending = order.status === 'Pending';
    const isProcessing = order.status === 'Now Processing';

    return (
        <TableRow key={order.id} data-state={isSelected && "selected"}>
            <TableCell>
                <Checkbox 
                    checked={isSelected}
                    onCheckedChange={(checked) => onToggleRow(order.id, !!checked)}
                    aria-label="Select row"
                />
            </TableCell>
            <TableCell className="text-xs font-mono">{order.transactionId || 'N/A'}</TableCell>
            <TableCell className="text-xs font-medium truncate max-w-[150px] whitespace-nowrap">{order.userEmail}</TableCell>
            <TableCell className="text-xs whitespace-nowrap">{format(order.date, 'MM/dd/yy HH:mm')}</TableCell>
            <TableCell className="text-xs whitespace-nowrap text-muted-foreground">{format(order.expiresAt, 'MM/dd/yy HH:mm')}</TableCell>
            <TableCell>{order.pair}/USDT</TableCell>
            <TableCell className={cn('font-medium', order.type === 'Buy Up' ? 'text-green-500' : 'text-red-500')}>
                {order.type}
            </TableCell>
            <TableCell className="text-xs">{order.timeframe}</TableCell>
            <TableCell>${order.price.toFixed(2)}</TableCell>
            <TableCell>${order.total.toFixed(2)}</TableCell>
            <TableCell>
                {isPending ? (
                    <CountdownProgress expiresAt={order.expiresAt} onComplete={() => onStatusChange(order.id, 'Now Processing')} />
                ) : (
                    <Badge variant='outline' className={cn('text-xs', badgeColorMap[order.status])}>
                        {order.status}
                    </Badge>
                )}
            </TableCell>
            <TableCell className="text-right">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7" disabled={!manipulationMode && (isPending || isProcessing)}>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => onResolveClick(order, 'Completed')} disabled={!manipulationMode && (isPending || isProcessing)}>
                            <CheckCircle className="mr-2 h-4 w-4 text-green-500" /> Mark as Successful
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => onResolveClick(order, 'Failed')} disabled={!manipulationMode && (isPending || isProcessing)}>
                            <XCircle className="mr-2 h-4 w-4 text-red-500" /> Mark as Failed
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </TableCell>
        </TableRow>
    );
};


const badgeColorMap: Record<OrderHistoryItem['status'], string> = {
    'Pending': 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50',
    'Now Processing': 'bg-blue-500/20 text-blue-500 border-blue-500/50',
    'Completed': 'bg-green-500/20 text-green-500 border-green-500/50',
    'Failed': 'bg-red-500/20 text-red-500 border-red-500/50',
};

const statuses: OrderHistoryItem['status'][] = ['Pending', 'Now Processing', 'Completed', 'Failed'];

function AdminOrderHistorySkeleton() {
    return (
        <div className="space-y-4">
            <Skeleton className="h-10 w-full md:w-1/3" />
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead></TableHead>
                            <TableHead>Transaction ID</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Ending Time</TableHead>
                            <TableHead>Pair</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Open Time</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Array.from({ length: 5 }).map((_, index) => (
                            <TableRow key={index}>
                                <TableCell><Skeleton className="h-5 w-5" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                                <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}

export function AdminOrderHistory() {
    const [orders, setOrders] = useState<OrderHistoryItem[]>([]);
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [selectedStatus, setSelectedStatus] = useState<OrderHistoryItem['status'] | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    
    const [isResolveDialogOpen, setIsResolveDialogOpen] = useState(false);
    const [orderToResolve, setOrderToResolve] = useState<{order: OrderHistoryItem, status: 'Completed' | 'Failed'} | null>(null);

    const [manipulationMode, setManipulationMode] = useState(false);
    const [isManipulationLoading, setIsManipulationLoading] = useState(true);
    
    useEffect(() => {
        const settingsRef = ref(db, 'settings/manipulationMode');
        const unsubscribe = onValue(settingsRef, (snapshot) => {
          setManipulationMode(snapshot.val() ?? false);
          setIsManipulationLoading(false);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const ordersRef = ref(db, 'orders');
        const allOrdersQuery = query(ordersRef, orderByChild('date'));

        let ordersLoaded = false;
        let usersLoaded = false;

        const checkLoadingDone = () => {
            if (ordersLoaded && usersLoaded) {
                setLoading(false);
            }
        };
        
        const unsubscribeOrders = onValue(allOrdersQuery, (snapshot) => {
            const ordersData: OrderHistoryItem[] = [];
            if (snapshot.exists()) {
                snapshot.forEach((childSnapshot) => {
                    ordersData.push({ id: childSnapshot.key!, ...childSnapshot.val() });
                });
            }
            setOrders(ordersData.reverse());
            ordersLoaded = true;
            checkLoadingDone();
        });

        const usersRef = ref(db, 'users');
        const unsubscribeUsers = onValue(usersRef, (snapshot) => {
            const usersData: UserProfile[] = [];
            if (snapshot.exists()) {
                snapshot.forEach((childSnapshot) => {
                    if (!childSnapshot.val().isAdmin) {
                        usersData.push({ uid: childSnapshot.key!, ...childSnapshot.val() });
                    }
                });
            }
            setUsers(usersData);
            usersLoaded = true;
            checkLoadingDone();
        });

        return () => {
            unsubscribeOrders();
            unsubscribeUsers();
        };
    }, []);

     useEffect(() => {
        const intervalId = setInterval(() => {
            if (!manipulationMode) { // Auto Win Mode is ON
                processExpiredOrdersAction();
            } else { // Manual Mode is ON
                sendExpirationRemindersAction();
            }
        }, 10000); // Check every 10 seconds

        return () => clearInterval(intervalId);
    }, [manipulationMode]);

    const filteredOrders = useMemo(() => {
        let filtered = orders;
        
        if (selectedUserId) {
            filtered = filtered.filter(order => order.userId === selectedUserId);
        }

        if (selectedStatus) {
            filtered = filtered.filter(order => order.status === selectedStatus);
        }

        if (searchQuery) {
            filtered = filtered.filter(order =>
                (order.userEmail?.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (order.pair?.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (order.transactionId?.toLowerCase().includes(searchQuery.toLowerCase()))
            );
        }
        
        const visibleIds = new Set(filtered.map(r => r.id));
        const newSelection = selectedIds.filter(id => visibleIds.has(id));
        if (newSelection.length !== selectedIds.length) {
            setSelectedIds(newSelection);
        }

        return filtered;
    }, [orders, searchQuery, selectedUserId, selectedStatus, selectedIds]);
    
    const handleToggleAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(filteredOrders.map(t => t.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleToggleRow = (id: string, checked: boolean) => {
        if (checked) {
            setSelectedIds(prev => [...prev, id]);
        } else {
            setSelectedIds(prev => prev.filter(rowId => rowId !== id));
        }
    };
    
    const handleLocalStatusChange = (orderId: string, newStatus: 'Now Processing') => {
        setOrders(prevOrders => 
            prevOrders.map(order => 
                order.id === orderId ? { ...order, status: newStatus } : order
            )
        );
        // Also update in the database without waiting
        update(ref(db, `orders/${orderId}`), { status: newStatus });
    };

    const handleDelete = async () => {
        try {
            const updates: { [key: string]: null } = {};
            for (const id of selectedIds) {
                updates[`/orders/${id}`] = null;
            }
            await update(ref(db), updates);
            
            toast({
                title: `${selectedIds.length} Order(s) Deleted`,
                description: 'The selected orders have been deleted.',
            });
            setSelectedIds([]);
        } catch (error: any) {
             toast({
                variant: 'destructive',
                title: 'Deletion Failed',
                description: error.message || 'Could not delete orders.',
            });
        }
        setIsDeleteDialogOpen(false);
    }
    
    const handleResolveClick = (order: OrderHistoryItem, status: 'Completed' | 'Failed') => {
        setOrderToResolve({ order, status });
        setIsResolveDialogOpen(true);
    }
    
    const selectedUserName = users.find(u => u.uid === selectedUserId)?.displayName;

    const handleManipulationToggle = async (isAutoWinEnabled: boolean) => {
        const result = await updateManipulationModeAction(!isAutoWinEnabled);
        if (result.success) {
            toast({
                title: `Auto Win Mode ${isAutoWinEnabled ? 'Enabled' : 'Disabled'}`,
                description: isAutoWinEnabled
                    ? 'Expired orders will now automatically result in a win.'
                    : 'You now have manual control over order outcomes.',
            });
        } else {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: result.error,
            });
        }
    };


    if (loading) {
        return <AdminOrderHistorySkeleton />;
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[250px]">
                            <div className="relative flex-1 min-w-[200px]">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                placeholder="Search by pair, TX ID..."
                                className="pl-9 w-full"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="shrink-0">
                                        <Filter className="mr-2 h-4 w-4" />
                                        {selectedStatus || "All Statuses"}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start">
                                    <DropdownMenuItem onSelect={() => setSelectedStatus(null)}>All Statuses</DropdownMenuItem>
                                    {statuses.map(status => (
                                        <DropdownMenuItem key={status} onSelect={() => setSelectedStatus(status)}>
                                            {status}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="shrink-0">
                                        <User className="mr-2 h-4 w-4" />
                                        {selectedUserName || "All Traders"}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-64">
                                    <DropdownMenuItem onSelect={() => setSelectedUserId(null)}>
                                        All Traders
                                    </DropdownMenuItem>
                                    <ScrollArea className="h-48">
                                        {users.map(user => (
                                            <DropdownMenuItem key={user.uid} onSelect={() => setSelectedUserId(user.uid)}>
                                                {user.displayName}
                                            </DropdownMenuItem>
                                        ))}
                                    </ScrollArea>
                                </DropdownMenuContent>
                            </DropdownMenu>
                             {(selectedUserId || selectedStatus) && (
                                <Button variant="ghost" size="icon" onClick={() => {
                                    setSelectedUserId(null);
                                    setSelectedStatus(null);
                                }}>
                                    <X className="h-4 w-4" />
                                </Button>
                             )}
                        </div>
                         <div className="flex items-center gap-2">
                            {selectedIds.length > 0 && (
                                <>
                                <span className="text-sm text-muted-foreground">{selectedIds.length} selected</span>
                                <Button variant="destructive" size="sm" onClick={() => setIsDeleteDialogOpen(true)}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                </Button>
                                </>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {filteredOrders.length === 0 ? (
                        <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg h-96 flex items-center justify-center">
                            <p>No orders found matching your filters.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table className="min-w-full">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>
                                             <Checkbox
                                                checked={selectedIds.length > 0 && selectedIds.length === filteredOrders.length}
                                                onCheckedChange={handleToggleAll}
                                                aria-label="Select all"
                                            />
                                        </TableHead>
                                        <TableHead>Transaction ID</TableHead>
                                        <TableHead>User</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Ending Time</TableHead>
                                        <TableHead>Pair</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Open Time</TableHead>
                                        <TableHead>Price</TableHead>
                                        <TableHead>Total</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredOrders.map((order) => (
                                        <OrderRow 
                                            key={order.id}
                                            order={order}
                                            onResolveClick={handleResolveClick}
                                            manipulationMode={manipulationMode}
                                            isSelected={selectedIds.includes(order.id)}
                                            onToggleRow={handleToggleRow}
                                            onStatusChange={handleLocalStatusChange}
                                        />
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                <ResolveOrderDialog
                    isOpen={isResolveDialogOpen}
                    onOpenChange={setIsResolveDialogOpen}
                    resolveAction={orderToResolve}
                />
                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Delete {selectedIds.length} order(s)?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the selected orders from the database.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                </CardContent>
            </Card>
        </>
    );
}
