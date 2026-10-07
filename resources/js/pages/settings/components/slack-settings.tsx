import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useTranslation } from 'react-i18next';
import { router } from '@inertiajs/react';
import { toast } from '@/components/custom-toast';
import { Send, Save, MessageSquare, HelpCircle, Bell, Link } from 'lucide-react';
import { SettingsSection } from '@/components/settings-section';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { usePage } from '@inertiajs/react';
import axios from 'axios';

export default function SlackSettings() {
    const { t } = useTranslation();
    const { props } = usePage();
    const isDemo = (props as any).is_demo;
    const [isEnabled, setIsEnabled] = useState(false);
    const [webhookUrl, setWebhookUrl] = useState('');
    const [notifications, setNotifications] = useState<Record<string, boolean>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [availableNotifications, setAvailableNotifications] = useState<any[]>([]);

    useEffect(() => {
        // Load current Slack notification settings
        axios.get(route('settings.slack-notifications.get'))
            .then(response => {
                setNotifications(response.data);
            })
            .catch(error => {

            });
    }, []);

    useEffect(() => {
        // Load available notifications
        axios.get(route('settings.slack-notifications.available'))
            .then(response => {
                setAvailableNotifications(response.data);
            })
            .catch(error => {

            });

        // Load Slack config
        axios.get(route('settings.slack-config.get'))
            .then(response => {
                setWebhookUrl(response.data.slack_webhook_url || '');
                setIsEnabled(response.data.slack_enabled || false);
            })
            .catch(error => {

            });
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isEnabled && !webhookUrl) {
            toast.error(t('Please enter a webhook URL when Slack integration is enabled'));
            return;
        }

        setIsSaving(true);

        try {
            await router.post(route('settings.slack-notifications.update'), {
                slack_enabled: isEnabled,
                slack_webhook_url: webhookUrl,
                ...notifications
            }, {
                preserveState: true,
                preserveScroll: true,
                onSuccess: (page) => {
                    toast.dismiss();
                    if (isDemo) {
                        toast.error(t("This action is disabled in demo mode. You can only create new data, not modify existing demo data."));
                    } else {
                        toast.success(t("Slack settings updated successfully"));
                    }
                },
                onError: (errors) => {
                    toast.dismiss();
                    toast.error(t("Failed to save Slack settings"));

                },
                onFinish: () => {
                    setIsSaving(false);
                }
            });
        } catch (error) {
            toast.dismiss();
            toast.error(t("Failed to save Slack settings"));
            setIsSaving(false);
        }
    };

    const handleTest = async () => {
        if (!webhookUrl) {
            toast.error(t("Please enter a webhook URL first"));
            return;
        }

        setIsTesting(true);
        toast.loading(t("Sending test message..."));

        try {
            await router.post(route('slack.test-webhook'), {
                webhook_url: webhookUrl,
                debug: false
            }, {
                preserveState: true,
                onSuccess: () => {
                    toast.dismiss();
                    toast.success(t("Test message sent successfully to Slack!"));
                },
                onError: (errors) => {
                    toast.dismiss();
                    toast.error(t("Failed to send test message"));

                },
                onFinish: () => {
                    setIsTesting(false);
                }
            });
        } catch (error) {
            toast.dismiss();
            toast.error(t("Failed to send test message"));
            setIsTesting(false);
        }
    };

    const handleNotificationChange = (key: string, value: boolean) => {
        setNotifications(prev => ({
            ...prev,
            [key]: value
        }));
    };

    return (
        <SettingsSection
            title={t("Slack Integration")}
            description={t("Configure Slack webhook integration for real-time notifications")}
            action={
                <Button type="submit" form="slack-settings-form" size="sm">
                    <Save className="h-4 w-4 mr-2 shrink-0" />
                    <span className="whitespace-nowrap">{t("Save Changes")}</span>
                </Button>
            }
        >
            <form id="slack-settings-form" onSubmit={handleSave}>
                <div className="flex flex-col 2xl:grid 2xl:grid-cols-3 gap-6">
                    {/* Main Settings */}
                    <div className="w-full 2xl:col-span-2 order-1 min-w-0">
                        <Card>
                            <CardContent className="p-4 sm:p-6 space-y-6">
                                {/* Enable Integration */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 bg-muted/30 rounded-lg border border-border/50">
                                    <div className="space-y-0.5 min-w-0 flex-1">
                                        <Label className="font-medium cursor-pointer">{t("Enable Slack Integration")}</Label>
                                        <p className="text-xs text-muted-foreground">{t("Turn on to receive notifications in Slack")}</p>
                                    </div>
                                    <Switch
                                        checked={isEnabled}
                                        onCheckedChange={setIsEnabled}
                                        className="shrink-0"
                                    />
                                </div>

                                {/* Webhook URL */}
                                <div className="space-y-3 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <Link className="h-4 w-4 text-muted-foreground shrink-0" />
                                        <Label required className="font-medium truncate">{t("Webhook URL")}</Label>
                                    </div>
                                    <Input
                                        required
                                        type="url"
                                        placeholder={t("https://hooks.slack.com/services/...")}
                                        value={webhookUrl}
                                        onChange={(e) => setWebhookUrl(e.target.value)}
                                        disabled={!isEnabled}
                                        className="font-mono text-sm min-w-0 w-full"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        {t("Create a Slack app and add an Incoming Webhook to get this URL")}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 pt-2 border-t">
                                    <Bell className="h-5 w-5 text-emerald-500 shrink-0" />
                                    <h3 className="font-medium text-foreground truncate">{t("Notification Settings")}</h3>
                                </div>

                                {/* Notification Types */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                    {availableNotifications.length === 0 ? (
                                        <div className="col-span-full text-center py-8 text-muted-foreground">
                                            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50 shrink-0" />
                                            <p>{t("No notification templates found.")}</p>
                                            <p className="text-sm">{t("Contact your administrator to set up notification templates.")}</p>
                                        </div>
                                    ) : (
                                        availableNotifications.map(item => (
                                            <div key={item.name} className="flex items-center justify-between gap-3 p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors min-w-0">
                                                <Label htmlFor={item.name} className="text-sm font-medium cursor-pointer flex-1 break-words leading-tight">{t(item.label)}</Label>
                                                <Switch
                                                    id={item.name}
                                                    checked={notifications[item.name] || false}
                                                    onCheckedChange={(checked) => handleNotificationChange(item.name, checked)}
                                                    disabled={!isEnabled}
                                                    className="shrink-0"
                                                />
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Test & Instructions */}
                    <div className="w-full 2xl:col-span-1 order-2 min-w-0 space-y-6">
                        <Card>
                            <CardContent className="p-4 sm:p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <Send className="h-4 w-4 text-primary shrink-0" />
                                    <h3 className="text-base font-medium truncate">{t("Test Slack Integration")}</h3>
                                </div>

                                <p className="text-sm text-muted-foreground mb-4">
                                    {t("Send a test message to verify your Slack configuration is working correctly.")}
                                </p>

                                <Button
                                    type="button"
                                    onClick={handleTest}
                                    disabled={!isEnabled || !webhookUrl || isTesting}
                                    className="w-full"
                                >
                                    <Send className="h-4 w-4 mr-2 shrink-0" />
                                    <span className="whitespace-nowrap">{isTesting ? t("Sending...") : t("Send Test Message")}</span>
                                </Button>

                                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-lg mt-6">
                                    <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2 truncate">
                                        {t("Setup Instructions")}
                                    </h4>
                                    <ol className="text-xs text-blue-800 dark:text-blue-200 space-y-1.5 list-decimal list-inside">
                                        <li>{t("Go to your Slack workspace")}</li>
                                        <li>{t("Create a new Slack app")}</li>
                                        <li>{t("Enable Incoming Webhooks")}</li>
                                        <li>{t("Add webhook to workspace")}</li>
                                        <li>{t("Copy the webhook URL here")}</li>
                                    </ol>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </form>
        </SettingsSection>
    );
}