
'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { ref as dbRef, push, set, serverTimestamp } from 'firebase/database';
import { RequestSubmittedDialog } from './request-submitted-dialog';

const depositAssets = ['USDT', 'BTC', 'ETH', 'SOL', 'BNB', 'DOGE', 'ADA', 'LINK'];

export function SubmitReceiptForm() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [amount, setAmount] = useState('');
  const [asset, setAsset] = useState('');
  const [transactionId, setTransactionId] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const resetForm = () => {
      setAmount('');
      setAsset('');
      setTransactionId('');
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!user || !user.email) {
      toast({ variant: 'destructive', title: 'Not Authenticated', description: 'You must be logged in to submit a receipt.' });
      return;
    }
    
    if (!asset) {
      toast({ variant: 'destructive', title: 'Asset not selected', description: 'Please select an asset.' });
      return;
    }

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      toast({ variant: 'destructive', title: 'Invalid Amount', description: 'Please enter a positive amount.' });
      return;
    }

    if (!transactionId.trim()) {
      toast({ variant: 'destructive', title: 'Transaction ID required', description: 'Please enter a valid transaction ID.' });
      return;
    }

    setIsSubmitting(true);

    try {
      const newReceiptRef = push(dbRef(db, `receipts/${user.uid}`));
      
      await set(newReceiptRef, {
        amount: numericAmount,
        pair: asset,
        status: 'Processing',
        transactionId: transactionId.trim(),
        userEmail: user.email,
        userId: user.uid,
        date: serverTimestamp(),
      });

      const adminNotificationsRef = dbRef(db, `admin-notifications`);
      const newAdminNotificationRef = push(adminNotificationsRef);
      await set(newAdminNotificationRef, {
        message: `${user.email} has submitted a deposit for ${amount} ${asset}.`,
        type: 'deposit',
        link: '/trader-dashboard/admin/receipts',
        timestamp: serverTimestamp(),
        read: false,
      });

      resetForm();
      setIsDialogOpen(true);

    } catch(error: any) {
        console.error("Submission failed:", error);
        toast({
            variant: 'destructive',
            title: 'Submission Failed',
            description: error.code || error.message || 'An unexpected error occurred.',
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6 max-w-lg mx-auto">
        <div className="space-y-2">
          <Label htmlFor="transactionId">Transaction ID / Hash</Label>
          <Input id="transactionId" type="text" value={transactionId} onChange={(e) => setTransactionId(e.target.value)} required placeholder="e.g., 0x..." />
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">Amount (USD)</Label>
          <Input id="amount" type="number" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </div>

        <div className="space-y-2">
          <Label>Asset</Label>
          <Select onValueChange={setAsset} value={asset}>
            <SelectTrigger>
              <SelectValue placeholder="Select an asset..." />
            </SelectTrigger>
            <SelectContent>
              {depositAssets.map((asset) => (
                <SelectItem key={asset} value={asset}>{asset}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Submit
        </Button>
      </form>
      <RequestSubmittedDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        requestType="Deposit"
      />
    </>
  );
}
