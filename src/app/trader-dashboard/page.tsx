
'use client';

import { useAuth } from '@/contexts/auth-context';
import Wallet from '@/components/trader-dashboard/wallet/wallet';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WalletSettings } from '@/components/admin/wallet-settings';
import { AdminAnnouncements } from '@/components/admin/admin-announcements';
import { Megaphone, Wallet as WalletIcon } from 'lucide-react';

function AdminDashboardView() {
    return (
        <Tabs defaultValue="announcements">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="announcements">
                    <Megaphone className="mr-2 h-4 w-4" />
                    Announcements
                </TabsTrigger>
                <TabsTrigger value="wallets">
                    <WalletIcon className="mr-2 h-4 w-4" />
                    Wallet Settings
                </TabsTrigger>
            </TabsList>
            <TabsContent value="announcements">
                <AdminAnnouncements />
            </TabsContent>
            <TabsContent value="wallets">
                <WalletSettings />
            </TabsContent>
        </Tabs>
    )
}


export default function TraderDashboardPage() {
    const { loading, isAdmin } = useAuth();
    if (loading) {
        return (
            <div className="space-y-8">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-96 w-full" />
            </div>
        )
    }

    if (isAdmin) {
        return <AdminDashboardView />;
    }

  return (
    <div className="w-full overflow-x-auto">
      <Wallet />
    </div>
  );
}
