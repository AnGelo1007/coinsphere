
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import type { UserProfile } from '@/services/user-service';
import { useAuth } from '@/contexts/auth-context';
import { Loader2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { ref, runTransaction, push, serverTimestamp, update } from 'firebase/database';

interface AddFundsDialogProps {
  user: UserProfile | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const tradingPairs = ['USDT', 'BTC', 'ETH', 'SOL', 'BNB', 'DOGE', 'ADA', 'LINK'];

const addFundsSchema = z.object({
  amount: z.coerce.number().positive('Amount must be a positive number.'),
  asset: z.string().min(1, 'Please select an asset.'),
});
type AddFundsFormInputs = z.infer<typeof addFundsSchema>;

export function AddFundsDialog({ user, isOpen, onOpenChange }: AddFundsDialogProps) {
  const { toast } = useToast();
  const form = useForm<AddFundsFormInputs>({
    resolver: zodResolver(addFundsSchema),
  });

  const handleAddFunds = async (data: AddFundsFormInputs) => {
    if (!user) return;
    
    try {
        const traderRef = ref(db, `users/${user.uid}`);
        const fundsAmount = Number(data.amount);

        await runTransaction(traderRef, (currentTraderData) => {
            if (currentTraderData) {
                 if (!currentTraderData.portfolio) currentTraderData.portfolio = {};
                currentTraderData.portfolio[data.asset] = (currentTraderData.portfolio[data.asset] || 0) + fundsAmount;
            }
            return currentTraderData;
        });

        // Notify user of successful deposit
        const message = `Your deposit of ${data.amount} ${data.asset} was successful.`;
        const notificationsRef = ref(db, `notifications/${user.uid}`);
        const newNotificationRef = push(notificationsRef);
        await update(newNotificationRef, {
            message: message,
            type: 'deposit',
            link: '/trader-dashboard/receipts',
            timestamp: serverTimestamp(),
            read: false,
        });
        
        toast({ title: 'Success', description: `Added ${data.amount} ${data.asset} to ${user.displayName} and sent notification.` });
        form.reset();
        onOpenChange(false);
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message || 'An unexpected error occurred while transferring funds.' });
    }
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Funds to {user.displayName}</DialogTitle>
          <DialogDescription>
            Add funds directly to this trader's wallet. This action does not affect your own wallet.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleAddFunds)}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Asset</Label>
              <Controller
                name="asset"
                control={form.control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="col-span-3"><SelectValue placeholder="Select asset" /></SelectTrigger>
                    <SelectContent>{tradingPairs.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                )}
              />
               {form.formState.errors.asset && <p className="col-start-2 col-span-3 text-sm text-destructive">{form.formState.errors.asset.message}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">Amount</Label>
              <Input id="amount" type="number" step="any" className="col-span-3" {...form.register('amount')} />
               {form.formState.errors.amount && <p className="col-start-2 col-span-3 text-sm text-destructive">{form.formState.errors.amount.message}</p>}
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Funds
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
