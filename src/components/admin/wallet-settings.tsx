
'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { ref, onValue, set, get } from 'firebase/database';
import { Loader2, Save } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

const depositAssets = ['USDT', 'BTC', 'ETH', 'SOL', 'BNB', 'DOGE', 'ADA', 'LINK'];

const walletSettingsSchema = z.object({
  asset: z.string().min(1, 'Please select an asset.'),
  address: z.string().min(20, 'Please enter a valid wallet address.'),
});

type WalletSettingsFormInputs = z.infer<typeof walletSettingsSchema>;

export function WalletSettings() {
  const [addresses, setAddresses] = useState<Record<string, { address: string }>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const form = useForm<WalletSettingsFormInputs>({
    resolver: zodResolver(walletSettingsSchema),
    defaultValues: {
      asset: '',
      address: '',
    }
  });

  const selectedAsset = form.watch('asset');

  useEffect(() => {
    const settingsRef = ref(db, 'settings/depositInfo');
    const unsubscribe = onValue(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        setAddresses(snapshot.val() || {});
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);
  
  useEffect(() => {
    if (selectedAsset) {
      form.setValue('address', addresses[selectedAsset]?.address || '');
    } else {
      form.setValue('address', '');
    }
  }, [selectedAsset, addresses, form]);

  const onSubmit = async (data: WalletSettingsFormInputs) => {
    try {
        const addressRef = ref(db, `settings/depositInfo/${data.asset}`);
        await set(addressRef, { address: data.address });
        toast({
            title: 'Address Updated',
            description: `The deposit address for ${data.asset} has been successfully updated.`,
        });
    } catch (error: any) {
         toast({
            variant: 'destructive',
            title: 'Update Failed',
            description: error.message || 'An unexpected error occurred.',
        });
    }
  };

  
  if (loading) {
      return (
          <Card>
              <CardHeader>
                  <Skeleton className="h-6 w-48 mb-2" />
                  <Skeleton className="h-4 w-80" />
              </CardHeader>
              <CardContent className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                   <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-32" />
              </CardContent>
          </Card>
      )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Deposit Wallet Settings</CardTitle>
        <CardDescription>
          Manage the wallet addresses that traders will use for deposits. Changes here will reflect immediately for all users.
        </CardDescription>
      </CardHeader>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Asset</Label>
            <Controller
              name="asset"
              control={form.control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger><SelectValue placeholder="Select an asset to edit..." /></SelectTrigger>
                  <SelectContent>
                    {depositAssets.map(asset => <SelectItem key={asset} value={asset}>{asset}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.asset && <p className="text-sm text-destructive">{form.formState.errors.asset.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Wallet Address</Label>
            <Input id="address" {...form.register('address')} disabled={!selectedAsset} />
            {form.formState.errors.address && <p className="text-sm text-destructive">{form.formState.errors.address.message}</p>}
          </div>
        </CardContent>
        <CardFooter>
          {selectedAsset && (
            <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Changes
            </Button>
          )}
        </CardFooter>
      </form>
    </Card>
  );
}
