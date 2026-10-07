import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from 'react-i18next';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';

interface ZoomSettingsProps {
  settings: {
    zoom_account_id?: string;
    zoom_client_id?: string;
    zoom_client_secret?: string;
  };
}

export default function ZoomSettings({ settings }: ZoomSettingsProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    zoom_account_id: settings.zoom_account_id || '',
    zoom_client_id: settings.zoom_client_id || '',
    zoom_client_secret: settings.zoom_client_secret || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    router.post(route('settings.zoom.update'), formData, {
      onSuccess: () => {
        toast.success(t('Zoom settings updated successfully'));
      },
      onError: () => {
        toast.error(t('Failed to update Zoom settings'));
      },
      onFinish: () => {
        setLoading(false);
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('Zoom Integration Settings')}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {t('Configure Zoom meeting integration for video conferencing')}
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h4 className="font-medium">{t('API Credentials')}</h4>
            
            <div>
              <Label htmlFor="zoom_account_id">{t('Account ID')}</Label>
              <Input
                id="zoom_account_id"
                value={formData.zoom_account_id}
                onChange={(e) => setFormData({ ...formData, zoom_account_id: e.target.value })}
                placeholder="c4q7xSoORt-njfV_bUCYvQ"
              />
            </div>

            <div>
              <Label htmlFor="zoom_client_id">{t('Client ID')}</Label>
              <Input
                id="zoom_client_id"
                value={formData.zoom_client_id}
                onChange={(e) => setFormData({ ...formData, zoom_client_id: e.target.value })}
                placeholder="hL1aPDSXT4QFj8a8uctDg"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {t('Get your API key from Zoom Marketplace')}
              </p>
            </div>

            <div>
              <Label htmlFor="zoom_client_secret">{t('Client Secret')}</Label>
              <Input
                id="zoom_client_secret"
                type="password"
                value={formData.zoom_client_secret}
                onChange={(e) => setFormData({ ...formData, zoom_client_secret: e.target.value })}
                placeholder="••••••••••••••••••••••••••••••••"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? t('Saving...') : t('Save Changes')}
            </Button>
            <Button type="button" variant="outline">
              {t('Test Connection')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}