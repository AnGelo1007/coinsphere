
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { UserProfile } from '@/services/user-service';
import { format } from 'date-fns';

interface UserDetailsDialogProps {
  user: UserProfile | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function UserDetailsDialog({ user, isOpen, onOpenChange }: UserDetailsDialogProps) {
  if (!user) return null;

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    try {
      // The date is stored as YYYY-MM-DD, need to create date object carefully to avoid timezone issues
      const [year, month, day] = dateString.split('-');
      if (!year || !month || !day) return dateString;
      return format(new Date(parseInt(year), parseInt(month) - 1, parseInt(day)), 'MMMM d, yyyy');
    } catch (e) {
      return dateString; // Fallback if date is not in a parsable format
    }
  };
  
  const displayName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.displayName;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
          <DialogDescription>
            Viewing information for {displayName || user.email}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Full Name</Label>
            <Input value={displayName || 'Not provided'} readOnly className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Email</Label>
            <Input value={user.email} readOnly className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Birthdate</Label>
            <Input value={formatDate(user.birthdate)} readOnly className="col-span-3" />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Location</Label>
            <Input value={`${user.state || 'N/A'}, ${user.country || 'N/A'}`} readOnly className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Wallet Address</Label>
            <Input value={user.walletAddress || 'Not set'} readOnly className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Status</Label>
            <div className="col-span-3">
              <Badge variant={user.verified ? 'default' : 'secondary'} className={user.verified ? 'bg-green-500/20 text-green-500 border-green-500/50' : ''}>
                {user.verified ? 'Verified' : 'Not Verified'}
              </Badge>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
