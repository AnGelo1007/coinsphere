
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, XCircle, Key } from 'lucide-react';
import type { Receipt } from '@/lib/actions';
import { db } from '@/lib/firebase';
import { ref as dbRef, runTransaction, update, push, serverTimestamp, set } from 'firebase/database';

interface ApproveReceiptDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  receipt: Receipt | null;
}

export function ApproveReceiptDialog({ isOpen, onOpenChange, receipt }: ApproveReceiptDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);


  const handleAction = async (action: 'approve' | 'reject') => {
    if (!receipt) return;
    
    setIsSubmitting(true);
    setActionType(action);
    
    const receiptRef = dbRef(db, `receipts/${receipt.id}`);
    const updates: { [key: string]: any } = {};

    if (action === 'approve') {
        try {
            const traderRef = dbRef(db, `users/${receipt.userId}`);
            await runTransaction(traderRef, (currentData) => {
                if (currentData) {
                    if (!currentData.portfolio) currentData.portfolio = {};
                    currentData.portfolio[receipt.pair] = (currentData.portfolio[receipt.pair] || 0) + receipt.amount;
                }
                return currentData;
            });
            updates[`receipts/${receipt.id}/status`] = 'Successful';

            const successMessage = `Your deposit of ${receipt.amount} ${receipt.pair} has been approved.`;
            const newNotificationRef = push(dbRef(db, `notifications/${receipt.userId}`));
            updates[`notifications/${receipt.userId}/${newNotificationRef.key}`] = {
                message: successMessage,
                type: 'deposit',
                link: '/trader-dashboard/receipts',
                timestamp: serverTimestamp(),
                read: false,
            };
            
            await update(dbRef(db), updates);

            toast({ 
                title: 'Success', 
                description: `Approved receipt and added ${receipt.amount} ${receipt.pair} to ${receipt.userEmail}.` 
            });
            onOpenChange(false);

        } catch (error: any) {
            toast({ 
                variant: 'destructive', 
                title: 'Error', 
                description: error.message || 'An unexpected error occurred.' 
            });
        }
    } else { // Reject action
        try {
            updates[`receipts/${receipt.id}/status`] = 'Failed';

            const failMessage = `Your deposit of ${receipt.amount} ${receipt.pair} was rejected. Please contact support if you believe this is an error.`;
            const newNotificationRef = push(dbRef(db, `notifications/${receipt.userId}`));
            updates[`notifications/${receipt.userId}/${newNotificationRef.key}`] = {
                message: failMessage,
                type: 'deposit',
                link: '/trader-dashboard/receipts',
                timestamp: serverTimestamp(),
                read: false,
            };
            
            await update(dbRef(db), updates);

            toast({
                title: 'Receipt Rejected',
                description: `The receipt from ${receipt.userEmail} has been marked as Failed.`,
            });
            onOpenChange(false);
        } catch(error: any) {
            toast({
                variant: 'destructive',
                title: 'Action Failed',
                description: error.message || 'Could not update the receipt status.',
            });
        }
    }
    
    setIsSubmitting(false);
    setActionType(null);
  };


  if (!receipt) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Review Deposit Receipt
          </DialogTitle>
          <DialogDescription>
            Review the details for {receipt.userEmail} and approve to credit their account or reject the submission.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 grid gap-y-4">
            <div>
                <h4 className="font-semibold">User Email</h4>
                <p className="text-sm text-muted-foreground">{receipt.userEmail}</p>
            </div>
            <div>
                <h4 className="font-semibold">Deposit Info</h4>
                <p className="text-sm text-muted-foreground">Amount: {receipt.amount} {receipt.pair}</p>
                <p className="text-sm text-muted-foreground">Status: {receipt.status}</p>
            </div>
             <div>
                <h4 className="font-semibold flex items-center gap-2"><Key className="h-4 w-4" /> Transaction ID / Hash</h4>
                <p className="text-sm text-muted-foreground font-mono bg-muted/50 p-2 rounded-md break-all">{receipt.transactionId}</p>
            </div>
        </div>
        <DialogFooter className="justify-between">
          <Button 
            variant="destructive" 
            onClick={() => handleAction('reject')}
            disabled={isSubmitting}
          >
             {isSubmitting && actionType === 'reject' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
             Reject
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Cancel</Button>
            <Button 
              onClick={() => handleAction('approve')} 
              disabled={isSubmitting}
            >
              {isSubmitting && actionType === 'approve' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
              Confirm & Approve
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
