import { usePage, router } from '@inertiajs/react';
import { PageTemplate } from '@/components/page-template';
import { ArrowLeft, Edit, Printer, Download, Mail, CheckCircle, XCircle, Send, ShoppingCart } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { hasPermission } from '@/utils/authorization';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/custom-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Copy } from 'lucide-react';
import React, { useState } from 'react';
import { NewYork, Toronto, Rio, London, Istanbul, Mumbai, HongKong, Tokyo, Sydney, Paris } from '@/components/quotation-templates';


export default function ViewQuotation() {
    const { t } = useTranslation();
    const { quotation, auth, settings } = usePage().props as any;
    const permissions = auth?.permissions || [];
    const [shareUrl, setShareUrl] = useState('');
    const [showShareDialog, setShowShareDialog] = useState(false);
    const [processing, setProcessing] = useState(false);
    const { globalSettings } = usePage().props as any;

    // Dynamic variable replacement function
    const replaceVariables = (text: string) => {
        if (!text) return '';
        return text
            .replace(/\{quotation_number\}/g, quotation.quotation_number || '')
            .replace(/\{customer_name\}/g, quotation.customer?.name || '')
            .replace(/\{quotation_date\}/g, window.appSettings.formatDateTime(quotation.quotation_date, false) || '')
            .replace(/\{valid_until\}/g, window.appSettings.formatDateTime(quotation.valid_until, false) || '')
            .replace(/\{total_amount\}/g, window.appSettings.formatCurrency(quotation.total_amount || 0))
            .replace(/\{branch_name\}/g, quotation.branch?.name || '')
            .replace(/\{company_name\}/g, auth?.user?.company_name || auth?.user?.name || '');
    };

    // Get quotation template settings with proper null checking
    const safeSettings = settings || {};
    const quotationTemplate = safeSettings.quotation_invoice_template || 'new_york';
    const quotationColor = safeSettings.quotation_invoice_color || '#10b77f';
    const showQr = safeSettings.quotation_invoice_qr_display === 'true' || safeSettings.quotation_invoice_qr_display === true;
    const footerTitle = replaceVariables(safeSettings.quotation_invoice_footer_title || '');
    const footerNotes = replaceVariables(safeSettings.quotation_invoice_footer_notes || '');

    React.useEffect(() => {
        if (showQr && !shareUrl) {
            generateShareUrl().then((url) => {
                if (url) {
                    setShareUrl(url);
                }
            });
        }
    }, [showQr]);

    const breadcrumbs = [
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Quotations'), href: route('quotations.index') },
        { title: t('View Quotation') }
    ];

    const pageActions = [];

    pageActions.push(
        {
            label: t('Print'),
            icon: <Printer className="h-4 w-4" />,
            variant: 'outline',
            onClick: () => window.print()
        },
        {
            label: t('Copy Link'),
            icon: <Copy className="h-4 w-4" />,
            variant: 'outline',
            onClick: (e) => {
                e.preventDefault();
                handleShare();
            }
        }
    );

    if (hasPermission(permissions, 'send-quotations')) {
        if (quotation.status === 'draft') {
            pageActions.push({
                label: t('Send'),
                icon: <Send className="h-4 w-4" />,
                variant: 'default',
                onClick: () => handleSend()
            });
        } else if (['sent', 'approved'].includes(quotation.status)) {
            pageActions.push({
                label: t('Resend'),
                icon: <Send className="h-4 w-4" />,
                variant: 'outline',
                onClick: () => handleSend()
            });
        }
    }

    if (hasPermission(permissions, 'approve-quotations') && quotation.status === 'sent') {
        pageActions.push({
            label: t('Approve'),
            icon: <CheckCircle className="h-4 w-4" />,
            variant: 'default',
            onClick: () => handleApprove()
        });
    }

    if (hasPermission(permissions, 'reject-quotations') && ['sent', 'approved'].includes(quotation.status)) {
        pageActions.push({
            label: t('Reject'),
            icon: <XCircle className="h-4 w-4" />,
            variant: 'destructive',
            onClick: () => handleReject()
        });
    }

    if (hasPermission(permissions, 'convert-quotations') && quotation.status === 'approved') {
        pageActions.push({
            label: t('Convert to Sale'),
            icon: <ShoppingCart className="h-4 w-4" />,
            variant: 'default',
            onClick: () => handleConvertToSale()
        });
    };

    pageActions.push({
        label: t('Back'),
        icon: <ArrowLeft className="h-4 w-4" />,
        variant: 'outline',
        onClick: () => router.visit(route('quotations.index'))
    });

    const calculateItemTotal = (item: any) => {
        const quantity = parseFloat(item.quantity) || 0;
        const unitPrice = parseFloat(item.unit_price) || 0;
        const taxRate = parseFloat(item.tax_rate) || 0;
        const lineSubtotal = quantity * unitPrice;
        const lineTax = (lineSubtotal * taxRate) / 100;
        return lineSubtotal + lineTax;
    };

    const calculateSubtotal = () => {
        return quotation.items?.reduce((sum: number, item: any) => {
            const quantity = parseFloat(item.quantity) || 0;
            const unitPrice = parseFloat(item.unit_price) || 0;
            return sum + (quantity * unitPrice);
        }, 0) || 0;
    };

    const calculateTotalTax = () => {
        return quotation.items?.reduce((sum: number, item: any) => {
            const quantity = parseFloat(item.quantity) || 0;
            const unitPrice = parseFloat(item.unit_price) || 0;
            const taxRate = parseFloat(item.tax_rate) || 0;
            const lineSubtotal = quantity * unitPrice;
            return sum + ((lineSubtotal * taxRate) / 100);
        }, 0) || 0;
    };

    const calculateAfterDiscount = () => {
        return calculateSubtotal() - (parseFloat(quotation.discount_amount) || 0);
    };

    const calculateGrandTotal = () => {
        return calculateAfterDiscount() + calculateTotalTax();
    };

    const generateShareUrl = async () => {
        try {
            const csrfToken = globalSettings?.csrf_token || document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            if (!csrfToken) {
                throw new Error('CSRF token not found');
            }

            const response = await fetch(route('quotations.share', quotation.id), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.share_url) {
                return data.share_url;
            }
            throw new Error('No share URL in response');
        } catch (error) {
            return null;
        }
    };

    const copyToClipboard = (text: string) => {
        if (navigator.clipboard && window.isSecureContext) {
            return navigator.clipboard.writeText(text);
        } else {
            // Fallback for browsers that don't support Clipboard API or non-secure contexts
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            return new Promise<void>((resolve, reject) => {
                if (document.execCommand('copy')) {
                    textArea.remove();
                    resolve();
                } else {
                    textArea.remove();
                    reject(new Error('Copy failed'));
                }
            });
        }
    };

    const handleShare = async () => {
        if (shareUrl) {
            copyToClipboard(shareUrl)
                .then(() => {
                    toast.success(t('Link copied to clipboard'));
                })
                .catch(() => {
                    toast.error(t('Failed to copy link'));
                });
            return;
        }

        try {
            const newShareUrl = await generateShareUrl();
            if (newShareUrl) {
                setShareUrl(newShareUrl);
                copyToClipboard(newShareUrl)
                    .then(() => {
                        toast.success(t('Link copied to clipboard'));
                    })
                    .catch(() => {
                        toast.error(t('Failed to copy link'));
                    });
            } else {
                toast.error(t('Failed to generate share link'));
            }
        } catch (error) {
            toast.error(t('Failed to generate share link'));
        }
    };

    const handleCopyLink = () => {
        copyToClipboard(shareUrl)
            .then(() => {
                toast.success(t('Link copied to clipboard'));
            })
            .catch(() => {
                toast.error(t('Failed to copy link'));
            });
    };

    const handleSendEmail = async () => {
        if (processing) return;
        setProcessing(true);
        try {
            const response = await fetch(route('quotations.send-email', quotation.id), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                }
            });

            const data = await response.json();
            if (response.ok) {
                toast.success(data.message);
                router.reload();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(t('Network error occurred'));
        }
        setProcessing(false);
    };

    const handleSend = async () => {
        if (processing) return;
        setProcessing(true);
        try {
            const response = await fetch(route('quotations.send', quotation.id), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json'
                }
            });

            const data = await response.json();
            if (response.ok) {
                toast.success(data.message);
                router.reload();
            } else {
                if (data.demo_mode && data.error) {
                    toast.error(t(data.error));
                } else {
                    toast.error(data.message || t('An error occurred'));
                }
            }
        } catch (error) {
            toast.error(t('Network error occurred'));
        } finally {
            setProcessing(false);
        }
    };

    const handleApprove = async () => {
        if (processing) return;
        setProcessing(true);
        try {
            const response = await fetch(route('quotations.approve', quotation.id), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json'
                }
            });

            const data = await response.json();
            if (response.ok) {
                toast.success(data.message);
                router.reload();
            } else {
                if (data.demo_mode && data.error) {
                    toast.error(t(data.error));
                } else {
                    toast.error(data.message || t('An error occurred'));
                }
            }
        } catch (error) {
            toast.error(t('Network error occurred'));
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = async () => {
        if (processing) return;
        setProcessing(true);
        try {
            const response = await fetch(route('quotations.reject', quotation.id), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json'
                }
            });

            const data = await response.json();
            if (response.ok) {
                toast.success(data.message);
                router.reload();
            } else {
                if (data.demo_mode && data.error) {
                    toast.error(t(data.error));
                } else {
                    toast.error(data.message || t('An error occurred'));
                }
            }
        } catch (error) {
            toast.error(t('Network error occurred'));
        } finally {
            setProcessing(false);
        }
    };

    const handleConvertToSale = async () => {
        if (processing) return;
        setProcessing(true);
        try {
            const response = await fetch(route('quotations.convert-to-sale', quotation.id), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json'
                }
            });

            const data = await response.json();
            if (response.ok) {
                toast.success(data.message);
                if (data.sale_id) {
                    router.visit(route('sales.show', data.sale_id));
                } else {
                    router.reload();
                }
            } else {
                if (data.demo_mode && data.error) {
                    toast.error(t(data.error));
                } else {
                    toast.error(data.message || t('An error occurred'));
                }
            }
        } catch (error) {
            toast.error(t('Network error occurred'));
        } finally {
            setProcessing(false);
        }
    };

    // Template mapping with multiple format support
    const templateMap: Record<string, React.ComponentType<any>> = {
        new_york: NewYork,
        toronto: Toronto,
        rio: Rio,
        london: London,
        istanbul: Istanbul,
        mumbai: Mumbai,
        hong_kong: HongKong,
        hongkong: HongKong,
        tokyo: Tokyo,
        sydney: Sydney,
        paris: Paris,
    };

    // Normalize template name and find component
    const normalizedTemplate = quotationTemplate?.toLowerCase().replace(/[_\s-]/g, '');
    let TemplateComponent = templateMap[quotationTemplate] || templateMap[normalizedTemplate];

    // Fallback search if exact match not found
    if (!TemplateComponent) {
        const templateKey = Object.keys(templateMap).find(key =>
            key.toLowerCase().replace(/[_\s-]/g, '') === normalizedTemplate
        );
        TemplateComponent = templateKey ? templateMap[templateKey] : NewYork;
    }

    return (
        <PageTemplate title={quotation.quotation_number} actions={pageActions} breadcrumbs={breadcrumbs} description={t('View quotation details.')}>
            <style>{`
                @media print {
                    * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
                    nav, .breadcrumb, .page-actions, button, .no-print { display: none !important; }
                    [data-slot="sidebar"], [data-sidebar="sidebar"], aside, header { display: none !important; }
                    main { margin: 0 !important; }
                    @page { margin: 0.5in; size: A4; }
                    
                    /* Force quotation template responsive grids to keep their layout in print */
                    .max-w-4xl [class*="md:grid-cols-2"] {
                        display: grid;
                        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
                    }
                    .max-w-4xl [class*="lg:grid-cols-2"] {
                        display: grid;
                        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
                    }
                    .max-w-4xl [class*="lg:grid-cols-3"] {
                        display: grid;
                        grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
                    }
                    .max-w-4xl [class*="lg:col-span-1"] {
                        grid-column: span 1 / span 1 !important;
                    }
                    .max-w-4xl [class*="lg:col-span-2"] {
                        grid-column: span 2 / span 2 !important;
                    }
                    .max-w-4xl [class*=" col-span-2"], .max-w-4xl [class^="col-span-2"] {
                        grid-column: span 2 / span 2 !important;
                    }
                    .max-w-4xl [class*="grid-cols-3"]:not([class*="md:grid-cols"]):not([class*="lg:grid-cols"]) {
                        display: grid;
                        grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
                    }
                    /* Force desktop table view during print */
                    .hidden.sm\\:block { display: block !important; }
                    .block.sm\\:hidden { display: none !important; }
                    
                    /* Reset table widths and overflow containers for print */
                    table {
                        width: 100% !important;
                        min-width: 100% !important;
                        max-w-full !important;
                        table-layout: auto !important;
                    }
                    .overflow-x-auto {
                        overflow: visible !important;
                    }
                }
            `}</style>
            <div className="print:max-w-full print:mx-0">
                <div className="print:shadow-none print:border-0 print:m-0">
                    <TemplateComponent
                        quotation={quotation}
                        color={quotationColor}
                        showQr={showQr}
                        quotationUrl={shareUrl}
                        footerTitle={footerTitle}
                        footerNotes={footerNotes}
                        formatAmount={(amount: number) => window.appSettings.formatCurrency(amount || 0)}
                        formatDate={(date: any) => window.appSettings.formatDateTime(date, false)}
                        t={t}
                    />
                </div>
            </div>

            <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('Share Quotation')}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <Input value={shareUrl} readOnly className="flex-1" />
                            <Button onClick={() => handleCopyLink()} size="sm">
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                        <p className="text-sm text-gray-600">{t('Share this link with your customer to view the quotation')}</p>
                        <div className="flex justify-end">
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </PageTemplate>
    );
}
