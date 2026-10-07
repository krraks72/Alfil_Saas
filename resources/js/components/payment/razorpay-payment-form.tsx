import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { toast } from '@/components/custom-toast';
import axios from 'axios';

interface RazorpayPaymentFormProps {
  planId: number;
  planPrice: number;
  couponCode: string;
  billingCycle: 'monthly' | 'yearly';
  razorpayKey: string;
  currency?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function RazorpayPaymentForm({
  planId,
  planPrice,
  couponCode,
  billingCycle,
  razorpayKey,
  currency = 'INR',
  onSuccess,
  onCancel
}: RazorpayPaymentFormProps) {
  const { t } = useTranslation();

  useEffect(() => {
    // Check if Razorpay script is already loaded
    if (window && (window as any).Razorpay) {
      return;
    }

    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onerror = () => {
      toast.error(t('Failed to load Razorpay checkout. Please try again.'));
    };
    document.body.appendChild(script);

    return () => {
      // Only remove if we added it
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handlePayment = async () => {
    try {
      // Create order on the server
      const response = await axios.post(route('razorpay.create-order'), {
        plan_id: planId,
        billing_cycle: billingCycle,
        coupon_code: couponCode
      });

      if (response.data.error) {
        toast.error(response.data.error);
        return;
      }

      const { order_id, amount } = response.data;

      if (!order_id || !amount) {
        toast.error(t('Invalid response from server'));
        return;
      }

      const restoreOverlays = () => {
        const overlays = document.querySelectorAll('[data-radix-dialog-overlay]');
        overlays.forEach(overlay => {
          (overlay as HTMLElement).style.display = '';
        });

        // Also restore pointer events if they were messed with
        document.body.style.pointerEvents = '';
      };

      const options = {
        key: razorpayKey,
        amount: amount,
        currency: currency,
        name: 'POS',
        description: 'Plan Subscription',
        order_id: order_id,
        handler: function(response: any) {
          restoreOverlays();
          // Verify payment on server
          axios.post(route('razorpay.verify-payment'), {
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
            plan_id: planId,
            billing_cycle: billingCycle,
            coupon_code: couponCode
          })
          .then((response) => {
            const message = response.data?.message || t('Payment completed successfully!');
            toast.success(message);
            // Small delay to ensure toast is visible before navigation
            setTimeout(() => {
              onSuccess();
            }, 1000);
          })
          .catch((error) => {
            const errorMsg = error.response?.data?.error || t('Payment verification failed');
            toast.error(errorMsg);
          });
        },
        prefill: {
          name: '',
          email: '',
          contact: ''
        },
        theme: {
          color: '#10b77f'
        },
        modal: {
          ondismiss: () => {
            restoreOverlays();
            onCancel();
          },
          escape: true,
          backdrop_close: true
        }
      };

      if (!(window as any).Razorpay) {
        toast.error(t('Razorpay SDK not loaded'));
        return;
      }

      const razorpay = new (window as any).Razorpay(options);
      (razorpay as any).on('payment.failed', () => {
        restoreOverlays();
      });
      
      // Hide dialog overlays before opening Razorpay to prevent them from blocking the modal
      const dialogOverlays = document.querySelectorAll('[data-radix-dialog-overlay]');
      dialogOverlays.forEach(overlay => {
        (overlay as HTMLElement).style.display = 'none';
      });

      razorpay.open();

      // Ensure Razorpay modal is on top and pointer events are enabled
      setTimeout(() => {
        const razorpayIframe = document.querySelector('iframe.razorpay-checkout-frame');
        if (razorpayIframe) {
          (razorpayIframe as HTMLElement).style.zIndex = '2147483647';
          (razorpayIframe as HTMLElement).style.position = 'fixed';
        }
        document.body.style.pointerEvents = 'auto';
      }, 500);
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || t('Failed to initialize payment');
      toast.error(errorMsg);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {t('You will be redirected to Razorpay to complete your payment.')}
      </p>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onCancel} className="flex-1">
          {t('Cancel')}
        </Button>
        <Button onClick={handlePayment} className="flex-1">
          {t('Pay with Razorpay')}
        </Button>
      </div>
    </div>
  );
}
