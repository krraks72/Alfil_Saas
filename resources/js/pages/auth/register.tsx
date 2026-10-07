import { useForm, usePage } from '@inertiajs/react';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from 'react-i18next';
import AuthLayout from '@/layouts/auth-layout';
import AuthButton from '@/components/auth/auth-button';
import Recaptcha from '@/components/recaptcha';
import { useBrand } from '@/contexts/BrandContext';
import { THEME_COLORS } from '@/hooks/use-appearance';

type RegisterForm = {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    terms: boolean;
    recaptcha_token?: string;
    plan_id?: string;
    referral_code?: string;
};

export default function Register({ referralCode, planId }: { referralCode?: string; planId?: string }) {
    const { t } = useTranslation();
    const [recaptchaToken, setRecaptchaToken] = useState<string>('');
    const { themeColor, customColor } = useBrand();
    const primaryColor = themeColor === 'custom' ? customColor : THEME_COLORS[themeColor as keyof typeof THEME_COLORS];
    const { props } = usePage();
    const { settings = {} } = props as any;
    const recaptchaEnabled = settings.recaptchaEnabled === 'true' || settings.recaptchaEnabled === true || settings.recaptchaEnabled === 1 || settings.recaptchaEnabled === '1';
    const [showRecaptchaError, setShowRecaptchaError] = useState<boolean>(false);
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [showPasswordConfirmation, setShowPasswordConfirmation] = useState<boolean>(false);
    const { data, setData, post, processing, errors, reset } = useForm<RegisterForm>({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        terms: false,
        plan_id: planId,
        referral_code: referralCode,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        
        // Check if reCAPTCHA is enabled and token is missing
        if (recaptchaEnabled && !recaptchaToken) {
            setShowRecaptchaError(true);
            return;
        }
        
        setShowRecaptchaError(false);
        post(route('register'), {
            data: { ...data, recaptcha_token: recaptchaToken },
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <AuthLayout
            title={t("Create your account")}
            description={t("Enter your details below to get started")}
        >
            <form className="space-y-4 sm:space-y-5" onSubmit={submit}>
                <div className="space-y-4">
                    <div className="relative">
                        <Label htmlFor="name" className="text-gray-700 dark:text-gray-300 font-medium mb-2 block" required>{t("Full name")}</Label>
                        <div className="relative">
                            <div className="absolute inset-y-0 ltr:left-0 rtl:right-0 ltr:pl-3 rtl:pr-3 flex items-center pointer-events-none">
                                <User className="h-5 w-5 text-gray-400" />
                            </div>
                            <Input
                                id="name"
                                type="text"
                                required
                                autoFocus
                                tabIndex={1}
                                autoComplete="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder={t("Enter your full name")}
                                className="ltr:pl-10 rtl:pr-10 w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg transition-all duration-200 text-gray-900 dark:text-white h-11"
                                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                            />
                        </div>
                        <InputError message={errors.name} />
                    </div>

                    <div>
                        <Label htmlFor="email" className="text-gray-700 dark:text-gray-300 font-medium mb-2 block" required>{t("Email address")}</Label>
                        <div className="relative">
                            <div className="absolute inset-y-0 ltr:left-0 rtl:right-0 ltr:pl-3 rtl:pr-3 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-gray-400" />
                            </div>
                            <Input
                                id="email"
                                type="email"
                                required
                                tabIndex={2}
                                autoComplete="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                placeholder={t("Enter your email")}
                                className="ltr:pl-10 rtl:pr-10 w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg transition-all duration-200 text-gray-900 dark:text-white h-11"
                                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                            />
                        </div>
                        <InputError message={errors.email} />
                    </div>

                    <div>
                        <Label htmlFor="password" className="text-gray-700 dark:text-gray-300 font-medium mb-2 block" required>{t("Password")}</Label>
                        <div className="relative">
                            <div className="absolute inset-y-0 ltr:left-0 rtl:right-0 ltr:pl-3 rtl:pr-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                required
                                tabIndex={3}
                                autoComplete="new-password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                placeholder={t("Enter your password")}
                                className="ltr:pl-10 rtl:pr-10 ltr:pr-10 rtl:pl-10 w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg transition-all duration-200 text-gray-900 dark:text-white h-11"
                                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                            />
                            <div className="absolute inset-y-0 ltr:right-0 rtl:left-0 ltr:pr-3 rtl:pl-3 flex items-center">
                                <button type="button" tabIndex={-1} onClick={() => setShowPassword(!showPassword)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none cursor-pointer">
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                        </div>
                        <InputError message={errors.password} />
                    </div>

                    <div>
                        <Label htmlFor="password_confirmation" className="text-gray-700 dark:text-gray-300 font-medium mb-2 block" required>{t("Confirm password")}</Label>
                        <div className="relative">
                            <div className="absolute inset-y-0 ltr:left-0 rtl:right-0 ltr:pl-3 rtl:pr-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <Input
                                id="password_confirmation"
                                type={showPasswordConfirmation ? "text" : "password"}
                                required
                                tabIndex={4}
                                autoComplete="new-password"
                                value={data.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                placeholder={t("Confirm your password")}
                                className="ltr:pl-10 rtl:pr-10 ltr:pr-10 rtl:pl-10 w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg transition-all duration-200 text-gray-900 dark:text-white h-11"
                                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                            />
                            <div className="absolute inset-y-0 ltr:right-0 rtl:left-0 ltr:pr-3 rtl:pl-3 flex items-center">
                                <button type="button" tabIndex={-1} onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none cursor-pointer">
                                    {showPasswordConfirmation ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                        </div>
                        <InputError message={errors.password_confirmation} />
                    </div>

                    <div className="flex items-center !mt-4 !mb-5">
                        <Checkbox
                            id="terms"
                            checked={data.terms}
                            onClick={() => setData('terms', !data.terms)}
                            tabIndex={5}
                            className="w-[14px] h-[14px] border border-gray-300 dark:border-gray-600 rounded"
                            required
                        />
                        <Label htmlFor="terms" className="ltr:ml-2 rtl:mr-2 text-gray-600 dark:text-gray-400 text-sm cursor-pointer" required>
                            {t("I agree to the")}{' '}
                            <a 
                                href={settings.termsConditionsUrl || route('home')} 
                                target={settings.termsConditionsUrl ? "_blank" : "_self"}
                                rel={settings.termsConditionsUrl ? "noopener noreferrer" : undefined}
                                style={{ color: primaryColor }} 
                                className="hover:underline"
                            >
                                {t("Terms and Conditions")}
                            </a>
                        </Label>
                    </div>
                    <InputError message={errors.terms} />
                </div>

                <Recaptcha
                    onVerify={(token) => {
                        setRecaptchaToken(token);
                        setShowRecaptchaError(false);
                    }}
                    onExpired={() => setRecaptchaToken('')}
                    onError={() => setRecaptchaToken('')}
                />

                {showRecaptchaError && recaptchaEnabled && !recaptchaToken && (
                    <p className="text-sm text-red-600 dark:text-red-400 text-center -mt-2">
                        {t("Please complete the reCAPTCHA verification")}
                    </p>
                )}

                <AuthButton 
                    tabIndex={6} 
                    processing={processing}
                    className="w-full text-white py-2.5 text-sm font-medium tracking-wide transition-all duration-200 rounded-md shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                    style={{ backgroundColor: primaryColor }}
                >
                    {t("Create Account")}
                </AuthButton>

                <div className="text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t("Already have an account?")}{' '}
                        <TextLink 
                            href={route('login')} 
                            className="font-medium hover:underline" 
                            style={{ color: primaryColor }}
                            tabIndex={7}
                        >
                            {t("Sign in")}
                        </TextLink>
                    </p>
                </div>
            </form>
        </AuthLayout>
    );
}