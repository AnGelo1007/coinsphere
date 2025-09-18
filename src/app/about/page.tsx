
'use client';

import { useLanguage } from '@/contexts/language-context';

export default function AboutPage() {
  const { t } = useLanguage();
  return (
    <div className="container max-w-4xl py-12">
      <article className="prose dark:prose-invert max-w-none">
        <h1>{t('aboutPageTitle')}</h1>
        <p className="text-xl text-muted-foreground">{t('aboutPageSubtitle')}</p>
        <h2>{t('aboutOurMission')}</h2>
        <p>{t('aboutOurMissionText')}</p>
        <h2>{t('aboutWhatWeOffer')}</h2>
        <ul>
          <li>
            <strong>{t('aboutOffer1Title')}</strong>
            {t('aboutOffer1Text')}
          </li>
          <li>
            <strong>{t('aboutOffer2Title')}</strong>
            {t('aboutOffer2Text')}
            <ul>
              <li>
                <strong>{t('aboutOffer2Sub1Title')}</strong>
                {t('aboutOffer2Sub1Text')}
              </li>
              <li>
                <strong>{t('aboutOffer2Sub3Title')}</strong>
                {t('aboutOffer2Sub3Text')}
              </li>
              <li>
                <strong>{t('aboutOffer2Sub4Title')}</strong>
                {t('aboutOffer2Sub4Text')}
              </li>
            </ul>
          </li>
          <li>
            <strong>{t('aboutOffer3Title')}</strong>
            {t('aboutOffer3Text')}
          </li>
          <li>
            <strong>{t('aboutOffer4Title')}</strong>
            {t('aboutOffer4Text')}
          </li>
        </ul>
        <h2>{t('aboutJoinUs')}</h2>
        <p>{t('aboutJoinUsText')}</p>
      </article>
    </div>
  );
}
