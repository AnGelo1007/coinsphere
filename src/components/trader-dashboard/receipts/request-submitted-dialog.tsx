
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

interface RequestSubmittedDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  requestType: 'Deposit' | 'Withdrawal';
}

export function RequestSubmittedDialog({ isOpen, onOpenChange, requestType }: RequestSubmittedDialogProps) {

  const handleClose = () => {
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          <DialogTitle className="text-center mt-4">Request Submitted</DialogTitle>
          <DialogDescription className="text-center">
            Your {requestType.toLowerCase()} request has been submitted for review. This typically takes 10-15 minutes. You will receive a notification once it's processed.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" onClick={handleClose} className="w-full">
            Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
