import React from 'react';
import { Head, usePage } from '@inertiajs/react';
import { CreditCard, Users, Smartphone, QrCode, BadgeCheck, FileText, Trophy, Target, BarChart2, Filter, Check, ShieldCheck, Link as LinkIcon, Briefcase, ShoppingCart, Receipt, Package } from 'lucide-react';
import { ReactNode, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useBrand } from '@/contexts/BrandContext';
import { useAppearance, THEME_COLORS } from '@/hooks/use-appearance';
import { useFavicon } from '@/hooks/use-favicon';
import CookieConsentBanner from '@/components/CookieConsentBanner';
import { useLayout } from '@/contexts/LayoutContext';
import { getCookie, isDemoMode } from '@/utils/cookie-utils';
import i18n from '@/i18n';

interface AuthLayoutProps {
    children: ReactNode;
    title: string;
    description?: string;
    icon?: ReactNode;
    status?: string;
    statusType?: 'success' | 'error';
}

function hexToAdjustedRgba(hex: string, opacity = 1, adjust = 0) {
    hex = hex.replace("#", "");
    let r = parseInt(hex.slice(0, 2), 16);
    let g = parseInt(hex.slice(2, 4), 16);
    let b = parseInt(hex.slice(4, 6), 16);
    const clamp = (v: number) => Math.max(-1, Math.min(1, v));
    const getF = (ch: string) =>
        typeof adjust === "number" ? clamp(adjust) : clamp((adjust as any)[ch] ?? 0);
    const adj = (c: number, f: number) =>
        f < 0 ? Math.floor(c * (1 + f)) : Math.floor(c + (255 - c) * f);
    const rr = adj(r, getF("r"));
    const gg = adj(g, getF("g"));
    const bb = adj(b, getF("b"));
    return opacity === 1
        ? `#${rr.toString(16).padStart(2, "0")}${gg
            .toString(16)
            .padStart(2, "0")}${bb.toString(16).padStart(2, "0")}`.toUpperCase()
        : `rgba(${rr}, ${gg}, ${bb}, ${opacity})`;
}

export default function AuthLayout({
    children,
    title,
    description,
    icon,
    status,
    statusType = 'success',
}: AuthLayoutProps) {
    useFavicon();
    const { t } = useTranslation();
    const [mounted, setMounted] = useState(false);
    const { logoLight, logoDark, themeColor, customColor, footerText: contextFooterText, titleText: contextTitleText } = useBrand();
    const { appearance } = useAppearance();
    const globalSettings = (usePage().props as any).globalSettings;
    const userLanguage = (usePage().props as any).userLanguage;
    const { position } = useLayout();

    // Directly fetch from globalSettings in demo mode like the previous UI did
    const isDemo = globalSettings?.is_demo || false;
    const titleText = (isDemo && (globalSettings?.titleText || globalSettings?.title_text)) ? (globalSettings?.titleText || globalSettings?.title_text) : contextTitleText;
    const footerText = (isDemo && (globalSettings?.footerText || globalSettings?.footer_text)) ? (globalSettings?.footerText || globalSettings?.footer_text) : contextFooterText;

    const currentLogo = appearance === 'dark' ? logoLight : logoDark;
    const primaryColor = themeColor === 'custom' ? customColor : THEME_COLORS[themeColor as keyof typeof THEME_COLORS];

    useEffect(() => {
        setMounted(true);
        let dir = 'ltr';
        let data = getCookie('layoutDirection');
        const isDemo = globalSettings?.is_demo || false;
        // Check RTL setting from cookies/globalSettings
        const layoutDirection = isDemo ? data : globalSettings?.layoutDirection;
        const isRTLSetting = layoutDirection === 'right';
        const currentLang = i18n.language || globalSettings?.defaultLanguage || 'en';
        const isRTLLanguage = ['ar', 'he'].includes(currentLang);

        // Apply RTL if: 1) Language is ar/he OR 2) RTL setting is enabled
        if (isRTLLanguage || isRTLSetting) {
            dir = 'rtl';
        }

        // Apply direction immediately
        document.documentElement.dir = dir;
        document.documentElement.setAttribute('dir', dir);
        document.body.dir = dir;
    }, []);

    const { url } = usePage();
    const isLoginPage = url.includes('login') || url === '/' || url === '';
    const isRegisterPage = url.includes('register');
    const isForgotPasswordPage = url.includes('forgot-password') || url.includes('password/reset');
    const isResetPasswordPage = url.includes('reset-password');
    const isCenteredHeader = isForgotPasswordPage || isResetPasswordPage;

    // Sync HTML dir attr for RTL support for auth pages - Apply immediately and persist
    const applyRTLDirection = React.useCallback(() => {
        const currentLang = i18n.language || globalSettings?.defaultLanguage || 'en';
        const isRTLLanguage = ['ar', 'he'].includes(currentLang);
        let dir = 'ltr';

        // Apply RTL if: 1) Language is ar/he OR 2) RTL setting is enabled
        if (isRTLLanguage) {
            dir = 'rtl';
        }

        // Apply direction immediately
        document.documentElement.dir = dir;
        document.documentElement.setAttribute('dir', dir);
        document.body.dir = dir;

        return dir;
    }, [i18n.language, globalSettings?.defaultLanguage, globalSettings?.is_demo, globalSettings?.layoutDirection]);

    // Apply RTL on mount and when dependencies change
    React.useLayoutEffect(() => {
        const direction = applyRTLDirection();

        // Ensure direction persists after any DOM changes
        const observer = new MutationObserver(() => {
            if (document.documentElement.dir !== direction) {
                document.documentElement.dir = direction;
                document.documentElement.setAttribute('dir', direction);
            }
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['dir']
        });

        return () => {
            observer.disconnect();
            // Reset to LTR when leaving auth layout           
            document.documentElement.dir = 'ltr';
            document.documentElement.setAttribute('dir', 'ltr');
            document.body.dir = 'ltr';
        };
    }, [applyRTLDirection]);

    return (
        <div className="min-h-screen overflow-y-auto flex flex-col [@media(min-width:769px)]:flex-row w-full bg-white dark:bg-gray-900 ltr:text-left rtl:text-right font-sans">
            <Head title={title} />

            {/* Left Side (Form) */}
            <div className="w-full [@media(min-width:769px)]:w-[50%] xl:w-[45%] flex flex-col justify-between min-h-screen [@media(min-width:769px)]:min-h-full p-4 sm:p-6 lg:p-8 relative">
                {/* Language Switcher for Mobile */}
                <div className="absolute top-6 end-6 z-20 bg-white dark:bg-gray-800 rounded-md shadow-sm [@media(min-width:768px)]:hidden">
                    <LanguageSwitcher />
                </div>

                {/* Header - Logo */}
                <div className="flex justify-center">
                    <div className="inline-block">
                        {currentLogo ? (
                            <img src={currentLogo} alt="Logo" className="h-30 sm:h-30 w-auto max-w-[115px] object-contain" />
                        ) : (
                            <div className="flex items-center justify-center space-x-2">
                                <CreditCard className="h-10 w-10 sm:h-12 sm:w-12" style={{ color: primaryColor }} />
                                <span className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">{titleText || 'POSGo'}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Form Content */}
                <div className="flex-1 flex flex-col justify-center w-full max-w-lg mx-auto py-4 ltr:text-left rtl:text-right">
                    <div className={`flex flex-col ${isCenteredHeader ? 'items-center text-center' : 'items-start ltr:text-left rtl:text-right'}`}>
                        {icon && (
                            <div className={`mb-4 flex items-center justify-center rounded-full ${isCenteredHeader ? 'h-16 w-16' : 'h-12 w-12'}`} style={{ backgroundColor: `${primaryColor}20` }}>
                                {icon}
                            </div>
                        )}
                        <h1 className="text-[28px] font-bold text-gray-900 dark:text-white mb-2">{title}</h1>
                        <div className={`w-8 h-1 mb-3 ${isCenteredHeader ? 'mx-auto' : ''}`} style={{ backgroundColor: primaryColor }}></div>
                        {description && (
                            <p className="text-gray-500 dark:text-gray-400 mb-8 truncate line-clamp-2">{description}</p>
                        )}
                    </div>

                    {status && (
                        <div className={`mb-6 text-sm font-medium ${statusType === 'success' ? 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/30' : 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/30'} p-3 rounded-lg border`}>
                            {status}
                        </div>
                    )}

                    {children}
                </div>

                {/* Footer - Copyright Info */}
                <div className="text-gray-400 dark:text-gray-500 text-xs sm:text-sm text-center">
                    {footerText || `© ${new Date().getFullYear()} ${globalSettings?.company_name || 'POS SaaS'}. ${t("All rights reserved.")}`}
                </div>
            </div>

            {/* Right Side (Graphics/Promotional) */}
            <div className="hidden [@media(min-width:769px)]:flex w-full [@media(min-width:769px)]:w-[50%] xl:w-[55%] bg-slate-50 dark:bg-gray-950 flex-col justify-between p-6 lg:p-8 xl:p-10 2xl:p-12 relative overflow-hidden min-h-full">
                {/* Language Switcher Row at Top */}
                <div className="flex justify-end w-full z-20">
                    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-100 dark:border-gray-800">
                        <LanguageSwitcher />
                    </div>
                </div>

                {/* Promotional Content in Middle */}
                <div className="w-full max-w-[840px] xl:max-w-[880px] 2xl:max-w-[920px] mx-auto z-10 my-auto py-2">
                    {isLoginPage && (
                        <>
                            <h2 className="text-3xl lg:text-[38px] xl:text-[42px] 2xl:text-[46px] font-bold text-[#1E293B] dark:text-white mb-3 lg:mb-4 xl:mb-5 leading-[1.18]">
                                {t("Empower Your Retail Business")}<br />
                                {t("Smarter with")} <span style={{ color: primaryColor }}>{t(titleText || 'POS SaaS')}</span>
                            </h2>
                            <p className="text-[#475569] dark:text-gray-300 text-sm lg:text-base xl:text-lg mb-5 lg:mb-7 xl:mb-8 max-w-xl leading-relaxed">
                                {t("Streamline point of sale, manage inventory, track daily revenue and delight customers – all in one unified platform.")}
                            </p>

                            {/* Cards wrapper */}
                            <div className="space-y-3 lg:space-y-4 max-w-[100%] mx-auto">
                                {/* Main Dashboard Card */}
                                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.05)] border border-gray-100/60 dark:border-gray-700 p-4 sm:p-5 lg:p-6">
                                    <div className="flex items-center mb-3 lg:mb-4 xl:mb-5">
                                        <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-xl dark:bg-gray-800 flex items-center justify-center ltr:mr-3 rtl:ml-3 flex-shrink-0" style={{ backgroundColor: `${primaryColor}15` }}>
                                            <ShoppingCart className="w-4 h-4 lg:w-4.5 lg:h-4.5" style={{ color: primaryColor }} />
                                        </div>
                                        <h3 className="font-bold text-gray-900 dark:text-white text-base lg:text-lg">{t("Store Activity & POS")}</h3>
                                    </div>
                                    
                                    {/* Activity KPI Cards Grid - 2 cards per row */}
                                    <div className="grid grid-cols-2 xl:grid-cols-4 gap-2.5 sm:gap-3 lg:gap-3.5 xl:gap-4 mb-4 lg:mb-5 xl:mb-6">
                                        {/* Step 1 */}
                                        <div className="flex flex-col justify-between border border-gray-100 dark:border-gray-700 rounded-xl p-2.5 lg:p-3 xl:p-3.5 shadow-sm bg-white dark:bg-gray-800 min-h-[82px] lg:min-h-[88px] xl:min-h-[94px] hover:shadow-md transition-shadow">
                                            <div className="flex items-center mb-1.5">
                                                <ShoppingCart className="w-4 h-4 lg:w-4.5 lg:h-4.5 flex-shrink-0" style={{ color: primaryColor }} />
                                                <span className="text-[11px] lg:text-[12px] xl:text-[13px] font-bold text-gray-900 dark:text-white ltr:ml-2 rtl:mr-2 leading-tight">{t("Today's Orders")}</span>
                                            </div>
                                            <div>
                                                <div className="text-lg lg:text-xl xl:text-2xl font-bold mb-1.5 leading-none" style={{ color: primaryColor }}>148</div>
                                                <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                                    <div className="h-full w-full rounded-full" style={{ backgroundColor: primaryColor }}></div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Step 2 */}
                                        <div className="flex flex-col justify-between border border-gray-100 dark:border-gray-700 rounded-xl p-2.5 lg:p-3 xl:p-3.5 shadow-sm bg-white dark:bg-gray-800 min-h-[82px] lg:min-h-[88px] xl:min-h-[94px] hover:shadow-md transition-shadow">
                                            <div className="flex items-center mb-1.5">
                                                <BadgeCheck className="w-4 h-4 lg:w-4.5 lg:h-4.5 flex-shrink-0" style={{ color: primaryColor }} />
                                                <span className="text-[11px] lg:text-[12px] xl:text-[13px] font-bold text-gray-900 dark:text-white ltr:ml-2 rtl:mr-2 leading-tight">{t("Completed Sales")}</span>
                                            </div>
                                            <div>
                                                <div className="text-lg lg:text-xl xl:text-2xl font-bold mb-1.5 leading-none" style={{ color: primaryColor }}>136</div>
                                                <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                                    <div className="h-full w-3/4 rounded-full" style={{ backgroundColor: primaryColor }}></div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Step 3 */}
                                        <div className="flex flex-col justify-between border border-gray-100 dark:border-gray-700 rounded-xl p-2.5 lg:p-3 xl:p-3.5 shadow-sm bg-white dark:bg-gray-800 min-h-[82px] lg:min-h-[88px] xl:min-h-[94px] hover:shadow-md transition-shadow">
                                            <div className="flex items-center mb-1.5">
                                                <Package className="w-4 h-4 lg:w-4.5 lg:h-4.5 flex-shrink-0" style={{ color: primaryColor }} />
                                                <span className="text-[11px] lg:text-[12px] xl:text-[13px] font-bold text-gray-900 dark:text-white ltr:ml-2 rtl:mr-2 leading-tight">{t("Items Sold")}</span>
                                            </div>
                                            <div>
                                                <div className="text-lg lg:text-xl xl:text-2xl font-bold mb-1.5 leading-none" style={{ color: primaryColor }}>520</div>
                                                <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                                    <div className="h-full w-1/2 rounded-full" style={{ backgroundColor: primaryColor }}></div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Step 4 */}
                                        <div className="flex flex-col justify-between border border-gray-100 dark:border-gray-700 rounded-xl p-2.5 lg:p-3 xl:p-3.5 shadow-sm bg-white dark:bg-gray-800 min-h-[82px] lg:min-h-[88px] xl:min-h-[94px] hover:shadow-md transition-shadow">
                                            <div className="flex items-center mb-1.5">
                                                <Users className="w-4 h-4 lg:w-4.5 lg:h-4.5 flex-shrink-0" style={{ color: primaryColor }} />
                                                <span className="text-[11px] lg:text-[12px] xl:text-[13px] font-bold text-gray-900 dark:text-white ltr:ml-2 rtl:mr-2 leading-tight">{t("Active Registers")}</span>
                                            </div>
                                            <div>
                                                <div className="text-lg lg:text-xl xl:text-2xl font-bold mb-1.5 leading-none" style={{ color: primaryColor }}>12</div>
                                                <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                                    <div className="h-full w-1/4 rounded-full" style={{ backgroundColor: primaryColor }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Lower Stats Row */}
                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 lg:gap-4 mt-3 lg:mt-4 xl:mt-5">
                                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-200 dark:border-gray-700 p-3 lg:p-4 flex items-center">
                                            <div className="w-11 h-11 lg:w-12 lg:h-12 xl:w-13 xl:h-13 rounded-full dark:bg-gray-900 flex items-center justify-center ltr:mr-3 lg:ltr:mr-4 rtl:ml-3 lg:rtl:ml-4 flex-shrink-0" style={{ backgroundColor: `${primaryColor}15` }}>
                                                <Receipt className="w-5 h-5 lg:w-6 lg:h-6" style={{ color: primaryColor }} />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-xs lg:text-[13px] font-bold text-gray-900 dark:text-white mb-0.5 truncate">{t("Total Receipts")}</div>
                                                <div className="text-2xl lg:text-3xl font-bold text-gray-400 leading-none">184 <span className="text-xs lg:text-sm font-normal">{t("receipts")}</span></div>
                                                <div className="text-[11px] lg:text-xs font-semibold mt-1" style={{ color: primaryColor }}>↑ 16.5% <span className="text-gray-400 font-normal">{t("this month")}</span></div>
                                            </div>
                                        </div>

                                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-200 dark:border-gray-700 p-3 lg:p-4 flex items-center justify-between">
                                            <div className="min-w-0">
                                                <div className="text-xs lg:text-[13px] font-bold text-gray-900 dark:text-white mb-0.5 truncate">{t("Total Revenue")}</div>
                                                <div className="text-2xl lg:text-3xl font-bold leading-none" style={{ color: primaryColor }}>$38,420</div>
                                                <div className="text-[11px] lg:text-xs font-semibold mt-1 flex items-center" style={{ color: primaryColor }}>
                                                    <svg className="w-3.5 h-3.5 ltr:mr-1 rtl:ml-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg>
                                                    15.3% <span className="text-gray-400 ltr:ml-1 rtl:mr-1 font-normal">{t("this month")}</span>
                                                </div>
                                            </div>
                                            <div className="h-10 lg:h-12 w-20 lg:w-24 flex-shrink-0">
                                                <svg viewBox="0 0 100 40" className="w-full h-full fill-none overflow-visible" style={{ stroke: primaryColor }} strokeWidth="2.5" preserveAspectRatio="none">
                                                    <path d="M0,35 L10,32 L20,38 L30,25 L40,28 L50,15 L60,20 L70,10 L80,12 L90,2 L100,0" strokeLinecap="round" strokeLinejoin="round" />
                                                    <circle cx="100" cy="0" r="3" style={{ fill: primaryColor, stroke: 'none' }} />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Feature Icons Row */}
                                <div className="grid grid-cols-4 gap-3 lg:gap-4 mt-3 lg:mt-5 xl:mt-6 pt-1 lg:pt-2">
                                    <div className="text-center">
                                        <div className="w-10 h-10 lg:w-11 lg:h-11 xl:w-12 xl:h-12 mx-auto rounded-full flex items-center justify-center mb-1.5 lg:mb-2" style={{ backgroundColor: `${primaryColor}15` }}>
                                            <ShoppingCart className="w-5 h-5 lg:w-5.5 lg:h-5.5" style={{ color: primaryColor }} />
                                        </div>
                                        <div className="text-[11px] lg:text-[12px] xl:text-[13px] font-bold text-gray-900 dark:text-white mb-0.5">{t("Fast POS Billing")}</div>
                                        <div className="text-[10px] lg:text-[11px] text-gray-500 dark:text-gray-400 leading-snug px-0.5 line-clamp-2">{t("Quick barcode scanning, touch-screen checkout, and instant receipts.")}</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="w-10 h-10 lg:w-11 lg:h-11 xl:w-12 xl:h-12 mx-auto rounded-full flex items-center justify-center mb-1.5 lg:mb-2" style={{ backgroundColor: `${primaryColor}15` }}>
                                            <Package className="w-5 h-5 lg:w-5.5 lg:h-5.5" style={{ color: primaryColor }} />
                                        </div>
                                        <div className="text-[11px] lg:text-[12px] xl:text-[13px] font-bold text-gray-900 dark:text-white mb-0.5">{t("Inventory Tracking")}</div>
                                        <div className="text-[10px] lg:text-[11px] text-gray-500 dark:text-gray-400 leading-snug px-0.5 line-clamp-2">{t("Real-time stock alerts, barcode generation, and multi-warehouse control.")}</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="w-10 h-10 lg:w-11 lg:h-11 xl:w-12 xl:h-12 mx-auto rounded-full flex items-center justify-center mb-1.5 lg:mb-2" style={{ backgroundColor: `${primaryColor}15` }}>
                                            <BarChart2 className="w-5 h-5 lg:w-5.5 lg:h-5.5" style={{ color: primaryColor }} />
                                        </div>
                                        <div className="text-[11px] lg:text-[12px] xl:text-[13px] font-bold text-gray-900 dark:text-white mb-0.5">{t("Sales Analytics")}</div>
                                        <div className="text-[10px] lg:text-[11px] text-gray-500 dark:text-gray-400 leading-snug px-0.5 line-clamp-2">{t("Get instant visibility into top selling products and daily turnover.")}</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="w-10 h-10 lg:w-11 lg:h-11 xl:w-12 xl:h-12 mx-auto rounded-full flex items-center justify-center mb-1.5 lg:mb-2" style={{ backgroundColor: `${primaryColor}15` }}>
                                            <Users className="w-5 h-5 lg:w-5.5 lg:h-5.5" style={{ color: primaryColor }} />
                                        </div>
                                        <div className="text-[11px] lg:text-[12px] xl:text-[13px] font-bold text-gray-900 dark:text-white mb-0.5">{t("Cashier & Staff")}</div>
                                        <div className="text-[10px] lg:text-[11px] text-gray-500 dark:text-gray-400 leading-snug px-0.5 line-clamp-2">{t("Manage cash drawers, shift logs, cashier roles, and permissions.")}</div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {isRegisterPage && (
                        <div className="w-full">
                            <div className="text-center mb-5 lg:mb-6 xl:mb-8">
                                <h2 className="text-3xl lg:text-[38px] xl:text-[42px] font-bold text-gray-900 dark:text-white mb-2.5 lg:mb-3 leading-tight">
                                    {t("Manage Your Store")}<br />
                                    {t("in")} <span style={{ color: primaryColor }}>{t("One Place")}</span>
                                </h2>
                                <p className="text-gray-500 dark:text-gray-400 text-sm lg:text-base max-w-lg mx-auto leading-relaxed">
                                    {t("Empower your retail business with point of sale, inventory tracking, sales reports, and customer management.")}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3.5 lg:gap-4 max-w-2xl mx-auto mb-5 lg:mb-6 xl:mb-8">
                                <div className="bg-white dark:bg-gray-800 p-4 lg:p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex items-start rtl:space-x-reverse space-x-3.5 lg:space-x-4">
                                    <div className="w-11 h-11 lg:w-12 lg:h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${primaryColor}15` }}>
                                        <ShoppingCart className="w-5 h-5 lg:w-6 lg:h-6" style={{ color: primaryColor }} />
                                    </div>
                                    <div className="flex-1 min-w-0 mt-0.5">
                                        <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1">{t("Point of Sale")}</h4>
                                        <p className="text-xs lg:text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed ltr:pr-1 rtl:pl-1">{t("Fast and intuitive register designed for speedy retail checkout.")}</p>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-gray-800 p-4 lg:p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex items-start rtl:space-x-reverse space-x-3.5 lg:space-x-4">
                                    <div className="w-11 h-11 lg:w-12 lg:h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${primaryColor}15` }}>
                                        <Package className="w-5 h-5 lg:w-6 lg:h-6" style={{ color: primaryColor }} />
                                    </div>
                                    <div className="flex-1 min-w-0 mt-0.5">
                                        <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1">{t("Inventory Management")}</h4>
                                        <p className="text-xs lg:text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed ltr:pr-1 rtl:pl-1">{t("Organize products, manage stock levels, and automate purchase orders.")}</p>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-gray-800 p-4 lg:p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex items-start rtl:space-x-reverse space-x-3.5 lg:space-x-4">
                                    <div className="w-11 h-11 lg:w-12 lg:h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${primaryColor}15` }}>
                                        <Users className="w-5 h-5 lg:w-6 lg:h-6" style={{ color: primaryColor }} />
                                    </div>
                                    <div className="flex-1 min-w-0 mt-0.5">
                                        <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1">{t("Cashier & Staff")}</h4>
                                        <p className="text-xs lg:text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed ltr:pr-1 rtl:pl-1">{t("Assign roles, track shift sales, and maintain secure access control.")}</p>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-gray-800 p-4 lg:p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex items-start rtl:space-x-reverse space-x-3.5 lg:space-x-4">
                                    <div className="w-11 h-11 lg:w-12 lg:h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${primaryColor}15` }}>
                                        <BarChart2 className="w-5 h-5 lg:w-6 lg:h-6" style={{ color: primaryColor }} />
                                    </div>
                                    <div className="flex-1 min-w-0 mt-0.5">
                                        <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1">{t("Reports & Insights")}</h4>
                                        <p className="text-xs lg:text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed ltr:pr-1 rtl:pl-1">{t("Track gross revenue, profit margins, and best-selling categories.")}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="max-w-full lg:max-w-[85%] mx-auto bg-white dark:bg-gray-800 rounded-2xl py-3 px-6 lg:px-8 shadow-sm border border-gray-100 dark:border-gray-700 grid grid-cols-2 xl:flex xl:justify-between items-center gap-y-2 gap-x-2 text-xs lg:text-sm font-bold text-gray-900 dark:text-white">
                                <span className="flex items-center"><Check className="w-4 h-4 rtl:ml-2 ltr:mr-2 flex-shrink-0" strokeWidth={3} style={{ color: primaryColor }} /> {t("POS Billing")}</span>
                                <span className="flex items-center"><Check className="w-4 h-4 rtl:ml-2 ltr:mr-2 flex-shrink-0" strokeWidth={3} style={{ color: primaryColor }} /> {t("Inventory")}</span>
                                <span className="flex items-center"><Check className="w-4 h-4 rtl:ml-2 ltr:mr-2 flex-shrink-0" strokeWidth={3} style={{ color: primaryColor }} /> {t("Cashiers")}</span>
                                <span className="flex items-center"><Check className="w-4 h-4 rtl:ml-2 ltr:mr-2 flex-shrink-0" strokeWidth={3} style={{ color: primaryColor }} /> {t("Reports")}</span>
                            </div>
                        </div>
                    )}

                    {isForgotPasswordPage && (
                        <div className="w-full">
                            <div className="text-center mb-5 lg:mb-6 xl:mb-8">
                                <h2 className="text-3xl lg:text-[38px] xl:text-[40px] font-bold text-gray-900 dark:text-white mb-2.5 lg:mb-3 leading-tight">
                                    {t("Get Back to")} <span style={{ color: primaryColor }}>{t("Your Store Workspace")}</span>
                                </h2>
                                <p className="text-gray-500 dark:text-gray-400 text-sm lg:text-base max-w-lg mx-auto leading-relaxed">
                                    {t("Forgot your password? Recover your account securely and get back to managing your store and sales.")}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3.5 lg:gap-4 max-w-2xl mx-auto mb-5 lg:mb-6 xl:mb-8">
                                <div className="bg-white dark:bg-gray-800 p-4 lg:p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex items-start rtl:space-x-reverse space-x-3.5 lg:space-x-4">
                                    <div className="w-11 h-11 lg:w-12 lg:h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${primaryColor}15` }}>
                                        <ShieldCheck className="w-5 h-5 lg:w-6 lg:h-6" style={{ color: primaryColor }} />
                                    </div>
                                    <div className="flex-1 min-w-0 mt-0.5">
                                        <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1">{t("Verify Your Account")}</h4>
                                        <p className="text-xs lg:text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed ltr:pr-1 rtl:pl-1">{t("Confirm your account details securely.")}</p>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-gray-800 p-4 lg:p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex items-start rtl:space-x-reverse space-x-3.5 lg:space-x-4">
                                    <div className="w-11 h-11 lg:w-12 lg:h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${primaryColor}15` }}>
                                        <LinkIcon className="w-5 h-5 lg:w-6 lg:h-6" style={{ color: primaryColor }} />
                                    </div>
                                    <div className="flex-1 min-w-0 mt-0.5">
                                        <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1">{t("Recover Access")}</h4>
                                        <p className="text-xs lg:text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed ltr:pr-1 rtl:pl-1">{t("Receive a secure link to regain access.")}</p>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-gray-800 p-4 lg:p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex items-start rtl:space-x-reverse space-x-3.5 lg:space-x-4">
                                    <div className="w-11 h-11 lg:w-12 lg:h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${primaryColor}15` }}>
                                        <ShoppingCart className="w-5 h-5 lg:w-6 lg:h-6" style={{ color: primaryColor }} />
                                    </div>
                                    <div className="flex-1 min-w-0 mt-0.5">
                                        <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1">{t("Keep Store Moving")}</h4>
                                        <p className="text-xs lg:text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed ltr:pr-1 rtl:pl-1">{t("Get back to serving customers and managing sales.")}</p>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-gray-800 p-4 lg:p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex items-start rtl:space-x-reverse space-x-3.5 lg:space-x-4">
                                    <div className="w-11 h-11 lg:w-12 lg:h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${primaryColor}15` }}>
                                        <Users className="w-5 h-5 lg:w-6 lg:h-6" style={{ color: primaryColor }} />
                                    </div>
                                    <div className="flex-1 min-w-0 mt-0.5">
                                        <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1">{t("Stay Connected")}</h4>
                                        <p className="text-xs lg:text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed ltr:pr-1 rtl:pl-1">{t("Return to your cashier stations and team.")}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="text-center">
                                <div className="w-10 h-0.5 mx-auto mb-3 rounded-full" style={{ backgroundColor: primaryColor }}></div>
                                <span className="text-xs lg:text-sm text-gray-500 dark:text-gray-400">{t("Your store is only a step away.")}</span>
                            </div>
                        </div>
                    )}

                    {(isResetPasswordPage || (!isLoginPage && !isRegisterPage && !isForgotPasswordPage)) && (
                        <div className="w-full">
                            <div className="text-center mb-5 lg:mb-6 xl:mb-8">
                                <h2 className="text-3xl lg:text-[38px] xl:text-[40px] font-bold text-gray-900 dark:text-white mb-2.5 lg:mb-3 leading-tight">
                                    {t("A Fresh Start for")} <span style={{ color: primaryColor }}>{t("Secure Store Access")}</span>
                                </h2>
                                <p className="text-gray-500 dark:text-gray-400 text-sm lg:text-base max-w-lg mx-auto leading-relaxed">
                                    {t("Create a new password and get back to managing your business with confidence.")}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3.5 lg:gap-4 max-w-2xl mx-auto mb-5 lg:mb-6 xl:mb-8">
                                <div className="bg-white dark:bg-gray-800 p-4 lg:p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex items-start rtl:space-x-reverse space-x-3.5 lg:space-x-4">
                                    <div className="w-11 h-11 lg:w-12 lg:h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${primaryColor}15` }}>
                                        <ShieldCheck className="w-5 h-5 lg:w-6 lg:h-6" style={{ color: primaryColor }} />
                                    </div>
                                    <div className="flex-1 min-w-0 mt-0.5">
                                        <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1">{t("Protect Your Store")}</h4>
                                        <p className="text-xs lg:text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed ltr:pr-1 rtl:pl-1">{t("Keep store data and sales records secure.")}</p>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-gray-800 p-4 lg:p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex items-start rtl:space-x-reverse space-x-3.5 lg:space-x-4">
                                    <div className="w-11 h-11 lg:w-12 lg:h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${primaryColor}15` }}>
                                        <BarChart2 className="w-5 h-5 lg:w-6 lg:h-6" style={{ color: primaryColor }} />
                                    </div>
                                    <div className="flex-1 min-w-0 mt-0.5">
                                        <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1">{t("Manage Daily Sales")}</h4>
                                        <p className="text-xs lg:text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed ltr:pr-1 rtl:pl-1">{t("Return to orders, transactions and sales receipts.")}</p>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-gray-800 p-4 lg:p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex items-start rtl:space-x-reverse space-x-3.5 lg:space-x-4">
                                    <div className="w-11 h-11 lg:w-12 lg:h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${primaryColor}15` }}>
                                        <Package className="w-5 h-5 lg:w-6 lg:h-6" style={{ color: primaryColor }} />
                                    </div>
                                    <div className="flex-1 min-w-0 mt-0.5">
                                        <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1">{t("Stock & Inventory")}</h4>
                                        <p className="text-xs lg:text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed ltr:pr-1 rtl:pl-1">{t("Continue tracking product quantities and alerts.")}</p>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-gray-800 p-4 lg:p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex items-start rtl:space-x-reverse space-x-3.5 lg:space-x-4">
                                    <div className="w-11 h-11 lg:w-12 lg:h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${primaryColor}15` }}>
                                        <Users className="w-5 h-5 lg:w-6 lg:h-6" style={{ color: primaryColor }} />
                                    </div>
                                    <div className="flex-1 min-w-0 mt-0.5">
                                        <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1">{t("Stay Connected")}</h4>
                                        <p className="text-xs lg:text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed ltr:pr-1 rtl:pl-1">{t("Return to your cashier stations and team.")}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="text-center">
                                <div className="w-10 h-0.5 mx-auto mb-3 rounded-full" style={{ backgroundColor: primaryColor }}></div>
                                <span className="text-xs lg:text-sm text-gray-500 dark:text-gray-400">{t("One secure account. Everything your business needs.")}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Side Trust / Security Badge */}
                <div className="w-full text-center text-gray-400 dark:text-gray-500 text-xs sm:text-sm z-10 pt-2">
                    <span className="inline-flex items-center gap-2 opacity-80">
                        <ShieldCheck className="w-4 h-4" style={{ color: primaryColor }} />
                        {t("Encrypted & Secure Retail Cloud POS Platform")}
                    </span>
                </div>

                {/* Decorative Background Elements */}
                <div className="absolute top-0 ltr:right-0 rtl:left-0 ltr:-mt-20 rtl:-mt-20 ltr:-mr-20 rtl:-ml-20 w-[600px] h-[600px] rounded-full mix-blend-multiply opacity-10 blur-3xl pointer-events-none" style={{ backgroundColor: primaryColor }}></div>

                <div className="absolute top-12 ltr:right-24 rtl:left-24 opacity-20 pointer-events-none">
                    <svg width="80" height="80" fill="none" viewBox="0 0 80 80">
                        <pattern id="dots" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
                            <circle cx="2" cy="2" r="2" fill="currentColor" style={{ color: primaryColor }} />
                        </pattern>
                        <rect x="0" y="0" width="80" height="80" fill="url(#dots)" />
                    </svg>
                </div>

                <div className="absolute bottom-0 ltr:left-0 rtl:right-0 ltr:-mb-20 rtl:-mb-20 ltr:-ml-20 rtl:-mr-20 w-[400px] h-[400px] rounded-full mix-blend-multiply opacity-[0.05] blur-3xl pointer-events-none" style={{ backgroundColor: primaryColor }}></div>

                <div className="absolute bottom-0 ltr:right-0 rtl:left-0 ltr:-mb-20 rtl:-mb-20 ltr:-mr-20 rtl:-ml-20 w-[400px] h-[400px] rounded-full mix-blend-multiply opacity-[0.05] blur-3xl pointer-events-none" style={{ backgroundColor: primaryColor }}></div>

                <div className="absolute bottom-12 ltr:left-24 rtl:right-24 opacity-20 pointer-events-none">
                    <svg width="48" height="48" fill="none" viewBox="0 0 48 48">
                        <pattern id="dots-bl" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
                            <circle cx="2" cy="2" r="2" fill="currentColor" style={{ color: primaryColor }} />
                        </pattern>
                        <rect x="0" y="0" width="48" height="48" fill="url(#dots-bl)" />
                    </svg>
                </div>

                <div className="absolute bottom-12 ltr:right-24 rtl:left-24 opacity-20 pointer-events-none">
                    <svg width="48" height="48" fill="none" viewBox="0 0 48 48">
                        <pattern id="dots-br" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
                            <circle cx="2" cy="2" r="2" fill="currentColor" style={{ color: primaryColor }} />
                        </pattern>
                        <rect x="0" y="0" width="48" height="48" fill="url(#dots-br)" />
                    </svg>
                </div>
            </div>

            <CookieConsentBanner />
        </div>
    );
}