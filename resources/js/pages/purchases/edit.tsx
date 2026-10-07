import { useState } from 'react';
import { PageTemplate } from '@/components/page-template';
import { usePage, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Trash2, Plus, CalendarDays, ClipboardList, FileText, Calculator, CheckCircle2, User, Mail, Phone, MapPin } from 'lucide-react';
import { toast } from '@/components/custom-toast';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import InputError from '@/components/input-error';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';

export default function EditPurchase() {
    const { t } = useTranslation();
    const { vendors, products, purchase } = usePage().props as any;
    const getInitials = useInitials();

    const { data: formData, setData, put, transform, errors } = useForm({
        vendor_id:     purchase.vendor_id?.toString() || '',
        purchase_date: purchase.purchase_date?.split('T')[0] || purchase.purchase_date || '',
        notes:         purchase.notes || '',
        items:         purchase.items?.map((item: any) => ({
            product_id: item.product_id?.toString() || '',
            quantity:   item.quantity,
            unit_price: item.unit_price,
            discount:   0,
            taxes:      item.product?.taxes || [],
        })) || [],
    });

    transform((data) => ({
        ...data,
        _method: 'PUT',
        discount_amount: 0,
        items: data.items.map((item: any) => {
            const subtotal  = (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0);
            const taxRate   = (item.taxes || []).reduce((s: number, tax: any) => s + (parseFloat(tax.rate) || 0), 0);
            const taxAmount = (subtotal * taxRate) / 100;
            return {
                product_id:  item.product_id,
                quantity:    item.quantity,
                unit_price:  item.unit_price,
                total_price: subtotal + taxAmount,
                tax_amount:  taxAmount,
                taxes:       (item.taxes || []).map((tax: any) => tax.id),
            };
        }),
    }));

    const handleChange = (field: string, value: any) => {
        setData(field as any, value);
    };

    const addItem = () => {
        setData('items', [...formData.items, {
            product_id: '',
            quantity:   1,
            unit_price: 0,
            discount:   0,
            taxes:      [],
        }]);
    };

    const updateItem = (index: number, field: string, value: any) => {
        const items = [...formData.items];
        items[index] = { ...items[index], [field]: value };

        if (field === 'product_id') {
            const product = products?.find((p: any) => p.id == value);
            if (product) {
                items[index].unit_price = product.purchase_price || 0;
                items[index].taxes      = product.taxes || [];
            } else {
                items[index].unit_price = 0;
                items[index].taxes      = [];
            }
        }

        setData('items', items);
    };

    const removeItem = (index: number) => {
        setData('items', formData.items.filter((_: any, i: number) => i !== index));
    };

    const calculateItemTotal = (item: any) => {
        const subtotal  = (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0);
        const taxRate   = (item.taxes || []).reduce((sum: number, tax: any) => sum + (parseFloat(tax.rate) || 0), 0);
        const taxAmount = subtotal * (taxRate / 100);
        return subtotal + taxAmount;
    };

    const calculateSubtotal = () =>
        formData.items.reduce((sum: number, item: any) =>
            sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0), 0);

    const calculateTotalTax = () =>
        formData.items.reduce((sum: number, item: any) => {
            const subtotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0);
            const taxRate  = (item.taxes || []).reduce((s: number, tax: any) => s + (parseFloat(tax.rate) || 0), 0);
            return sum + (subtotal * taxRate / 100);
        }, 0);

    const calculateGrandTotal = () => calculateSubtotal() + calculateTotalTax();

    const [itemErrors, setItemErrors] = useState<Record<number, string>>({});

    const handleSubmit = () => {
        const newItemErrors: Record<number, string> = {};
        formData.items.forEach((item: any, index: number) => {
            if (!item.product_id) newItemErrors[index] = t('Please select a product.');
        });
        if (Object.keys(newItemErrors).length > 0) {
            setItemErrors(newItemErrors);
            return;
        }
        setItemErrors({});
        put(route('purchases.update', purchase.id), {
            onSuccess: (page) => {
                toast.dismiss();
                const successMsg = page.props.flash?.success;
                const errorMsg   = page.props.flash?.error;
                if (successMsg) toast.success(successMsg);
                else if (errorMsg) toast.error(errorMsg);
            },
            onError: () => { toast.dismiss(); },
        });
    };

    const pageActions = [
        {
            label:   t('Back'),
            icon:    <ArrowLeft className="h-4 w-4" />,
            variant: 'outline' as const,
            onClick: () => router.visit(route('purchases.index')),
        },
    ];

    const breadcrumbs = [
        { title: t('Dashboard'),           href: route('dashboard') },
        { title: t('Purchase Management'), href: route('purchases.index') },
        { title: t('Edit Purchase') },
    ];

    const selectedVendor = vendors?.find((v: any) => v.id == formData.vendor_id);

    return (
        <PageTemplate title={t('Edit Purchase')} breadcrumbs={breadcrumbs} actions={pageActions} description={t('Update existing purchase order.')}>
            <div className="flex flex-col lg:flex-row gap-6 items-start">

                {/* Left - Main Content */}
                <div className="flex-1 min-w-0 space-y-6 w-full">

                    {/* Purchase Details Card */}
                    <Card className='overflow-hidden'>
                        <CardHeader className="pb-4 border-b flex bg-gray-50 dark:bg-gray-800/50">
                            <CardTitle className="text-base font-bold flex items-center gap-2">
                                <span className="w-8 h-8 rounded-sm bg-primary/10 flex items-center justify-center shrink-0">
                                    <CalendarDays className="h-4 w-4 text-primary" />
                                </span>
                                {t('Purchase Details')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <Label required>{t('Purchase Date')}</Label>
                                    <Input
                                        type="date"
                                        value={formData.purchase_date}
                                        onChange={(e) => handleChange('purchase_date', e.target.value)}
                                    />
                                    <InputError message={errors.purchase_date} />
                                </div>

                                <div className="space-y-1.5">
                                    <Label required>{t('Vendor')}</Label>
                                    <Select value={formData.vendor_id} onValueChange={(v) => handleChange('vendor_id', v)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('Select Vendor')} />
                                        </SelectTrigger>
                                        <SelectContent searchable>
                                            {vendors?.map((vendor: any) => (
                                                <SelectItem key={vendor.id} value={vendor.id.toString()}>
                                                    {vendor.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.vendor_id} />
                                </div>

                                <div className="space-y-1.5 md:col-span-2">
                                    <Label>{t('Notes')}</Label>
                                    <Textarea
                                        value={formData.notes}
                                        onChange={(e) => handleChange('notes', e.target.value)}
                                        placeholder={t('Enter note')}
                                        rows={3}
                                        className="resize-none"
                                    />
                                    <InputError message={errors.notes} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Purchase Items Card */}
                    <Card className='overflow-hidden'>
                        <CardHeader className="pb-4 border-b bg-gray-50 dark:bg-gray-800/50">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                <CardTitle className="text-base font-bold flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-sm bg-primary/10 flex items-center justify-center shrink-0">
                                        <ClipboardList className="h-4 w-4 text-primary" />
                                    </span>
                                    {t('Purchase Items')}
                                </CardTitle>
                                <Button type="button" onClick={addItem} variant='default' className="w-full sm:w-auto">
                                    <Plus className="h-4 w-4" />
                                    {t('Add Item')}
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0 px-0">

                            {/* Mobile Items View */}
                            <div className="block sm:hidden divide-y divide-gray-200 dark:divide-gray-800">
                                {formData.items.length === 0 ? (
                                    <div className="text-center py-10 px-4 text-gray-400 dark:text-gray-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <ClipboardList className="h-8 w-8 text-gray-300 dark:text-gray-600" />
                                            <p className="text-sm">{t('No items added yet.')}</p>
                                            <Button type="button" onClick={addItem} variant="outline" size="sm" className="mt-2">
                                                <Plus className="h-4 w-4" />
                                                {t('Add Item')}
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    formData.items.map((item: any, index: number) => (
                                        <div key={index} className="p-4 space-y-3 bg-white dark:bg-gray-900">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-xs font-semibold text-gray-500">{t('Item')} #{index + 1}</span>
                                                <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(index)} className="h-8 w-8 p-0 text-gray-500">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <div className="space-y-2">
                                                <div>
                                                    <Label required className="text-xs">{t('Product')}</Label>
                                                    <Select value={item.product_id?.toString() || ''} onValueChange={(v) => { updateItem(index, 'product_id', v); setItemErrors(prev => ({ ...prev, [index]: '' })); }}>
                                                        <SelectTrigger className={`mt-1 ${itemErrors[index] ? 'border-red-500' : ''}`}>
                                                            <SelectValue placeholder={t('Select Product')} />
                                                        </SelectTrigger>
                                                        <SelectContent searchable>
                                                            {products?.filter((product: any) => {
                                                                const selectedIds = formData.items
                                                                    .map((i: any, idx: number) => idx !== index ? i.product_id?.toString() : null)
                                                                    .filter(Boolean);
                                                                return !selectedIds.includes(product.id.toString());
                                                            }).map((product: any) => (
                                                                <SelectItem key={product.id} value={product.id.toString()}>
                                                                    {product.name}{product.purchase_price ? ` - ${window.appSettings.formatCurrency(product.purchase_price)}` : ''}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    {itemErrors[index] && <p className="text-xs text-red-500 mt-1">{itemErrors[index]}</p>}
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <Label required className="text-xs">{t('Qty')}</Label>
                                                        <Input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)} className="mt-1" />
                                                    </div>
                                                    <div>
                                                        <Label className="text-xs">{t('Unit Price')}</Label>
                                                        <div className="mt-1 h-9 px-3 flex items-center bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 text-sm font-mono">
                                                            {window.appSettings.formatCurrency(item.unit_price)}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <Label className="text-xs">{t('Tax')}</Label>
                                                    <div className="mt-1 flex flex-wrap gap-1">
                                                        {item.taxes && item.taxes.length > 0 ? (
                                                            item.taxes.map((tax: any) => (
                                                                <span key={tax.id} className="inline-flex items-center rounded-md bg-blue-50 dark:bg-blue-900/30 px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-300 ring-1 ring-inset ring-blue-700/10">
                                                                    {tax.name} ({parseFloat(tax.rate)}%)
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="text-xs text-gray-400">-</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
                                                    <span className="text-xs font-semibold text-gray-500">{t('Total')}</span>
                                                    <span className="text-sm font-bold font-mono text-gray-900 dark:text-white">{window.appSettings.formatCurrency(calculateItemTotal(item))}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Desktop & Tablet Table */}
                            <div className="hidden sm:block overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-40">{t('Product')} <span className="text-red-500">*</span></TableHead>
                                        <TableHead className="w-20">{t('Qty')} <span className="text-red-500">*</span></TableHead>
                                        <TableHead className="w-28">{t('Unit Price')} <span className="text-red-500">*</span></TableHead>
                                        <TableHead className='w-34'>{t('Tax')}</TableHead>
                                        <TableHead className="w-28 text-right">{t('Total')}</TableHead>
                                        <TableHead className="w-10">{t('Action')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {formData.items.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-10 text-gray-400 dark:text-gray-500">
                                                <div className="flex flex-col items-center gap-2">
                                                    <ClipboardList className="h-8 w-8 text-gray-300 dark:text-gray-600" />
                                                    <span className="text-sm">{t('No items added yet.')}</span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : formData.items.map((item: any, index: number) => (
                                        <TableRow key={index}>
                                            <TableCell className="min-w-[180px]">
                                                <Select value={item.product_id?.toString() || ''} onValueChange={(v) => { updateItem(index, 'product_id', v); setItemErrors(prev => ({ ...prev, [index]: '' })); }}>
                                                    <SelectTrigger className={`h-9 text-sm ${itemErrors[index] ? 'border-red-500' : ''}`}>
                                                        <SelectValue placeholder={t('Select Product')} />
                                                    </SelectTrigger>
                                                    <SelectContent searchable>
                                                        {products?.filter((product: any) => {
                                                            const selectedIds = formData.items
                                                                .map((i: any, idx: number) => idx !== index ? i.product_id?.toString() : null)
                                                                .filter(Boolean);
                                                            return !selectedIds.includes(product.id.toString());
                                                        }).map((product: any) => (
                                                            <SelectItem key={product.id} value={product.id.toString()}>
                                                                {product.name}{product.purchase_price ? ` - ${window.appSettings.formatCurrency(product.purchase_price)}` : ''}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                {itemErrors[index] && <p className="text-xs text-red-500 mt-1">{itemErrors[index]}</p>}
                                            </TableCell>
                                            <TableCell className="min-w-[90px]">
                                                <Input
                                                    type="number"
                                                    min={1}
                                                    value={item.quantity}
                                                    onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                                                    className="h-9 text-sm text-center w-20"
                                                />
                                            </TableCell>
                                            <TableCell className="min-w-[110px]">
                                                <span className="text-sm font-mono">{window.appSettings.formatCurrency(item.unit_price)}</span>
                                            </TableCell>
                                            <TableCell className="min-w-[130px]">
                                                <div className="flex flex-wrap gap-1">
                                                    {item.taxes && item.taxes.length > 0 ? (
                                                        item.taxes.map((tax: any) => (
                                                            <span key={tax.id} className="inline-flex items-center rounded-md bg-blue-50 dark:bg-blue-900/30 px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-300 ring-1 ring-inset ring-blue-700/10 whitespace-nowrap">
                                                                {tax.name} ({parseFloat(tax.rate)}%)
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-xs text-gray-400">-</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-gray-900 dark:text-white whitespace-nowrap">
                                                {window.appSettings.formatCurrency(calculateItemTotal(item))}
                                            </TableCell>
                                            <TableCell>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            type="button"
                                                            variant="link"
                                                            size="icon"
                                                            onClick={() => removeItem(index)}
                                                            className="text-gray-500"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent><p>{t('Remove')}</p></TooltipContent>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            </div>

                            {formData.items.length > 0 && (
                                <div className="px-4 mt-3 mb-4">
                                    <button
                                        type="button"
                                        onClick={addItem}
                                        className="w-full py-3 rounded-lg border border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 text-primary text-sm font-semibold transition-colors flex items-center justify-center gap-1.5"
                                    >
                                        <Plus className="h-4 w-4" />
                                        {t('Add another item')}
                                    </button>
                                </div>
                            )}
                            <InputError message={errors.items} className="px-4 pb-3" />
                        </CardContent>
                    </Card>

                </div>

                {/* Right - Sidebar */}
                <div className="w-full lg:w-72 flex-shrink-0 space-y-4 lg:sticky lg:top-4 self-start">

                    {/* Purchase Summary */}
                    <Card className='overflow-hidden'>
                        <CardHeader className="pb-4 border-b flex bg-gray-50 dark:bg-gray-800/50">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <span className="w-8 h-8 rounded-sm bg-primary/10 flex items-center justify-center shrink-0">
                                    <Calculator className="h-4 w-4 text-primary" />
                                </span>
                                {t('Purchase Summary')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="space-y-2.5 text-sm">
                                <div className="flex justify-between items-center text-gray-600 dark:text-gray-400">
                                    <span>{t('Subtotal')}</span>
                                    <span className="font-mono text-gray-900 dark:text-white">
                                        {window.appSettings.formatCurrency(calculateSubtotal())}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-gray-600 dark:text-gray-400">
                                    <span>{t('Tax')}</span>
                                    <span className="font-mono text-gray-900 dark:text-white">
                                        {window.appSettings.formatCurrency(calculateTotalTax())}
                                    </span>
                                </div>
                                <div className="border-t border-gray-200 dark:border-gray-600 pt-2.5">
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-gray-900 dark:text-white">{t('Total')}</span>
                                        <span className="text-lg font-mono text-emerald-500">
                                            {window.appSettings.formatCurrency(calculateGrandTotal())}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Vendor Details */}
                    {selectedVendor && (
                        <Card className='overflow-hidden'>
                            <CardHeader className="pb-4 border-b flex bg-gray-50 dark:bg-gray-800/50">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-sm bg-primary/10 flex items-center justify-center shrink-0">
                                        <User className="h-4 w-4 text-primary" />
                                    </span>
                                    {t('Vendor Details')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-5 space-y-3.5">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10">
                                        <AvatarFallback>{getInitials(selectedVendor.name)}</AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{selectedVendor.name}</p>
                                        {selectedVendor.company_name && <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{selectedVendor.company_name}</p>}
                                    </div>
                                </div>
                                <div className="divide-y divide-gray-100 dark:divide-gray-800 -mx-5">
                                    {selectedVendor.email && (
                                        <div className="flex items-center gap-2.5 px-4 py-2.5">
                                            <div className="flex-shrink-0 w-7 h-7 rounded-md bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                                                <Mail className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs text-gray-400 dark:text-gray-500">{t('Email')}</p>
                                                <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{selectedVendor.email}</p>
                                            </div>
                                        </div>
                                    )}
                                    {selectedVendor.phone && (
                                        <div className="flex items-center gap-2.5 px-4 py-2.5">
                                            <div className="flex-shrink-0 w-7 h-7 rounded-md bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
                                                <Phone className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs text-gray-400 dark:text-gray-500">{t('Phone')}</p>
                                                <p className="text-xs font-semibold text-gray-900 dark:text-white">{selectedVendor.phone}</p>
                                            </div>
                                        </div>
                                    )}
                                    {(selectedVendor.billing_address || selectedVendor.billing_city || selectedVendor.billing_country) && (
                                        <div className="flex items-start gap-2.5 px-4 py-2.5">
                                            <div className="flex-shrink-0 w-7 h-7 rounded-md bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center">
                                                <MapPin className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs text-gray-400 dark:text-gray-500">{t('Address')}</p>
                                                <p className="text-xs font-semibold text-gray-900 dark:text-white">
                                                    {[selectedVendor.billing_address, selectedVendor.billing_city, selectedVendor.billing_country].filter(Boolean).join(', ')}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Additional Notes */}
                    <Card className='overflow-hidden'>
                        <CardHeader className="pb-4 border-b flex bg-gray-50 dark:bg-gray-800/50">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <span className="w-8 h-8 rounded-sm bg-primary/10 flex items-center justify-center shrink-0">
                                    <FileText className="h-4 w-4 text-primary" />
                                </span>
                                {t('Additional Notes')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 max-h-25 overflow-x-auto">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {formData.notes || t('No notes added')}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-4 mt-4 gap-3">
                <div className='flex items-center gap-2 font-bold justify-center sm:justify-start'>
                    {formData.items.length > 0 && (
                        <>
                            <CheckCircle2 className='h-5 w-5 sm:h-6 sm:w-6 text-primary' />
                            <span className="text-xs sm:text-sm text-primary">
                                {formData.items.length} {formData.items.length === 1 ? t('item') : t('items')}{t(' added')}
                            </span>
                        </>
                    )}
                </div>
                <div className='flex items-center justify-end gap-3 w-full sm:w-auto'>
                    <Button variant="outline" onClick={() => router.visit(route('purchases.index'))} className="w-full sm:w-auto">
                        {t('Cancel')}
                    </Button>
                    <Button onClick={handleSubmit} variant='default' className="w-full sm:w-auto">
                        {t('Update')}
                    </Button>
                </div>
            </div>
        </PageTemplate>
    );
}
