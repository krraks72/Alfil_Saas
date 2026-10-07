import { CrudConfig } from '@/types/crud';
import { columnRenderers } from '@/utils/columnRenderers';
import { t } from '@/utils/i18n';

export const planOrdersConfig: CrudConfig = {
  entity: {
    name: 'plan-orders',
    endpoint: route('plan-orders.index'),
    permissions: {
      view: 'view-plan-orders',
      create: 'create-plan-orders',
      edit: 'edit-plan-orders',
      delete: 'delete-plan-orders'
    }
  },
  modalSize: '4xl',
  description: t('Manage plan orders and subscription requests'),
  table: {
    columns: [
      { key: 'order_number', label: t('Order Number'), sortable: true, render: (value) => `${value}` },
      { key: 'user.name', label: t('Name'), sortable: false },
      { key: 'plan.name', label: t('Plan'), sortable: false },
      { 
        key: 'original_price', 
        label: t('Original Price'), 
        render: (value, row) => row.formatted_original_price || `$${parseFloat(value || 0).toFixed(2)}`
      },
      { 
        key: 'discount_amount', 
        label: t('Discount'), 
        render: (value, row) => value > 0 ? `${row.formatted_discount_amount || `$${parseFloat(value || 0).toFixed(2)}`}` : '-'
      },
      { 
        key: 'final_price', 
        label: t('Final Price'), 
        render: (value, row) => row.formatted_final_price || `$${parseFloat(value || 0).toFixed(2)}`
      },
      {
        key: 'status', 
        label: t('Status'), 
        render: columnRenderers.status({
          pending: 'bg-yellow-100 text-yellow-800',
          approved: 'bg-green-100 text-green-800', 
          rejected: 'bg-red-100 text-red-800'
        })
      },
      {
        key: 'receipt_url',
        label: t('Receipt'),
      },
      { 
        key: 'ordered_at', 
        label: t('Order Date'), 
        sortable: true, 
        type: 'date',
        // render: (value) => window.appSettings?.formatDateTime(value, false) || new Date(value).toLocaleDateString()
      },
    ],
    actions: [
      { 
        label: t('Approve'), 
        icon: 'Check', 
        action: 'approve', 
        className: 'text-green-600',
        condition: (row: any) => row.status === 'pending'
      },
      { 
        label: t('Reject'), 
        icon: 'X', 
        action: 'reject', 
        className: 'text-red-600',
        condition: (row: any) => row.status === 'pending'
      }
    ]
  },
  search: {
    enabled: true,
    placeholder: t('Search orders...'),
    fields: ['order_number', 'user.name', 'plan.name', 'coupon_code']
  },
  filters: [
    {
      key: 'status',
      label: t('Status'),
      type: 'select',
      options: [
        { value: 'all', label: t('All Status') },
        { value: 'pending', label: t('Pending') },
        { value: 'approved', label: t('Approved') },
        { value: 'rejected', label: t('Rejected') }
      ]
    }
  ],
  form: {
    fields: []
  }
};