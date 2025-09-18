// Using a server-side only file to protect any sensitive logic or keys.
import 'server-only';

const COINGECKO_API_BASE_URL = 'https://api.coingecko.com/api/v3';

// Maps symbol to CoinGecko ID
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

const SYMBOLS = Object.keys(COIN_GECKO_IDS);

export interface TickerData {
  symbol: string;
  name: string;
  price: string;
  change: string;
  priceRaw: number;
  changeRaw: number;
  logo: string;
  marketCap?: string;
}

export interface CryptoCardData extends TickerData {
    marketCap: string;
    chartData: number[];
}

export interface NewsArticle {
    source: string;
    time: string;
    title: string;
}

async function fetchWithCache<T>(url: string, revalidate: number): Promise<T> {
    const response = await fetch(url, { 
        next: { revalidate },
        headers: { 'Accept': 'application/json' }
    });
    if (!response.ok) {
        console.error(`API call failed for ${url}: ${response.statusText}`);
        return null as T;
    }
    return response.json();
}

// Fetches ticker data for all predefined symbols from CoinGecko
export async function getTickerData(): Promise<TickerData[]> {
  try {
    const ids = Object.values(COIN_GECKO_IDS).join(',');
    const url = `${COINGECKO_API_BASE_URL}/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true`;
    const data = await fetchWithCache<any>(url, 60);

    if (!data) {
        console.warn("Could not fetch any ticker data from CoinGecko. Returning empty array.");
        return [];
    }
    
    const tickerData = SYMBOLS.map(symbol => {
        const id = COIN_GECKO_IDS[symbol];
        const ticker = data[id];
        
        if (!ticker) return null;

        const price = ticker.usd;
        const priceChangePercent = ticker.usd_24h_change || 0;
        const marketCap = ticker.usd_market_cap || 0;

        return {
            symbol: symbol,
            name: symbol.charAt(0) + symbol.slice(1).toLowerCase(), // Simple name from symbol
            price: `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`,
            change: `${priceChangePercent.toFixed(2)}%`,
            priceRaw: price,
            changeRaw: priceChangePercent,
            logo: `https://raw.githubusercontent.com/binance/crypto-icons/master/icons/png/128x128/${symbol.toLowerCase()}.png`,
            marketCap: `$${(marketCap / 1_000_000).toLocaleString('en-US', { notation: 'compact', maximumFractionDigits: 2 })}M`
        };
    }).filter((d): d is TickerData => d !== null);
    
    return tickerData;

  } catch(error) {
    console.error("Failed to fetch ticker data from CoinGecko:", error);
    return [];
  }
}

export async function getCryptoCardData(): Promise<CryptoCardData[]> {
    try {
        const tickers = await getTickerData();

        const cardDataPromises = tickers.map(async (ticker) => {
            const coinId = COIN_GECKO_IDS[ticker.symbol];
            if (!coinId || ticker.symbol === 'USDT') {
                 return {
                    ...ticker,
                    marketCap: ticker.marketCap || '$0B',
                    chartData: [],
                };
            }
            // Fetch historical data for the sparkline chart
            const chartDataResponse = await fetchWithCache<any>(
                `${COINGECKO_API_BASE_URL}/coins/${coinId}/market_chart?vs_currency=usd&days=1&interval=hourly`,
                3600 // Cache for 1 hour
            );
            
            const chartData = chartDataResponse ? chartDataResponse.prices.map((p: number[]) => p[1]) : [];
            
            return {
                ...ticker,
                chartData,
            };
        });

        return Promise.all(cardDataPromises);
    } catch (error) {
        console.error("Failed to fetch crypto card data:", error);
        return [];
    }
}

export async function getNewsFeed(): Promise<NewsArticle[]> {
  // Mock data as CoinGecko news endpoint is not public
  return [
      { source: 'CoinDesk', time: '1h ago', title: 'Bitcoin ETF Inflows Reach Record Highs Amid Market Optimism' },
      { source: 'CoinTelegraph', time: '2h ago', title: 'Ethereum\'s Dencun Upgrade Proves Successful, Layer 2 Fees Plummet' },
      { source: 'The Block', time: '3h ago', title: 'SEC Delays Decision on Spot Ether ETFs, Citing Market Concerns' },
      { source: 'Decrypt', time: '5h ago', title: 'Solana Mobile Chapter 2 Preorders Surpass 100,000 Units' },
  ];
}

export async function getCurrencyRates() {
    // This is a free, but limited, currency API. Good for demonstration.
    try {
        const data = await fetchWithCache<any>('https://api.exchangerate-api.com/v4/latest/USD', 3600); // Cache for 1 hour
        if (!data || !data.rates) return [];
        const rates = data.rates;
        return [
            { pair: 'EUR/USD', rate: (1 / rates.USD * rates.EUR).toFixed(4) },
            { pair: 'USD/JPY', rate: rates.JPY.toFixed(4) },
            { pair: 'GBP/USD', rate: (1 / rates.USD * rates.GBP).toFixed(4) },
            { pair: 'USD/CHF', rate: rates.CHF.toFixed(4) },
        ];
    } catch(error) {
        console.error("Failed to fetch currency rates:", error);
        return [];
    }
}
