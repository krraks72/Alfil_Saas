import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { CheckCircle2, CreditCard } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Plan {
  id: number;
  name: string;
  price: string | number;
  duration: string;
  description?: string;
  features?: string[];
  is_active?: boolean;
  is_current?: boolean;
  is_default?: boolean;
}

interface UpgradePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (planId: number, duration: string) => void;
  plans: Plan[];
  currentPlanId?: number;
  currentBillingCycle?: string;
  companyName: string;
}

export function UpgradePlanModal({
  isOpen,
  onClose,
  onConfirm,
  plans,
  currentPlanId,
  currentBillingCycle = 'monthly',
  companyName
}: UpgradePlanModalProps) {
  const { t } = useTranslation();
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [isYearly, setIsYearly] = useState(false);

  const filteredPlans = plans.filter(plan => {
    const duration = plan.duration.toLowerCase();
    return isYearly ? duration === 'yearly' : duration === 'monthly';
  });

  useEffect(() => {
    if (!isOpen) {
      setIsYearly(false);
      setSelectedPlanId(null);
      return;
    }
    setIsYearly(currentBillingCycle === 'yearly');
  }, [isOpen, currentBillingCycle]);

  useEffect(() => {
    if (!isOpen || filteredPlans.length === 0) return;
    const currentPlan = filteredPlans.find(plan => plan.is_current === true);
    if (currentPlan) {
      setSelectedPlanId(currentPlan.id);
    } else if (currentPlanId) {
      const planExists = filteredPlans.find(plan => plan.id === currentPlanId);
      setSelectedPlanId(planExists ? currentPlanId : filteredPlans[0].id);
    } else {
      setSelectedPlanId(filteredPlans[0].id);
    }
  }, [isOpen, plans, isYearly]);

  const handleConfirm = () => {
    if (selectedPlanId) {
      onConfirm(selectedPlanId, isYearly ? 'yearly' : 'monthly');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100%-2rem)] sm:max-w-xl md:max-w-2xl max-h-[85vh] p-0 rounded-lg overflow-hidden flex flex-col" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <DialogTitle className="text-lg font-semibold text-foreground break-words">{t("Upgrade Plan for")} {companyName}</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {t("Select a new plan for this company")}
          </DialogDescription>
        </DialogHeader>

        {/* Billing Period Toggle */}
        <div className="mx-4 sm:mx-6 my-3 shrink-0 flex flex-wrap items-center justify-center gap-2 sm:gap-3 py-2 px-4 bg-muted/50 rounded-lg">
          <span className={`text-xs sm:text-sm font-medium transition-colors ${!isYearly ? 'text-primary' : 'text-muted-foreground'}`}>
            {t('Monthly')}
          </span>
          <Switch
            checked={isYearly}
            onCheckedChange={setIsYearly}
            className="data-[state=checked]:bg-primary"
          />
          <span className={`text-xs sm:text-sm font-medium transition-colors ${isYearly ? 'text-primary' : 'text-muted-foreground'}`}>
            {t('Yearly')}
          </span>
          {isYearly && (
            <span className="inline-flex items-center rounded-md bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 px-2 py-1 text-xs font-medium ring-1 ring-inset ring-green-600/20">
              {t('Save up to 20%')}
            </span>
          )}
        </div>

        {/* Scrollable Container */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-2">
          <RadioGroup
            value={selectedPlanId?.toString() || ""}
            onValueChange={(value) => setSelectedPlanId(parseInt(value))}
            className="space-y-3 pb-3"
          >
            {filteredPlans.length > 0 ? filteredPlans.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-lg border-2 p-3 sm:p-4 cursor-pointer transition-all ${
                  selectedPlanId === plan.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-gray-300 dark:hover:border-gray-700 bg-card'
                }`}
                onClick={() => setSelectedPlanId(plan.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="flex items-center pt-1">
                    <RadioGroupItem value={plan.id.toString()} id={`plan-${plan.id}`} className="h-4 w-4 shrink-0" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <h3 className="text-base font-semibold text-foreground truncate">{plan.name}</h3>
                        {plan.is_current && (
                          <span className="inline-flex items-center rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 px-2 py-1 text-xs font-medium ring-1 ring-inset ring-blue-600/20 shrink-0">
                            {t("Current")}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-baseline gap-1 mb-1">
                      <CreditCard className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-base font-bold text-foreground leading-tight font-mono">
                        {window.appSettings?.formatCurrency(plan.price) || `$${plan.price}`}
                      </span>
                      <span className="text-xs sm:text-sm text-muted-foreground leading-tight">/ {plan.duration.toLowerCase()}</span>
                    </div>
                    {plan.description && (
                      <p className="text-xs sm:text-sm text-muted-foreground mb-2 leading-snug break-words">{plan.description}</p>
                    )}
                    {plan.features && plan.features.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {plan.features.slice(0, 3).map((feature, index) => (
                          <span
                            key={`${plan.id}-${index}`}
                            className="inline-flex items-center rounded-md bg-muted/40 text-foreground/80 border border-border py-0.5 px-2 text-xs font-normal max-w-full"
                          >
                            <CheckCircle2 className="mr-1 h-3 w-3 text-green-500 shrink-0" />
                            <span className="truncate">{feature}</span>
                          </span>
                        ))}
                        {plan.features.length > 3 && (
                          <span className="inline-flex items-center rounded-md bg-muted/40 text-muted-foreground border border-border py-0.5 px-2 text-xs font-normal shrink-0">
                            +{plan.features.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">{t('No plans available for')} {isYearly ? t('yearly') : t('monthly')} {t('billing')}</p>
              </div>
            )}
          </RadioGroup>
        </div>

        <DialogFooter className="border-t py-3 px-4 sm:px-6 shrink-0 flex-col-reverse sm:flex-row gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto text-sm font-medium">
            {t("Cancel")}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedPlanId || filteredPlans.length === 0}
            className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-sm font-medium"
          >
            {t("Upgrade Plan")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}