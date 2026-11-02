import { useState } from 'react';
import { router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { useTranslation } from 'react-i18next';
import { Loader2, Save } from 'lucide-react';
import { toast } from '@/components/custom-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SettingsSection } from '@/components/settings-section';
import { Switch } from '@/components/ui/switch';

type FieldName =
  | 'base_url' | 'invoice_code' | 'type_operation' | 'mode' | 'format' | 'test_set_id'
  | 'prefix' | 'next_consecutive' | 'currency_code' | 'payment_mean_code'
  | 'term_days' | 'unit_measurement_code' | 'unit_measurement_name'
  | 'standard_type' | 'standard_code' | 'tax_code' | 'region_code'
  | 'region_name' | 'city_code' | 'city_name' | 'country_code' | 'country_name'
  | 'resolution_key' | 'resolution_prefix' | 'resolution_number'
  | 'range_initial' | 'range_final' | 'resolution_valid_from'
  | 'resolution_valid_until' | 'default_person_type' | 'default_regime_type'
  | 'default_identification_type_code' | 'default_responsible_for'
  | 'default_responsibilities';

interface AliaddoSettingsProps {
  settings?: {
    enabled?: boolean;
    base_url?: string;
    has_token?: boolean;
    configuration?: Partial<Record<FieldName, string | number>>;
  };
}

const FIELD_GROUPS: { title: string; fields: { name: FieldName; label: string; type?: string }[] }[] = [
  {
    title: 'Aliaddo connection',
    fields: [
      { name: 'base_url', label: 'API base URL' },
      { name: 'mode', label: 'Mode (Test or Production)' },
      { name: 'test_set_id', label: 'Test set ID' },
    ],
  },
  {
    title: 'Invoice and numbering',
    fields: [
      { name: 'invoice_code', label: 'Invoice document code' },
      { name: 'type_operation', label: 'Operation type' },
      { name: 'format', label: 'Document format' },
      { name: 'prefix', label: 'Invoice prefix' },
      { name: 'next_consecutive', label: 'Next consecutive number', type: 'number' },
      { name: 'currency_code', label: 'Currency code' },
      { name: 'payment_mean_code', label: 'Payment method code' },
      { name: 'term_days', label: 'Payment term in days', type: 'number' },
    ],
  },
  {
    title: 'Branch and product defaults',
    fields: [
      { name: 'region_code', label: 'Branch region code' },
      { name: 'region_name', label: 'Branch region name' },
      { name: 'city_code', label: 'Branch city code' },
      { name: 'city_name', label: 'Branch city name' },
      { name: 'country_code', label: 'Country code' },
      { name: 'country_name', label: 'Country name' },
      { name: 'unit_measurement_code', label: 'Unit of measurement code' },
      { name: 'unit_measurement_name', label: 'Unit of measurement name' },
      { name: 'standard_type', label: 'Product standard type' },
      { name: 'standard_code', label: 'Product standard code' },
      { name: 'tax_code', label: 'Aliaddo tax code' },
    ],
  },
  {
    title: 'DIAN resolution',
    fields: [
      { name: 'resolution_key', label: 'Resolution technical key' },
      { name: 'resolution_prefix', label: 'Resolution prefix' },
      { name: 'resolution_number', label: 'Resolution number', type: 'number' },
      { name: 'range_initial', label: 'Authorized initial number', type: 'number' },
      { name: 'range_final', label: 'Authorized final number', type: 'number' },
      { name: 'resolution_valid_from', label: 'Resolution valid from', type: 'date' },
      { name: 'resolution_valid_until', label: 'Resolution valid until', type: 'date' },
    ],
  },
  {
    title: 'Default recipient tax details',
    fields: [
      { name: 'default_person_type', label: 'Default person type' },
      { name: 'default_regime_type', label: 'Default tax regime' },
      { name: 'default_identification_type_code', label: 'Default identification type code' },
      { name: 'default_responsible_for', label: 'Default tax responsibility' },
      { name: 'default_responsibilities', label: 'Default responsibilities' },
    ],
  },
];

export default function AliaddoSettings({ settings = {} }: AliaddoSettingsProps) {
  const { t } = useTranslation();
  const [enabled, setEnabled] = useState(settings.enabled ?? false);
  const [baseUrl, setBaseUrl] = useState(settings.base_url ?? 'https://orka.test.aliaddo.net');
  const [token, setToken] = useState('');
  const [configuration, setConfiguration] = useState<Partial<Record<FieldName, string>>>(
    Object.fromEntries(
      Object.entries({ mode: 'Test', ...(settings.configuration ?? {}) }).map(([key, value]) => [key, String(value ?? '')]),
    ) as Partial<Record<FieldName, string>>,
  );
  const [processing, setProcessing] = useState(false);

  const setField = (field: FieldName, value: string) => {
    setConfiguration((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setProcessing(true);

    router.post(route('settings.aliaddo.store'), {
      enabled,
      base_url: baseUrl,
      api_token: token,
      ...configuration,
    }, {
      preserveScroll: true,
      preserveState: true,
      onSuccess: () => {
        setProcessing(false);
        toast.success(t('Aliaddo electronic invoicing settings saved successfully.'));
        setToken('');
      },
      onError: (errors) => {
        setProcessing(false);
        toast.error(Object.values(errors).join(', '));
      },
      onFinish: () => setProcessing(false),
    });
  };

  return (
    <SettingsSection
      title={t('Electronic Invoicing (Aliaddo)')}
      description={t('Configure Aliaddo and DIAN data used to issue an electronic invoice for each completed POS sale.')}
      action={
        <Button type="submit" form="aliaddo-settings-form" size="sm" disabled={processing}>
          {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {t('Save Changes')}
        </Button>
      }
    >
      <form id="aliaddo-settings-form" onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
          <div>
            <Label htmlFor="aliaddo-enabled">{t('Enable automatic electronic invoicing')}</Label>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('Invoices are submitted after a POS sale is completed. A provider error will not cancel the sale.')}
            </p>
          </div>
          <Switch id="aliaddo-enabled" checked={enabled} onCheckedChange={setEnabled} />
        </div>

        <div className="grid gap-2 sm:max-w-xl">
          <Label htmlFor="aliaddo-token">{t('Aliaddo API token')}</Label>
          <Input
            id="aliaddo-token"
            type="password"
            autoComplete="new-password"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            placeholder={settings.has_token ? t('Token saved; leave blank to keep it') : t('Paste the token without Bearer')}
          />
          <p className="text-sm text-muted-foreground">
            {t('The token is encrypted on the server and is never returned to the browser.')}
          </p>
        </div>

        {FIELD_GROUPS.map((group) => (
          <section key={group.title} className="space-y-3">
            <h3 className="font-medium">{t(group.title)}</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.fields.map((field) => {
                if (field.name === 'base_url') {
                  return (
                    <div className="space-y-2" key={field.name}>
                      <Label htmlFor={`aliaddo-${field.name}`}>{t(field.label)}</Label>
                      <Input
                        id={`aliaddo-${field.name}`}
                        type="url"
                        value={baseUrl}
                        onChange={(event) => setBaseUrl(event.target.value)}
                      />
                    </div>
                  );
                }

                if (field.name === 'mode') {
                  return (
                    <div className="space-y-2" key={field.name}>
                      <Label htmlFor="aliaddo-mode">{t(field.label)}</Label>
                      <select
                        id="aliaddo-mode"
                        value={configuration.mode ?? 'Test'}
                        onChange={(event) => setField('mode', event.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="Test">{t('Test')}</option>
                        <option value="Production">{t('Production')}</option>
                      </select>
                    </div>
                  );
                }

                return (
                  <div className="space-y-2" key={field.name}>
                    <Label htmlFor={`aliaddo-${field.name}`}>{t(field.label)}</Label>
                    <Input
                      id={`aliaddo-${field.name}`}
                      type={field.type ?? 'text'}
                      min={field.type === 'number' ? 0 : undefined}
                      value={configuration[field.name] ?? ''}
                      onChange={(event) => setField(field.name, event.target.value)}
                    />
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </form>
    </SettingsSection>
  );
}
