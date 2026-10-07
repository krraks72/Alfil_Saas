import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useState, useEffect } from 'react';
import { Save, Download } from 'lucide-react';
import { SettingsSection } from '@/components/settings-section';
import { useTranslation } from 'react-i18next';
import { router, usePage } from '@inertiajs/react';
import { toast } from '@/components/custom-toast';
import { Card } from '@/components/ui/card';

interface CookieSettingsProps {
  settings?: Record<string, string>;
}

export default function CookieSettings({ settings = {} }: CookieSettingsProps) {
  const { t } = useTranslation();
  const pageProps = usePage().props as any;
  
  const settingsData = Object.keys(settings).length > 0 ? settings : (pageProps.settings || {});
  
  const [cookieSettings, setCookieSettings] = useState(() => ({
    enableLogging: settingsData.enableLogging === '1' || settingsData.enableLogging === true || false,
    strictlyNecessaryCookies: settingsData.strictlyNecessaryCookies === '1' || settingsData.strictlyNecessaryCookies === true || false,
    cookieTitle: settingsData.cookieTitle || 'Cookie Consent',
    cookieDescription: settingsData.cookieDescription || 'We use cookies to enhance your browsing experience and provide personalized content.',
    strictlyCookieTitle: settingsData.strictlyCookieTitle || 'Strictly Necessary Cookies',
    strictlyCookieDescription: settingsData.strictlyCookieDescription || 'These cookies are essential for the website to function properly.',
    contactUsDescription: settingsData.contactUsDescription || 'If you have any questions about our cookie policy, please contact us.',
    contactUsUrl: settingsData.contactUsUrl || 'https://example.com/contact'
  }));
  
  useEffect(() => {
    if (Object.keys(settingsData).length > 0) {
      setCookieSettings(prevSettings => ({
        ...prevSettings,
        enableLogging: settingsData.enableLogging === '1' || settingsData.enableLogging === true || false,
        strictlyNecessaryCookies: settingsData.strictlyNecessaryCookies === '1' || settingsData.strictlyNecessaryCookies === true || false,
        cookieTitle: settingsData.cookieTitle || 'Cookie Consent',
        cookieDescription: settingsData.cookieDescription || 'We use cookies to enhance your browsing experience and provide personalized content.',
        strictlyCookieTitle: settingsData.strictlyCookieTitle || 'Strictly Necessary Cookies',
        strictlyCookieDescription: settingsData.strictlyCookieDescription || 'These cookies are essential for the website to function properly.',
        contactUsDescription: settingsData.contactUsDescription || 'If you have any questions about our cookie policy, please contact us.',
        contactUsUrl: settingsData.contactUsUrl || 'https://example.com/contact'
      }));
    }
  }, [settingsData]);

  const handleCookieSettingsChange = (field: string, value: string | boolean) => {
    setCookieSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const submitCookieSettings = (e: React.FormEvent) => {
    e.preventDefault();
    
    router.post(route('settings.cookie.update'), cookieSettings, {
      preserveScroll: true,
      onSuccess: (page) => {
        const successMessage = page.props.flash?.success;
        const errorMessage = page.props.flash?.error;
        
        if (successMessage) {
          toast.success(successMessage);
        } else if (errorMessage) {
          toast.error(errorMessage);
        }
      },
      onError: (errors) => {
        const errorMessage = errors.error || Object.values(errors).join(', ') || t('Failed to update cookie settings');
        toast.error(errorMessage);
      }
    });
  };

  const downloadCookieData = () => {
    window.location.href = route('cookie.consent.download');
  };

  return (
    <SettingsSection
      title={t("Cookie Settings")}
      description={t("Configure cookie consent and privacy settings for your application")}
      action={
        <Button type="submit" form="cookie-settings-form" size="sm">
          <Save className="h-4 w-4 mr-2" />
          {t("Save Changes")}
        </Button>
      }
    >
      <Card>
      <div className='p-6 pt-0 mt-6'>
      <form id="cookie-settings-form" onSubmit={submitCookieSettings} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-0.5">
              <Label htmlFor="enableLogging">{t("Enable Cookie Activity Logging")}</Label>
              <p className="text-sm text-muted-foreground">
                {t("Enable cookie activity logging")}
              </p>
            </div>
            <Switch
              id="enableLogging"
              checked={cookieSettings.enableLogging}
              onCheckedChange={(checked) => handleCookieSettingsChange('enableLogging', checked)}
            />
          </div>

          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-0.5">
              <Label htmlFor="strictlyNecessaryCookies">{t("Strictly Necessary Cookies")}</Label>
              <p className="text-sm text-muted-foreground">
                {t("Enable strictly necessary cookies")}
              </p>
            </div>
            <Switch
              id="strictlyNecessaryCookies"
              checked={cookieSettings.strictlyNecessaryCookies}
              onCheckedChange={(checked) => handleCookieSettingsChange('strictlyNecessaryCookies', checked)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label required htmlFor="cookieTitle">{t("Cookie Title")}</Label>
            <Input
            required
              id="cookieTitle"
              type="text"
              value={cookieSettings.cookieTitle}
              onChange={(e) => handleCookieSettingsChange('cookieTitle', e.target.value)}
              placeholder={t("Enter the main cookie consent title")}
            />
          </div>

          <div className="grid gap-2">
            <Label required htmlFor="strictlyCookieTitle">{t("Strictly Cookie Title")}</Label>
            <Input
            required
              id="strictlyCookieTitle"
              type="text"
              value={cookieSettings.strictlyCookieTitle}
              onChange={(e) => handleCookieSettingsChange('strictlyCookieTitle', e.target.value)}
              placeholder={t("Enter the strictly necessary cookies title")}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label required htmlFor="cookieDescription">{t("Cookie Description")}</Label>
            <Textarea
            required
              id="cookieDescription"
              value={cookieSettings.cookieDescription}
              onChange={(e) => handleCookieSettingsChange('cookieDescription', e.target.value)}
              placeholder={t("Enter the cookie consent description")}
              rows={4}
            />
          </div>

          <div className="grid gap-2">
            <Label required htmlFor="strictlyCookieDescription">{t("Strictly Cookie Description")}</Label>
            <Textarea
            required
              id="strictlyCookieDescription"
              value={cookieSettings.strictlyCookieDescription}
              onChange={(e) => handleCookieSettingsChange('strictlyCookieDescription', e.target.value)}
              placeholder={t("Enter the strictly necessary cookies description")}
              rows={4}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label required htmlFor="contactUsDescription">{t("Contact Us Description")}</Label>
            <Textarea
            required
              id="contactUsDescription"
              value={cookieSettings.contactUsDescription}
              onChange={(e) => handleCookieSettingsChange('contactUsDescription', e.target.value)}
              placeholder={t("Enter the contact us description for cookie inquiries")}
              rows={3}
            />
          </div>

          <div className="grid gap-2">
            <Label required htmlFor="contactUsUrl">{t("Contact Us URL")}</Label>
            <Input
            required
              id="contactUsUrl"
              type="url"
              value={cookieSettings.contactUsUrl}
              onChange={(e) => handleCookieSettingsChange('contactUsUrl', e.target.value)}
              placeholder={t("Enter the contact us URL for cookie inquiries")}
            />
          </div>
        </div>

        <div className="pt-4 border-t">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="text-sm font-medium">{t("Download Accepted Cookies")}</h4>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {t("Download a CSV file of accepted cookie preferences")}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={downloadCookieData}
              className="w-full sm:w-auto h-10 sm:h-9 shrink-0 flex items-center justify-center gap-2"
            >
              <Download className="h-4 w-4" />
              <span>{t("Download CSV")}</span>
            </Button>
          </div>
        </div>
      </form>
      </div>
      </Card>
    </SettingsSection>
  );
}