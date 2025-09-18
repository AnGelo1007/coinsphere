
'use client';

import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from '@/components/ui/table';
import type { Order } from './types';

interface OrderBookProps {
  bids: Order[];
  asks: Order[];
}

export function OrderBook({ bids, asks }: OrderBookProps) {
  return (
    <div className="space-y-4 h-[250px] overflow-y-auto pr-2">
      <div>
        <h4 className="text-sm font-semibold mb-2 text-red-500">Asks</h4>
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="text-xs h-8 p-1">Price (USDT)</TableHead>
                    <TableHead className="text-xs h-8 p-1 text-right">Amount (BTC)</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
            {asks.map((ask, index) => (
                <TableRow key={index} className="relative h-6">
                    <TableCell className="p-1 text-xs text-red-500">{ask.price}</TableCell>
                    <TableCell className="p-1 text-xs text-right">{ask.size}</TableCell>
                </TableRow>
            ))}
            </TableBody>
        </Table>
      </div>
      <div>
        <h4 className="text-sm font-semibold mb-2 text-green-500">Bids</h4>
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="text-xs h-8 p-1">Price (USDT)</TableHead>
                    <TableHead className="text-xs h-8 p-1 text-right">Amount (BTC)</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
            {bids.map((bid, index) => (
                <TableRow key={index} className="relative h-6">
                    <TableCell className="p-1 text-xs text-green-500">{bid.price}</TableCell>
                    <TableCell className="p-1 text-xs text-right">{bid.size}</TableCell>
                </TableRow>
            ))}
            </TableBody>
        </Table>
      </div>
    </div>
  );
}
