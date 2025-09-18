
'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import QRCode from 'qrcode.react';
import { Copy, Check, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { db } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import { Skeleton } from '@/components/ui/skeleton';

interface DepositDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function DepositDialog({ isOpen, onOpenChange }: DepositDialogProps) {
  const [depositInfo, setDepositInfo] = useState<Record<string, { address: string }>>({});
  const [loading, setLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [hasCopied, setHasCopied] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  
  useEffect(() => {
    const infoRef = ref(db, 'settings/depositInfo');
    const unsubscribe = onValue(infoRef, (snapshot) => {
      if (snapshot.exists()) {
        setDepositInfo(snapshot.val());
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const depositAssets = Object.keys(depositInfo);
  const currentAddressInfo = selectedAsset ? depositInfo[selectedAsset] : null;

  const handleCopy = () => {
    if (!currentAddressInfo) return;
    navigator.clipboard.writeText(currentAddressInfo.address).then(() => {
      setHasCopied(true);
      toast({
        title: 'Copied to clipboard!',
        description: 'You can now paste the wallet address.',
      });
      setTimeout(() => setHasCopied(false), 2000);
    });
  };
  
  const handleSubmitReceipt = () => {
    onOpenChange(false);
    router.push('/trader-dashboard/receipts');
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) setSelectedAsset(null); // Reset on close
        onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Deposit Crypto</DialogTitle>
          <DialogDescription>
            Select an asset to deposit. After sending, please submit your transaction receipt.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 pt-2">
            <div>
                 <Label htmlFor="asset-select">Asset</Label>
                 <Select onValueChange={setSelectedAsset} disabled={loading || depositAssets.length === 0}>
                    <SelectTrigger id="asset-select">
                        <SelectValue placeholder={loading ? "Loading..." : "Select an asset..."} />
                    </SelectTrigger>
                    <SelectContent>
                        {depositAssets.map(asset => (
                            <SelectItem key={asset} value={asset}>{asset}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center space-y-4 pt-4 border-t">
                    <Skeleton className="h-48 w-48" />
                    <Skeleton className="h-10 w-full" />
                </div>
            ) : currentAddressInfo ? (
                <div className="flex flex-col items-center justify-center space-y-4 pt-4 border-t">
                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                            <ol className="list-decimal list-inside space-y-1">
                                <li>Copy the address below.</li>
                                <li>In your external wallet, choose "Withdraw".</li>
                                <li>Select the {selectedAsset} asset.</li>
                                <li>Paste the address and complete the transfer.</li>
                            </ol>
                        </AlertDescription>
                    </Alert>

                    <div className="bg-white p-4 rounded-lg">
                        <QRCode value={currentAddressInfo.address} size={160} />
                    </div>

                    <div className="w-full space-y-2">
                        <Label htmlFor="wallet-address">Wallet Address</Label>
                        <div className="relative">
                            <Input id="wallet-address" value={currentAddressInfo.address} readOnly className="pr-10 text-xs" />
                            <Button 
                                type="button" 
                                size="icon" 
                                variant="ghost" 
                                className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                                onClick={handleCopy}
                            >
                                {hasCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                <span className="sr-only">Copy address</span>
                            </Button>
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground text-center px-4">
                        Only send {selectedAsset} to this address. Sending any other asset will result in the loss of your funds.
                    </p>
                </div>
            ) : (
                <div className="text-center text-muted-foreground pt-8 pb-4">
                    <p>Please select an asset to view the deposit address.</p>
                </div>
            )}
        </div>

        <DialogFooter className="sm:justify-center pt-4">
            <Button type="button" onClick={handleSubmitReceipt} disabled={!currentAddressInfo}>
              I have sent the funds, now Submit Receipt
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
