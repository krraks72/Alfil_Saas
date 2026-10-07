import { DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTranslation } from 'react-i18next';
import { DollarSign, Hash, Type, FileText, Lock } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ViewProps {
    record: any;
}

export default function View({ record }: ViewProps) {
    const { t } = useTranslation();

    if (!record) return null;

    return (
        <DialogContent className="w-[calc(100%-2rem)] sm:max-w-lg md:max-w-xl max-h-[90vh] p-0 rounded-lg overflow-hidden" onOpenAutoFocus={(e) => e.preventDefault()}>
            <DialogHeader className="px-6 py-4 border-b">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 dark:bg-primary/20 rounded-lg shrink-0">
                        <DollarSign className="h-5 w-5 text-primary" />
                    </div>
                    <DialogTitle className="text-lg font-semibold text-foreground truncate">{t('Currency Details')}</DialogTitle>
                </div>
            </DialogHeader>

            <ScrollArea className="max-h-[75vh]">
                <div className="px-6 py-5 space-y-4">
                    {/* Name & Code */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="min-w-0">
                            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1">
                                <Type className="h-3.5 w-3.5 shrink-0" />
                                {t('Currency Name')}
                            </label>
                            <p className="text-sm font-medium text-foreground break-words">{record.name || '-'}</p>
                        </div>
                        <div className="min-w-0">
                            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1">
                                <Hash className="h-3.5 w-3.5 shrink-0" />
                                {t('Currency Code')}
                            </label>
                            <p className="text-sm font-medium text-foreground break-words">{record.code || '-'}</p>
                        </div>
                    </div>

                    {/* Symbol & Default */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="min-w-0">
                            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1">
                                <DollarSign className="h-3.5 w-3.5 shrink-0" />
                                {t('Symbol')}
                            </label>
                            <p className="text-sm font-medium text-foreground font-mono">{record.symbol || '-'}</p>
                        </div>
                        <div className="min-w-0">
                            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1">
                                <Lock className="h-3.5 w-3.5 shrink-0" />
                                {t('Default')}
                            </label>
                            <div>
                                <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                                    record.is_default
                                        ? 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 ring-green-600/20'
                                        : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 ring-gray-600/20'
                                }`}>
                                    {record.is_default ? t('Yes') : t('No')}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    {record.description && (
                        <div className="min-w-0">
                            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1">
                                <FileText className="h-3.5 w-3.5 shrink-0" />
                                {t('Description')}
                            </label>
                            <p className="text-sm font-medium text-foreground break-words whitespace-pre-wrap">{record.description}</p>
                        </div>
                    )}
                </div>
            </ScrollArea>
        </DialogContent>
    );
}

