import { toast } from '@/components/custom-toast';
import { SettingsSection } from '@/components/settings-section';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { router } from '@inertiajs/react';
import { Loader2, Save } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { route } from 'ziggy-js';
import COLOMBIAN_CITIES from '../../../../data/aliaddo-colombia-cities.json';

type FieldName =
    | 'base_url'
    | 'invoice_code'
    | 'type_operation'
    | 'mode'
    | 'format'
    | 'incoterms'
    | 'test_set_id'
    | 'prefix'
    | 'next_consecutive'
    | 'currency_code'
    | 'payment_mean_code'
    | 'term_days'
    | 'standard_type'
    | 'standard_code'
    | 'tax_code'
    | 'region_code'
    | 'region_name'
    | 'city_code'
    | 'city_name'
    | 'country_code'
    | 'country_name'
    | 'resolution_key'
    | 'resolution_prefix'
    | 'resolution_number'
    | 'range_initial'
    | 'range_final'
    | 'resolution_valid_from'
    | 'resolution_valid_until'
    | 'default_person_type'
    | 'default_regime_type'
    | 'default_identification_type_code'
    | 'default_responsible_for'
    | 'default_responsibilities';

interface AliaddoSettingsProps {
    settings?: {
        enabled?: boolean;
        base_url?: string;
        has_token?: boolean;
        configuration?: Partial<Record<FieldName, string | number>>;
    };
}

type FieldRequirement = 'required' | 'optional' | 'test' | 'tax' | 'export';
type FieldOption = { value: string; label: string };
type ColombianCity = { code: string; name: string };

const REQUIREMENT_LABELS: Record<FieldRequirement, string> = {
    required: 'Required',
    optional: 'Optional',
    test: 'Required in Test mode',
    tax: 'Required when sale items have taxes',
    export: 'Required for export invoices',
};

const INVOICE_CODE_OPTIONS: FieldOption[] = [
    { value: '01', label: '01 - National sales invoice' },
    { value: '02', label: '02 - Export invoice' },
    { value: '03', label: '03 - Contingency invoice' },
    { value: '04', label: '04 - DIAN contingency invoice' },
    { value: '05', label: '05 - Support document' },
    { value: '07', label: '07 - Issuer contingency' },
    { value: '08', label: '08 - DIAN contingency' },
    { value: '20', label: '20 - Electronic POS receipt' },
    { value: '25', label: '25 - Cinema ticket' },
    { value: '27', label: '27 - Public events ticket' },
    { value: '30', label: '30 - Gaming sales report' },
    { value: '35', label: '35 - Ground passenger transport ticket' },
    { value: '40', label: '40 - Toll document' },
    { value: '45', label: '45 - Financial statement' },
    { value: '50', label: '50 - Air passenger ticket' },
    { value: '55', label: '55 - Stock exchange document' },
    { value: '60', label: '60 - Public utilities document' },
    { value: '91', label: '91 - Credit note' },
    { value: '92', label: '92 - Debit note' },
    { value: '93', label: '93 - Equivalent debit adjustment' },
    { value: '94', label: '94 - Equivalent credit adjustment' },
    { value: '95', label: '95 - Support document adjustment' },
];

const TYPE_OPERATION_OPTIONS: FieldOption[] = [
    { value: '09', label: '09 - AIU' },
    { value: '10', label: '10 - Standard / equivalent document / resident support' },
    { value: '11', label: '11 - Mandates / non-resident support' },
    { value: '12', label: '12 - Transport' },
    { value: '14', label: '14 - Notary' },
    { value: '15', label: '15 - Currency purchase' },
    { value: '16', label: '16 - Currency sale' },
    { value: '20', label: '20 - Contingency credit note with invoice reference' },
    { value: '22', label: '22 - Contingency credit note without invoice reference' },
    { value: '25', label: '25 - Cinema ticket' },
    { value: '27', label: '27 - Public shows ticket' },
    { value: '32', label: '32 - Daily sales control report for localized games' },
    { value: '35', label: '35 - Ground passenger transport ticket' },
    { value: '271', label: '271 - Performing arts show, standard' },
    { value: '272', label: '272 - Performing arts show, mandate' },
    { value: '273', label: '273 - Other public show, standard' },
    { value: '274', label: '274 - Other public show, mandate' },
    { value: '321', label: '321 - Daily report' },
    { value: '322', label: '322 - Final daily report' },
    { value: '551', label: '551 - Stock exchange transaction settlement' },
    { value: '552', label: '552 - Agricultural commodities exchange transaction' },
    { value: '601', label: '601 - Document 60, normal billing' },
    { value: '602', label: '602 - Document 60, on-site billing' },
    { value: 'SS-CUDE', label: 'SS-CUDE - Health sector' },
    { value: 'SS-CUFE', label: 'SS-CUFE - Health sector' },
    { value: 'SS-POS', label: 'SS-POS - Health sector' },
    { value: 'SS-SNum', label: 'SS-SNum - Health sector' },
    { value: 'SS-Reporte', label: 'SS-Reporte - Health copay or moderating fee' },
    { value: 'SS-SinAporte', label: 'SS-SinAporte - Health sector' },
    { value: 'SS-Recaudo', label: 'SS-Recaudo - Health sector' },
];

const FORMAT_OPTIONS: FieldOption[] = [
    { value: 'Estandar', label: 'Estandar' },
    { value: 'Azul', label: 'Azul' },
    { value: 'Continental', label: 'Continental' },
    { value: 'Indigo', label: 'Indigo' },
    { value: 'FacturaExportacion', label: 'FacturaExportacion' },
    { value: 'MediaCarta', label: 'MediaCarta' },
    { value: 'Tirilla', label: 'Tirilla' },
];

const INCOTERMS_OPTIONS: FieldOption[] = [
    { value: 'CFR', label: 'CFR - Cost and Freight' },
    { value: 'CIF', label: 'CIF - Cost, Insurance and Freight' },
    { value: 'CIP', label: 'CIP - Carriage and Insurance Paid To' },
    { value: 'CPT', label: 'CPT - Carriage Paid To' },
    { value: 'DAP', label: 'DAP - Delivered at Place' },
    { value: 'DDP', label: 'DDP - Delivered Duty Paid' },
    { value: 'DPU', label: 'DPU - Delivered at Place Unloaded' },
    { value: 'EXW', label: 'EXW - Ex Works' },
    { value: 'FAS', label: 'FAS - Free Alongside Ship' },
    { value: 'FCA', label: 'FCA - Free Carrier' },
    { value: 'FOB', label: 'FOB - Free on Board' },
];

const PAYMENT_MEAN_OPTIONS: FieldOption[] = [
    { value: '10', label: '10 - Cash' },
    { value: '13', label: '13 - Savings credit' },
    { value: '14', label: '14 - Savings debit' },
    { value: '30', label: '30 - Credit transfer' },
    { value: '31', label: '31 - Debit transfer' },
    { value: '42', label: '42 - Bank deposit' },
    { value: '48', label: '48 - Credit card' },
    { value: '49', label: '49 - Debit card' },
];

const COLOMBIAN_DEPARTMENTS: FieldOption[] = [
    { value: '91', label: '91 - Amazonas' },
    { value: '05', label: '05 - Antioquia' },
    { value: '81', label: '81 - Arauca' },
    { value: '08', label: '08 - Atlántico' },
    { value: '11', label: '11 - Bogotá' },
    { value: '13', label: '13 - Bolívar' },
    { value: '15', label: '15 - Boyacá' },
    { value: '17', label: '17 - Caldas' },
    { value: '18', label: '18 - Caquetá' },
    { value: '85', label: '85 - Casanare' },
    { value: '19', label: '19 - Cauca' },
    { value: '20', label: '20 - Cesar' },
    { value: '27', label: '27 - Chocó' },
    { value: '23', label: '23 - Córdoba' },
    { value: '25', label: '25 - Cundinamarca' },
    { value: '94', label: '94 - Guainía' },
    { value: '95', label: '95 - Guaviare' },
    { value: '41', label: '41 - Huila' },
    { value: '44', label: '44 - La Guajira' },
    { value: '47', label: '47 - Magdalena' },
    { value: '50', label: '50 - Meta' },
    { value: '52', label: '52 - Nariño' },
    { value: '54', label: '54 - Norte de Santander' },
    { value: '86', label: '86 - Putumayo' },
    { value: '63', label: '63 - Quindío' },
    { value: '66', label: '66 - Risaralda' },
    { value: '88', label: '88 - San Andrés y Providencia' },
    { value: '68', label: '68 - Santander' },
    { value: '70', label: '70 - Sucre' },
    { value: '73', label: '73 - Tolima' },
    { value: '76', label: '76 - Valle del Cauca' },
    { value: '97', label: '97 - Vaupés' },
    { value: '99', label: '99 - Vichada' },
];

const STANDARD_TYPE_OPTIONS: FieldOption[] = [
    { value: '001', label: '001' },
    { value: '010', label: '010' },
    { value: '020', label: '020' },
    { value: '999', label: '999' },
];

const TAX_CODE_OPTIONS: FieldOption[] = [
    { value: '01', label: '01 - IVA (Impuesto sobre las ventas)' },
    { value: '02', label: '02 - IC (Impuesto al consumo departamental nominal)' },
    { value: '03', label: '03 - ICA (Industria, comercio y avisos)' },
    { value: '04', label: '04 - INC (Impuesto nacional al consumo)' },
    { value: '08', label: '08 - IC porcentual (Impuesto al consumo departamental porcentual)' },
    { value: '20', label: '20 - FtoHorticultura (Cuota de fomento hortifrutícola)' },
    { value: '21', label: '21 - Timbre (Impuesto de timbre)' },
    { value: '22', label: '22 - INC Bolsas (Consumo de bolsas plásticas)' },
    { value: '23', label: '23 - INCarbono (Impuesto nacional al carbono)' },
    { value: '24', label: '24 - INCombustibles (Impuesto nacional a los combustibles)' },
    { value: '25', label: '25 - Sobretasa Combustibles' },
    { value: '26', label: '26 - Sordicom (Contribución minoristas, combustibles)' },
    { value: '30', label: '30 - IC Datos (Impuesto al consumo de datos)' },
    { value: '32', label: '32 - ICL (Impuesto al consumo de licores)' },
    { value: '33', label: '33 - INPP (Impuesto nacional a productos plásticos)' },
    { value: '34', label: '34 - IBUA (Bebidas ultraprocesadas azucaradas)' },
    { value: '35', label: '35 - ICUI (Comestibles ultraprocesados)' },
    { value: '36', label: '36 - ADV (Ad valorem)' },
    { value: 'ZZ', label: 'ZZ - Otros tributos, tasas o contribuciones' },
];

const PERSON_TYPE_OPTIONS: FieldOption[] = [
    { value: '1', label: '1 - Persona jurídica' },
    { value: '2', label: '2 - Persona natural' },
];

const REGIME_TYPE_OPTIONS: FieldOption[] = [
    { value: '48', label: '48 - VAT responsible' },
    { value: '49', label: '49 - Not VAT responsible' },
];

const IDENTIFICATION_TYPE_OPTIONS: FieldOption[] = [
    { value: '11', label: '11 - Civil registry' },
    { value: '12', label: '12 - Identity card' },
    { value: '13', label: '13 - Citizenship card' },
    { value: '21', label: '21 - Foreigner ID card' },
    { value: '22', label: '22 - Foreigner identity card' },
    { value: '31', label: '31 - Tax ID (NIT)' },
    { value: '41', label: '41 - Passport' },
    { value: '42', label: '42 - Foreign identification document' },
    { value: '47', label: '47 - Special stay permit' },
    { value: '48', label: '48 - Temporary protection permit' },
    { value: '50', label: '50 - NUIP' },
    { value: '91', label: '91 - NUIP' },
];

const RESPONSIBILITY_OPTIONS: FieldOption[] = [
    { value: 'O-13', label: 'O-13 - Large taxpayer' },
    { value: 'O-15', label: 'O-15 - Self-withholding agent' },
    { value: 'O-23', label: 'O-23 - VAT withholding agent' },
    { value: 'O-47', label: 'O-47 - Simple tax regime' },
    { value: 'R-99-PN', label: 'R-99-PN - Not responsible' },
];

const RESPONSIBLE_FOR_OPTIONS: FieldOption[] = [
    { value: '01', label: '01 - VAT' },
    { value: '04', label: '04 - VAT and national consumption tax' },
    { value: 'ZA', label: 'ZA - VAT and national consumption tax' },
    { value: 'ZZ', label: 'ZZ - Not applicable' },
];

const CITIES: ColombianCity[] = COLOMBIAN_CITIES;

const FIELD_GROUPS: {
    title: string;
    fields: { name: FieldName; label: string; type?: string; requirement: FieldRequirement; options?: FieldOption[] }[];
}[] = [
    {
        title: 'Aliaddo connection',
        fields: [
            { name: 'base_url', label: 'API base URL', requirement: 'required' },
            { name: 'mode', label: 'Mode (Test or Production)', requirement: 'required' },
            { name: 'test_set_id', label: 'Test set ID', requirement: 'test' },
        ],
    },
    {
        title: 'Invoice and numbering',
        fields: [
            { name: 'invoice_code', label: 'Invoice document code', requirement: 'required', options: INVOICE_CODE_OPTIONS },
            { name: 'type_operation', label: 'Operation type', requirement: 'required', options: TYPE_OPERATION_OPTIONS },
            { name: 'format', label: 'Document format', requirement: 'optional', options: FORMAT_OPTIONS },
            { name: 'incoterms', label: 'INCOTERMS', requirement: 'export', options: INCOTERMS_OPTIONS },
            { name: 'prefix', label: 'Invoice prefix', requirement: 'required' },
            { name: 'next_consecutive', label: 'Next consecutive number', type: 'number', requirement: 'required' },
            { name: 'currency_code', label: 'Currency code', requirement: 'required' },
            { name: 'payment_mean_code', label: 'Payment method code', requirement: 'required', options: PAYMENT_MEAN_OPTIONS },
            { name: 'term_days', label: 'Payment term in days', type: 'number', requirement: 'optional' },
        ],
    },
    {
        title: 'Branch and product defaults',
        fields: [
            { name: 'region_code', label: 'Branch region code', requirement: 'required', options: COLOMBIAN_DEPARTMENTS },
            {
                name: 'region_name',
                label: 'Branch region name',
                requirement: 'required',
                options: COLOMBIAN_DEPARTMENTS.map(({ label }) => ({ value: label.slice(5), label: label.slice(5) })),
            },
            { name: 'city_code', label: 'Branch city code', requirement: 'required' },
            { name: 'city_name', label: 'Branch city name', requirement: 'required' },
            { name: 'country_code', label: 'Country code', requirement: 'required' },
            { name: 'country_name', label: 'Country name', requirement: 'optional' },
            { name: 'standard_type', label: 'Product standard type', requirement: 'optional', options: STANDARD_TYPE_OPTIONS },
            { name: 'standard_code', label: 'Product standard code', requirement: 'optional' },
            { name: 'tax_code', label: 'Aliaddo tax code', requirement: 'tax', options: TAX_CODE_OPTIONS },
        ],
    },
    {
        title: 'DIAN resolution',
        fields: [
            { name: 'resolution_key', label: 'Resolution technical key', requirement: 'required' },
            { name: 'resolution_prefix', label: 'Resolution prefix', requirement: 'optional' },
            { name: 'resolution_number', label: 'Resolution number', type: 'number', requirement: 'required' },
            { name: 'range_initial', label: 'Authorized initial number', type: 'number', requirement: 'required' },
            { name: 'range_final', label: 'Authorized final number', type: 'number', requirement: 'required' },
            { name: 'resolution_valid_from', label: 'Resolution valid from', type: 'date', requirement: 'required' },
            { name: 'resolution_valid_until', label: 'Resolution valid until', type: 'date', requirement: 'required' },
        ],
    },
    {
        title: 'Default recipient tax details',
        fields: [
            { name: 'default_person_type', label: 'Default person type', requirement: 'optional', options: PERSON_TYPE_OPTIONS },
            { name: 'default_regime_type', label: 'Default tax regime', requirement: 'optional', options: REGIME_TYPE_OPTIONS },
            {
                name: 'default_identification_type_code',
                label: 'Default identification type code',
                requirement: 'optional',
                options: IDENTIFICATION_TYPE_OPTIONS,
            },
            { name: 'default_responsible_for', label: 'Default tax responsibility', requirement: 'optional', options: RESPONSIBLE_FOR_OPTIONS },
            { name: 'default_responsibilities', label: 'Default responsibilities', requirement: 'optional', options: RESPONSIBILITY_OPTIONS },
        ],
    },
];

export default function AliaddoSettings({ settings = {} }: AliaddoSettingsProps) {
    const { t } = useTranslation();
    const [enabled, setEnabled] = useState(settings.enabled ?? false);
    const [baseUrl, setBaseUrl] = useState(settings.base_url ?? 'https://orka.test.aliaddo.net');
    const [token, setToken] = useState('');
    const initialConfiguration = Object.fromEntries(
        Object.entries({
            mode: 'Test',
            ...(settings.configuration ?? {}),
            currency_code: settings.configuration?.currency_code || 'COP',
            country_code: settings.configuration?.country_code || 'CO',
            country_name: settings.configuration?.country_name || 'Colombia',
        }).map(([key, value]) => [key, String(value ?? '')]),
    ) as Partial<Record<FieldName, string>>;
    const initialDepartment = COLOMBIAN_DEPARTMENTS.find(({ value }) => value === initialConfiguration.region_code);
    if (initialDepartment) {
        initialConfiguration.region_name = initialDepartment.label.slice(5);
    }
    const initialCity = CITIES.find(({ code }) => code === initialConfiguration.city_code);
    if (initialCity && initialCity.code.startsWith(initialConfiguration.region_code ?? '')) {
        initialConfiguration.city_name = initialCity.name;
    }
    const [configuration, setConfiguration] = useState<Partial<Record<FieldName, string>>>(initialConfiguration);
    const [processing, setProcessing] = useState(false);
    const cityOptions = (configuration.region_code ? CITIES.filter(({ code }) => code.startsWith(configuration.region_code ?? '')) : []).map(
        ({ code, name }) => ({ value: code, label: `${code} - ${name}` }),
    );

    const setField = (field: FieldName, value: string) => {
        setConfiguration((current) => ({ ...current, [field]: value }));
    };

    const setDepartment = (departmentCode: string) => {
        const department = COLOMBIAN_DEPARTMENTS.find(({ value }) => value === departmentCode);
        if (!department) {
            return;
        }

        setConfiguration((current) => ({
            ...current,
            region_code: department.value,
            region_name: department.label.slice(5),
            ...(current.city_code?.startsWith(department.value) ? {} : { city_code: '', city_name: '' }),
        }));
    };

    const setCity = (cityCode: string) => {
        const city = CITIES.find(({ code }) => code === cityCode && code.startsWith(configuration.region_code ?? ''));
        if (!city) {
            setConfiguration((current) => ({ ...current, city_code: '', city_name: '' }));
            return;
        }

        setConfiguration((current) => ({ ...current, city_code: city.code, city_name: city.name }));
    };

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        setProcessing(true);

        router.post(
            route('settings.aliaddo.store'),
            {
                enabled,
                base_url: baseUrl,
                api_token: token,
                ...configuration,
            },
            {
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
            },
        );
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
                        <p className="text-muted-foreground mt-1 text-sm">
                            {t('Invoices are submitted after a POS sale is completed. A provider error will not cancel the sale.')}
                        </p>
                    </div>
                    <Switch id="aliaddo-enabled" checked={enabled} onCheckedChange={setEnabled} />
                </div>

                <div className="grid gap-2 sm:max-w-xl">
                    <Label htmlFor="aliaddo-token">
                        {t('Aliaddo API token')} <span className="text-muted-foreground">({t('Required when enabled')})</span>
                    </Label>
                    <Input
                        id="aliaddo-token"
                        type="password"
                        autoComplete="new-password"
                        value={token}
                        onChange={(event) => setToken(event.target.value)}
                        placeholder={settings.has_token ? t('Token saved; leave blank to keep it') : t('Paste the token without Bearer')}
                    />
                    <p className="text-muted-foreground text-sm">{t('The token is encrypted on the server and is never returned to the browser.')}</p>
                </div>

                {FIELD_GROUPS.map((group) => (
                    <section key={group.title} className="space-y-3">
                        <h3 className="font-medium">{t(group.title)}</h3>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {group.fields.map((field) => {
                                const options =
                                    field.name === 'city_code' || field.name === 'city_name'
                                        ? cityOptions.map(({ value, label }) =>
                                              field.name === 'city_name' ? { value: label.slice(8), label: label.slice(8) } : { value, label },
                                          )
                                        : field.options;

                                if (field.name === 'base_url') {
                                    return (
                                        <div className="space-y-2" key={field.name}>
                                            <Label htmlFor={`aliaddo-${field.name}`}>
                                                {t(field.label)}{' '}
                                                <span className="text-muted-foreground">({t(REQUIREMENT_LABELS[field.requirement])})</span>
                                            </Label>
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
                                            <Label htmlFor="aliaddo-mode">
                                                {t(field.label)}{' '}
                                                <span className="text-muted-foreground">({t(REQUIREMENT_LABELS[field.requirement])})</span>
                                            </Label>
                                            <select
                                                id="aliaddo-mode"
                                                value={configuration.mode ?? 'Test'}
                                                onChange={(event) => setField('mode', event.target.value)}
                                                className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                                            >
                                                <option value="Test">{t('Test')}</option>
                                                <option value="Production">{t('Production')}</option>
                                            </select>
                                        </div>
                                    );
                                }

                                return (
                                    <div className="space-y-2" key={field.name}>
                                        <Label htmlFor={`aliaddo-${field.name}`}>
                                            {t(field.label)}{' '}
                                            <span className="text-muted-foreground">({t(REQUIREMENT_LABELS[field.requirement])})</span>
                                        </Label>
                                        {options ? (
                                            <select
                                                id={`aliaddo-${field.name}`}
                                                value={configuration[field.name] ?? ''}
                                                onChange={(event) => {
                                                    if (field.name === 'region_code') {
                                                        setDepartment(event.target.value);
                                                    } else if (field.name === 'region_name') {
                                                        const department = COLOMBIAN_DEPARTMENTS.find(
                                                            ({ label }) => label.slice(5) === event.target.value,
                                                        );
                                                        if (department) {
                                                            setDepartment(department.value);
                                                        }
                                                    } else if (field.name === 'city_code' || field.name === 'city_name') {
                                                        const city = CITIES.find(
                                                            ({ code, name }) =>
                                                                (field.name === 'city_code' && code === event.target.value) ||
                                                                (field.name === 'city_name' && name === event.target.value),
                                                        );
                                                        setCity(city?.code ?? '');
                                                    } else {
                                                        setField(field.name, event.target.value);
                                                    }
                                                }}
                                                className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                                            >
                                                <option value="">{t('Select an allowed value')}</option>
                                                {options.map((option) => (
                                                    <option key={option.value} value={option.value}>
                                                        {t(option.label)}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <Input
                                                id={`aliaddo-${field.name}`}
                                                type={field.type ?? 'text'}
                                                min={field.type === 'number' ? 0 : undefined}
                                                maxLength={field.name === 'prefix' || field.name === 'resolution_prefix' ? 8 : undefined}
                                                value={configuration[field.name] ?? ''}
                                                onChange={(event) => setField(field.name, event.target.value)}
                                            />
                                        )}
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
