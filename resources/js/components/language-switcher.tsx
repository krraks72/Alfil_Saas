import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ReactCountryFlag from 'react-country-flag';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Globe, Plus, Settings } from 'lucide-react';
import { usePage, router } from '@inertiajs/react';
import { hasRole } from '@/utils/authorization';
import { CreateLanguageModal } from '@/components/create-language-modal';
import { useLayout } from '@/contexts/LayoutContext';
import { isDemoMode, setCookie, getCookie } from '@/utils/cookie-utils';

interface Language {
    code: string;
    name: string;
    countryCode: string;
    enabled?: boolean;
}

export const LanguageSwitcher: React.FC = () => {
    const { t, i18n } = useTranslation();
    const { auth, globalSettings,languages = [], userLanguage } = usePage().props as any;
    const { updatePosition } = useLayout();
    const [showCreateModal, setShowCreateModal] = useState(false);

    const availableLanguages = globalSettings?.availableLanguages || [];

    // useEffect(() => {
    //     const languages = (availableLanguages || []).filter((l: any) => l.enabled !== false);
        
    //     // Determine the active language
    //     let activeLanguageCode = i18n.language;
        
    //     if (isDemoMode()) {
    //         // In demo mode, prioritize cookie
    //         const cookieLang = getCookie('app_language');
    //         if (cookieLang) {
    //             activeLanguageCode = cookieLang;
    //         }
    //     } else {
    //         // In regular mode, prioritize userLanguage from server
    //         if (userLanguage) {
    //             activeLanguageCode = userLanguage;
    //         }
    //     }
        
    //     // Find and set the current language
    //     const lang = languages.find((l: Language) => l.code === activeLanguageCode) || languages[0];
    //     setCurrentLanguage(lang);
        
    //     // Sync i18n if different
    //     if (i18n.language !== activeLanguageCode) {
    //         i18n.changeLanguage(activeLanguageCode);
    //     }
    // }, [i18n.language, availableLanguages, userLanguage]);

    const enabledLanguages = React.useMemo(() =>
        languages.filter((lang: Language) => lang.enabled !== false),
        [languages]
    );

    const currentLanguage = React.useMemo(() =>
        enabledLanguages.find((lang: Language) => lang.code === i18n.language) || enabledLanguages[0],
        [i18n.language, enabledLanguages]
    );

    React.useEffect(() => {
        if (userLanguage && i18n.language !== userLanguage) {
            i18n.changeLanguage(userLanguage);
        }
    }, [userLanguage, i18n]);

    const isAuthenticated = auth?.user;
    const userRoles = auth?.user?.roles?.map((role: any) => role.name) || [];
const userType = auth?.user?.type;
const isSuperAdmin = isAuthenticated && (hasRole('superadmin', userRoles) || userType === 'superadmin');
    
    // Allow company users to manage languages when not in SaaS mode
    const isCompanyUser = userRoles.includes('company');

    // RTL languages list
    const rtlLanguages = ['ar', 'he'];

    const handleLanguageChange = async (languageCode: string) => {
        const lang = availableLanguages.find((l: Language) => l.code === languageCode);
        if (lang) {
            try {
                await i18n.changeLanguage(languageCode);

                const isRtl = rtlLanguages.includes(languageCode);
                const newDirection = isRtl ? 'right' : 'left';

                // Always keep document direction as LTR to prevent sidebar issues
                document.documentElement.dir = 'ltr';
                document.documentElement.setAttribute('dir', 'ltr');

                const currentPath = window.location.pathname;
                const authPages = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email'];
                if (authPages.some(page => currentPath.includes(page))) {
                    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
                    document.documentElement.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
                    document.body.dir = isRtl ? 'rtl' : 'ltr';
                }

                // Update layout position through context
                updatePosition(newDirection as 'left' | 'right');

                // Save language and layout preferences
                if (isDemoMode()) {
                    // Demo mode: store in cookies
                    setCookie('app_language', languageCode);
                    setCookie('layoutPosition', newDirection);
                    setCookie('layoutDirection', newDirection);
                } else {
                    // Save to localStorage for i18next persistence
                    if (typeof localStorage !== 'undefined') {
                        localStorage.setItem('i18nextLng', languageCode);
                    }
                }

                // Save language change for authenticated non-demo users
                if (isAuthenticated && !isDemoMode()) {
                    router.post(route('languages.change'), {
                        language: languageCode
                    }, {
                        preserveScroll: true,
                        onSuccess: () => {
                            // Reload to get fresh userLanguage from server
                            router.reload({ only: ['userLanguage', 'globalSettings'] });
                        },
                        onError: (errors) => {

                        }
                    });
                }

                // Dispatch events for layout update
                window.dispatchEvent(new CustomEvent('languageChanged', {
                    detail: { language: languageCode, direction: newDirection }
                }));

                window.dispatchEvent(new Event('resize'));
            } catch (error) {

            }
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 rounded-md border shadow-sm bg-white">
                    <Globe className="h-4 w-4" />
                            <span className="text-sm font-medium hidden md:inline-block">
                                {currentLanguage.name}
                            </span>
                            <ReactCountryFlag
                                countryCode={currentLanguage.countryCode}
                                svg
                                style={{
                                    width: '1.2em',
                                    height: '1.2em',
                                }}
                            />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuGroup>
                    <div className="max-h-48 overflow-y-auto">
                        {(availableLanguages || []).filter((language: any) => language.enabled !== false).map((language: Language) => (
                            <DropdownMenuItem
                                key={language.code}
                                onClick={() => handleLanguageChange(language.code)}
                                className={`flex items-center gap-2 ${currentLanguage?.code === language.code ? 'bg-accent' : ''}`}
                            >
                                <ReactCountryFlag
                                    countryCode={language.countryCode}
                                    svg
                                    style={{
                                        width: '1.2em',
                                        height: '1.2em',
                                    }}
                                />
                                <span>{language.name}</span>
                            </DropdownMenuItem>
                        ))}
                    </div>
                </DropdownMenuGroup>
                {isSuperAdmin && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() => setShowCreateModal(true)}
                            className="justify-center text-primary font-semibold cursor-pointer"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            {t('Create Language')}
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="justify-center text-primary font-semibold cursor-pointer">
                            <a href={route('manage-language')} rel="noopener noreferrer">
                                <Settings className="h-4 w-4 mr-2" />
                                {t('Manage Language')}
                            </a>
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
            <CreateLanguageModal
                open={showCreateModal}
                onOpenChange={setShowCreateModal}
                onSuccess={() => setShowCreateModal(false)}
            />
        </DropdownMenu>
    );
};