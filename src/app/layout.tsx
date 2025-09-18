
import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { AppProviders } from '@/components/app-providers';
import Script from 'next/script';
import { AppLayout } from '@/components/app-layout';
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});


export const metadata: Metadata = {
  title: 'CoinSphere',
  description: 'Your window into the crypto market.',
};

declare global {
  interface Window {
    Tally: any;
    tallyLoaded: boolean;
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className={cn('font-body antialiased')} suppressHydrationWarning>
        <AppProviders>
          <AppLayout>{children}</AppLayout>
        </AppProviders>
        <Script
          src="https://tally.so/widgets/embed.js"
          strategy="lazyOnload"
          data-tally-loaded-callback="tallyLoadedCallback"
        />
      </body>
    </html>
  );
}
