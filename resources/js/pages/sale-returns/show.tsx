import { PageTemplate } from '@/components/page-template';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, FileText, Calendar, User, Building2, Lock, AlertCircle, StickyNote, Package, Hash, Mail, Phone, PackageX, MapPin } from 'lucide-react';
import { usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';

export default function SaleReturnShow() {
    const { t } = useTranslation();
    const { saleReturn, companyInfo } = usePage().props as { saleReturn: any; companyInfo: any };
    const getInitials = useInitials();

    const breadcrumbs = [
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Sales Management'), href: route('sales.index') },
        { title: t('Sale Returns'), href: route('sale-returns.index') },
        { title: t('Sale Return Details') }
    ];

    const statusConfig: Record<string, { className: string; label: string }> = {
        approved: { className: 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20 dark:bg-green-900/30 dark:text-green-400 dark:ring-green-500/30', label: t('Approved') },
        rejected: { className: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20 dark:bg-red-900/30 dark:text-red-400 dark:ring-red-500/30', label: t('Rejected') },
        pending: { className: 'bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-600/20 dark:bg-yellow-900/30 dark:text-yellow-400 dark:ring-yellow-500/30', label: t('Pending') },
    };

    const status = statusConfig[saleReturn.status] || statusConfig.pending;

    // Totals — prefer stored DB values, fall back to recalculation
    const totalItems = saleReturn.items?.length || 0;
    const totalQuantity = saleReturn.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;
    const subtotal = parseFloat(saleReturn.subtotal) || saleReturn.items?.reduce((sum: number, item: any) => sum + item.quantity * item.unit_price, 0) || 0;
    const taxAmount = parseFloat(saleReturn.tax_amount) || saleReturn.items?.reduce((sum: number, item: any) => sum + parseFloat(item.tax_amount || 0), 0) || 0;
    const discountAmount = parseFloat(saleReturn.sale?.discount_amount) || 0;
    const totalAmount = parseFloat(saleReturn.total_amount) || (subtotal + taxAmount - discountAmount);

    return (
        <PageTemplate
            title={t('Sale Return Details')}
            url={`/sale-returns/${saleReturn.id}`}
            breadcrumbs={breadcrumbs}
            actions={[
                {
                    label: t('Back'),
                    icon: <ArrowLeft className="h-4 w-4" />,
                    variant: 'outline',
                    onClick: () => router.visit(route('sale-returns.index'))
                }
            ]}
            description={t('Sale return details and related information')}
        >
            {/* Two-column layout: main content left, sticky sidebar right */}
            <div className="flex flex-col lg:flex-row gap-6 items-start w-full max-w-full min-w-0">

                {/* ── LEFT: main content ── */}
                <div className="flex-1 min-w-0 w-full max-w-full space-y-6">

                    {/* Billing & Addresses */}
                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <MapPin className="h-4 w-4 text-primary" />
                            </div>
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{t('Billing & Addresses')}</h3>
                        </div>
                        <div className="p-4 sm:p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Billed From - Company */}
                                <div>
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wide mb-2">{t('Billed From')}</p>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">{companyInfo?.name || '-'}</p>
                                    {[companyInfo?.address, companyInfo?.city, companyInfo?.state && companyInfo?.zip ? `${companyInfo.state} ${companyInfo.zip}` : (companyInfo?.state || companyInfo?.zip)].filter(Boolean).map((line: string, i: number) => (
                                        <p key={i} className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">{line}</p>
                                    ))}
                                    {companyInfo?.country && <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">{companyInfo.country}</p>}
                                    {companyInfo?.phone && <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">{t('Phone')}: {companyInfo.phone}</p>}
                                    {companyInfo?.email && <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">{t('Email')}: {companyInfo.email}</p>}
                                </div>

                                {/* Billed To - Customer */}
                                <div className="pt-6 md:pt-0 border-t md:border-t-0 md:border-l md:border-gray-200 md:dark:border-gray-700 md:pl-6 border-gray-200 dark:border-gray-700">
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wide mb-2">{t('Billed To')}</p>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">{saleReturn.customer?.name || t('Walk-in Customer')}</p>
                                    {saleReturn.customer?.email && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 break-all">{saleReturn.customer.email}</p>}
                                    <div className="border-t border-gray-200 dark:border-gray-700 mt-3 pt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('Billing Address')}</p>
                                            {saleReturn.customer?.billing_address || saleReturn.customer?.billing_city ? (
                                                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                                    {[saleReturn.customer?.billing_address, saleReturn.customer?.billing_city, saleReturn.customer?.billing_state, saleReturn.customer?.billing_postal_code, saleReturn.customer?.billing_country].filter(Boolean).join(', ')}
                                                </p>
                                            ) : <p className="text-sm text-gray-400">-</p>}
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('Shipping Address')}</p>
                                            {(() => {
                                                const s = saleReturn.customer?.same_as_billing
                                                    ? { address: saleReturn.customer?.billing_address, city: saleReturn.customer?.billing_city, state: saleReturn.customer?.billing_state, postal_code: saleReturn.customer?.billing_postal_code, country: saleReturn.customer?.billing_country }
                                                    : { address: saleReturn.customer?.shipping_address, city: saleReturn.customer?.shipping_city, state: saleReturn.customer?.shipping_state, postal_code: saleReturn.customer?.shipping_postal_code, country: saleReturn.customer?.shipping_country };
                                                const parts = [s.address, s.city, s.state, s.postal_code, s.country].filter(Boolean);
                                                return parts.length > 0
                                                    ? <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{parts.join(', ')}</p>
                                                    : <p className="text-sm text-gray-400">-</p>;
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Return Items */}
                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                            {/* <Package className="h-4 w-4 text-gray-500 dark:text-gray-400" /> */}
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <Package className="h-4 w-4 text-primary" />
                            </div>
                            <h3 className="text-base font-semibold text-gray-900 dark:text-white">{t('Return Items')}</h3>
                            <span className="ms-auto inline-flex items-center rounded-md px-2 py-0.5 ring-1 ring-inset ring-gray-600/20 text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                                {totalItems} {t('items')}
                            </span>
                        </div>
                        {/* Empty state */}
                        {(!saleReturn.items || saleReturn.items.length === 0) ? (
                            <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
                                <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                                    <PackageX className="h-7 w-7 text-gray-400 dark:text-gray-500" />
                                </div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">{t('No Items Found')}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{t('This return has no items recorded.')}</p>
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
                                        {saleReturn.items.map((item: any, index: number) => {
                                            // Use stored DB values; fall back to recalculation
                                            const itemTaxAmount = parseFloat(item.tax_amount) || (item.quantity * item.unit_price * (item.tax_rate || 0)) / 100;
                                            const itemLineTotal = parseFloat(item.line_total) || (item.quantity * item.unit_price + itemTaxAmount);

                                            const getTaxDisplay = () => {
                                                if (item.individual_taxes && item.individual_taxes.length > 0) {
                                                    return (
                                                        <div className="text-end">
                                                            <p className="text-sm font-medium font-mono">
                                                                {window.appSettings?.formatCurrency(itemTaxAmount)}
                                                            </p>
                                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                                {item.individual_taxes.map((tax: any, i: number) => (
                                                                    <p key={i} className="leading-tight">{tax.name} ({tax.rate}%)</p>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    );
                                                } else if (item.tax_rate > 0) {
                                                    return (
                                                        <div className="text-end">
                                                            <p className="text-sm font-medium font-mono">
                                                                {window.appSettings?.formatCurrency(itemTaxAmount)}
                                                            </p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">Tax ({item.tax_rate}%)</p>
                                                        </div>
                                                    );
                                                }
                                                return (
                                                    <div className="text-end">
                                                        <p className="text-sm font-medium font-mono">{window.appSettings?.formatCurrency(0)}</p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">{t('No Tax')}</p>
                                                    </div>
                                                );
                                            };

                                            return (
                                                <TableRow key={index}>
                                                    <TableCell className="text-center font-medium text-gray-500 dark:text-gray-400">
                                                        {index + 1}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden cursor-pointer">
                                                                <img
                                                                    src={item.product?.image || '/images/default/image-not-found.jpg'}
                                                                    alt={item.product?.name || item.product_name || 'Product'}
                                                                    className="w-full h-full object-cover hover:opacity-80 transition-opacity"
                                                                    onClick={() => window.open(item.product?.image || '/images/default/image-not-found.jpg', '_blank')}
                                                                    onError={(e) => {
                                                                        const target = e.target as HTMLImageElement;
                                                                        if (target.src !== '/images/default/image-not-found.jpg') {
                                                                            target.src = '/images/default/image-not-found.jpg';
                                                                        }
                                                                    }}
                                                                />
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                                    {item.product?.name || item.product_name || '-'}
                                                                </p>
                                                                {(item.product?.sku || item.product_sku) && (
                                                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                                        {t('SKU')}: {item.product?.sku || item.product_sku}
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
                                                    <TableCell>{getTaxDisplay()}</TableCell>
                                                    <TableCell className="text-end font-bold font-mono">
                                                        {window.appSettings?.formatCurrency(itemLineTotal)}
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
                                    {/* Subtotal */}
                                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
                                        <span className="text-sm text-gray-500 dark:text-gray-400">{t('Subtotal')}</span>
                                        <span className="text-sm font-semibold text-gray-900 dark:text-white font-mono">{window.appSettings?.formatCurrency(subtotal)}</span>
                                    </div>
                                    {/* Discount */}
                                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
                                        <span className="text-sm text-gray-500 dark:text-gray-400">{t('Discount')}</span>
                                        <span className="text-sm font-semibold text-red-500 dark:text-red-400 font-mono">
                                            -{window.appSettings?.formatCurrency(discountAmount)}
                                        </span>
                                    </div>
                                    {/* Total Tax */}
                                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
                                        <span className="text-sm text-gray-500 dark:text-gray-400">{t('Total Tax')}</span>
                                        <span className="text-sm font-semibold text-gray-900 dark:text-white font-mono">{window.appSettings?.formatCurrency(taxAmount)}</span>
                                    </div>
                                    {/* Grand Total */}
                                    <div className="flex items-center justify-between px-4 py-3">
                                        <span className="text-sm font-bold text-gray-900 dark:text-white">{t('Grand Total')}</span>
                                        <span className="text-sm font-bold text-green-600 dark:text-green-400 font-mono">{window.appSettings?.formatCurrency(totalAmount)}</span>
                                    </div>
                                </div>
                            </div>
                            </>
                        )}
                    </div>

                    {/* Reason and Notes */}
                    {(saleReturn.reason || saleReturn.notes) && (
                        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                            {saleReturn.reason && (
                                <div className="p-4 sm:p-5">
                                    <div className="flex items-start gap-3 rtl:flex-row-reverse">
                                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                            <AlertCircle className="h-4 w-4 text-primary" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{t('Reason')}</h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed max-h-26 overflow-y-auto">
                                                {saleReturn.reason}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {saleReturn.reason && saleReturn.notes && (
                                <hr className="border-gray-200 dark:border-gray-700" />
                            )}

                            {saleReturn.notes && (
                                <div className="p-4 sm:p-5">
                                    <div className="flex items-start gap-3 rtl:flex-row-reverse">
                                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                            <StickyNote className="h-4 w-4 text-primary" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{t('Notes')}</h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed max-h-26 overflow-y-auto">
                                                {saleReturn.notes}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ── RIGHT: sticky sidebar ── */}
                <div className="w-full lg:w-80 xl:w-96 flex-shrink-0 lg:sticky lg:top-6 space-y-4">

                    {/* Return Info Card */}
                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                        {/* Card header */}
                        <div className="px-5 py-3.5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    <FileText className="h-4 w-4 text-primary" />
                                </div>
                                {t('Return Information')}
                            </h3>
                        </div>

                        {/* Info rows */}
                        <div className="divide-y divide-gray-100 dark:divide-gray-800">

                            {/* Return Number */}
                            <div className="flex items-center gap-2.5 px-4 py-2.5 rtl:flex-row-reverse">
                                <div className="flex-shrink-0 w-7 h-7 rounded-md bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                                    <Hash className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="min-w-0 flex-1 rtl:text-right">
                                    <p className="text-xs text-gray-400 dark:text-gray-500">{t('Return Number')}</p>
                                    <p className="text-xs font-semibold text-gray-900 dark:text-white truncate font-mono">
                                        {saleReturn.return_number || '-'}
                                    </p>
                                </div>
                            </div>

                            {/* Branch */}
                            <div className="flex items-center gap-2.5 px-4 py-2.5 rtl:flex-row-reverse">
                                <div className="flex-shrink-0 w-7 h-7 rounded-md bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center">
                                    <Building2 className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
                                </div>
                                <div className="min-w-0 flex-1 rtl:text-right">
                                    <p className="text-xs text-gray-400 dark:text-gray-500">{t('Branch')}</p>
                                    <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                                        {saleReturn.branch?.name || '-'}
                                    </p>
                                </div>
                            </div>

                            {/* Return Date */}
                            <div className="flex items-center gap-2.5 px-4 py-2.5 rtl:flex-row-reverse">
                                <div className="flex-shrink-0 w-7 h-7 rounded-md bg-cyan-50 dark:bg-cyan-900/30 flex items-center justify-center">
                                    <Calendar className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                                </div>
                                <div className="min-w-0 flex-1 rtl:text-right">
                                    <p className="text-xs text-gray-400 dark:text-gray-500">{t('Return Date')}</p>
                                    <p className="text-xs font-semibold text-gray-900 dark:text-white">
                                        {saleReturn.return_date
                                            ? (window.appSettings?.formatDateTime(saleReturn.return_date, false) || new Date(saleReturn.return_date).toLocaleDateString())
                                            : '-'}
                                    </p>
                                </div>
                            </div>

                            {/* Created By */}
                            <div className="flex items-center gap-2.5 px-4 py-2.5 rtl:flex-row-reverse">
                                <Avatar className="h-7 w-7 flex-shrink-0">
                                    <AvatarImage src={saleReturn.creator?.avatar} />
                                    <AvatarFallback className="text-xs">{getInitials(saleReturn.creator?.name)}</AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex-1 rtl:text-right">
                                    <p className="text-xs text-gray-400 dark:text-gray-500">{t('Created By')}</p>
                                    <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                                        {saleReturn.creator?.name || '-'}
                                    </p>
                                    {saleReturn.creator?.email && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                            {saleReturn.creator.email}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Status */}
                            <div className="flex items-center gap-2.5 px-4 py-2.5 rtl:flex-row-reverse">
                                <div className="flex-shrink-0 w-7 h-7 rounded-md bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center">
                                    <Lock className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div className="min-w-0 flex-1 rtl:text-right">
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">{t('Status')}</p>
                                    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${status.className}`}>
                                        {status.label}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Customer Details Card */}
                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                        <div className="px-5 py-3.5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    <User className="h-4 w-4 text-primary" />
                                </div>
                                {t('Customer Details')}
                            </h3>
                        </div>
                        <div className="p-5 space-y-3.5">
                            {/* Avatar + Name */}
                            <div className="flex items-center gap-3 rtl:flex-row-reverse">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0">
                                    <Avatar className='w-10 h-10'>
                                        <AvatarFallback>
                                            {saleReturn.customer ? getInitials(saleReturn.customer?.name) : 'WC'}
                                        </AvatarFallback>
                                    </Avatar>
                                </div>
                                <div className="min-w-0 rtl:text-right">
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                        {saleReturn.customer?.name || t('Walk-in Customer')}
                                    </p>
                                    {saleReturn.customer?.email && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{saleReturn.customer.email}</p>
                                    )}
                                    {saleReturn.customer?.phone && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{saleReturn.customer.phone}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Branch Details Card */}
                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                        <div className="px-5 py-3.5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    <Building2 className="h-4 w-4 text-primary" />
                                </div>
                                {t('Branch Details')}
                            </h3>
                        </div>
                        <div className="divide-y divide-gray-100 dark:divide-gray-800">
                            <div className="flex items-center gap-2.5 px-4 py-2.5 rtl:flex-row-reverse">
                                <div className="min-w-0 flex-1 rtl:text-right">
                                    <p className="text-xs text-gray-400 dark:text-gray-500">{t('Name')}</p>
                                    <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{saleReturn.branch?.name || '-'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2.5 px-4 py-2.5 rtl:flex-row-reverse">
                                <div className="min-w-0 flex-1 rtl:text-right">
                                    <p className="text-xs text-gray-400 dark:text-gray-500">{t('Address')}</p>
                                    <p className="text-xs font-semibold text-gray-900 dark:text-white">{saleReturn.branch?.address || '-'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2.5 px-4 py-2.5 rtl:flex-row-reverse">
                                <div className="min-w-0 flex-1 rtl:text-right">
                                    <p className="text-xs text-gray-400 dark:text-gray-500">{t('Phone')}</p>
                                    <p className="text-xs font-semibold text-gray-900 dark:text-white">{saleReturn.branch?.phone || '-'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2.5 px-4 py-2.5 rtl:flex-row-reverse">
                                <div className="min-w-0 flex-1 rtl:text-right">
                                    <p className="text-xs text-gray-400 dark:text-gray-500">{t('Email')}</p>
                                    <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{saleReturn.branch?.email || '-'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </PageTemplate>
    );
}
