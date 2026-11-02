import { useState } from 'react';
import { PageTemplate } from '@/components/page-template';
import { usePage, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight, Check, User, MapPin, Truck } from 'lucide-react';
import { toast } from '@/components/custom-toast';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

const STEPS = [
  { id: 1, label: 'Basic Information', icon: User },
  { id: 2, label: 'Billing Address', icon: MapPin },
  { id: 3, label: 'Shipping & More', icon: Truck },
];

const STEP_FIELDS: Record<number, string[]> = {
  1: ['name', 'email', 'phone', 'date_of_birth', 'gender', 'status', 'identification', 'first_name', 'last_name', 'digit_check', 'identification_type_code', 'person_type', 'regime_type', 'responsible_for', 'responsibilities', 'economic_activities'],
  2: ['billing_address', 'billing_city', 'billing_state', 'billing_postal_code', 'billing_country', 'billing_region_code', 'billing_city_code'],
  3: ['shipping_address', 'shipping_city', 'shipping_state', 'shipping_postal_code', 'shipping_country', 'notes'],
};

interface FormData {
  name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: string;
  status: string;
  identification: string;
  first_name: string;
  last_name: string;
  digit_check: string;
  identification_type_code: string;
  person_type: string;
  regime_type: string;
  responsible_for: string;
  responsibilities: string;
  billing_region_code: string;
  billing_city_code: string;
  economic_activities: string;
  billing_address: string;
  billing_city: string;
  billing_state: string;
  billing_postal_code: string;
  billing_country: string;
  same_as_billing: boolean;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_postal_code: string;
  shipping_country: string;
  notes: string;
}

type FormErrors = Partial<Record<keyof FormData, string>>;

function Field({ label, required, error, children }: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label required={required} className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </Label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

export default function CustomerCreate() {
  const { t } = useTranslation();

  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverErrors, setServerErrors] = useState<FormErrors>({});
  const [processing, setProcessing] = useState(false);

  const [form, setForm] = useState<FormData>({
    name: '', email: '', phone: '', date_of_birth: '', gender: '', status: 'active',
    identification: '', first_name: '', last_name: '', digit_check: '', identification_type_code: '', person_type: '',
    regime_type: '', responsible_for: '', responsibilities: '', economic_activities: '',
    billing_region_code: '', billing_city_code: '',
    billing_address: '', billing_city: '', billing_state: '', billing_postal_code: '', billing_country: '',
    same_as_billing: false,
    shipping_address: '', shipping_city: '', shipping_state: '', shipping_postal_code: '', shipping_country: '',
    notes: '',
  });

  const set = (field: keyof FormData, value: any) => {
    setForm(prev => {
      const updated = { ...prev, [field]: value };
      // When same_as_billing toggled on, copy billing fields to shipping
      if (field === 'same_as_billing') {
        if (value === true) {
          updated.shipping_address = prev.billing_address;
          updated.shipping_city = prev.billing_city;
          updated.shipping_state = prev.billing_state;
          updated.shipping_postal_code = prev.billing_postal_code;
          updated.shipping_country = prev.billing_country;
        } else {
          updated.shipping_address = '';
          updated.shipping_city = '';
          updated.shipping_state = '';
          updated.shipping_postal_code = '';
          updated.shipping_country = '';
        }
      }
      return updated;
    });
    // Only clear error when field has a value, keep error visible if field is emptied
    if (value !== '' && value !== false && value !== null && value !== undefined) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
      setServerErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateStep = (s: number): boolean => {
    const errs: FormErrors = {};
    if (s === 1) {
      if (!form.name.trim()) errs.name = t('Customer name is required');
      if (!form.email.trim()) errs.email = t('Email is required');
    }
    if (s === 2) {
      if (!form.billing_address.trim()) errs.billing_address = t('Billing address is required');
      if (!form.billing_city.trim()) errs.billing_city = t('City is required');
      if (!form.billing_state.trim()) errs.billing_state = t('State is required');
      if (!form.billing_postal_code.trim()) errs.billing_postal_code = t('Postal code is required');
      if (!form.billing_country.trim()) errs.billing_country = t('Country is required');
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const next = () => { if (validateStep(step)) setStep(s => s + 1); };
  const prev = () => {
    setErrors({});
    setServerErrors({});
    setStep(s => s - 1);
  };

  // Merge client + server errors — server errors show on inputs too
  const allErrors: FormErrors = { ...errors, ...serverErrors };

  const hasStepError = (stepId: number): boolean =>
    STEP_FIELDS[stepId]?.some(field => !!allErrors[field as keyof FormData]) ?? false;

  const handleSubmit = () => {
    if (!validateStep(step)) return;
    setProcessing(true);
    toast.loading(t('Creating customer...'));
    router.post(route('customers.store'), form as any, {
      onSuccess: (page: any) => {
        toast.dismiss();
        if (page.props.flash?.success) toast.success(t(page.props.flash.success));
        else if (page.props.flash?.error) toast.error(t(page.props.flash.error));
        router.visit(route('customers.index'));
      },
      onError: (errs: any) => {
        toast.dismiss();
        if (typeof errs === 'object') {
          setServerErrors(errs);
          setErrors(errs);
          const firstErrStep = [1, 2, 3].find(stepId =>
            STEP_FIELDS[stepId]?.some(field => !!errs[field])
          );
          if (firstErrStep) setStep(firstErrStep);
        } else {
          toast.error(errs);
        }
        setProcessing(false);
      },
      onFinish: () => setProcessing(false),
    });
  };

  return (
    <PageTemplate
      title={t('Add New Customer')}
      description={t('Fill in the details below to create a new customer.')}
      url="/customers/create"
      breadcrumbs={[
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Contacts'), href: route('customers.index') },
        { title: t('Customers'), href: route('customers.index') },
        { title: t('Add New Customer') },
      ]}
      actions={[{
        label: t('Back'),
        icon: <ArrowLeft className="h-4 w-4" />,
        variant: 'outline',
        onClick: () => router.visit(route('customers.index')),
      }]}
    >
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">

        {/* Step indicator */}
        <div className="px-4 sm:px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          {/* Mobile Step Header (< lg) */}
          <div className="lg:hidden space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                {t('Step {{current}} of {{total}}', { current: step, total: STEPS.length })}
              </span>
              <span className={cn(
                'text-xs font-semibold',
                hasStepError(step) ? 'text-red-500' : 'text-primary'
              )}>
                {t(STEPS.find(s => s.id === step)?.label || '')}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {STEPS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    if (s.id < step || validateStep(step)) setStep(s.id);
                  }}
                  className={cn(
                    'h-1.5 flex-1 rounded-full transition-all duration-300',
                    hasStepError(s.id)
                      ? 'bg-red-500'
                      : step >= s.id
                        ? 'bg-primary'
                        : 'bg-gray-200 dark:bg-gray-700'
                  )}
                />
              ))}
            </div>
          </div>

          {/* Desktop Step Header (>= lg) */}
          <div className="hidden lg:flex items-center">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex-1 flex items-center">
                <div
                  className="flex items-center gap-2.5 cursor-pointer"
                  onClick={() => {
                    if (s.id < step || validateStep(step)) setStep(s.id);
                  }}
                >
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center border-2 text-sm font-semibold transition-all duration-300 shrink-0',
                    hasStepError(s.id) ? 'bg-red-500 border-red-500 text-white'
                      : step > s.id ? 'bg-primary border-primary text-primary-foreground'
                        : step === s.id ? 'border-primary text-primary bg-transparent'
                          : 'border-gray-300 dark:border-gray-600 text-gray-400 bg-transparent',
                  )}>
                    {hasStepError(s.id)
                      ? <span className="text-sm font-bold">!</span>
                      : step > s.id
                        ? <Check className="h-3.5 w-3.5" />
                        : s.id}
                  </div>
                  <span className={cn(
                    'text-sm font-semibold whitespace-nowrap transition-colors duration-300',
                    hasStepError(s.id) ? 'text-red-500'
                      : step === s.id ? 'text-primary'
                        : step > s.id ? 'text-gray-600 dark:text-gray-300'
                          : 'text-gray-400 dark:text-gray-500',
                  )}>
                    {t(s.label)}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="flex-1 mx-4 h-px bg-gray-200 dark:bg-gray-700 relative overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 bg-primary transition-all duration-500"
                      style={{ width: step > i + 1 ? '100%' : '0%' }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form body */}
        <div className="p-4 sm:p-6">

          {/* Step 1 — Basic Information */}
          <div className={step === 1 ? 'block' : 'hidden'}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <Field label={t('Customer Name')} required error={allErrors.name}>
                <Input
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  placeholder={t('Enter customer name')}
                  className={cn(allErrors.name && 'border-red-400 focus-visible:border-red-400')}
                />
              </Field>

              <Field label={t('Email')} required error={allErrors.email}>
                <Input
                  type="email"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  placeholder={t('Enter email address')}
                  className={cn(allErrors.email && 'border-red-400 focus-visible:border-red-400')}
                />
              </Field>

              <Field label={t('Phone')} error={allErrors.phone}>
                <Input
                  value={form.phone}
                  onChange={e => set('phone', e.target.value)}
                  placeholder={t('Enter phone number')}
                  className={cn(allErrors.phone && 'border-red-400 focus-visible:border-red-400')}
                />
              </Field>

              <Field label={t('Date of Birth')} error={allErrors.date_of_birth}>
                <Input
                  type="date"
                  max={new Date().toISOString().split('T')[0]}
                  value={form.date_of_birth}
                  onChange={e => set('date_of_birth', e.target.value)}
                  className={cn(allErrors.date_of_birth && 'border-red-400 focus-visible:border-red-400')}
                />
              </Field>

              <Field label={t('Gender')} error={allErrors.gender}>
                <Select value={form.gender} onValueChange={val => set('gender', val)}>
                  <SelectTrigger className={cn(allErrors.gender && 'border-red-400')}>
                    <SelectValue placeholder={t('Select gender')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">{t('Male')}</SelectItem>
                    <SelectItem value="female">{t('Female')}</SelectItem>
                    <SelectItem value="other">{t('Other')}</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <Field label={t('Status')}>
                <div className="flex h-10 w-full items-center justify-between rounded-md border border-input px-3 py-1 text-sm">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {form.status === 'active' ? t('Active') : t('Inactive')}
                  </p>
                  <Switch
                    checked={form.status === 'active'}
                    onCheckedChange={checked => set('status', checked ? 'active' : 'inactive')}
                  />
                </div>
              </Field>
              <Field label={t('Tax identification number')}>
                <Input value={form.identification} onChange={e => set('identification', e.target.value)} />
              </Field>
              <Field label={t('Tax first name')}>
                <Input value={form.first_name} onChange={e => set('first_name', e.target.value)} />
              </Field>
              <Field label={t('Tax last name')}>
                <Input value={form.last_name} onChange={e => set('last_name', e.target.value)} />
              </Field>
              <Field label={t('Identification check digit')}>
                <Input value={form.digit_check} onChange={e => set('digit_check', e.target.value)} />
              </Field>
              <Field label={t('Identification type code')}>
                <Input value={form.identification_type_code} onChange={e => set('identification_type_code', e.target.value)} />
              </Field>
              <Field label={t('Person type code')}>
                <Input value={form.person_type} onChange={e => set('person_type', e.target.value)} />
              </Field>
              <Field label={t('Tax regime code')}>
                <Input value={form.regime_type} onChange={e => set('regime_type', e.target.value)} />
              </Field>
              <Field label={t('Tax responsibility code')}>
                <Input value={form.responsible_for} onChange={e => set('responsible_for', e.target.value)} />
              </Field>
              <Field label={t('Tax responsibilities')}>
                <Input value={form.responsibilities} onChange={e => set('responsibilities', e.target.value)} />
              </Field>
              <Field label={t('Economic activities')}>
                <Input value={form.economic_activities} onChange={e => set('economic_activities', e.target.value)} />
              </Field>
            </div>
          </div>

          {/* Step 2 — Billing Address */}
          <div className={step === 2 ? 'block' : 'hidden'}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="sm:col-span-2">
                <Field label={t('Billing Address')} required error={allErrors.billing_address}>
                  <Textarea
                    value={form.billing_address}
                    onChange={e => set('billing_address', e.target.value)}
                    placeholder={t('Enter billing address')}
                    rows={3}
                    className={cn('resize-none', allErrors.billing_address && 'border-red-400 focus-visible:border-red-400')}
                  />
                </Field>
              </div>

              <Field label={t('City')} required error={allErrors.billing_city}>
                <Input
                  value={form.billing_city}
                  onChange={e => set('billing_city', e.target.value)}
                  placeholder={t('Enter city')}
                  className={cn(allErrors.billing_city && 'border-red-400 focus-visible:border-red-400')}
                />
              </Field>

              <Field label={t('State')} required error={allErrors.billing_state}>
                <Input
                  value={form.billing_state}
                  onChange={e => set('billing_state', e.target.value)}
                  placeholder={t('Enter state')}
                  className={cn(allErrors.billing_state && 'border-red-400 focus-visible:border-red-400')}
                />
              </Field>

              <Field label={t('DIAN region code')}>
                <Input value={form.billing_region_code} onChange={e => set('billing_region_code', e.target.value)} />
              </Field>
              <Field label={t('DIAN city code')}>
                <Input value={form.billing_city_code} onChange={e => set('billing_city_code', e.target.value)} />
              </Field>

              <Field label={t('Postal Code')} required error={allErrors.billing_postal_code}>
                <Input
                  value={form.billing_postal_code}
                  onChange={e => set('billing_postal_code', e.target.value)}
                  placeholder={t('Enter postal code')}
                  className={cn(allErrors.billing_postal_code && 'border-red-400 focus-visible:border-red-400')}
                />
              </Field>

              <Field label={t('Country')} required error={allErrors.billing_country}>
                <Input
                  value={form.billing_country}
                  onChange={e => set('billing_country', e.target.value)}
                  placeholder={t('Enter country')}
                  className={cn(allErrors.billing_country && 'border-red-400 focus-visible:border-red-400')}
                />
              </Field>
            </div>
          </div>

          {/* Step 3 — Shipping & More */}
          <div className={step === 3 ? 'block' : 'hidden'}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">

              {/* Same as billing toggle */}
              <div className="sm:col-span-2">
                <div
                  className={cn(
                    'flex items-center justify-between rounded-lg border px-4 py-3 cursor-pointer transition-colors',
                    form.same_as_billing
                      ? 'border-primary/40 bg-primary/5 dark:bg-primary/10'
                      : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50',
                  )}
                  onClick={() => set('same_as_billing', !form.same_as_billing)}
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{t('Same as Billing Address')}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t('Use billing address for shipping')}</p>
                  </div>
                  <Switch
                    checked={form.same_as_billing}
                    onCheckedChange={checked => set('same_as_billing', checked)}
                    onClick={e => e.stopPropagation()}
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <Field label={t('Shipping Address')} error={allErrors.shipping_address}>
                  <Textarea
                    value={form.shipping_address}
                    onChange={e => set('shipping_address', e.target.value)}
                    placeholder={t('Enter shipping address')}
                    rows={3}
                    className={cn('resize-none', allErrors.shipping_address && 'border-red-400 focus-visible:border-red-400')}
                  />
                </Field>
              </div>

              <Field label={t('City')} error={allErrors.shipping_city}>
                <Input
                  value={form.shipping_city}
                  onChange={e => set('shipping_city', e.target.value)}
                  placeholder={t('Enter city')}
                  className={cn(allErrors.shipping_city && 'border-red-400 focus-visible:border-red-400')}
                />
              </Field>

              <Field label={t('State')} error={allErrors.shipping_state}>
                <Input
                  value={form.shipping_state}
                  onChange={e => set('shipping_state', e.target.value)}
                  placeholder={t('Enter state')}
                  className={cn(allErrors.shipping_state && 'border-red-400 focus-visible:border-red-400')}
                />
              </Field>

              <Field label={t('Postal Code')} error={allErrors.shipping_postal_code}>
                <Input
                  value={form.shipping_postal_code}
                  onChange={e => set('shipping_postal_code', e.target.value)}
                  placeholder={t('Enter postal code')}
                  className={cn(allErrors.shipping_postal_code && 'border-red-400 focus-visible:border-red-400')}
                />
              </Field>

              <Field label={t('Country')} error={allErrors.shipping_country}>
                <Input
                  value={form.shipping_country}
                  onChange={e => set('shipping_country', e.target.value)}
                  placeholder={t('Enter country')}
                  className={cn(allErrors.shipping_country && 'border-red-400 focus-visible:border-red-400')}
                />
              </Field>

              {/* Notes — always visible */}
              <div className="sm:col-span-2">
                <Field label={t('Notes')} error={allErrors.notes}>
                  <Textarea
                    value={form.notes}
                    onChange={e => set('notes', e.target.value)}
                    placeholder={t('Enter any additional notes (optional)')}
                    rows={4}
                    className="resize-none"
                  />
                </Field>
              </div>
            </div>
          </div>
        </div>

        {/* Footer navigation */}
        <div className="px-4 sm:px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 sm:gap-0">
          <div className="w-full sm:w-auto">
            {step > 1 && (
              <Button type="button" variant="outline" onClick={prev} className="w-full sm:w-auto gap-2">
                <ArrowLeft className="h-4 w-4" />
                {t('Previous')}
              </Button>
            )}
          </div>
          <div className="w-full sm:w-auto flex justify-end">
            {step < STEPS.length ? (
              <Button type="button" onClick={next} className="w-full sm:w-auto gap-2">
                {t('Next')}
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button type="button" onClick={handleSubmit} className="w-full sm:w-auto gap-2">
                {t('Save')}
              </Button>
            )}
          </div>
        </div>

      </div>
    </PageTemplate>
  );
}
