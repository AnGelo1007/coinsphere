
"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { translations, type LanguageCode, type TranslationKey, languageLocales } from '@/lib/translations';

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
  t: (key: TranslationKey) => string;
  formatCurrency: (value: number) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<LanguageCode>('en');

  const t = useCallback((key: TranslationKey): string => {
    return translations[language][key] || translations['en'][key];
  }, [language]);

  const formatCurrency = useCallback((value: number): string => {
    const locale = languageLocales[language] || 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }, [language]);
  
  const value = useMemo(() => ({
    language,
    setLanguage,
    t,
    formatCurrency
  }), [language, t, formatCurrency]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
