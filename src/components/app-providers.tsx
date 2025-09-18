
'use client';

import type { ReactNode } from 'react';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { LanguageProvider } from '@/contexts/language-context';
import { AuthProvider } from '@/contexts/auth-context';
import { MarketDataProvider } from '@/contexts/market-data-context';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark">
      <AuthProvider>
        <LanguageProvider>
          <MarketDataProvider>
            {children}
            <Toaster />
          </MarketDataProvider>
        </LanguageProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
