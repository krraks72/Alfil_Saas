import { PageTemplate } from '@/components/page-template';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { type NavItem } from '@/types';
import { useEffect, useRef, useState } from 'react';
import { User, Lock, Camera } from 'lucide-react';
import { useForm, usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';
import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import { getImagePath } from '@/utils/helpers';
import { toast } from '@/components/custom-toast';


const sidebarNavItems = (t:any) => [
  {
    title: t('Profile'),
    href: '#profile',
    icon: <User className="h-4 w-4 mr-2" />,
  },
  {
    title: t('Password'),
    href: '#password',
    icon: <Lock className="h-4 w-4 mr-2" />,
  }
];

export default function ProfileSettings({ mustVerifyEmail, status }: { mustVerifyEmail?: boolean; status?: string }) {
  const { t } = useTranslation();
  const { auth, globalSettings } = usePage<SharedData>().props as any;
  const [activeSection, setActiveSection] = useState('profile');

  // Refs for each section
  const profileRef = useRef<HTMLDivElement>(null);
  const passwordRef = useRef<HTMLDivElement>(null);

  // Password form refs
  const passwordInput = useRef<HTMLInputElement>(null);
  const currentPasswordInput = useRef<HTMLInputElement>(null);

  // Profile form
  const { data: profileData, setData: setProfileData, post: profilePost, errors: profileErrors, processing: profileProcessing, recentlySuccessful: profileRecentlySuccessful } = useForm({
    name: auth?.user?.name || '',
    email: auth?.user?.email || '',
    avatar: null as File | null,
    _method: 'PATCH',
  });

  // Password form
  const { data: passwordData, setData: setPasswordData, errors: passwordErrors, put: passwordPut, reset: passwordReset, processing: passwordProcessing, recentlySuccessful: passwordRecentlySuccessful } = useForm({
    current_password: '',
    password: '',
    password_confirmation: '',
  });

  // Handle profile form submission
  const submitProfile = (e: React.FormEvent) => {
    e.preventDefault();
    profilePost(route('profile.update'), {
      preserveScroll: true,
      forceFormData: true,
      onSuccess: (page) => {
        if (page.props.flash?.error) {
          toast.error(page.props.flash.error);
        } else {
          setProfileData('avatar', null);
          toast.success(t('Profile Information successfully updated'));
        }
      },
    });
  };


  // Handle avatar file selection
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileData('avatar', file);
    }
  };

  // Get avatar URL
  const getAvatarUrl = () => {
    if (profileData.avatar) return URL.createObjectURL(profileData.avatar);
    if (auth?.avatar) return auth?.avatar;
    return getImagePath('avatars/avatar.png');
  };

  // Handle password form submission
  const updatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    passwordPut(route('password.update'), {
      preserveScroll: true,
      onSuccess: () => passwordReset(),
      onError: (errors) => {
        if (errors.password) {
          passwordReset('password', 'password_confirmation');
          passwordInput.current?.focus();
        }
        if (errors.current_password) {
          passwordReset('current_password');
          currentPasswordInput.current?.focus();
        }
      },
    });
  };

  // Smart scroll functionality
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100; // Add offset for better UX

      // Get positions of each section
      const profilePosition = profileRef.current?.offsetTop || 0;
      const passwordPosition = passwordRef.current?.offsetTop || 0;

      // Determine active section based on scroll position
      if (scrollPosition >= passwordPosition) {
        setActiveSection('password');
      } else {
        setActiveSection('profile');
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
    }
  };

  return (
    <PageTemplate
      title={t("Profile Settings")}
      url="/profile"
      description={t("Manage your profile settings")}
    >
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* Sidebar Navigation: Horizontal scroll on mobile (< lg), sticky vertical list on desktop (>= lg) */}
        <div className="w-full lg:w-64 shrink-0">
          <div className="lg:sticky lg:top-20">
            <div className="bg-card text-card-foreground p-2 lg:p-3 rounded-lg border shadow-sm flex flex-row lg:flex-col gap-1.5 lg:gap-2 overflow-x-auto lg:overflow-x-visible scrollbar-none">
              {sidebarNavItems(t).map((item) => (
                <Button
                  key={item.href}
                  variant="ghost"
                  className={cn('shrink-0 lg:shrink w-auto lg:w-full justify-start text-xs sm:text-sm whitespace-nowrap px-3 py-2 transition-colors', {
                    'bg-muted font-semibold': activeSection === item.href.replace('#', ''),
                  })}
                  onClick={() => handleNavClick(item.href)}
                >
                  {item.icon}
                  {item.title}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-6 lg:space-y-8">
          {/* Profile Section */}
          <section id="profile" ref={profileRef} className="scroll-mt-24">
            <Card className="shadow-sm">
              <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
                <CardTitle className="text-base sm:text-lg font-semibold">{t("Profile Information")}</CardTitle>
                <CardDescription className="text-xs sm:text-sm">{t("Update your account's profile information and email address")}</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-2 sm:pt-4">
                <form id="profile-form" onSubmit={submitProfile} className="space-y-6">
                  {/* Avatar Upload Section */}
                  <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:gap-6">
                    <Avatar className="h-16 w-16 sm:h-20 sm:w-20 shrink-0">
                      <AvatarImage
                        src={getAvatarUrl()}
                        alt={auth?.user?.name || 'Avatar'}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = getImagePath('avatars/avatar.png');
                        }}
                      />
                      <AvatarFallback className="text-base sm:text-lg font-semibold">
                        {auth?.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="avatar" className="cursor-pointer inline-flex items-center justify-center sm:justify-start px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md font-medium text-xs sm:text-sm transition-colors w-fit">
                        <Camera className="h-4 w-4 mr-2" />
                        {t("Change Avatar")}
                      </Label>
                      <Input
                        id="avatar"
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                      <p className="text-xs text-muted-foreground">
                        {t("JPG, PNG, GIF up to 2MB")}
                      </p>
                    </div>
                  </div>
                  <InputError className="mt-2" message={profileErrors.avatar} />

                  <div className="grid gap-2 min-w-0">
                    <Label required htmlFor="name">{t("Name")}</Label>
                    <Input
                      id="name"
                      className="mt-1 block w-full text-sm"
                      value={profileData.name}
                      onChange={(e) => setProfileData('name', e.target.value)}
                      autoComplete="name"
                      placeholder={t("Full name")}
                    />
                    <InputError message={profileErrors.name} />
                  </div>

                  <div className="grid gap-2 min-w-0">
                    <Label required htmlFor="email">{t("Email address")}</Label>
                    <Input
                      id="email"
                      type="email"
                      className="mt-1 block w-full text-sm"
                      value={profileData.email}
                      onChange={(e) => setProfileData('email', e.target.value)}
                      autoComplete="username"
                      placeholder={t("Email address")}
                    />
                    <InputError message={profileErrors.email} />
                  </div>

                  {mustVerifyEmail && auth?.user?.email_verified_at === null && (
                    <div>
                      <p className="text-muted-foreground text-xs sm:text-sm">
                        {t("Your email address is unverified.")}{' '}
                        <button
                          type="button"
                          onClick={() => route('verification.send')}
                          className="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current dark:decoration-neutral-500 font-medium"
                        >
                          {t("Click here to resend the verification email.")}
                        </button>
                      </p>

                      {status === 'verification-link-sent' && (
                        <div className="mt-2 text-xs sm:text-sm font-medium text-green-600">
                          {t("A new verification link has been sent to your email address.")}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-4">
                    <Button disabled={profileProcessing && !globalSettings?.is_demo} className="w-full sm:w-auto">
                      {t("Save")}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </section>

          {/* Password Section */}
          <section id="password" ref={passwordRef} className="scroll-mt-24">
            <Card className="shadow-sm">
              <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
                <CardTitle className="text-base sm:text-lg font-semibold">{t("Update Password")}</CardTitle>
                <CardDescription className="text-xs sm:text-sm">{t("Ensure your account is using a long, random password to stay secure")}</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-2 sm:pt-4">
                <form id="password-form" onSubmit={updatePassword} className="space-y-6">
                  <div className="grid gap-2 min-w-0">
                    <Label required htmlFor="current_password">{t("Current password")}</Label>
                    <Input
                      id="current_password"
                      ref={currentPasswordInput}
                      value={passwordData.current_password}
                      onChange={(e) => setPasswordData('current_password', e.target.value)}
                      type="password"
                      className="mt-1 block w-full text-sm"
                      autoComplete="current-password"
                      placeholder="Current password"
                    />
                    <InputError message={passwordErrors.current_password} />
                  </div>

                  <div className="grid gap-2 min-w-0">
                    <Label required htmlFor="password">{t("New password")}</Label>
                    <Input
                      id="password"
                      ref={passwordInput}
                      value={passwordData.password}
                      onChange={(e) => setPasswordData('password', e.target.value)}
                      type="password"
                      className="mt-1 block w-full text-sm"
                      autoComplete="new-password"
                      placeholder="New password"
                    />
                    <InputError message={passwordErrors.password} />
                  </div>

                  <div className="grid gap-2 min-w-0">
                    <Label required htmlFor="password_confirmation">{t("Confirm password")}</Label>
                    <Input
                      id="password_confirmation"
                      value={passwordData.password_confirmation}
                      onChange={(e) => setPasswordData('password_confirmation', e.target.value)}
                      type="password"
                      className="mt-1 block w-full text-sm"
                      autoComplete="new-password"
                      placeholder="Confirm password"
                    />
                    <InputError message={passwordErrors.password_confirmation} />
                  </div>

                  <div className="flex items-center gap-4">
                    <Button disabled={passwordProcessing && !globalSettings?.is_demo} className="w-full sm:w-auto">
                      {t("Save")}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </PageTemplate>
  );
}
