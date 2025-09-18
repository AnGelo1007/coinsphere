
'use client';

import { useState, useEffect, useMemo } from 'react';
import type { UserProfile } from '@/services/user-service';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { MoreVertical, ShieldCheck, Search } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { ref, onValue, update } from 'firebase/database';
import { UserDetailsDialog } from './user-details-dialog';
import { Input } from '../ui/input';
import { Skeleton } from '../ui/skeleton';
import { useMarketData } from '@/contexts/market-data-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { AddFundsDialog } from './add-funds-dialog';
import { formatDistanceToNow } from 'date-fns';


function getInitials(name: string | null | undefined, email: string | null | undefined) {
    if (name) {
        const names = name.split(' ');
        if (names.length > 1 && names[names.length - 1]) {
            return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    }
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return '??';
}

function UserTableSkeleton() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage all user accounts in the system.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Wallet Balance</TableHead>
                                <TableHead>Last Activity</TableHead>
                                <TableHead>Active</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {Array.from({ length: 5 }).map((_, index) => (
                                <TableRow key={index}>
                                <TableCell>
                                        <div className="flex items-center gap-4">
                                            <Skeleton className="h-10 w-10 rounded-full" />
                                            <div>
                                                <Skeleton className="h-4 w-24 mb-1" />
                                                <Skeleton className="h-3 w-32" />
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-12" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}


export function UserManagementTable() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const { user: currentUser } = useAuth();
    const { marketDataMap } = useMarketData();
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isAddFundsOpen, setIsAddFundsOpen] = useState(false);

    useEffect(() => {
        const usersRef = ref(db, 'users');
        const unsubscribe = onValue(usersRef, (snapshot) => {
            if (snapshot.exists()) {
                const usersData = snapshot.val();
                const updatedUsers: UserProfile[] = Object.keys(usersData).map(uid => {
                    const user = usersData[uid];
                    let totalUsdValue = 0;
                    if (user.portfolio) {
                        for (const symbol in user.portfolio) {
                            const amount = user.portfolio[symbol] || 0;
                            const price = marketDataMap[symbol]?.priceRaw || (symbol === 'USDT' ? 1 : 0);
                            totalUsdValue += amount * price;
                        }
                    }

                    return {
                        ...user,
                        uid: uid,
                        online: user.online || false,
                        active: user.active !== false,
                        walletBalance: totalUsdValue,
                    };
                });
                setUsers(updatedUsers);
            } else {
                setUsers([]);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [marketDataMap]);

    const filteredUsers = useMemo(() => {
        let filtered = users.filter(user => user.uid !== currentUser?.uid);
        if (searchQuery) {
            filtered = filtered.filter(user =>
                (user.displayName?.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (user.email?.toLowerCase().includes(searchQuery.toLowerCase()))
            );
        }
        return filtered;
    }, [users, searchQuery, currentUser]);

    const handleViewDetails = (user: UserProfile) => {
        setSelectedUser(user);
        setIsDetailsOpen(true);
    };

    const handleAddFunds = (user: UserProfile) => {
        setSelectedUser(user);
        setIsAddFundsOpen(true);
    }

    const handleStatusChange = async (userId: string, newStatus: boolean) => {
        try {
            const userRef = ref(db, `users/${userId}`);
            await update(userRef, { active: newStatus });
             toast({
                title: 'Success',
                description: `User status updated successfully.`,
            });
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message || 'Failed to update user status.',
            });
        }
    }
    
    if (loading) return <UserTableSkeleton />;

    return (
        <Card>
            <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage all user accounts in the system.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between mb-4 gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                        placeholder="Search by name or email..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
                
                <div className="overflow-x-auto">
                    <Table className="min-w-full">
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Wallet Balance</TableHead>
                                <TableHead>Last Activity</TableHead>
                                <TableHead>Active</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers.length > 0 ? (
                                filteredUsers.map((user) => (
                                    <TableRow key={user.uid}>
                                        <TableCell>
                                            <div className="flex items-center gap-4">
                                                <Avatar>
                                                    <AvatarFallback>{getInitials(user.displayName, user.email)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-medium whitespace-nowrap">{user.displayName || 'No Name'}</p>
                                                        {user.isAdmin && <ShieldCheck className="h-4 w-4 text-primary" />}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground truncate max-w-[150px]">{user.email || 'No Email'}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={user.online ? 'default' : 'outline'} className={cn(user.online ? 'bg-green-500/20 text-green-500 border-green-500/50' : '')}>
                                                {user.online ? 'Online' : 'Offline'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-mono text-sm">
                                            ${(user.walletBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {user.lastSeen ? formatDistanceToNow(new Date(user.lastSeen), { addSuffix: true }) : 'Never'}
                                        </TableCell>
                                        <TableCell>
                                            <Switch
                                                checked={user.active}
                                                onCheckedChange={(newStatus) => handleStatusChange(user.uid, newStatus)}
                                                disabled={user.isAdmin}
                                                aria-label={`Activate or deactivate ${user.displayName}`}
                                            />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onSelect={() => handleViewDetails(user)}>
                                                        View Details
                                                    </DropdownMenuItem>
                                                     <DropdownMenuItem onSelect={() => handleAddFunds(user)}>
                                                        Add Funds
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                                        No users found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                <UserDetailsDialog user={selectedUser} isOpen={isDetailsOpen} onOpenChange={setIsDetailsOpen} />
                <AddFundsDialog user={selectedUser} isOpen={isAddFundsOpen} onOpenChange={setIsAddFundsOpen} />
            </CardContent>
        </Card>
    );
}
