import InputError from '@/components/input-error';
import MediaPicker from '@/components/MediaPicker';
import { PageTemplate } from '@/components/page-template';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { FormDataConvertible } from '@inertiajs/core';
import { router, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, ClipboardList, Package, Plus, Tag, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { route } from 'ziggy-js';

interface ProductOption {
    id: number;
    name: string;
    sku: string;
    stock_quantity: number;
    min_stock_level: number;
    selling_price: number;
    image: string;
}

interface NamedOption {
    id: number;
    name: string;
}

interface ProcessedProductForm {
    [key: string]: FormDataConvertible;
    output_mode: 'new' | 'existing';
    output_product_id: string;
    produced_quantity: string;
    processed_date: string;
    notes: string;
    product: Record<string, FormDataConvertible> & {
        name: string;
        sku: string;
        category_id: string;
        unit_id: string;
        purchase_price: string;
        selling_price: string;
        min_stock_level: string;
        image: string;
    };
    items: Array<Record<string, FormDataConvertible> & { product_id: string; quantity: string }>;
}

export default function CreateProcessedProduct() {
    const { t } = useTranslation();
    const { products, categories, units } = usePage().props as unknown as {
        products: ProductOption[];
        categories: NamedOption[];
        units: NamedOption[];
    };
    const today = new Date().toISOString().slice(0, 10);
    const { data, setData, post, processing, errors } = useForm<ProcessedProductForm>({
        processed_date: today,
        notes: '',
        output_mode: 'new',
        output_product_id: '',
        produced_quantity: '1',
        product: {
            name: '',
            sku: '',
            category_id: '',
            unit_id: '',
            purchase_price: '0',
            selling_price: '0',
            min_stock_level: '0',
            image: '',
        },
        items: [{ product_id: '', quantity: '1' }],
    });
    const formErrors = errors as Record<string, string>;

    const updateProduct = (field: keyof ProcessedProductForm['product'], value: string) => {
        setData('product', { ...data.product, [field]: value });
    };

    const updateItem = (index: number, field: 'product_id' | 'quantity', value: string) => {
        setData(
            'items',
            data.items.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)),
        );
    };

    const addItem = () => setData('items', [...data.items, { product_id: '', quantity: '1' }]);
    const removeItem = (index: number) =>
        setData(
            'items',
            data.items.filter((_, itemIndex) => itemIndex !== index),
        );

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        post(route('processed-products.store'));
    };

    const breadcrumbs = [
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Processed Products'), href: route('processed-products.index') },
        { title: t('Create Processed Product') },
    ];
    const selectedOutputProduct = products.find((product) => String(product.id) === data.output_product_id);
    const previewName = data.output_mode === 'existing' ? selectedOutputProduct?.name : data.product.name;
    const previewSku = data.output_mode === 'existing' ? selectedOutputProduct?.sku : data.product.sku;
    const previewImage = data.output_mode === 'existing' ? selectedOutputProduct?.image : data.product.image;
    const previewPrice = data.output_mode === 'existing' ? selectedOutputProduct?.selling_price : data.product.selling_price;
    const previewStock =
        data.output_mode === 'existing'
            ? (selectedOutputProduct?.stock_quantity ?? 0) + Number(data.produced_quantity || 0)
            : Number(data.produced_quantity || 0);
    const previewMinStock =
        data.output_mode === 'existing' ? (selectedOutputProduct?.min_stock_level ?? 0) : Number(data.product.min_stock_level || 0);
    const isLowStock = previewStock <= previewMinStock;

    return (
        <PageTemplate
            title={t('Create Processed Product')}
            description={t('Create a product from existing inventory items.')}
            url={route('processed-products.create')}
            breadcrumbs={breadcrumbs}
            actions={[
                {
                    label: t('Back'),
                    icon: <ArrowLeft className="h-4 w-4" />,
                    onClick: () => router.visit(route('processed-products.index')),
                },
            ]}
        >
            <form onSubmit={submit}>
                <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(280px,320px)]">
                    <div className="space-y-6">
                        <Card className="overflow-hidden">
                            <CardHeader className="border-b bg-gray-50 dark:bg-gray-800/50">
                                <CardTitle className="flex items-center gap-2 text-base font-bold">
                                    <Package className="text-primary h-4 w-4" />
                                    {t('Processed Product Details')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 gap-5 pt-6 md:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label required>{t('Output product option')}</Label>
                                    <Select value={data.output_mode} onValueChange={(value) => setData('output_mode', value as 'new' | 'existing')}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="new">{t('Create a new product')}</SelectItem>
                                            <SelectItem value="existing">{t('Add stock to an existing product')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                {data.output_mode === 'existing' && (
                                    <div className="space-y-1.5">
                                        <Label required>{t('Existing output product')}</Label>
                                        <Select value={data.output_product_id} onValueChange={(value) => setData('output_product_id', value)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder={t('Select output product')} />
                                            </SelectTrigger>
                                            <SelectContent searchable>
                                                {products.map((product) => (
                                                    <SelectItem key={product.id} value={String(product.id)}>
                                                        {product.name} ({product.sku}) — {t('Current stock')}: {product.stock_quantity}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={formErrors.output_product_id} />
                                        {selectedOutputProduct && (
                                            <p className="text-muted-foreground text-xs">
                                                {t('Current stock')}: {selectedOutputProduct.stock_quantity}
                                            </p>
                                        )}
                                    </div>
                                )}
                                <div className="space-y-1.5">
                                    <Label required>{t('Produced quantity')}</Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        step="1"
                                        value={data.produced_quantity}
                                        onChange={(event) => setData('produced_quantity', event.target.value)}
                                    />
                                    <InputError message={formErrors.produced_quantity} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label required>{t('Processing date')}</Label>
                                    <Input
                                        type="date"
                                        value={data.processed_date}
                                        onChange={(event) => setData('processed_date', event.target.value)}
                                    />
                                    <InputError message={formErrors.processed_date} />
                                </div>
                                {data.output_mode === 'new' && (
                                    <>
                                        <div className="space-y-1.5">
                                            <Label required>{t('Product name')}</Label>
                                            <Input value={data.product.name} onChange={(event) => updateProduct('name', event.target.value)} />
                                            <InputError message={formErrors['product.name']} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label required>{t('SKU')}</Label>
                                            <Input value={data.product.sku} onChange={(event) => updateProduct('sku', event.target.value)} />
                                            <InputError message={formErrors['product.sku']} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label required>{t('Category')}</Label>
                                            <Select value={data.product.category_id} onValueChange={(value) => updateProduct('category_id', value)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={t('Select Category')} />
                                                </SelectTrigger>
                                                <SelectContent searchable>
                                                    {categories.map((category) => (
                                                        <SelectItem key={category.id} value={String(category.id)}>
                                                            {category.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <InputError message={formErrors['product.category_id']} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label required>{t('Unit')}</Label>
                                            <Select value={data.product.unit_id} onValueChange={(value) => updateProduct('unit_id', value)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={t('Select Unit')} />
                                                </SelectTrigger>
                                                <SelectContent searchable>
                                                    {units.map((unit) => (
                                                        <SelectItem key={unit.id} value={String(unit.id)}>
                                                            {unit.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <InputError message={formErrors['product.unit_id']} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label required>{t('Purchase price')}</Label>
                                            <Input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={data.product.purchase_price}
                                                onChange={(event) => updateProduct('purchase_price', event.target.value)}
                                            />
                                            <InputError message={formErrors['product.purchase_price']} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label required>{t('Sale Price')}</Label>
                                            <Input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={data.product.selling_price}
                                                onChange={(event) => updateProduct('selling_price', event.target.value)}
                                            />
                                            <InputError message={formErrors['product.selling_price']} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label required>{t('Minimum stock level')}</Label>
                                            <Input
                                                type="number"
                                                min="0"
                                                step="1"
                                                value={data.product.min_stock_level}
                                                onChange={(event) => updateProduct('min_stock_level', event.target.value)}
                                            />
                                            <InputError message={formErrors['product.min_stock_level']} />
                                        </div>
                                        <div className="space-y-1.5 md:col-span-2">
                                            <Label>{t('Product Image')}</Label>
                                            <MediaPicker
                                                value={data.product.image}
                                                onChange={(value) => updateProduct('image', value)}
                                                placeholder={t('Browse or select a product image')}
                                            />
                                            <InputError message={formErrors['product.image']} />
                                        </div>
                                    </>
                                )}
                                <div className="space-y-1.5 md:col-span-2">
                                    <Label>{t('Notes')}</Label>
                                    <Textarea rows={3} value={data.notes} onChange={(event) => setData('notes', event.target.value)} />
                                    <InputError message={formErrors.notes} />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="overflow-hidden">
                            <CardHeader className="flex flex-row items-center justify-between gap-3 border-b bg-gray-50 dark:bg-gray-800/50">
                                <CardTitle className="flex items-center gap-2 text-base font-bold">
                                    <ClipboardList className="text-primary h-4 w-4" />
                                    {t('Inventory items used')}
                                </CardTitle>
                                <Button type="button" onClick={addItem} variant="default">
                                    <Plus className="h-4 w-4" />
                                    {t('Add Item')}
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-6">
                                {data.items.map((item, index) => {
                                    const selectedProduct = products.find((product) => String(product.id) === item.product_id);
                                    const itemErrorKey = `items.${index}`;
                                    const availableProducts = products.filter(
                                        (product) =>
                                            product.id === Number(item.product_id) ||
                                            ((data.output_mode !== 'existing' || product.id !== Number(data.output_product_id)) &&
                                                !data.items.some(
                                                    (other, otherIndex) => otherIndex !== index && other.product_id === String(product.id),
                                                )),
                                    );

                                    return (
                                        <div
                                            key={index}
                                            className="grid grid-cols-1 items-start gap-3 rounded-lg border p-4 sm:grid-cols-[minmax(0,1fr)_150px_auto]"
                                        >
                                            <div className="space-y-1.5">
                                                <Label required>{t('Product')}</Label>
                                                <Select value={item.product_id} onValueChange={(value) => updateItem(index, 'product_id', value)}>
                                                    <SelectTrigger className="h-9">
                                                        <SelectValue placeholder={t('Select Product')} />
                                                    </SelectTrigger>
                                                    <SelectContent searchable>
                                                        {availableProducts.map((product) => (
                                                            <SelectItem key={product.id} value={String(product.id)}>
                                                                {product.name} ({product.sku}) — {t('Available')}: {product.stock_quantity}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <InputError message={formErrors[`${itemErrorKey}.product_id`]} />
                                                {selectedProduct && (
                                                    <p className="text-muted-foreground text-xs">
                                                        {t('Available stock')}: {selectedProduct.stock_quantity}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label required>{t('Quantity')}</Label>
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    step="1"
                                                    value={item.quantity}
                                                    onChange={(event) => updateItem(index, 'quantity', event.target.value)}
                                                />
                                                <InputError message={formErrors[`${itemErrorKey}.quantity`]} />
                                            </div>
                                            <div className="flex justify-end sm:pt-5">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeItem(index)}
                                                    disabled={data.items.length === 1}
                                                    aria-label={t('Remove item')}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                                <InputError message={formErrors.items} />
                            </CardContent>
                        </Card>

                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => router.visit(route('processed-products.index'))}>
                                {t('Cancel')}
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {processing ? t('Processing...') : t('Create Processed Product')}
                            </Button>
                        </div>
                    </div>
                    <aside className="w-full min-w-0 rounded-xl border border-gray-200 bg-white shadow-sm xl:sticky xl:top-6 dark:border-gray-700 dark:bg-gray-900">
                        <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-700">
                            <p className="text-xs font-semibold tracking-widest text-gray-400 dark:text-gray-500">{t('Live Preview')}</p>
                        </div>
                        <div className="space-y-3 p-4">
                            <div className="flex h-32 w-full items-center justify-center overflow-hidden rounded-lg border border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                                {previewImage ? (
                                    <img src={previewImage} alt={previewName || t('Untitled Product')} className="h-full w-full object-cover" />
                                ) : (
                                    <div className="flex flex-col items-center gap-1.5 text-gray-300 dark:text-gray-600">
                                        <Package className="h-8 w-8" />
                                        <span className="text-xs">{t('No image uploaded')}</span>
                                    </div>
                                )}
                            </div>
                            <div>
                                <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{previewName || t('Untitled Product')}</p>
                                <div className="mt-0.5 flex items-center gap-1">
                                    <Tag className="h-3 w-3 text-gray-400" />
                                    <p className="truncate text-xs text-gray-400">{previewSku || 'SKU-XXXXXXXX'}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="rounded-lg border border-gray-100 bg-gray-50 px-2.5 py-2 dark:border-gray-700 dark:bg-gray-800">
                                    <p className="text-xs tracking-wide text-gray-400">{t('Sale Price')}</p>
                                    <p className="mt-0.5 font-mono text-sm text-gray-900 dark:text-white">
                                        {window.appSettings.formatCurrency(Number(previewPrice || 0).toFixed(2))}
                                    </p>
                                </div>
                                <div
                                    className={`rounded-lg border px-2.5 py-2 ${isLowStock ? 'border-orange-100 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20' : 'border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-800'}`}
                                >
                                    <p className="text-xs tracking-wide text-gray-400">{t('Stock after processing')}</p>
                                    <p className={`mt-0.5 text-sm font-bold ${isLowStock ? 'text-orange-500' : 'text-gray-900 dark:text-white'}`}>
                                        {previewStock}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-400">{t('Status')}</span>
                                <span className="inline-flex items-center gap-1 rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-green-600/20 ring-inset dark:bg-green-900/30 dark:text-green-300 dark:ring-green-500/30">
                                    {t('Active')}
                                </span>
                            </div>
                        </div>
                    </aside>
                </div>
            </form>
        </PageTemplate>
    );
}
