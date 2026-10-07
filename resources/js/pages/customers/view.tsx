import { DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTranslation } from 'react-i18next';
import { User, Mail, Phone, Lock, Calendar, MapPin, FileText } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ViewProps {
    record: any;
}

export default function View({ record }: ViewProps) {
    const { t } = useTranslation();

    if (!record) return null;

    return (
        <DialogContent className="w-[calc(100%-2rem)] sm:max-w-lg md:max-w-xl max-h-[90vh] pl-0 pr-0 rounded-lg" onOpenAutoFocus={(e) => e.preventDefault()}>
            <DialogHeader className="px-6 pb-4 border-b">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 dark:bg-primary/20 rounded-lg">
                        <User className="h-5 w-5 text-primary" />
                    </div>
                    <DialogTitle className="text-lg font-semibold text-foreground">{t('Customer Details')}</DialogTitle>
                </div>
            </DialogHeader>

            <ScrollArea className="max-h-[60vh]">
                <div className="px-6 py-5 space-y-4">
                    {/* Name & Email */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1">
                                <User className="h-3.5 w-3.5" />
                                {t('Name')}
                            </label>
                            <p className="text-sm font-semibold text-foreground break-words">{record.name || '-'}</p>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1">
                                <Mail className="h-3.5 w-3.5" />
                                {t('Email')}
                            </label>
                            <p className="text-sm font-semibold text-foreground break-words">{record.email || '-'}</p>
                        </div>
                    </div>

                    {/* Phone & Date of Birth */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1">
                                <Phone className="h-3.5 w-3.5" />
                                {t('Phone')}
                            </label>
                            <p className="text-sm font-semibold text-foreground break-words">{record.phone || '-'}</p>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1">
                                <Calendar className="h-3.5 w-3.5" />
                                {t('Date of Birth')}
                            </label>
                            <p className="text-sm font-semibold text-foreground break-words">
                                {record.date_of_birth
                                    ? (window.appSettings?.formatDateTime(record.date_of_birth, false) || record.date_of_birth)
                                    : '-'}
                            </p>
                        </div>
                    </div>

                    {/* Status & Gender */}
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
                                <User className="h-3.5 w-3.5" />
                                {t('Gender')}
                            </label>
                            <p className="text-sm font-semibold text-foreground capitalize break-words">{record.gender || '-'}</p>
                        </div>
                    </div>

                    {/* Billing Address */}
                    <div>
                        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1.5">
                            <MapPin className="h-3.5 w-3.5" />
                            {t('Billing Address')}
                        </label>
                        <div className="bg-muted/40 p-3 rounded-lg space-y-0.5">
                            <p className="text-sm text-foreground/90 break-words">{record.billing_address || '-'}</p>
                            {(record.billing_city || record.billing_state || record.billing_postal_code) && (
                                <p className="text-sm text-foreground/90 break-words">{[record.billing_city, record.billing_state, record.billing_postal_code].filter(Boolean).join(', ')}</p>
                            )}
                            {record.billing_country && <p className="text-sm text-foreground/90 break-words">{record.billing_country}</p>}
                        </div>
                    </div>

                    {/* Shipping Address */}
                    {(record.shipping_address || record.shipping_city) && (
                        <div>
                            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1.5">
                                <MapPin className="h-3.5 w-3.5" />
                                {t('Shipping Address')}
                            </label>
                            <div className="bg-muted/40 p-3 rounded-lg space-y-0.5">
                                <p className="text-sm text-foreground/90 break-words">{record.shipping_address || '-'}</p>
                                {(record.shipping_city || record.shipping_state || record.shipping_postal_code) && (
                                    <p className="text-sm text-foreground/90 break-words">{[record.shipping_city, record.shipping_state, record.shipping_postal_code].filter(Boolean).join(', ')}</p>
                                )}
                                {record.shipping_country && <p className="text-sm text-foreground/90 break-words">{record.shipping_country}</p>}
                            </div>
                        </div>
                    )}

                    {/* Notes */}
                    {record.notes && (
                        <div>
                            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1.5">
                                <FileText className="h-3.5 w-3.5" />
                                {t('Notes')}
                            </label>
                            <div className="bg-muted/40 p-3 rounded-lg max-h-40 overflow-y-auto">
                                <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed break-words">{record.notes}</p>
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>
        </DialogContent>
    );
}
