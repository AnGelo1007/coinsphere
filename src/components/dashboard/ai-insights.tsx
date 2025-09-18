'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getMarketInsightsAction } from '@/lib/actions';
import type { MarketInsightsOutput } from '@/ai/flows/ai-market-insights';
import { useToast } from '@/hooks/use-toast';
import { Wand2, Zap, AlertTriangle, TrendingUp, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import type { NewsArticle, TickerData } from '@/services/crypto-service';

type AiInsightsProps = {
    initialNewsData: NewsArticle[];
    initialMarketData: TickerData[];
};

export default function AiInsights({ initialNewsData, initialMarketData }: AiInsightsProps) {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<MarketInsightsOutput | null>(null);
  const { toast } = useToast();

  const handleGenerateInsights = async () => {
    setLoading(true);
    setInsights(null);

    const newsFeed = initialNewsData.map((news) => news.title).join('\n');
    const marketData = initialMarketData
      .map((data) => `${data.name} (${data.symbol}): ${data.price} (24h Change: ${data.change})`)
      .join('\n');

    const result = await getMarketInsightsAction({ newsFeed, marketData });
    setLoading(false);

    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'Error generating insights',
        description: result.error,
      });
    } else {
      setInsights(result.data!);
    }
  };

  return (
    <Card className="bg-card/50">
      <CardHeader>
        <div className="flex items-center justify-between">
            <div className='flex items-center gap-2'>
                <Wand2 className="h-6 w-6 text-primary" />
                <div>
                    <CardTitle>AI Market Insights</CardTitle>
                    <CardDescription>GenAI-powered market analysis</CardDescription>
                </div>
            </div>
            <Button onClick={handleGenerateInsights} disabled={loading}>
            {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <Wand2 className="mr-2 h-4 w-4" />
            )}
            Generate
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="flex flex-col items-center justify-center p-8 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Analyzing market data...</p>
          </div>
        )}
        {insights ? (
          <div className="space-y-6">
            <div>
              <h3 className="flex items-center font-semibold mb-2">
                <TrendingUp className="h-5 w-5 mr-2 text-primary" />
                Summary
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{insights.summary}</p>
            </div>
            <Separator />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h3 className="flex items-center font-semibold mb-2">
                        <Zap className="h-5 w-5 mr-2 text-green-500" />
                        Opportunities
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{insights.opportunities}</p>
                </div>
                 <div>
                    <h3 className="flex items-center font-semibold mb-2">
                        <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
                        Risks
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{insights.risks}</p>
                </div>
            </div>
          </div>
        ) : !loading && (
            <div className="text-center text-muted-foreground p-8">
                Click "Generate" to get AI-powered insights on the current market.
            </div>
        )}
      </CardContent>
    </Card>
  );
}
