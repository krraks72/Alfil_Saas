import { DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTranslation } from 'react-i18next';
import { Tag, FileText, Lock, Calendar, LucideImageOff, Eye } from 'lucide-react';

interface ViewProps {
    record: any;
}

export default function View({ record }: ViewProps) {
    const { t } = useTranslation();

    const imageUrl = record.image
        ? (record.image.startsWith('http') ? record.image : `${window.appSettings?.baseUrl || window.location.origin}${record.image}`)
        : null;

    return (
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
            <DialogHeader className="px-6 pt-6 pb-4 border-b">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Tag className="h-5 w-5 text-primary" />
                    </div>
                    <DialogTitle className="text-xl font-semibold">{t('Category Details')}</DialogTitle>
                </div>
            </DialogHeader>

            {/* Image Banner */}
            <div className="w-full bg-gray-50 dark:bg-gray-800 border-b flex items-center justify-center py-6">
                {imageUrl ? (
                    <div className="relative group w-28 h-28 cursor-pointer" onClick={() => window.open(imageUrl, '_blank')}>
                        <img
                            src={imageUrl}
                            alt={record.name}
                            className="w-28 h-28 object-cover rounded-xl border-4 border-white dark:border-gray-700 shadow-md"
                        />
                        <div className="absolute inset-0 bg-black/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                            <Eye className="h-7 w-7 text-white" />
                        </div>
                    </div>
                ) : (
                    <div className="w-28 h-28 bg-gray-200 dark:bg-gray-700 rounded-xl border-4 border-white dark:border-gray-600 shadow-md flex items-center justify-center">
                        <LucideImageOff className="h-10 w-10 text-gray-400" />
                    </div>
                )}
            </div>

            <div className="px-6 py-5 space-y-4">
                {/* Name & Status */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                            <Tag className="h-4 w-4" />
                            {t('Name')}
                        </label>
                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{record.name || '-'}</p>
                    </div>
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

                {/* Created At */}
                <div>
                    <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {t('Created At')}
                    </label>
                    <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                        {record.created_at
                            ? (window.appSettings?.formatDateTime(record.created_at, false) || new Date(record.created_at).toLocaleDateString())
                            : '-'}
                    </p>
                </div>

                {/* Description */}
                {record.description && (
                    <div>
                        <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            {t('Description')}
                        </label>
                        <p className="mt-1 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{record.description}</p>
                    </div>
                )}
            </div>
        </DialogContent>
    );
}
