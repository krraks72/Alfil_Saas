import { useForm, router, usePage } from '@inertiajs/react';
import { Mail, Lock, Eye, EyeOff, Copy, ShieldCheck, Building2, User, Users } from 'lucide-react';
import { FormEventHandler, useState, useEffect } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from 'react-i18next';
import AuthLayout from '@/layouts/auth-layout';
import AuthButton from '@/components/auth/auth-button';
import Recaptcha, { executeRecaptcha } from '@/components/recaptcha';
import { useBrand } from '@/contexts/BrandContext';
import { THEME_COLORS } from '@/hooks/use-appearance';
import { toast } from '@/components/custom-toast';

type LoginForm = {
    email: string;
    password: string;
    remember: boolean;
    recaptcha_token?: string;
};

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function Login({ status, canResetPassword }: LoginProps) {
    const { t } = useTranslation();
    const [recaptchaToken, setRecaptchaToken] = useState<string>('');
    const [validationErrors, setValidationErrors] = useState<any>({});
    const { themeColor, customColor } = useBrand();
    const primaryColor = themeColor === 'custom' ? customColor : THEME_COLORS[themeColor as keyof typeof THEME_COLORS];
    const { props } = usePage();
    const { settings = {} } = props as any;
    const isDemo = (props as any).is_demo || false;
    const recaptchaEnabled = settings.recaptchaEnabled === 'true' || settings.recaptchaEnabled === true || settings.recaptchaEnabled === 1 || settings.recaptchaEnabled === '1';
    const registrationEnabled = settings.registrationEnabled === 'true' || settings.registrationEnabled === true || settings.registrationEnabled === 1 || settings.registrationEnabled === '1';
    const [showRecaptchaError, setShowRecaptchaError] = useState<boolean>(false);
    const [showPassword, setShowPassword] = useState<boolean>(false);

    const { data, setData, post, processing, errors, reset } = useForm<LoginForm>({
        email: '',
        password: '',
        remember: false,
    });

    // plan_expired comes back as a validation error key from CheckPlanAccess middleware
    const planExpiredMessage = (errors as any).plan_expired;
    const displayStatus = planExpiredMessage || status;
    const displayStatusType = planExpiredMessage ? 'error' : 'success';

    useEffect(() => {
        // Set default credentials if in demo mode
        if (isDemo) {
            setData({
                email: 'company@example.com',
                password: 'password',
                remember: false
            });
        }
    }, [isDemo]);

    const submit: FormEventHandler = async (e) => {
        e.preventDefault();

        // Check if reCAPTCHA is enabled and token is missing
        let tokenToSend = recaptchaToken;

        if (recaptchaEnabled) {
            try {
                const token = await executeRecaptcha();
                if (!token) {
                    setShowRecaptchaError(true);
                    return;
                }
                tokenToSend = token;
            } catch {
                setShowRecaptchaError(true);
                return;
            }
        }

        setShowRecaptchaError(false);
        setValidationErrors({});

        // Set recaptcha token in the form data before submitting
        setData('recaptcha_token', tokenToSend);

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    const handleCopyCredentials = (email: string) => {
        setData({
            ...data,
            email: email,
            password: 'password'
        });

        if (navigator.clipboard) {
            navigator.clipboard.writeText(email);
        }
    };

    return (
        <AuthLayout
            title={t("Welcome back!")}
            description={t("Sign in to continue to your account")}
            status={displayStatus}
            statusType={displayStatusType}
        >
            <form className="space-y-3 sm:space-y-4" onSubmit={submit}>
                <div className="space-y-4">
                    <div className="relative">
                        <Label htmlFor="email" className="text-gray-700 dark:text-gray-300 font-medium mb-2 block" required>{t("Email address")}</Label>
                        <div className="relative">
                            <div className="absolute inset-y-0 ltr:left-0 rtl:right-0 ltr:pl-3 rtl:pr-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                            </div>
                            <Input
                                id="email"
                                type="email"
                                required
                                autoFocus
                                tabIndex={1}
                                autoComplete="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                placeholder="company@example.com"
                                className="ltr:pl-10 rtl:pr-10 w-full border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg transition-all duration-200 text-gray-900 dark:text-white h-11"
                                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                            />
                        </div>
                        <InputError message={validationErrors.email || errors.email} />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <Label htmlFor="password" className="text-gray-700 dark:text-gray-300 font-medium" required>{t("Password")}</Label>
                            {canResetPassword && (
                                <TextLink
                                    href={route('password.request')}
                                    className="text-sm transition-colors duration-200 no-underline hover:underline hover:underline-primary"
                                    style={{ color: primaryColor }}
                                    tabIndex={5}
                                >
                                    {t("Forgot password?")}
                                </TextLink>
                            )}
                        </div>
                        <div className="relative">
                            <div className="absolute inset-y-0 ltr:left-0 rtl:right-0 ltr:pl-3 rtl:pr-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                            </div>
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                required
                                tabIndex={2}
                                autoComplete="current-password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                placeholder="••••••••••••"
                                className="ltr:pl-10 rtl:pr-10 ltr:pr-10 rtl:pl-10 w-full border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg transition-all duration-200 text-gray-900 dark:text-white h-11"
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
                        <InputError message={validationErrors.password || errors.password} />
                    </div>

                    <div className="flex items-center !mt-2.5 !mb-3">
                        <Checkbox
                            id="remember"
                            name="remember"
                            checked={data.remember}
                            onClick={() => setData('remember', !data.remember)}
                            tabIndex={3}
                            className="w-[14px] h-[14px] border border-gray-300 dark:border-gray-600 rounded"
                        />
                        <Label htmlFor="remember" className="ltr:ml-2 rtl:mr-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">{t("Remember me")}</Label>
                    </div>
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
                    tabIndex={4}
                    processing={processing}
                    className="w-full text-white py-2.5 text-sm font-medium tracking-wide transition-all duration-200 rounded-md shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                    style={{ backgroundColor: primaryColor }}
                >
                    {t("Login")}
                </AuthButton>

                {registrationEnabled && (
                    <div className="text-center">
                        <p className="text-sm text-gray-500 dark:text-gray-400">{t("Don't have an account?")}{' '}
                            <TextLink
                                href={route('register')}
                                className="font-medium hover:underline"
                                style={{ color: primaryColor }}
                                tabIndex={6}
                            >
                                {t("Sign up")}
                            </TextLink>
                        </p>
                    </div>
                )}

                {isDemo && (
                    <div className="mt-3 sm:mt-4 border-t border-gray-100/60 dark:border-gray-700 pt-3 sm:pt-4">
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
                            <div className="flex items-center mb-2 sm:mb-3">
                                <Users className="w-4 h-4 ltr:mr-2 rtl:ml-2" style={{ color: primaryColor }} />
                                <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">{t('Demo Login Credentials')}</h3>
                            </div>

                            <div className="w-full overflow-hidden rounded-lg border border-gray-100 dark:border-gray-700">
                                <table className="w-full text-xs sm:text-[13px] ltr:text-left rtl:text-right table-fixed">
                                    <thead style={{ backgroundColor: `${primaryColor}10` }}>
                                        <tr className="text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-gray-700">
                                            <th className="py-2 ltr:pl-3 rtl:pr-3 font-semibold w-[35%]">{t("Role")}</th>
                                            <th className="py-2 font-semibold w-[35%] truncate">{t("Email")}</th>
                                            <th className="py-2 font-semibold w-[20%]">{t("Password")}</th>
                                            <th className="py-2 ltr:pr-3 rtl:pl-3 w-[10%]"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100/80 dark:divide-gray-700">
                                        <tr>
                                            <td className="py-2 ltr:pl-3 rtl:pr-3">
                                                <div className="flex items-center">
                                                    <div className="hidden sm:flex w-5 h-5 rounded-full bg-green-50 dark:bg-green-900/30 items-center justify-center ltr:mr-2 rtl:ml-2 flex-shrink-0">
                                                        <ShieldCheck className="w-3 h-3" style={{ color: primaryColor }} />
                                                    </div>
                                                    <span className="font-medium text-gray-900 dark:text-gray-100 truncate">{t("Super Admin")}</span>
                                                </div>
                                            </td>
                                            <td className="py-2 text-gray-600 dark:text-gray-300 truncate ltr:pr-2 rtl:pl-2" title="superadmin@example.com">superadmin@example.com</td>
                                            <td className="py-2 text-gray-600 dark:text-gray-300 truncate font-mono text-sm">password</td>
                                            <td className="py-2 ltr:pr-3 rtl:pl-3 ltr:text-right rtl:text-left">
                                                <button type="button" onClick={() => handleCopyCredentials('superadmin@example.com')} className="inline-flex items-center justify-center rounded p-1.5 transition-colors cursor-pointer hover:opacity-80" style={{ backgroundColor: `${primaryColor}15` }} title={t("Copy credentials")}>
                                                    <Copy className="w-3.5 h-3.5" style={{ color: primaryColor }} />
                                                </button>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="py-2 ltr:pl-3 rtl:pr-3">
                                                <div className="flex items-center">
                                                    <div className="hidden sm:flex w-5 h-5 rounded-full bg-green-50 dark:bg-green-900/30 items-center justify-center ltr:mr-2 rtl:ml-2 flex-shrink-0">
                                                        <Building2 className="w-3 h-3" style={{ color: primaryColor }} />
                                                    </div>
                                                    <span className="font-medium text-gray-900 dark:text-gray-100 truncate">{t("Company")}</span>
                                                </div>
                                            </td>
                                            <td className="py-2 text-gray-600 dark:text-gray-300 truncate ltr:pr-2 rtl:pl-2" title="company@example.com">company@example.com</td>
                                            <td className="py-2 text-gray-600 dark:text-gray-300 truncate font-mono text-sm">password</td>
                                            <td className="py-2 ltr:pr-3 rtl:pl-3 ltr:text-right rtl:text-left">
                                                <button type="button" onClick={() => handleCopyCredentials('company@example.com')} className="inline-flex items-center justify-center rounded p-1.5 transition-colors cursor-pointer hover:opacity-80" style={{ backgroundColor: `${primaryColor}15` }} title={t("Copy credentials")}>
                                                    <Copy className="w-3.5 h-3.5" style={{ color: primaryColor }} />
                                                </button>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="py-2 ltr:pl-3 rtl:pr-3">
                                                <div className="flex items-center">
                                                    <div className="hidden sm:flex w-5 h-5 rounded-full bg-blue-50 dark:bg-blue-900/30 items-center justify-center ltr:mr-2 rtl:ml-2 flex-shrink-0">
                                                        <User className="w-3 h-3" style={{ color: primaryColor }} />
                                                    </div>
                                                    <span className="font-medium text-gray-900 dark:text-gray-100 truncate">{t("Manager")}</span>
                                                </div>
                                            </td>
                                            <td className="py-2 text-gray-600 dark:text-gray-300 truncate ltr:pr-2 rtl:pl-2" title="manager@example.com">manager@example.com</td>
                                            <td className="py-2 text-gray-600 dark:text-gray-300 truncate font-mono text-sm">password</td>
                                            <td className="py-2 ltr:pr-3 rtl:pl-3 ltr:text-right rtl:text-left">
                                                <button type="button" onClick={() => handleCopyCredentials('manager@example.com')} className="inline-flex items-center justify-center rounded p-1.5 transition-colors cursor-pointer hover:opacity-80" style={{ backgroundColor: `${primaryColor}15` }} title={t("Copy credentials")}>
                                                    <Copy className="w-3.5 h-3.5" style={{ color: primaryColor }} />
                                                </button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </form>
        </AuthLayout>
    );
}