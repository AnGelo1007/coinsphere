import { NextResponse, type NextRequest } from "next/server";
import type { CandlestickData } from "@/components/trader-dashboard/trade/types";
import { getTickerData } from "@/services/crypto-service";

export const revalidate = 0; // Don't cache this route

const COINGECKO_API_BASE_URL = 'https://api.coingecko.com/api/v3';

// Maps our app's symbols to CoinGecko ID
const COIN_GECKO_IDS: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  BNB: "binancecoin",
  DOGE: "dogecoin",
  ADA: "cardano",
  LINK: "chainlink",
  USDT: "tether",
  MATIC: "matic-network",
};

// Maps our interval to what CoinGecko expects for days
function getCoinGeckoDays(interval: string) {
    if (interval.includes('m') || interval.includes('h')) return '1'; // Fetch last day for fine-grained data
    if (interval.includes('d')) {
        const d = parseInt(interval);
        if (d <= 90) return String(d);
        return '90'; // Max days for daily candles
    }
    return '1'; // Default
}

// Generates fake data as a fallback, anchored to a realistic live price
async function generateFakeCandlestickData(pair: string): Promise<CandlestickData[]> {
  const tickers = await getTickerData();
  const livePrice = tickers.find(t => t.symbol === pair)?.priceRaw || 50000;
  
  const data: CandlestickData[] = [];
  const numPoints = 100;
  const now = Math.floor(Date.now() / 1000);
  const startTime = now - numPoints * 3600; // Fake hourly data

  let lastClose = livePrice / (1 + (Math.random() - 0.5) * 0.2); 

  for (let i = 0; i < numPoints - 1; i++) {
    const time = startTime + i * 3600;
    const open = lastClose;
    const high = open * (1 + Math.random() * 0.015);
    const low = open * (1 - Math.random() * 0.015);
    const close = (high + low) / 2 + (Math.random() - 0.5) * (high - low) * 0.8;
    
    data.push({ time, open, high, low, close });
    lastClose = close;
  }
  
  // Ensure the last candle closes at the live price
  const finalTime = startTime + (numPoints - 1) * 3600;
  const finalOpen = lastClose;
  const finalHigh = Math.max(finalOpen, livePrice) * (1 + Math.random() * 0.002);
  const finalLow = Math.min(finalOpen, livePrice) * (1 - Math.random() * 0.002);

  data.push({
      time: finalTime,
      open: finalOpen,
      high: finalHigh,
      low: finalLow,
      close: livePrice
  });

  return data;
}

function generateFakeOrderBook(lastPrice: number) {
  const bids = Array.from({ length: 10 }, (_, i) => ({
    price: (lastPrice - Math.random() * 10 * (i + 1)).toFixed(2),
    size: (Math.random() * 2).toFixed(4),
  }));
  const asks = Array.from({ length: 10 }, (_, i) => ({
    price: (lastPrice + Math.random() * 10 * (i + 1)).toFixed(2),
    size: (Math.random() * 2).toFixed(4),
  }));
  return { bids, asks };
}

function generateFakeTrades(lastPrice: number) {
  return Array.from({ length: 20 }, () => {
    const price = lastPrice + (Math.random() - 0.5) * 50;
    return {
      price: price.toFixed(2),
      amount: (Math.random() * 0.5).toFixed(4),
      time: new Date(Date.now() - Math.random() * 60000).toLocaleTimeString(),
      type: Math.random() > 0.5 ? "buy" : "sell",
    };
  });
}


export async function GET(
  request: NextRequest,
  { params }: { params: { pair: string } }
) {
  const pair = params.pair.toUpperCase();
  const searchParams = request.nextUrl.searchParams;
  const interval = searchParams.get('interval') || '1d';
  
  const coinId = COIN_GECKO_IDS[pair];
  if (!coinId) {
      return NextResponse.json({ error: 'Invalid pair' }, { status: 400 });
  }

  const days = getCoinGeckoDays(interval);
  const url = `${COINGECKO_API_BASE_URL}/coins/${coinId}/ohlc?vs_currency=usd&days=${days}`;

  try {
    const [response, tickers] = await Promise.all([
        fetch(url),
        getTickerData()
    ]);
    const livePrice = tickers.find(t => t.symbol === pair)?.priceRaw || 0;

    if (!response.ok) {
        console.error(`CoinGecko API error for ${pair}:`, response.status, await response.text());
        const candlestickData = await generateFakeCandlestickData(pair);
        const lastPrice = candlestickData.length > 0 ? candlestickData[candlestickData.length - 1].close : 50000;
        return NextResponse.json({
            candlestickData,
            orderBook: generateFakeOrderBook(lastPrice),
            trades: generateFakeTrades(lastPrice),
        });
    }

    const data = await response.json();
    const candlestickData: CandlestickData[] = data.map((d: number[]) => ({
      time: d[0] / 1000,
      open: d[1],
      high: d[2],
      low: d[3],
      close: d[4],
    }));

    // Update last candle with live price to ensure alignment
    if (candlestickData.length > 0 && livePrice > 0) {
      const lastCandle = candlestickData[candlestickData.length - 1];
      lastCandle.close = livePrice;
      if (livePrice > lastCandle.high) lastCandle.high = livePrice;
      if (livePrice < lastCandle.low) lastCandle.low = livePrice;
    }

    const lastPrice = candlestickData.length > 0 ? candlestickData[candlestickData.length - 1].close : 50000;

    return NextResponse.json({
      candlestickData,
      orderBook: generateFakeOrderBook(lastPrice),
      trades: generateFakeTrades(lastPrice),
    });

  } catch (error) {
    console.error(`API route error for ${pair}:`, error);
    const candlestickData = await generateFakeCandlestickData(pair);
    const lastPrice = candlestickData.length > 0 ? candlestickData[candlestickData.length - 1].close : 50000;
    return NextResponse.json({
        candlestickData,
        orderBook: generateFakeOrderBook(lastPrice),
        trades: generateFakeTrades(lastPrice),
    });
  }
}
