import { DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTranslation } from 'react-i18next';
import { RotateCcw, User, Calendar, DollarSign, FileText, Package, GitBranch, Lock } from 'lucide-react';

interface ViewProps {
    record: any;
}

export default function View({ record }: ViewProps) {
    const { t } = useTranslation();

    const statusConfig: Record<string, { className: string; label: string }> = {
        approved: { className: 'bg-green-50 text-green-700 ring-green-600/20', label: t('Approved') },
        rejected: { className: 'bg-red-50 text-red-700 ring-red-600/20', label: t('Rejected') },
        pending: { className: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20', label: t('Pending') },
    };

    const status = statusConfig[record.status] || statusConfig.pending;

    return (
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
            <DialogHeader className="px-6 pt-6 pb-4 border-b">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <RotateCcw className="h-5 w-5 text-primary" />
                    </div>
                    <DialogTitle className="text-xl font-semibold">{t('Purchase Return Details')}</DialogTitle>
                </div>
            </DialogHeader>

            <div className="px-6 py-4 pb-6 space-y-4">
                {/* Return Number & Purchase Number */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                            <RotateCcw className="h-4 w-4" />
                            {t('Return Number')}
                        </label>
                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{record.return_number || '-'}</p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            {t('Purchase Number')}
                        </label>
                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{record.purchase?.purchase_number || '-'}</p>
                    </div>
                </div>

                {/* Vendor & Branch */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                            <User className="h-4 w-4" />
                            {t('Vendor')}
                        </label>
                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{record.vendor?.name || '-'}</p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                            <GitBranch className="h-4 w-4" />
                            {t('Branch')}
                        </label>
                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{record.branch?.name || '-'}</p>
                    </div>
                </div>

                {/* Return Date & Total Amount */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {t('Return Date')}
                        </label>
                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                            {record.return_date ? (window.appSettings?.formatDateTime(record.return_date, false) || record.return_date) : '-'}
                        </p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            {t('Total Amount')}
                        </label>
                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                            {window.appSettings?.formatCurrency(record.grand_total || 0)}
                        </p>
                    </div>
                </div>

                {/* Status & Created By */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                            <Lock className="h-4 w-4" />
                            {t('Status')}
                        </label>
                        <div className="mt-1">
                            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${status.className}`}>
                                {status.label}
                            </span>
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                            <User className="h-4 w-4" />
                            {t('Created By')}
                        </label>
                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{record.creator?.name || '-'}</p>
                    </div>
                </div>

                {/* Return Items */}
                {record.items && record.items.length > 0 && (
                    <div>
                        <label className="text-sm font-medium text-gray-500 flex items-center gap-2 mb-2">
                            <Package className="h-4 w-4" />
                            {t('Return Items')}
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
                                            <td className="px-4 py-2 text-right text-gray-900 dark:text-white">{window.appSettings?.formatCurrency((item.quantity * item.unit_price) || 0)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Reason */}
                {record.reason && (
                    <div>
                        <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            {t('Reason')}
                        </label>
                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white whitespace-pre-wrap">{record.reason}</p>
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
