import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Calculator } from 'lucide-react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

interface Branch {
    id: number;
    name: string;
}

interface CashRegister {
    id: number;
    name: string;
    current_balance: number;
    branch: Branch;
}

interface PosSession {
    id: number;
    session_number: string;
    opening_balance: number;
    total_sales: number;
    total_sales_amount: number;
    cash_register: CashRegister;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    cashRegisters: CashRegister[];
    onSessionStart: (session: PosSession) => void;
}

export default function SessionModal({ isOpen, onClose, cashRegisters, onSessionStart }: Props) {
    const { t } = useTranslation();
    const [selectedCashRegister, setSelectedCashRegister] = useState<string>('');
    const [openingBalance, setOpeningBalance] = useState('');
    const [loading, setLoading] = useState(false);


    const selectedRegister = cashRegisters.find(cr => cr.id.toString() === selectedCashRegister);

    const handleStartSession = async () => {
        if (!selectedCashRegister || !openingBalance) return;

        setLoading(true);
        try {
            const response = await axios.post(route('pos.sessions.store'), {
                cash_register_id: parseInt(selectedCashRegister),
                opening_balance: parseFloat(openingBalance)
            });

            if (response.data.success) {
                onSessionStart(response.data.session);
            }
        } catch (error) {

            // TODO: Show error message
        } finally {
            setLoading(false);
        }
    };

    const useCurrentBalance = () => {
        if (selectedRegister) {
            setOpeningBalance(parseFloat(selectedRegister.current_balance || 0).toString());
        }
    };

    // Check if ChatGPT modal is open
    const [isChatGptOpen, setIsChatGptOpen] = useState(false);
    
    useEffect(() => {
    const checkChatGpt = () => {
        const chatGptModal = document.querySelector('[data-chatgpt-modal]');
        setIsChatGptOpen(!!chatGptModal);
    };
    
    const observer = new MutationObserver(checkChatGpt);
    observer.observe(document.body, { childList: true, subtree: true });
    
    return () => observer.disconnect();
    }, []);

    return (
        <Dialog open={isOpen} onOpenChange={onClose} modal={!isChatGptOpen}>
            <DialogContent className="max-w-md pr-0 pl-0">
                <DialogHeader className='px-6'>
                    <DialogTitle>{t('Start POS Session')}</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 px-6">
                    <div className="text-sm text-gray-600">
                        {t('You need to start a POS session before you can begin making sales.')}
                    </div>

                    {/* Cash Register Selection */}
                    <div>
                        <Label required htmlFor="cashRegister">{t('Select Cash Register')}</Label>
                        <Select value={selectedCashRegister} onValueChange={setSelectedCashRegister}>
                            <SelectTrigger>
                                <SelectValue placeholder="Choose a cash register" />
                            </SelectTrigger>
                            <SelectContent className="z-[60000]">
                                {cashRegisters.map((register) => (
                                    <SelectItem key={register.id} value={register.id.toString()}>
                                        {register.name} - {register.branch?.name || 'No Branch'}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                    </div>

                    {/* Selected Register Info */}
                    {selectedRegister && (
                        <Card>
                            <CardContent className="p-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>{t('Branch')}:</span>
                                        <span className="font-medium">{selectedRegister.branch.name}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>{t('Current Balance')}:</span>
                                        <span className="font-medium">
                                            ${parseFloat(selectedRegister.current_balance || 0).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Opening Balance */}
                    <div>
                        <Label htmlFor="openingBalance">{t('Opening Balance')}</Label>
                        <div className="flex space-x-2 mt-1">
                            <Input
                                id="openingBalance"
                                type="number"
                                value={openingBalance}
                                onChange={(e) => setOpeningBalance(e.target.value)}
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                                className="flex-1"
                            />
                            {selectedRegister && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={useCurrentBalance}
                                    className="whitespace-nowrap"
                                >
                                    <Calculator className="h-4 w-4 mr-1" />
                                    {t('Use Current')}
                                </Button>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            {t('Enter the actual cash amount in the register to start your session')}
                        </p>
                    </div>

                </div>
                    <DialogFooter className="px-6">
                    {/* Action Buttons */}
                    <div className="flex space-x-3">
                        <Button variant="outline" onClick={onClose} className="flex-1">
                            {t('Cancel')}
                        </Button>
                        <Button 
                            onClick={handleStartSession}
                            disabled={!selectedCashRegister || !openingBalance || loading}
                            className="flex-1 whitespace-nowrap"
                        >
                            <DollarSign className="h-4 w-4 mr-2" />
                            {loading ? t('Starting...') : t('Start Session')}
                        </Button>
                    </div>
                    </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}