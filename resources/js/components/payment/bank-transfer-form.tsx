import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { router, usePage } from '@inertiajs/react';
import { toast } from '@/components/custom-toast';
import { Copy, CheckCircle } from 'lucide-react';
import InputError from '../input-error';

interface BankTransferFormProps {
  planId: number;
  planPrice: number;
  couponCode: string;
  billingCycle: string;
  bankDetails: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function BankTransferForm({ 
  planId, 
  planPrice,
  couponCode, 
  billingCycle, 
  bankDetails,
  onSuccess, 
  onCancel 
}: BankTransferFormProps) {
  const { t } = useTranslation();
  const [processing, setProcessing] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<String>();

  const { storageSettings } = usePage().props as any;
  const allowedTypes = storageSettings?.allowed_file_types || 'jpg,png,webp,gif';
  const acceptAttribute = allowedTypes
      .split(',')
      .map((type) => `.${type.trim()}`)
      .join(',');

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t('Copied to clipboard'));
  };

  const handleConfirmPayment = () => {
    setProcessing(true);

    const formData = new FormData();
    formData.append('plan_id', planId.toString());
    formData.append('billing_cycle', billingCycle);
    formData.append('coupon_code', couponCode);
    formData.append('amount', planPrice.toString());
    if (receiptFile) {
      formData.append('receipt', receiptFile);
    }

    router.post(route('bank.payment'), formData, {
      onSuccess: () => {
        onSuccess();
      },
      onError: (errors) => {
        setErrorMsg(errors.receipt || t('Failed to submit payment request'));
      },
      onFinish: () => {
        setProcessing(false);
      }
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <h3 className="font-medium mb-3">{t('Bank Transfer Details')}</h3>
          <div className="space-y-3 text-sm">
            <div className="whitespace-pre-line">{bankDetails}</div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="font-medium">{t('Amount')}: ${planPrice}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(planPrice.toString())}
              >
                <Copy className="h-3 w-3 mr-1" />
                {t('Copy')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-2">
            <CheckCircle className="h-5 w-5 text-orange-600 mt-0.5" />
            <div className="text-sm text-orange-800">
              <p className="font-medium mb-1">{t('Important Instructions')}</p>
              <ul className="space-y-1 text-xs">
                <li>• {t('Transfer the exact amount shown above')}</li>
                <li>• {t('Include your order reference in the transfer description')}</li>
                <li>• {t('Your plan will be activated after payment verification')}</li>
                <li>• {t('Verification may take 1-3 business days')}</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <Label required>{t('Bank Transfer Receipt')}</Label>
        <div
          className={`mt-1 border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors ${
            isDragging ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary/50'
          }`}
          onClick={() => document.getElementById('bank-plan-receipt')?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            const file = e.dataTransfer.files?.[0];
            if (file) setReceiptFile(file);
          }}
        >
          <input
            id="bank-plan-receipt"
            type="file"
            accept={acceptAttribute}
            className="hidden"
            onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)}
          />
          {receiptFile ? (
            <p className="text-sm text-primary font-medium">{receiptFile.name}</p>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <p className="text-sm font-medium text-gray-600">{t('Click to upload receipt')}</p>
              <p className="text-xs text-gray-400 mt-1">{t('JPG, PNG, PDF up to 5MB')}</p>
            </>
          )}
        </div>
        <InputError message={errorMsg} />
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onCancel} className="flex-1">
          {t('Cancel')}
        </Button>
        <Button 
          onClick={handleConfirmPayment} 
          disabled={processing}
          className="flex-1"
        >
          {processing ? t('Processing...') : t('I have made the payment')}
        </Button>
      </div>
    </div>
  );
}