import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useState, useEffect } from 'react';
import { Save, DollarSign, Check, Info } from 'lucide-react';
import { SettingsSection } from '@/components/settings-section';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { router, usePage } from '@inertiajs/react';
import { toast } from '@/components/custom-toast';


interface CurrencyProps {
    id: number;
    name: string;
    code: string;
    symbol: string;
    description?: string;
    is_default: boolean;
}

export default function CurrencySettings() {
    const { t } = useTranslation();
    const { currencies = [], systemSettings = {} } = usePage().props as any;

    // Currency Settings form state
    const [currencySettings, setCurrencySettings] = useState({
        decimalFormat: systemSettings.decimalFormat || '2',
        defaultCurrency: systemSettings.defaultCurrency || 'USD',
        decimalSeparator: systemSettings.decimalSeparator || '.',
        thousandsSeparator: systemSettings.thousandsSeparator === ' ' ? 'space' : (systemSettings.thousandsSeparator || ','),
        floatNumber: systemSettings.floatNumber === '0' ? false : true,
        currencySymbolSpace: systemSettings.currencySymbolSpace === '1',
        currencySymbolPosition: systemSettings.currencySymbolPosition || 'before',
        currencyName: ''
    });

    // Preview amount
    const [previewAmount, setPreviewAmount] = useState(1234.56);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
    // Set currency name based on selected currency
    useEffect(() => {
        if (currencies && currencies.length > 0) {
            const selectedCurrency = currencies.find((c: CurrencyProps) => c.code === currencySettings.defaultCurrency);
            if (selectedCurrency) {
                setCurrencySettings(prev => ({
                    ...prev,
                    currencyName: selectedCurrency.name
                }));
            }
        }
    }, [currencies, currencySettings.defaultCurrency]);

    // Handle currency settings form changes
    const handleCurrencySettingsChange = (field: string, value: string | boolean) => {
        setCurrencySettings(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Handle currency selection change
    const handleCurrencyChange = (value: string) => {
        const selectedCurrency = currencies.find((c: CurrencyProps) => c.code === value);

        setCurrencySettings(prev => ({
            ...prev,
            defaultCurrency: value,
            currencyName: selectedCurrency?.name || value
        }));
    };

    // Format the preview amount based on current settings
    const formattedPreview = () => {
        try {
            // Parse the preview amount
            let amount = previewAmount;

            // Format the number with the specified decimal places
            const decimalPlaces = parseInt(currencySettings.decimalFormat);

            // Handle float number setting
            if (!currencySettings.floatNumber) {
                amount = Math.floor(amount);
            }

            // Format the number with the specified separators
            const parts = amount.toFixed(decimalPlaces).split('.');

            // Format the integer part with thousands separator
            if (currencySettings.thousandsSeparator !== 'none') {
                const sep = currencySettings.thousandsSeparator === 'space' ? ' ' : currencySettings.thousandsSeparator;
                parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, sep);
            }

            // Join with decimal separator
            let formattedNumber = parts.join(currencySettings.decimalSeparator);

            // Get currency symbol from the currencies array
            const selectedCurrency = currencies.find((c: CurrencyProps) => c.code === currencySettings.defaultCurrency);
            const symbol = selectedCurrency?.symbol || '$';

            // Add currency symbol with proper positioning and spacing
            const space = currencySettings.currencySymbolSpace ? ' ' : '';

            if (currencySettings.currencySymbolPosition === 'before') {
                return `${symbol}${space}${formattedNumber}`;
            } else {
                return `${formattedNumber}${space}${symbol}`;
            }
        } catch (error) {
            return 'Invalid format';
        }
    };

    // Handle currency settings form submission
    const submitCurrencySettings = (e: React.FormEvent) => {
        e.preventDefault();

        router.post(route('settings.currency.update'), currencySettings, {
            preserveScroll: true,
            onSuccess: (page) => {
                 setIsLoading(false);
                 toast.dismiss();
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
                const errorMessage = errors.error || Object.values(errors).join(', ') || t('Failed to update currency settings');
                toast.error(errorMessage);
            }
        });
    };

    return (
        <SettingsSection
            title={t("Currency Settings")}
            description={t("Configure how currency values are displayed throughout the application")}
            action={
                <Button type="submit" form="currency-settings-form" size="sm">
                    <Save className="h-4 w-4 mr-2" />
                    {t("Save Changes")}
                </Button>
            }
        >
            <form id="currency-settings-form" onSubmit={submitCurrencySettings}>
                <div className="grid grid-cols-1 gap-6">
                    {/* Format Settings with Live Preview */}
                    <div>
                        <Card>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <DollarSign className="h-5 w-5 text-primary" />
                                        <h3 className="text-base font-medium">{t("Format Options")}</h3>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 gap-6">
                                    {/* Live Preview Section */}
                                    <div className="p-4 bg-muted/30 rounded-md border flex flex-col sm:flex-row items-center justify-between gap-4">
                                        <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
                                            <div className="text-xl sm:text-2xl font-semibold font-mono mb-1 break-all">
                                                {formattedPreview()}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {currencySettings.currencyName} ({currencySettings.defaultCurrency})
                                            </div>
                                        </div>
                                        <div className="w-full sm:w-auto sm:max-w-[200px]">
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    type="number"
                                                    className="text-right h-9 sm:h-8 text-sm flex-1"
                                                    value={previewAmount}
                                                    onChange={(e) => setPreviewAmount(parseFloat(e.target.value) || 0)}
                                                    placeholder="Test amount"
                                                />
                                                <Button
                                                    variant="outline"
                                                    onClick={() => setPreviewAmount(1234.56)}
                                                    type="button"
                                                    size="sm"
                                                    className="h-9 sm:h-8 text-xs shrink-0"
                                                >
                                                    Reset
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Format Options */}
                                    <div className="grid grid-cols-1 2xl:grid-cols-2 gap-4 sm:gap-6">
                                        <div className="space-y-3 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <Label required htmlFor="defaultCurrency" className="font-medium truncate">{t("Default Currency")}</Label>
                                                <Badge variant="outline" className="font-mono shrink-0">
                                                    {currencySettings.defaultCurrency}
                                                </Badge>
                                            </div>
                                            <Select
                                                value={currencySettings.defaultCurrency}
                                                onValueChange={handleCurrencyChange}
                                            >
                                                <SelectTrigger className="w-full min-w-0 overflow-hidden">
                                                    <SelectValue placeholder={t("Select currency")} className="whitespace-nowrap truncate block" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <div className="max-h-[300px] overflow-y-auto">
                                                        {currencies && currencies.length > 0 ? (
                                                            currencies.map((currency: CurrencyProps) => (
                                                                <SelectItem key={currency.id} value={currency.code}>
                                                                    <div className="flex items-center whitespace-nowrap">
                                                                        <span className="w-8 text-center shrink-0">{currency.symbol}</span>
                                                                        <span className="truncate">{currency.code} - {currency.name}</span>
                                                                        {currency.is_default && (
                                                                            <span className="ml-2 text-xs text-primary shrink-0">(Default)</span>
                                                                        )}
                                                                    </div>
                                                                </SelectItem>
                                                            ))
                                                        ) : (
                                                            <div className="p-2 text-center text-muted-foreground">
                                                                {t("No currencies found")}
                                                            </div>
                                                        )}
                                                    </div>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-3 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <Label required htmlFor="decimalFormat" className="font-medium truncate">{t("Decimal Places")}</Label>
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Info className="h-4 w-4 text-muted-foreground shrink-0" />
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>{t("Number of digits after decimal point")}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </div>
                                            <Select
                                                value={currencySettings.decimalFormat}
                                                onValueChange={(value) => handleCurrencySettingsChange('decimalFormat', value)}
                                            >
                                                <SelectTrigger className="w-full min-w-0 overflow-hidden">
                                                    <SelectValue placeholder="Select decimal format" className="whitespace-nowrap truncate block" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="0"><span className="whitespace-nowrap">0 (e.g., 1234)</span></SelectItem>
                                                    <SelectItem value="1"><span className="whitespace-nowrap">1 (e.g., 1234.5)</span></SelectItem>
                                                    <SelectItem value="2"><span className="whitespace-nowrap">2 (e.g., 1234.56)</span></SelectItem>
                                                    <SelectItem value="3"><span className="whitespace-nowrap">3 (e.g., 1234.567)</span></SelectItem>
                                                    <SelectItem value="4"><span className="whitespace-nowrap">4 (e.g., 1234.5678)</span></SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-3 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <Label required htmlFor="currencySymbolPosition" className="font-medium truncate">{t("Symbol Position")}</Label>
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Info className="h-4 w-4 text-muted-foreground shrink-0" />
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>{t("Where to place the currency symbol")}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                <Button
                                                    type="button"
                                                    variant={currencySettings.currencySymbolPosition === 'before' ? "default" : "outline"}
                                                    className="justify-center h-10 sm:h-9 text-xs sm:text-sm whitespace-nowrap min-w-0"
                                                    onClick={() => handleCurrencySettingsChange('currencySymbolPosition', 'before')}
                                                >
                                                    <span><span className="mr-1">$</span>100</span>
                                                    {currencySettings.currencySymbolPosition === 'before' && (
                                                        <Check className="h-4 w-4 ml-1.5 shrink-0" />
                                                    )}
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant={currencySettings.currencySymbolPosition === 'after' ? "default" : "outline"}
                                                    className="justify-center h-10 sm:h-9 text-xs sm:text-sm whitespace-nowrap min-w-0"
                                                    onClick={() => handleCurrencySettingsChange('currencySymbolPosition', 'after')}
                                                >
                                                    <span>100<span className="ml-1">$</span></span>
                                                    {currencySettings.currencySymbolPosition === 'after' && (
                                                        <Check className="h-4 w-4 ml-1.5 shrink-0" />
                                                    )}
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="space-y-3 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <Label required htmlFor="decimalSeparator" className="font-medium truncate">{t("Decimal Separator")}</Label>
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Info className="h-4 w-4 text-muted-foreground shrink-0" />
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>{t("Character used to separate decimal places")}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                <Button
                                                    type="button"
                                                    variant={currencySettings.decimalSeparator === '.' ? "default" : "outline"}
                                                    className="justify-center h-10 sm:h-9 text-xs sm:text-sm whitespace-nowrap min-w-0 px-2"
                                                    onClick={() => handleCurrencySettingsChange('decimalSeparator', '.')}
                                                >
                                                    <span>{t("Dot")} (123.45)</span>
                                                    {currencySettings.decimalSeparator === '.' && (
                                                        <Check className="h-4 w-4 ml-1.5 shrink-0" />
                                                    )}
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant={currencySettings.decimalSeparator === ',' ? "default" : "outline"}
                                                    className="justify-center h-10 sm:h-9 text-xs sm:text-sm whitespace-nowrap min-w-0 px-2"
                                                    onClick={() => handleCurrencySettingsChange('decimalSeparator', ',')}
                                                >
                                                    <span>{t("Comma")} (123,45)</span>
                                                    {currencySettings.decimalSeparator === ',' && (
                                                        <Check className="h-4 w-4 ml-1.5 shrink-0" />
                                                    )}
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="space-y-3 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <Label required htmlFor="thousandsSeparator" className="font-medium truncate">{t("Thousands Separator")}</Label>
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Info className="h-4 w-4 text-muted-foreground shrink-0" />
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>{t("Character used to group thousands")}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </div>
                                            <Select
                                                value={currencySettings.thousandsSeparator}
                                                onValueChange={(value) => handleCurrencySettingsChange('thousandsSeparator', value)}
                                            >
                                                <SelectTrigger className="w-full min-w-0 overflow-hidden">
                                                    <SelectValue placeholder={t("Select thousands separator")} className="whitespace-nowrap truncate block" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value=","><span className="whitespace-nowrap">Comma (1,234.56)</span></SelectItem>
                                                    <SelectItem value="."><span className="whitespace-nowrap">Dot (1.234,56)</span></SelectItem>
                                                    <SelectItem value="space"><span className="whitespace-nowrap">Space (1 234.56)</span></SelectItem>
                                                    <SelectItem value="none"><span className="whitespace-nowrap">None (123456.78)</span></SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="min-w-0">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 bg-muted/30 rounded-lg border border-border/50 h-full">
                                                <div className="space-y-0.5 min-w-0 flex-1">
                                                    <Label htmlFor="floatNumber" className="font-medium cursor-pointer">{t("Show Decimals")}</Label>
                                                    <p className="text-xs text-muted-foreground">{t("Display decimal places in amounts")}</p>
                                                </div>
                                                <Switch
                                                    id="floatNumber"
                                                    checked={currencySettings.floatNumber}
                                                    onCheckedChange={(checked) => handleCurrencySettingsChange('floatNumber', checked)}
                                                    className="shrink-0"
                                                />
                                            </div>
                                        </div>

                                        <div className="min-w-0">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 bg-muted/30 rounded-lg border border-border/50 h-full">
                                                <div className="space-y-0.5 min-w-0 flex-1">
                                                    <Label htmlFor="currencySymbolSpace" className="font-medium cursor-pointer">{t("Add Space")}</Label>
                                                    <p className="text-xs text-muted-foreground">{t("Space between amount and symbol")}</p>
                                                </div>
                                                <Switch
                                                    id="currencySymbolSpace"
                                                    checked={currencySettings.currencySymbolSpace}
                                                    onCheckedChange={(checked) => handleCurrencySettingsChange('currencySymbolSpace', checked)}
                                                    className="shrink-0"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </form>
        </SettingsSection>
    );
}