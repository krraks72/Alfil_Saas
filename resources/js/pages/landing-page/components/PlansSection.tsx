import React, { useState } from 'react';
import { Check, ArrowRight, Sparkles } from 'lucide-react';
import { Link, usePage } from '@inertiajs/react';
import { useScrollAnimation } from '../../../hooks/useScrollAnimation';
import { useTranslation } from 'react-i18next';
import { isUserRegistrationEnabled } from '@/utils/helpers';

// Simple encryption function for plan ID
const encryptPlanId = (planId: number): string => {
  const key = 'POS2024';
  const str = planId.toString();
  let encrypted = '';
  for (let i = 0; i < str.length; i++) {
    encrypted += String.fromCharCode(str.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return btoa(encrypted);
};

interface Plan {
  id: number;
  name: string;
  description: string;
  price: number;
  yearly_price?: number;
  duration: string;
  features?: string[];
  stats: {
    users: number | string;
    customers: number | string;
    vendors: number | string;
    storage: string;
  };
  is_popular?: boolean;
  is_plan_enable: string;
}

interface PlansSectionProps {
  brandColor?: string;
  plans: Plan[];
  settings?: any;
  sectionData?: {
    title?: string;
    subtitle?: string;
    faq_text?: string;
  };
}

function PlansSection({ plans, settings, sectionData, brandColor = '#10b77f' }: PlansSectionProps) {
  const { t } = useTranslation();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const { ref, isVisible } = useScrollAnimation();
  const { props } = usePage();
  
  // Check if demo mode and get theme from cookie
  const isDemo = (props as any).globalSettings?.is_demo;
  let themeMode = (props as any).globalSettings?.themeMode || 'light';
  
   if (isDemo && typeof document !== 'undefined') {
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) {
        const cookieValue = parts.pop()?.split(';').shift();
        return cookieValue ? decodeURIComponent(cookieValue) : null;
      }
      return null;
    };
    
    const themeSettingsCookie = getCookie('themeSettings');
    if (themeSettingsCookie) {
      try {
        const themeSettings = JSON.parse(themeSettingsCookie);
        if (themeSettings.appearance) {
          themeMode = themeSettings.appearance;
        }
      } catch (e) {
        // Silent error handling
      }
    }
  }
  
  const isDark = themeMode === 'dark';

  // Filter enabled plans
  const enabledPlans = plans.filter(plan => plan.is_plan_enable === 'on');

  // Default plans if none provided
  const defaultPlans = [
    {
      id: 1,
      name: 'Starter',
      description: 'Perfect for small businesses looking to grow their online presence.',
      price: 0,
      yearly_price: 0,
      duration: 'month',
      features: [
        'AI Integration'
      ],
      stats: {
        users: 1,
        customers: 100,
        vendors: 10,
        storage: '1GB'
      },
      is_popular: false,
      is_plan_enable: 'on'
    },
    {
      id: 2,
      name: 'Professional',
      description: 'Ideal for professionals and small businesses',
      price: 19,
      yearly_price: 190,
      duration: 'month',
      features: [
        'AI Integration'
      ],
      stats: {
        users: 5,
        customers: 1000,
        vendors: 50,
        storage: '10GB'
      },
      is_popular: true,
      is_plan_enable: 'on'
    },
    {
      id: 3,
      name: 'Enterprise',
      description: 'For teams and large organizations',
      price: 49,
      yearly_price: 490,
      duration: 'month',
      features: [
        'AI Integration'
      ],
      stats: {
        users: 50,
        customers: 100,
        vendors: 100,
        storage: '100GB'
      },
      is_popular: false,
      is_plan_enable: 'on'
    }
  ];

  const displayPlans = enabledPlans.length > 0 ? enabledPlans : defaultPlans;

  const formatCurrency = (amount: string | number) => {
    if (typeof window !== 'undefined' && window.appSettings?.formatCurrency) {
      // Use numeric value if available, otherwise parse the string
      const numericAmount = typeof amount === 'number' ? amount : parseFloat(amount);
      return window.appSettings.formatCurrency(numericAmount, { showSymbol: true });
    }
    // Fallback if appSettings is not available
    return amount;
  };
  
  const getPrice = (plan: Plan) => {
    if (billingCycle === 'yearly' && plan.yearly_price) {
      return plan.yearly_price;
    }
    return plan.price;
  };


  return (
    <section id="pricing" className={`py-12 sm:py-16 lg:py-20 ${isDark ? 'bg-gray-900' : 'bg-white'}`} ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center mb-8 sm:mb-12 lg:mb-16 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className={`text-3xl md:text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>
            {sectionData?.title ? t(sectionData.title) : t('Choose Your Plan')}
          </h2>
          <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'} max-w-3xl mx-auto mb-8 leading-relaxed font-medium`}>
            {sectionData?.subtitle ? t(sectionData.subtitle) : t('Start with our free plan and upgrade as you grow. All plans include our core features with no setup fees or hidden costs.')}
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4">
            <span className={`text-sm ${billingCycle === 'monthly' ? (isDark ? 'text-white' : 'text-gray-900') + ' font-semibold' : (isDark ? 'text-gray-400' : 'text-gray-500')}`}>
              {t('Monthly')}
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
              className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
              style={{ backgroundColor: billingCycle === 'yearly' ? brandColor : (isDark ? '#374151' : '#e5e7eb'), direction: 'ltr' }}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-1'}`}
              />
            </button>
            <span className={`text-sm ${billingCycle === 'yearly' ? (isDark ? 'text-white' : 'text-gray-900') + ' font-semibold' : (isDark ? 'text-gray-400' : 'text-gray-500')}`}>
              {t('Yearly')}
            </span>
            {/* {billingCycle === 'yearly' && (
              <span className="bg-gray-100 text-gray-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border">
                Save 20%
              </span>
            )} */}
          </div>
        </div>

        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 transition-all duration-700 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {displayPlans.map((plan) => (
            <div
              key={plan.id}
              className={`relative h-full transition-all duration-200 ${plan.is_popular ? 'transform scale-105' : ''}`}
            >
              {/* Main Card */}
              <div className={`
                relative h-full flex flex-col rounded-lg border-2 transition-all duration-200
                ${plan.is_popular ? 'shadow-xl' : 'hover:shadow-lg'}
              `} style={{
                borderColor: plan.is_popular ? brandColor : isDark ? 'rgb(75 85 99)' : 'rgb(229 231 235)',
                background: isDark ? 'rgb(17 24 39)' : 'white'
              }}>

                {/* Recommended Badge */}
                {plan.is_popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                    <div className="text-white px-4 py-1 rounded-full text-sm font-semibold" style={{ backgroundColor: brandColor }}>
                      {t('Recommended')}
                    </div>
                  </div>
                )}

                {/* Card Header */}
                <div className={`p-6 text-center border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                  <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {t(plan.name)}
                  </h3>

                  {/* Pricing */}
                  <div className="mb-4">
                    <div className="flex items-center justify-center">
                      <span className={`text-4xl font-mono ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {getPrice(plan) === 0 ? formatCurrency(0) : formatCurrency(getPrice(plan))}
                      </span>
                      <span className={`ml-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        /{billingCycle === 'yearly' ? t('year') : t('month')}
                      </span>
                    </div>
                    {billingCycle === 'yearly' && getPrice(plan) > 0 && (
                      <div className="flex items-center justify-center gap-1 mt-1 text-sm" style={{ color: brandColor }}>
                        <Check className="h-3.5 w-3.5" />
                        {t('Save')} {formatCurrency(Math.round((plan.price * 12 - getPrice(plan)) * 100) / 100)} {t('annually')}
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {t(plan.description)}
                  </p>
                </div>

                {/* Card Content */}
                <div className="flex flex-col flex-1 p-6">

                  {/* Usage Stats - POS specific */}
                  <div className="mb-6">
                    <h4 className={`text-sm font-semibold mb-3 uppercase tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-900'}`}>
                      {t("What's Included")}
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{t('Customers')}</span>
                        <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{plan.stats?.customers || 'N/A'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{t('Users')}</span>
                        <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{plan.stats?.users || 'N/A'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{t('Vendors')}</span>
                        <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{plan.stats?.vendors || 'N/A'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{t('Storage')}</span>
                        <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{plan.stats?.storage || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Features */}
                  {(plan.features || (plan as any).module)?.length > 0 && (
                    <div className="mb-6 flex-1">
                      <h4 className={`text-sm font-semibold mb-3 uppercase tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-900'}`}>
                        {t('Features')}
                      </h4>
                      <ul className="space-y-2">
                        {(plan.features || (plan as any).module || []).map((feature, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <div
                              className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: `${brandColor}20`, color: brandColor }}
                            >
                              <Check className="h-3 w-3" />
                            </div>
                            <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{t(feature)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Actions */}
                  <div className={`mt-auto pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                    {isUserRegistrationEnabled() ? (
                      <Link
                        href={route('register', { plan: encryptPlanId(plan.id) })}
                        className="block w-full text-center py-3 px-6 rounded-lg font-semibold transition-colors hover:opacity-90"
                        style={{
                          backgroundColor: plan.is_popular ? brandColor : (isDark ? '#374151' : '#f3f4f6'),
                          color: plan.is_popular ? 'white' : (isDark ? '#f9fafb' : '#111827')
                        }}
                      >
                        {plan.price === 0 ? t('Start Free') : t('Get Started')}
                        <ArrowRight className="w-4 h-4 inline-block ml-2" />
                      </Link>
                    ) : (
                      <Link
                        href={route('login')}
                        className="block w-full text-center py-3 px-6 rounded-lg font-semibold transition-colors hover:opacity-90"
                        style={{
                          backgroundColor: plan.is_popular ? brandColor : (isDark ? '#374151' : '#f3f4f6'),
                          color: plan.is_popular ? 'white' : (isDark ? '#f9fafb' : '#111827')
                        }}
                      >
                        {t('Login to Continue')}
                        <ArrowRight className="w-4 h-4 inline-block ml-2" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Link */}
        {sectionData?.faq_text && (
          <div className="text-center mt-8 sm:mt-12">
            <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>
              {t(sectionData.faq_text)}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

export default PlansSection;