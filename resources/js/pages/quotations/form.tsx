import { useState, useEffect } from 'react';
import { PageTemplate } from '@/components/page-template';
import { usePage, router } from '@inertiajs/react';
import { ArrowLeft, Plus, Trash2, Calculator, FileText, User, Building, Calendar, Package, DollarSign, Edit } from 'lucide-react';
import { toast } from '@/components/custom-toast';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface QuotationFormProps {
  mode: 'create' | 'edit' | 'view';
  quotation?: any;
}

export default function QuotationForm({ mode = 'create', quotation = null }: QuotationFormProps) {
  const { t } = useTranslation();
  const { customers, branches, products, auth } = usePage().props as any;
  const currency = auth?.user?.currency_symbol || '$';

  const formatDate = (date: any) => {
    if (!date) return new Date().toISOString().split('T')[0];
    if (typeof date === 'string') return date.split(' ')[0].split('T')[0];
    return new Date(date).toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState(() => ({
    customer_id: quotation?.customer_id?.toString() || '',
    branch_id: quotation?.branch_id?.toString() || '',
    quotation_date: formatDate(quotation?.quotation_date),
    valid_until: formatDate(quotation?.valid_until) || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    items: quotation?.items?.map((item: any) => {
      const product = products?.find((p: any) => p.id == item.product_id);
      const taxes = product?.taxes || [];
      return {
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        tax_rate: item.tax_rate || 0,
        taxes,
        discount_amount: item.discount_amount || 0
      };
    }) || [],
    discount_amount: quotation?.discount_amount || 0,
    notes: quotation?.notes || '',
    terms_conditions: quotation?.terms_conditions || ''
  }));

  const isReadOnly = mode === 'view';

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!formData.customer_id) newErrors.customer_id = t('Customer is required');
    if (!formData.branch_id) newErrors.branch_id = t('Branch is required');
    if (formData.items.length === 0) newErrors.items = t('At least one item is required');

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    const action = mode === 'create' ? t('Creating quotation...') : t('Updating quotation...');
    toast.loading(action);

    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
    const url = mode === 'create' ? route('quotations.store') : route('quotations.update', quotation.id);
    const payload = mode === 'edit' ? { ...formData, _method: 'PUT' } : formData;

    fetch(url, {
      method: 'POST',
      headers: {
        'X-CSRF-TOKEN': csrfToken,
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    })
      .then(async response => {
        toast.dismiss();
        if (!response.ok) {
          const text = await response.text();
          let errorMsg;
          try {
            const data = JSON.parse(text);
            if (data.demo_mode && data.error) {
              errorMsg = t(data.error);
            } else {
              errorMsg = data.message || 'An error occurred';
            }
          } catch {
            errorMsg = 'Server error occurred';
          }
          toast.error(errorMsg);
          return;
        }
        const data = await response.json();
        toast.success(data.message);
        router.visit(route('quotations.index'));
      })
      .catch(error => {
        toast.dismiss();

        toast.error(t('Network error occurred'));
      });
  };

  const addItem = () => {
    if (isReadOnly) return;
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { product_id: '', quantity: 1, unit_price: 0, tax_rate: 0, taxes: [], discount_amount: 0 }]
    }));
  };

  const updateItem = (index: number, field: string, value: any) => {
    if (isReadOnly) return;
    setFormData(prev => {
      const updatedItems = [...prev.items];
      updatedItems[index][field] = value;

      if (field === 'product_id') {
        const product = products?.find((p: any) => p.id == value);
        if (product) {
          updatedItems[index].unit_price = product.selling_price || 0;
          const productTaxes = product.taxes || [];
          updatedItems[index].taxes = productTaxes;
          updatedItems[index].tax_rate = productTaxes.reduce((sum: number, tax: any) => sum + (parseFloat(tax.rate) || 0), 0);
        } else {
          updatedItems[index].taxes = [];
          updatedItems[index].tax_rate = 0;
        }
      }

      return { ...prev, items: updatedItems };
    });
  };

  const removeItem = (index: number) => {
    if (isReadOnly) return;
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_: any, i: number) => i !== index)
    }));
  };

  const calculateItemTotal = (item: any) => {
    const quantity = parseFloat(item.quantity) || 0;
    const unitPrice = parseFloat(item.unit_price) || 0;
    const taxRate = parseFloat(item.tax_rate) || 0;
    const lineSubtotal = quantity * unitPrice;
    const lineTax = (lineSubtotal * taxRate) / 100;
    return lineSubtotal + lineTax;
  };

  const calculateSubtotal = () => {
    return formData.items.reduce((sum: number, item: any) => {
      const quantity = parseFloat(item.quantity) || 0;
      const unitPrice = parseFloat(item.unit_price) || 0;
      return sum + (quantity * unitPrice);
    }, 0);
  };

  const calculateTotalTax = () => {
    return formData.items.reduce((sum: number, item: any) => {
      const quantity = parseFloat(item.quantity) || 0;
      const unitPrice = parseFloat(item.unit_price) || 0;
      const taxRate = parseFloat(item.tax_rate) || 0;
      const lineSubtotal = quantity * unitPrice;
      return sum + ((lineSubtotal * taxRate) / 100);
    }, 0);
  };

  const calculateAfterDiscount = () => {
    return calculateSubtotal() - (parseFloat(formData.discount_amount) || 0);
  };

  const calculateGrandTotal = () => {
    return calculateAfterDiscount() + calculateTotalTax();
  };

  const getTitle = () => {
    switch (mode) {
      case 'create': return t('Create Quotation');
      case 'edit': return t('Edit Quotation');
      case 'view': return t('View Quotation');
      default: return t('Quotation');
    }
  };

  const breadcrumbs = [
    { title: t('Dashboard'), href: route('dashboard') },
    { title: t('Quotations'), href: route('quotations.index') },
    { title: getTitle() }
  ];

  const pageActions = [
    {
      label: t('Back'),
      icon: <ArrowLeft className="h-4 w-4" />,
      variant: 'outline',
      onClick: () => router.visit(route('quotations.index'))
    }
  ];

  if (mode === 'view') {
    pageActions.push({
      label: t('Edit Quotation'),
      icon: <Edit className="h-4 w-4" />,
      variant: 'default',
      onClick: () => router.visit(`/quotations/${quotation.id}/edit`)
    });
  }

  return (
    <PageTemplate title={getTitle()} actions={pageActions} breadcrumbs={breadcrumbs} description={mode === 'create' ? t('Create new quotation.') : t('Update existing quotation.')}>
      <div className="w-full max-w-full min-w-0 overflow-x-hidden">
        <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-full min-w-0">
        {/* Status Badge for View Mode */}
        {mode === 'view' && quotation && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{quotation.quotation_number}</h3>
                  <p className="text-sm text-gray-600">{t('Created on')} {new Date(quotation.created_at).toLocaleDateString()}</p>
                </div>
                <span className={`inline-flex items-center rounded-md px-3 py-1 text-sm font-medium ${
                  quotation.status === 'approved' ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20' :
                  quotation.status === 'rejected' ? 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20' :
                  quotation.status === 'sent' ? 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20' :
                  quotation.status === 'converted' ? 'bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-600/20' :
                  'bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-600/20'
                }`}>
                  {t(quotation.status)}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Basic Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              {t('Basic Information')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  {t('Customer')} {!isReadOnly && <span className="text-red-500">*</span>}
                </Label>
                {isReadOnly ? (
                  <div className="p-3 bg-gray-50 rounded-md">
                    {customers?.find((c: any) => c.id == formData.customer_id)?.name || '-'}
                  </div>
                ) : (
                  <>
                    <Select value={formData.customer_id} onValueChange={(value) => { setFormData(prev => ({ ...prev, customer_id: value })); setErrors(prev => ({ ...prev, customer_id: '' })); }}>
                      <SelectTrigger className={errors.customer_id ? 'border-red-500' : ''}>
                        <SelectValue placeholder={t('Select Customer')} />
                      </SelectTrigger>
                      <SelectContent searchable>
                        {customers?.map((customer: any) => (
                          <SelectItem key={customer.id} value={customer.id.toString()}>
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.customer_id && <p className="text-sm text-red-500 mt-1">{errors.customer_id}</p>}
                  </>
                )}
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-gray-500" />
                  {t('Branch')} {!isReadOnly && <span className="text-red-500">*</span>}
                </Label>
                {isReadOnly ? (
                  <div className="p-3 bg-gray-50 rounded-md">
                    {branches?.find((b: any) => b.id == formData.branch_id)?.name || '-'}
                  </div>
                ) : (
                  <>
                    <Select value={formData.branch_id} onValueChange={(value) => { setFormData(prev => ({ ...prev, branch_id: value })); setErrors(prev => ({ ...prev, branch_id: '' })); }}>
                      <SelectTrigger className={errors.branch_id ? 'border-red-500' : ''}>
                        <SelectValue placeholder={t('Select Branch')} />
                      </SelectTrigger>
                      <SelectContent searchable>
                        {branches?.map((branch: any) => (
                          <SelectItem key={branch.id} value={branch.id.toString()}>
                            {branch.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.branch_id && <p className="text-sm text-red-500 mt-1">{errors.branch_id}</p>}
                  </>
                )}
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  {t('Quotation Date')} {!isReadOnly && <span className="text-red-500">*</span>}
                </Label>
                {isReadOnly ? (
                  <div className="p-3 bg-gray-50 rounded-md">
                    {new Date(formData.quotation_date).toLocaleDateString()}
                  </div>
                ) : (
                  <Input
                    type="date"
                    value={formData.quotation_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, quotation_date: e.target.value }))}
                    required
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  {t('Valid Until')} {!isReadOnly && <span className="text-red-500">*</span>}
                </Label>
                {isReadOnly ? (
                  <div className="p-3 bg-gray-50 rounded-md">
                    {new Date(formData.valid_until).toLocaleDateString()}
                  </div>
                ) : (
                  <Input
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => setFormData(prev => ({ ...prev, valid_until: e.target.value }))}
                    required
                  />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Items Card */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-green-600" />
                {t('Quotation Items')} {!isReadOnly && <span className="text-red-500">*</span>}
              </CardTitle>
              {!isReadOnly && (
                <Button type="button" onClick={() => { addItem(); setErrors(prev => ({ ...prev, items: '' })); }} className="flex items-center gap-2 w-full sm:w-auto justify-center">
                  <Plus className="h-4 w-4" />
                  {t('Add Item')}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {formData.items.length > 0 ? (
              <div className="space-y-4 overflow-x-auto min-w-0">
                {/* Table Header - hidden on screens smaller than lg (1024px) */}
                <div className="hidden lg:grid lg:grid-cols-12 gap-3 text-sm font-medium text-gray-600 border-b pb-2 min-w-0">
                  <div className="col-span-4 min-w-0">{t('Product')}</div>
                  <div className="col-span-2 text-center min-w-0">{t('Qty')}</div>
                  <div className="col-span-3 text-right min-w-0">{t('Unit Price')}</div>
                  <div className="col-span-2 min-w-0">{t('Taxes')}</div>
                  <div className="col-span-1 min-w-0"></div>
                </div>

                {/* Items */}
                {formData.items.map((item: any, index: number) => (
                  <div key={index} className="grid grid-cols-1 lg:grid-cols-12 gap-3 p-4 bg-gray-50 dark:bg-gray-800/40 rounded-lg border border-gray-200 dark:border-gray-700 items-center min-w-0">
                    <div className="col-span-1 lg:col-span-4 min-w-0">
                      <label className="text-xs font-medium text-gray-500 lg:hidden mb-1 block">{t('Product')}</label>
                      {isReadOnly ? (
                        <div className="p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                          {products?.find((p: any) => p.id == item.product_id)?.name || item.product_name || '-'}
                        </div>
                      ) : (
                        <Select value={item.product_id?.toString() || ''} onValueChange={(value) => updateItem(index, 'product_id', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder={t('Select Product')} />
                          </SelectTrigger>
                          <SelectContent searchable>
                            {products?.filter((product: any) => {
                              const selectedIds = formData.items
                                .map((i: any, idx: number) => idx !== index ? i.product_id?.toString() : null)
                                .filter(Boolean);
                              return !selectedIds.includes(product.id.toString());
                            }).map((product: any) => (
                              <SelectItem key={product.id} value={product.id.toString()}>
                                {product.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>

                    <div className="col-span-1 lg:col-span-2 min-w-0">
                      <label className="text-xs font-medium text-gray-500 lg:hidden mb-1 block">{t('Qty')}</label>
                      {isReadOnly ? (
                        <div className="p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 text-center">
                          {item.quantity}
                        </div>
                      ) : (
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                          className="text-center"
                        />
                      )}
                    </div>

                    <div className="col-span-1 lg:col-span-3 min-w-0">
                      <label className="text-xs font-medium text-gray-500 lg:hidden mb-1 block">{t('Unit Price')}</label>
                      {isReadOnly ? (
                        <div className="p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 text-right">
                          <span className="font-mono">{window.appSettings?.formatCurrency(parseFloat(item.unit_price) || 0)}</span>
                        </div>
                      ) : (
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unit_price}
                            onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                            className="pl-10 text-right"
                          />
                        </div>
                      )}
                    </div>

                    <div className="col-span-1 lg:col-span-2 flex flex-wrap gap-1 items-center pt-1 lg:pt-0 min-w-0">
                      <label className="text-xs font-medium text-gray-500 lg:hidden w-full mb-1 block">{t('Taxes')}</label>
                      {item.taxes && item.taxes.length > 0 ? (
                        item.taxes.map((tax: any) => (
                          <span
                            key={tax.id}
                            className="inline-flex items-center rounded-md bg-blue-50 dark:bg-blue-900/30 px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-300 ring-1 ring-inset ring-blue-700/10 whitespace-nowrap"
                          >
                            {tax.name} {parseFloat(tax.rate)}%
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400">{t('No tax')}</span>
                      )}
                    </div>

                    <div className="col-span-1 flex items-center justify-end lg:justify-center min-w-0">
                      {!isReadOnly && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeItem(index)}
                                    className="text-gray-500 hover:text-red-600"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{t('Remove')}</p>
                            </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                ))}

                {/* Totals */}
                <div className="border-t pt-4 space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-gray-500" />
                        {t('Discount Amount')}
                      </Label>
                      {isReadOnly ? (
                        <div className="p-3 bg-gray-50 rounded-md">
                          <span className="font-mono">{window.appSettings.formatCurrency(parseFloat(formData.discount_amount) || 0)}</span>
                        </div>
                      ) : (
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.discount_amount}
                          onChange={(e) => setFormData(prev => ({ ...prev, discount_amount: parseFloat(e.target.value) || 0 }))}
                          placeholder={t('0.00')}
                        />
                      )}
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>{t('Subtotal')}:</span>
                        <span className="font-mono">{window.appSettings.formatCurrency(calculateSubtotal())}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>{t('Discount')}:</span>
                        <span className="text-red-600 font-mono">-{window.appSettings.formatCurrency(parseFloat(formData.discount_amount) || 0)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>{t('After Discount')}:</span>
                        <span className="font-mono">{window.appSettings.formatCurrency(calculateAfterDiscount())}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>{t('Total Tax')}:</span>
                        <span className="font-mono">{window.appSettings.formatCurrency(calculateTotalTax())}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-lg font-bold">
                        <span>{t('Grand Total')}:</span>
                        <span className="font-mono">{window.appSettings.formatCurrency(calculateGrandTotal())}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg mb-2">{t('No items added yet')}</p>
                {!isReadOnly && <p className="text-sm">{t('Click "Add Item" to start building your quotation')}</p>}
                {errors.items && <p className="text-sm text-red-500 mt-2">{errors.items}</p>}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Additional Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-600" />
              {t('Additional Information')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>{t('Notes')}</Label>
                {isReadOnly ? (
                  <div className="p-3 bg-gray-50 rounded-md min-h-[100px]">
                    {formData.notes || t('No notes provided')}
                  </div>
                ) : (
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder={t('Add any additional notes...')}
                    rows={4}
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label>{t('Terms & Conditions')}</Label>
                {isReadOnly ? (
                  <div className="p-3 bg-gray-50 rounded-md min-h-[100px]">
                    {formData.terms_conditions || t('No terms and conditions provided')}
                  </div>
                ) : (
                  <Textarea
                    value={formData.terms_conditions}
                    onChange={(e) => setFormData(prev => ({ ...prev, terms_conditions: e.target.value }))}
                    placeholder={t('Enter terms and conditions...')}
                    rows={4}
                  />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        {!isReadOnly && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row justify-end gap-3 sm:space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.visit(route('quotations.index'))}
                  className="w-full sm:w-auto"
                >
                  {t('Cancel')}
                </Button>
                <Button type="submit" className="flex items-center gap-2 w-full sm:w-auto justify-center">
                  {t('Save')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </form>
    </div>
  </PageTemplate>
  );
}
