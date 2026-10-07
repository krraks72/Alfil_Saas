import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTranslation } from 'react-i18next';
import { PaymentProcessor } from '@/components/payment/payment-processor';
import { useState, useEffect } from 'react';

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ReactNode;
  enabled: boolean;
}

interface PlanSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: {
    id: number;
    name: string;
    price: string | number;
    duration: string;
    paymentMethods?: any;
    isSubscribed?: boolean;
    isExpired?: boolean;
  };
  billingCycle: 'monthly' | 'yearly';
  paymentMethods: PaymentMethod[];
  onPaymentSuccess?: () => void;
}

export function PlanSubscriptionModal({ 
  isOpen, 
  onClose, 
  plan, 
  billingCycle, 
  paymentMethods,
  onPaymentSuccess 
}: PlanSubscriptionModalProps) {
  const { t } = useTranslation();

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

  const handlePaymentSuccess = () => {
    // Call parent success handler to refresh data
    onPaymentSuccess?.();
    // Close modal after a short delay to allow success message to be seen
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  const enabledPaymentMethods = paymentMethods.filter(method => method.enabled);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }} modal={!isChatGptOpen}>
      <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{t('Subscribe to {{planName}}', { planName: plan.name })}</DialogTitle>
        </DialogHeader>
        
        <div className="overflow-y-auto flex-1 pr-2">
          <PaymentProcessor
            plan={plan}
            billingCycle={billingCycle}
            paymentMethods={paymentMethods}
            onSuccess={handlePaymentSuccess}
            onCancel={onClose}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}