import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useState, useEffect } from 'react';
import { Save, MessageSquare, Send, Phone, Key, User, AlertCircle, Bell } from 'lucide-react';
import { SettingsSection } from '@/components/settings-section';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTranslation } from 'react-i18next';
import { router, usePage } from '@inertiajs/react';
import { toast } from '@/components/custom-toast';
import axios from 'axios';

export default function TwilioSettings() {
  const { t } = useTranslation();
  const pageProps = usePage().props as any;
  const { settings = {} } = pageProps;
  const isDemo = pageProps.globalSettings?.is_demo;
  
  // Twilio Settings form state
  const [twilioSettings, setTwilioSettings] = useState({
    account_sid: settings.twilio_account_sid || '',
    auth_token: settings.twilio_auth_token ? '••••••••••••••••••••••••••••••••' : '',
    from_number: settings.twilio_from_number || ''
  });

  // Test SMS state
  const [testPhone, setTestPhone] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [testResult, setTestResult] = useState<{success: boolean, message: string} | null>(null);

  // Notification settings state
  const [templateSettings, setTemplateSettings] = useState<Record<string, boolean>>({});
  const [availableNotifications, setAvailableNotifications] = useState<any[]>([]);

  useEffect(() => {
    // Load available notifications
    axios.get(route('settings.twilio-notifications.available'))
      .then(response => {
        setAvailableNotifications(response.data);
      })
      .catch(error => {

      });

    // Load current notification settings
    axios.get(route('settings.twilio-notifications.get'))
      .then(response => {
        setTemplateSettings(response.data);
      })
      .catch(error => {

      });
  }, []);

  // Handle Twilio settings form changes
  const handleTwilioSettingsChange = (field: string, value: string) => {
    setTwilioSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle Twilio settings form submission
  const submitTwilioSettings = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Combine Twilio settings and SMS notification settings
    const allSettings = {
      ...twilioSettings,
      ...templateSettings
    };
    
    router.post(route('settings.twilio.update'), allSettings, {
      preserveScroll: true,
      onSuccess: (page) => {
        toast.dismiss();
        const successMessage = page.props.flash?.success;
        const errorMessage = page.props.flash?.error;
        
        if (successMessage) {
          toast.success(successMessage);
        } else if (errorMessage) {
          toast.error(errorMessage);
        } else {
          toast.success(t('Twilio settings saved successfully'));
        }
      },
      onError: (errors) => {
        toast.dismiss();
        const errorMessage = errors.error || Object.values(errors).join(', ') || t('Failed to save Twilio settings');
        toast.error(errorMessage);
      }
    });
  };

  const handleTemplateSettingChange = (key: string, enabled: boolean) => {
    setTemplateSettings(prev => ({
      ...prev,
      [key]: enabled
    }));
  };

  // Handle test SMS submission
  const sendTestSms = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhone) return;
    
    setIsSending(true);
    setTestResult(null);
    toast.loading(t('Sending test SMS...'));
    
    router.post(route('settings.twilio.test'), { phone: testPhone }, {
      preserveScroll: true,
      onSuccess: (page) => {
        setIsSending(false);
        toast.dismiss();
        const successMessage = page.props.flash?.success;
        const errorMessage = page.props.flash?.error;
        
        if (successMessage) {
          toast.success(successMessage);
          setTestResult({ success: true, message: successMessage });
        } else if (errorMessage) {
          toast.error(errorMessage);
          setTestResult({ success: false, message: errorMessage });
        } else {
          const message = t('Test SMS sent successfully to {{phone}}', { phone: testPhone });
          toast.success(message);
          setTestResult({ success: true, message });
        }
        
        // Reset result after 5 seconds
        setTimeout(() => {
          setTestResult(null);
        }, 5000);
      },
      onError: (errors) => {
        setIsSending(false);
        toast.dismiss();
        const errorMessage = errors.error || Object.values(errors).join(', ') || t('Failed to send test SMS');
        toast.error(errorMessage);
        setTestResult({ success: false, message: errorMessage });
        
        // Reset result after 5 seconds
        setTimeout(() => {
          setTestResult(null);
        }, 5000);
      }
    });
  };

  return (
    <SettingsSection
      title={t("Twilio SMS Settings")}
      description={t("Configure Twilio settings for SMS notifications and communications")}
      action={
        <Button type="submit" form="twilio-settings-form" size="sm">
          <Save className="h-4 w-4 mr-2 shrink-0" />
          <span className="whitespace-nowrap">{t("Save Changes")}</span>
        </Button>
      }
    >
      <div className="flex flex-col 2xl:grid 2xl:grid-cols-3 gap-6">
        {/* Main Twilio Settings */}
        <div className="w-full 2xl:col-span-2 order-1 min-w-0">
          <form id="twilio-settings-form" onSubmit={submitTwilioSettings} className="h-full">
            <Card className="h-full">
              <CardContent className="p-4 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <Key className="h-4 w-4 text-muted-foreground shrink-0" />
                      <Label required htmlFor="account_sid" className="font-medium truncate">{t("Account SID")}</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{t("Your Twilio Account SID from the console")}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Input
                      id="account_sid"
                      value={twilioSettings.account_sid}
                      onChange={(e) => handleTwilioSettingsChange('account_sid', e.target.value)}
                      placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      required
                      className="min-w-0"
                    />
                  </div>

                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <Key className="h-4 w-4 text-muted-foreground shrink-0" />
                      <Label required htmlFor="auth_token" className="font-medium truncate">{t("Auth Token")}</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{t("Your Twilio Auth Token from the console")}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Input
                      id="auth_token"
                      type="password"
                      value={twilioSettings.auth_token}
                      onChange={(e) => handleTwilioSettingsChange('auth_token', e.target.value)}
                      placeholder="••••••••••••••••••••••••••••••••"
                      required
                      className="min-w-0"
                    />
                  </div>

                  <div className="space-y-1.5 min-w-0 sm:col-span-2">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                      <Label required htmlFor="from_number" className="font-medium truncate">{t("From Phone Number")}</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{t("Your Twilio phone number (e.g., +1234567890)")}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Input
                      id="from_number"
                      value={twilioSettings.from_number}
                      onChange={(e) => handleTwilioSettingsChange('from_number', e.target.value)}
                      placeholder="+1234567890"
                      required
                      className="min-w-0"
                    />
                  </div>
                </div>

                {/* SMS Notification Settings */}
                <div className="mt-6 pt-4 border-t">
                  <div className="flex items-center gap-2 mb-4">
                    <Bell className="h-5 w-5 text-primary shrink-0" />
                    <h3 className="text-base font-medium truncate">{t("SMS Notification Settings")}</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {availableNotifications.length === 0 ? (
                      <div className="col-span-full text-center py-8 text-muted-foreground">
                        <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50 shrink-0" />
                        <p>{t("No notification templates found.")}</p>
                        <p className="text-sm">{t("Contact your administrator to set up notification templates.")}</p>
                      </div>
                    ) : (
                      availableNotifications.map(item => (
                        <div key={item.name} className="border rounded-lg p-3 bg-card hover:bg-accent/50 transition-colors min-w-0">
                          <div className="flex items-center justify-between gap-3">
                            <Label htmlFor={item.name} className="text-sm font-medium cursor-pointer flex-1 break-words leading-tight">{t(item.label)}</Label>
                            <Switch
                              id={item.name}
                              checked={templateSettings[item.name] || false}
                              onCheckedChange={(checked) => handleTemplateSettingChange(item.name, checked)}
                              className="shrink-0"
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </form>
        </div>

        {/* Test SMS Section */}
        <div className="w-full 2xl:col-span-1 order-2 min-w-0">
          <Card className="h-full">
            <CardContent className="p-4 sm:p-6">
              <form onSubmit={sendTestSms} className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Send className="h-4 w-4 text-primary shrink-0" />
                  <h3 className="text-base font-medium truncate">{t("Test SMS Configuration")}</h3>
                </div>
                
                <div className="space-y-1.5 min-w-0">
                  <Label htmlFor="testPhone" className="font-medium truncate">{t("Send Test To")}</Label>
                  <Input
                    id="testPhone"
                    type="tel"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    placeholder="+1234567890"
                    required
                    className="min-w-0"
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("Enter a phone number with country code (e.g., +1234567890)")}
                  </p>
                </div>

                <Button 
                  type="submit"
                  className="w-full"
                  disabled={isSending || !testPhone}
                >
                  {isSending ? (
                    <>
                      <span className="animate-spin mr-2">◌</span>
                      <span className="whitespace-nowrap">{t("Sending...")}</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2 shrink-0" />
                      <span className="whitespace-nowrap">{t("Send Test SMS")}</span>
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="min-w-0">
                    <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 truncate">{t("Twilio Setup Instructions")}</h4>
                    <div className="mt-2 text-xs text-blue-800 dark:text-blue-200 space-y-1">
                      <p>1. {t("Sign up for a Twilio account at")} <a href="https://www.twilio.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-950 dark:hover:text-blue-50">twilio.com</a></p>
                      <p>2. {t("Get your Account SID and Auth Token from the Twilio Console")}</p>
                      <p>3. {t("Purchase a phone number or use a trial number")}</p>
                      <p>4. {t("Enter your credentials")}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </SettingsSection>
  );
}