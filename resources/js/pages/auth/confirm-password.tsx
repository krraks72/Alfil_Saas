import { useForm } from '@inertiajs/react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from 'react-i18next';
import AuthLayout from '@/layouts/auth-layout';
import AuthButton from '@/components/auth/auth-button';
import { useBrand } from '@/contexts/BrandContext';
import { THEME_COLORS } from '@/hooks/use-appearance';

export default function ConfirmPassword() {
    const { t } = useTranslation();
    const { themeColor, customColor } = useBrand();
    const primaryColor = themeColor === 'custom' ? customColor : THEME_COLORS[themeColor as keyof typeof THEME_COLORS];
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const { data, setData, post, processing, errors, reset } = useForm<Required<{ password: string }>>({
        password: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('password.confirm'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <AuthLayout
            title={t("Confirm your password")}
            description={t("This is a secure area of the application. Please confirm your password before continuing.")}
            icon={<Lock className="h-7 w-7" style={{ color: primaryColor }} />}
        >
            <form onSubmit={submit} className="space-y-4 sm:space-y-5">
                <div className="space-y-4">
                    <div className="relative">
                        <Label htmlFor="password" className="text-gray-700 dark:text-gray-300 font-medium mb-2 block" required>{t("Password")}</Label>
                        <div className="relative">
                            <div className="absolute inset-y-0 ltr:left-0 rtl:right-0 ltr:pl-3 rtl:pr-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                required
                                autoFocus
                                tabIndex={1}
                                autoComplete="current-password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                placeholder="••••••••"
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
                </div>

                <AuthButton 
                    tabIndex={2} 
                    processing={processing}
                    className="w-full text-white py-2.5 text-sm font-medium tracking-wide transition-all duration-200 rounded-md shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                    style={{ backgroundColor: primaryColor }}
                >
                    {t("Confirm Password")}
                </AuthButton>
            </form>
        </AuthLayout>
    );
}