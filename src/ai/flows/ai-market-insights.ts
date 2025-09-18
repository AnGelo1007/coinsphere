'use server';

/**
 * @fileOverview AI-powered market insights flow.
 *
 * - getMarketInsights - A function that retrieves AI-generated summaries of market trends.
 * - MarketInsightsInput - The input type for the getMarketInsights function.
 * - MarketInsightsOutput - The return type for the getMarketInsights function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MarketInsightsInputSchema = z.object({
  newsFeed: z.string().describe('A summary of recent news articles.'),
  marketData: z.string().describe('A summary of current market data.'),
});
export type MarketInsightsInput = z.infer<typeof MarketInsightsInputSchema>;

const MarketInsightsOutputSchema = z.object({
  summary: z.string().describe('A summarized insight and analysis of current market trends.'),
  opportunities: z.string().describe('Potential opportunities in the market.'),
  risks: z.string().describe('Potential risks in the market.'),
});
export type MarketInsightsOutput = z.infer<typeof MarketInsightsOutputSchema>;

export async function getMarketInsights(input: MarketInsightsInput): Promise<MarketInsightsOutput> {
  return marketInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'marketInsightsPrompt',
  input: {schema: MarketInsightsInputSchema},
  output: {schema: MarketInsightsOutputSchema},
  prompt: `You are an AI assistant that analyzes market trends and provides insights.

  Based on the following news feed:
  {{newsFeed}}

  And the following market data:
  {{marketData}}

  Provide a summary of the current market trends, potential opportunities, and potential risks.
  Be concise and to the point.

  Format your output as a JSON object:
  {
    "summary": "",
    "opportunities": "",
    "risks": ""
  }`,
});

const marketInsightsFlow = ai.defineFlow(
  {
    name: 'marketInsightsFlow',
    inputSchema: MarketInsightsInputSchema,
    outputSchema: MarketInsightsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
