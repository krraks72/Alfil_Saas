import { useState } from 'react';
import { PageTemplate } from '@/components/page-template';
import { usePage, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight, Check, Package, Tag } from 'lucide-react';
import { toast } from '@/components/custom-toast';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SimpleMultiSelect } from '@/components/simple-multi-select';
import MediaPicker from '@/components/MediaPicker';
import { cn } from '@/lib/utils';

const STEPS = [
  { id: 1, label: 'General Information' },
  { id: 2, label: 'Pricing & Stock' },
  { id: 3, label: 'Media & Settings' },
];

const STEP_FIELDS: Record<number, string[]> = {
  1: ['name', 'sku', 'category_id', 'brand_id', 'description'],
  2: ['unit_id', 'purchase_price', 'selling_price', 'stock_quantity', 'min_stock_level', 'tax_ids'],
  3: ['image', 'status'],
};

function ProductPreview({ form, categories, brands, t }: {
  form: FormData;
  categories: any[];
  brands: any[];
  t: (k: string) => string;
}) {
  const categoryName = categories?.find((c: any) => String(c.id) === form.category_id)?.name;
  const brandName    = brands?.find((b: any) => String(b.id) === form.brand_id)?.name;
  const stockNum     = parseInt(form.stock_quantity || '0');
  const minStock     = parseInt(form.min_stock_level || '0');
  const isLowStock   = stockNum <= minStock;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm sticky top-6">
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
        <p className="text-xs font-semibold tracking-widest text-gray-400 dark:text-gray-500">{t('Live Preview')}</p>
      </div>
      <div className="p-4 space-y-3">

        {/* Image */}
        <div className="w-full h-34 rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
          {form.image
            ? <img src={form.image} alt={form.name} className="w-full h-full object-coniatner" />
            : <div className="flex flex-col items-center gap-1.5 text-gray-300 dark:text-gray-600">
                <Package className="w-8 h-8" />
                <span className="text-xs">{t('No image uploaded')}</span>
              </div>
          }
        </div>

        {/* Name & SKU */}
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
            {form.name || t('Untitled Product')}
          </p>
          <div className="flex items-center gap-1 mt-0.5">
            <Tag className="w-3 h-3 text-gray-400" />
            <p className="text-xs text-gray-400 truncate">{form.sku || 'SKU-XXXXXXXX'}</p>
          </div>
        </div>

        {/* Category & Brand */}
        {(categoryName || brandName) && (
          <div className="flex flex-wrap gap-1">
            {categoryName && (
              <span className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20 dark:bg-green-900/30 dark:text-green-300 dark:ring-green-500/30">{categoryName}</span>
            )}
            {brandName && (
              <span className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium bg-gray-50 text-gray-700 ring-1 ring-inset ring-gray-600/20 dark:bg-gray-900/30 dark:text-gray-300 dark:ring-gray-500/30">{brandName}</span>
            )}
          </div>
        )}

        {/* Price & Stock */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 px-2.5 py-2">
            <p className="text-xs text-gray-400 tracking-wide">{t('Sale Price')}</p>
            <p className="text-sm font-mono text-gray-900 dark:text-white mt-0.5">
              {form.selling_price ? `${window.appSettings.formatCurrency(parseFloat(form.selling_price).toFixed(2))}` : `${window.appSettings.formatCurrency(0)}`}
            </p>
          </div>
          <div className={cn(
            'rounded-lg border px-2.5 py-2',
            isLowStock
              ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-800'
              : 'bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700',
          )}>
            <p className="text-xs text-gray-400 tracking-wide">{t('Stock')}</p>
            <p className={cn('text-sm font-bold mt-0.5', isLowStock ? 'text-orange-500' : 'text-gray-900 dark:text-white')}>
              {form.stock_quantity || '0'}
            </p>
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">{t('Status')}</span>
          <span className={cn(
            'inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset',
            form.status === 'active'
              ? 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/30 dark:text-green-300 dark:ring-green-500/30'
              : 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-900/30 dark:text-red-300 dark:ring-red-500/30',
          )}>
            {form.status === 'active' ? t('Active') : t('Inactive')}
          </span>
        </div>

        {/* Description */}
        {form.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 border-t border-gray-100 dark:border-gray-700 pt-2">
            {form.description}
          </p>
        )}
      </div>
    </div>
  );
}

function Field({ label, required, error, children }: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

interface FormData {
  name: string;
  sku: string;
  category_id: string;
  brand_id: string;
  description: string;
  unit_id: string;
  purchase_price: string;
  selling_price: string;
  stock_quantity: string;
  min_stock_level: string;
  tax_ids: string[];
  image: string;
  status: string;
}

type FormErrors = Partial<Record<keyof FormData, string>>;

export default function ProductEdit() {
  const { t } = useTranslation();
  const { product, categories, brands, units, taxes } = usePage().props as any;

  const [step, setStep]               = useState(1);
  const [errors, setErrors]           = useState<FormErrors>({});
  const [serverErrors, setServerErrors] = useState<FormErrors>({});
  const [processing, setProcessing]   = useState(false);

  const [form, setForm] = useState<FormData>({
    name:           product.name          ?? '',
    sku:            product.sku           ?? '',
    category_id:    String(product.category_id  ?? ''),
    brand_id:       String(product.brand_id     ?? ''),
    description:    product.description   ?? '',
    unit_id:        String(product.unit_id      ?? ''),
    purchase_price: String(product.purchase_price ?? ''),
    selling_price:  String(product.selling_price  ?? ''),
    stock_quantity: String(product.stock_quantity ?? ''),
    min_stock_level:String(product.min_stock_level ?? ''),
    tax_ids:        product.taxes?.map((t: any) => String(t.id)) ?? [],
    image:          product.image         ?? '',
    status:         product.status        ?? 'active',
  });

  const set = (field: keyof FormData, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
    setServerErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const validateStep = (s: number): boolean => {
    const errs: FormErrors = {};
    if (s === 1) {
      if (!form.name.trim()) errs.name        = t('Product name is required');
      if (!form.sku.trim())  errs.sku         = t('SKU is required');
      if (!form.category_id) errs.category_id = t('Category is required');
      if (!form.brand_id)    errs.brand_id    = t('Brand is required');
    }
    if (s === 2) {
      if (!form.unit_id)              errs.unit_id        = t('Unit is required');
      if (form.purchase_price === '') errs.purchase_price = t('Purchase price is required');
      if (form.selling_price === '')  errs.selling_price  = t('Selling price is required');
      else if (parseFloat(form.selling_price) < parseFloat(form.purchase_price || '0'))
                                      errs.selling_price  = t('Selling price must be ≥ purchase price');
      if (form.stock_quantity === '')  errs.stock_quantity  = t('Stock quantity is required');
      if (form.min_stock_level === '') errs.min_stock_level = t('Min stock level is required');
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const next = () => { if (validateStep(step)) setStep(s => s + 1); };
  const prev = () => setStep(s => s - 1);

  const hasStepError = (stepId: number): boolean =>
    STEP_FIELDS[stepId]?.some(field => !!serverErrors[field as keyof FormData]) ?? false;

  const handleSubmit = () => {
    if (!validateStep(3)) return;
    setProcessing(true);
    toast.loading(t('Updating product...'));
    router.put(route('products.update', product.id), form as any, {
      onSuccess: (page: any) => {
        toast.dismiss();
        if (page.props.flash?.success) toast.success(t(page.props.flash.success));
        else if (page.props.flash?.error) toast.error(t(page.props.flash.error));
      },
      onError: (errs: any) => {
        toast.dismiss();
        toast.error(typeof errs === 'string' ? errs : Object.values(errs).join(', '));
        if (typeof errs === 'object') {
          setServerErrors(errs);
          setErrors(errs);
          const firstErrStep = [1, 2, 3].find(stepId =>
            STEP_FIELDS[stepId]?.some(field => !!errs[field])
          );
          if (firstErrStep) setStep(firstErrStep);
        }
        setProcessing(false);
      },
      onFinish: () => setProcessing(false),
    });
  };

  return (
    <PageTemplate
      title={t('Edit Product')}
      description={t('Edit the details of an existing product.')}
      url={`/products/${product.id}/edit`}
      breadcrumbs={[
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Product Management'), href: route('products.index') },
        { title: t('Products'), href: route('products.index') },
        { title: t('Edit Product') },
      ]}
      actions={[{
        label: t('Back'),
        icon: <ArrowLeft className="h-4 w-4" />,
        variant: 'outline',
        onClick: () => router.visit(route('products.index')),
      }]}
    >
      <div className="space-y-6 w-full max-w-full">

        {/* ── Form + Preview layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">

        {/* ── Form card ── */}
        <div className="lg:col-span-8 xl:col-span-9 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm min-w-0 w-full">

          {/* Card header — Step indicator */}
          <div className="px-4 sm:px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            {/* Mobile Step Header (< xl) */}
            <div className="xl:hidden space-y-2">
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

            {/* Desktop Step Header (>= xl) */}
            <div className="hidden xl:flex items-center">
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
                      step > s.id && hasStepError(s.id)    ? 'bg-red-500 border-red-500 text-white'
                      : step === s.id && hasStepError(s.id) ? 'border-red-500 text-red-500 bg-transparent'
                      : step > s.id                         ? 'bg-primary border-primary text-primary-foreground'
                      : step === s.id                       ? 'border-primary text-primary bg-transparent'
                      :                                       'border-gray-300 dark:border-gray-600 text-gray-400 bg-transparent',
                    )}>
                      {step > s.id
                        ? hasStepError(s.id)
                          ? <span className="text-sm font-bold">!</span>
                          : <Check className="h-3.5 w-3.5" />
                        : hasStepError(s.id)
                          ? <span className="text-sm font-bold">!</span>
                          : s.id}
                    </div>
                    <span className={cn(
                      'text-sm font-semibold whitespace-nowrap transition-colors duration-300',
                      hasStepError(s.id)  ? 'text-red-500'
                      : step === s.id     ? 'text-primary'
                      : step > s.id       ? 'text-gray-600 dark:text-gray-300'
                      :                    'text-gray-400 dark:text-gray-500',
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

          {/* Card body — all steps always mounted, hidden via CSS */}
          <div className="p-4 sm:p-6">

            {/* Step 1 — General Information */}
            <div className={step === 1 ? 'block' : 'hidden'}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <Field label={t('Product Name')} required error={errors.name}>
                  <Input
                    value={form.name}
                    onChange={e => set('name', e.target.value)}
                    placeholder={t('Enter product name')}
                    className={cn(errors.name && 'border-red-400 focus-visible:border-red-400')}
                  />
                </Field>

                <Field label={t('SKU')} required error={errors.sku}>
                  <div className="flex gap-2">
                    <Input
                      value={form.sku}
                      onChange={e => set('sku', e.target.value)}
                      placeholder={t('Enter SKU')}
                      className={cn('flex-1', errors.sku && 'border-red-400 focus-visible:border-red-400')}
                    />
                    <Button
                      type="button"
                      variant="default"
                      className="shrink-0"
                      onClick={() => set('sku', `SKU-${Date.now()}`)}
                    >
                      {t('Generate')}
                    </Button>
                  </div>
                </Field>

                <Field label={t('Category')} required error={errors.category_id}>
                  <Select value={form.category_id} onValueChange={val => set('category_id', val)}>
                    <SelectTrigger className={cn(errors.category_id && 'border-red-400')}>
                      <SelectValue placeholder={t('Select category')} />
                    </SelectTrigger>
                    <SelectContent searchable>
                      {categories?.map((c: any) => (
                        <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field label={t('Brand')} required error={errors.brand_id}>
                  <Select value={form.brand_id} onValueChange={val => set('brand_id', val)}>
                    <SelectTrigger className={cn(errors.brand_id && 'border-red-400')}>
                      <SelectValue placeholder={t('Select brand')} />
                    </SelectTrigger>
                    <SelectContent searchable>
                      {brands?.map((b: any) => (
                        <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <div className="sm:col-span-2">
                  <Field label={t('Description')}>
                    <Textarea
                      value={form.description}
                      onChange={e => set('description', e.target.value)}
                      placeholder={t('Enter product description (optional)')}
                      rows={4}
                      className="resize-none"
                    />
                  </Field>
                </div>
              </div>
            </div>

            {/* Step 2 — Pricing & Stock */}
            <div className={step === 2 ? 'block' : 'hidden'}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <Field label={t('Unit')} required error={errors.unit_id}>
                  <Select value={form.unit_id} onValueChange={val => set('unit_id', val)}>
                    <SelectTrigger className={cn(errors.unit_id && 'border-red-400')}>
                      <SelectValue placeholder={t('Select unit')} />
                    </SelectTrigger>
                    <SelectContent searchable>
                      {units?.map((u: any) => (
                        <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field label={t('Purchase Price')} required error={errors.purchase_price}>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.purchase_price}
                    onChange={e => set('purchase_price', e.target.value)}
                    placeholder="0.00"
                    className={cn(errors.purchase_price && 'border-red-400 focus-visible:border-red-400')}
                  />
                </Field>

                <Field label={t('Selling Price')} required error={errors.selling_price}>
                  <Input
                    type="number"
                    step="0.01"
                    min={form.purchase_price || '0'}
                    value={form.selling_price}
                    onChange={e => set('selling_price', e.target.value)}
                    placeholder="0.00"
                    className={cn(errors.selling_price && 'border-red-400 focus-visible:border-red-400')}
                  />
                </Field>

                <Field label={t('Stock Quantity')} required error={errors.stock_quantity}>
                  <Input
                    type="number"
                    min="0"
                    value={form.stock_quantity}
                    onChange={e => set('stock_quantity', e.target.value)}
                    placeholder="0"
                    className={cn(errors.stock_quantity && 'border-red-400 focus-visible:border-red-400')}
                  />
                </Field>

                <Field label={t('Min Stock Level')} required error={errors.min_stock_level}>
                  <Input
                    type="number"
                    min="0"
                    value={form.min_stock_level}
                    onChange={e => set('min_stock_level', e.target.value)}
                    placeholder="0"
                    className={cn(errors.min_stock_level && 'border-red-400 focus-visible:border-red-400')}
                  />
                </Field>

                <Field label={t('Taxes')}>
                  <SimpleMultiSelect
                    options={taxes?.map((tax: any) => ({
                      value: String(tax.id),
                      label: `${tax.name} (${tax.type === 'percentage' ? tax.rate + '%' : '$' + tax.rate})`,
                    })) || []}
                    selected={form.tax_ids}
                    onChange={vals => set('tax_ids', vals)}
                    placeholder={t('Select taxes (optional)')}
                  />
                </Field>
              </div>
            </div>

            {/* Step 3 — Media & Settings */}
            <div className={step === 3 ? 'block' : 'hidden'}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="sm:col-span-2">
                  <Field label={t('Product Image')}>
                    <MediaPicker
                      value={form.image}
                      onChange={val => set('image', val)}
                      placeholder={t('Browse or select a product image')}
                    />
                  </Field>
                </div>

                <div className="sm:col-span-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4 sm:px-5 sm:py-4 gap-3 sm:gap-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{t('Status')}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {form.status === 'active'
                          ? t('Product is visible and available for sale')
                          : t('Product is hidden and unavailable for sale')}
                      </p>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3">
                      <span className={cn(
                        'text-sm font-medium',
                        form.status === 'active' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400',
                      )}>
                        {form.status === 'active' ? t('Active') : t('Inactive')}
                      </span>
                      <Switch
                        checked={form.status === 'active'}
                        onCheckedChange={checked => set('status', checked ? 'active' : 'inactive')}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Card footer — navigation */}
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
                  {t('Update')}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* ── Live Preview ── */}
        <div className="lg:col-span-4 xl:col-span-3 w-full min-w-0">
          <ProductPreview form={form} categories={categories} brands={brands} t={t} />
        </div>

        </div>
      </div>
    </PageTemplate>
  );
}
