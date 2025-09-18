
'use client';
import Link from 'next/link';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/layout/logo';
import { BarChart, User, Gift, LayoutDashboard, Shield, MessageSquare, Receipt, ArrowUpRightFromSquare, Users, FileArchive } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';

export default function TraderSidebar() {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const { isAdmin } = useAuth();
  const pathname = usePathname();
  const { t } = useLanguage();

  const baseMenuItems = [
    { href: '/trader-dashboard', label: t('sidebarDashboard'), icon: <LayoutDashboard /> },
    { href: '/trader-dashboard/trade', label: t('sidebarTrade'), icon: <BarChart /> },
  ];

  const adminOnlyItems = [
      { href: '/trader-dashboard/admin', label: t('sidebarUserManagement'), icon: <Shield /> },
      { href: '/trader-dashboard/admin/receipts', label: 'Deposit Receipts', icon: <FileArchive /> },
      { href: '/trader-dashboard/admin/withdrawals', label: t('sidebarWithdrawals'), icon: <ArrowUpRightFromSquare /> },
      { href: '/trader-dashboard/account', label: t('sidebarChatHistory'), icon: <MessageSquare /> },
      { href: '/trader-dashboard/admin/referrals', label: t('sidebarAdminReferrals'), icon: <Users /> },
  ];

  const traderOnlyItems = [
      { href: '/trader-dashboard/account', label: t('sidebarAccount'), icon: <User /> },
      { href: '/trader-dashboard/receipts', label: t('sidebarReceipts'), icon: <Receipt /> },
      { href: '/trader-dashboard/referral', label: t('sidebarReferral'), icon: <Gift /> },
  ];

  const menuItems = isAdmin 
    ? [...baseMenuItems, ...adminOnlyItems]
    : [...baseMenuItems, ...traderOnlyItems];


  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  }


  return (
    <Sidebar
      className="border-r"
      collapsible="icon"
      variant="sidebar"
    >
      <SidebarHeader>
        <div
          className={cn(
            'flex items-center gap-2 p-2',
            state === 'collapsed' && 'justify-center'
          )}
        >
          <Logo />
          <span
            className={cn(
              'font-bold text-lg',
              state === 'collapsed' && 'hidden'
            )}
          >
            CoinSphere
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                tooltip={{ children: item.label }}
                onClick={handleLinkClick}
              >
                <Link href={item.href}>
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2 mt-auto">
      </SidebarFooter>
    </Sidebar>
  );
}
