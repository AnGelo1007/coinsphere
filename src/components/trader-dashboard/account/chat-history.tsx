
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { MessageSquare, MoreVertical, Search, Trash2, Eye, Filter, X } from 'lucide-react';
import { Table, TableBody, TableCell, TableRow, TableHeader, TableHead } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { db } from '@/lib/firebase';
import { ref, onValue, query, orderByChild, update } from 'firebase/database';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import type { Ticket, TicketStatus } from '@/lib/actions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { TicketConversation } from '@/components/support/ticket-conversation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { createNotification } from '@/lib/actions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function ChatHistorySkeleton() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Support Tickets</CardTitle>
                <CardDescription>Review and respond to trader support tickets.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <Skeleton className="h-10 w-full md:w-1/3" />
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead><Skeleton className="h-5 w-5" /></TableHead>
                                    <TableHead>User</TableHead>
                                    <TableHead>Subject</TableHead>
                                    <TableHead>Submitted</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {Array.from({ length: 5 }).map((_, index) => (
                                    <TableRow key={index}>
                                        <TableCell><Skeleton className="h-5 w-5" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                                        <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

const badgeVariantMap: Record<TicketStatus, 'default' | 'secondary' | 'outline'> = {
    Open: 'default',
    Closed: 'secondary',
    Pending: 'outline',
};
const statuses: TicketStatus[] = ['Open', 'Pending', 'Closed'];

export function ChatHistory() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [isConversationOpen, setIsConversationOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const { toast } = useToast();
    const [selectedStatus, setSelectedStatus] = useState<TicketStatus | null>(null);
    
    useEffect(() => {
        const ticketsRef = ref(db, 'tickets');
        const ticketsQuery = query(ticketsRef, orderByChild('createdAt'));

        const unsubscribe = onValue(ticketsQuery, (snapshot) => {
            const data: Ticket[] = [];
            if (snapshot.exists()) {
                snapshot.forEach((child) => {
                    data.push({ id: child.key!, ...child.val() });
                });
            }
            setTickets(data.reverse());
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const filteredTickets = useMemo(() => {
        let filtered = tickets;
        
        if (selectedStatus) {
            filtered = filtered.filter(ticket => ticket.status === selectedStatus);
        }

        if (searchQuery) {
            filtered = filtered.filter(ticket =>
                (ticket.ticketNumber?.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (ticket.userDisplayName?.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (ticket.userEmail?.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (ticket.subject?.toLowerCase().includes(searchQuery.toLowerCase()))
            );
        }
        
        const visibleIds = new Set(filtered.map(r => r.id));
        const newSelection = selectedIds.filter(id => visibleIds.has(id));
        if (newSelection.length !== selectedIds.length) {
            setSelectedIds(newSelection);
        }

        return filtered;
    }, [tickets, searchQuery, selectedStatus, selectedIds]);
    
    const handleTicketClick = (ticket: Ticket) => {
        setSelectedTicket(ticket);
        setIsConversationOpen(true);
    }

    const handleToggleAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(filteredTickets.map(t => t.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleToggleRow = (id: string, checked: boolean) => {
        if (checked) {
            setSelectedIds(prev => [...prev, id]);
        } else {
            setSelectedIds(prev => prev.filter(rowId => rowId !== id));
        }
    };

    const handleStatusChange = async (ticket: Ticket, status: TicketStatus) => {
        try {
            const ticketRef = ref(db, `tickets/${ticket.id}`);
            await update(ticketRef, { status });

            if (status === 'Closed') {
                const message = `Your support ticket #${ticket.ticketNumber} has been marked as solved.`;
                await createNotification(ticket.userId, message, 'ticket', '/support');
            } else if (status === 'Pending') {
                const message = `Your support ticket #${ticket.ticketNumber} has been updated to Pending.`;
                await createNotification(ticket.userId, message, 'ticket', '/support');
            }
            toast({ title: 'Status Updated', description: `Ticket marked as ${status}.` });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Update Failed', description: error.message || 'Failed to update ticket status.' });
        }
    };
    
    const handleDelete = async () => {
        try {
            const updates: { [key: string]: null } = {};
            for (const id of selectedIds) {
                updates[`/tickets/${id}`] = null;
            }
            await update(ref(db), updates);
            
            toast({
                title: `${selectedIds.length} Ticket(s) Deleted`,
                description: 'The selected tickets have been deleted.',
            });
            setSelectedIds([]);
        } catch (error: any) {
             toast({
                variant: 'destructive',
                title: 'Deletion Failed',
                description: error.message || 'Could not delete tickets.',
            });
        }
        setIsDeleteDialogOpen(false);
    }
    
    if (loading) {
        return <ChatHistorySkeleton />;
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-4">
                    <MessageSquare className="h-8 w-8 text-primary" />
                    <div>
                        <CardTitle>Support Tickets</CardTitle>
                        <CardDescription>Review and respond to trader support tickets.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <TooltipProvider>
                    <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
                        <div className="flex items-center gap-2 flex-1 min-w-[250px]">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by Ticket ID, user, or subject..."
                                    className="pl-9"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                             <Select value={selectedStatus || 'all'} onValueChange={(value) => setSelectedStatus(value === 'all' ? null : value as TicketStatus)}>
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="Filter by status..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    {statuses.map(status => (
                                        <SelectItem key={status} value={status}>{status}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {selectedIds.length > 0 && (
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">{selectedIds.length} selected</span>
                                <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Selected
                                </Button>
                            </div>
                        )}
                    </div>
                    {tickets.length > 0 ? (
                        <div className="overflow-x-auto">
                            <Table className="min-w-[600px]">
                                <TableHeader>
                                    <TableRow>
                                            <TableHead>
                                                <Checkbox
                                                checked={selectedIds.length > 0 && selectedIds.length === filteredTickets.length}
                                                onCheckedChange={handleToggleAll}
                                                />
                                            </TableHead>
                                        <TableHead>Ticket ID</TableHead>
                                        <TableHead>User</TableHead>
                                        <TableHead>Subject</TableHead>
                                        <TableHead>Submitted</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredTickets.map(ticket => (
                                        <TableRow key={ticket.id} data-state={selectedIds.includes(ticket.id) && "selected"}>
                                            <TableCell>
                                                <Checkbox 
                                                    checked={selectedIds.includes(ticket.id)}
                                                    onCheckedChange={(checked) => handleToggleRow(ticket.id, !!checked)}
                                                />
                                            </TableCell>
                                            <TableCell className="font-mono text-xs cursor-pointer hover:underline" onClick={() => handleTicketClick(ticket)}>{ticket.ticketNumber}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div>
                                                        <div className="font-medium whitespace-nowrap">{ticket.userDisplayName || ticket.userEmail}</div>
                                                        <div className="text-xs text-muted-foreground truncate max-w-[150px]">{ticket.userEmail}</div>
                                                    </div>
                                                        {ticket.status !== 'Closed' && ticket.userHasRead && (
                                                        <Tooltip>
                                                            <TooltipTrigger>
                                                                <Eye className="h-4 w-4 text-blue-500" />
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>User has seen your last reply.</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="max-w-[200px] truncate">{ticket.subject}</TableCell>
                                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                                {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                                            </TableCell>
                                            <TableCell>
                                                <Badge 
                                                    variant={badgeVariantMap[ticket.status]} 
                                                    className={cn(ticket.status !== 'Closed' && 'cursor-pointer')}
                                                    onClick={() => handleTicketClick(ticket)}
                                                >
                                                    {ticket.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-7 w-7">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onSelect={() => handleTicketClick(ticket)}>
                                                            View & Reply
                                                        </DropdownMenuItem>
                                                        {ticket.status !== 'Closed' && (
                                                            <DropdownMenuItem onSelect={() => handleStatusChange(ticket, 'Closed')}>
                                                                Mark as Solved
                                                            </DropdownMenuItem>
                                                        )}
                                                            {ticket.status === 'Open' && (
                                                            <DropdownMenuItem onSelect={() => handleStatusChange(ticket, 'Pending')}>
                                                                Mark as Pending
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuItem onSelect={() => {
                                                            setSelectedIds([ticket.id]);
                                                            setIsDeleteDialogOpen(true);
                                                        }} className="text-destructive">
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                            <p>No support tickets have been submitted yet.</p>
                        </div>
                    )}
                </TooltipProvider>
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
                                userDisplayName={selectedTicket.userDisplayName || selectedTicket.userEmail}
                                isAgentView={true}
                            />
                        )}
                    </DialogContent>
                </Dialog>
                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Delete {selectedIds.length} ticket(s)?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the selected tickets from the database.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardContent>
        </Card>
    )
}
