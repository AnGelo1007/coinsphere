
'use client';
import Link from 'next/link';
import { Logo } from './logo';
import { useLanguage } from '@/contexts/language-context';

export default function Footer() {
  const { t } = useLanguage();

  const footerLinks = [
    {
      title: t('products'),
      links: [
        { label: t('exchange'), href: '/exchange' },
      ],
    },
    {
      title: t('company'),
      links: [{ label: t('aboutUs'), href: '/about' }],
    },
    {
      title: t('support'),
      links: [
        { label: t('contactUs'), href: '/support' },
        { label: t('faq'), href: '/support' },
        { label: t('fees'), href: '/fees' },
      ],
    },
    {
      title: t('legal'),
      links: [
        { label: t('termsOfService'), href: '/legal' },
        { label: t('privacyPolicy'), href: '/legal' },
        { label: t('cookiePolicy'), href: '/legal' },
      ],
    },
  ];

  return (
    <footer className="border-t border-border bg-background text-foreground relative z-40">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <Logo />
              <span className="font-bold text-lg">CoinSphere</span>
            </Link>
            <p className="text-muted-foreground max-w-xs">
              {t('footerDescription')}
            </p>
          </div>
          {footerLinks.map((section) => (
            <div key={section.title}>
              <h4 className="font-semibold mb-4">{section.title}</h4>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-muted-foreground hover:text-foreground transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 pt-8 border-t border-border flex justify-between items-center text-sm text-muted-foreground">
          <p>Â© 2024 CoinSphere. All rights reserved.</p>
          {/* Social links can go here */}
        </div>
      </div>
    </footer>
  );
}
