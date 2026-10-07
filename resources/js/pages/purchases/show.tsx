import { PageTemplate } from '@/components/page-template';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, ShoppingCart, User, Calendar, DollarSign, FileText, Package, Hash, Mail, Phone, MapPin, Building2, PackageX, StickyNote, Lock } from 'lucide-react';
import { usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';

export default function PurchaseShow() {
    const { t } = useTranslation();
    const { purchase, companyInfo } = usePage().props as { purchase: any; companyInfo: any };
    const getInitials = useInitials();

    const breadcrumbs = [
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Purchase Management'), href: route('purchases.index') },
        { title: purchase.purchase_number || t('Purchase Details') }
    ];

    const totalItems = purchase.items?.length || 0;
    const totalQuantity = purchase.items?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 0;
    const subtotal = purchase.items?.reduce((sum: number, item: any) => sum + (item.quantity * item.unit_price), 0) || 0;
    const totalTax = purchase.items?.reduce((sum: number, item: any) => sum + (parseFloat(item.tax_amount) || 0), 0) || 0;
    const totalAmount = parseFloat(purchase.total_amount) || (subtotal + totalTax);

    return (
        <PageTemplate
            title={t('Purchase Details')}
            url={`/purchases/${purchase.id}`}
            breadcrumbs={breadcrumbs}
            actions={[
                {
                    label: t('Back'),
                    icon: <ArrowLeft className="h-4 w-4" />,
                    variant: 'outline',
                    onClick: () => router.visit(route('purchases.index'))
                }
            ]}
            description={t('View purchase order details and vendor information.')}
        >
            <div className="flex flex-col lg:flex-row gap-6 items-start w-full max-w-full min-w-0">

                {/* ── LEFT: main content ── */}
                <div className="flex-1 min-w-0 w-full max-w-full space-y-6">

                {/* Billing & Addresses */}
                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <Building2 className="h-4 w-4 text-primary" />
                            </div>
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{t('Billing & Addresses')}</h3>
                        </div>
                        <div className="p-4 sm:p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Billed From - Vendor */}
                                <div>
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wide mb-2">{t('Billed From')}</p>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">{purchase.vendor?.name || '-'}</p>
                                    {purchase.vendor?.email && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 break-all">{purchase.vendor.email}</p>}
                                    <div className="border-t border-gray-200 dark:border-gray-700 mt-3 pt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('Billing Address')}</p>
                                            {purchase.vendor?.billing_address || purchase.vendor?.billing_city ? (
                                                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                                    {[purchase.vendor?.billing_address, purchase.vendor?.billing_city, purchase.vendor?.billing_state, purchase.vendor?.billing_postal_code, purchase.vendor?.billing_country].filter(Boolean).join(', ')}
                                                </p>
                                            ) : <p className="text-sm text-gray-400">-</p>}
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('Shipping Address')}</p>
                                            {purchase.vendor?.shipping_address || purchase.vendor?.shipping_city ? (
                                                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                                    {[purchase.vendor?.shipping_address, purchase.vendor?.shipping_city, purchase.vendor?.shipping_state, purchase.vendor?.shipping_postal_code, purchase.vendor?.shipping_country].filter(Boolean).join(', ')}
                                                </p>
                                            ) : <p className="text-sm text-gray-400">-</p>}
                                        </div>
                                    </div>
                                </div>

                                {/* Billed To - Company */}
                                <div className="pt-6 md:pt-0 border-t md:border-t-0 md:border-l md:border-gray-200 md:dark:border-gray-700 md:pl-6 border-gray-200 dark:border-gray-700">
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wide mb-2">{t('Billed To')}</p>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">{companyInfo?.name || '-'}</p>
                                    {[companyInfo?.address, companyInfo?.city, companyInfo?.state && companyInfo?.zip ? `${companyInfo.state} ${companyInfo.zip}` : (companyInfo?.state || companyInfo?.zip)].filter(Boolean).map((line, i) => (
                                        <p key={i} className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">{line}</p>
                                    ))}
                                    {companyInfo?.country && <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">{companyInfo.country}</p>}
                                    {companyInfo?.phone && <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">{t('Phone')}: {companyInfo.phone}</p>}
                                    {companyInfo?.email && <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">{t('Email')}: {companyInfo.email}</p>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Purchase Items */}
                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <Package className="h-4 w-4 text-primary" />
                            </div>
                            <h3 className="text-base font-semibold text-gray-900 dark:text-white">{t('Purchase Items')}</h3>
                            <span className="ms-auto inline-flex items-center rounded-md px-2 py-0.5 ring-1 ring-inset ring-gray-600/20 text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                                {totalItems} {t('items')} &bull; {totalQuantity} {t('units')}
                            </span>
                        </div>

                        {(!purchase.items || purchase.items.length === 0) ? (
                            <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
                                <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                                    <PackageX className="h-7 w-7 text-gray-400 dark:text-gray-500" />
                                </div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">{t('No Items Found')}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{t('This purchase has no items recorded.')}</p>
                            </div>
                        ) : (
                            <>
                            <div className="overflow-x-auto">
                                <Table className="min-w-[650px]">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-12 text-center">#</TableHead>
                                            <TableHead>{t('Product')}</TableHead>
                                            <TableHead className="text-center">{t('Qty')}</TableHead>
                                            <TableHead className="text-end">{t('Unit Price')}</TableHead>
                                            <TableHead className="text-end">{t('Tax')}</TableHead>
                                            <TableHead className="text-end">{t('Total')}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {purchase.items.map((item: any, index: number) => {
                                            const lineTotal = item.total_price || (item.quantity * item.unit_price);
                                            return (
                                                <TableRow key={index}>
                                                    <TableCell className="text-center font-medium text-gray-500 dark:text-gray-400">
                                                        {index + 1}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                                                                <img
                                                                    src={item.product?.image
                                                                        ? (item.product.image.startsWith('http')
                                                                            ? item.product.image
                                                                            : `${window.appSettings?.baseUrl || window.location.origin}${item.product.image}`)
                                                                        : `${window.appSettings?.baseUrl || window.location.origin}/images/default/image-not-found.jpg`}
                                                                    alt={item.product?.name || 'Product'}
                                                                    className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                                                    onClick={() => window.open(
                                                                        item.product?.image
                                                                            ? (item.product.image.startsWith('http')
                                                                                ? item.product.image
                                                                                : `${window.appSettings?.baseUrl || window.location.origin}${item.product.image}`)
                                                                            : `${window.appSettings?.baseUrl || window.location.origin}/images/default/image-not-found.jpg`,
                                                                        '_blank'
                                                                    )}
                                                                    onError={(e) => {
                                                                        const target = e.target as HTMLImageElement;
                                                                        const fallback = `${window.appSettings?.baseUrl || window.location.origin}/images/default/image-not-found.jpg`;
                                                                        if (target.src !== fallback) {
                                                                            target.src = fallback;
                                                                        }
                                                                    }}
                                                                />
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                                    {item.product?.name || '-'}
                                                                </p>
                                                                {item.product?.sku && (
                                                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                                        {t('SKU')}: {item.product.sku}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center font-medium">
                                                        {item.quantity}
                                                    </TableCell>
                                                    <TableCell className="text-end font-mono">
                                                        {window.appSettings?.formatCurrency(item.unit_price || 0)}
                                                    </TableCell>
                                                    <TableCell className="text-end" style={{ minWidth: '140px', maxWidth: '200px' }}>
                                                        {item.product?.taxes && item.product.taxes.length > 0 ? (
                                                            <div className="flex flex-col items-end gap-1">
                                                                <span className="text-sm font-mono">{window.appSettings?.formatCurrency(parseFloat(item.tax_amount) || 0)}</span>
                                                                <div className="flex flex-wrap justify-end gap-1">
                                                                    {item.product.taxes.map((tax: any, i: number) => (
                                                                        <span key={i} className="inline-flex items-center rounded-md bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300 ring-1 ring-inset ring-blue-700/10">
                                                                            {tax.name} ({parseFloat(tax.rate)}%)
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-gray-400">{t('No Tax')}</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-end font-mono">
                                                        {window.appSettings?.formatCurrency(lineTotal)}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Summary box — right-aligned below table */}
                            <div className="p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/20 flex justify-end">
                                <div className="w-full sm:w-80 rounded-xl border border-gray-300 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900">
                                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
                                        <span className="text-sm text-gray-500 dark:text-gray-400">{t('Subtotal')}</span>
                                        <span className="text-sm font-semibold text-gray-900 dark:text-white font-mono">{window.appSettings?.formatCurrency(subtotal)}</span>
                                    </div>
                                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
                                        <span className="text-sm text-gray-500 dark:text-gray-400">{t('Tax')}</span>
                                        <span className="text-sm font-semibold text-gray-900 dark:text-white font-mono">{window.appSettings?.formatCurrency(totalTax)}</span>
                                    </div>
                                    <div className="flex items-center justify-between px-4 py-3">
                                        <span className="text-sm font-bold text-gray-900 dark:text-white">{t('Grand Total')}</span>
                                        <span className="text-sm font-bold text-green-600 dark:text-green-400 font-mono">{window.appSettings?.formatCurrency(totalAmount)}</span>
                                    </div>
                                </div>
                            </div>
                            </>
                        )}
                    </div>

                    {/* Notes */}
                    {purchase.notes && (
                        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                            <div className="p-4 sm:p-5">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                        <StickyNote className="h-4 w-4 text-primary" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{t('Notes')}</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed max-h-26 overflow-y-auto">
                                            {purchase.notes}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── RIGHT: sticky sidebar ── */}
                <div className="w-full lg:w-80 xl:w-96 flex-shrink-0 lg:sticky lg:top-6 space-y-4">

                    {/* Purchase Summary Card */}
                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                        <div className="px-5 py-3.5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    <DollarSign className="h-4 w-4 text-primary" />
                                </div>
                                {t('Purchase Summary')}
                            </h3>
                        </div>
                        <div className="p-5">
                            <div className="space-y-2.5 text-sm">
                                <div className="flex justify-between items-center text-gray-600 dark:text-gray-400">
                                    <span>{t('Subtotal')}</span>
                                    <span className="font-mono text-gray-900 dark:text-white">{window.appSettings?.formatCurrency(subtotal)}</span>
                                </div>
                                <div className="flex justify-between items-center text-gray-600 dark:text-gray-400">
                                    <span>{t('Tax')}</span>
                                    <span className="font-mono text-gray-900 dark:text-white">{window.appSettings?.formatCurrency(totalTax)}</span>
                                </div>
                                <div className="border-t border-gray-200 dark:border-gray-600 pt-2.5">
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-gray-900 dark:text-white">{t('Total')}</span>
                                        <span className="text-lg font-mono text-emerald-500">{window.appSettings?.formatCurrency(totalAmount)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Vendor Details Card */}
                    {purchase.vendor && (
                        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                            <div className="px-5 py-3.5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60">
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                        <User className="h-4 w-4 text-primary" />
                                    </div>
                                    {t('Vendor Details')}
                                </h3>
                            </div>
                            <div className="p-5 space-y-3.5">
                                <div className="flex items-center gap-3">
                                    <Avatar className="w-10 h-10 flex-shrink-0">
                                        <AvatarImage src={purchase.vendor?.avatar} />
                                        <AvatarFallback className="font-semibold">
                                            {getInitials(purchase.vendor?.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                            {purchase.vendor?.name || '-'}
                                        </p>
                                        {purchase.vendor?.company_name && (
                                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{purchase.vendor.company_name}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="divide-y divide-gray-100 dark:divide-gray-800 -mx-5">
                                    {purchase.vendor.email && (
                                        <div className="flex items-center gap-2.5 px-4 py-2.5">
                                            <div className="flex-shrink-0 w-7 h-7 rounded-md bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                                                <Mail className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs text-gray-400 dark:text-gray-500">{t('Email')}</p>
                                                <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{purchase.vendor.email}</p>
                                            </div>
                                        </div>
                                    )}
                                    {purchase.vendor.phone && (
                                        <div className="flex items-center gap-2.5 px-4 py-2.5">
                                            <div className="flex-shrink-0 w-7 h-7 rounded-md bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
                                                <Phone className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs text-gray-400 dark:text-gray-500">{t('Phone')}</p>
                                                <p className="text-xs font-semibold text-gray-900 dark:text-white">{purchase.vendor.phone}</p>
                                            </div>
                                        </div>
                                    )}
                                    {(purchase.vendor.billing_address || purchase.vendor.billing_city || purchase.vendor.billing_country) && (
                                        <div className="flex items-start gap-2.5 px-4 py-2.5">
                                            <div className="flex-shrink-0 w-7 h-7 rounded-md bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center">
                                                <MapPin className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs text-gray-400 dark:text-gray-500">{t('Address')}</p>
                                                <p className="text-xs font-semibold text-gray-900 dark:text-white">
                                                    {[purchase.vendor.billing_address, purchase.vendor.billing_city, purchase.vendor.billing_country].filter(Boolean).join(', ')}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Purchase Info Card */}
                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                        <div className="px-5 py-3.5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    <FileText className="h-4 w-4 text-primary" />
                                </div>
                                {t('Purchase Information')}
                            </h3>
                        </div>

                        <div className="divide-y divide-gray-100 dark:divide-gray-800">
                            {/* Purchase Number */}
                            <div className="flex items-center gap-2.5 px-4 py-2.5">
                                <div className="flex-shrink-0 w-7 h-7 rounded-md bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                                    <Hash className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs text-gray-400 dark:text-gray-500">{t('Purchase Number')}</p>
                                    <p className="text-xs font-semibold text-gray-900 dark:text-white truncate font-mono">
                                        {purchase.purchase_number || '-'}
                                    </p>
                                </div>
                            </div>

                            {/* Purchase Date */}
                            <div className="flex items-center gap-2.5 px-4 py-2.5">
                                <div className="flex-shrink-0 w-7 h-7 rounded-md bg-cyan-50 dark:bg-cyan-900/30 flex items-center justify-center">
                                    <Calendar className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs text-gray-400 dark:text-gray-500">{t('Purchase Date')}</p>
                                    <p className="text-xs font-semibold text-gray-900 dark:text-white">
                                        {purchase.purchase_date
                                            ? (window.appSettings?.formatDateTime(purchase.purchase_date, false) || new Date(purchase.purchase_date).toLocaleDateString())
                                            : '-'}
                                    </p>
                                </div>
                            </div>

                            {/* Total Amount */}
                            <div className="flex items-center gap-2.5 px-4 py-2.5">
                                <div className="flex-shrink-0 w-7 h-7 rounded-md bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
                                    <DollarSign className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs text-gray-400 dark:text-gray-500">{t('Total Amount')}</p>
                                    <p className="text-xs font-mono font-semibold text-gray-900 dark:text-white">
                                        {window.appSettings?.formatCurrency(totalAmount)}
                                    </p>
                                </div>
                            </div>

                            {/* Created By */}
                            {purchase.creator && (
                                <div className="flex items-center gap-2.5 px-4 py-2.5">
                                    <Avatar className="h-7 w-7 flex-shrink-0">
                                        <AvatarImage src={purchase.creator?.avatar} />
                                        <AvatarFallback className="text-xs">{getInitials(purchase.creator?.name)}</AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs text-gray-400 dark:text-gray-500">{t('Created By')}</p>
                                        <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                                            {purchase.creator?.name || '-'}
                                        </p>
                                        {purchase.creator?.email && (
                                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{purchase.creator.email}</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Status */}
                            <div className="flex items-center gap-2.5 px-4 py-2.5">
                                <div className="flex-shrink-0 w-7 h-7 rounded-md bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center">
                                    <Lock className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">{t('Status')}</p>
                                    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${purchase.status === 'active'
                                            ? 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/30 dark:text-green-400 dark:ring-green-500/30'
                                            : 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-900/30 dark:text-red-400 dark:ring-red-500/30'
                                        }`}>
                                        {purchase.status === 'active' ? t('Active') : t('Inactive')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </PageTemplate>
    );
}
