
'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/auth-context';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Wallet, Loader2, Info } from 'lucide-react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { ref, push, set, serverTimestamp } from 'firebase/database';
import { RequestSubmittedDialog } from '../receipts/request-submitted-dialog';

interface WithdrawDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const withdrawSchema = z.object({
  amount: z.coerce.number().min(0.000001, 'Withdrawal amount must be a positive value.'),
  asset: z.string().min(1, 'Please select an asset.'),
});

type WithdrawFormInputs = z.infer<typeof withdrawSchema>;

export function WithdrawDialog({ isOpen, onOpenChange }: WithdrawDialogProps) {
  const { toast } = useToast();
  const { user, userProfile } = useAuth();
  const [isRequestSubmittedOpen, setIsRequestSubmittedOpen] = useState(false);
  
  const availableAssets = useMemo(() => {
      if (!userProfile?.portfolio) return [];
      return Object.keys(userProfile.portfolio).filter(asset => (userProfile.portfolio?.[asset] ?? 0) > 0);
  }, [userProfile]);

  const form = useForm<WithdrawFormInputs>({
    resolver: zodResolver(withdrawSchema),
  });
  
  const selectedAsset = form.watch('asset');
  const userBalanceForAsset = userProfile?.portfolio?.[selectedAsset] || 0;
  
  useEffect(() => {
      form.trigger('amount'); 
  }, [selectedAsset, form]);
  
  const handleSubmit = async (data: WithdrawFormInputs) => {
    if (!user || !userProfile?.walletAddress) {
        toast({ variant: 'destructive', title: 'Error', description: 'User or wallet address not found.' });
        return;
    }

    if (data.amount > userBalanceForAsset) {
        form.setError('amount', { type: 'manual', message: 'Withdrawal amount cannot exceed your available balance.' });
        return;
    }

    try {
        const newWithdrawalRef = push(ref(db, 'withdrawals'));
        await set(newWithdrawalRef, {
            userId: user.uid,
            userEmail: user.email || 'N/A',
            amount: data.amount,
            asset: data.asset,
            walletAddress: userProfile.walletAddress,
            status: 'Pending',
            date: serverTimestamp(),
        });
        
        const adminMessage = `${user.email} has requested a withdrawal of ${data.amount} ${data.asset}.`;
        const adminNotificationsRef = ref(db, `admin-notifications`);
        const newAdminNotificationRef = push(adminNotificationsRef);
        await set(newAdminNotificationRef, {
            message: adminMessage,
            type: 'withdrawal',
            link: '/trader-dashboard/admin/withdrawals',
            timestamp: serverTimestamp(),
            read: false,
        });

        onOpenChange(false);
        form.reset();
        setIsRequestSubmittedOpen(true);

    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message || "An unexpected error occurred while submitting your request." });
    }
  };
  
  if (!userProfile) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => {
          if (!open) form.reset();
          onOpenChange(open);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Withdraw Funds</DialogTitle>
            <DialogDescription>
              Select an asset and amount to withdraw to your verified wallet address.
            </DialogDescription>
          </DialogHeader>
          
          {!userProfile.walletAddress ? (
              <div className="py-4">
                  <Alert variant="destructive">
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                          You must set a withdrawal wallet address in your account settings before you can withdraw funds.
                          <Button variant="link" asChild className="p-0 h-auto ml-1"><Link href="/trader-dashboard/account">Go to Account Settings</Link></Button>
                      </AlertDescription>
                  </Alert>
              </div>
          ) : (
              <form onSubmit={form.handleSubmit(handleSubmit)}>
                  <div className="space-y-4 py-4">
                      <div>
                          <Label>Asset</Label>
                          <Controller
                              name="asset"
                              control={form.control}
                              render={({ field }) => (
                              <Select onValueChange={field.onChange} value={field.value}>
                                  <SelectTrigger><SelectValue placeholder="Select an asset..." /></SelectTrigger>
                                  <SelectContent>
                                      {availableAssets.map(asset => (
                                          <SelectItem key={asset} value={asset}>{asset}</SelectItem>
                                      ))}
                                  </SelectContent>
                              </Select>
                              )}
                          />
                          {form.formState.errors.asset && <p className="text-sm text-destructive mt-1">{form.formState.errors.asset.message}</p>}
                      </div>

                      <div>
                          <Label htmlFor="amount">Amount</Label>
                          <Input id="amount" type="number" step="any" min="0" {...form.register('amount')} />
                          <p className="text-xs text-muted-foreground mt-1">
                              Available: {userBalanceForAsset.toFixed(6)} {selectedAsset || ''}
                          </p>
                          {form.formState.errors.amount && (
                              <p className="text-sm text-destructive mt-1">{form.formState.errors.amount.message}</p>
                          )}
                      </div>

                      <div className="space-y-2">
                          <Label>Withdrawal Address</Label>
                          <div className="relative">
                              <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input value={userProfile.walletAddress} readOnly className="pl-9 bg-muted" />
                          </div>
                          <Button variant="link" size="sm" asChild className="p-0 h-auto">
                              <Link href="/trader-dashboard/account">Change Wallet</Link>
                          </Button>
                      </div>
                  </div>
                  <DialogFooter>
                      <Button type="submit" disabled={form.formState.isSubmitting}>
                          {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Submit Withdrawal
                      </Button>
                  </DialogFooter>
              </form>
          )}
        </DialogContent>
      </Dialog>
      <RequestSubmittedDialog 
        isOpen={isRequestSubmittedOpen}
        onOpenChange={setIsRequestSubmittedOpen}
        requestType="Withdrawal"
       />
    </>
  );
}

    