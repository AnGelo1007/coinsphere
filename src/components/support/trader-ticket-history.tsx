
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableRow, TableHeader, TableHead } from '@/components/ui/table';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { TicketConversation } from './ticket-conversation';
import type { Ticket, TicketStatus } from '@/lib/actions';
import { db } from '@/lib/firebase';
import { ref, onValue, query, orderByChild, equalTo } from 'firebase/database';
import { cn } from '@/lib/utils';


function TicketHistorySkeleton() {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Ticket ID</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Status</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {Array.from({ length: 3 }).map((_, index) => (
                    <TableRow key={index}>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

const badgeVariantMap: Record<TicketStatus, 'default' | 'secondary' | 'outline'> = {
    Open: 'default',
    Closed: 'secondary',
    Pending: 'outline',
};

export function TraderTicketHistory() {
    const { user } = useAuth();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [isConversationOpen, setIsConversationOpen] = useState(false);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }
        
        const ticketsRef = ref(db, 'tickets');
        const userTicketsQuery = query(ticketsRef, orderByChild('userId'), equalTo(user.uid));

        const unsubscribe = onValue(userTicketsQuery, (snapshot) => {
            const data: Ticket[] = [];
            if (snapshot.exists()) {
                snapshot.forEach(child => {
                    data.push({ id: child.key!, ...child.val() });
                });
            }
            setTickets(data.sort((a, b) => b.createdAt - a.createdAt)); // Show newest first
            setLoading(false);
        });
        
        return () => unsubscribe();
    }, [user]);

    const handleTicketClick = (ticket: Ticket) => {
        setSelectedTicket(ticket);
        setIsConversationOpen(true);
    };

    if (loading) {
        return <TicketHistorySkeleton />;
    }

    return (
        <>
            {tickets.length > 0 ? (
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Ticket ID</TableHead>
                                <TableHead>Subject</TableHead>
                                <TableHead>Submitted</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tickets.map((ticket) => (
                                <TableRow key={ticket.id}>
                                    <TableCell 
                                        className="font-mono text-xs cursor-pointer hover:underline"
                                        onClick={() => handleTicketClick(ticket)}
                                    >
                                        {ticket.ticketNumber}
                                    </TableCell>
                                    <TableCell>{ticket.subject}</TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                                    </TableCell>
                                    <TableCell 
                                        className="cursor-pointer"
                                        onClick={() => handleTicketClick(ticket)}
                                    >
                                        <Badge 
                                            variant={badgeVariantMap[ticket.status]}
                                        >
                                            {ticket.status}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            ) : (
                <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                    <p>You have no open or pending support tickets.</p>
                </div>
            )}
            <Dialog open={isConversationOpen} onOpenChange={setIsConversationOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Ticket: {selectedTicket?.ticketNumber}</DialogTitle>
                        <DialogDescription>{selectedTicket?.subject}</DialogDescription>
                    </DialogHeader>
                    {selectedTicket && (
                        <TicketConversation 
                            ticketId={selectedTicket.id}
                            initialMessages={selectedTicket.messages || []}
                            ticketStatus={selectedTicket.status}
                            userDisplayName={selectedTicket.userDisplayName}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
