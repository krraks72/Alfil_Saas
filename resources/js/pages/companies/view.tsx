import { DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTranslation } from 'react-i18next';
import { Building2, Mail, Lock, Calendar, CreditCard } from 'lucide-react';
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
                        <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <DialogTitle className="text-lg font-semibold text-foreground truncate">{t('Company Details')}</DialogTitle>
                </div>
            </DialogHeader>

            <ScrollArea className="max-h-[75vh]">
                <div className="px-6 py-5 space-y-4">
                    {/* Name & Email */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="min-w-0">
                            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1">
                                <Building2 className="h-3.5 w-3.5 shrink-0" />
                                {t('Company Name')}
                            </label>
                            <p className="text-sm font-medium text-foreground break-words">{record.name || '-'}</p>
                        </div>
                        <div className="min-w-0">
                            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1">
                                <Mail className="h-3.5 w-3.5 shrink-0" />
                                {t('Email')}
                            </label>
                            <p className="text-sm font-medium text-foreground break-all">{record.email || '-'}</p>
                        </div>
                    </div>

                    {/* Status & Created At */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="min-w-0">
                            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1">
                                <Lock className="h-3.5 w-3.5 shrink-0" />
                                {t('Status')}
                            </label>
                            <div>
                                <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                                    record.status === 'active'
                                        ? 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 ring-green-600/20'
                                        : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 ring-red-600/20'
                                }`}>
                                    {record.status === 'active' ? t('Active') : t('Inactive')}
                                </span>
                            </div>
                        </div>
                        <div className="min-w-0">
                            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1">
                                <Calendar className="h-3.5 w-3.5 shrink-0" />
                                {t('Created At')}
                            </label>
                            <p className="text-sm font-medium text-foreground">
                                {record.created_at ? (window.appSettings?.formatDateTime(record.created_at, false) || record.created_at) : '-'}
                            </p>
                        </div>
                    </div>

                    {/* Plan Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="min-w-0">
                            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1">
                                <CreditCard className="h-3.5 w-3.5 shrink-0" />
                                {t('Plan')}
                            </label>
                            <div>
                                <span className="inline-flex items-center rounded-md bg-blue-50 dark:bg-blue-950/40 px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-400 ring-1 ring-inset ring-blue-600/20">
                                    {record.plan_name || t('No Plan')}
                                </span>
                            </div>
                        </div>
                        {record.plan_expiry_date && (
                            <div className="min-w-0">
                                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1">
                                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                                    {t('Plan Expires')}
                                </label>
                                <p className="text-sm font-medium text-foreground">
                                    {window.appSettings?.formatDateTime(record.plan_expiry_date, false) || record.plan_expiry_date}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </ScrollArea>
        </DialogContent>
    );
}

