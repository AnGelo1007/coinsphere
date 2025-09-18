
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getCryptoIcon } from '@/components/crypto-icons';
import { Skeleton } from '@/components/ui/skeleton';
import { Info, Loader2, Megaphone } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useMarketData } from '@/contexts/market-data-context';
import { DepositDialog } from './deposit-dialog';
import { WithdrawDialog } from './withdraw-dialog';
import { db } from '@/lib/firebase';
import { ref, onValue, remove, runTransaction } from 'firebase/database';

const tradingPairs = ['USDT', 'BTC', 'ETH', 'SOL', 'BNB', 'DOGE', 'ADA', 'LINK'];

const addSchema = z.object({
    amount: z.coerce.number().positive('Amount must be a positive number.'),
    asset: z.string().min(1, 'Please select an asset.'),
});
type AddFormInputs = z.infer<typeof addSchema>;

function WalletSkeleton() {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-10 w-48" />
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-16" />
                    </div>
                    <div className="flex items-center justify-end gap-2">
                         <Skeleton className="h-10 w-24" />
                         <Skeleton className="h-10 w-24" />
                    </div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead><Skeleton className="h-5 w-24" /></TableHead>
                                    <TableHead><Skeleton className="h-5 w-32" /></TableHead>
                                    <TableHead className="text-right"><Skeleton className="h-5 w-20 ml-auto" /></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {Array.from({ length: 3 }).map((_, index) => (
                                    <TableRow key={index}>
                                        <TableCell><div className='flex items-center gap-2'><Skeleton className='h-8 w-8 rounded-full' /><Skeleton className='h-6 w-24' /></div></TableCell>
                                        <TableCell><Skeleton className='h-6 w-32' /></TableCell>
                                        <TableCell className='text-right'><Skeleton className='h-8 w-16 ml-auto' /></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
             </Card>
        </div>
    )
}

function AnnouncementDialog({ message, onAcknowledge }: { message: string, onAcknowledge: () => void }) {
    const [isOpen, setIsOpen] = useState(true);

    const handleClose = () => {
        setIsOpen(false);
        onAcknowledge();
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Megaphone className="h-6 w-6 text-primary" />
                        Important Announcement
                    </DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <p>{message}</p>
                </div>
                <DialogFooter>
                    <Button onClick={handleClose}>Acknowledge</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


export default function Wallet() {
    const { user, userProfile, isAdmin, loading: authLoading } = useAuth();
    const { marketDataMap, valueDirections, loading: marketLoading } = useMarketData();
    const { toast } = useToast();

    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isDepositOpen, setIsDepositOpen] = useState(false);
    const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
    const [announcement, setAnnouncement] = useState<string | null>(null);

    const addForm = useForm<AddFormInputs>({
        resolver: zodResolver(addSchema),
    });

    const loading = authLoading || marketLoading;
    
     useEffect(() => {
        if (!user || isAdmin) return;

        const announcementRef = ref(db, `announcements/${user.uid}`);
        const unsubscribe = onValue(announcementRef, (snapshot) => {
            if (snapshot.exists()) {
                setAnnouncement(snapshot.val().message);
            } else {
                setAnnouncement(null);
            }
        });

        return () => unsubscribe();
    }, [user, isAdmin]);

    const handleAcknowledge = () => {
        if (!user) return;
        const announcementRef = ref(db, `announcements/${user.uid}`);
        remove(announcementRef);
        setAnnouncement(null);
    };

    const portfolio = useMemo(() => {
        if (!userProfile?.portfolio) return [];
        return Object.entries(userProfile.portfolio)
            .map(([symbol, amount]) => {
                const price = marketDataMap[symbol]?.priceRaw || (symbol === 'USDT' ? 1 : 0);
                return {
                    symbol,
                    name: marketDataMap[symbol]?.name || symbol,
                    amount,
                    value: amount * price,
                };
            })
            .filter(asset => asset.amount > 0); // Filter out assets with zero balance
    }, [userProfile, marketDataMap]);

    const totalBalance = useMemo(() => {
        return portfolio.reduce((sum, asset) => sum + asset.value, 0);
    }, [portfolio]);

    const handleAddFunds = async (data: AddFormInputs) => {
        if (!user) return;
        
        try {
            const adminRef = ref(db, `users/${user.uid}`);
            await runTransaction(adminRef, (currentData) => {
                if (currentData) {
                    if (!currentData.portfolio) {
                        currentData.portfolio = {};
                    }
                    currentData.portfolio[data.asset] = (currentData.portfolio[data.asset] || 0) + data.amount;
                }
                return currentData;
            });
            toast({ title: 'Success', description: `Added ${data.amount} ${data.asset} to your wallet.` });
            setIsAddOpen(false);
            addForm.reset();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to add funds.' });
        }
    };
    

    if (loading) return <WalletSkeleton />;

    return (
        <>
        {announcement && <AnnouncementDialog message={announcement} onAcknowledge={handleAcknowledge} />}
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardDescription>Total Balance</CardDescription>
                    <CardTitle className={cn("text-4xl transition-colors duration-200", {
                        'text-green-500': valueDirections['total'] === 'up',
                        'text-red-500': valueDirections['total'] === 'down',
                    })}>
                        ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isAdmin ? (
                        <div className="flex items-center gap-2">
                            <Button onClick={() => setIsAddOpen(true)}>Add Funds</Button>
                        </div>
                    ) : (
                         <div className="flex items-center gap-2">
                            <Button onClick={() => setIsDepositOpen(true)}>Deposit</Button>
                            <Button variant="outline" onClick={() => setIsWithdrawOpen(true)}>Withdraw</Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {isAdmin && (
                 <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Admin Wallet</AlertTitle>
                    <AlertDescription>
                        This is your personal admin wallet. Use the buttons above to manage your funds. Funds added or deducted here only affect your balance.
                    </AlertDescription>
                </Alert>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>My Assets</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        {portfolio.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Asset</TableHead>
                                        <TableHead>Balance</TableHead>
                                        <TableHead className="text-right">USD Value</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {portfolio.map(asset => {
                                        const Icon = getCryptoIcon(asset.symbol);
                                        return (
                                            <TableRow key={asset.symbol}>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Icon className="w-6 h-6" />
                                                        <div>
                                                            <span className="font-bold">{asset.name}</span>
                                                            <span className="text-muted-foreground ml-2">{asset.symbol}</span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-mono">
                                                    {asset.amount.toFixed(6)}
                                                </TableCell>
                                                <TableCell className={cn("text-right font-mono transition-colors duration-200", {
                                                    'text-green-500': valueDirections[asset.symbol] === 'up',
                                                    'text-red-500': valueDirections[asset.symbol] === 'down',
                                                })}>
                                                    ${asset.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                                <p>Your wallet is empty.</p>
                                {isAdmin ? (
                                    <p className="text-sm mt-2">Use the "Add Funds" button to populate your wallet.</p>
                                ) : (
                                    <p className="text-sm mt-2">Click the "Deposit" button to get started.</p>
                                )}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Add Funds Dialog (for Admin) */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Funds to Your Wallet</DialogTitle>
                        <DialogDescription>
                            Select an asset and amount to add to your admin wallet.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={addForm.handleSubmit(handleAddFunds)}>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label>Asset</Label>
                                <Controller
                                    name="asset"
                                    control={addForm.control}
                                    render={({ field }) => {
                                      return (
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <SelectTrigger><SelectValue placeholder="Select asset" /></SelectTrigger>
                                            <SelectContent>{tradingPairs.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                                        </Select>
                                      );
                                    }}
                                />
                                {addForm.formState.errors.asset && <p className="text-sm text-destructive">{addForm.formState.errors.asset.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="amount-add">Amount</Label>
                                <Input id="amount-add" type="number" step="any" {...addForm.register('amount')} />
                                {addForm.formState.errors.amount && <p className="text-sm text-destructive">{addForm.formState.errors.amount.message}</p>}
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
                            <Button type="submit" disabled={addForm.formState.isSubmitting}>
                                {addForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Add Funds
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            
        </div>
        <DepositDialog isOpen={isDepositOpen} onOpenChange={setIsDepositOpen} />
        <WithdrawDialog isOpen={isWithdrawOpen} onOpenChange={setIsWithdrawOpen} />
        </>
    );
}
