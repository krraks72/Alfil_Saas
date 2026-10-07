// config/crud/currencies.ts
import { CrudConfig } from '@/types/crud';
import { t } from '@/utils/i18n';
import React from 'react';

export const currenciesConfig: CrudConfig = {
  entity: {
    name: 'currency ',
    endpoint: route('currencies.index'),
    permissions: {
      view: 'manage-currencies',
      create: 'manage-currencies',
      edit: 'manage-currencies',
      delete: 'manage-currencies'
    }
  },
  table: {
    columns: [
      { 
        key: 'name', 
        label: t('Name'), 
        sortable: true 
      },
      { 
        key: 'code', 
        label: t('Code'), 
        sortable: true 
      },
      { 
        key: 'symbol', 
        label: t('Symbol'), 
        sortable: true 
      },
      { 
        key: 'description', 
        label: t('Description') 
      },
      { 
        key: 'is_default', 
        label: t('Default'), 
        render: (value: boolean) => value
          ? React.createElement('span', { className: 'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset bg-green-50 text-green-700 ring-green-600/20' }, t('Yes'))
          : React.createElement('span', { className: 'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset bg-red-50 text-red-700 ring-red-600/20' }, t('No'))
      }
    ],
    actions: [
      {
        label: t('View'),
        icon: 'Eye',
        action: 'view',
        className: 'text-blue-500',
        requiredPermission: 'manage-currencies'
      },
      { 
        label: t('Edit'), 
        icon: 'Edit', 
        action: 'edit', 
        className: 'text-amber-500',
        requiredPermission: 'manage-currencies'
      },
      { 
        label: t('Delete'), 
        icon: 'Trash2', 
        action: 'delete', 
        className: 'text-red-500',
        requiredPermission: 'manage-currencies',
        condition: (row) => !row.is_default // Don't allow deleting default currency
      }
    ]
  },
  filters: [],
  form: {
    fields: [
      { 
        name: 'name', 
        label: t('Currency Name'), 
        type: 'text', 
        required: true,
        placeholder: 'e.g. US Dollar, Euro, British Pound' 
      },
      { 
        name: 'code', 
        label: t('Currency Code'), 
        type: 'text', 
        required: true,
        placeholder: 'e.g. USD, EUR, GBP'
      },
      { 
        name: 'symbol', 
        label: t('Currency Symbol'), 
        type: 'text', 
        required: true,
        placeholder: 'e.g. $, €, £'
      },
      { 
        name: 'description', 
        label: t('Description'), 
        type: 'textarea',
        placeholder: 'Enter currency description...'
      },
      { 
        name: 'is_default', 
        label: t('Set as Default Currency'), 
        type: 'checkbox' 
      }
    ]
  }
};