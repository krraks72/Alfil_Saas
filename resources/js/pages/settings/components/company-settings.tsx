import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { SettingsSection } from '@/components/settings-section';
import { useTranslation } from 'react-i18next';
import { router, usePage } from '@inertiajs/react';
import { toast } from '@/components/custom-toast';
import { Card } from '@/components/ui/card';

interface CompanySettingsProps {
  settings?: Record<string, string>;
}

export default function CompanySettings({ settings = {} }: CompanySettingsProps) {
  const { t } = useTranslation();
  const pageProps = usePage().props as any;
  
  const settingsData = Object.keys(settings).length > 0 
    ? settings 
    : (pageProps.settings || {});
  
  const [companySettings, setCompanySettings] = useState({
    companyName: settingsData.companyName || 'WorkDO',
    companyAddress: settingsData.companyAddress || '123 Business Street',
    companyCity: settingsData.companyCity || 'New York',
    companyState: settingsData.companyState || 'NY',
    companyZipCode: settingsData.companyZipCode || '10001',
    companyCountry: settingsData.companyCountry || 'United States',
    companyTelephone: settingsData.companyTelephone || '+1 (555) 123-4567',
  });
  
  useEffect(() => {
    if (Object.keys(settingsData).length > 0) {
      setCompanySettings(prev => ({
        ...prev,
        companyName: settingsData.companyName || 'WorkDO',
        companyAddress: settingsData.companyAddress || '123 Business Street',
        companyCity: settingsData.companyCity || 'New York',
        companyState: settingsData.companyState || 'NY',
        companyZipCode: settingsData.companyZipCode || '10001',
        companyCountry: settingsData.companyCountry || 'United States',
        companyTelephone: settingsData.companyTelephone || '+1 (555) 123-4567',
      }));
    }
  }, [settingsData]);

  const handleChange = (field: string, value: string) => {
    setCompanySettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const submitCompanySettings = (e: React.FormEvent) => {
    e.preventDefault();
    
    router.post(route('settings.company.update'), companySettings, {
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
        const errorMessage = errors.error || Object.values(errors).join(', ') || t('Failed to update company settings');
        toast.error(errorMessage);
      }
    });
  };

  return (
    <SettingsSection
      title={t("Company Settings")}
      description={t("Configure your company information and contact details")}
      action={
        <Button type="submit" form="company-settings-form" size="sm">
          <Save className="h-4 w-4 mr-2" />
          {t("Save Changes")}
        </Button>
      }
    >
      <Card>
      <div className='p-6 pt-0 mt-6'>
      <form id="company-settings-form" onSubmit={submitCompanySettings} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-2 md:col-span-2">
            <Label required htmlFor="companyName">{t("Company Name")}</Label>
            <Input
              id="companyName"
              type="text"
              value={companySettings.companyName}
              onChange={(e) => handleChange('companyName', e.target.value)}
              placeholder={t("Enter company name")}
              required
            />
          </div>

          <div className="grid gap-2 md:col-span-2">
            <Label required htmlFor="companyAddress">{t("Address")}</Label>
            <Input
              id="companyAddress"
              type="text"
              value={companySettings.companyAddress}
              onChange={(e) => handleChange('companyAddress', e.target.value)}
              placeholder={t("Enter company address")}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label required htmlFor="companyCity">{t("City")}</Label>
            <Input
              id="companyCity"
              type="text"
              value={companySettings.companyCity}
              onChange={(e) => handleChange('companyCity', e.target.value)}
              placeholder={t("Enter city")}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label required htmlFor="companyState">{t("State")}</Label>
            <Input
              id="companyState"
              type="text"
              value={companySettings.companyState}
              onChange={(e) => handleChange('companyState', e.target.value)}
              placeholder={t("Enter state")}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label required htmlFor="companyZipCode">{t("Zip/Post Code")}</Label>
            <Input
              id="companyZipCode"
              type="text"
              value={companySettings.companyZipCode}
              onChange={(e) => handleChange('companyZipCode', e.target.value)}
              placeholder={t("Enter zip/post code")}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label required htmlFor="companyCountry">{t("Country")}</Label>
            <Input
              id="companyCountry"
              type="text"
              value={companySettings.companyCountry}
              onChange={(e) => handleChange('companyCountry', e.target.value)}
              placeholder={t("Enter country")}
              required
            />
          </div>

          <div className="grid gap-2 md:col-span-2">
            <Label required htmlFor="companyTelephone">{t("Telephone")}</Label>
            <Input
              id="companyTelephone"
              type="tel"
              value={companySettings.companyTelephone}
              onChange={(e) => handleChange('companyTelephone', e.target.value)}
              placeholder={t("Enter telephone number")}
              required
            />
          </div>
        </div>
      </form>
      </div>
      </Card>
    </SettingsSection>
  );
}