
'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { History, ArrowUpRightFromSquare, Upload } from 'lucide-react';
import { TraderWithdrawalsHistory } from '@/components/trader-dashboard/receipts/trader-withdrawals-history';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/language-context';
import { SubmitReceiptForm } from '@/components/trader-dashboard/receipts/submit-receipt-form';
import { TraderReceiptsHistory } from '@/components/trader-dashboard/receipts/trader-receipts-history';

function ReceiptsPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab') || 'deposits';
  const { t } = useLanguage();

  const handleTabChange = (value: string) => {
    router.push(`${pathname}?tab=${value}`);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
            <CardTitle>{t('submitTransaction')}</CardTitle>
            <CardDescription>{t('submitTransactionDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
            <SubmitReceiptForm />
        </CardContent>
      </Card>
      
      <Tabs value={tab} onValueChange={handleTabChange} defaultValue="deposits">
        <div className="hidden md:block">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="deposits">
              <History className="mr-2 h-4 w-4" />
              {t('depositHistory')}
            </TabsTrigger>
            <TabsTrigger value="withdrawals">
              <ArrowUpRightFromSquare className="mr-2 h-4 w-4" />
              {t('withdrawalHistory')}
            </TabsTrigger>
          </TabsList>
        </div>
        <div className="md:hidden mb-4">
            <Select value={tab} onValueChange={handleTabChange}>
              <SelectTrigger>
                <SelectValue placeholder={t('selectAView')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="deposits">{t('depositHistory')}</SelectItem>
                <SelectItem value="withdrawals">{t('withdrawalHistory')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        <TabsContent value="deposits">
          <Card>
            <CardHeader>
              <CardTitle>{t('depositHistory')}</CardTitle>
              <CardDescription>{t('depositHistoryDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <TraderReceiptsHistory />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="withdrawals">
          <Card>
            <CardHeader>
              <CardTitle>{t('withdrawalHistory')}</CardTitle>
              <CardDescription>{t('withdrawalHistoryDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <TraderWithdrawalsHistory />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ReceiptsPageSkeleton() {
    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-48 mb-2" />
                    <Skeleton className="h-4 w-80" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-64 w-full" />
                </CardContent>
            </Card>
            <Skeleton className="h-10 w-full" />
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-48 mb-2" />
                    <Skeleton className="h-4 w-80" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-64 w-full" />
                </CardContent>
            </Card>
        </div>
    )
}

export default function ReceiptsPage() {
  return (
    <Suspense fallback={<ReceiptsPageSkeleton />}>
      <ReceiptsPageContent />
    </Suspense>
  )
}
