import React, { useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { CreditCard, DollarSign, Smartphone, Building, Shuffle, Printer } from 'lucide-react';
import { router, usePage } from '@inertiajs/react';
import { toast } from '@/components/custom-toast';
import { useTranslation } from 'react-i18next';
import ReceiptModal from '@/components/receipt-modal';

interface CartItem {
    id: number;
    name: string;
    quantity: number;
    selling_price: number;
    line_total: number;
}

interface Customer {
    id: number;
    name: string;
    email: string;
    phone: string;
}

interface CashRegister {
    id: number;
    name: string;
    current_balance: number;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    cart: CartItem[];
    customer: Customer | null;
    cashRegister: CashRegister;
    subtotal: number;
    tax: number;
    total: number;
    onPaymentComplete: () => void;
}

export default function PaymentModal({
    isOpen,
    onClose,
    cart,
    customer,
    cashRegister,
    subtotal,
    tax,
    total,
    onPaymentComplete
}: Props) {
    const { t } = useTranslation();
    const { auth } = usePage().props as any;
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [paidAmount, setPaidAmount] = useState(total.toString());
    const [discountAmount, setDiscountAmount] = useState('0');
    const [notes, setNotes] = useState('');
    const [processing, setProcessing] = useState(false);
    const [showPrintOptions, setShowPrintOptions] = useState(false);
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [completedSale, setCompletedSale] = useState<any>(null);

    const safeTotal = Number(total) || 0;

    // Reset form when modal opens
    React.useEffect(() => {
        if (isOpen) {
            setPaymentMethod('cash');
            setPaidAmount(safeTotal.toFixed(2));
            setDiscountAmount('0');
            setNotes('');
            setProcessing(false);
        }
    }, [isOpen, safeTotal]);

    // Update paid amount when discount changes
    React.useEffect(() => {
        const discount = parseFloat(discountAmount || '0');
        if (discount > 0) {
            setPaidAmount((safeTotal - discount).toFixed(2));
        } else {
            setPaidAmount(safeTotal.toFixed(2));
        }
    }, [discountAmount, safeTotal]);

    const finalTotal = safeTotal - parseFloat(discountAmount || '0');
    const changeAmount = Math.max(0, parseFloat(paidAmount || '0') - finalTotal);

    const handlePayment = () => {
        setProcessing(true);

        if (!customer) return;
        const saleData = {
            customer_id: customer.id,
            cash_register_id: cashRegister.id,
            items: cart.map(item => ({
                product_id: item.id,
                quantity: item.quantity,
                unit_price: item.selling_price
            })),
            payment_method: paymentMethod,
            paid_amount: parseFloat(paidAmount || '0'),
            discount_amount: parseFloat(discountAmount || '0'),
            notes: notes || null
        };

        router.post(route('pos.sales.store'), saleData, {
            onSuccess: async (response) => {
                setProcessing(false);
                toast.success(t('Sale completed successfully!'));
                const flash = (response.props as any).flash;
                if (flash?.warning) toast.error(flash.warning);

                // Fetch the latest sale for this cash register to get actual data
                try {
                    const salesResponse = await fetch(route('sales.index') + `?cash_register_id=${cashRegister.id}&per_page=1`, {
                        headers: {
                            'Accept': 'application/json',
                            'X-Requested-With': 'XMLHttpRequest'
                        }
                    });
                    const salesData = await salesResponse.json();

                    if (salesData.data && salesData.data.length > 0) {
                        const latestSale = salesData.data[0];
                        setCompletedSale(latestSale);
                        // Close payment modal first, then show receipt directly
                        onClose();
                        setTimeout(() => {
                            setShowReceiptModal(true);
                        }, 100);
                    } else {
                        onPaymentComplete();
                    }
                } catch (error) {
                    onPaymentComplete();
                }
            },
            onError: (errors) => {
                setProcessing(false);
                toast.error(`${t('Payment failed')}: ${Object.values(errors).join(', ')}`);
            }
        });
    };

    const handlePrintReceipt = () => {
        setShowPrintOptions(false);
        setShowReceiptModal(true);
    };

    const handleSkipPrint = () => {
        setShowPrintOptions(false);
        onPaymentComplete();
    };

    const handleReceiptClose = () => {
        setShowReceiptModal(false);
        onPaymentComplete();
    };

    const paymentMethods = [
        { value: 'cash', label: t('Cash'), icon: DollarSign },
        { value: 'card', label: t('Card'), icon: CreditCard },
        { value: 'digital_wallet', label: t('Digital Wallet'), icon: Smartphone },
        { value: 'bank_transfer', label: t('Bank Transfer'), icon: Building },
        { value: 'mixed', label: t('Mixed Payment'), icon: Shuffle },
    ];

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{t('Process Payment')}</DialogTitle>
                </DialogHeader>

                <form onSubmit={(e) => { e.preventDefault(); handlePayment(); }} className="space-y-6 pb-2">
                    {/* Order Summary */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-medium mb-3">{t('Order Summary')}</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span>{t('Items')} ({cart.length}):</span>
                                <span>{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>{t('Subtotal')}:</span>
                                <span>{window.appSettings.formatCurrency(subtotal)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>{t('Tax')}:</span>
                                <span>{window.appSettings.formatCurrency(tax)}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between font-medium">
                                <span>{t('Total')}:</span>
                                <span>{window.appSettings.formatCurrency(total)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Discount */}
                    <div>
                        <Label htmlFor="discount">{t('Discount Amount')}</Label>
                        <Input
                            id="discount"
                            type="number"
                            value={discountAmount}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (val === '' || (parseFloat(val) >= 0 && parseFloat(val) <= total)) {
                                    setDiscountAmount(val);
                                }
                            }}
                            min="0"
                            max={safeTotal.toString()}
                            placeholder='0.00'
                            step="0.01"
                        />
                    </div>

                    {/* Final Total */}
                    {parseFloat(discountAmount || '0') > 0 && (
                        <div className="bg-green-50 p-3 rounded-lg">
                            <div className="flex justify-between font-medium text-green-800">
                                <span>{t('Final Total')}:</span>
                                <span>{window.appSettings.formatCurrency(finalTotal)}</span>
                            </div>
                        </div>
                    )}

                    {/* Payment Method */}
                    <div>
                        <Label>{t('Payment Method')}</Label>
                        <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="mt-2">
                            {paymentMethods.map((method) => {
                                const Icon = method.icon;
                                return (
                                    <div key={method.value} className="flex items-center space-x-2">
                                        <RadioGroupItem value={method.value} id={method.value} />
                                        <Label
                                            htmlFor={method.value}
                                            className="flex items-center cursor-pointer"
                                        >
                                            <Icon className="h-4 w-4 mr-2" />
                                            {method.label}
                                        </Label>
                                    </div>
                                );
                            })}
                        </RadioGroup>
                    </div>

                    {/* Amount Paid */}
                    <div>
                        <Label required htmlFor="paid">{t('Amount Paid')}</Label>
                        <Input
                            required
                            id="paid"
                            type="number"
                            value={paidAmount}
                            onChange={(e) => setPaidAmount(e.target.value)}
                            placeholder='0.00'
                            min={finalTotal.toString()}
                            step="0.01"
                        />
                        {changeAmount > 0 && (
                            <p className="text-sm text-green-600 mt-1">
                                {t('Change')}: {window.appSettings.formatCurrency(changeAmount)}
                            </p>
                        )}
                    </div>

                    {/* Notes */}
                    <div>
                        <Label htmlFor="notes">{t('Notes (Optional)')}</Label>
                        <Textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder={t('Add any notes for this sale...')}
                            rows={3}
                        />
                    </div>

                    <DialogFooter>
                    {/* Action Buttons */}
                    <div className="flex space-x-3">
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                            {t('Cancel')}
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing}
                            // disabled={processing || parseFloat(paidAmount || '0') < parseFloat(finalTotal.toFixed(2))}
                            className="flex-1"
                        >
                            {processing ? t('Processing...') : t('Complete Sale')}
                        </Button>
                    </div>
                    </DialogFooter>
                </form>
            </DialogContent>

            {/* Print Options Dialog */}
            <Dialog open={showPrintOptions} onOpenChange={() => {}}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>{t('Sale Completed Successfully!')}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600">
                            {t('Would you like to print the receipt?')}
                        </p>
                        <div className="flex space-x-3">
                            <Button
                                variant="outline"
                                onClick={handleSkipPrint}
                                className="flex-1"
                            >
                                {t('Skip')}
                            </Button>
                            <Button
                                onClick={handlePrintReceipt}
                                className="flex-1"
                            >
                                <Printer className="h-4 w-4 mr-2" />
                                {t('Print Receipt')}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Receipt Modal */}
            {completedSale && (
                <ReceiptModal
                    isOpen={showReceiptModal}
                    onClose={handleReceiptClose}
                    sale={completedSale}
                    companyInfo={{
                        name: (() => {
                            // If creator is company type, use their name
                            if (completedSale?.creator?.type === 'company') {
                                return completedSale.creator.name;
                            }
                            // If creator has a creator who is company type, use that name
                            if (completedSale?.creator?.creator?.type === 'company') {
                                return completedSale.creator.creator.name;
                            }
                            // Fallback
                            return auth?.user?.name || 'Company Name';
                        })(),
                        address: window.appSettings?.get('companyAddress') || '',
                        phone: window.appSettings?.get('companyPhone') || '',
                        email: completedSale?.creator?.email || auth?.user?.email || ''
                    }}
                />
            )}
        </Dialog>
    );
}
