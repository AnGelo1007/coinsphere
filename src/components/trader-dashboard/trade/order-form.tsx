
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/auth-context';
import { getCryptoIcon } from '@/components/crypto-icons';
import { Loader2 } from 'lucide-react';

const timeframes = [
  { label: '5M', value: '5 minutes', profitRate: 20, minAmount: 100, maxAmount: 4999 },
  { label: '30M', value: '30 minutes', profitRate: 40, minAmount: 5000, maxAmount: 9999 },
  { label: '1H', value: '60 minutes', profitRate: 60, minAmount: 10000, maxAmount: 49999 },
  { label: '24H', value: '24 hours', profitRate: 80, minAmount: 50000, maxAmount: Infinity },
];

const OrderFormSchema = z.object({
  amount: z.coerce.number().positive("Amount must be a positive number"),
  timeframe: z.string(),
});
type OrderFormInputs = z.infer<typeof OrderFormSchema>;

interface OrderFormProps {
  onSubmit: (data: { 
    amount: number; 
    timeframe: string; 
    profitRate: number; 
    orderType: 'Buy Up' | 'Buy Down';
  }) => void;
  isSubmitting: boolean;
}

export function OrderForm({ onSubmit, isSubmitting }: OrderFormProps) {
  const { userProfile } = useAuth();
  const [selectedTimeframe, setSelectedTimeframe] = useState(timeframes[0]);
  const [orderType, setOrderType] = useState<'Buy Up' | 'Buy Down'>('Buy Up');

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<OrderFormInputs>({
    resolver: zodResolver(OrderFormSchema.refine(
      (data) => {
        const tf = timeframes.find(t => t.value === data.timeframe);
        if (!tf) return false;
        return data.amount >= tf.minAmount && data.amount <= tf.maxAmount;
      },
      {
        message: 'Amount is outside the allowed range for the selected timeframe.',
        path: ['amount'],
      }
    )),
    defaultValues: {
      timeframe: timeframes[0].value,
      amount: 0,
    }
  });

  const amountValue = watch('amount');
  const userBalanceUSDT = userProfile?.portfolio?.['USDT'] || 0;
  
  const AssetIcon = getCryptoIcon('USDT');

  useEffect(() => {
    setValue('timeframe', selectedTimeframe.value);
  }, [selectedTimeframe, setValue]);

  const handleFormSubmit = (data: OrderFormInputs) => {
    onSubmit({
      ...data,
      profitRate: selectedTimeframe.profitRate,
      orderType: orderType,
    });
  };
  
  const minMaxPlaceholder = `Min ${selectedTimeframe.minAmount} / Max ${selectedTimeframe.maxAmount === Infinity ? '∞' : selectedTimeframe.maxAmount} (USDT)`;
  
  const potentialProfit = amountValue > 0 ? amountValue * (selectedTimeframe.profitRate / 100) : 0;

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div>
        <Label>Opening quantity</Label>
        <div className="relative">
          <Input 
            id="amount" 
            type="number"
            step="any"
            className="pr-12"
            placeholder={minMaxPlaceholder}
            {...register('amount')} 
          />
           <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <AssetIcon className="h-4 w-4 text-muted-foreground" />
           </div>
        </div>
         {errors.amount && <p className="text-sm text-destructive mt-1">{errors.amount.message}</p>}
         <p className="text-xs text-muted-foreground mt-2">Available: {userBalanceUSDT.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} USDT</p>
      </div>

      <div>
        <Label>Open time</Label>
        <div className="grid grid-cols-4 gap-2">
          {timeframes.map((tf) => (
            <Button
              key={tf.value}
              type="button"
              variant={selectedTimeframe.value === tf.value ? 'secondary' : 'outline'}
              onClick={() => setSelectedTimeframe(tf)}
              className="text-xs md:text-sm"
            >
              {tf.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex justify-between items-center">
        <Label>Profit rate</Label>
        <span className="font-bold text-lg">{selectedTimeframe.profitRate.toFixed(2)}%</span>
      </div>
      
       <div className="flex justify-between items-center text-sm">
        <Label>Potential Profit</Label>
        <span className="font-mono text-green-500">
            +${potentialProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button
          type="submit"
          onClick={() => setOrderType('Buy Up')}
          disabled={isSubmitting}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          {isSubmitting && orderType === 'Buy Up' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Buy Up
        </Button>
        <Button
          type="submit"
          onClick={() => setOrderType('Buy Down')}
          disabled={isSubmitting}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
           {isSubmitting && orderType === 'Buy Down' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Buy Down
        </Button>
      </div>
    </form>
  );
}
