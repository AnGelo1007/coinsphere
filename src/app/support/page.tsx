
'use client';

import { SupportTicketForm } from '@/components/support/support-ticket-form';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { TraderTicketHistory } from '@/components/support/trader-ticket-history';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';

export default function SupportPage() {
  const { user } = useAuth();
  const { t } = useLanguage();

  return (
    <div className="container max-w-4xl py-12">
      <div className="grid grid-cols-1 gap-12">
        {user && (
          <Card>
            <CardHeader>
              <CardTitle>{t('mySupportTickets')}</CardTitle>
              <CardDescription>{t('mySupportTicketsDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <TraderTicketHistory />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>{t('submitSupportTicket')}</CardTitle>
            <CardDescription>{t('submitSupportTicketDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <SupportTicketForm />
          </CardContent>
        </Card>

        <div>
          <h2 className="text-2xl font-bold text-center mb-4">{t('faq')}</h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>{t('faq1Title')}</AccordionTrigger>
              <AccordionContent>{t('faq1Desc')}</AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>{t('faq2Title')}</AccordionTrigger>
              <AccordionContent>{t('faq2Desc')}</AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>{t('faq3Title')}</AccordionTrigger>
              <AccordionContent>{t('faq3Desc')}</AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4">
              <AccordionTrigger>{t('faq4Title')}</AccordionTrigger>
              <AccordionContent>{t('faq4Desc')}</AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </div>
  );
}
