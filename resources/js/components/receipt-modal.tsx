import React, { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, Download, FileText, Receipt, X } from 'lucide-react';
import { ThermalReceipt } from './thermal-receipt';
import { usePrint } from '@/hooks/use-print';
import { generateReceiptPDF, generateReceiptPDFViaPrint } from '@/utils/pdf-generator';
import { toast } from '@/components/custom-toast';
import { useTranslation } from 'react-i18next';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SaleData {
    id: number;
    sale_number: string;
    customer?: {
        id: number;
        name: string;
        email?: string;
        phone?: string;
    } | null;
    items: Array<{
        id: number;
        name: string;
        quantity: number;
        unit_price: number;
        line_total: number;
    }>;
    subtotal: number;
    tax_amount: number;
    discount_amount?: number;
    total_amount: number;
    paid_amount: number;
    payment_method: string;
    notes?: string;
    sale_date: string;
    cash_register?: {
        name: string;
        branch?: {
            name: string;
            address?: string;
            phone?: string;
        };
    };
}

interface CompanyInfo {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
}

interface ReceiptModalProps {
    isOpen: boolean;
    onClose: () => void;
    sale: SaleData;
    companyInfo?: CompanyInfo;
}

export default function ReceiptModal({
    isOpen,
    onClose,
    sale,
    companyInfo = {
        name: 'Your Company',
        address: '',
        phone: '',
        email: ''
    }
}: ReceiptModalProps) {
    const { t } = useTranslation();
    const receiptRef = useRef<HTMLDivElement>(null);
    const { printThermalReceipt, printA4Receipt } = usePrint();
    const [isLoading, setIsLoading] = useState<string | null>(null);

    const handleThermalPrint = async () => {
        if (!receiptRef.current) {
            toast.error(t('Receipt not ready for printing'));
            return;
        }

        setIsLoading('thermal');
        try {
            await printThermalReceipt(receiptRef.current);
            toast.success(t('Thermal receipt sent to printer'));
        } catch (error) {

            toast.error(t('Failed to print thermal receipt'));
        } finally {
            setIsLoading(null);
        }
    };

    const handleA4Print = async () => {
        if (!receiptRef.current) {
            toast.error(t('Receipt not ready for printing'));
            return;
        }

        setIsLoading('a4');
        try {
            await printA4Receipt(receiptRef.current);
            toast.success(t('A4 receipt sent to printer'));
        } catch (error) {

            toast.error(t('Failed to print A4 receipt'));
        } finally {
            setIsLoading(null);
        }
    };

    const handleDownloadHTML = async () => {
        setIsLoading('html');
        try {
            await generateReceiptPDF(sale, companyInfo);
            toast.success(t('Receipt HTML downloaded successfully'));
        } catch (error) {

            toast.error(t('Failed to download receipt'));
        } finally {
            setIsLoading(null);
        }
    };

    const handleGeneratePDF = async () => {
        setIsLoading('pdf');
        try {
            await generateReceiptPDFViaPrint(sale, companyInfo);
            toast.success(t('PDF receipt opened in new window'));
        } catch (error) {

            toast.error(t('Failed to generate PDF receipt'));
        } finally {
            setIsLoading(null);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="w-[calc(100%-2rem)] sm:max-w-4xl lg:max-w-6xl max-h-[90vh] p-0 flex flex-col overflow-hidden gap-0 rounded-lg" onOpenAutoFocus={(e) => e.preventDefault()}>
                <DialogHeader className="px-4 sm:px-6 py-4 border-b shrink-0">
                    <DialogTitle className="flex items-center justify-between text-base sm:text-lg">
                        <div className="flex items-center min-w-0 pr-6">
                            <Receipt className="h-5 w-5 mr-2 text-primary shrink-0" />
                            <span className="truncate">{t('Receipt Preview')} - {sale.sale_number}</span>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                <ScrollArea className="flex-1 overflow-y-auto">
                    <div className="flex flex-col lg:flex-row w-full">
                        {/* Left side - Receipt Preview */}
                        <div className="flex-1 p-0 sm:p-6 lg:border-r border-b lg:border-b-0 flex flex-col min-w-0">
                            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 px-4 pt-4 sm:px-0 sm:pt-0">
                                {t('Receipt Preview')}
                            </div>
                            <div className="bg-[#F0F0F1] dark:bg-gray-800 rounded-lg p-1 sm:p-4 overflow-x-auto overflow-y-auto max-h-[450px] lg:max-h-[550px] flex justify-center items-start">
                                <div className="min-w-fit shrink-0 py-1 sm:py-2 px-0 sm:px-1">
                                    <ThermalReceipt
                                        ref={receiptRef}
                                        sale={sale}
                                        companyInfo={companyInfo}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Right side - Action Buttons */}
                        <div className="w-full lg:w-80 p-4 sm:p-6 flex flex-col shrink-0 min-w-0">
                            <div className="space-y-6">
                                {/* Print Options */}
                                <div>
                                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                        {t('Print Options')}
                                    </div>
                                    <div className="space-y-3">
                                        <Button
                                            onClick={handleThermalPrint}
                                            disabled={isLoading !== null}
                                            className="w-full bg-primary hover:bg-primary/90 text-white"
                                        >
                                            {isLoading === 'thermal' ? (
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            ) : (
                                                <Printer className="h-4 w-4 mr-2" />
                                            )}
                                            {t('Thermal Print')}
                                        </Button>

                                        <Button
                                            onClick={handleA4Print}
                                            disabled={isLoading !== null}
                                            className="w-full bg-primary hover:bg-primary/90 text-white"
                                        >
                                            {isLoading === 'a4' ? (
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            ) : (
                                                <FileText className="h-4 w-4 mr-2" />
                                            )}
                                            {t('A4 Print')}
                                        </Button>
                                    </div>
                                </div>

                                {/* Download Options */}
                                <div>
                                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                        {t('Download Options')}
                                    </div>
                                    <div className="space-y-3">
                                        <Button
                                            onClick={handleDownloadHTML}
                                            disabled={isLoading !== null}
                                            className="w-full bg-primary hover:bg-primary/90 text-white"
                                        >
                                            {isLoading === 'html' ? (
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            ) : (
                                                <Download className="h-4 w-4 mr-2" />
                                            )}
                                            {t('HTML File')}
                                        </Button>

                                        <Button
                                            onClick={handleGeneratePDF}
                                            disabled={isLoading !== null}
                                            className="w-full bg-primary hover:bg-primary/90 text-white"
                                        >
                                            {isLoading === 'pdf' ? (
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            ) : (
                                                <FileText className="h-4 w-4 mr-2" />
                                            )}
                                            {t('Generate PDF')}
                                        </Button>
                                    </div>
                                </div>

                                {/* Options Guide */}
                                <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg">
                                    <div className="flex items-center mb-3">
                                        <div className="flex items-center justify-center w-6 h-6 bg-primary rounded-full mr-2">
                                            <FileText className="h-3 w-3 text-white" />
                                        </div>
                                        <div className="text-sm font-semibold text-primary">
                                            {t('Options Guide')}
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-start space-x-3">
                                            <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-lg mt-0.5">
                                                <Printer className="h-4 w-4 text-primary" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {t('Thermal Print')}
                                                </div>
                                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                                    {t('80mm format for thermal printers')}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-start space-x-3">
                                            <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-lg mt-0.5">
                                                <FileText className="h-4 w-4 text-primary" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {t('A4 Print')}
                                                </div>
                                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                                    {t('Standard paper with detailed layout')}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-start space-x-3">
                                            <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-lg mt-0.5">
                                                <Download className="h-4 w-4 text-primary" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {t('HTML File')}
                                                </div>
                                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                                    {t('Save as HTML for custom formatting')}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-start space-x-3">
                                            <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-lg mt-0.5">
                                                <FileText className="h-4 w-4 text-primary" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {t('Generate PDF')}
                                                </div>
                                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                                    {t('Create PDF using browser\'s print function')}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Close Button - Fixed at bottom */}
                        {/* <div className="pt-4 border-t mt-4">
                            <Button
                                variant="outline"
                                onClick={onClose}
                                className="w-full"
                            >
                                {t('Close')}
                            </Button>
                        </div> */}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}