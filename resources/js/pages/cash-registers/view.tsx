import { DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTranslation } from 'react-i18next';
import { Monitor, Hash, GitBranch, DollarSign, Lock, Calendar, FileText } from 'lucide-react';

interface ViewProps {
    record: any;
}

export default function View({ record }: ViewProps) {
    const { t } = useTranslation();

    const statusConfig: Record<string, string> = {
        active: 'bg-green-50 text-green-700 ring-green-600/20',
        inactive: 'bg-red-50 text-red-700 ring-red-600/20',
        maintenance: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20',
    };

    const statusLabel: Record<string, string> = {
        active: t('Active'),
        inactive: t('Inactive'),
        maintenance: t('Maintenance'),
    };

    return (
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
            <DialogHeader className="px-6 pt-6 pb-4 border-b">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Monitor className="h-5 w-5 text-primary" />
                    </div>
                    <DialogTitle className="text-xl font-semibold">{t('Cash Register Details')}</DialogTitle>
                </div>
            </DialogHeader>

            <div className="px-6 py-4 pb-6 space-y-4">
                {/* Name & Register Code */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                            <Monitor className="h-4 w-4" />
                            {t('Name')}
                        </label>
                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{record.name || '-'}</p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                            <Hash className="h-4 w-4" />
                            {t('Register Code')}
                        </label>
                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{record.register_code || '-'}</p>
                    </div>
                </div>

                {/* Branch & Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                            <GitBranch className="h-4 w-4" />
                            {t('Branch')}
                        </label>
                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{record.branch?.name || '-'}</p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                            <Lock className="h-4 w-4" />
                            {t('Status')}
                        </label>
                        <div className="mt-1">
                            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${statusConfig[record.status] || statusConfig.inactive}`}>
                                {statusLabel[record.status] || t('Inactive')}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Opening Balance & Current Balance */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            {t('Opening Balance')}
                        </label>
                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white font-mono">
                            {window.appSettings?.formatCurrency(parseFloat(record.opening_balance || 0))}
                        </p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            {t('Current Balance')}
                        </label>
                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white font-mono">
                            {window.appSettings?.formatCurrency(parseFloat(record.current_balance || 0))}
                        </p>
                    </div>
                </div>

                {/* Created At */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {t('Created At')}
                        </label>
                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                            {record.created_at ? (window.appSettings?.formatDateTime(record.created_at, false) || record.created_at) : '-'}
                        </p>
                    </div>
                </div>

                {/* Description */}
                {record.description && (
                    <div>
                        <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            {t('Description')}
                        </label>
                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white whitespace-pre-wrap">{record.description}</p>
                    </div>
                )}
            </div>
        </DialogContent>
    );
}
