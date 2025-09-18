
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { ref, onValue, update, serverTimestamp } from 'firebase/database';
import type { UserProfile } from '@/services/user-service';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { MultiSelect, type MultiSelectOption } from '../ui/multi-select';

const announcementSchema = z.object({
  message: z.string().min(10, 'Message must be at least 10 characters.'),
  recipients: z.array(z.string()).min(1, 'You must select at least one recipient.'),
});

type AnnouncementFormInputs = z.infer<typeof announcementSchema>;

export function AdminAnnouncements() {
  const [userOptions, setUserOptions] = useState<MultiSelectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  const form = useForm<AnnouncementFormInputs>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      message: '',
      recipients: [],
    },
  });

  useEffect(() => {
    const usersRef = ref(db, 'users');
    const unsubscribe = onValue(usersRef, (snapshot) => {
      if (snapshot.exists()) {
        const usersData = snapshot.val();
        const allUsers: MultiSelectOption[] = Object.keys(usersData)
          .map(uid => ({ ...usersData[uid], uid }))
          .filter(user => !user.isAdmin)
          .map(user => ({
            value: user.uid,
            label: `${user.displayName} (${user.email})`
          }));
        setUserOptions(allUsers);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const onSubmit = async (data: AnnouncementFormInputs) => {
    try {
        const updates: { [key: string]: any } = {};
        for (const userId of data.recipients) {
            updates[`/announcements/${userId}`] = { message: data.message, timestamp: serverTimestamp() };
        }
        await update(ref(db), updates);
        
        toast({
            title: 'Announcement Sent',
            description: `Your message has been sent to ${data.recipients.length} user(s).`,
        });
        form.reset();

    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Failed to Send',
            description: error.message || 'An unexpected error occurred.',
        });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send Announcement</CardTitle>
        <CardDescription>
          Compose a message that will appear as a pop-up for selected traders when they visit their dashboard.
        </CardDescription>
      </CardHeader>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Recipients</Label>
            <Controller
              control={form.control}
              name="recipients"
              render={({ field }) => (
                <MultiSelect
                  options={userOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select traders..."
                  isLoading={loading}
                />
              )}
            />
            {form.formState.errors.recipients && (
              <p className="text-sm text-destructive">{form.formState.errors.recipients.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              rows={5}
              placeholder="Enter the announcement message here..."
              {...form.register('message')}
            />
            {form.formState.errors.message && (
              <p className="text-sm text-destructive">{form.formState.errors.message.message}</p>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={form.formState.isSubmitting || loading}>
            {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send Announcement
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
