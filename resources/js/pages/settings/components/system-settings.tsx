import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { SettingsSection } from '@/components/settings-section';
import { useTranslation } from 'react-i18next';
import { router, usePage } from '@inertiajs/react';
import { toast } from '@/components/custom-toast';
import languageData from '@/../../resources/lang/language.json';
import ReactCountryFlag from 'react-country-flag';
import { Card } from '@/components/ui/card';
interface SystemSettingsProps {
  settings?: Record<string, string>;
  timezones?: Record<string, string>;
  dateFormats?: Record<string, string>;
  timeFormats?: Record<string, string>;
  isCompanyUser?: boolean;
}

export default function SystemSettings({
  settings = {},
  timezones = {},
  dateFormats = {},
  timeFormats = {},
  isCompanyUser = false
}: SystemSettingsProps) {
  const { t } = useTranslation();
  const pageProps = usePage().props as any;

  // Default settings
  const defaultSettings = {
    defaultLanguage: 'en',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    calendarStartDay: 'sunday',
    defaultTimezone: 'UTC',
    emailVerification: false,
    landingPageEnabled: true,
    registrationEnabled: false,
    termsConditionsUrl: ''
  };

  // Combine settings from props and page props
  const settingsData = Object.keys(settings).length > 0
    ? settings
    : (pageProps.settings || {});

  // Initialize state with merged settings
  const [systemSettings, setSystemSettings] = useState(() => {
    return {
      defaultLanguage: settingsData.defaultLanguage || defaultSettings.defaultLanguage,
      dateFormat: settingsData.dateFormat || defaultSettings.dateFormat,
      timeFormat: settingsData.timeFormat || defaultSettings.timeFormat,
      calendarStartDay: settingsData.calendarStartDay || defaultSettings.calendarStartDay,
      defaultTimezone: settingsData.defaultTimezone || defaultSettings.defaultTimezone,
      emailVerification: settingsData.emailVerification === 'true' || settingsData.emailVerification === true || defaultSettings.emailVerification,
      landingPageEnabled: settingsData.landingPageEnabled === 'true' || settingsData.landingPageEnabled === true || settingsData.landingPageEnabled === '1' || (settingsData.landingPageEnabled === undefined ? defaultSettings.landingPageEnabled : false),
      registrationEnabled: settingsData.registrationEnabled === 'true' || settingsData.registrationEnabled === true || settingsData.registrationEnabled === '1',
      termsConditionsUrl: settingsData.termsConditionsUrl || defaultSettings.termsConditionsUrl
    }
  });

  // Update state when settings change
  useEffect(() => {
    if (Object.keys(settingsData).length > 0) {
      // Create merged settings object
      const mergedSettings = Object.keys(defaultSettings).reduce((acc, key) => {
        acc[key] = settingsData[key] || defaultSettings[key];
        return acc;
      }, {} as Record<string, string>);

      setSystemSettings(prevSettings => ({
        ...prevSettings,
        ...mergedSettings,
        emailVerification: mergedSettings.emailVerification === 'true' || mergedSettings.emailVerification === true || mergedSettings.emailVerification === '1',
        landingPageEnabled: mergedSettings.landingPageEnabled === 'true' || mergedSettings.landingPageEnabled === true || mergedSettings.landingPageEnabled === '1' || (mergedSettings.landingPageEnabled === undefined ? defaultSettings.landingPageEnabled : false),
        registrationEnabled: mergedSettings.registrationEnabled === 'true' || mergedSettings.registrationEnabled === true || mergedSettings.registrationEnabled === '1',
        termsConditionsUrl: mergedSettings.termsConditionsUrl || defaultSettings.termsConditionsUrl
      }));
    }
  }, [settingsData]);


  // Handle system settings form changes
  const handleSystemSettingsChange = (field: string, value: string | boolean) => {
    setSystemSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle system settings form submission
  const submitSystemSettings = (e: React.FormEvent) => {
    e.preventDefault();

    // Create clean settings object
    const cleanSettings: Record<string, any> = {
      defaultLanguage: systemSettings.defaultLanguage,
      dateFormat: systemSettings.dateFormat,
      timeFormat: systemSettings.timeFormat,
      calendarStartDay: systemSettings.calendarStartDay,
      defaultTimezone: systemSettings.defaultTimezone,
      termsConditionsUrl: systemSettings.termsConditionsUrl
    };

    // Only include email verification and landing page for non-company users
    if (!isCompanyUser) {
      cleanSettings.emailVerification = Boolean(systemSettings.emailVerification);
      cleanSettings.landingPageEnabled = Boolean(systemSettings.landingPageEnabled);
      cleanSettings.registrationEnabled = Boolean(systemSettings.registrationEnabled);
    }

    // Submit to backend using Inertia
    router.post(route('settings.system.update'), cleanSettings, {
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
        const errorMessage = errors.error || Object.values(errors).join(', ') || t('Failed to update system settings');
        toast.error(errorMessage);
      }
    });
  };

  return (
    <SettingsSection
      title={t("System Settings")}
      description={t("Configure system-wide settings for your application")}
      action={
        <Button type="submit" form="system-settings-form" size="sm">
          <Save className="h-4 w-4 mr-2" />
          {t("Save Changes")}
        </Button>
      }
    >
      <Card>
        <div className='p-6 pt-0 mt-6'>
          <form id="system-settings-form" onSubmit={submitSystemSettings} className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div className="grid gap-2 min-w-0">
                <Label htmlFor="defaultLanguage">{t("Default Language")}</Label>
                <Select
                  value={systemSettings.defaultLanguage}
                  onValueChange={(value) => handleSystemSettingsChange('defaultLanguage', value)}
                >
                  <SelectTrigger className="w-full min-w-0 overflow-hidden">
                    <SelectValue placeholder={t("Select language")}>
                      {systemSettings.defaultLanguage && (() => {
                        const selectedLang = languageData.find(lang => lang.code === systemSettings.defaultLanguage);
                        return selectedLang ? <div className="flex items-center space-x-2 truncate">
                          <ReactCountryFlag
                            countryCode={selectedLang.countryCode}
                            svg
                            style={{
                              width: '1.2em',
                              height: '1.2em',
                            }}
                            className="shrink-0"
                          /> <span className="truncate whitespace-nowrap">
                            {selectedLang.name}
                          </span> </div> : t("Select language");
                      })()}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {languageData.map((language) => (
                      <SelectItem key={language.code} value={language.code}>
                        <div className="flex items-center space-x-2 whitespace-nowrap">
                          <ReactCountryFlag
                            countryCode={language.countryCode}
                            svg
                            style={{
                              width: '1.2em',
                              height: '1.2em',
                            }}
                            className="shrink-0"
                          /> <span>
                            {language.name}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2 min-w-0">
                <Label htmlFor="dateFormat">{t("Date Format")}</Label>
                <Select
                  value={systemSettings.dateFormat}
                  onValueChange={(value) => handleSystemSettingsChange('dateFormat', value)}
                >
                  <SelectTrigger className="w-full min-w-0 overflow-hidden">
                    <SelectValue placeholder={t("Select date format")} className="whitespace-nowrap truncate block" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(dateFormats).length > 0 ?
                      Object.entries(dateFormats).map(([format, example]) => (
                        <SelectItem key={format} value={format}>
                          <div className="flex items-center justify-between w-full gap-2 whitespace-nowrap">
                            <span className="whitespace-nowrap">{format}</span>
                            <span className="text-muted-foreground text-sm ml-4 shrink-0 whitespace-nowrap">({example})</span>
                          </div>
                        </SelectItem>
                      )) : (
                        <>
                          <SelectItem value="M j, Y"><span className="whitespace-nowrap">Jan 1, 2025</span></SelectItem>
                          <SelectItem value="d-m-Y"><span className="whitespace-nowrap">01-01-2025</span></SelectItem>
                          <SelectItem value="Y-m-d"><span className="whitespace-nowrap">2025-01-01</span></SelectItem>
                          <SelectItem value="F j, Y"><span className="whitespace-nowrap">January 1, 2025</span></SelectItem>
                        </>
                      )
                    }
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2 min-w-0">
                <Label htmlFor="timeFormat">{t("Time Format")}</Label>
                <Select
                  value={systemSettings.timeFormat}
                  onValueChange={(value) => handleSystemSettingsChange('timeFormat', value)}
                >
                  <SelectTrigger className="w-full min-w-0 overflow-hidden">
                    <SelectValue placeholder={t("Select time format")} className="whitespace-nowrap truncate block" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(timeFormats).length > 0 ?
                      Object.entries(timeFormats).map(([format, example]) => (
                        <SelectItem key={format} value={format}>
                          <div className="flex items-center justify-between w-full gap-2 whitespace-nowrap">
                            <span className="whitespace-nowrap">{format}</span>
                            <span className="text-muted-foreground text-sm ml-4 shrink-0 whitespace-nowrap">({example})</span>
                          </div>
                        </SelectItem>
                      )) : (
                        <>
                          <SelectItem value="g:i A"><span className="whitespace-nowrap">1:30 PM</span></SelectItem>
                          <SelectItem value="H:i"><span className="whitespace-nowrap">13:30</span></SelectItem>
                          <SelectItem value="g:i a"><span className="whitespace-nowrap">1:30 pm</span></SelectItem>
                        </>
                      )
                    }
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="calendarStartDay">{t("Calendar Start Day")}</Label>
                <Select
                  value={systemSettings.calendarStartDay}
                  onValueChange={(value) => handleSystemSettingsChange('calendarStartDay', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("Select start day")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sunday">{t("Sunday")}</SelectItem>
                    <SelectItem value="monday">{t("Monday")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2 xl:col-span-2 min-w-0">
                <Label htmlFor="defaultTimezone">{t("Default Timezone")}</Label>
                <Select
                  value={systemSettings.defaultTimezone}
                  onValueChange={(value) => handleSystemSettingsChange('defaultTimezone', value)}
                >
                  <SelectTrigger className="w-full min-w-0 overflow-hidden">
                    <SelectValue placeholder={t("Select timezone")} className="whitespace-nowrap truncate block" />
                  </SelectTrigger>
                  <SelectContent searchable>
                    {Object.keys(timezones).length > 0 ?
                      Object.entries(timezones).map(([timezone, description]) => (
                        <SelectItem key={timezone} value={timezone}>
                          {description}
                        </SelectItem>
                      )) : (
                        <>
                          <SelectItem value="UTC">UTC</SelectItem>
                          <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                          <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                          <SelectItem value="Europe/London">London (GMT)</SelectItem>
                        </>
                      )
                    }
                  </SelectContent>
                </Select>
              </div>

              {!isCompanyUser && (
                <>
                  <div className="grid gap-2 xl:col-span-2 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-3 bg-muted/30 rounded-lg border border-border/50">
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <Label htmlFor="emailVerification" className="text-sm font-medium cursor-pointer">{t("Email Verification")}</Label>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {t("Require users to verify their email addresses")}
                        </p>
                      </div>
                      <Switch
                        id="emailVerification"
                        checked={systemSettings.emailVerification}
                        onCheckedChange={(checked) => handleSystemSettingsChange('emailVerification', checked)}
                        className="shrink-0"
                      />
                    </div>
                  </div>

                  <div className="grid gap-2 xl:col-span-2 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-3 bg-muted/30 rounded-lg border border-border/50">
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <Label htmlFor="landingPageEnabled" className="text-sm font-medium cursor-pointer">{t("Landing Page")}</Label>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {t("Enable or disable the public landing page")}
                        </p>
                      </div>
                      <Switch
                        id="landingPageEnabled"
                        checked={systemSettings.landingPageEnabled}
                        onCheckedChange={(checked) => handleSystemSettingsChange('landingPageEnabled', checked)}
                        className="shrink-0"
                      />
                    </div>
                  </div>
                  <div className="grid gap-2 xl:col-span-2 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-3 bg-muted/30 rounded-lg border border-border/50">
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <Label htmlFor="registrationEnabled" className="text-sm font-medium cursor-pointer">{t("User Registration")}</Label>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {t("Allow new users to register accounts")}
                        </p>
                      </div>
                      <Switch
                        id="registrationEnabled"
                        checked={systemSettings.registrationEnabled}
                        onCheckedChange={(checked) => handleSystemSettingsChange('registrationEnabled', checked)}
                        className="shrink-0"
                      />
                    </div>
                  </div>
                  <div className="grid gap-2 xl:col-span-2 min-w-0">
                    <Label htmlFor="termsConditionsUrl">{t("Terms & Conditions URL")}</Label>
                    <Input
                      id="termsConditionsUrl"
                      type="url"
                      value={systemSettings.termsConditionsUrl}
                      onChange={(e) => handleSystemSettingsChange('termsConditionsUrl', e.target.value)}
                      placeholder={t("Enter Terms & Conditions URL (optional)")}
                    />
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {t("URL for Terms & Conditions page. If empty, will link to home page.")}
                    </p>
                  </div>
                </>
              )}
            </div>
          </form>
        </div>
      </Card>
    </SettingsSection>
  );
}