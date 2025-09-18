
'use client';
import { UserManagementTable } from '@/components/admin/user-management-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield } from 'lucide-react';

export default function AdminPage() {
  return (
    <Tabs defaultValue="users">
      <TabsList className="grid w-full grid-cols-1">
        <TabsTrigger value="users">
          <Shield className="mr-2 h-4 w-4" />
          User Management
        </TabsTrigger>
      </TabsList>
      <TabsContent value="users">
        <UserManagementTable />
      </TabsContent>
    </Tabs>
  );
}
