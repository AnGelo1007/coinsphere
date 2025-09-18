
'use client';

import { useLanguage } from '@/contexts/language-context';

export default function ExchangePage() {
  const { t } = useLanguage();
  return (
    <div className="container max-w-4xl py-12">
      <article className="prose dark:prose-invert max-w-none">
        <h1>{t('exchangePageTitle')}</h1>
        <h2>{t('exchangeOverview')}</h2>
        <p>{t('exchangeOverviewText')}</p>
        <h2>{t('exchangeKeyFeatures')}</h2>
        <ul>
          <li>
            <strong>{t('exchangeFeature1Title')}</strong>
            {t('exchangeFeature1Text')}
          </li>
          <li>
            <strong>{t('exchangeFeature3Title')}</strong>
            {t('exchangeFeature3Text')}
          </li>
          <li>
            <strong>{t('exchangeFeature4Title')}</strong>
            {t('exchangeFeature4Text')}
          </li>
          <li>
            <strong>{t('exchangeFeature5Title')}</strong>
            {t('exchangeFeature5Text')}
          </li>
          <li>
            <strong>{t('exchangeFeature7Title')}</strong>
            {t('exchangeFeature7Text')}
          </li>
        </ul>
        <h2>{t('exchangeWhyStandOut')}</h2>
        <ul>
          <li>
            <strong>{t('exchangeStandOut1Title')}</strong>
            {t('exchangeStandOut1Text')}
          </li>
          <li>
            <strong>{t('exchangeStandOut2Title')}</strong>
            {t('exchangeStandOut2Text')}
          </li>
          <li>
            <strong>{t('exchangeStandOut3Title')}</strong>
            {t('exchangeStandOut3Text')}
          </li>
        </ul>
      </article>
    </div>
  );
}
