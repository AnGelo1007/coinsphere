
'use client';

import type { ReactNode } from 'react';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/contexts/language-context';
import { Button } from './ui/button';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

function CallToAction() {
    const { t } = useLanguage();
    return (
        <div className="bg-card text-card-foreground">
            <div className="container py-16">
                <div className="text-center border-t border-border pt-16">
                <h2 className="text-3xl font-bold mb-4">{t('readyToStart')}</h2>
                <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                    {t('readyToStartSubtitle')}
                </p>
                <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90" asChild>
                    <Link href="/signup">
                    {t('signUpNow')} <ArrowRight className="ml-2" />
                    </Link>
                </Button>
                </div>
            </div>
        </div>
    );
}

export function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const showCallToAction = pathname === '/';

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 flex flex-col">{children}</main>
      {showCallToAction && <CallToAction />}
      <Footer />
    </div>
  );
}
