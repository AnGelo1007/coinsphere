
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Table, TableBody, TableCell, TableRow, TableHeader, TableHead } from '@/components/ui/table';
import { db } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Search, Copy, Check } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import type { UserProfile } from '@/services/user-service';
import { Button } from '../ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface UserWithInvites extends UserProfile {
    invitedUsers: UserProfile[];
}

function getInitials(name: string | null | undefined, email: string) {
    if (name) {
        const names = name.split(' ');
        if (names.length > 1 && names[names.length - 1]) {
            return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
}


function ReferralsTableSkeleton() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Referral Management</CardTitle>
                <CardDescription>Monitor user referral performance.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <Skeleton className="h-10 w-full md:w-1/3" />
                     <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Referral Code</TableHead>
                                    <TableHead>Invites</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {Array.from({ length: 5 }).map((_, index) => (
                                    <TableRow key={index}>
                                        <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-16" /></TableCell>
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

export function AdminReferralsTable() {
    const [usersWithInvites, setUsersWithInvites] = useState<UserWithInvites[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [copiedCode, setCopiedCode] = useState<string | null>(null);
    const { toast } = useToast();
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [selectedReferrer, setSelectedReferrer] = useState<UserWithInvites | null>(null);

    useEffect(() => {
        const usersRef = ref(db, 'users');

        const unsubscribe = onValue(usersRef, (snapshot) => {
            const usersData: Record<string, UserProfile> = snapshot.val() || {};
            const usersArray = Object.keys(usersData).map(uid => ({...usersData[uid], uid}));
            
            const combinedData = usersArray.map(user => {
                const invitedUsers = user.invites 
                    ? Object.keys(user.invites).map(invitedUid => usersArray.find(u => u.uid === invitedUid)).filter(Boolean) as UserProfile[]
                    : [];
                return {
                    ...user,
                    invitedUsers
                }
            });

            setUsersWithInvites(combinedData.filter(user => !user.isAdmin)); // Filter out admins
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const filteredUsers = useMemo(() => {
        return usersWithInvites.filter(u =>
            (u.displayName?.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (u.email?.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (u.referralCode?.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [usersWithInvites, searchQuery]);

    const handleCopy = (code: string) => {
        if (!code) return;
        navigator.clipboard.writeText(code).then(() => {
            setCopiedCode(code);
            toast({ title: 'Copied!', description: 'Referral code copied to clipboard.' });
            setTimeout(() => setCopiedCode(null), 2000);
        });
    };

    const handleViewDetails = (user: UserWithInvites) => {
        if (user.invitedUsers.length === 0) return;
        setSelectedReferrer(user);
        setIsDetailsOpen(true);
    };

    if (loading) {
        return <ReferralsTableSkeleton />;
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Referral Management</CardTitle>
                    <CardDescription>View all traders and track who is using their referral codes.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between mb-4 gap-4">
                        <div className="relative flex-1 min-w-[300px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by user email, name, or referral code..."
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
                                    <TableHead>Referral Code</TableHead>
                                    <TableHead>Invites</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                            {filteredUsers.length > 0 ? (
                                    filteredUsers.map((user) => (
                                        <TableRow key={user.uid} onClick={() => handleViewDetails(user)} className={user.invitedUsers.length > 0 ? "cursor-pointer hover:bg-muted/50" : ""}>
                                            <TableCell>
                                                <div className="font-medium">{user.displayName}</div>
                                                <div className="text-xs text-muted-foreground">{user.email}</div>
                                            </TableCell>
                                            <TableCell>
                                                {user.referralCode ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono text-xs">{user.referralCode}</span>
                                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); handleCopy(user.referralCode!)}}>
                                                            {copiedCode === user.referralCode ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">N/A</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-medium">{user.referralCount || 0}</span>
                                            </TableCell>
                                        </TableRow>
                                    ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">
                                            This is where traders will show when someone uses their referral code.
                                    </TableCell>
                                </TableRow>
                            )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

             <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent>
                    <DialogHeader>
                    <DialogTitle>Referrals by {selectedReferrer?.displayName}</DialogTitle>
                    <DialogDescription>
                        The following users signed up using this referral code.
                    </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 max-h-[60vh] overflow-y-auto">
                        <ul className="space-y-4">
                            {selectedReferrer?.invitedUsers.map(user => (
                                <li key={user.uid} className="flex items-center gap-4 p-2 rounded-md hover:bg-muted/50">
                                    <Avatar>
                                        <AvatarFallback>{getInitials(user.displayName, user.email)}</AvatarFallback>
                                    </Avatar>
                                    <div className="text-sm">
                                        <p className="font-medium">{user.displayName}</p>
                                        <p className="text-xs text-muted-foreground">{user.email}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
