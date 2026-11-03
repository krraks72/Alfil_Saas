import { PageTemplate } from '@/components/page-template';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { type NavItem } from '@/types';
import { useEffect, useRef, useState } from 'react';
import { Settings as SettingsIcon, Building, DollarSign, Users, RefreshCw, Palette, BookOpen, Award, FileText, Mail, Bell, Link2, CreditCard, Calendar, HardDrive, Shield, Bot, Cookie, Search, Webhook, Wallet, MessageSquare, X, Plus, Layout } from 'lucide-react';
import { Slack } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import SystemSettings from './components/system-settings';
import { usePage } from '@inertiajs/react';
import { useLayout } from '@/contexts/LayoutContext';

import CurrencySettings from './components/currency-settings';

import BrandSettings from './components/brand-settings';
import EmailSettings from './components/email-settings';
import EmailNotificationSettings from './components/email-notification-settings';
import SlackSettings from './components/slack-settings';
import TwilioSettings from './components/twilio-settings';
import WebhookSettings from './components/webhook-settings';

import CompanySettings from './components/company-settings';
import PaymentSettings from './components/payment-settings';
import StorageSettings from './components/storage-settings';
import RecaptchaSettings from './components/recaptcha-settings';
import ChatGptSettings from './components/chatgpt-settings';
import CookieSettings from './components/cookie-settings';

import SeoSettings from './components/seo-settings';
import CacheSettings from './components/cache-settings';
import GoogleCalendarSettings from './components/google-calendar-settings';
import QuotationInvoiceSettings from './components/quotation-invoice-settings';
import AliaddoSettings from './components/aliaddo-settings';

import { Toaster } from '@/components/ui/toaster';
import { useTranslation } from 'react-i18next';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Settings() {
  const { t } = useTranslation();
  const { systemSettings = {}, cacheSize = '0.00', timezones = {}, dateFormats = {}, timeFormats = {}, paymentSettings = {}, webhooks = [], auth = {}, aliaddoSettings = {} } = usePage().props as any;
  const [activeSection, setActiveSection] = useState('system-settings');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { position } = useLayout();
  const isCompanyUser = auth.user?.type === 'company';
  const isSuperAdmin = ['superadmin', 'super admin'].includes(auth.user?.type);
  const hasSettingsPermission = (permission: string) => auth.permissions?.includes(permission) ?? false;

  // Define all possible sidebar navigation items
  const allSidebarNavItems: (NavItem & { permission?: string })[] = [
    {
      title: t('System Settings'),
      href: '#system-settings',
      icon: <SettingsIcon className="h-4 w-4 mr-2" />,
      permission: 'manage-system-settings'
    },
    {
      title: t('Brand Settings'),
      href: '#brand-settings',
      icon: <Palette className="h-4 w-4 mr-2" />,
      permission: 'manage-brand-settings'
    },
    {
      title: t('Currency Settings'),
      href: '#currency-settings',
      icon: <DollarSign className="h-4 w-4 mr-2" />,
      permission: 'manage-currency-settings'
    },
    {
      title: t('Email Settings'),
      href: '#email-settings',
      icon: <Mail className="h-4 w-4 mr-2" />,
      permission: 'manage-email-settings'
    },
    {
      title: t('Email Notification Settings'),
      href: '#email-notification-settings',
      icon: <Bell className="h-4 w-4 mr-2" />,
      permission: 'manage-email-notification-settings'
    },
    {
      title: t('Slack Settings'),
      href: '#slack-settings',
      icon: <Slack className="h-4 w-4 mr-2" />,
      permission: 'manage-slack-settings'
    },

    {
      title: t('Twilio SMS Settings'),
      href: '#twilio-settings',
      icon: <MessageSquare className="h-4 w-4 mr-2" />,
      permission: 'manage-twilio-settings'
    },
    {
      title: t('Webhook Settings'),
      href: '#webhook-settings',
      icon: <Webhook className="h-4 w-4 mr-2" />,
      permission: 'manage-webhook-settings'
    },

    {
      title: t('Company Settings'),
      href: '#company-settings',
      icon: <Building className="h-4 w-4 mr-2" />,
      permission: 'manage-company-settings'
    },
    {
      title: t('Payment Settings'),
      href: '#payment-settings',
      icon: <CreditCard className="h-4 w-4 mr-2" />,
      permission: 'manage-payment-settings'
    },
    {
      title: t('Storage Settings'),
      href: '#storage-settings',
      icon: <HardDrive className="h-4 w-4 mr-2" />,
      permission: 'manage-storage-settings'
    },
    {
      title: t('ReCaptcha Settings'),
      href: '#recaptcha-settings',
      icon: <Shield className="h-4 w-4 mr-2" />,
      permission: 'manage-recaptcha-settings'
    },
    {
      title: t('Chat GPT Settings'),
      href: '#chatgpt-settings',
      icon: <Bot className="h-4 w-4 mr-2" />,
      permission: 'manage-chatgpt-settings'
    },
    {
      title: t('Cookie Settings'),
      href: '#cookie-settings',
      icon: <Cookie className="h-4 w-4 mr-2" />,
      permission: 'manage-cookie-settings'
    },

    {
      title: t('SEO Settings'),
      href: '#seo-settings',
      icon: <Search className="h-4 w-4 mr-2" />,
      permission: 'manage-seo-settings'
    },
    {
      title: t('Cache Settings'),
      href: '#cache-settings',
      icon: <HardDrive className="h-4 w-4 mr-2" />,
      permission: 'manage-cache-settings'
    },
    {
      title: t('Google Calendar Settings'),
      href: '#google-calendar-settings',
      icon: <Calendar className="h-4 w-4 mr-2" />,
      permission: 'manage-google-calendar-settings'
    },
    // {
    //   title: t('Sales Invoice Settings'),
    //   href: '#sales-invoice-settings',
    //   icon: <FileText className="h-4 w-4 mr-2" />
    // },
    {
      title: t('Quotation Settings'),
      href: '#quotation-invoice-settings',
      icon: <FileText className="h-4 w-4 mr-2" />,
      permission: 'manage-quotation-invoice-settings'
    },
    {
      title: t('Electronic Invoicing (Aliaddo)'),
      href: '#aliaddo-settings',
      icon: <FileText className="h-4 w-4 mr-2" />,
      permission: 'manage-aliaddo-settings'
    },


  ];


  const companyOnlySettings = new Set([
    '#company-settings',
    '#email-notification-settings',
    '#slack-settings',
    '#twilio-settings',
    '#webhook-settings',
    '#google-calendar-settings',
    '#quotation-invoice-settings',
    '#aliaddo-settings',
  ]);
  const superAdminOnlySettings = new Set([
    '#storage-settings',
    '#recaptcha-settings',
    '#chatgpt-settings',
    '#cookie-settings',
    '#seo-settings',
    '#cache-settings',
  ]);

  const sidebarNavItems = allSidebarNavItems.filter(item => {
    if (!item.permission || !hasSettingsPermission(item.permission)) return false;
    if (companyOnlySettings.has(item.href ?? '')) return isCompanyUser;
    if (superAdminOnlySettings.has(item.href ?? '')) return isSuperAdmin;
    return true;
  });
  const hasVisibleSettings = sidebarNavItems.length > 0;

  // Refs for each section
  const systemSettingsRef = useRef<HTMLDivElement>(null);
  const brandSettingsRef = useRef<HTMLDivElement>(null);

  const currencySettingsRef = useRef<HTMLDivElement>(null);
  const emailSettingsRef = useRef<HTMLDivElement>(null);
  const emailNotificationSettingsRef = useRef<HTMLDivElement>(null);
  const slackSettingsRef = useRef<HTMLDivElement>(null);
  const twilioSettingsRef = useRef<HTMLDivElement>(null);
  const webhookSettingsRef = useRef<HTMLDivElement>(null);

  const companySettingsRef = useRef<HTMLDivElement>(null);
  const paymentSettingsRef = useRef<HTMLDivElement>(null);
  const storageSettingsRef = useRef<HTMLDivElement>(null);
  const recaptchaSettingsRef = useRef<HTMLDivElement>(null);
  const chatgptSettingsRef = useRef<HTMLDivElement>(null);
  const cookieSettingsRef = useRef<HTMLDivElement>(null);

  const seoSettingsRef = useRef<HTMLDivElement>(null);
  const cacheSettingsRef = useRef<HTMLDivElement>(null);
  const googleCalendarSettingsRef = useRef<HTMLDivElement>(null);
  const quotationInvoiceSettingsRef = useRef<HTMLDivElement>(null);
  const aliaddoSettingsRef = useRef<HTMLDivElement>(null);




  // Smart scroll functionality
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100; // Add offset for better UX

      // Get positions of each section
      const systemSettingsPosition = systemSettingsRef.current?.offsetTop || 0;
      const brandSettingsPosition = brandSettingsRef.current?.offsetTop || 0;

      const currencySettingsPosition = currencySettingsRef.current?.offsetTop || 0;
      const emailSettingsPosition = emailSettingsRef.current?.offsetTop || 0;
      const emailNotificationSettingsPosition = emailNotificationSettingsRef.current?.offsetTop || 0;
      const slackSettingsPosition = slackSettingsRef.current?.offsetTop || 0;
      const twilioSettingsPosition = twilioSettingsRef.current?.offsetTop || 0;
      const webhookSettingsPosition = webhookSettingsRef.current?.offsetTop || 0;
      const companySettingsPosition = companySettingsRef.current?.offsetTop || 0;
      const paymentSettingsPosition = paymentSettingsRef.current?.offsetTop || 0;
      const storageSettingsPosition = storageSettingsRef.current?.offsetTop || 0;
      const recaptchaSettingsPosition = recaptchaSettingsRef.current?.offsetTop || 0;
      const chatgptSettingsPosition = chatgptSettingsRef.current?.offsetTop || 0;
      const cookieSettingsPosition = cookieSettingsRef.current?.offsetTop || 0;

      const seoSettingsPosition = seoSettingsRef.current?.offsetTop || 0;
      const cacheSettingsPosition = cacheSettingsRef.current?.offsetTop || 0;
      const googleCalendarSettingsPosition = googleCalendarSettingsRef.current?.offsetTop || 0;
      const quotationInvoiceSettingsPosition = quotationInvoiceSettingsRef.current?.offsetTop || 0;
      const aliaddoSettingsPosition = aliaddoSettingsRef.current?.offsetTop || 0;



      // Determine active section based on scroll position
      if (scrollPosition >= aliaddoSettingsPosition && aliaddoSettingsPosition > 0) {
        setActiveSection('aliaddo-settings');
      } else if (scrollPosition >= quotationInvoiceSettingsPosition && quotationInvoiceSettingsPosition > 0) {
        setActiveSection('quotation-invoice-settings');
      } else if (scrollPosition >= googleCalendarSettingsPosition && googleCalendarSettingsPosition > 0) {
        setActiveSection('google-calendar-settings');
      } else if (scrollPosition >= cacheSettingsPosition && cacheSettingsPosition > 0) {
        setActiveSection('cache-settings');
      } else if (scrollPosition >= seoSettingsPosition && seoSettingsPosition > 0) {
        setActiveSection('seo-settings');

      } else if (scrollPosition >= cookieSettingsPosition && cookieSettingsPosition > 0) {
        setActiveSection('cookie-settings');
      } else if (scrollPosition >= chatgptSettingsPosition && chatgptSettingsPosition > 0) {
        setActiveSection('chatgpt-settings');
      } else if (scrollPosition >= recaptchaSettingsPosition && recaptchaSettingsPosition > 0) {
        setActiveSection('recaptcha-settings');
      } else if (scrollPosition >= storageSettingsPosition && storageSettingsPosition > 0) {
        setActiveSection('storage-settings');
      } else if (scrollPosition >= paymentSettingsPosition && paymentSettingsPosition > 0) {
        setActiveSection('payment-settings');
      } else if (scrollPosition >= companySettingsPosition && companySettingsPosition > 0) {
        setActiveSection('company-settings');
      } else if (scrollPosition >= webhookSettingsPosition && webhookSettingsPosition > 0) {
        setActiveSection('webhook-settings');
      } else if (scrollPosition >= twilioSettingsPosition && twilioSettingsPosition > 0) {
        setActiveSection('twilio-settings');
      } else if (scrollPosition >= slackSettingsPosition && slackSettingsPosition > 0) {
        setActiveSection('slack-settings');
      } else if (scrollPosition >= emailNotificationSettingsPosition && emailNotificationSettingsPosition > 0) {
        setActiveSection('email-notification-settings');
      } else if (scrollPosition >= emailSettingsPosition && emailSettingsPosition > 0) {
        setActiveSection('email-settings');
      } else if (scrollPosition >= currencySettingsPosition && currencySettingsPosition > 0) {
        setActiveSection('currency-settings');

      } else if (scrollPosition >= brandSettingsPosition && brandSettingsPosition > 0) {
        setActiveSection('brand-settings');
      } else {
        setActiveSection('system-settings');
      }
    };

    // Add scroll event listener
    window.addEventListener('scroll', handleScroll);

    // Initial check for hash in URL
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      const element = document.getElementById(hash);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        setActiveSection(hash);
      }
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Handle navigation click
  const handleNavClick = (href: string) => {
    const id = href.replace('#', '');
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(id);
      setSidebarOpen(false);
    }
  };

  const breadcrumbs = [
    { title: t('Dashboard'), href: route('dashboard') },
    { title: t('Settings') }
  ];

  return (
    <PageTemplate
      title={t('Settings')}
      url="/settings"
      breadcrumbs={breadcrumbs}
      description={t('Manage system settings.')}
    >
      <style>{`
        main {
          max-width: 100vw;
          overflow-x: clip !important;
        }
        body {
          overflow-x: clip !important;
        }
      `}</style>
      <div className="space-y-6 w-full min-w-0">
        {/* Mobile/Tablet Sidebar Toggle Button */}
        <div className="xl:hidden w-full">
          <Button
            variant="outline"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center justify-center gap-2"
          >
            <Layout className="h-4 w-4" />
            {t('Settings')}
            {sidebarOpen ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          </Button>
        </div>

        <div className={`flex flex-col xl:flex-row gap-6 xl:gap-8 w-full min-w-0 items-start`} dir={position === 'right' ? 'rtl' : 'ltr'}>
          {/* Sidebar Navigation */}
          <div className={`w-full xl:w-70 flex-shrink-0 ${sidebarOpen ? 'block' : 'hidden xl:block'} sticky top-20`}>
            <ScrollArea className="h-[calc(100vh-5rem)]" dir={position === 'right' ? 'rtl' : 'ltr'}>
              <div className={`flex flex-col gap-2 rounded-lg border bg-card text-card-foreground shadow-sm p-3 ${position === 'right' ? 'pl-4' : 'pr-4'}`}>
                <div className="flex items-center justify-between px-2 py-1 xl:hidden border-b pb-2 mb-1">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t('Sections')}</h3>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                {sidebarNavItems.map((item) => {
                  const href = item.href ?? '#';

                  return (
                    <Button
                      key={href}
                      variant="ghost"
                      className={cn('w-full justify-start text-xs sm:text-sm', {
                        'bg-muted font-medium': activeSection === href.replace('#', ''),
                      })}
                      onClick={() => handleNavClick(href)}
                    >
                      {item.icon}
                      <span className="truncate">{item.title}</span>
                    </Button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Main Content */}
          <div className="flex-1 w-full min-w-0">
            {!hasVisibleSettings && isCompanyUser && (
              <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                {t('No settings sections are enabled for this commerce type. Ask your superadmin to enable the sections you need.')}
              </div>
            )}
            {/* System Settings Section */}
            {(hasSettingsPermission('manage-system-settings') || isSuperAdmin) && (
              <section id="system-settings" ref={systemSettingsRef} className="mb-8">
                <SystemSettings
                  settings={systemSettings}
                  timezones={timezones}
                  dateFormats={dateFormats}
                  timeFormats={timeFormats}
                  isCompanyUser={auth.user?.type === 'company'}
                />
              </section>
            )}

            {/* Brand Settings Section */}
            {(hasSettingsPermission('manage-brand-settings') || isSuperAdmin) && (
              <section id="brand-settings" ref={brandSettingsRef} className="mb-8">
                <BrandSettings />
              </section>
            )}



            {/* Currency Settings Section */}
            {(hasSettingsPermission('manage-currency-settings') || isSuperAdmin) && (
              <section id="currency-settings" ref={currencySettingsRef} className="mb-8">
                <CurrencySettings />
              </section>
            )}

            {/* Email Settings Section */}
            {(hasSettingsPermission('manage-email-settings') || isSuperAdmin) && (
              <section id="email-settings" ref={emailSettingsRef} className="mb-8">
                <EmailSettings />
              </section>
            )}

            {/* Email Notification Settings Section */}
            {(hasSettingsPermission('manage-email-notification-settings') && isCompanyUser) && (
              <section id="email-notification-settings" ref={emailNotificationSettingsRef} className="mb-8">
                <EmailNotificationSettings />
              </section>
            )}

            {/* Slack Settings Section */}
            {(hasSettingsPermission('manage-slack-settings') && isCompanyUser) && (
              <section id="slack-settings" ref={slackSettingsRef} className="mb-8">
                <SlackSettings />
              </section>
            )}

            {/* Twilio SMS Settings Section */}
            {(hasSettingsPermission('manage-twilio-settings') && isCompanyUser) && (
              <section id="twilio-settings" ref={twilioSettingsRef} className="mb-8">
                <TwilioSettings />
              </section>
            )}

            {/* Webhook Settings Section */}
            {(hasSettingsPermission('manage-webhook-settings') && isCompanyUser) && (
              <section id="webhook-settings" ref={webhookSettingsRef} className="mb-8">
                <WebhookSettings />
              </section>
            )}



            {/* Company Settings Section */}
            {(hasSettingsPermission('manage-company-settings') && isCompanyUser) && (
              <section id="company-settings" ref={companySettingsRef} className="mb-8">
                <CompanySettings settings={systemSettings} />
              </section>
            )}

            {/* Payment Settings Section */}
            {(hasSettingsPermission('manage-payment-settings') || isSuperAdmin) && (
              <section id="payment-settings" ref={paymentSettingsRef} className="mb-8">
                <PaymentSettings settings={paymentSettings} />
              </section>
            )}

            {/* Storage Settings Section */}
            {isSuperAdmin && hasSettingsPermission('manage-storage-settings') && (
              <section id="storage-settings" ref={storageSettingsRef} className="mb-8">
                <StorageSettings settings={systemSettings} />
              </section>
            )}

            {/* ReCaptcha Settings Section */}
            {(hasSettingsPermission('manage-recaptcha-settings') || isSuperAdmin) && (
              <section id="recaptcha-settings" ref={recaptchaSettingsRef} className="mb-8">
                <RecaptchaSettings settings={systemSettings} />
              </section>
            )}

            {/* Chat GPT Settings Section */}
            {(hasSettingsPermission('manage-chatgpt-settings') || isSuperAdmin) && (
              <section id="chatgpt-settings" ref={chatgptSettingsRef} className="mb-8">
                <ChatGptSettings settings={systemSettings} />
              </section>
            )}

            {/* Cookie Settings Section */}
            {(hasSettingsPermission('manage-cookie-settings') || isSuperAdmin) && (
              <section id="cookie-settings" ref={cookieSettingsRef} className="mb-8">
                <CookieSettings settings={systemSettings} />
              </section>
            )}



            {/* SEO Settings Section */}
            {(hasSettingsPermission('manage-seo-settings') || isSuperAdmin) && (
              <section id="seo-settings" ref={seoSettingsRef} className="mb-8">
                <SeoSettings settings={systemSettings} />
              </section>
            )}

            {/* Cache Settings Section */}
            {(hasSettingsPermission('manage-cache-settings') || isSuperAdmin) && (
              <section id="cache-settings" ref={cacheSettingsRef} className="mb-8">
                <CacheSettings cacheSize={cacheSize} />
              </section>
            )}

            {/* Google Calendar Settings Section */}
            {(hasSettingsPermission('manage-google-calendar-settings') && isCompanyUser) && (
              <section id="google-calendar-settings" ref={googleCalendarSettingsRef} className="mb-8">
                <GoogleCalendarSettings settings={systemSettings} />
              </section>
            )}

            {/* Purchase Invoice Settings Section */}
            {/* {(auth.user?.type === 'company') && (
            <section id="purchase-invoice-settings" ref={purchaseInvoiceSettingsRef} className="mb-8">
              <PurchaseInvoiceSettings settings={systemSettings} />
            </section>
          )} */}

            {/* Sales Invoice Settings Section */}
            {/* {(auth.user?.type === 'company') && (
            <section id="sales-invoice-settings" ref={salesInvoiceSettingsRef} className="mb-8">
              <SalesInvoiceSettings settings={systemSettings} />
            </section>
          )} */}

            {/* Quotation Invoice Settings Section */}
            {(hasSettingsPermission('manage-quotation-invoice-settings') && isCompanyUser) && (
              <section id="quotation-invoice-settings" ref={quotationInvoiceSettingsRef} className="mb-8">
                <QuotationInvoiceSettings settings={systemSettings} />
              </section>
            )}
            {hasSettingsPermission('manage-aliaddo-settings') && isCompanyUser && (
              <section id="aliaddo-settings" ref={aliaddoSettingsRef} className="mb-8">
                <AliaddoSettings settings={aliaddoSettings} />
              </section>
            )}
          </div>
        </div>
      </div>
      <Toaster />
    </PageTemplate>
  );
}
