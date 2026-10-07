import { DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTranslation } from 'react-i18next';
import { User, Mail, MessageSquare, FileText, Calendar } from 'lucide-react';
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
                        <MessageSquare className="h-5 w-5 text-primary" />
                    </div>
                    <DialogTitle className="text-lg font-semibold text-foreground truncate">{t('Contact Details')}</DialogTitle>
                </div>
            </DialogHeader>

            <ScrollArea className="max-h-[75vh]">
                <div className="px-6 py-5 space-y-4">
                    {/* Name & Email */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="min-w-0">
                            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1">
                                <User className="h-3.5 w-3.5 shrink-0" />
                                {t('Name')}
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

                    {/* Subject & Date */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="min-w-0">
                            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1">
                                <FileText className="h-3.5 w-3.5 shrink-0" />
                                {t('Subject')}
                            </label>
                            <p className="text-sm font-medium text-foreground break-words">{record.subject || '-'}</p>
                        </div>
                        <div className="min-w-0">
                            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1">
                                <Calendar className="h-3.5 w-3.5 shrink-0" />
                                {t('Date')}
                            </label>
                            <p className="text-sm font-medium text-foreground">
                                {record.created_at ? (window.appSettings?.formatDateTime(record.created_at, false) || record.created_at) : '-'}
                            </p>
                        </div>
                    </div>

                    {/* Message */}
                    <div className="min-w-0">
                        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1.5">
                            <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                            {t('Message')}
                        </label>
                        <div className="p-3 bg-muted/40 dark:bg-muted/20 border border-border/60 rounded-lg max-h-48 overflow-y-auto">
                            <p className="text-sm font-medium text-foreground break-words whitespace-pre-wrap leading-relaxed">{record.message || '-'}</p>
                        </div>
                    </div>
                </div>
            </ScrollArea>
        </DialogContent>
    );
}

