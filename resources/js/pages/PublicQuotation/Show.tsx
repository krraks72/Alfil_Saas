import React, { useState } from 'react';
import { usePage, Head } from '@inertiajs/react';
import { CheckCircle, XCircle, Printer } from 'lucide-react';
import { toast } from '@/components/custom-toast';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { NewYork, Toronto, Rio, London, Istanbul, Mumbai, HongKong, Tokyo, Sydney, Paris } from '@/components/quotation-templates';
import '../../../css/print.css';
import { useFavicon } from '@/hooks/use-favicon';

export default function PublicQuotationShow() {
  const { t } = useTranslation();
  const { quotation, settings, auth, companyCurrencySettings } = usePage().props as any;
  const [processing, setProcessing] = useState(false);

  const formatAmount = (amount: number): string => {
    const cs = companyCurrencySettings;
    if (!cs) return window.appSettings.formatCurrency(amount || 0);
    const decimals = parseInt(cs.decimalFormat) || 2;
    const thousands = cs.thousandsSeparator ?? ',';
    const space = cs.symbolSpace ? ' ' : '';
    const symbol = cs.symbol || '$';
    const formatted = Number(amount || 0)
      .toFixed(decimals)
      .replace(/\B(?=(\d{3})+(?!\d))/g, thousands);
    return cs.symbolPosition === 'after'
      ? `${formatted}${space}${symbol}`
      : `${symbol}${space}${formatted}`;
  };

  const formatDate = (date: any): string => {
    if (!date) return '';
    try {
      return window.appSettings.formatDateTime(date, false);
    } catch {
      return new Date(date).toLocaleDateString();
    }
  };

  const replaceVariables = (text: string) => {
    if (!text) return '';
    return text
      .replace(/\{quotation_number\}/g, quotation.quotation_number || '')
      .replace(/\{customer_name\}/g, quotation.customer?.name || '')
      .replace(/\{quotation_date\}/g, formatDate(quotation.quotation_date))
      .replace(/\{valid_until\}/g, formatDate(quotation.valid_until))
      .replace(/\{total_amount\}/g, formatAmount(quotation.total_amount || 0))
      .replace(/\{branch_name\}/g, quotation.branch?.name || '')
      .replace(/\{company_name\}/g, auth?.user?.company_name || auth?.user?.name || '');
  };

  const safeSettings = settings || {};
  const quotationTemplate = safeSettings.quotation_invoice_template || 'new_york';
  const quotationColor = safeSettings.quotation_invoice_color || '#10b77f';
  const showQr = safeSettings.quotation_invoice_qr_display === 'true' || safeSettings.quotation_invoice_qr_display === true;
  const footerTitle = replaceVariables(safeSettings.quotation_invoice_footer_title || '');
  const footerNotes = replaceVariables(safeSettings.quotation_invoice_footer_notes || '');
useFavicon();
  const handleApprove = async () => {
    setProcessing(true);
    try {
      const response = await fetch(`/quotations/public/${quotation.id}/approve${window.location.search}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
        }
      });

      const data = await response.json();
      if (response.ok) {
        toast.success(data.message);
        window.location.reload();
      } else {

        toast.error(data.message);
      }
    } catch (error) {

      toast.error(t('Network error occurred'));
    }
    setProcessing(false);
  };

  const handleReject = async () => {
    setProcessing(true);
    try {
      const response = await fetch(`/quotations/public/${quotation.id}/reject${window.location.search}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
        }
      });

      const data = await response.json();
      if (response.ok) {
        toast.success(data.message);
        window.location.reload();
      } else {

        toast.error(data.message);
      }
    } catch (error) {

      toast.error(t('Network error occurred'));
    }
    setProcessing(false);
  };

  const templateMap: Record<string, React.ComponentType<any>> = {
    new_york: NewYork,
    'new-york': NewYork,
    newyork: NewYork,
    toronto: Toronto,
    rio: Rio,
    london: London,
    istanbul: Istanbul,
    mumbai: Mumbai,
    hong_kong: HongKong,
    'hong-kong': HongKong,
    hongkong: HongKong,
    tokyo: Tokyo,
    sydney: Sydney,
    paris: Paris,
  };

  const normalizedTemplate = quotationTemplate?.toLowerCase().replace(/[_\s-]/g, '');
  let TemplateComponent = templateMap[quotationTemplate] || templateMap[normalizedTemplate];

  if (!TemplateComponent) {
    const templateKey = Object.keys(templateMap).find(key =>
      key.toLowerCase().replace(/[_\s-]/g, '') === normalizedTemplate
    );
    TemplateComponent = templateKey ? templateMap[templateKey] : NewYork;
  }

  return (
    <>
      <Head>
        <link rel="icon" href="/favicon.png" type="image/x-icon" />
        <title>{`Quotation ${quotation.quotation_number}`}</title>
      </Head>
      <div className="min-h-screen bg-gray-50 py-8">
        <style>{`
          @media print {
              * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
              nav, .breadcrumb, .page-actions, button, .no-print { display: none !important; }
              [data-slot="sidebar"], [data-sidebar="sidebar"], aside, header { display: none !important; }
              main { margin: 0 !important; }
              @page { margin: 0.5in; size: A4; }
              
              /* Force quotation template responsive grids to keep their layout in print */
              .max-w-4xl [class*="md:grid-cols-2"] {
                  display: grid;
                  grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
              }
              .max-w-4xl [class*="lg:grid-cols-2"] {
                  display: grid;
                  grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
              }
              .max-w-4xl [class*="lg:grid-cols-3"] {
                  display: grid;
                  grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
              }
              .max-w-4xl [class*="lg:col-span-1"] {
                  grid-column: span 1 / span 1 !important;
              }
              .max-w-4xl [class*="lg:col-span-2"] {
                  grid-column: span 2 / span 2 !important;
              }
              .max-w-4xl [class*=" col-span-2"], .max-w-4xl [class^="col-span-2"] {
                  grid-column: span 2 / span 2 !important;
              }
              .max-w-4xl [class*="grid-cols-3"]:not([class*="md:grid-cols"]):not([class*="lg:grid-cols"]) {
                  display: grid;
                  grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
              }
          }
      `}</style>
      <div className="max-w-5xl mx-auto px-4">
        <div className="print:hidden mb-4 flex justify-end gap-2">
          <Button onClick={() => window.print()} variant="outline">
            <Printer className="h-4 w-4 mr-2" />
            {t('Print')}
          </Button>
        </div>

        <div className="print:max-w-full print:mx-0">
          <div className="print:shadow-none print:border-0 print:m-0">
            <TemplateComponent
              quotation={quotation}
              color={quotationColor}
              showQr={showQr}
              quotationUrl={window.location.href}
              footerTitle={footerTitle}
              footerNotes={footerNotes}
              formatAmount={(amount: number) => formatAmount(amount)}
              formatDate={(date: any) => formatDate(date)}
              t={t}
            />
          </div>
        </div>

        {quotation.status !== 'sent' && (
          <div className="text-center text-gray-600 mt-6 print:hidden">
            {t('This quotation has already been')} {t(quotation.status)}.
          </div>
        )}
      </div>
      </div>
    </>
  );
}
