
'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/auth-context';
import QRCode from 'qrcode.react';
import { toast } from '@/hooks/use-toast';
import { Loader2, Pencil } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { db } from '@/lib/firebase';
import { ref, update } from 'firebase/database';
import { Skeleton } from '@/components/ui/skeleton';
import { countries } from '@/lib/countries';


const verificationSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  birthMonth: z.string().min(1, 'Month is required'),
  birthDay: z.string().min(1, 'Day is required'),
  birthYear: z.string().min(4, 'Year is required'),
  walletAddress: z.string().min(10, 'A valid wallet address is required'), // Basic validation
  country: z.string().min(1, 'Country is required'),
  state: z.string().min(1, 'State/Province is required'),
});

type VerificationFormInputs = z.infer<typeof verificationSchema>;

const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - 18 - i);
const months = [
  { value: '01', label: 'January' }, { value: '02', label: 'February' },
  { value: '03', label: 'March' }, { value: '04', label: 'April' },
  { value: '05', label: 'May' }, { value: '06', label: 'June' },
  { value: '07', label: 'July' }, { value: '08', label: 'August' },
  { value: '09', label: 'September' }, { value: '10', label: 'October' },
  { value: '11', label: 'November' }, { value: '12', label: 'December' },
];
const days = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));

function VerificationFormSkeleton() {
    return (
        <div className="space-y-8">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Skeleton className="h-5 w-20 mb-2" /><Skeleton className="h-10 w-full" /></div>
                        <div className="space-y-2"><Skeleton className="h-5 w-20 mb-2" /><Skeleton className="h-10 w-full" /></div>
                    </div>
                    <div className="space-y-2"><Skeleton className="h-5 w-24 mb-2" /><Skeleton className="h-10 w-full" /></div>
                    <div className="space-y-2"><Skeleton className="h-5 w-20 mb-2" /><Skeleton className="h-10 w-full" /></div>
                    <div className="space-y-2"><Skeleton className="h-5 w-48 mb-2" /><Skeleton className="h-10 w-full" /></div>
                </div>
                <div className="flex items-center justify-center">
                    <Skeleton className="w-48 h-48 rounded-lg" />
                </div>
             </div>
             <Skeleton className="h-10 w-32" />
        </div>
    )
}


export function VerificationForm() {
  const { user, userProfile, isVerified } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<VerificationFormInputs>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      country: '',
      state: '',
    }
  });
  
  const currentWalletAddress = watch('walletAddress', userProfile?.walletAddress || '');
  const selectedCountry = watch('country');

  const availableStates = countries.find(c => c.name === selectedCountry)?.states || [];

  useEffect(() => {
    if (userProfile) {
        const [birthYear, birthMonth, birthDay] = userProfile.birthdate?.split('-') || [];
        reset({
            firstName: userProfile.firstName || '',
            lastName: userProfile.lastName || '',
            birthMonth: birthMonth,
            birthDay: birthDay,
            birthYear: birthYear,
            walletAddress: userProfile.walletAddress || '',
            country: userProfile.country || '',
            state: userProfile.state || '',
        });
    }
  }, [userProfile, reset]);
  
  useEffect(() => {
    // Set initial editing state based on verification status.
    // Unverified users start in edit mode. Verified users start in view mode.
    setIsEditing(!isVerified);
  }, [isVerified]);
  
  useEffect(() => {
      // When country changes, reset the state field if the new country doesn't have the previously selected state
      if (selectedCountry) {
          const countryData = countries.find(c => c.name === selectedCountry);
          const currentSelectedState = watch('state');
          if (countryData && !countryData.states.some(s => s.name === currentSelectedState)) {
              setValue('state', '');
          }
      }
  }, [selectedCountry, setValue, watch]);


  const onSubmit = async (data: VerificationFormInputs) => {
    if (!user) {
        toast({
            variant: "destructive",
            title: "Authentication Error",
            description: "You must be logged in to submit verification.",
        });
        return;
    }
    
    try {
      const userRef = ref(db, `users/${user.uid}`);
      await update(userRef, {
        firstName: data.firstName,
        lastName: data.lastName,
        displayName: `${data.firstName} ${data.lastName}`,
        birthdate: `${data.birthYear}-${data.birthMonth}-${data.birthDay}`,
        walletAddress: data.walletAddress,
        country: data.country,
        state: data.state,
        verified: true, // Set user as verified
      });

      toast({
          title: "Information Saved",
          description: "Your information has been updated successfully.",
      });
      setIsEditing(false); // Go back to view mode after saving

    } catch (error) {
       console.error("Verification submission error:", error);
       toast({
            variant: "destructive",
            title: "Submission Failed",
            description: "There was a problem saving your information. Please try again.",
        });
    }
  };

  if (!userProfile && isVerified) {
    return <VerificationFormSkeleton />;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            <div className="space-y-4">
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input id="firstName" {...register('firstName')} disabled={!isEditing} />
                        {errors.firstName && <p className="text-sm text-destructive">{errors.firstName.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input id="lastName" {...register('lastName')} disabled={!isEditing}/>
                        {errors.lastName && <p className="text-sm text-destructive">{errors.lastName.message}</p>}
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={user?.email || ''} readOnly disabled className="cursor-not-allowed" />
                </div>

                <div className="space-y-2">
                    <Label>Birthdate</Label>
                    <div className="grid grid-cols-[2fr_1fr_1fr] gap-2">
                        <Controller
                            name="birthMonth"
                            control={control}
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value} disabled={!isEditing}>
                                    <SelectTrigger><SelectValue placeholder="Month" /></SelectTrigger>
                                    <SelectContent>
                                        {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                         <Controller
                            name="birthDay"
                            control={control}
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value} disabled={!isEditing}>
                                    <SelectTrigger><SelectValue placeholder="Day" /></SelectTrigger>
                                    <SelectContent>
                                        {days.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                         <Controller
                            name="birthYear"
                            control={control}
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value} disabled={!isEditing}>
                                    <SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger>
                                    <SelectContent>
                                        {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </div>
                     {(errors.birthMonth || errors.birthDay || errors.birthYear) && <p className="text-sm text-destructive">Please select a valid date.</p>}
                </div>
                
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Country</Label>
                        <Controller
                            name="country"
                            control={control}
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value} disabled={!isEditing}>
                                    <SelectTrigger><SelectValue placeholder="Select a country..." /></SelectTrigger>
                                    <SelectContent>
                                        {countries.map(c => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {errors.country && <p className="text-sm text-destructive">{errors.country.message}</p>}
                    </div>
                     <div className="space-y-2">
                        <Label>State/Province</Label>
                        <Controller
                            name="state"
                            control={control}
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value} disabled={!isEditing || !selectedCountry}>
                                    <SelectTrigger><SelectValue placeholder="Select a state..." /></SelectTrigger>
                                    <SelectContent>
                                        {availableStates.map(s => <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {errors.state && <p className="text-sm text-destructive">{errors.state.message}</p>}
                    </div>
                 </div>

                 <div className="space-y-2">
                    <Label htmlFor="walletAddress">Withdrawal Wallet Address</Label>
                    <Input id="walletAddress" {...register('walletAddress')} disabled={!isEditing} />
                    {errors.walletAddress && <p className="text-sm text-destructive">{errors.walletAddress.message}</p>}
                </div>
            </div>

            <Card className="flex flex-col items-center justify-center bg-muted/30">
                <CardHeader>
                    <CardTitle>Wallet QR Code</CardTitle>
                    <CardDescription className="text-center">Scan with your crypto wallet app</CardDescription>
                </CardHeader>
                <CardContent>
                {currentWalletAddress ? (
                    <div className="bg-white p-4 rounded-lg">
                        <QRCode value={currentWalletAddress} size={160} />
                    </div>
                    ) : (
                    <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center text-sm text-muted-foreground text-center p-4">
                        Enter your wallet address to generate a QR code.
                    </div>
                )}
                </CardContent>
            </Card>
        </div>
      
      {isEditing ? (
        <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isVerified ? 'Save Changes' : 'Save and Verify'}
        </Button>
      ) : (
        <Button type="button" variant="outline" onClick={() => setIsEditing(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Information
        </Button>
      )}
    </form>
  );
}
