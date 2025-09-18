
import { TradePageClient } from '@/components/trader-dashboard/trade/trade-page-client';
import { getTickerData } from '@/services/crypto-service';

export default async function TradePage() {
  const initialMarketData = await getTickerData();
  return <TradePageClient initialMarketData={initialMarketData} />;
}
