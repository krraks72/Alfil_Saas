import { toast } from 'sonner';
import { SettingsSection } from '@/components/settings-section';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { router } from '@inertiajs/react';
import { Save, Calendar, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';

interface GoogleCalendarSettingsProps {
    settings?: Record<string, string>;
}

export default function GoogleCalendarSettings({ settings = {} }: GoogleCalendarSettingsProps) {
    const { t } = useTranslation();

    const [googleCalendarSettings, setGoogleCalendarSettings] = useState({
        googleCalendarEnabled: settings.googleCalendarEnabled === 'true' || settings.googleCalendarEnabled === '1',
        googleCalendarId: settings.googleCalendarId || '',
    });

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);

    const handleSettingsChange = (field: string, value: string | boolean) => {
        setGoogleCalendarSettings((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.type === 'application/json') {
            setSelectedFile(file);
        } else {
            toast.error(t('Please select a valid JSON file'));
        }
    };

    const submitGoogleCalendarSettings = (e: React.FormEvent) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('googleCalendarEnabled', googleCalendarSettings.googleCalendarEnabled ? '1' : '0');
        formData.append('googleCalendarId', googleCalendarSettings.googleCalendarId);

        if (selectedFile) {
            formData.append('googleCalendarJson', selectedFile);
        }

        router.post(route('settings.google-calendar.update'), formData, {
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
                    toast.success(t('Calendar settings saved successfully'));
                }
            },
            onError: (errors) => {
                toast.dismiss();
                const errorMessage = errors.error || Object.values(errors).join(', ') || t('Failed to save email settings');
                toast.error(errorMessage);
            }
        });
    };

    const handleSync = () => {
        setIsSyncing(true);

        router.post(route('settings.google-calendar.sync'), {}, {
            preserveScroll: true,
            onSuccess: (page) => {
                const successMessage = page.props.flash?.success;
                if (successMessage) {
                    toast.success(successMessage);
                }
            },
            onError: (errors) => {
                const errorMessage = errors.error || Object.values(errors).join(', ') || t('Sync failed');
                toast.error(errorMessage);
            },
            onFinish: () => {
                setIsSyncing(false);
            }
        });
    };

    return (
        <SettingsSection
            title={t('Google Calendar Settings')}
            description={t('Configure Google Calendar integration for event synchronization')}
            action={
                <Button type="submit" form="google-calendar-settings-form" size="sm">
                    <Save className="mr-2 h-4 w-4 shrink-0" />
                    <span className="whitespace-nowrap">{t('Save Changes')}</span>
                </Button>
            }
        >
            <Card>
                <div className="p-4 sm:p-6 min-w-0">
                    <form id="google-calendar-settings-form" onSubmit={submitGoogleCalendarSettings} className="space-y-6">
                        {/* Enable Switch */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 bg-muted/30 rounded-lg border border-border/50 min-w-0">
                            <div className="space-y-0.5 min-w-0 flex-1">
                                <Label htmlFor="googleCalendarEnabled" className="flex items-center gap-2 cursor-pointer font-medium truncate">
                                    <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <span className="truncate">{t('Enable Google Calendar Integration')}</span>
                                </Label>
                                <p className="text-muted-foreground text-xs sm:text-sm">
                                    {t('Enable synchronization with Google Calendar for events and appointments')}
                                </p>
                            </div>
                            <Switch
                                id="googleCalendarEnabled"
                                checked={googleCalendarSettings.googleCalendarEnabled}
                                onCheckedChange={(checked) => handleSettingsChange('googleCalendarEnabled', checked)}
                                className="shrink-0"
                            />
                        </div>

                        {/* Calendar ID */}
                        <div className="grid gap-2 min-w-0">
                            <Label required htmlFor="googleCalendarId" className="font-medium truncate">{t('Google Calendar ID')}</Label>
                            <Input
                                required
                                id="googleCalendarId"
                                type="text"
                                placeholder={t('Enter your Google Calendar ID')}
                                value={googleCalendarSettings.googleCalendarId}
                                onChange={(e) => handleSettingsChange('googleCalendarId', e.target.value)}
                                disabled={!googleCalendarSettings.googleCalendarEnabled}
                                className="min-w-0 w-full"
                            />
                        </div>

                        {/* Service Account JSON File */}
                        <div className="grid gap-2 min-w-0">
                            <Label required htmlFor="googleCalendarJson" className="font-medium truncate">{t('Service Account JSON File')}</Label>
                            <Input
                                required={!googleCalendarSettings.googleCalendarEnabled}
                                id="googleCalendarJson"
                                type="file"
                                accept=".json"
                                onChange={handleFileSelect}
                                disabled={!googleCalendarSettings.googleCalendarEnabled}
                                className="min-w-0 w-full text-xs sm:text-sm file:text-xs file:sm:text-sm"
                            />
                            {selectedFile && (
                                <p className="text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 truncate">
                                    {t('Selected file')}: {selectedFile.name}
                                </p>
                            )}
                        </div>

                        {/* Sync Notice and Action */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 pt-2 border-t">
                            <div className="rounded-lg border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/30 p-3 flex-1 min-w-0">
                                <p className="text-xs sm:text-sm text-amber-900 dark:text-amber-200 leading-relaxed">
                                    <span className="font-semibold">{t('Note')}: </span>
                                    {t('After saving, you must click the Sync button to apply the credentials. Syncing is mandatory for the integration to work.')}
                                </p>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleSync}
                                disabled={!googleCalendarSettings.googleCalendarEnabled || isSyncing}
                                className="w-full sm:w-auto shrink-0"
                            >
                                <RefreshCw className={`mr-2 h-4 w-4 shrink-0 ${isSyncing ? 'animate-spin' : ''}`} />
                                <span className="whitespace-nowrap">{isSyncing ? t('Syncing...') : t('Sync')}</span>
                            </Button>
                        </div>
                    </form>
                </div>
            </Card>
        </SettingsSection>
    );
}
