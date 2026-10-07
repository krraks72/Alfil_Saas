import { DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTranslation } from 'react-i18next';
import { Receipt, FileText, Calendar, FolderOpen, Building2, DollarSign, Eye } from 'lucide-react';

interface ViewProps {
    record: any;
}

export default function View({ record }: ViewProps) {
    const { t } = useTranslation();

    const receiptUrl = record.receipt
        ? (record.receipt.startsWith('http') ? record.receipt : `${window.appSettings?.baseUrl || window.location.origin}${record.receipt}`)
        : null;

    const statusColors: Record<string, string> = {
        pending: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20',
        approved: 'bg-green-50 text-green-700 ring-green-600/20',
        rejected: 'bg-red-50 text-red-700 ring-red-600/20',
    };

    return (
        <DialogContent className="w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto p-0 rounded-xl" onOpenAutoFocus={(e) => e.preventDefault()}>
            <DialogHeader className="px-4 sm:px-6 pt-5 sm:pt-6 pb-4 border-b">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                        <Receipt className="h-5 w-5 text-primary" />
                    </div>
                    <DialogTitle className="text-lg sm:text-xl font-semibold truncate">{t('Expense Details')}</DialogTitle>
                </div>
            </DialogHeader>

            {/* Receipt Banner */}
            {receiptUrl && (
                <div className="w-full bg-gray-50 dark:bg-gray-800 border-b flex items-center justify-center py-4 sm:py-6 px-4">
                    <div className="relative group w-24 h-24 sm:w-28 sm:h-28 cursor-pointer shrink-0" onClick={() => window.open(receiptUrl, '_blank')}>
                        <img
                            src={receiptUrl}
                            alt={record.title}
                            className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-xl border-4 border-white dark:border-gray-700 shadow-md"
                        />
                        <div className="absolute inset-0 bg-black/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                            <Eye className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                        </div>
                    </div>
                </div>
            )}

            <div className="px-4 sm:px-6 py-4 sm:py-5 space-y-4 min-w-0">
                {/* Title & Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="min-w-0">
                        <label className="text-xs sm:text-sm font-medium text-gray-500 flex items-center gap-1.5">
                            <Receipt className="h-4 w-4 shrink-0 text-gray-400" />
                            <span>{t('Title')}</span>
                        </label>
                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white break-words">{record.title || '-'}</p>
                    </div>
                    <div className="min-w-0">
                        <label className="text-xs sm:text-sm font-medium text-gray-500 flex items-center gap-1.5">
                            <Receipt className="h-4 w-4 shrink-0 text-gray-400" />
                            <span>{t('Status')}</span>
                        </label>
                        <div className="mt-1">
                            <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${statusColors[record.status] || ''}`}>
                                {record.status ? record.status.charAt(0).toUpperCase() + record.status.slice(1) : '-'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Branch & Category */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="min-w-0">
                        <label className="text-xs sm:text-sm font-medium text-gray-500 flex items-center gap-1.5">
                            <Building2 className="h-4 w-4 shrink-0 text-gray-400" />
                            <span>{t('Branch')}</span>
                        </label>
                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white break-words">{record.branch?.name || '-'}</p>
                    </div>
                    <div className="min-w-0">
                        <label className="text-xs sm:text-sm font-medium text-gray-500 flex items-center gap-1.5">
                            <FolderOpen className="h-4 w-4 shrink-0 text-gray-400" />
                            <span>{t('Category')}</span>
                        </label>
                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white break-words">{record.expense_category?.name || '-'}</p>
                    </div>
                </div>

                {/* Amount & Expense Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="min-w-0">
                        <label className="text-xs sm:text-sm font-medium text-gray-500 flex items-center gap-1.5">
                            <DollarSign className="h-4 w-4 shrink-0 text-gray-400" />
                            <span>{t('Amount')}</span>
                        </label>
                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white font-mono whitespace-nowrap">
                            {record.amount != null ? window.appSettings?.formatCurrency(record.amount) : '-'}
                        </p>
                    </div>
                    <div className="min-w-0">
                        <label className="text-xs sm:text-sm font-medium text-gray-500 flex items-center gap-1.5">
                            <Calendar className="h-4 w-4 shrink-0 text-gray-400" />
                            <span>{t('Expense Date')}</span>
                        </label>
                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                            {record.expense_date
                                ? (window.appSettings?.formatDateTime(record.expense_date, false) || new Date(record.expense_date).toLocaleDateString())
                                : '-'}
                        </p>
                    </div>
                </div>

                {/* Description */}
                {record.description && (
                    <div className="min-w-0 pt-1">
                        <label className="text-xs sm:text-sm font-medium text-gray-500 flex items-center gap-1.5">
                            <FileText className="h-4 w-4 shrink-0 text-gray-400" />
                            <span>{t('Description')}</span>
                        </label>
                        <div className="mt-1.5 max-h-40 overflow-y-auto rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/50 p-3 shadow-inner">
                            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words leading-relaxed">{record.description}</p>
                        </div>
                    </div>
                )}
            </div>
        </DialogContent>
    );
}
