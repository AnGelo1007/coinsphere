
'use client';

import { VerificationForm } from '@/components/trader-dashboard/account/verification-form';
import { useAuth } from '@/contexts/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ChatHistory } from '@/components/trader-dashboard/account/chat-history';


function LoadingState() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-80" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-64 w-full" />
            </CardContent>
        </Card>
    )
}

export default function AccountPage() {
  const { isAdmin, loading } = useAuth();

  if (loading) {
    return <LoadingState />;
  }
  
  if (isAdmin) {
    return (
      <div className="overflow-x-auto">
        <ChatHistory />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Verification</CardTitle>
        <CardDescription>Verify your identity to secure your account and enable withdrawals.</CardDescription>
      </CardHeader>
      <CardContent>
        <VerificationForm />
      </CardContent>
    </Card>
  );
}
