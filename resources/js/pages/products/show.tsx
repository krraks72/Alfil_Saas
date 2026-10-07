import { useEffect, useRef } from 'react';
import { PageTemplate } from '@/components/page-template';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { route } from 'ziggy-js';
import {
    ArrowLeft,
    Eye, QrCode, ShoppingBag,
    TrendingUp, TrendingDown, Minus, Tag, Ruler, Percent,
    FileText, DollarSign, ShoppingCart, Package,
    Warehouse,
    Image,
} from 'lucide-react';
import { CrudTable } from '@/components/CrudTable';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';

declare global {
    interface Window { JsBarcode: any; }
}

function BarcodeItem({ id, value, label }: { id: string; value: string; label: string }) {
    const ref = useRef<SVGSVGElement>(null);

    useEffect(() => {
        const render = () => {
            if (ref.current && window.JsBarcode && value) {
                try {
                    window.JsBarcode(ref.current, value, {
                        format: 'CODE128',
                        width: 2,
                        height: 50,
                        displayValue: false,
                    });
                } catch (_) {}
            }
        };

        if (window.JsBarcode) {
            render();
        } else if (!document.querySelector('script[src*="jsbarcode"]')) {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js';
            script.onload = render;
            document.head.appendChild(script);
        } else {
            const interval = setInterval(() => {
                if (window.JsBarcode) { clearInterval(interval); render(); }
            }, 100);
            return () => clearInterval(interval);
        }
    }, [value]);

    return (
        <div className="flex flex-col items-center justify-between gap-3 p-4 border rounded-lg bg-white dark:bg-gray-800 h-full">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wide text-center">{label}</p>
            <div className="w-full flex items-center justify-center overflow-hidden">
                <svg ref={ref} className="max-w-full h-auto" />
            </div>
            <p className="text-xs font-mono text-gray-700 dark:text-gray-300 break-all text-center w-full">{value}</p>
        </div>
    );
}

export default function ProductShow() {
    const { t } = useTranslation();
    const { product, recentSales, salesComparison } = usePage().props as any;
    const imageUrl = product.image
        ? (product.image.startsWith('http')
            ? product.image
            : `${window.appSettings?.baseUrl || window.location.origin}${product.image}`)
        : null;

    const taxes = product.taxes || [];
    const sales = recentSales || [];

    const isOutOfStock = product.stock_quantity <= 0;
    const isLowStock = !isOutOfStock && product.stock_quantity <= product.min_stock_level;

    const barcodeSku  = product.sku || '';
    const barcodeId   = `PRD${String(product.id).padStart(6, '0')}`;
    const barcodeName = (product.name || '').replace(/[^A-Za-z0-9\s]/g, '').substring(0, 25).trim() || barcodeId;
    const getInitials = useInitials();

    const breadcrumbs = [
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Products'), href: route('products.index') },
        { title: t('Product Details') }
    ];

    const stockColor = isOutOfStock
        ? 'text-red-600 dark:text-red-400'
        : isLowStock
        ? 'text-yellow-600 dark:text-yellow-500'
        : 'text-orange-500 dark:text-orange-400';

    return (
        <PageTemplate
            title={product.name}
            description={t('Product Details')}
            url={`/products/${product.id}`}
            breadcrumbs={breadcrumbs}
            actions={[{
                label: t('Back'),
                icon: <ArrowLeft className="h-4 w-4" />,
                variant: 'outline',
                onClick: () => router.visit(route('products.index'))
            }]}
        >
            <div className="space-y-6 w-full max-w-full">

                {/* ── Main two-column layout ── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">

                    {/* ── LEFT: Product Image (sticky) ── */}
                    <div className="lg:col-span-4 xl:col-span-3 lg:sticky lg:top-6 z-10 w-full min-w-0">
                    <Card className="w-full">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                <Image className="h-4 w-4" />
                                {t('Product Image')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {imageUrl ? (
                                <div
                                    className="relative group cursor-pointer rounded-xl overflow-hidden border bg-gray-50 dark:bg-gray-800 aspect-square max-h-[320px] w-full mx-auto flex items-center justify-center"
                                    onClick={() => window.open(imageUrl, '_blank')}
                                >
                                    <img
                                        src={imageUrl}
                                        alt={product.name}
                                        className="w-full h-full object-contain p-4"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Eye className="h-8 w-8 text-white" />
                                    </div>
                                </div>
                            ) : (
                                <div className="rounded-xl border bg-gray-50 text-gray-500 dark:bg-gray-800 aspect-square max-h-[320px] w-full mx-auto flex flex-col items-center justify-center">
                                    <Image className="h-16 w-16 text-gray-300 dark:text-gray-600" />
                                    <span className="text-xs">{t('No image uploaded')}</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    </div>

                    {/* ── RIGHT: Product Info + Barcodes + Sales ── */}
                    <div className="lg:col-span-8 xl:col-span-9 space-y-4 w-full min-w-0">

                        {/* Name + badges + SKU */}
                        <Card>
                            <CardContent className="pt-5 pb-5">
                                {/* Badges row */}
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {product.category?.name && (
                                        <span className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20 dark:bg-green-900/30 dark:text-green-300 dark:ring-green-500/30">
                                            <Tag className="h-3 w-3" />
                                            {product.category.name}
                                        </span>
                                    )}
                                    {product.brand?.name && (
                                        <span className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-600/20 dark:bg-purple-900/30 dark:text-purple-300 dark:ring-purple-500/30">
                                            {product.brand.name}
                                        </span>
                                    )}
                                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                                        product.status === 'active'
                                            ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-900/30 dark:text-emerald-300'
                                            : 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-900/30 dark:text-red-300'
                                    }`}>
                                        {product.status === 'active' ? t('Active') : t('Inactive')}
                                    </span>
                                </div>

                                {/* Product name */}
                                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">{product.name}</h1>

                                {/* SKU */}
                                {product.sku && (
                                    <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                                        <Tag className="h-3.5 w-3.5" />
                                        <span className="font-medium">{t('SKU')}:</span>
                                        <span className="font-mono text-gray-700 dark:text-gray-300">{product.sku}</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* 3 stat cards: Sale Price / Purchase Price / Total Stock */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                            {/* Sale Price */}
                            <Card className='bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800/40'>
                                <CardContent className="pt-4 pb-4">
                                    <div className="flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400 mb-2">
                                        <DollarSign className="h-3.5 w-3.5" />
                                        {t('Sale Price')}
                                    </div>
                                    <p className="text-lg sm:text-xl font-mono text-green-700 dark:text-green-300">
                                        {product.selling_price != null
                                            ? window.appSettings?.formatCurrency(product.selling_price)
                                            : '-'}
                                    </p>
                                </CardContent>
                            </Card>

                            {/* Purchase Price */}
                            <Card className='bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800/40'>
                                <CardContent className="pt-4 pb-4">
                                    <div className="flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 mb-2">
                                        <ShoppingCart className="h-3.5 w-3.5" />
                                        {t('Purchase Price')}
                                    </div>
                                    <p className="text-lg sm:text-xl font-mono text-blue-700 dark:text-blue-300">
                                        {product.purchase_price != null
                                            ? window.appSettings?.formatCurrency(product.purchase_price)
                                            : '-'}
                                    </p>
                                </CardContent>
                            </Card>

                            {/* Total Stock */}
                            <Card className='bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-800/40'>
                                <CardContent className="pt-4 pb-4">
                                    <div className="flex items-center gap-1.5 text-xs font-medium text-orange-600 dark:text-orange-400 mb-2">
                                        <Package className="h-3.5 w-3.5" />
                                        {t('Total Stock')}
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className={`text-lg sm:text-xl font-bold ${stockColor}`}>
                                            {product.stock_quantity ?? '-'}
                                        </p>
                                        {isOutOfStock && (
                                            <span className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ring-red-600/20 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 dark:ring-red-500/30">
                                                {t('Out of Stock')}
                                            </span>
                                        )}
                                        {isLowStock && (
                                            <span className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ring-yellow-600/20 bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 dark:ring-yellow-500/30">
                                                {t('Low Stock')}
                                            </span>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Warehouse / Min Stock */}
                        <Card>
                            <CardHeader className="pb-2 pt-4">
                                <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                    <Package className="h-4 w-4" />
                                    {t('Stock Information')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pb-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 p-3 sm:px-4 sm:py-3 bg-gray-50 dark:bg-gray-800/50 gap-2 sm:gap-0">
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{t('Min Stock Level')}</p>
                                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                            {product.min_stock_level ?? '-'}
                                        </p>
                                    </div>
                                    {product.purchase_price > 0 && (
                                        <div className="text-left sm:text-right">
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{t('Profit Margin')}</p>
                                            <p className="text-sm font-semibold">
                                                {(((product.selling_price - product.purchase_price) / product.purchase_price) * 100).toFixed(1)}%
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Unit of Measurement + Taxes */}
                        <Card>
                            <CardContent className="pt-4 pb-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mb-2">
                                            <Ruler className="h-3.5 w-3.5" />
                                            {t('Unit of Measurement')}
                                        </p>
                                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                            {product.unit?.name || '-'}
                                        </p>
                                    </div>
                                    {taxes.length > 0 && (
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mb-2">
                                                <Percent className="h-3.5 w-3.5" />
                                                {t('Taxes')}
                                            </p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {taxes.map((tax: any) => (
                                                    <span key={tax.id} className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20 dark:bg-blue-900/30 dark:text-blue-300">
                                                        {tax.name} ({tax.type === 'percentage' ? `${tax.rate}%` : `$${tax.rate}`})
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Short Description */}
                        {product.description && (
                            <Card>
                                <CardHeader className="pb-2 pt-4">
                                    <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                        <FileText className="h-4 w-4" />
                                        {t('Short Description')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pb-4">
                                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                                        {product.description}
                                    </p>
                                </CardContent>
                            </Card>
                        )}

                        {/* ── Barcodes ── */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <QrCode className="h-4 w-4 text-muted-foreground" />
                                    {t('Barcodes')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                                    {barcodeSku && (
                                        <BarcodeItem
                                            id={`barcode-sku-${product.id}`}
                                            value={barcodeSku}
                                            label={t('SKU')}
                                        />
                                    )}
                                    <BarcodeItem
                                        id={`barcode-id-${product.id}`}
                                        value={barcodeId}
                                        label={t('Product ID')}
                                    />
                                    {barcodeName.length >= 3 && (
                                        <BarcodeItem
                                            id={`barcode-name-${product.id}`}
                                            value={barcodeName}
                                            label={t('Product Name')}
                                        />
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* ── Last 30 Days Sales ── */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                                    {t('Last 30 Days Sales')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">

                        {salesComparison && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                                <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4 min-w-0">
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wide mb-1 truncate">{t('Last 30 Days Revenue')}</p>
                                    <p className="text-xl font-mono text-gray-900 dark:text-white mb-1 truncate">
                                        {window.appSettings?.formatCurrency
                                            ? window.appSettings.formatCurrency(salesComparison.current_amount)
                                            : salesComparison.current_amount}
                                    </p>
                                    <div className={`flex items-center gap-1 text-sm font-medium ${
                                        salesComparison.amount_trend === 'increase' ? 'text-emerald-600 dark:text-emerald-400'
                                        : salesComparison.amount_trend === 'decrease' ? 'text-red-600 dark:text-red-400'
                                        : 'text-gray-500 dark:text-gray-400'
                                    }`}>
                                        {salesComparison.amount_trend === 'increase' && <TrendingUp className="h-4 w-4 shrink-0" />}
                                        {salesComparison.amount_trend === 'decrease' && <TrendingDown className="h-4 w-4 shrink-0" />}
                                        {salesComparison.amount_trend === 'no-change' && <Minus className="h-4 w-4 shrink-0" />}
                                        <span className="truncate">
                                            {salesComparison.amount_trend === 'increase' && `▲ +${salesComparison.amount_pct}%`}
                                            {salesComparison.amount_trend === 'decrease' && `▼ -${salesComparison.amount_pct}%`}
                                            {salesComparison.amount_trend === 'no-change' && '0%'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">
                                        {salesComparison.amount_trend === 'no-change' ? t('No Change') : t('Compared to Previous 30 Days')}
                                    </p>
                                </div>

                                <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4 min-w-0">
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wide mb-1 truncate">{t('Units Sold (Last 30 Days)')}</p>
                                    <p className="text-xl font-bold text-gray-900 dark:text-white mb-1 truncate">
                                        {salesComparison.current_qty} {t('Units')}
                                    </p>
                                    <div className={`flex items-center gap-1 text-sm font-medium ${
                                        salesComparison.qty_trend === 'increase' ? 'text-emerald-600 dark:text-emerald-400'
                                        : salesComparison.qty_trend === 'decrease' ? 'text-red-600 dark:text-red-400'
                                        : 'text-gray-500 dark:text-gray-400'
                                    }`}>
                                        {salesComparison.qty_trend === 'increase' && <TrendingUp className="h-4 w-4 shrink-0" />}
                                        {salesComparison.qty_trend === 'decrease' && <TrendingDown className="h-4 w-4 shrink-0" />}
                                        {salesComparison.qty_trend === 'no-change' && <Minus className="h-4 w-4 shrink-0" />}
                                        <span className="truncate">
                                            {salesComparison.qty_trend === 'increase' && `▲ +${salesComparison.qty_pct}%`}
                                            {salesComparison.qty_trend === 'decrease' && `▼ -${salesComparison.qty_pct}%`}
                                            {salesComparison.qty_trend === 'no-change' && '0%'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">
                                        {salesComparison.qty_trend === 'no-change' ? t('No Change') : t('Compared to Previous 30 Days')}
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="overflow-x-auto w-full">
                                <CrudTable
                                    columns={[
                                        {
                                            key: 'sale_number',
                                            label: t('Invoice'),
                                            render: (value: string) => (
                                                <span className="inline-flex items-center rounded-md px-2 py-1 text-nowrap text-xs font-medium bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20 font-mono">
                                                    {value || '-'}
                                                </span>
                                            ),
                                        },
                                        {
                                            key: 'customer_name', label: t('Customer'), render: (value: string, row: any) => {
                                                return (<div className="flex items-center gap-3 min-w-[180px]">
                                                    <Avatar className="h-9 w-9 shrink-0">
                                                        <AvatarFallback>{getInitials(row?.customer_name)}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="min-w-0">
                                                        <div className="font-medium text-sm text-gray-900 dark:text-white truncate">{row?.customer_name || '-'}</div>
                                                        <div className="text-xs text-gray-500 truncate">{row?.customer_email || ''}</div>
                                                    </div>
                                                </div>);
                                            }
                                        },
                                        {
                                            key: 'quantity',
                                            label: t('Qty'),
                                            render: (value: number) => (
                                                <span className="font-medium text-gray-900 dark:text-white">{value}</span>
                                            ),
                                        },
                                        {
                                            key: 'unit_price',
                                            label: t('Unit Price'),
                                            render: (value: number) => (
                                                <span className="whitespace-nowrap font-mono">
                                                    {window.appSettings?.formatCurrency ? window.appSettings.formatCurrency(value) : value}
                                                </span>
                                            ),
                                        },
                                        {
                                            key: 'tax_amount',
                                            label: t('Tax'),
                                            render: (value: number, row: any) => (
                                                Number(value) > 0 ? (
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20 w-fit">
                                                            {Number(row.tax_rate) > 0 ? `${row.tax_rate}%` : t('Tax')}
                                                        </span>
                                                        <span className="text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap font-mono">
                                                            {window.appSettings?.formatCurrency ? window.appSettings.formatCurrency(value) : value}
                                                        </span>
                                                    </div>
                                                ) : <span className="text-gray-400">-</span>
                                            ),
                                        },
                                        {
                                            key: 'line_total',
                                            label: t('Total'),
                                            render: (value: number) => (
                                                <span className="font-mono text-gray-900 dark:text-white whitespace-nowrap">
                                                    {window.appSettings?.formatCurrency ? window.appSettings.formatCurrency(value) : value}
                                                </span>
                                            ),
                                        },
                                        { key: 'sale_date', label: t('Sale Date'), type: 'date' },
                                    ]}
                                    actions={[]}
                                    data={sales}
                                    from={1}
                                    onAction={() => {}}
                                    permissions={[]}
                                />
                            </div>
                        </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </PageTemplate>
    );
}
