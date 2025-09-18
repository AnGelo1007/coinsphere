
'use client';

import { useLanguage } from '@/contexts/language-context';

export default function VisionPage() {
  const { t } = useLanguage();
  return (
    <div className="container max-w-4xl py-12">
      <article className="prose dark:prose-invert max-w-none">
        <h1>{t('visionPageTitle')}</h1>
        <p className="text-xl text-muted-foreground">{t('visionPageSubtitle')}</p>
        <h2>{t('visionDecentralizedTitle')}</h2>
        <p>{t('visionDecentralizedText')}</p>
        <h2>{t('visionPillarsTitle')}</h2>
        <ol>
          <li>
            <strong>{t('visionPillar1Title')}</strong>
            {t('visionPillar1Text')}
          </li>
          <li>
            <strong>{t('visionPillar2Title')}</strong>
            {t('visionPillar2Text')}
          </li>
          <li>
            <strong>{t('visionPillar3Title')}</strong>
            {t('visionPillar3Text')}
          </li>
          <li>
            <strong>{t('visionPillar4Title')}</strong>
            {t('visionPillar4Text')}
          </li>
        </ol>
        <h2>{t('visionRoadAheadTitle')}</h2>
        <p>{t('visionRoadAheadText')}</p>
      </article>
    </div>
  );
}
