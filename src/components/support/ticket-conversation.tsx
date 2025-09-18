
'use client';

import type { FormEvent } from 'react';
import { useState, useEffect, useRef } from 'react';
import type { TicketMessage, TicketStatus } from '@/lib/actions';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { db } from '@/lib/firebase';
import { ref, update, get, serverTimestamp, push } from 'firebase/database';
import { useAuth } from '@/contexts/auth-context';

interface TicketConversationProps {
  ticketId: string;
  initialMessages: TicketMessage[] | Record<string, TicketMessage>;
  ticketStatus: TicketStatus;
  userDisplayName: string;
  isAgentView?: boolean;
}

function getInitials(name: string | undefined | null) {
    if (name) {
        const names = name.split(' ');
        if (names.length > 1 && names[names.length - 1]) {
            return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    }
    return 'U';
}


export function TicketConversation({ ticketId, initialMessages, ticketStatus, userDisplayName, isAgentView = false }: TicketConversationProps) {
  const { user } = useAuth();
  // Defensive programming: ensure messages are always an array
  const getMessagesAsArray = (messagesData: TicketConversationProps['initialMessages']): TicketMessage[] => {
    if (Array.isArray(messagesData)) {
      return messagesData;
    }
    if (typeof messagesData === 'object' && messagesData !== null) {
      return Object.values(messagesData);
    }
    return [];
  };

  const [messages, setMessages] = useState<TicketMessage[]>(getMessagesAsArray(initialMessages));
  const [reply, setReply] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  const userInitials = getInitials(userDisplayName);

  useEffect(() => {
    setMessages(getMessagesAsArray(initialMessages));
  }, [initialMessages]);

  useEffect(() => {
    // Auto-scroll to the bottom when new messages arrive
    if (scrollAreaRef.current) {
        const scrollableView = scrollAreaRef.current.querySelector('div');
        if (scrollableView) {
           scrollableView.scrollTop = scrollableView.scrollHeight;
        }
    }
  }, [messages]);
  
  useEffect(() => {
    if (!isAgentView && user) {
        const ticketReadRef = ref(db, `tickets/${ticketId}/userHasRead`);
        update(ref(db), { [`tickets/${ticketId}/userHasRead`]: true });
    }
  }, [ticketId, isAgentView, user]);

  const handleReplySubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!reply.trim() || !user) return;

    setIsSubmitting(true);
    
    try {
        const ticketRef = ref(db, `tickets/${ticketId}`);
        const snapshot = await get(ticketRef);
        if (!snapshot.exists()) {
            throw new Error('Ticket not found.');
        }

        const ticketData = snapshot.val();
        if (ticketData.status === 'Closed') {
            throw new Error('This ticket has been closed and can no longer be replied to.');
        }

        const newReply: Omit<TicketMessage, 'timestamp'> & { timestamp: any } = {
            sender: isAgentView ? 'Support' : 'User',
            text: reply.trim(),
            timestamp: serverTimestamp(),
        };
        
        const messagesRef = ref(db, `tickets/${ticketId}/messages`);
        const newMessageRef = push(messagesRef);
        await update(newMessageRef, newReply);

        const updates: { [key: string]: any } = {};
        let notificationMessage = '';
        let notificationLink = '';
        let notificationPath = '';

        if (isAgentView) {
            updates[`tickets/${ticketId}/status`] = 'Open';
            updates[`tickets/${ticketId}/userHasRead`] = false;
            
            notificationMessage = `You have a new reply on ticket #${ticketData.ticketNumber}.`;
            notificationLink = '/support';
            notificationPath = `notifications/${ticketData.userId}`;

        } else {
            updates[`tickets/${ticketId}/status`] = 'Pending';
            updates[`tickets/${ticketId}/userHasRead`] = true;
            
            notificationMessage = `New reply on ticket #${ticketData.ticketNumber} from ${ticketData.userEmail}`;
            notificationLink = '/trader-dashboard/account';
            notificationPath = 'admin-notifications';
        }
        
        await update(ref(db), updates);

        const newNotificationRef = push(ref(db, notificationPath));
        await update(newNotificationRef, {
            message: notificationMessage,
            type: 'ticket',
            link: notificationLink,
            timestamp: serverTimestamp(),
            read: false,
        });

        // This is a client-side update for immediate feedback
        const tempReply: TicketMessage = {
          ...newReply,
          timestamp: Date.now() // Use local time for immediate display
        };
        setMessages(prev => [...prev, tempReply]);
        setReply('');

    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Error sending reply',
            description: error.message || 'An unexpected error occurred.',
        });
    }

    setIsSubmitting(false);
  };

  return (
    <div className="flex flex-col h-[60vh]">
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((msg, index) => {
            if (!msg) return null; // Add a guard for potentially null/undefined entries
            const isUserMessage = msg.sender === 'User';
            const isSupportMessage = msg.sender === 'Support';
            const isMyMessage = (isAgentView && isSupportMessage) || (!isAgentView && isUserMessage);
            const senderName = isUserMessage ? userDisplayName : 'Support';
            
            return (
              <div key={index} className={cn('flex items-end gap-2', isMyMessage ? 'justify-end' : 'justify-start')}>
                 {!isMyMessage && (
                    <Avatar className="h-8 w-8">
                        <AvatarFallback>{isUserMessage ? userInitials : 'S'}</AvatarFallback>
                    </Avatar>
                 )}
                <div
                  className={cn(
                    'max-w-xs md:max-w-md rounded-lg p-3 text-sm',
                    isMyMessage
                      ? 'bg-primary text-primary-foreground rounded-br-none'
                      : 'bg-muted rounded-bl-none'
                  )}
                >
                  <p className="font-bold mb-1">{senderName}</p>
                  <p>{msg.text}</p>
                  <p className="text-xs opacity-70 mt-2 text-right">
                    {format(new Date(msg.timestamp), 'MMM d, h:mm a')}
                  </p>
                </div>
                 {isMyMessage && (
                    <Avatar className="h-8 w-8">
                        <AvatarFallback>{isSupportMessage ? 'S' : userInitials}</AvatarFallback>
                    </Avatar>
                 )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
      {ticketStatus !== 'Closed' ? (
        <form onSubmit={handleReplySubmit} className="border-t p-4 flex items-center gap-2">
          <Textarea
            placeholder="Type your reply..."
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            className="flex-1"
            rows={1}
            disabled={isSubmitting}
          />
          <Button type="submit" size="icon" disabled={!reply.trim() || isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      ) : (
        <div className="border-t p-4 text-center text-sm text-muted-foreground">
            This ticket has been closed.
        </div>
       )}
    </div>
  );
}
