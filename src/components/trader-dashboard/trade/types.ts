import type { CandlestickData as LightweightCandlestickData } from 'lightweight-charts';

// Re-exporting for consistency and clarity
export type CandlestickData = LightweightCandlestickData;


export interface Order {
  price: string;
  size: string;
}

export interface Trade {
    price: string;
    amount: string;
    time: string;
    type: 'buy' | 'sell';
}

export type OrderType = 'Buy Up' | 'Buy Down';
export type OrderStatus = 'Pending' | 'Now Processing' | 'Completed' | 'Failed';


export interface TickerData {
  symbol: string;
  name: string;
  price: string;
  change: string;
  priceRaw: number;
  changeRaw: number;
  logo: string;
  marketCap?: string; // Optional because it's added later for the homepage
}

export interface OrderHistoryItem {
  id: string;
  pair: string;
  type: OrderType;
  price: number;
  amount: number; // amount of non-USDT asset used in trade, can be 0 for USDT trades
  asset: string; // the asset used for the trade
  total: number; // total value in USDT
  date: number; // Storing as timestamp for easier sorting/filtering
  status: OrderStatus;
  userId: string;
  userEmail?: string; // Optional, to be populated for admin view
  timeframe: string;
  profitRate: number;
  expiresAt: number;
  reminded?: boolean;
  transactionId?: string;
}
