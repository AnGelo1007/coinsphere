
import type { ReactNode } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import TraderSidebar from '@/components/trader-dashboard/sidebar';

export default function TraderDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex-1 flex min-h-0 overflow-x-hidden">
        <TraderSidebar />
        <div className="flex-1 flex flex-col min-w-0">
           <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:hidden">
              <SidebarTrigger />
              <h1 className="text-lg font-semibold">Dashboard</h1>
            </header>
          <main className="flex-1 p-4 md:p-6">
            <div className="w-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
