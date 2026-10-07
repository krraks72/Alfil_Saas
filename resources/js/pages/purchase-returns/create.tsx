import { PageTemplate } from '@/components/page-template';
import { usePage, router, useForm } from '@inertiajs/react';
import { Minus, Plus, ArrowLeft, Trash2, ClipboardCheck } from 'lucide-react';
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

export default function CreatePurchaseReturn() {
    const { t } = useTranslation();
    const { purchases, branches } = usePage().props as any;

    const today = new Date().toISOString().split('T')[0];

    const { data: formData, setData, post, errors } = useForm({
        purchase_id: '',
        branch_id: '',
        return_date: today,
        reason: '',
        notes: '',
        items: [] as any[],
    });

    const handleChange = (field: string, value: any) => {
        setData((prev: any) => {
            const updated: any = { ...prev, [field]: value };
            if (field === 'purchase_id') {
                updated.items = [];
            }
            return updated;
        });
    };

    const selectedPurchase = purchases?.find((p: any) => p.id == formData.purchase_id);

    const addItem = (purchaseItem: any) => {
        if (formData.items.some((i: any) => i.purchase_item_id == purchaseItem.id)) return;
        const taxIds: number[] = purchaseItem.taxes || [];
        const productTaxes: any[] = purchaseItem.product?.taxes || [];
        const individual_taxes = productTaxes.filter((t: any) => taxIds.includes(t.id));
        const taxRate = individual_taxes.reduce((sum: number, t: any) => sum + (parseFloat(t.rate) || 0), 0);
        const availableQty = purchaseItem.quantity - (purchaseItem.returned_quantity || 0);
        setData('items', [...formData.items, {
            product_id: purchaseItem.product_id,
            purchase_item_id: purchaseItem.id,
            product_name: purchaseItem.product?.name || 'Unknown',
            product_image: purchaseItem.product?.image || `${window.appSettings?.imageUrl || ''}/images/default/image-not-found.jpg`,
            product_sku: purchaseItem.product?.sku || '',
            quantity: 1,
            max_quantity: availableQty,
            unit_price: purchaseItem.unit_price,
            tax_rate: taxRate,
            individual_taxes: individual_taxes,
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

    const handleSubmit = () => {
        post(route('purchase-returns.store'), {
            onSuccess: (page) => {
                toast.dismiss();
                if (page.props.flash?.success) toast.success(page.props.flash.success);
                router.visit(route('purchase-returns.index'));
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
            onClick: () => router.visit(route('purchase-returns.index')),
        },
    ];

    const breadcrumbs = [
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Purchase Management'), href: route('purchases.index') },
        { title: t('Purchase Returns'), href: route('purchase-returns.index') },
        { title: t('Add Purchase Return') }
    ];

    return (
        <PageTemplate title={t('Add Purchase Return')} breadcrumbs={breadcrumbs} actions={pageActions} description={t('Create a new purchase return.')}>

            {/* Main Form Card */}
            <div className="bg-white dark:bg-gray-900 rounded-lg border p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Purchase */}
                    <div className="space-y-2">
                        <Label required>{t('Purchase')} </Label>
                        <Select value={formData.purchase_id} onValueChange={(v) => handleChange('purchase_id', v)}>
                            <SelectTrigger>
                                <SelectValue placeholder={t('Select Purchase')} />
                            </SelectTrigger>
                            <SelectContent searchable>
                                {purchases?.map((purchase: any) => (
                                    <SelectItem key={purchase.id} value={purchase.id.toString()}>
                                        {purchase.purchase_number} - {purchase.vendor?.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.purchase_id} />
                    </div>

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
                            max={today}
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
            </div>

            {/* Return Items Card */}
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6 mb-6">
                <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('Return Items')}</h3>
                </div>

                {!selectedPurchase ? (
                    <div className="flex flex-col items-center justify-center py-12 px-6">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                            <ClipboardCheck className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            {t('No Purchase Selected')}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 text-center max-w-sm">
                            {t('Select a purchase first to see available items')}
                        </p>
                        <div className="mt-4 text-xs text-gray-400 dark:text-gray-500">
                            {t('Choose from the purchase dropdown above')}
                        </div>
                    </div>
                ) : (() => {
                    const availableItems = selectedPurchase.items?.filter((purchaseItem: any) => {
                        const availableQty = purchaseItem.quantity - (purchaseItem.returned_quantity || 0);
                        return availableQty > 0;
                    }) || [];
                    return availableItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 px-6">
                            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                                <ClipboardCheck className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                {t('No Items Available')}
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 text-center max-w-sm">
                                {t('All items from this purchase have already been returned')}
                            </p>
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
                                    {availableItems.map((purchaseItem: any) => {
                                        const addedIdx = formData.items.findIndex((i: any) => i.purchase_item_id == purchaseItem.id);
                                        const added = addedIdx >= 0;
                                        const returnItem = added ? formData.items[addedIdx] : null;
                                        const subtotal = added ? returnItem.quantity * returnItem.unit_price : purchaseItem.unit_price;

                                        return (
                                            <TableRow key={purchaseItem.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <img
                                                            src={purchaseItem.product?.image || `${window.appSettings?.imageUrl || ''}/images/default/image-not-found.jpg`}
                                                            alt=""
                                                            className="w-10 h-10 rounded object-cover border shrink-0"
                                                            onError={(e) => {
                                                                const target = e.target as HTMLImageElement;
                                                                const defaultImage = `${window.appSettings?.imageUrl || ''}/images/default/image-not-found.jpg`;
                                                                if (target.src !== defaultImage) target.src = defaultImage;
                                                            }}
                                                        />
                                                        <div className="min-w-0">
                                                            <div className="font-medium whitespace-nowrap sm:whitespace-normal">
                                                                {purchaseItem.product?.name || 'Unknown'}
                                                            </div>
                                                            {purchaseItem.product?.sku && (
                                                                <div className="text-xs text-gray-500 whitespace-nowrap sm:whitespace-normal">
                                                                    {purchaseItem.product.sku}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right font-mono">
                                                    {window.appSettings.formatCurrency(purchaseItem.unit_price || 0)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {purchaseItem.quantity - (purchaseItem.returned_quantity || 0)}
                                                </TableCell>
                                                <TableCell className="text-right font-mono">
                                                    {window.appSettings.formatCurrency(added ? subtotal : purchaseItem.unit_price)}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="default"
                                                        onClick={() => addItem(purchaseItem)}
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
                    );
                })()}
            </div>

            {/* Added Items Card */}
            {formData.items.length > 0 && (
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
                                        <TableRow key={item.purchase_item_id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={item.product_image}
                                                        alt=""
                                                        className="w-10 h-10 rounded object-cover border shrink-0"
                                                        onError={(e) => {
                                                            const target = e.target as HTMLImageElement;
                                                            const defaultImage = `${window.appSettings?.imageUrl || ''}/images/default/image-not-found.jpg`;
                                                            if (target.src !== defaultImage) target.src = defaultImage;
                                                        }}
                                                    />
                                                    <div className="min-w-0">
                                                        <div className="font-medium whitespace-nowrap sm:whitespace-normal">{item.product_name}</div>
                                                        {item.product_sku && (
                                                            <div className="text-xs text-gray-500 whitespace-nowrap sm:whitespace-normal">{item.product_sku}</div>
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
                                                    <div className="font-mono">{window.appSettings.formatCurrency(taxAmount)}</div>
                                                    {item.tax_rate > 0 && item.individual_taxes && item.individual_taxes.length > 0 && (
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                                            {item.individual_taxes.map((tax: any, i: number) => (
                                                                <div key={i}>{tax.name} - {tax.rate}%</div>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {item.tax_rate > 0 && (!item.individual_taxes || item.individual_taxes.length === 0) && (
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">{item.tax_rate}%</div>
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
                                    <span className="font-mono">{window.appSettings.formatCurrency(formData.items.reduce((sum: number, item: any) => sum + (item.quantity * item.unit_price), 0))}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600 dark:text-gray-400">{t('Tax')}</span>
                                    <span className="font-mono">{window.appSettings.formatCurrency(formData.items.reduce((sum: number, item: any) => sum + (item.quantity * item.unit_price * (item.tax_rate / 100)), 0))}</span>
                                </div>
                                <div className="border-t border-gray-200 dark:border-gray-600 pt-2 mt-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-lg font-semibold text-gray-900 dark:text-white">{t('Total')}</span>
                                        <span className="text-lg font-mono text-gray-900 dark:text-white">{window.appSettings.formatCurrency(formData.items.reduce((sum: number, item: any) => {
                                            const subtotal = item.quantity * item.unit_price;
                                            const tax = subtotal * (item.tax_rate / 100);
                                            return sum + subtotal + tax;
                                        }, 0))}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <InputError message={errors.items} />

            {/* Bottom Actions */}
            <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => router.visit(route('purchase-returns.index'))}>
                    {t('Cancel')}
                </Button>
                <Button onClick={handleSubmit} className="flex items-center gap-2">
                    {t('Save')}
                </Button>
            </div>
        </PageTemplate>
    );
}
