import { PageTemplate } from '@/components/page-template';
import { usePage, router, useForm } from '@inertiajs/react';
import { Save, Minus, Plus, ArrowLeft, Trash2, ClipboardCheck } from 'lucide-react';
import { toast } from '@/components/custom-toast';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import InputError from '@/components/input-error';
import { useState } from 'react';

export default function EditSaleReturn() {
    const { t } = useTranslation();
    const { saleReturn, sales, branches } = usePage().props as any;

    const formatDate = (date: any) => {
        if (!date) return '';
        if (typeof date === 'string') return date.split('T')[0].split(' ')[0];
        return new Date(date).toISOString().split('T')[0];
    };

    const { data: formData, setData, put, errors } = useForm({
        branch_id: saleReturn?.branch_id?.toString() || '',
        sale_id: saleReturn?.sale_id?.toString() || '',
        return_date: formatDate(saleReturn?.return_date),
        reason: saleReturn?.reason || '',
        notes: saleReturn?.notes || '',
        customer_id: saleReturn?.customer_id || '',
        items: saleReturn?.items?.map((item: any) => ({
            product_id: item.product_id,
            sale_item_id: item.sale_item_id,
            product_name: item.product?.name || item.product_name || 'Unknown',
            product_image: item.product?.image || `${window.appSettings?.imageUrl || ''}/images/default/image-not-found.jpg`,
            product_sku: item.product?.sku || '',
            variant_name: item.variant_name || '',
            quantity: item.quantity,
            max_quantity: item.saleItem?.quantity ?? item.quantity,
            unit_price: item.unit_price,
            tax_rate: item.tax_rate || 0,
            individual_taxes: item.individual_taxes || [],
        })) || [] as any[],
    });

    const isStatusOnly = saleReturn?.status === 'approved' || saleReturn?.status === 'rejected';
    const [statusValue, setStatusValue] = useState(saleReturn?.status || 'pending');

    const selectedSale = sales?.find((s: any) => s.id == formData.sale_id);

    const filteredSales = formData.branch_id
        ? (sales?.filter((s: any) => s.branch_id == formData.branch_id) || [])
        : [];

    const handleChange = (field: string, value: any) => {
        setData((prev: any) => {
            const updated: any = { ...prev, [field]: value };
            if (field === 'branch_id') {
                updated.sale_id = '';
                updated.items = [];
                updated.customer_id = '';
            }
            if (field === 'sale_id') {
                updated.items = [];
                // Update customer_id when sale changes
                const selectedSaleData = sales?.find((s: any) => s.id == value);
                updated.customer_id = selectedSaleData?.customer_id || '';
            }
            return updated;
        });
    };

    const addItem = (saleItem: any) => {
        if (formData.items.some((i: any) => i.sale_item_id == saleItem.id)) return;
        const availableQty = saleItem.quantity - (saleItem.returned_quantity || 0);
        setData('items', [...formData.items, {
            product_id: saleItem.product_id,
            sale_item_id: saleItem.id,
            product_name: saleItem.product?.name || 'Unknown',
            product_image: saleItem.product?.image || `${window.appSettings?.imageUrl || ''}/images/default/image-not-found.jpg`,
            product_sku: saleItem.product?.sku || '',
            variant_name: saleItem.variant_name || '',
            quantity: 1,
            max_quantity: availableQty,
            unit_price: saleItem.unit_price,
            tax_rate: saleItem.tax_rate || 0,
            individual_taxes: saleItem.individual_taxes || [],
        }]);
    };

    const updateQty = (index: number, delta: number) => {
        const items = [...formData.items];
        const item = items[index];
        items[index] = { ...item, quantity: Math.min(Math.max(item.quantity + delta, 1), item.max_quantity) };
        setData('items', items);
    };

    const setQty = (index: number, value: number) => {
        const items = [...formData.items];
        const item = items[index];
        items[index] = { ...item, quantity: Math.min(Math.max(value || 1, 1), item.max_quantity) };
        setData('items', items);
    };

    const totalItems = formData.items.length;
    const totalQty = formData.items.reduce((sum: number, i: any) => sum + i.quantity, 0);
    const totalAmount = formData.items.reduce((sum: number, i: any) => sum + i.quantity * i.unit_price, 0);

    const handleSubmit = () => {
        if (isStatusOnly) {
            toast.loading(t('Updating sale return...'));
            router.put(route('sale-returns.update', saleReturn.id), { status: statusValue }, {
                onSuccess: (page) => {
                    toast.dismiss();
                    if (page.props.flash?.success) toast.success(page.props.flash.success);
                    else toast.success(t('Sale return updated successfully'));
                    router.visit(route('sale-returns.index'));
                },
                onError: (errors) => {
                    toast.dismiss();
                    const first = Object.values(errors)[0];
                    toast.error(Array.isArray(first) ? first[0] : (first || t('Failed to update sale return')));
                }
            });
            return;
        }

        put(route('sale-returns.update', saleReturn.id), {
            onSuccess: (page) => {
                toast.dismiss();
                if (page.props.flash?.success) toast.success(page.props.flash.success);
                else toast.success(t('Sale return updated successfully'));
                router.visit(route('sale-returns.index'));
            },
            onError: () => {
                toast.dismiss();
            }
        });
    };

    const pageActions = [
        {
            label: t('Back'),
            icon: <ArrowLeft className="h-4 w-4" />,
            variant: 'outline' as const,
            onClick: () => router.visit(route('sale-returns.index')),
        },
    ];

    const breadcrumbs = [
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Sales Management'), href: route('sales.index') },
        { title: t('Sale Returns'), href: route('sale-returns.index') },
        { title: t('Edit Sale Return') }
    ];

    return (
        <PageTemplate title={t('Edit Sale Return')} breadcrumbs={breadcrumbs} actions={pageActions} description={t('Update existing sale return.')}>

            {/* Main Form Card */}
            <div className="bg-white dark:bg-gray-900 rounded-lg border p-6 mb-6">
                {isStatusOnly ? (
                    /* Status-only edit for approved/rejected returns */
                    <div className="max-w-sm space-y-2">
                        <Label required>{t('Status')}</Label>
                        <Select value={statusValue} onValueChange={setStatusValue}>
                            <SelectTrigger>
                                <SelectValue placeholder={t('Select Status')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="approved">{t('Approved')}</SelectItem>
                                <SelectItem value="rejected">{t('Rejected')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Branch */}
                        <div className="space-y-2">
                            <Label required>{t('Branch')} </Label>
                            <Select value={formData.branch_id} onValueChange={(v) => handleChange('branch_id', v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t('Select Branch')} />
                                </SelectTrigger>
                                <SelectContent searchable>
                                    {branches?.map((branch: any) => (
                                        <SelectItem key={branch.id} value={branch.id.toString()}>{branch.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={errors.branch_id} />
                        </div>

                        {/* Sale */}
                        <div className="space-y-2">
                            <Label required>{t('Sales')} </Label>
                            <Select
                                value={formData.sale_id}
                                onValueChange={(v) => handleChange('sale_id', v)}
                                disabled={!formData.branch_id}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={formData.branch_id ? t('Select Sale') : t('Select Branch First')} />
                                </SelectTrigger>
                                <SelectContent searchable>
                                    {filteredSales.map((sale: any) => (
                                        <SelectItem key={sale.id} value={sale.id.toString()}>
                                            {sale.sale_number} - {sale.customer?.name || 'Walk-in Customer'}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={errors.sale_id} />
                        </div>

                        {/* Reason */}
                        <div className="space-y-2">
                            <Label>{t('Reason')}</Label>
                            <Input
                                value={formData.reason}
                                onChange={(e) => handleChange('reason', e.target.value)}
                                placeholder={t('Enter reason for return')}
                            />
                            <InputError message={errors.reason} />
                        </div>

                        {/* Return Date */}
                        <div className="space-y-2">
                            <Label required>{t('Return Date')} </Label>
                            <Input
                                type="date"
                                value={formData.return_date}
                                max={new Date().toISOString().split('T')[0]}
                                onChange={(e) => handleChange('return_date', e.target.value)}
                            />
                            <InputError message={errors.return_date} />
                        </div>

                        {/* Notes */}
                        <div className="space-y-2 md:col-span-2">
                            <Label>{t('Notes')}</Label>
                            <Textarea
                                value={formData.notes}
                                onChange={(e) => handleChange('notes', e.target.value)}
                                placeholder={t('Enter notes here')}
                                rows={4}
                                className="resize-none"
                            />
                            <InputError message={errors.notes} />
                        </div>
                    </div>
                )}
            </div>

            {/* Return Items Card — only for pending returns */}
            {!isStatusOnly && (
                <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6 mb-6">
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('Return Items')}</h3>
                    </div>

                    {!selectedSale ? (
                        <div className="flex flex-col items-center justify-center py-12 px-6">
                            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                                <ClipboardCheck className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                {t('No Sales Selected')}
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 text-center max-w-sm">
                                {t('Select a sales first to see available items')}
                            </p>
                            <div className="mt-4 text-xs text-gray-400 dark:text-gray-500">
                                {t('Choose from the sales dropdown above')}
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table className="border border-1 min-w-[600px]">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('Item')}</TableHead>
                                        <TableHead className="text-right">{t('Unit Price')}</TableHead>
                                        <TableHead className="text-right">{t('Qty. Available')}</TableHead>
                                        <TableHead className="text-right">{t('Subtotal')}</TableHead>
                                        <TableHead className="text-center">{t('Action')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {selectedSale.items?.filter((saleItem: any) => {
                                        const availableQty = saleItem.quantity - (saleItem.returned_quantity || 0);
                                        return availableQty > 0;
                                    }).map((saleItem: any) => {
                                        const addedIdx = formData.items.findIndex((i: any) => i.sale_item_id == saleItem.id);
                                        const added = addedIdx >= 0;
                                        const returnItem = added ? formData.items[addedIdx] : null;
                                        const subtotal = added ? returnItem.quantity * returnItem.unit_price : saleItem.unit_price;

                                        return (
                                            <TableRow key={saleItem.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <img
                                                            src={saleItem.product?.image || `${window.appSettings?.imageUrl || ''}/images/default/image-not-found.jpg`}
                                                            alt=""
                                                            className="w-10 h-10 rounded object-cover border shrink-0"
                                                            onError={(e) => {
                                                                const target = e.target as HTMLImageElement;
                                                                const defaultImage = `${window.appSettings?.imageUrl || ''}/images/default/image-not-found.jpg`;
                                                                if (target.src !== defaultImage) {
                                                                    target.src = defaultImage;
                                                                }
                                                            }}
                                                        />
                                                        <div className="min-w-0">
                                                            <div className="font-medium whitespace-nowrap sm:whitespace-normal">
                                                                {saleItem.product?.name || saleItem.product_name || 'Unknown'}
                                                            </div>
                                                            {(saleItem.variant_name || saleItem.product?.sku) && (
                                                                <div className="text-xs text-gray-500 whitespace-nowrap sm:whitespace-normal">
                                                                    {[saleItem.variant_name, saleItem.product?.sku].filter(Boolean).join(' • ')}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right font-mono">
                                                    {window.appSettings.formatCurrency(saleItem.unit_price || 0)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {saleItem.quantity - (saleItem.returned_quantity || 0)}
                                                </TableCell>
                                                <TableCell className="text-right font-mono">
                                                    {window.appSettings.formatCurrency(added ? subtotal : saleItem.unit_price)}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="default"
                                                        onClick={() => addItem(saleItem)}
                                                        disabled={added}
                                                        className="min-w-[60px]"
                                                    >
                                                        {t('Add')}
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </div>
            )}

            {/* Added Items Card — only for pending returns */}
            {!isStatusOnly && formData.items.length > 0 && (
                <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6 mb-6">
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('Added Items')}</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <Table className="border border-1 min-w-[650px]">
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('Product')}</TableHead>
                                <TableHead className="text-center">{t('Return Qty')}</TableHead>
                                <TableHead className="text-right">{t('Unit Price')}</TableHead>
                                <TableHead className="text-right">{t('Tax')}</TableHead>
                                <TableHead className="text-right">{t('Total')}</TableHead>
                                <TableHead className="text-center">{t('Action')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {formData.items.map((item: any, index: number) => {
                                const taxAmount = item.quantity * item.unit_price * (item.tax_rate / 100);
                                const totalAmount = item.quantity * item.unit_price + taxAmount;

                                return (
                                    <TableRow key={item.sale_item_id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={item.product_image}
                                                    alt=""
                                                    className="w-10 h-10 rounded object-cover border"
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        const defaultImage = `${window.appSettings?.imageUrl || ''}/images/default/image-not-found.jpg`;
                                                        if (target.src !== defaultImage) {
                                                            target.src = defaultImage;
                                                        }
                                                    }}
                                                />
                                                <div>
                                                    <div className="font-medium">
                                                        {item.product_name}
                                                    </div>
                                                    {(item.variant_name || item.product_sku) && (
                                                        <div className="text-xs text-gray-500">
                                                            {[item.variant_name, item.product_sku].filter(Boolean).join(' • ')}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => updateQty(index, -1)}
                                                    disabled={item.quantity <= 1}
                                                    className="w-7 h-7 rounded border flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                                                >
                                                    <Minus className="h-3 w-3" />
                                                </button>
                                                <input
                                                    type="number"
                                                    min={1}
                                                    max={item.max_quantity}
                                                    value={item.quantity}
                                                    onChange={(e) => setQty(index, parseInt(e.target.value) || 1)}
                                                    className="w-12 text-center border rounded px-1 py-1 text-sm"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => updateQty(index, 1)}
                                                    disabled={item.quantity >= item.max_quantity}
                                                    className="w-7 h-7 rounded border flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                                                >
                                                    <Plus className="h-3 w-3" />
                                                </button>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-mono">
                                            {window.appSettings.formatCurrency(item.unit_price)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div>
                                                <div className='font-mono'>{window.appSettings.formatCurrency(taxAmount)}</div>
                                                {item.tax_rate > 0 && item.individual_taxes && item.individual_taxes.length > 0 && (
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                                        {item.individual_taxes.map((tax: any, index: number) => (
                                                            <div key={index}>{tax.name} - {tax.rate}%</div>
                                                        ))}
                                                    </div>
                                                )}
                                                {item.tax_rate > 0 && (!item.individual_taxes || item.individual_taxes.length === 0) && (
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                                        {item.tax_rate}%
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-mono">
                                            {window.appSettings.formatCurrency(totalAmount)}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        type="button"
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() => setData('items', formData.items.filter((_: any, i: number) => i !== index))}
                                                        className="text-gray-500"
                                                        // className="text-red-600 hover:text-red-900 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>{t('Remove')}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                    </div>

                    {/* Return Summary */}
                    <div className="mt-6 flex justify-end">
                        <div className="border border-1 bg-gray-50 dark:bg-gray-800 rounded-lg p-4 w-full sm:w-80">
                            <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">{t('Return Summary')}</h4>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600 dark:text-gray-400">{t('Subtotal')}</span>
                                    <span className="font-medium font-mono">{window.appSettings.formatCurrency(formData.items.reduce((sum: number, item: any) => sum + (item.quantity * item.unit_price), 0))}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600 dark:text-gray-400">{t('Tax')}</span>
                                    <span className="font-medium font-mono">{window.appSettings.formatCurrency(formData.items.reduce((sum: number, item: any) => sum + (item.quantity * item.unit_price * (item.tax_rate / 100)), 0))}</span>
                                </div>
                                {selectedSale?.discount_amount > 0 && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600 dark:text-gray-400">{t('Discount')}</span>
                                        <span className="font-medium text-green-600 font-mono">-{window.appSettings.formatCurrency(selectedSale.discount_amount)}</span>
                                    </div>
                                )}
                                <div className="border-t border-gray-200 dark:border-gray-600 pt-2 mt-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-lg font-semibold text-gray-900 dark:text-white">{t('Total')}</span>
                                        <span className="text-lg font-bold text-gray-900 dark:text-white font-mono">{window.appSettings.formatCurrency(formData.items.reduce((sum: number, item: any) => {
                                            const subtotal = item.quantity * item.unit_price;
                                            const tax = subtotal * (item.tax_rate / 100);
                                            return sum + subtotal + tax;
                                        }, 0) - (selectedSale?.discount_amount || 0))}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Show items validation error even when no items are present */}
            {!isStatusOnly && (
                <InputError message={errors.items} />
            )}

            {/* Bottom Actions */}
            <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => router.visit(route('sale-returns.index'))}>
                    {t('Cancel')}
                </Button>
                <Button onClick={handleSubmit} className="flex items-center gap-2">
                    {t('Save')}
                </Button>
            </div>
        </PageTemplate>
    );
}
