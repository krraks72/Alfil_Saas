import { DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTranslation } from 'react-i18next';
import { Bell, Calendar, User, Clock, Palette, FileText, Lock } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ViewProps {
    record: any;
}

export default function ViewNotification({ record }: ViewProps) {
    const { t } = useTranslation();
    const getInitials = useInitials();

    if (!record) return null;

    const creatorName = record.creator?.name || '-';
    const creatorEmail = record.creator?.email || '';
    const creatorAvatar = record.creator?.avatar
        ? window.appSettings?.getImageUrl?.(record.creator.avatar)
        : null;

    return (
        <DialogContent className="w-[calc(100%-2rem)] sm:max-w-lg md:max-w-xl max-h-[90vh] pl-0 pr-0 rounded-lg" onOpenAutoFocus={(e) => e.preventDefault()}>
            <DialogHeader className="px-6 pb-4 border-b">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 dark:bg-primary/20 rounded-lg">
                        <Bell className="h-5 w-5 text-primary" />
                    </div>
                    <DialogTitle className="text-lg font-semibold text-foreground">{t('Notification Details')}</DialogTitle>
                </div>
            </DialogHeader>

            <ScrollArea className="max-h-[60vh]">
                <div className="px-6 py-5 space-y-4">
                    {/* Title */}
                    <div>
                        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1">
                            <Bell className="h-3.5 w-3.5" />
                            {t('Title')}
                        </label>
                        <p className="text-sm font-semibold text-foreground break-words">{record.title || '-'}</p>
                    </div>

                    {/* From Date & To Date */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1">
                                <Calendar className="h-3.5 w-3.5" />
                                {t('From Date')}
                            </label>
                            <p className="text-sm font-medium text-foreground">
                                {record.from_date
                                    ? (window.appSettings?.formatDateTime(record.from_date, false) || record.from_date)
                                    : '-'}
                            </p>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1">
                                <Calendar className="h-3.5 w-3.5" />
                                {t('To Date')}
                            </label>
                            <p className="text-sm font-medium text-foreground">
                                {record.to_date
                                    ? (window.appSettings?.formatDateTime(record.to_date, false) || record.to_date)
                                    : '-'}
                            </p>
                        </div>
                    </div>

                    {/* Status & Color */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1">
                                <Lock className="h-3.5 w-3.5" />
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
                        <div>
                            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1">
                                <Palette className="h-3.5 w-3.5" />
                                {t('Color')}
                            </label>
                            <div className="mt-1 flex items-center gap-2">
                                <div 
                                    className="w-4 h-4 rounded-full border shadow-sm shrink-0" 
                                    style={{ backgroundColor: record.color }}
                                />
                                <span className="text-sm font-medium text-foreground font-mono">
                                    {record.color || '-'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Created By */}
                    <div>
                        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1.5">
                            <User className="h-3.5 w-3.5" />
                            {t('Created By')}
                        </label>
                        <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                                {creatorAvatar && <AvatarImage src={creatorAvatar} alt={creatorName} />}
                                <AvatarFallback>{getInitials(creatorName)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-foreground truncate">{creatorName}</p>
                                {creatorEmail && (
                                    <p className="text-xs text-muted-foreground truncate">{creatorEmail}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    {record.description && (
                        <div>
                            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1.5">
                                <FileText className="h-3.5 w-3.5" />
                                {t('Description')}
                            </label>
                            <div className="bg-muted/40 p-3 rounded-lg max-h-40 overflow-y-auto">
                                <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed break-words">{record.description}</p>
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>
        </DialogContent>
    );
}