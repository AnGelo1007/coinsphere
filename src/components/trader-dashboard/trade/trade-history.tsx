
'use client';
import { Table, TableBody, TableCell, TableRow, TableHeader, TableHead } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { Trade } from './types';

interface TradeHistoryProps {
  trades: Trade[];
}

export function TradeHistory({ trades }: TradeHistoryProps) {
  return (
    <div className="h-[250px] overflow-y-auto pr-2">
       <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="text-xs h-8 p-1">Time</TableHead>
                    <TableHead className="text-xs h-8 p-1">Price</TableHead>
                    <TableHead className="text-xs h-8 p-1 text-right">Amount</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
            {trades.map((trade, index) => (
                <TableRow key={index}>
                <TableCell className="p-1 text-xs">{trade.time}</TableCell>
                <TableCell className={cn("p-1 text-xs", trade.type === 'buy' ? 'text-green-500' : 'text-red-500')}>
                    {trade.price}
                </TableCell>
                <TableCell className="p-1 text-xs text-right">{trade.amount}</TableCell>
                </TableRow>
            ))}
            </TableBody>
        </Table>
    </div>
  );
}
