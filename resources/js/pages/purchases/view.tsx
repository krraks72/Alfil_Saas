import { DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTranslation } from 'react-i18next';
import { ShoppingCart, User, Calendar, DollarSign, FileText, Package, Lock } from 'lucide-react';

interface ViewProps {
    record: any;
}

export default function View({ record }: ViewProps) {
    const { t } = useTranslation();

    return (
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
            <DialogHeader className="px-6 pt-6 pb-4 border-b">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <ShoppingCart className="h-5 w-5 text-primary" />
                    </div>
                    <DialogTitle className="text-xl font-semibold">{t('Purchase Details')}</DialogTitle>
                </div>
            </DialogHeader>

            <div className="px-6 py-4 pb-6 space-y-4">
                {/* Purchase Number & Vendor */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                            <ShoppingCart className="h-4 w-4" />
                            {t('Purchase Number')}
                        </label>
                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{record.purchase_number || '-'}</p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                            <User className="h-4 w-4" />
                            {t('Vendor')}
                        </label>
                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{record.vendor?.name || '-'}</p>
                    </div>
                </div>

                {/* Purchase Date & Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {t('Purchase Date')}
                        </label>
                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                            {record.purchase_date ? (window.appSettings?.formatDateTime(record.purchase_date, false) || record.purchase_date) : '-'}
                        </p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            {t('Total Amount')}
                        </label>
                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                            {window.appSettings?.formatCurrency(record.total_amount || 0)}
                        </p>
                    </div>
                </div>

                {/* Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                            <Lock className="h-4 w-4" />
                            {t('Status')}
                        </label>
                        <div className="mt-1">
                            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                                record.status === 'active'
                                    ? 'bg-green-50 text-green-700 ring-green-600/20'
                                    : 'bg-red-50 text-red-700 ring-red-600/20'
                            }`}>
                                {record.status === 'active' ? t('Active') : t('Inactive')}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Products / Items */}
                {record.items && record.items.length > 0 && (
                    <div>
                        <label className="text-sm font-medium text-gray-500 flex items-center gap-2 mb-2">
                            <Package className="h-4 w-4" />
                            {t('Products')}
                        </label>
                        <div className="border rounded-lg overflow-hidden">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-[#F0F0F1] hover:bg-[#F0F0F1] dark:bg-gray-900 border-b">
                                        <th className="px-4 py-2 text-left font-medium text-gray-500">{t('Product')}</th>
                                        <th className="px-4 py-2 text-center font-medium text-gray-500">{t('Qty')}</th>
                                        <th className="px-4 py-2 text-right font-medium text-gray-500">{t('Unit Price')}</th>
                                        <th className="px-4 py-2 text-right font-medium text-gray-500">{t('Total')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {record.items.map((item: any, index: number) => (
                                        <tr key={index} className="border-b last:border-0">
                                            <td className="px-4 py-2 text-gray-900 dark:text-white">{item.product?.name || '-'}</td>
                                            <td className="px-4 py-2 text-center text-gray-900 dark:text-white">{item.quantity}</td>
                                            <td className="px-4 py-2 text-right text-gray-900 dark:text-white">{window.appSettings?.formatCurrency(item.unit_price || 0)}</td>
                                            <td className="px-4 py-2 text-right text-gray-900 dark:text-white">{window.appSettings?.formatCurrency(item.total_price || 0)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Notes */}
                {record.notes && (
                    <div>
                        <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            {t('Notes')}
                        </label>
                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white whitespace-pre-wrap">{record.notes}</p>
                    </div>
                )}
            </div>
        </DialogContent>
    );
}
