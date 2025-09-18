
'use client';
import { Button } from '@/components/ui/button';
import { ArrowRight, Zap, Shield, BarChart2 } from 'lucide-react';
import Link from 'next/link';
import CryptoBackground from '@/components/crypto-background';
import { useLanguage } from '@/contexts/language-context';
import LiveMarketTable from '@/components/live-market-table';
import type { TickerData } from '@/services/crypto-service';
import { useAuth } from '@/contexts/auth-context';
import { useMarketData } from '@/contexts/market-data-context';

export default function HomePageClient({ initialMarketData }: { initialMarketData: TickerData[] }) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { marketData } = useMarketData();
  
  const features = [
    {
      icon: <Zap className="h-8 w-8 text-accent" />,
      title: t('feature1Title'),
      description: t('feature1Desc'),
    },
    {
      icon: <Shield className="h-8 w-8 text-accent" />,
      title: t('feature2Title'),
      description: t('feature2Desc'),
    },
    {
      icon: <BarChart2 className="h-8 w-8 text-accent" />,
      title: t('feature3Title'),
      description: t('feature3Desc'),
    },
  ];

  const dashboardHref = user ? '/trader-dashboard' : '/login';
  const dataForTable = marketData.length > 0 ? marketData : initialMarketData;

  return (
    <main>
      <section className="relative py-20 md:py-32 text-center overflow-hidden">
        <CryptoBackground />
        <div className="container relative z-10">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tighter">
            The Future of Digital Asset Trading is Here
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-muted-foreground mb-8">
            CoinSphere offers a secure, high-performance platform for trading cryptocurrencies. Join the revolution and trade with confidence.
          </p>
          <div className="flex flex-col md:flex-row justify-center items-center gap-4">
            <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 w-full md:w-auto" asChild>
              <Link href="/signup">
                {t('getStarted')} <ArrowRight className="ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="w-full md:w-auto" asChild>
              <Link href={dashboardHref}>{t('viewDashboard')}</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-8">{t('marketOverview')}</h2>
           <LiveMarketTable initialData={dataForTable} />
        </div>
      </section>

      <section className="py-16 bg-background">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-4">{t('whyChoose')}</h2>
          <p className="max-w-2xl mx-auto text-muted-foreground mb-12">
            {t('whyChooseSubtitle')}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-card/50 p-8 rounded-lg text-left">
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
