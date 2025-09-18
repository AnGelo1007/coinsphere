'use server';

/**
 * @fileOverview AI-powered price prediction flow.
 *
 * - predictPrice - A function that predicts future cryptocurrency prices.
 * - PricePredictionInput - The input type for the predictPrice function.
 * - PricePredictionOutput - The return type for the predictPrice function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const PricePredictionInputSchema = z.object({
  history: z.array(z.number()).describe('A series of historical price points.'),
});
export type PricePredictionInput = z.infer<typeof PricePredictionInputSchema>;

const PricePredictionOutputSchema = z.object({
  predictions: z.array(z.number()).describe('The next 5 predicted price points.'),
});
export type PricePredictionOutput = z.infer<typeof PricePredictionOutputSchema>;


export async function predictPrice(input: PricePredictionInput): Promise<PricePredictionOutput> {
  return predictPriceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'pricePredictionPrompt',
  input: { schema: PricePredictionInputSchema },
  output: { schema: PricePredictionOutputSchema },
  prompt: `You are a quantitative financial analyst. Based on the following historical price data, predict the next 5 price points.
  Provide only the predicted numbers in a JSON array format. Do not provide any explanation or commentary.
  
  Historical Data:
  {{{history}}}
  `,
});

const predictPriceFlow = ai.defineFlow(
  {
    name: 'predictPriceFlow',
    inputSchema: PricePredictionInputSchema,
    outputSchema: PricePredictionOutputSchema,
  },
  async (input) => {
    // Ensure we don't send too much data to the model
    const recentHistory = input.history.slice(-50);
    
    const { output } = await prompt({ history: recentHistory });
    
    // Basic validation to ensure the model returns an array of 5 numbers
    if (output?.predictions && Array.isArray(output.predictions) && output.predictions.length === 5) {
      return output;
    }

    // Fallback in case of invalid model output
    const lastPrice = input.history[input.history.length - 1] || 0;
    return {
      predictions: Array(5).fill(lastPrice),
    };
  }
);
