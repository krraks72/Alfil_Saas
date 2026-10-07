import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { toast } from '@/components/custom-toast';
import axios from 'axios';

interface TapPaymentFormProps {
  planId: number;
  planPrice: number;
  couponCode: string;
  billingCycle: 'monthly' | 'yearly';
  currency?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function TapPaymentForm({
  planId,
  planPrice,
  couponCode,
  billingCycle,
  currency = 'USD',
  onSuccess,
  onCancel
}: TapPaymentFormProps) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  const handlePayment = async () => {
    setIsLoading(true);
    
    try {
      const response = await axios.post(route('tap.create-payment'), {
        plan_id: planId,
        billing_cycle: billingCycle,
        coupon_code: couponCode
      });

      if (response.data.error) {
        toast.error(response.data.error);
        return;
      }

      if (response.data.success && response.data.redirect_url) {
        window.location.href = response.data.redirect_url;
      } else {
        toast.error(t('Failed to initialize payment'));
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || t('Failed to initialize payment');
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {t('You will be redirected to Tap to complete your payment.')}
      </p>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onCancel} className="flex-1" disabled={isLoading}>
          {t('Cancel')}
        </Button>
        <Button onClick={handlePayment} className="flex-1" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t('Pay with Tap')}
        </Button>
      </div>
    </div>
  );
}
