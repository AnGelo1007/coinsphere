'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/auth-context';
import { useMarketData } from '@/contexts/market-data-context';
import { Loader2, ArrowRightLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { ref, runTransaction } from 'firebase/database';
import { getCryptoIcon } from '@/components/crypto-icons';

export function ConvertAssetCard() {
    const { user, userProfile } = useAuth();
    const { marketDataMap } = useMarketData();
    const { toast } = useToast();

    const [fromAsset, setFromAsset] = useState('');
    const [amount, setAmount] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const toAsset = 'USDT';

    const availableAssets = useMemo(() => {
        if (!userProfile?.portfolio) return [];
        return Object.keys(userProfile.portfolio).filter(
            asset => asset !== toAsset && (userProfile.portfolio?.[asset] ?? 0) > 0
        );
    }, [userProfile, toAsset]);

    const fromAssetBalance = userProfile?.portfolio?.[fromAsset] || 0;
    const conversionRate = marketDataMap[fromAsset]?.priceRaw || 0;
    const estimatedReceiveAmount = (Number(amount) || 0) * conversionRate;
    
    const FromIcon = fromAsset ? getCryptoIcon(fromAsset) : null;
    const ToIcon = getCryptoIcon(toAsset);

    const handleConvert = async () => {
        if (!user || !fromAsset || !amount) return;

        const amountToConvert = Number(amount);
        if (isNaN(amountToConvert) || amountToConvert <= 0) {
            toast({ variant: 'destructive', title: 'Invalid Amount' });
            return;
        }

        if (amountToConvert > fromAssetBalance) {
            toast({ variant: 'destructive', title: 'Insufficient Funds' });
            return;
        }

        setIsSubmitting(true);

        try {
            const userRef = ref(db, `users/${user.uid}`);
            await runTransaction(userRef, (currentData) => {
                if (currentData) {
                    const currentFromBalance = currentData.portfolio?.[fromAsset] || 0;
                    if (currentFromBalance < amountToConvert) {
                        // Abort transaction if funds are not enough
                        return; 
                    }
                    if (!currentData.portfolio) currentData.portfolio = {};

                    currentData.portfolio[fromAsset] = currentFromBalance - amountToConvert;
                    currentData.portfolio[toAsset] = (currentData.portfolio[toAsset] || 0) + estimatedReceiveAmount;
                }
                return currentData;
            });
            
            toast({ title: 'Conversion Successful', description: `Converted ${amount} ${fromAsset} to ${estimatedReceiveAmount.toFixed(2)} ${toAsset}` });
            setAmount('');
            setFromAsset('');
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Conversion Failed', description: error.message || 'An unexpected error occurred.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Convert Asset</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                        <span>From</span>
                        <span>Balance: {fromAssetBalance.toFixed(6)}</span>
                    </div>
                     <div className="flex gap-2">
                        <Input 
                            type="number" 
                            placeholder="0.0" 
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            disabled={!fromAsset}
                        />
                        <Select value={fromAsset} onValueChange={setFromAsset}>
                            <SelectTrigger className="w-[120px]">
                                <SelectValue placeholder="Asset" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableAssets.map(asset => (
                                    <SelectItem key={asset} value={asset}>
                                        <div className="flex items-center gap-2">
                                            {React.createElement(getCryptoIcon(asset), {className: 'w-4 h-4'})}
                                            {asset}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                     </div>
                </div>
                
                <div className="flex justify-center my-2">
                    <ArrowRightLeft className="h-5 w-5 text-muted-foreground" />
                </div>

                <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">To (Estimated)</p>
                     <div className="flex gap-2">
                        <Input 
                            value={estimatedReceiveAmount.toFixed(2)} 
                            readOnly 
                            className="font-mono"
                        />
                        <div className="flex items-center justify-center gap-2 w-[120px] border rounded-md bg-muted px-3 text-sm">
                            <ToIcon className="w-4 h-4" />
                            {toAsset}
                        </div>
                     </div>
                </div>

                <Button 
                    className="w-full" 
                    onClick={handleConvert}
                    disabled={isSubmitting || !fromAsset || !amount || Number(amount) <= 0}
                >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Convert
                </Button>
            </CardContent>
        </Card>
    );
}
