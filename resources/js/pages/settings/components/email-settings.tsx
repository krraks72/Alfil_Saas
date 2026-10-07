import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { Save, Mail, Send, Server, Lock, User, AlertCircle } from 'lucide-react';
import { SettingsSection } from '@/components/settings-section';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTranslation } from 'react-i18next';
import { router, usePage } from '@inertiajs/react';
import { toast } from '@/components/custom-toast';

export default function EmailSettings() {
  const { t } = useTranslation();
  const { settings = {} } = usePage().props as any;
    const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  // Email Settings form state
  const [emailSettings, setEmailSettings] = useState({
    provider: settings.email_provider || 'smtp',
    driver: settings.email_driver || 'smtp',
    host: settings.email_host || 'smtp.example.com',
    port: settings.email_port || '587',
    username: settings.email_username || 'user@example.com',
    password: settings.email_password ? '••••••••••••' : '',
    encryption: settings.email_encryption || 'tls',
    fromAddress: settings.email_from_address || 'noreply@example.com',
    fromName: settings.email_from_name || 'WorkDo System'
  });

  // Test email state
  const [testEmail, setTestEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [testResult, setTestResult] = useState<{success: boolean, message: string} | null>(null);

  // Handle email settings form changes
  const handleEmailSettingsChange = (field: string, value: string) => {
    setEmailSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle email settings form submission
  const submitEmailSettings = (e: React.FormEvent) => {
    e.preventDefault();
    
    router.post(route('settings.email.update'), emailSettings, {
      preserveScroll: true,
      onSuccess: (page) => {
      setIsLoading(false);
        const successMessage = page.props.flash?.success;
        const errorMessage = page.props.flash?.error;

        if (successMessage) {
          toast.success(successMessage);
          setTimeout(() => setIsSaving(false), 500);
        } else if (errorMessage) {
          toast.error(errorMessage);
        }
       
      },
      onError: (errors) => {
        toast.dismiss();
        const errorMessage = errors.error || Object.values(errors).join(', ') || t('Failed to save email settings');
        toast.error(errorMessage);
      }
    });
  };

  // Handle test email submission
  const sendTestEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail) return;
    
    setIsSending(true);
    setTestResult(null);
    toast.loading(t('Sending test email...'));
    
    router.post(route('settings.email.test'), { email: testEmail }, {
      preserveScroll: true,
      onSuccess: (page) => {
        toast.dismiss();
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
          const message = t('Test email sent successfully to {{email}}', { email: testEmail });
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
        const errorMessage = errors.error || Object.values(errors).join(', ') || t('Failed to send test email');
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
      title={t("Email Settings")}
      description={t("Configure email server settings for system notifications and communications")}
      action={
        <Button type="submit" form="email-settings-form" size="sm">
          <Save className="h-4 w-4 mr-2 shrink-0" />
          <span className="whitespace-nowrap">{t("Save Changes")}</span>
        </Button>
      }
    >
      <div className="flex flex-col 2xl:grid 2xl:grid-cols-3 gap-6">
        {/* Main Email Settings */}
        <div className="w-full 2xl:col-span-2 order-1 min-w-0">
          <form id="email-settings-form" onSubmit={submitEmailSettings}>
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                      <Label htmlFor="provider" className="font-medium truncate">{t("Email Provider")}</Label>
                    </div>
                    <Select 
                      value={emailSettings.provider} 
                      onValueChange={(value) => {
                        handleEmailSettingsChange('provider', value);
                        // Set default values based on provider
                        if (value === 'smtp') {
                          handleEmailSettingsChange('driver', 'smtp');
                        } else if (value === 'mailgun') {
                          handleEmailSettingsChange('driver', 'mailgun');
                        } else if (value === 'ses') {
                          handleEmailSettingsChange('driver', 'ses');
                        }
                      }}
                    >
                      <SelectTrigger className="w-full min-w-0 overflow-hidden">
                        <SelectValue placeholder="Select provider" className="whitespace-nowrap truncate block" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="smtp"><span className="whitespace-nowrap">SMTP</span></SelectItem>
                        <SelectItem value="mailgun"><span className="whitespace-nowrap">Mailgun</span></SelectItem>
                        <SelectItem value="ses"><span className="whitespace-nowrap">Amazon SES</span></SelectItem>
                        <SelectItem value="sendmail"><span className="whitespace-nowrap">Sendmail</span></SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <Server className="h-4 w-4 text-muted-foreground shrink-0" />
                      <Label required htmlFor="driver" className="font-medium truncate">{t("Mail Driver")}</Label>
                    </div>
                    <Input
                      id="driver"
                      value={emailSettings.driver}
                      onChange={(e) => handleEmailSettingsChange('driver', e.target.value)}
                      placeholder="smtp"
                      required
                      className="min-w-0"
                    />
                  </div>

                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <Server className="h-4 w-4 text-muted-foreground shrink-0" />
                      <Label required htmlFor="host" className="font-medium truncate">{t("SMTP Host")}</Label>
                    </div>
                    <Input
                      id="host"
                      value={emailSettings.host}
                      onChange={(e) => handleEmailSettingsChange('host', e.target.value)}
                      placeholder="smtp.example.com"
                      required
                      className="min-w-0"
                    />
                  </div>

                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <Server className="h-4 w-4 text-muted-foreground shrink-0" />
                      <Label required htmlFor="port" className="font-medium truncate">{t("SMTP Port")}</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{t("Common ports: 25, 465, 587, 2525")}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Input
                      id="port"
                      value={emailSettings.port}
                      onChange={(e) => handleEmailSettingsChange('port', e.target.value)}
                      placeholder="587"
                      required
                      className="min-w-0"
                    />
                  </div>

                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground shrink-0" />
                      <Label required htmlFor="username" className="font-medium truncate">{t("SMTP Username")}</Label>
                    </div>
                    <Input
                      id="username"
                      value={emailSettings.username}
                      onChange={(e) => handleEmailSettingsChange('username', e.target.value)}
                      placeholder="user@example.com"
                      required
                      className="min-w-0"
                    />
                  </div>

                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
                      <Label required htmlFor="password" className="font-medium truncate">{t("SMTP Password")}</Label>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      value={emailSettings.password}
                      onChange={(e) => handleEmailSettingsChange('password', e.target.value)}
                      placeholder="••••••••••••"
                      required
                      className="min-w-0"
                    />
                  </div>

                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
                      <Label required htmlFor="encryption" className="font-medium truncate">{t("Mail Encryption")}</Label>
                    </div>
                    <Select 
                      value={emailSettings.encryption} 
                      onValueChange={(value) => handleEmailSettingsChange('encryption', value)}
                    >
                      <SelectTrigger className="w-full min-w-0 overflow-hidden">
                        <SelectValue placeholder="Select encryption" className="whitespace-nowrap truncate block" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tls"><span className="whitespace-nowrap">TLS</span></SelectItem>
                        <SelectItem value="ssl"><span className="whitespace-nowrap">SSL</span></SelectItem>
                        <SelectItem value="none"><span className="whitespace-nowrap">None</span></SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                      <Label required htmlFor="fromAddress" className="font-medium truncate">{t("From Address")}</Label>
                    </div>
                    <Input
                      id="fromAddress"
                      value={emailSettings.fromAddress}
                      onChange={(e) => handleEmailSettingsChange('fromAddress', e.target.value)}
                      placeholder="noreply@example.com"
                      required
                      className="min-w-0"
                    />
                  </div>

                  <div className="space-y-1.5 min-w-0 sm:col-span-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground shrink-0" />
                      <Label required htmlFor="fromName" className="font-medium truncate">{t("From Name")}</Label>
                    </div>
                    <Input
                      id="fromName"
                      value={emailSettings.fromName}
                      onChange={(e) => handleEmailSettingsChange('fromName', e.target.value)}
                      placeholder="System"
                      required
                      className="min-w-0"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </form>
        </div>

        {/* Test Email Section */}
        <div className="w-full 2xl:col-span-1 order-2 min-w-0">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <form onSubmit={sendTestEmail} className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Send className="h-4 w-4 text-primary shrink-0" />
                  <h3 className="text-base font-medium truncate">{t("Test Email Configuration")}</h3>
                </div>
                
                <div className="space-y-1.5 min-w-0">
                  <Label required htmlFor="testEmail" className="font-medium truncate">{t("Send Test To")}</Label>
                  <Input
                    id="testEmail"
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="test@example.com"
                    required
                    className="min-w-0"
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("Enter an email address to send a test message")}
                  </p>
                </div>

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isSending || !testEmail}
                >
                  {isSending ? (
                    <>
                      <span className="animate-spin mr-2">◌</span>
                      <span className="whitespace-nowrap">{t("Sending...")}</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2 shrink-0" />
                      <span className="whitespace-nowrap">{t("Send Test Email")}</span>
                    </>
                  ) }
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </SettingsSection>
  );
}