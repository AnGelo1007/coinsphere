
'use client';

import { useLanguage } from '@/contexts/language-context';

export default function FeesPage() {
  const { t } = useLanguage();
  return (
    <div className="container max-w-4xl py-12">
      <article className="prose dark:prose-invert max-w-none">
        <h1>CoinSphere – Fees</h1>
        <p className="lead text-xl text-muted-foreground">The Exchange Where You Keep What You Earn.</p>
        
        <h2>1. Deposits & Withdrawals</h2>
        <p><strong>Absolutely Free</strong> – Whether you're depositing, withdrawing, or transferring the same asset, CoinSphere charges no fees.</p>
        <p>Only standard blockchain network fees (miner/gas fees) may apply when moving funds on-chain. These are not collected by CoinSphere.</p>

        <h2>2. Trading</h2>
        <p><strong>Zero Trading Fees</strong> – Profit from market movements without paying any fees. Simply select a crypto pair, choose a timeframe, and predict whether the price will go up or down to earn a profit.</p>
        <p>No maker/taker charges. No hidden costs.</p>
        
        <h2>3. Why Zero Fees?</h2>
        <p>At CoinSphere, we believe every trader deserves a fair and transparent trading experience. By removing deposit, withdrawal, and trading fees, we give you 100% of your profit – unlike other exchanges that eat into your earnings.</p>
      </article>
    </div>
  );
}
