import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { SettingsSection } from '@/components/settings-section';
import { useTranslation } from 'react-i18next';
import { router, usePage } from '@inertiajs/react';
import { toast } from '@/components/custom-toast';
import { Card } from '@/components/ui/card';

export default function EmailNotificationSettings() {
  const { t } = useTranslation();
  const pageProps = usePage().props as any;
  const emailTemplates = pageProps.emailTemplates || [];
  const isDemo = pageProps.globalSettings?.is_demo;
  
  const [templateSettings, setTemplateSettings] = useState<Record<number, boolean>>(() => {
    const initial: Record<number, boolean> = {};
    emailTemplates.forEach((template: any) => {
      initial[template.id] = isDemo ? false : template.is_active;
    });
    return initial;
  });

  const handleToggle = (templateId: number, enabled: boolean) => {
    setTemplateSettings(prev => ({
      ...prev,
      [templateId]: enabled
    }));
  };

  const submitNotificationSettings = (e: React.FormEvent) => {
    e.preventDefault();
    
    router.post(route('settings.email-notifications.update'), { templates: templateSettings }, {
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
        const errorMessage = errors.error || Object.values(errors).join(', ') || t('Failed to update email notification settings');
        toast.error(errorMessage);
      }
    });
  };

  return (
    <SettingsSection
      title={t("Email Notification Settings")}
      description={t("Configure which email notifications are sent for different modules")}
      action={
        <Button type="submit" form="notification-settings-form" size="sm">
          <Save className="h-4 w-4 mr-2" />
          {t("Save Changes")}
        </Button>
      }
    >
      <Card>
      <div className='p-6 pt-0 mt-6'>
      <form id="notification-settings-form" onSubmit={submitNotificationSettings}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {emailTemplates.map((template: any) => (
            <div 
              key={template.id} 
              className="flex items-center justify-between p-3 border rounded-md"
            >
              <Label 
                htmlFor={`template-${template.id}`} 
                className="cursor-pointer"
              >
                {t(template.name)}
              </Label>
              <Switch
                id={`template-${template.id}`}
                checked={templateSettings[template.id] || false}
                onCheckedChange={(checked) => handleToggle(template.id, checked)}
              />
            </div>
          ))}
        </div>
      </form>
      </div>
      </Card>
    </SettingsSection>
  );
}