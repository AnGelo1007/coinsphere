
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/language-context';
import { db } from '@/lib/firebase';
import { ref, push, set, serverTimestamp } from 'firebase/database';
import { randomUUID } from 'crypto';

const ticketSchema = z.object({
  subject: z.string().min(5, 'Subject must be at least 5 characters long.'),
  message: z.string().min(20, 'Message must be at least 20 characters long.'),
});

type TicketFormInputs = z.infer<typeof ticketSchema>;

export function SupportTicketForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const { t } = useLanguage();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TicketFormInputs>({
    resolver: zodResolver(ticketSchema),
  });
  
  const onSubmit = async (data: TicketFormInputs) => {
      if (!user) {
          toast({
              variant: 'destructive',
              title: 'Not Authenticated',
              description: 'This is a demo. Please log in to submit a ticket.',
          });
          return router.push('/login');
      }

      try {
        const ticketsRef = ref(db, 'tickets');
        const newTicketRef = push(ticketsRef);
        const ticketNumber = `PTP-${Date.now().toString().slice(-6)}`;

        const initialMessage = {
            sender: 'User',
            text: data.message,
            timestamp: serverTimestamp(),
        };

        await set(newTicketRef, {
            userId: user.uid,
            userEmail: user.email,
            userDisplayName: user.displayName || user.email!,
            subject: data.subject,
            createdAt: serverTimestamp(),
            status: 'Pending',
            ticketNumber,
            messages: [initialMessage],
            userHasRead: true,
        });

        const adminMessage = `New support ticket #${ticketNumber} from ${user.email}`;
        const adminNotificationsRef = ref(db, 'admin-notifications');
        const newAdminNotificationRef = push(adminNotificationsRef);
        await set(newAdminNotificationRef, {
            message: adminMessage,
            type: 'ticket',
            link: '/trader-dashboard/account',
            timestamp: serverTimestamp(),
            read: false,
        });
        
        toast({
            title: 'Ticket Submitted',
            description: 'Your support ticket has been received. Our team will review it shortly.',
        });
        reset();

      } catch (error) {
           toast({
              variant: 'destructive',
              title: 'Submission Failed',
              description: 'Could not submit your ticket. Please try again later.',
          });
      }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-lg mx-auto">
      <div className="space-y-2">
        <Label htmlFor="subject">{t('subject')}</Label>
        <Input 
            id="subject" 
            placeholder={t('subjectPlaceholder')}
            {...register('subject')} 
            disabled={isSubmitting}
        />
        {errors.subject && <p className="text-sm text-destructive">{errors.subject.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="message">{t('message')}</Label>
        <Textarea 
            id="message" 
            placeholder={t('messagePlaceholder')}
            rows={6}
            {...register('message')} 
            disabled={isSubmitting}
        />
        {errors.message && <p className="text-sm text-destructive">{errors.message.message}</p>}
      </div>
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {t('submitTicketButton')}
      </Button>
    </form>
  );
}
