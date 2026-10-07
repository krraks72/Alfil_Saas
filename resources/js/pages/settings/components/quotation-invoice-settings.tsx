import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { toast } from '@/components/custom-toast';
import { useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { QRCodeGenerator } from '@/components/QRCodeGenerator';
import { NewYork, Toronto, Rio, London, Istanbul, Mumbai, HongKong, Tokyo, Sydney, Paris } from '@/components/quotation-templates';
import { SettingsSection } from '@/components/settings-section';

interface QuotationInvoiceSettingsProps {
    settings?: Record<string, any>;
}

const QUOTATION_TEMPLATES = [
    { value: 'new_york', label: 'New York' },
    { value: 'toronto', label: 'Toronto' },
    { value: 'rio', label: 'Rio' },
    { value: 'london', label: 'London' },
    { value: 'istanbul', label: 'Istanbul' },
    { value: 'mumbai', label: 'Mumbai' },
    { value: 'hong_kong', label: 'Hong Kong' },
    { value: 'tokyo', label: 'Tokyo' },
    { value: 'sydney', label: 'Sydney' },
    { value: 'paris', label: 'Paris' },
];

export default function QuotationInvoiceSettings({ settings = {} }: QuotationInvoiceSettingsProps) {
    const { t } = useTranslation();

    const [selectedTemplate, setSelectedTemplate] = useState(settings?.quotation_invoice_template || 'new_york');
    const [showQr, setShowQr] = useState(settings?.quotation_invoice_qr_display === 'true' || settings?.quotation_invoice_qr_display === true);
    const [color, setColor] = useState(settings?.quotation_invoice_color || '#10b77f');
    const [footerTitle, setFooterTitle] = useState(settings?.quotation_invoice_footer_title || '');
    const [footerNotes, setFooterNotes] = useState(settings?.quotation_invoice_footer_notes || '');
    const [processing, setProcessing] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);

        router.post(route('settings.quotation-invoice.store'), {
            quotation_invoice_template: selectedTemplate,
            quotation_invoice_qr_display: showQr,
            quotation_invoice_color: color,
            quotation_invoice_footer_title: footerTitle,
            quotation_invoice_footer_notes: footerNotes,
        }, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: (page) => {
                setProcessing(false);
                if (page.props.flash?.error) {
                    toast.error(page.props.flash.error);
                } else {
                    toast.success(t('Quotation invoice settings updated successfully'));
                }
            },
            onError: (errors) => {
                setProcessing(false);
            },
        });
    };

    return (
        <SettingsSection
            title={t('Quotation Invoice Settings')}
            description={t('Customize your quotation appearance')}
            action={
                <Button type="submit" form="quotation-invoice-settings-form" size="sm" disabled={processing}>
                    {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin shrink-0" /> : <Save className="mr-2 h-4 w-4 shrink-0" />}
                    <span className="whitespace-nowrap">{t('Save Changes')}</span>
                </Button>
            }
        >
            <div className="flex flex-col 2xl:grid 2xl:grid-cols-3 gap-6">
                {/* Form Controls Column */}
                <div className="w-full 2xl:col-span-1 order-1 min-w-0">
                    <Card className="h-full">
                        <CardContent className="p-4 sm:p-6">
                            <form id="quotation-invoice-settings-form" onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2 min-w-0">
                                    <Label htmlFor="quotation_invoice_template" className="font-medium truncate block">{t('Quotation Template')}</Label>
                                    <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                                        <SelectTrigger id="quotation_invoice_template" className="w-full min-w-0 overflow-hidden">
                                            <SelectValue className="whitespace-nowrap truncate block" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {QUOTATION_TEMPLATES.map((template) => (
                                                <SelectItem key={template.value} value={template.value}>
                                                    <span className="whitespace-nowrap">{template.label}</span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 bg-muted/30 rounded-lg border border-border/50 min-w-0">
                                    <div className="space-y-0.5 min-w-0 flex-1">
                                        <Label htmlFor="quotation_invoice_qr_display" className="font-medium cursor-pointer truncate block">{t('Display QR Code')}</Label>
                                        <p className="text-xs sm:text-sm text-muted-foreground">{t('Show QR code on quotations')}</p>
                                    </div>
                                    <Switch id="quotation_invoice_qr_display" checked={showQr} onCheckedChange={setShowQr} className="shrink-0" />
                                </div>

                                <div className="space-y-2 min-w-0">
                                    <Label htmlFor="quotation_invoice_color" className="font-medium truncate block">{t('Primary Color')}</Label>
                                    <div className="flex items-center gap-3 min-w-0">
                                        <Input
                                            id="quotation_invoice_color"
                                            type="color"
                                            value={color}
                                            onChange={(e) => setColor(e.target.value)}
                                            className="h-10 w-16 sm:w-20 cursor-pointer shrink-0 p-1"
                                        />
                                        <Input
                                            type="text"
                                            value={color}
                                            onChange={(e) => setColor(e.target.value)}
                                            placeholder="#10b77f"
                                            className="flex-1 min-w-0 font-mono text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2 min-w-0">
                                    <Label htmlFor="footer_title" className="font-medium truncate block">{t('Footer Title')}</Label>
                                    <Input
                                        id="footer_title"
                                        type="text"
                                        value={footerTitle}
                                        onChange={(e) => setFooterTitle(e.target.value)}
                                        placeholder="Additional title for quotation footer"
                                        className="min-w-0 w-full"
                                    />
                                </div>

                                <div className="space-y-2 min-w-0">
                                    <Label htmlFor="footer_notes" className="font-medium truncate block">{t('Footer Notes')}</Label>
                                    <Textarea
                                        id="footer_notes"
                                        value={footerNotes}
                                        onChange={(e) => setFooterNotes(e.target.value)}
                                        placeholder="Additional notes for quotation footer"
                                        className="min-h-20 min-w-0 w-full"
                                    />
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* Preview Column */}
                <div className="w-full 2xl:col-span-2 order-2 min-w-0">
                    <Card className="h-full">
                        <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-3 border-b">
                            <Label className="text-base font-semibold">{t('Preview')}</Label>
                        </CardHeader>
                        <CardContent className="p-2 sm:p-4 overflow-x-auto overflow-y-auto max-h-[500px] min-w-0">
                            <QuotationPreview
                                template={selectedTemplate}
                                color={color}
                                showQr={showQr}
                                footerTitle={footerTitle}
                                footerNotes={footerNotes}
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </SettingsSection>
    );
}

function QuotationPreview({ template, color, showQr, footerTitle, footerNotes }: {
    template: string;
    color: string;
    showQr: boolean;
    footerTitle?: string;
    footerNotes?: string
}) {
    const { t } = useTranslation();
    const quotationUrl = typeof window !== 'undefined' ? window.location.href : 'https://example.com/quotation';

    const templateMap: Record<string, React.ComponentType<any>> = {
        new_york: NewYork,
        toronto: Toronto,
        rio: Rio,
        london: London,
        istanbul: Istanbul,
        mumbai: Mumbai,
        hong_kong: HongKong,
        tokyo: Tokyo,
        sydney: Sydney,
        paris: Paris,
    };

    const TemplateComponent = templateMap[template] || NewYork;
    return (
        <TemplateComponent
            quotation={null}
            color={color}
            showQr={showQr}
            quotationUrl={quotationUrl}
            footerTitle={footerTitle}
            footerNotes={footerNotes}
            formatAmount={(amount: number) => `$${amount.toFixed(2)}`}
            t={t}
        />
    );
}

// Legacy preview component for reference
function LegacyQuotationPreview({ color, showQr, footerTitle, footerNotes }: {
    color: string;
    showQr: boolean;
    footerTitle?: string;
    footerNotes?: string
}) {
    const { t } = useTranslation();
    const mockQuotation = {
        quotation_number: 'QUO-2024-001',
        status: 'sent',
        quotation_date: '2024-12-01',
        valid_until: '2024-12-31',
        branch: { name: 'Main Branch', address: '123 Business St', phone: '+1234567890', email: 'info@company.com' },
        customer: { name: 'John Doe', address: '456 Client Ave', phone: '+0987654321', email: 'john@example.com' },
        items: [
            { id: 1, product: { name: 'Service 1' }, quantity: 1, unit_price: 100, tax_rate: 10 },
            { id: 2, product: { name: 'Service 2' }, quantity: 2, unit_price: 75, tax_rate: 10 }
        ],
        subtotal: 250,
        total_amount: 275,
        notes: 'Sample quotation notes',
        terms_conditions: 'Sample terms and conditions'
    };

    // This is kept for reference but not used since we're using the template components
    return null;
}
