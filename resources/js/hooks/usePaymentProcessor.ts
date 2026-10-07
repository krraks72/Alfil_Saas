import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from '@/components/custom-toast';
import { router } from '@inertiajs/react';

interface PaymentData {
  planId: number;
  billingCycle: string;
  couponCode?: string;
  paymentMethod: string;
  [key: string]: any;
}

interface UsePaymentProcessorOptions {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function usePaymentProcessor(options: UsePaymentProcessorOptions = {}) {
  const { t } = useTranslation();
  const [processing, setProcessing] = useState(false);

  const processPayment = async (paymentMethod: string, data: PaymentData) => {
    setProcessing(true);

    // Reset processing state if JSON request is used
    let jsonRequestUsed = false;

    const routes = {
      stripe: 'stripe.payment',
      paypal: 'paypal.payment',
      bank: 'bank.payment',
      razorpay: 'razorpay.payment',
      mercadopago: 'mercadopago.payment',
      paystack: 'paystack.payment',
      flutterwave: 'flutterwave.payment',
    };

    const routeName = routes[paymentMethod as keyof typeof routes];

    if (!routeName) {
      toast.error(t('Invalid payment method'));
      setProcessing(false);
      return;
    }

    const formattedData = formatPaymentData(paymentMethod, data);

    // Try JSON request first for better UX
    fetch(route(routeName), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        'Accept': 'application/json'
      },
      body: JSON.stringify(formattedData)
    })
    .then(async response => {
      const data = await response.json();
      if (response.ok && data.success) {
        // Only show toast if no onSuccess callback (to avoid duplicates)
        // if (!options.onSuccess) {
        //   toast.success(data.message || t('Payment successful and plan activated'));
        // }
        options.onSuccess?.();
      } else {
        throw new Error(data.message || t('Payment failed'));
      }
    })
    .catch(error => {
      // Fallback to Inertia request if JSON fails
      router.post(route(routeName), formattedData, {
        onSuccess: (page) => {
          // Only show toast if no onSuccess callback (to avoid duplicates)
          if (!options.onSuccess) {
            if (page.props?.flash?.success) {
              toast.success(page.props.flash.success);
            } else {
              toast.success(t('Payment successful'));
            }
          }
          options.onSuccess?.();
        },
        onError: (errors) => {
          const errorMessage = errors?.message || errors?.error || t('Payment failed');
          toast.error(errorMessage);
          options.onError?.(errorMessage);
        },
        onFinish: () => {
          setProcessing(false);
        }
      });
      return;
    })
    .finally(() => {
      setProcessing(false);
    });
  };

  const validatePaymentData = (paymentMethod: string, data: PaymentData): boolean => {
    const requiredFields = {
      stripe: ['payment_method_id', 'cardholder_name'],
      paypal: ['order_id', 'payment_id'],
      bank: ['amount'],
      razorpay: ['payment_id', 'order_id', 'signature'],
      mercadopago: ['payment_id', 'status'],
      paystack: ['payment_id'],
      flutterwave: ['payment_id'],
    };

    const required = requiredFields[paymentMethod as keyof typeof requiredFields] || [];

    for (const field of required) {
      if (!data[field]) {
        toast.error(t(`${field} is required`));
        return false;
      }
    }

    return true;
  };

  const formatPaymentData = (paymentMethod: string, data: PaymentData) => {
    return {
      plan_id: data.planId,
      billing_cycle: data.billingCycle,
      coupon_code: data.couponCode || '',
      ...data,
    };
  };

  return {
    processing,
    processPayment,
    validatePaymentData,
    formatPaymentData,
  };
}
