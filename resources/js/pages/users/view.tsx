import { DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTranslation } from 'react-i18next';
import { User, Mail, Calendar, ShieldCheck, Lock } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ViewProps {
    record: any;
}

export default function View({ record }: ViewProps) {
    const { t } = useTranslation();
    const getInitials = useInitials();

    if (!record) return null;

    return (
        <DialogContent className="w-[calc(100%-2rem)] sm:max-w-lg md:max-w-xl max-h-[90vh] p-0 rounded-lg overflow-hidden" onOpenAutoFocus={(e) => e.preventDefault()}>
            <DialogHeader className="px-6 py-4 border-b">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 dark:bg-primary/20 rounded-lg shrink-0">
                        <User className="h-5 w-5 text-primary" />
                    </div>
                    <DialogTitle className="text-lg font-semibold text-foreground truncate">{t('User Details')}</DialogTitle>
                </div>
            </DialogHeader>

            <ScrollArea className="max-h-[75vh]">
                <div className="px-6 pt-0 pb-5 space-y-4">
                    {/* User Header Profile Card */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                        <div className="flex items-center gap-3 sm:gap-4 min-w-0 w-full sm:w-auto">
                            <Avatar className="h-12 w-12 sm:h-14 sm:w-14 shrink-0 border shadow-sm">
                                <AvatarImage src={record.avatar} className="object-cover" />
                                <AvatarFallback className="text-base font-bold">{getInitials(record.name)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="text-base font-semibold text-foreground truncate">{record.name}</p>
                                <p className="text-xs text-muted-foreground truncate break-all">{record.email}</p>
                            </div>
                        </div>
                        <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset shrink-0 ${
                            record.status === 'active'
                                ? 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 ring-green-600/20'
                                : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 ring-red-600/20'
                        }`}>
                            {record.status === 'active' ? t('Active') : t('Inactive')}
                        </span>
                    </div>

                    {/* Name & Email */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="min-w-0">
                            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1">
                                <User className="h-3.5 w-3.5 shrink-0" />
                                {t('Name')}
                            </label>
                            <p className="text-sm font-medium text-foreground truncate">{record.name || '-'}</p>
                        </div>
                        <div className="min-w-0">
                            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1">
                                <Mail className="h-3.5 w-3.5 shrink-0" />
                                {t('Email')}
                            </label>
                            <p className="text-sm font-medium text-foreground break-all">{record.email || '-'}</p>
                        </div>
                    </div>

                    {/* Joined & Status */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="min-w-0">
                            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1">
                                <Calendar className="h-3.5 w-3.5 shrink-0" />
                                {t('Joined')}
                            </label>
                            <p className="text-sm font-medium text-foreground">
                                {record.created_at ? (window.appSettings?.formatDateTime(record.created_at, false) || record.created_at) : '-'}
                            </p>
                        </div>
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
                    </div>

                    {/* Roles */}
                    {record.roles && record.roles.length > 0 && (
                        <div className="min-w-0">
                            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1.5">
                                <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                                {t('Roles')}
                            </label>
                            <div className="flex flex-wrap gap-1.5">
                                {record.roles.map((role: any) => (
                                    <span key={role.id} className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 ring-blue-600/20">
                                        {role.label || role.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>
        </DialogContent>
    );
}
