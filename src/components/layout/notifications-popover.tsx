
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Bell, CheckCheck, Trash2, MoreHorizontal, Search } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { formatDistanceToNow } from 'date-fns';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { Skeleton } from '../ui/skeleton';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { db, isConfigured } from '@/lib/firebase';
import { ref, onValue, query, orderByChild, update, remove } from 'firebase/database';

type NotificationType = 'ticket' | 'withdrawal' | 'deposit' | 'general' | 'referral' | 'order';
type FilterType = 'all' | 'order' | 'deposit' | 'withdrawal';

interface Notification {
  id: string;
  message: string;
  timestamp: number;
  read: boolean;
  link?: string;
  type?: NotificationType;
}

export function NotificationsPopover() {
  const { user, isAdmin } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!user || !isConfigured) {
      setLoading(false);
      return;
    };
    
    const path = isAdmin ? `admin-notifications` : `notifications/${user.uid}`;
    const notifsQuery = query(ref(db, path), orderByChild('timestamp'));

    const unsubscribe = onValue(notifsQuery, (snapshot) => {
        const data: Notification[] = [];
        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                data.push({ id: childSnapshot.key!, ...childSnapshot.val() });
            });
        }
        setNotifications(data.reverse()); // Show newest first
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user, isAdmin]);

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);
  const readCount = useMemo(() => notifications.filter(n => n.read).length, [notifications]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
        const matchesSearch = n.message.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = activeFilter === 'all' || n.type === activeFilter;
        return matchesSearch && matchesFilter;
    });
  }, [notifications, searchQuery, activeFilter]);

  const handleMarkAllRead = async () => {
    if (!user || unreadCount === 0) return;
    const path = isAdmin ? `admin-notifications` : `notifications/${user.uid}`;
    const updates: { [key: string]: boolean } = {};
    notifications.forEach(n => {
        if (!n.read) {
            updates[`${path}/${n.id}/read`] = true;
        }
    });
    await update(ref(db), updates);
    toast({ title: 'Notifications marked as read.' });
  };
  
  const handleDeleteAllRead = async () => {
    if (!user || readCount === 0) return;
    const path = isAdmin ? `admin-notifications` : `notifications/${user.uid}`;
    const updates: { [key: string]: null } = {};
     notifications.forEach(n => {
        if (n.read) {
            updates[`${path}/${n.id}`] = null;
        }
    });
    await update(ref(db), updates);
    toast({ title: 'Read notifications deleted.'});
  };

  const handleNotificationClick = async (notif: Notification) => {
    if (!user) return;
    if (!notif.read) {
        const path = isAdmin ? `admin-notifications/${notif.id}` : `notifications/${user.uid}/${notif.id}`;
        await update(ref(db, path), { read: true });
    }
    if (notif.link) {
        router.push(notif.link);
    }
    setIsPopoverOpen(false); // Close popover on click
  }
  
  const handleDelete = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation(); // Prevent the click from triggering the parent's onClick
    if (!user) return;
    const path = isAdmin ? `admin-notifications/${notificationId}` : `notifications/${user.uid}/${notificationId}`;
    await remove(ref(db, path));
  }

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 text-xs items-center justify-center bg-red-500 text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 md:w-96 p-0">
        <div className="flex items-center justify-between p-2">
          <h3 className="font-semibold px-2">Notifications</h3>
          {(unreadCount > 0 || readCount > 0) && (
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    {unreadCount > 0 && (
                        <DropdownMenuItem onSelect={handleMarkAllRead}>
                            <CheckCheck className="mr-2 h-4 w-4" />
                            <span>Mark all as read</span>
                        </DropdownMenuItem>
                    )}
                     {readCount > 0 && (
                        <DropdownMenuItem onSelect={handleDeleteAllRead} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                           <span>Delete all read</span>
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <div className="px-2 pb-2">
          <div className="flex items-center gap-2">
              <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                      placeholder="Search..."
                      className="w-full h-8 text-xs pl-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                  />
              </div>
              <Select value={activeFilter} onValueChange={(value) => setActiveFilter(value as FilterType)}>
                <SelectTrigger className="w-[120px] h-8 text-xs">
                  <SelectValue placeholder="Filter..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="order">Orders</SelectItem>
                    <SelectItem value="deposit">Deposits</SelectItem>
                    <SelectItem value="withdrawal">Withdrawals</SelectItem>
                </SelectContent>
              </Select>
          </div>
        </div>
        <Separator />
        <ScrollArea className="h-80">
            {loading ? (
                <div className="p-4 space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            ) : filteredNotifications.length > 0 ? (
                filteredNotifications.map((notif) => (
                    <div key={notif.id} className="group relative p-4 border-b hover:bg-muted/50 cursor-pointer" onClick={() => handleNotificationClick(notif)}>
                        {!notif.read && (
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-primary" />
                        )}
                        <p className={cn("text-sm", !notif.read ? 'font-medium text-foreground' : 'text-muted-foreground')}>
                            {notif.message}
                        </p>
                        <p className={cn("text-xs mt-1", !notif.read ? 'text-primary' : 'text-muted-foreground')}>
                            {formatDistanceToNow(new Date(notif.timestamp), { addSuffix: true })}
                        </p>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => handleDelete(e, notif.id)}
                        >
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                ))
            ) : (
                <div className="text-center text-muted-foreground p-8">
                    <p>You have no notifications{searchQuery || activeFilter !== 'all' ? ' matching your filters' : ''}.</p>
                </div>
            )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

    