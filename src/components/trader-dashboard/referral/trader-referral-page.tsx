
'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Check, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLanguage } from '@/contexts/language-context';
import type { TranslationKey } from '@/lib/translations';
import { db } from '@/lib/firebase';
import { ref, get, update, runTransaction } from 'firebase/database';

const referralSchema = z.object({
  referralCode: z.string().min(6, 'Referral code must be at least 6 characters.'),
});
type ReferralFormInputs = z.infer<typeof referralSchema>;

function TraderReferralPageSkeleton() {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-48 mb-2" />
                    <Skeleton className="h-4 w-80" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-10 w-full" />
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-48 mb-2" />
                    <Skeleton className="h-4 w-80" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-10 w-full" />
                </CardContent>
            </Card>
        </div>
    )
}

export function TraderReferralPage() {
  const { user, userProfile, loading } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [hasCopied, setHasCopied] = useState(false);
  
  const form = useForm<ReferralFormInputs>({
    resolver: zodResolver(referralSchema),
  });

  const handleCopy = () => {
    if (!userProfile?.referralCode) return;
    navigator.clipboard.writeText(userProfile.referralCode).then(() => {
      setHasCopied(true);
      toast({ title: t('referralCodeCopiedTitle'), description: t('referralCodeCopiedDesc') });
      setTimeout(() => setHasCopied(false), 2000);
    });
  };
  
  const onSubmit = async (data: ReferralFormInputs) => {
    if (!user) return;

    try {
        const referralCode = data.referralCode.toUpperCase();
        const codeRef = ref(db, `referralCodes/${referralCode}`);
        const codeSnapshot = await get(codeRef);

        if (!codeSnapshot.exists()) {
            toast({ variant: 'destructive', title: t('referralErrorTitle'), description: t('referralErrorInvalidCode') });
            return;
        }

        const inviterUid = codeSnapshot.val();

        if (inviterUid === user.uid) {
            toast({ variant: 'destructive', title: t('referralErrorTitle'), description: t('referralErrorSelf') });
            return;
        }

        const referredUserRef = ref(db, `users/${user.uid}`);
        const referredUserSnapshot = await get(referredUserRef);
        if (referredUserSnapshot.exists() && referredUserSnapshot.val().invitedBy) {
            toast({ variant: 'destructive', title: t('referralErrorTitle'), description: t('referralErrorAlreadyReferred') });
            return;
        }
        
        const updates: { [key: string]: any } = {};
        updates[`/users/${user.uid}/invitedBy`] = inviterUid;
        updates[`/users/${inviterUid}/invites/${user.uid}`] = true;
        
        await runTransaction(ref(db, `/users/${inviterUid}/referralCount`), (currentCount) => {
            return (currentCount || 0) + 1;
        });

        await update(ref(db), updates);

        toast({ title: t('referralSuccessTitle'), description: t('referralSuccessDesc') });
        form.reset();

    } catch (error) {
        console.error("Failed to apply referral code:", error);
        toast({ variant: 'destructive', title: t('referralErrorTitle'), description: t('referralErrorGeneral') });
    }
  };


  if (loading || !userProfile) {
      return <TraderReferralPageSkeleton />;
  }
  
  // This can happen briefly for new users, show skeleton until referral code is available.
  if (!userProfile.referralCode) {
    return <TraderReferralPageSkeleton />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('yourReferralCode')}</CardTitle>
          <CardDescription>{t('yourReferralCodeDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="relative flex items-center">
                <Input value={userProfile.referralCode} readOnly className="pr-12 text-lg font-mono tracking-widest" />
                <Button 
                    type="button" 
                    size="icon" 
                    variant="ghost" 
                    className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
                    onClick={handleCopy}
                    disabled={!userProfile.referralCode}
                >
                    {hasCopied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
                    <span className="sr-only">{t('copyCode')}</span>
                </Button>
            </div>
        </CardContent>
      </Card>

      {!userProfile.invitedBy && (
        <Card>
          <CardHeader>
            <CardTitle>{t('haveAReferralCode')}</CardTitle>
            <CardDescription>{t('haveAReferralCodeDesc')}</CardDescription>
          </CardHeader>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent>
                <div className="space-y-2">
                    <Label htmlFor="referral-code" className="sr-only">{t('referralCode')}</Label>
                    <Input id="referral-code" placeholder={t('enterCodePlaceholder')} {...form.register('referralCode')} />
                    {form.formState.errors.referralCode && <p className="text-sm text-destructive">{form.formState.errors.referralCode.message}</p>}
                </div>
            </CardContent>
            <CardFooter>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('applyCode')}
                </Button>
            </CardFooter>
          </form>
        </Card>
      )}
       {userProfile.invitedBy && (
        <Card>
            <CardHeader>
                <CardTitle>{t('codeApplied')}</CardTitle>
                <CardDescription>
                    You were invited by another user.
                </CardDescription>
            </CardHeader>
        </Card>
       )}
    </div>
  );
}
