// config/crud/coupons.ts
import React from 'react';
import { CrudConfig } from '@/types/crud';
import { columnRenderers } from '@/utils/columnRenderers';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/custom-toast';
import { t } from '@/utils/i18n';

// Global state for tracking copied code
let copiedCodeId: string | null = null;
const copiedListeners: Set<() => void> = new Set();

const notifyCopiedChange = () => {
  copiedListeners.forEach(listener => listener());
};

// CodeCopyCell component for copy functionality
const CodeCopyCell = ({ value, rowId }: { value: string; rowId?: string }) => {
  const [, setTrigger] = React.useState(0);
  const codeId = rowId || value;
  const isCopied = copiedCodeId === codeId;

  React.useEffect(() => {
    const listener = () => setTrigger(prev => prev + 1);
    copiedListeners.add(listener);
    return () => copiedListeners.delete(listener);
  }, []);

  const handleCopy = () => {
    const markCopied = () => {
      copiedCodeId = codeId;
      notifyCopiedChange();
      setTimeout(() => {
        copiedCodeId = null;
        notifyCopiedChange();
      }, 2000);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(value).then(markCopied).catch(() => fallbackCopy());
    } else {
      fallbackCopy();
    }

    function fallbackCopy() {
      const textarea = document.createElement('textarea');
      textarea.value = value;
      textarea.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      try {
        document.execCommand('copy');
        markCopied();
      } catch (_) {}
      document.body.removeChild(textarea);
    }
  };

  return React.createElement('div', { className: 'relative inline-block' }, [
    React.createElement('button', {
      key: 'code-span',
      className: 'px-3 py-1.5 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors font-mono text-sm cursor-pointer',
      onClick: handleCopy
    }, value),
    isCopied && React.createElement('span', {
      key: 'copied-msg',
      className: 'text-xs text-red-600 dark:text-red-400 mt-1 font-medium ml-3 block'
    }, 'Copied!')
  ]);
};

// Separate component for status toggle to properly handle hooks
const StatusToggle = ({ initialValue, rowId }: { initialValue: boolean, rowId: number }) => {
  const [isChecked, setIsChecked] = React.useState(initialValue);

  const handleToggle = async () => {
    try {
      // Get CSRF token from multiple possible sources
      let csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

      if (!csrfToken) {
        csrfToken = (window as any).Laravel?.csrfToken;
      }

      if (!csrfToken) {
        const tokenInput = document.querySelector('input[name="_token"]') as HTMLInputElement;
        csrfToken = tokenInput?.value;
      }

      if (!csrfToken) {
        toast.error('CSRF token not found. Please refresh the page.');
        return;
      }

      // Build URL with proper fallback
      let url;
      try {
        url = route('coupons.toggle-status', rowId);
      } catch (error) {
        const baseUrl = (window as any).baseUrl || window.location.origin;
        url = `${baseUrl}/coupons/${rowId}/toggle-status`;
      }

      if (!url) {
        const baseUrl = (window as any).baseUrl || window.location.origin;
        url = `${baseUrl}/coupons/${rowId}/toggle-status`;
      }

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': csrfToken,
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json'
        },
        credentials: 'same-origin'
      });

      if (response.ok) {
        const data = await response.json();
        setIsChecked(!isChecked);
        toast.success(data.message || t('Status updated successfully'));
      } else {
        
        const errorData = await response.json();
        toast.error(errorData.error || t('Failed to update status'));
      }
    } catch (error) {
      toast.error(t('An error occurred while updating status'));
    }
  };

  return React.createElement('div', { className: 'flex items-center justify-center' }, [
    React.createElement(Switch, {
      key: 'status-switch',
      checked: isChecked,
      onCheckedChange: handleToggle
    })
  ]);
};

export const couponsConfig: CrudConfig = {
  entity: {
    name: 'coupons',
    endpoint: route('coupons.index'),
    permissions: {
      view: 'view-coupons',
      create: 'create-coupons',
      edit: 'create-coupons',
      delete: 'delete-coupons'
    }
  },
  modalSize: '4xl',
  table: {
    columns: [
      { key: 'name', label: t('Name'), sortable: true },
      {
        key: 'code', label: t('Code'), sortable: true,
        render: (value, row) => React.createElement(CodeCopyCell, { value, rowId: `code-${row.id}` })
      },
      {
        key: 'type',
        label: t('Type'),
        sortable: true,
        render: (value) => {
          const className = value === 'percentage'
            ? 'bg-blue-100 text-blue-800'
            : 'bg-green-100 text-green-800';
          return value === 'percentage' ? t('Percentage') : t('Flat Amount');
        }
      },
      {
        key: 'minimum_spend',
        label: t('Min Spend'),
        render: (value) => value && value !== 'null' && value !== null ? React.createElement('span', { className: 'font-mono' }, window.appSettings?.formatCurrency(value) || `$${parseFloat(value).toFixed(2)}`) : '-'
      },
      {
        key: 'maximum_spend',
        label: t('Max Spend'),
        render: (value) => value && value !== 'null' && value !== null ? React.createElement('span', { className: 'font-mono' }, window.appSettings?.formatCurrency(value) || `$${parseFloat(value).toFixed(2)}`) : '-'
      },
      {
        key: 'discount_amount',
        label: t('Discount'),
        render: (value, row) => {
          const amount = parseFloat(value);
          return row.type === 'percentage'
            ? `${amount}%`
            : React.createElement('span', { className: 'font-mono' }, window.appSettings?.formatCurrency(amount) || `$${amount.toFixed(2)}`);
        }
      },
      { key: 'use_limit_per_coupon', label: t('Coupon Limit'), render: (value) => value && value !== 'null' && value !== null ? value : '-' },
      { key: 'use_limit_per_user', label: t('User Limit'), render: (value) => value && value !== 'null' && value !== null ? value : '-' },
      {
        key: 'expiry_date',
        label: t('Expiry Date'),
        sortable: true,
        type: 'date',
        // render: (value) => value && value !== 'null' && value !== null ? window.appSettings?.formatDateTime(value, false) || new Date(value).toLocaleDateString() : '-'
      },
      {
        key: 'status',
        label: t('Status'),
        render: (value, row) => {
          // Use a component to properly handle hooks
          return React.createElement(StatusToggle, { initialValue: !!value, rowId: row.id });
        }
      }
    ],
    actions: [
      {
        label: t('View Details'),
        icon: 'Eye',
        action: 'view-details',
        href: (row: any) => route('coupons.show', row.id),
        className: 'text-blue-500'
      },
      {
        label: t('Edit'),
        icon: 'Edit',
        action: 'edit',
        className: 'text-amber-500'
      },
      {
        label: t('Delete'),
        icon: 'Trash2',
        action: 'delete',
        className: 'text-red-500'
      }
    ]
  },
  search: {
    enabled: true,
    placeholder: t('Search coupons...'),
    fields: ['name', 'code']
  },
  filters: [
    {
      key: 'type',
      label: t('Type'),
      type: 'select',
      options: [
        { value: 'all', label: t('All Types') },
        { value: 'percentage', label: t('Percentage') },
        { value: 'flat', label: t('Flat Amount') }
      ]
    },
    {
      key: 'status',
      label: t('Status'),
      type: 'select',
      options: [
        { value: 'all', label: t('All Status') },
        { value: '1', label: t('Active') },
        { value: '0', label: t('Inactive') }
      ]
    }
  ],
  form: {
    layout: 'grid',
    columns: 12,
    fields: [
      {
        name: 'name',
        label: t('Coupon Name'),
        type: 'text',
        required: true,
        colSpan: 6,
        placeholder: t('Enter coupon name')
      },
      {
        name: 'type',
        label: t('Discount Type'),
        type: 'select',
        required: true,
        colSpan: 6,
        options: [
          { value: 'percentage', label: t('Percentage (%)') },
          { value: 'flat', label: t('Fixed Amount ($)') }
        ]
      },
      {
        name: 'discount_amount',
        label: t('Discount Value'),
        type: 'number',
        required: true,
        colSpan: 6,
        min: 0,
        max: 99,
        step: 0.01,
        placeholder: t('Enter value')
      },
      {
        name: 'use_limit_per_coupon',
        label: t('Total Usage Limit'),
        type: 'number',
        colSpan: 6,
        min: 1,
        placeholder: t('Leave empty for unlimited')
      },
      {
        name: 'code_type',
        label: t('Code Generation'),
        type: 'radio',
        required: true,
        colSpan: 6,
        options: [
          { value: 'manual', label: t('Manual Entry') },
          { value: 'auto', label: t('Auto Generate') }
        ],
        defaultValue: 'manual'
      },
      {
        name: 'code',
        label: t('Coupon Code'),
        type: 'custom',
        colSpan: 6,
        required: true,
        render: (field: any, formData: any, onChange: any, mode: any, errors?: any) => {
          const generateCode = () => {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            let result = '';
            for (let i = 0; i < 10; i++) {
              result += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            onChange('code', result);
          };

          const isAuto = formData.code_type === 'auto';
          const isRequired = formData.code_type === 'manual';
          const hasError = errors && errors['code'];
          const inputClass = `border-input file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-primary aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive ${hasError ? ' border-red-500' : ''}`;

          return React.createElement('div', { className: 'space-y-2' }, [
            React.createElement('div', {
              className: isAuto ? 'flex flex-col sm:flex-row gap-2' : '',
              key: 'input-group'
            }, isAuto ? [
              React.createElement('input', {
                key: 'code-input',
                type: 'text',
                value: formData.code || '',
                onChange: (e: any) => onChange('code', e.target.value.toUpperCase()),
                placeholder: t('Click generate to create code'),
                className: `${inputClass}`
              }),
              React.createElement('button', {
                key: 'generate-btn',
                type: 'button',
                onClick: generateCode,
                className: 'px-4 py-2 sm:py-1 bg-primary text-primary-foreground rounded-md hover:bg-primary/90'
              }, t('Generate'))
            ] : [
              React.createElement('input', {
                key: 'code-input-manual',
                type: 'text',
                value: formData.code || '',
                onChange: (e: any) => onChange('code', e.target.value.toUpperCase()),
                placeholder: t('Enter coupon code'),
                className: `w-full ${inputClass}`
              })
            ])
          ]);
        }
      },
      {
        name: 'minimum_spend',
        label: t('Minimum Spend'),
        type: 'number',
        colSpan: 6,
        min: 0,
        step: 0.01,
        placeholder: t('Optional')
      },
      {
        name: 'maximum_spend',
        label: t('Maximum Spend'),
        type: 'number',
        colSpan: 6,
        min: 0,
        step: 0.01,
        placeholder: t('Optional')
      },
      {
        name: 'use_limit_per_user',
        label: t('Usage Limit Per User'),
        type: 'number',
        colSpan: 6,
        min: 1,
        placeholder: t('Leave empty for unlimited')
      },
      {
        name: 'expiry_date',
        label: t('Expiry Date'),
        type: 'date',
        colSpan: 6
      },
      // {
      //   name: 'status',
      //   label: t('Status'),
      //   type: 'switch',
      //   colSpan: 6,
      //   defaultValue: true,
      //   placeholder: t('Status')
      // }
    ]
  }
};
