import { useState, useEffect, useRef } from 'react';
import { PageTemplate } from '@/components/page-template';
import { usePage, router } from '@inertiajs/react';
import { Plus, Download, CheckCircle, XCircle, List, DollarSign, CalendarDays, FileText } from 'lucide-react';
import { hasPermission } from '@/utils/authorization';
import { CrudTable } from '@/components/CrudTable';
import { CrudFormModal } from '@/components/CrudFormModal';
import { CrudDeleteModal } from '@/components/CrudDeleteModal';

import { toast } from '@/components/custom-toast';
import { useTranslation } from 'react-i18next';
import { Pagination } from '@/components/ui/pagination';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';

export default function Purchases() {
  const { t } = useTranslation();
  const { auth, purchases, vendors, products, statusCounts, filters: pageFilters = {} } = usePage().props as any;
  const permissions = auth?.permissions || [];
  const getInitials = useInitials();


  const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
  const [filterValues, setFilterValues] = useState<Record<string, any>>({
    vendor_id: pageFilters.vendor_id || 'all',
    purchase_date_from: pageFilters.purchase_date_from || '',
    purchase_date_to: pageFilters.purchase_date_to || ''
  });
  const [sortField, setSortField] = useState(pageFilters.sort_field || '');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(pageFilters.sort_direction || 'desc');
  const [activeStatusTab, setActiveStatusTab] = useState(pageFilters.status || 'all');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');

  const hasActiveFilters = () => {
    return Object.values(filterValues).some(value => {
      return value && value !== '' && value !== 'all';
    }) || searchTerm !== ''|| activeStatusTab !== 'all';
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilterValues(prev => ({ ...prev, [key]: value }));
  };

  const handleStatusTabChange = (status: string) => {
    setActiveStatusTab(status);
    const params: any = { page: 1, status: status === 'all' ? undefined : status };
    if (searchTerm) params.search = searchTerm;
    if (filterValues.vendor_id && filterValues.vendor_id !== 'all') params.vendor_id = filterValues.vendor_id;
    if (filterValues.purchase_date_from) params.purchase_date_from = filterValues.purchase_date_from;
    if (filterValues.purchase_date_to) params.purchase_date_to = filterValues.purchase_date_to;
    if (pageFilters.per_page) params.per_page = pageFilters.per_page;
    if (sortField) { params.sort_field = sortField; params.sort_direction = sortDirection; }
    router.get(route('purchases.index'), params, { preserveState: true, preserveScroll: true });
  };

  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
    } else {
      applyFilters();
    }
  }, [filterValues]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters();
  };

  const applyFilters = () => {
    const params: any = { page: 1 };
    if (searchTerm) params.search = searchTerm;
    if (activeStatusTab && activeStatusTab !== 'all') params.status = activeStatusTab;
    if (filterValues.vendor_id && filterValues.vendor_id !== 'all') params.vendor_id = filterValues.vendor_id;
    if (filterValues.purchase_date_from) params.purchase_date_from = filterValues.purchase_date_from;
    if (filterValues.purchase_date_to) params.purchase_date_to = filterValues.purchase_date_to;
    if (pageFilters.per_page) params.per_page = pageFilters.per_page;
    if (sortField) {
      params.sort_field = sortField;
      params.sort_direction = sortDirection;
    }
    router.get(route('purchases.index'), params, { preserveState: true, preserveScroll: true });
  };

  const handleSort = (field: string) => {
    const newDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(newDirection);
    
    const params: any = { sort_field: field, sort_direction: newDirection, page: 1 };
    if (searchTerm) params.search = searchTerm;
    if (activeStatusTab && activeStatusTab !== 'all') params.status = activeStatusTab;
    if (filterValues.vendor_id && filterValues.vendor_id !== 'all') params.vendor_id = filterValues.vendor_id;
    if (filterValues.purchase_date_from) params.purchase_date_from = filterValues.purchase_date_from;
    if (filterValues.purchase_date_to) params.purchase_date_to = filterValues.purchase_date_to;
    if (pageFilters.per_page) params.per_page = pageFilters.per_page;
    Object.entries(filterValues).forEach(([key, value]) => {
      if (value && value !== '' && value !== 'all') {
        params[key] = value;
      }
    });
    router.get(route('purchases.index'), params, { preserveState: true, preserveScroll: true });
  };

  const handleAction = (action: string, item: any) => {
    setCurrentItem(item);
    switch (action) {
      case 'view':
        router.visit(route('purchases.show', item.id));
        break;
      case 'edit':
        router.visit(route('purchases.edit', item.id));
        break;
      case 'delete':
        setIsDeleteModalOpen(true);
        break;
      case 'toggle-status':
        handleToggleStatus(item);
        break;

    }
  };

  const handleAddNew = () => {
    router.visit(route('purchases.create'));
  };

  const handleFormSubmit = (formData: any) => {
    // Transform multiple products to items format
    if (formData.product_ids) {
      const selectedProductIds = Array.isArray(formData.product_ids) ? formData.product_ids : [formData.product_ids];
      const quantities = formData.quantities || {};

      formData.items = selectedProductIds.map((productId: string) => {
        const product = products?.find((p: any) => p.id == productId);
        const unitPrice = product?.purchase_price || 0;
        const quantity = quantities[productId] || 1;

        return {
          product_id: parseInt(productId),
          quantity: quantity,
          unit_price: unitPrice,
          total_price: unitPrice * quantity
        };
      });

      delete formData.product_ids;
      delete formData.quantities;
    }

    // Set discount amount to 0
    formData.discount_amount = 0;

    if (formMode === 'edit') {
      toast.loading(t('Updating purchase...'));
      router.put(route('purchases.update', currentItem.id), formData, {
        onSuccess: (page) => {
          toast.dismiss();
          setIsFormModalOpen(false);
          if (page.props.flash?.success) {
            toast.success(page.props.flash.success);
          }
          router.reload();
        },
        onError: (errors) => {
          toast.dismiss();
          if (typeof errors === 'string') {
            toast.error(errors);
          } else if (errors.message) {
            toast.error(errors.message);
          } else {
            toast.error(t('Network error occurred'));
          }
        }
      });
    }

  };

  const handleDeleteConfirm = () => {
    toast.loading(t('Deleting purchase...'));
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
    fetch(route("purchases.destroy", currentItem.id), {
      method: 'DELETE',
      headers: {
        'X-CSRF-TOKEN': csrfToken,
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    })
      .then(async response => {
        toast.dismiss();
        setIsDeleteModalOpen(false);
        const data = await response.json();
        if (response.ok) {
          toast.success(data.message || t('Purchase deleted successfully'));
          router.reload();
        } else {
          if (data.demo_mode && data.error) {
            toast.error(t(data.error));
          } else {
            toast.error(data.message || t('Failed to delete purchase'));
          }
        }
      })
      .catch(error => {
        toast.dismiss();
        setIsDeleteModalOpen(false);
        toast.error(error.message || t('Failed to delete purchase'));
      });
  };



  const handleToggleStatus = (purchase: any) => {
    const newStatus = purchase.status === 'active' ? 'inactive' : 'active';
    toast.loading(`${newStatus === 'active' ? t('Activating') : t('Deactivating')} ${t('purchase')}...`);
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
    fetch(route('purchases.toggle-status', purchase.id), {
      method: 'PUT',
      headers: {
        'X-CSRF-TOKEN': csrfToken,
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify({})
    })
      .then(async response => {
        toast.dismiss();
        const data = await response.json();
        if (response.ok) {
          toast.success(data.message || `${t('Purchase')} ${newStatus === 'active' ? t('activated') : t('deactivated')} ${t('successfully')}`);
          router.reload();
        } else {
          if (data.demo_mode && data.error) {
            toast.error(t(data.error));
          } else {
            toast.error(data.message || t('Failed to update purchase status'));
          }
        }
      })
      .catch(error => {
        toast.dismiss();
        toast.error(error.message || t('Failed to update purchase status'));
      });
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    isInitialMount.current = true;
    setFilterValues({
      vendor_id: 'all',
      purchase_date_from: '',
      purchase_date_to: ''
    });
    setActiveStatusTab('all');
    setSortField('');
    setSortDirection('desc');
    
    router.get(route('purchases.index'), {}, { preserveState: true, preserveScroll: true });
  };

  const handleExport = async () => {
    if (hasPermission(permissions, 'export-purchases')) {
      try {
        const params = new URLSearchParams();
        if (searchTerm) params.append('search', searchTerm);
        if (filterValues.vendor_id && filterValues.vendor_id !== 'all') params.append('vendor_id', filterValues.vendor_id);
        if (filterValues.status && filterValues.status !== 'all') params.append('status', filterValues.status);
        if (filterValues.purchase_date_from) params.append('purchase_date_from', filterValues.purchase_date_from);
        if (filterValues.purchase_date_to) params.append('purchase_date_to', filterValues.purchase_date_to);
        if (sortField) {
          params.append('sort_field', sortField);
          params.append('sort_direction', sortDirection);
        }
        
        const url = route('purchases.export') + (params.toString() ? '?' + params.toString() : '');
        const response = await fetch(url);
        if (!response.ok) throw new Error('Export failed');
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `purchases_export_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(downloadUrl);
        document.body.removeChild(a);
        toast.success(t('Export completed successfully'));
      } catch (error) {
        toast.error(t('Export failed'));
      }
    }
  };

  const statusTabs = [
    { key: 'all', label: t('All Purchases'), count: statusCounts?.total ?? (purchases?.total || 0), icon: FileText },
    { key: 'active', label: t('Active'), count: statusCounts?.active || 0, icon: CheckCircle },
    { key: 'inactive', label: t('Inactive'), count: statusCounts?.inactive || 0, icon: XCircle }
  ];

  const filterOptions = [
    {
      name: 'vendor_id',
      label: t('Vendor'),
      type: 'select',
      value: filterValues.vendor_id,
      onChange: (value: any) => handleFilterChange('vendor_id', value),
      options: [
        { value: 'all', label: t('All Vendors') },
        ...(vendors?.map((vendor: any) => ({
          value: vendor.id.toString(),
          label: vendor.name
        })) || [])
      ]
    },
    {
      name: 'purchase_date_from',
      label: t('Date From'),
      type: 'date',
      value: filterValues.purchase_date_from,
      onChange: (value: any) => handleFilterChange('purchase_date_from', value)
    },
    {
      name: 'purchase_date_to', 
      label: t('Date To'),
      type: 'date',
      value: filterValues.purchase_date_to,
      onChange: (value: any) => handleFilterChange('purchase_date_to', value)
    }
  ];

  const pageActions = [];
  if (hasPermission(permissions, 'export-purchases')) {
    pageActions.push({
      label: t('Export'),
      icon: <Download className="h-4 w-4" />,
      variant: 'outline',
      onClick: handleExport
    });
  }
  if (hasPermission(permissions, 'create-purchases')) {
    pageActions.push({
      label: t('Add Purchase'),
      icon: <Plus className="h-4 w-4" />,
      variant: 'default',
      onClick: () => handleAddNew()
    });
  }


  const summaryStats = {
      totalPurchases:       purchases?.stats?.total_purchases ?? (purchases?.total || 0),
      activePurchases:      purchases?.stats?.active_purchases || 0,
      inactivePurchases:    purchases?.stats?.inactive_purchases || 0,
      totalPurchaseAmount:  purchases?.stats?.total_purchase_amount || 0,
      thisMonthCount:       purchases?.stats?.this_month_count || 0,
      thisMonthAmount:      purchases?.stats?.this_month_amount || 0,
  };

  const breadcrumbs = [
    { title: t('Dashboard'), href: route('dashboard') },
    { title: t('Purchase Management'), href: route('purchases.index') },
    { title: t('Purchases') }
  ];

  const columns = [
    {
      key: 'purchase_number',
      label: t('Purchase Number'),
      sortable: true,
      render: (value: string, row: any) => (
        <button
          onClick={() => handleAction('view', row)}
          className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20 whitespace-nowrap"
        >
          {value}
        </button>
      )
    },
    { key: 'vendor', label: t('Vendor'), render: (value: any) => (
            <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback>{getInitials(value?.name)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{value?.name || '-'}</div>
              <div className="text-xs text-gray-500">{value?.email || ''}</div>
            </div>
          </div>
    )},
    {
      key: 'items',
      label: t('Items'),
      render: (value: any, row: any) => {
        const items = row.items;
        if (!items?.length) return '-';
        const visible = items.slice(0, 2);
        const remaining = items.length - 2;
        return (
          <div className="w-[200px]">
            {visible.map((item: any, index: number) => (
              <div key={index} className="flex items-center">
                <span className="text-sm text-gray-900 dark:text-white truncate w-[120px]">{item.product?.name}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap w-[40px] text-right">x {item.quantity}</span>
              </div>
            ))}
            {remaining > 0 && (
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">+{remaining} {t('more items')}</span>
            )}
          </div>
        );
      }
    },

    { key: 'total_amount', label: t('Total Amount'), sortable: true, render: (value: number) => <span className="font-mono">{window.appSettings.formatCurrency(value || 0)}</span> },
    { key: 'purchase_date', label: t('Purchase Date'), sortable: true, type: 'date'
      // render: (value: string) => window.appSettings?.formatDateTime(value, false) || new Date(value).toLocaleDateString() 
    },
    {
      key: 'status',
      label: t('Status'),
      render: (value: string) => (
        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${value === 'active' ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20' :
            'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20'
          }`}>
          {value === 'active' ? t('Active') : t('Inactive')}
        </span>
      )
    }
  ];

  const actions = [
    { label: t('Toggle Status'), icon: (item: any) => item.status === 'active' ? 'Lock' : 'Unlock', action: 'toggle-status', className: 'text-amber-500', requiredPermission: 'manage-purchase-status' },
    { label: t('View'), icon: 'Eye', action: 'view', className: 'text-blue-500', requiredPermission: 'view-purchases' },
    { label: t('Edit'), icon: 'Edit', action: 'edit', className: 'text-amber-500', requiredPermission: 'edit-purchases' },
    { label: t('Delete'), icon: 'Trash2', action: 'delete', className: 'text-red-500', requiredPermission: 'delete-purchases' }
  ];

  return (
    <PageTemplate title={t("Purchase Management")} url="/purchases" actions={pageActions} breadcrumbs={breadcrumbs} noPadding description={t('Manage your purchase orders and vendor transactions.')}>
      <style>{`
            main {
              max-width: 100vw;
              overflow-x: hidden !important;
            }
            body {
              overflow-x: hidden !important;
            }
        `}</style>
      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <div className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-50 dark:bg-blue-700/20 rounded-bl-full"></div>
          <div className="p-4 relative">
            <div className="flex items-start justify-between mb-3">
              <div className="text-left">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 capitalize tracking-wide mb-1">{t('Total Purchases')}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{summaryStats.totalPurchases}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('All time purchases')}</p>
              </div>
              <div className="relative z-10 p-2.5 bg-blue-50 dark:bg-blue-700/20 rounded-xl mt-0.5">
                <List className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-green-50 dark:bg-green-700/20 rounded-bl-full"></div>
          <div className="p-4 relative">
            <div className="flex items-start justify-between mb-3">
              <div className="text-left">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 capitalize tracking-wide mb-1">{t('Active Purchases')}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{summaryStats.activePurchases}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {summaryStats.totalPurchases > 0
                    ? `${((summaryStats.activePurchases / summaryStats.totalPurchases) * 100).toFixed(1)}% ${t('of total')}`
                    : '0% of total'
                  }
                </p>
              </div>
              <div className="relative z-10 p-2.5 bg-green-50 dark:bg-green-700/20 rounded-xl mt-0.5">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-red-50 dark:bg-red-700/20 rounded-bl-full"></div>
          <div className="p-4 relative">
            <div className="flex items-start justify-between mb-3">
              <div className="text-left">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 capitalize tracking-wide mb-1">{t('Inactive Purchases')}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{summaryStats.inactivePurchases}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {summaryStats.totalPurchases > 0
                    ? `${((summaryStats.inactivePurchases / summaryStats.totalPurchases) * 100).toFixed(1)}% ${t('of total')}`
                    : '0% of total'
                  }
                </p>
              </div>
              <div className="relative z-10 p-2.5 bg-red-50 dark:bg-red-700/20 rounded-xl mt-0.5">
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-50 dark:bg-purple-700/20 rounded-bl-full"></div>
          <div className="p-4 relative">
            <div className="flex items-start justify-between mb-3">
              <div className="text-left">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 capitalize tracking-wide mb-1">{t('Total Purchase Amount')}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {window.appSettings?.formatCurrency
                    ? <span className="font-mono">{window.appSettings.formatCurrency(summaryStats.totalPurchaseAmount)}</span>
                    : `$${summaryStats.totalPurchaseAmount.toFixed(2)}`
                  }
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('All time amount')}</p>
              </div>
              <div className="relative z-10 p-2.5 bg-purple-50 dark:bg-purple-700/20 rounded-xl mt-0.5">
                <DollarSign className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-50 dark:bg-amber-700/20 rounded-bl-full"></div>
          <div className="p-4 relative">
            <div className="flex items-start justify-between mb-3">
              <div className="text-left">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 capitalize tracking-wide mb-1">{t('This Month')}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{summaryStats.thisMonthCount}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {window.appSettings?.formatCurrency
                    ? <span className="font-mono">{window.appSettings.formatCurrency(summaryStats.thisMonthAmount)}</span>
                    : <span className="font-mono">{`$${summaryStats.thisMonthAmount.toFixed(2)}`}</span>
                  }
                </p>
              </div>
              <div className="relative z-10 p-2.5 bg-amber-50 dark:bg-amber-700/20 rounded-xl mt-0.5">
                <CalendarDays className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg shadow mb-4 border">
        <SearchAndFilterBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onSearch={handleSearch}
          filters={filterOptions}
          hasActiveFilters={hasActiveFilters}
          activeFilterCount={() => {
            return Object.values(filterValues).filter(v => v && v !== '' && v !== 'all').length + (searchTerm ? 1 : 0) + (activeStatusTab !== 'all' ? 1 : 0);
          }}
          onResetFilters={handleResetFilters}
        />
        {/* Horizontal Separator */}
        <div className="border-t border-gray-200 dark:border-gray-700 mb-1"></div>

        {/* Status Tabs */}
        <div className="bg-white dark:bg-gray-900 ml-2 mr-2">
          <div className="flex space-x-0 overflow-x-auto">
            {statusTabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <div key={tab.key} className="relative">
                  <button
                    onClick={() => handleStatusTabChange(tab.key)}
                    className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                      activeStatusTab === tab.key
                        ? 'text-primary'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <IconComponent className="h-4 w-4" />
                    <span>{tab.label}</span>
                    <span className={`inline-flex items-center justify-center px-2 py-1 text-xs font-bold rounded-full ${
                      activeStatusTab === tab.key
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                  {activeStatusTab === tab.key && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 bg-primary rounded-full transition-all duration-200"
                      style={{ width: 'calc(100% - 2rem)' }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden">
        <CrudTable
          columns={columns}
          actions={actions}
          data={purchases?.data || []}
          from={purchases?.from || 1}
          onAction={handleAction}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
          permissions={permissions}
          entityPermissions={{
            view: 'view-purchases',
            create: 'create-purchases',
            edit: 'edit-purchases',
            delete: 'delete-purchases'
          }}
        />

        <Pagination
          from={purchases?.from || 0}
          to={purchases?.to || 0}
          total={purchases?.total || 0}
          links={purchases?.links || []}
          entityName={t("purchases")}
          onPageChange={(url) => {
            if (url) {
              const urlObj = new URL(url, window.location.origin);
              if (pageFilters.per_page) urlObj.searchParams.set('per_page', pageFilters.per_page.toString());
              if (searchTerm) urlObj.searchParams.set('search', searchTerm);
              if (activeStatusTab && activeStatusTab !== 'all') urlObj.searchParams.set('status', activeStatusTab);
              if (filterValues.vendor_id && filterValues.vendor_id !== 'all') urlObj.searchParams.set('vendor_id', filterValues.vendor_id);
              if (filterValues.purchase_date_from) urlObj.searchParams.set('purchase_date_from', filterValues.purchase_date_from);
              if (filterValues.purchase_date_to) urlObj.searchParams.set('purchase_date_to', filterValues.purchase_date_to);
              if (sortField) {
                urlObj.searchParams.set('sort_field', sortField);
                urlObj.searchParams.set('sort_direction', sortDirection);
              }
              Object.entries(filterValues).forEach(([key, val]) => {
                if (val && val !== '' && val !== 'all') urlObj.searchParams.set(key, val);
              });
              router.get(urlObj.toString(), {}, { preserveState: true, preserveScroll: true });
            }
          }}
          currentPerPage={pageFilters.per_page?.toString() || "10"}
          onPerPageChange={(value) => {
            const params: any = { page: 1, per_page: parseInt(value) };
            if (searchTerm) params.search = searchTerm;
            if (activeStatusTab && activeStatusTab !== 'all') params.status = activeStatusTab;
            if (filterValues.vendor_id && filterValues.vendor_id !== 'all') params.vendor_id = filterValues.vendor_id;
            if (filterValues.purchase_date_from) params.purchase_date_from = filterValues.purchase_date_from;
            if (filterValues.purchase_date_to) params.purchase_date_to = filterValues.purchase_date_to;
            Object.entries(filterValues).forEach(([key, val]) => {
              if (val && val !== '' && val !== 'all') params[key] = val;
            });
            if (sortField) {
              params.sort_field = sortField;
              params.sort_direction = sortDirection;
            }
            router.get(route('purchases.index'), params, { preserveState: true, preserveScroll: true });
          }}
        />
      </div>

      <CrudFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleFormSubmit}
        formConfig={{
          fields: [
            { name: 'vendor_id', label: t('Vendor'), type: 'select', required: true,searchable: true, options: vendors?.map((vendor: any) => ({ value: vendor.id, label: vendor.name })) || [] },
            { name: 'purchase_date', label: t('Purchase Date'), type: 'date', required: true },
            { name: 'product_ids', label: t('Products'), type: 'multi-select', required: true,searchable: true, options: products?.map((product: any) => ({ value: product.id.toString(), label: `${product.name} - ${window.appSettings.formatCurrency(product.purchase_price)}` })) || [] },
            {
              name: 'quantities',
              label: t('Quantities'),
              type: 'custom',
              render: (field: any, formData: any, handleChange: any, mode: string) => {
                const selectedProducts = formData.product_ids || [];
                const quantities = formData.quantities || {};

                if (selectedProducts.length === 0) {
                  return <div className="text-gray-500 text-sm">{t('Select products first to set quantities')}</div>;
                }

                return (
                  <div className="space-y-3">
                    {selectedProducts.map((productId: string) => {
                      const product = products?.find((p: any) => p.id == productId);
                      if (!product) return null;

                      return (
                        <div key={productId} className="flex items-center gap-3 p-3 border rounded">
                          <div className="flex-1">
                            <span className="font-medium">{product.name}</span>
                            <span className="text-sm text-gray-500 font-mono ml-2">{window.appSettings.formatCurrency(product.purchase_price)}</span>
                          </div>
                          <div className="w-24">
                            {mode === 'view' ? (
                              <div className="px-2 py-1 bg-gray-50 border rounded text-center">
                                {quantities[productId] || 1}
                              </div>
                            ) : (
                              <input
                                type="number"
                                min="1"
                                value={quantities[productId] || 1}
                                onChange={(e) => {
                                  const newQuantities = { ...quantities, [productId]: parseInt(e.target.value) || 1 };
                                  handleChange('quantities', newQuantities);
                                }}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-center"
                                placeholder="Qty"
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              }
            },
            { name: 'notes', label: t('Notes'), type: 'textarea', placeholder: 'Enter note' }
          ],
          modalSize: 'xl'
        }}
        initialData={currentItem ? {
          ...currentItem,
          product_ids: currentItem.items?.map((item: any) => item.product_id.toString()) || [],
          purchase_date: currentItem.purchase_date
            ? (formMode === 'view'
                ? window.appSettings?.formatDateTime(currentItem.purchase_date, false)
                : (typeof currentItem.purchase_date === 'string' && currentItem.purchase_date.includes('T')
                    ? currentItem.purchase_date.split('T')[0]
                    : currentItem.purchase_date))
            : '',
          quantities: currentItem.items?.reduce((acc: any, item: any) => {
            acc[item.product_id.toString()] = item.quantity;
            return acc;
          }, {}) || {}
        } : null}
        title={formMode === 'create' ? t('Add New Purchase') : formMode === 'edit' ? t('Edit Purchase') : t('View Purchase')}
        mode={formMode}
      />

      <CrudDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        itemName={currentItem?.purchase_number || ''}
        entityName="purchase"
      />
    </PageTemplate>
  );
}
