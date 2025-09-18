
'use client';

import { useState, useMemo } from 'react';
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
import { Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import type { OrderHistoryItem } from './types';
import { db } from '@/lib/firebase';
import { ref, update, runTransaction, push, set, serverTimestamp } from 'firebase/database';

interface ResolveOrderDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  resolveAction: { order: OrderHistoryItem; status: 'Completed' | 'Failed' } | null;
}

export function ResolveOrderDialog({ isOpen, onOpenChange, resolveAction }: ResolveOrderDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const profitAmount = useMemo(() => {
    if (!resolveAction) return 0;
    return resolveAction.order.total * (resolveAction.order.profitRate / 100);
  }, [resolveAction]);

  const handleConfirm = async () => {
    if (!resolveAction) return;
    
    setIsSubmitting(true);
    
    const { order, status } = resolveAction;

    try {
        const userRef = ref(db, `users/${order.userId}`);
        const updates: { [key: string]: any } = {};

        updates[`orders/${order.id}/status`] = status;

        if (status === 'Completed') {
            const amountToReturn = order.total + profitAmount;
            
            await runTransaction(userRef, (currentData) => {
                if (currentData) {
                    if (!currentData.portfolio) currentData.portfolio = {};
                    currentData.portfolio['USDT'] = (currentData.portfolio['USDT'] || 0) + amountToReturn;
                }
                return currentData;
            });
        }
        
        const message = `Your order ${order.transactionId} for ${order.pair}/USDT has been ${status}.`;
        const newNotificationRef = push(ref(db, `notifications/${order.userId}`));
        updates[`notifications/${order.userId}/${newNotificationRef.key}`] = {
            message: message,
            type: 'order',
            link: '/trader-dashboard/trade',
            timestamp: serverTimestamp(),
            read: false,
        };

        await update(ref(db), updates);

        toast({
            title: 'Success',
            description: `Order successfully resolved as ${status}.`
        });
        onOpenChange(false);

    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: error.message || 'An unexpected error occurred.'
        });
    }

    setIsSubmitting(false);
  };

  if (!resolveAction) return null;
  
  const isSuccess = resolveAction.status === 'Completed';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isSuccess ? <CheckCircle className="text-green-500" /> : <AlertTriangle className="text-red-500" />}
            Confirm Order Resolution
          </DialogTitle>
          <DialogDescription>
            You are about to resolve the order for {resolveAction.order.userEmail}.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
            {isSuccess ? (
                 <p className="text-sm">
                    This will return the user's original investment of <strong>${resolveAction.order.total.toFixed(2)}</strong> and add their profit of <strong>${profitAmount.toFixed(2)}</strong> to their USDT balance.
                </p>
            ) : (
                <p className="text-sm">
                    This action confirms the trade resulted in a loss. The user's original investment of <strong>${resolveAction.order.total.toFixed(2)}</strong> will not be returned.
                </p>
            )}
            <p className="text-xs text-muted-foreground">
                This action is final and will adjust the user's wallet balance accordingly. Please ensure this is correct before proceeding.
            </p>
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Cancel</Button>
          <Button 
            onClick={handleConfirm} 
            disabled={isSubmitting}
            className={!isSuccess ? 'bg-destructive hover:bg-destructive/90' : ''}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm & Mark as {resolveAction.status}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
