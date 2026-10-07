// pages/customers/index.tsx
import { useState, useEffect, useRef } from 'react';
import { PageTemplate } from '@/components/page-template';
import { usePage, router } from '@inertiajs/react';
import { Plus, Eye, Edit, Trash2, Lock, Unlock, Download, Upload, Users, UserCheck, UserX, UserPlus, List } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { hasPermission } from '@/utils/authorization';
import { CrudTable } from '@/components/CrudTable';
import { CrudFormModal } from '@/components/CrudFormModal';
import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import { Dialog } from '@/components/ui/dialog';
import ViewPopup from './view';
import { toast } from '@/components/custom-toast';
import { useTranslation } from 'react-i18next';
import { Pagination } from '@/components/ui/pagination';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ImportModal } from '@/components/ImportModal';
import { Input } from '@/components/ui/input';
import { useInitials } from '@/hooks/use-initials';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function Customers() {
  const { t } = useTranslation();
  const { auth, customers, planLimits, statusCounts, kpiCounts, filters: pageFilters = {} } = usePage().props as any;
  const permissions = auth?.permissions || [];
  const getInitials = useInitials();

  // State
  // State - Initialize activeView from URL params or localStorage, fallback to 'list'
  const [activeView, setActiveView] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const viewFromUrl = urlParams.get('view');
    if (viewFromUrl && ['list', 'grid'].includes(viewFromUrl)) {
      return viewFromUrl as 'list' | 'grid';
    }
    const savedView = localStorage.getItem('customers_view');
    if (savedView && ['list', 'grid'].includes(savedView)) {
      return savedView as 'list' | 'grid';
    }
    return 'list';
  });
  const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
  const [filterValues, setFilterValues] = useState<Record<string, any>>({
    gender: pageFilters.gender || 'all',
    created_from: pageFilters.created_from || '',
    created_to: pageFilters.created_to || ''
  });
  const [activeStatusTab, setActiveStatusTab] = useState(pageFilters.status || 'all');
  const [sortField, setSortField] = useState(pageFilters.sort_field || '');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(pageFilters.sort_direction || 'desc');
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');

  // Check if any filters are active
  const hasActiveFilters = () => {
    return Object.values(filterValues).some(value => {
      return value && value !== '' && value !== 'all';
    }) || searchTerm !== ''|| activeStatusTab !== 'all';
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilterValues(prev => ({ ...prev, [key]: value }));
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

  const handleStatusTabChange = (status: string) => {
    setActiveStatusTab(status);
    const params: any = { page: 1, view: activeView, status: status === 'all' ? undefined : status };
    if (searchTerm) params.search = searchTerm;
    if (filterValues.gender && filterValues.gender !== 'all') params.gender = filterValues.gender;
    if (filterValues.created_from) params.created_from = filterValues.created_from;
    if (filterValues.created_to) params.created_to = filterValues.created_to;
    if (pageFilters.per_page) params.per_page = pageFilters.per_page;
    if (sortField) { params.sort_field = sortField; params.sort_direction = sortDirection; }
    router.get(route('customers.index'), params, { preserveState: true, preserveScroll: true });
  };

  const applyFilters = () => {
    const params: any = { page: 1, view: activeView };
    if (searchTerm) params.search = searchTerm;
    if (activeStatusTab && activeStatusTab !== 'all') params.status = activeStatusTab;
    if (filterValues.gender && filterValues.gender !== 'all') params.gender = filterValues.gender;
    if (filterValues.created_from) params.created_from = filterValues.created_from;
    if (filterValues.created_to) params.created_to = filterValues.created_to;
    if (pageFilters.per_page) params.per_page = pageFilters.per_page;
    if (sortField) {
      params.sort_field = sortField;
      params.sort_direction = sortDirection;
    }
    router.get(route('customers.index'), params, { preserveState: true, preserveScroll: true });
  };

  const handleSort = (field: string) => {
    const newDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(newDirection);
    
    const params: any = { sort_field: field, sort_direction: newDirection, page: 1, view: activeView };
    if (searchTerm) params.search = searchTerm;
    if (activeStatusTab && activeStatusTab !== 'all') params.status = activeStatusTab;
    if (filterValues.gender && filterValues.gender !== 'all') params.gender = filterValues.gender;
    if (filterValues.created_from) params.created_from = filterValues.created_from;
    if (filterValues.created_to) params.created_to = filterValues.created_to;
    if (pageFilters.per_page) params.per_page = pageFilters.per_page;
    Object.entries(filterValues).forEach(([key, value]) => {
      if (value && value !== '' && value !== 'all') {
        params[key] = value;
      }
    });
    router.get(route('customers.index'), params, { preserveState: true, preserveScroll: true });
  };

  const handleAction = (action: string, item: any) => {
    setCurrentItem(item);

    switch (action) {
      case 'view':
        setIsViewModalOpen(true);
        break;
      case 'edit':
        router.visit(route('customers.edit', item.id));
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
    router.visit(route('customers.create'));
  };

  const handleFormSubmit = (formData: any) => {
    if (formMode === 'create') {
      toast.loading(t('Creating customer...'));

      router.post(route('customers.store'), formData, {
        onSuccess: (page) => {
          setIsFormModalOpen(false);
          toast.dismiss();
          if (page.props.flash.success) {
            toast.success(t(page.props.flash.success));
          } else if (page.props.flash.error) {
            toast.error(t(page.props.flash.error));
          }
        },
        onError: (errors) => {
          toast.dismiss();
          if (typeof errors === 'string') {
            toast.error(errors);
          } else {
            toast.error(t('Failed to create customer') + `: ${Object.values(errors).join(', ')}`);
          }
        }
      });
    } else if (formMode === 'edit') {
      toast.loading(t('Updating customer...'));

      router.put(route('customers.update', currentItem.id), formData, {
        onSuccess: (page) => {
          setIsFormModalOpen(false);
          toast.dismiss();
          if (page.props.flash.success) {
            toast.success(t(page.props.flash.success));
          } else if (page.props.flash.error) {
            toast.error(t(page.props.flash.error));
          }
        },
        onError: (errors) => {
          toast.dismiss();
          if (typeof errors === 'string') {
            toast.error(errors);
          } else {
            toast.error(t('Failed to update customer') + `: ${Object.values(errors).join(', ')}`);
          }
        }
      });
    }
  };

  const handleDeleteConfirm = () => {
    toast.loading(t('Deleting customer...'));

    router.delete(route('customers.destroy', currentItem.id), {
      onSuccess: (page) => {
        setIsDeleteModalOpen(false);
        toast.dismiss();
        if (page.props.flash.success) {
          toast.success(t(page.props.flash.success));
        } else if (page.props.flash.error) {
          toast.error(t(page.props.flash.error));
        }
      },
      onError: (errors) => {
        toast.dismiss();
        if (typeof errors === 'string') {
          toast.error(errors);
        } else {
          toast.error(t('Failed to delete customer') + `: ${Object.values(errors).join(', ')}`);
        }
      }
    });
  };

  const handleToggleStatus = (customer: any) => {
    const newStatus = customer.status === 'active' ? 'inactive' : 'active';
    toast.loading(`${newStatus === 'active' ? t('Activating') : t('Deactivating')} customer...`);

    router.put(route('customers.toggle-status', customer.id), {}, {
      onSuccess: (page) => {
        toast.dismiss();
        if (page.props.flash.success) {
          toast.success(t(page.props.flash.success));
        } else if (page.props.flash.error) {
          toast.error(t(page.props.flash.error));
        }
      },
      onError: (errors) => {
        toast.dismiss();
        if (typeof errors === 'string') {
          toast.error(errors);
        } else {
          toast.error(t('Failed to update customer status') + `: ${Object.values(errors).join(', ')}`);
        }
      }
    });
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    isInitialMount.current = true;
    setFilterValues({
      gender: 'all',
      created_from: '',
      created_to: ''
    });
    setSortField('');
    setSortDirection('desc');
    setActiveStatusTab('all');

    router.get(route('customers.index'), {
      view: activeView
    }, { preserveState: true, preserveScroll: true });
  };

  const getCustomerFields = () => {
    return [
      { key: 'name', required: true },
      { key: 'email', required: true },
      { key: 'phone', required: false },
      { key: 'date_of_birth', required: false },
      { key: 'gender', required: false },
      { key: 'billing_address', required: true },
      { key: 'billing_city', required: true },
      { key: 'billing_state', required: true },
      { key: 'billing_postal_code', required: true },
      { key: 'billing_country', required: true },
      { key: 'shipping_address', required: false },
      { key: 'shipping_city', required: false },
      { key: 'shipping_state', required: false },
      { key: 'shipping_postal_code', required: false },
      { key: 'shipping_country', required: false },
      { key: 'same_as_billing', required: false },
      { key: 'status', required: false },
      { key: 'notes', required: false }
    ];
  };

  // Define page actions
  const pageActions = [];

  // Add Export button
  if (hasPermission(permissions, 'export-customers')) {
    pageActions.push({
      label: t('Export'),
      icon: <Download className="h-4 w-4" />,
      variant: 'outline',
      onClick: async () => {
        try {
          const params = new URLSearchParams();
          if (searchTerm) params.append('search', searchTerm);
          if (activeStatusTab && activeStatusTab !== 'all') params.append('status', activeStatusTab);
          if (filterValues.gender && filterValues.gender !== 'all') params.append('gender', filterValues.gender);
          if (filterValues.created_from) params.append('created_from', filterValues.created_from);
          if (filterValues.created_to) params.append('created_to', filterValues.created_to);
          if (sortField) {
            params.append('sort_field', sortField);
            params.append('sort_direction', sortDirection);
          }
          
          const url = route('customers.export') + (params.toString() ? '?' + params.toString() : '');
          const response = await fetch(url);
          if (!response.ok) throw new Error('Export failed');
          const blob = await response.blob();
          const downloadUrl = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = downloadUrl;
          a.download = `customers_export_${new Date().toISOString().split('T')[0]}.xlsx`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(downloadUrl);
          document.body.removeChild(a);
          toast.success(t('Export completed successfully'));
        } catch (error) {
          toast.error(t('Export failed'));
        }
      }
    });
  }

  // Add Import button
  if (hasPermission(permissions, 'import-customers')) {
    pageActions.push({
      label: t('Import'),
      icon: <Upload className="h-4 w-4" />,
      variant: 'outline',
      onClick: () => setIsImportModalOpen(true)
    });
  }

  // Add the "Add New Customer" button if user has permission and within limits
  if (hasPermission(permissions, 'create-customers')) {
    const canCreate = !planLimits || planLimits.can_create;
    pageActions.push({
      label: planLimits && !canCreate ? t('Customer Limit Reached ({{current}}/{{max}})', { current: planLimits.current_customers, max: planLimits.max_customers }) : t('Add Customer'),
      icon: <Plus className="h-4 w-4" />,
      variant: canCreate ? 'default' : 'outline',
      onClick: canCreate ? () => handleAddNew() : () => toast.error(t('Customer limit exceeded. Your plan allows maximum {{max}} customers. Please upgrade your plan.', { max: planLimits.max_customers })),
      disabled: !canCreate
    });
  }

  const breadcrumbs = [
    { title: t('Dashboard'), href: route('dashboard') },
    { title: t('Contacts'), href: route('customers.index') },
    { title: t('Customers') }
  ];

  // Define table columns
  const columns = [
    {
      key: 'name',
      label: t('Name'),
      sortable: true,
      render: (value: string, row: any) => {
        return(<div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback>{getInitials(row?.name)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{row?.name || '-'}</div>
            <div className="text-xs text-gray-500">{row?.email || ''}</div>
          </div>
        </div>);
      }
    },
    {
      key: 'contact',
      label: t('Contact'),
      render: (value: string, row: any) => {
        const contact = [];
        if (row.phone) contact.push(row.phone);

        return contact.join(' | ') || '-';
      }
    },
    {
      key: 'billing_address',
      label: t('Billing Address'),
      render: (value: string, row: any) => {
        const parts = [row.billing_address, row.billing_city, row.billing_state].filter(Boolean);
        return parts.join(', ') || '-';
      }
    },
    {
      key: 'status',
      label: t('Status'),
      render: (value: string) => {
        return (
          <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${value === 'active'
            ? 'bg-green-50 text-green-700 ring-green-600/20'
            : 'bg-red-50 text-red-700 ring-red-600/20'
            }`}>
            {value === 'active' ? t('Active') : t('Inactive')}
          </span>
        );
      }
    },
    {
      key: 'created_at',
      label: t('Created At'),
      sortable: true,
      type: 'date',
      // render: (value: string) => window.appSettings?.formatDateTime(value, false) || new Date(value).toLocaleDateString()
    }
  ];

  // Define table actions
  const actions = [
    {
      label: t('Toggle Status'),
      icon: (item: any) => item.status === 'active' ? 'Lock' : 'Unlock',
      action: 'toggle-status',
      className: 'text-amber-500',
      requiredPermission: 'manage-customer-status'
    },
    {
      label: t('View'),
      icon: 'Eye',
      action: 'view',
      className: 'text-blue-500',
      requiredPermission: 'view-customers'
    },
    {
      label: t('Edit'),
      icon: 'Edit',
      action: 'edit',
      className: 'text-amber-500',
      requiredPermission: 'edit-customers'
    },
    {
      label: t('Delete'),
      icon: 'Trash2',
      action: 'delete',
      className: 'text-red-500',
      requiredPermission: 'delete-customers'
    }
  ];

  const totalCustomers = kpiCounts?.total || 0;

  const statusTabs = [
    { key: 'all', label: t('All Customers'), count: statusCounts?.total ?? (customers?.total || 0), icon: List },
    { key: 'active', label: t('Active'), count: statusCounts?.active || 0, icon: UserCheck },
    { key: 'inactive', label: t('Inactive'), count: statusCounts?.inactive || 0, icon: UserX },
  ];

  return (
    <PageTemplate
      title={t("Customer")}
      url="/customers"
      actions={pageActions}
      breadcrumbs={breadcrumbs}
      noPadding
      description={t('Manage and organize your customer information and contacts.')}
    >
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Customers */}
        <div className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-50 dark:bg-blue-700/20 rounded-bl-full"></div>
          <div className="p-4 relative">
            <div className="flex items-start justify-between mb-3">
              <div className="text-left">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 capitalize tracking-wide mb-1">{t('Total Customers')}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{totalCustomers}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('All time customers')}</p>
              </div>
              <div className="relative z-10 p-2.5 bg-blue-50 dark:bg-blue-700/20 rounded-xl mt-0.5">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Active Customers */}
        <div className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-green-50 dark:bg-green-700/20 rounded-bl-full"></div>
          <div className="p-4 relative">
            <div className="flex items-start justify-between mb-3">
              <div className="text-left">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 capitalize tracking-wide mb-1">{t('Active Customers')}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{kpiCounts?.active || 0}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {totalCustomers > 0
                    ? `${(((kpiCounts?.active || 0) / totalCustomers) * 100).toFixed(1)}% ${t('of total')}`
                    : `0% ${t('of total')}`
                  }
                </p>
              </div>
              <div className="relative z-10 p-2.5 bg-green-50 dark:bg-green-700/20 rounded-xl mt-0.5">
                <UserCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Inactive Customers */}
        <div className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-red-50 dark:bg-red-700/20 rounded-bl-full"></div>
          <div className="p-4 relative">
            <div className="flex items-start justify-between mb-3">
              <div className="text-left">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 capitalize tracking-wide mb-1">{t('Inactive Customers')}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{kpiCounts?.inactive || 0}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {totalCustomers > 0
                    ? `${(((kpiCounts?.inactive || 0) / totalCustomers) * 100).toFixed(1)}% ${t('of total')}`
                    : `0% ${t('of total')}`
                  }
                </p>
              </div>
              <div className="relative z-10 p-2.5 bg-red-50 dark:bg-red-700/20 rounded-xl mt-0.5">
                <UserX className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>
        </div>

        {/* New This Month */}
        <div className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-50 dark:bg-purple-700/20 rounded-bl-full"></div>
          <div className="p-4 relative">
            <div className="flex items-start justify-between mb-3">
              <div className="text-left">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 capitalize tracking-wide mb-1">{t('New This Month')}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{kpiCounts?.new_this_month || 0}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('Joined this month')}</p>
              </div>
              <div className="relative z-10 p-2.5 bg-purple-50 dark:bg-purple-700/20 rounded-xl mt-0.5">
                <UserPlus className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and filters section */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow mb-4 border">
        <SearchAndFilterBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onSearch={handleSearch}
          filters={[
            {
              name: 'gender',
              label: t('Gender'),
              type: 'select',
              value: filterValues.gender,
              onChange: (value: any) => handleFilterChange('gender', value),
              options: [
                { value: 'all', label: t('All Genders') },
                { value: 'male', label: t('Male') },
                { value: 'female', label: t('Female') },
                { value: 'other', label: t('Other') }
              ]
            },
            {
              name: 'created_from',
              label: t('Created From'),
              type: 'date',
              value: filterValues.created_from,
              onChange: (value: any) => handleFilterChange('created_from', value)
            },
            {
              name: 'created_to',
              label: t('Created To'),
              type: 'date',
              value: filterValues.created_to,
              onChange: (value: any) => handleFilterChange('created_to', value)
            }
          ]}
          hasActiveFilters={hasActiveFilters}
          activeFilterCount={() => {
            return Object.values(filterValues).filter(v => v && v !== '' && v !== 'all').length + (searchTerm ? 1 : 0) + (activeStatusTab !== 'all' ? 1 : 0);
          }}
          onResetFilters={handleResetFilters}
          showViewToggle={true}
          activeView={activeView}
          onViewChange={(view) => {
            setActiveView(view);
            
            const currentUrl = new URL(window.location.href);
            const params = new URLSearchParams(currentUrl.search);
            params.set('view', view);
            
            if (searchTerm) params.set('search', searchTerm);
            if (activeStatusTab && activeStatusTab !== 'all') params.set('status', activeStatusTab);
            if (filterValues.gender && filterValues.gender !== 'all') params.set('gender', filterValues.gender);
            if (filterValues.created_from) params.set('created_from', filterValues.created_from);
            if (filterValues.created_to) params.set('created_to', filterValues.created_to);
            if (pageFilters.per_page) params.set('per_page', pageFilters.per_page.toString());
            if (pageFilters.page) params.set('page', pageFilters.page.toString());
            if (sortField) params.set('sort_field', sortField);
            if (sortDirection) params.set('sort_direction', sortDirection);
            
            router.get(route('customers.index'), Object.fromEntries(params), {
              preserveState: true,
              preserveScroll: true
            });
          }}
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
                    <div
                      className="absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 bg-primary rounded-full transition-all duration-200"
                      style={{ width: 'calc(100% - 2rem)' }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content section */}
      {activeView === 'list' ? (
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden">
          <CrudTable
            columns={columns}
            actions={actions}
            data={customers?.data || []}
            from={customers?.from || 1}
            onAction={handleAction}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
            permissions={permissions}
            entityPermissions={{
              view: 'view-customers',
              create: 'create-customers',
              edit: 'edit-customers',
              delete: 'delete-customers'
            }}
          />

          <Pagination
            from={customers?.from || 0}
            to={customers?.to || 0}
            total={customers?.total || 0}
            links={customers?.links}
            entityName={t("customers")}
            onPageChange={(url) => {
              if (url) {
                const urlObj = new URL(url, window.location.origin);
                urlObj.searchParams.set('view', activeView);
                if (pageFilters.per_page) urlObj.searchParams.set('per_page', pageFilters.per_page.toString());
                if (searchTerm) urlObj.searchParams.set('search', searchTerm);
                if (activeStatusTab && activeStatusTab !== 'all') urlObj.searchParams.set('status', activeStatusTab);
                if (filterValues.gender && filterValues.gender !== 'all') urlObj.searchParams.set('gender', filterValues.gender);
                if (filterValues.created_from) urlObj.searchParams.set('created_from', filterValues.created_from);
                if (filterValues.created_to) urlObj.searchParams.set('created_to', filterValues.created_to);
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
              const params: any = { page: 1, per_page: parseInt(value), view: activeView };
              if (searchTerm) params.search = searchTerm;
              if (activeStatusTab && activeStatusTab !== 'all') params.status = activeStatusTab;
              if (filterValues.gender && filterValues.gender !== 'all') params.gender = filterValues.gender;
              if (filterValues.created_from) params.created_from = filterValues.created_from;
              if (filterValues.created_to) params.created_to = filterValues.created_to;
              Object.entries(filterValues).forEach(([key, val]) => {
                if (val && val !== '' && val !== 'all') params[key] = val;
              });
              if (sortField) {
                params.sort_field = sortField;
                params.sort_direction = sortDirection;
              }
              router.get(route('customers.index'), params, { preserveState: true, preserveScroll: true });
            }}
          />
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {customers?.data?.map((customer: any) => (
              <Card key={customer.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm">
                {/* Top: Avatar + Name + Email */}
                <div className="p-4 flex items-center gap-3">
                  <Avatar className="h-12 w-12 shrink-0">
                    <AvatarFallback>{getInitials(customer.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white truncate">{customer.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{customer.email || '-'}</p>
                    {customer.phone && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{customer.phone}</p>
                    )}
                  </div>
                </div>

                {/* Address */}
                {(customer.billing_city || customer.billing_state) && (
                  <div className="px-4 pb-2">
                    <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                      {[customer.billing_city, customer.billing_state, customer.billing_country].filter(Boolean).join(', ')}
                    </p>
                  </div>
                )}

                {/* Divider */}
                <div className="border-t border-gray-100 dark:border-gray-700" />

                {/* Bottom: Action icons (left) + Status badge (right) */}
                <div className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {hasPermission(permissions, 'manage-customer-status') && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-500" onClick={() => handleAction('toggle-status', customer)}>
                            {customer.status === 'active' ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t('Toggle Status')}</TooltipContent>
                      </Tooltip>
                    )}
                    {hasPermission(permissions, 'view-customers') && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-500" onClick={() => handleAction('view', customer)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t('View')}</TooltipContent>
                      </Tooltip>
                    )}
                    {hasPermission(permissions, 'edit-customers') && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-500" onClick={() => handleAction('edit', customer)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t('Edit')}</TooltipContent>
                      </Tooltip>
                    )}
                    {hasPermission(permissions, 'delete-customers') && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-500" onClick={() => handleAction('delete', customer)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t('Delete')}</TooltipContent>
                      </Tooltip>
                    )}
                  </div>

                  {/* Status badge */}
                  <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                    customer.status === 'active'
                      ? 'bg-green-50 text-green-700 ring-green-600/20'
                      : 'bg-red-50 text-red-700 ring-red-600/20'
                  }`}>
                    {customer.status === 'active' ? t('Active') : t('Inactive')}
                  </span>
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-6 bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden">
            <Pagination
              from={customers?.from || 0}
              to={customers?.to || 0}
              total={customers?.total || 0}
              links={customers?.links}
              entityName={t("customers")}
              onPageChange={(url) => {
                if (url) {
                  const urlObj = new URL(url, window.location.origin);
                  urlObj.searchParams.set('view', activeView);
                  if (pageFilters.per_page) urlObj.searchParams.set('per_page', pageFilters.per_page.toString());
                  if (searchTerm) urlObj.searchParams.set('search', searchTerm);
                  if (activeStatusTab && activeStatusTab !== 'all') urlObj.searchParams.set('status', activeStatusTab);
                  if (filterValues.gender && filterValues.gender !== 'all') urlObj.searchParams.set('gender', filterValues.gender);
                  if (filterValues.created_from) urlObj.searchParams.set('created_from', filterValues.created_from);
                  if (filterValues.created_to) urlObj.searchParams.set('created_to', filterValues.created_to);
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
                const params: any = { page: 1, per_page: parseInt(value), view: activeView };
                if (searchTerm) params.search = searchTerm;
                if (activeStatusTab && activeStatusTab !== 'all') params.status = activeStatusTab;
                if (filterValues.gender && filterValues.gender !== 'all') params.gender = filterValues.gender;
                if (filterValues.created_from) params.created_from = filterValues.created_from;
                if (filterValues.created_to) params.created_to = filterValues.created_to;
                Object.entries(filterValues).forEach(([key, val]) => {
                  if (val && val !== '' && val !== 'all') params[key] = val;
                });
                if (sortField) {
                  params.sort_field = sortField;
                  params.sort_direction = sortDirection;
                }
                router.get(route('customers.index'), params, { preserveState: true, preserveScroll: true });
              }}
            />
          </div>
        </div>
      )}

      {/* View Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        {currentItem && <ViewPopup record={currentItem} />}
      </Dialog>

      {/* Form Modal */}
      <CrudFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleFormSubmit}
        formConfig={{
          fields: [
            { name: 'name', label: t('Customer Name'), type: 'text', required: true, placeholder: 'Enter customer name' },
            { name: 'email', label: t('Email'), type: 'email', required: true, placeholder: 'Enter email' },
            { name: 'phone', label: t('Phone'), type: 'text', placeholder: 'Enter phone' },
            { name: 'date_of_birth', label: t('Date of Birth'), type: 'date',
              render: (field: any, formData: any, onChange: any, mode: any) => {
                if (mode === 'view') {
                    const formattedDate = currentItem?.date_of_birth
                        ? (window.appSettings?.formatDateTime
                            ? window.appSettings.formatDateTime(currentItem.date_of_birth, false)
                            : new Date(currentItem.date_of_birth).toLocaleDateString())
                        : '-';
                  return <div className="p-2 border rounded-md bg-gray-50">{formattedDate}</div>;
                }
                const dateValue = formData[field.name]
                  ? (typeof formData[field.name] === 'string' && formData[field.name].includes('T')
                    ? formData[field.name].split('T')[0]
                    : formData[field.name])
                  : '';
                return (
                  <Input
                    id={field.name}
                    name={field.name}
                    type="date"
                    max={new Date().toISOString().split('T')[0]}
                    value={dateValue}
                    onChange={(e) => onChange(field.name, e.target.value)}
                  />
                );
              }
            },
            {
              name: 'gender',
              label: t('Gender'),
              type: 'select',
              options: [
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
                { value: 'other', label: 'Other' }
              ]
            },
            { name: 'billing_address', label: t('Billing Address'), type: 'textarea', required: true, placeholder: 'Enter billing address' },
            { name: 'billing_city', label: t('Billing City'), type: 'text', required: true, placeholder: 'Enter billing city' },
            { name: 'billing_state', label: t('Billing State'), type: 'text', required: true, placeholder: 'Enter billing state' },
            { name: 'billing_postal_code', label: t('Billing Postal Code'), type: 'text', required: true, placeholder: 'Enter billing postal code' },
            { name: 'billing_country', label: t('Billing Country'), type: 'text', required: true, placeholder: 'Enter billing country' },
            {
              name: 'same_as_billing',
              label: t('Same as Billing'),
              type: 'checkbox',
              description: t('Use billing address for shipping'),
              conditional: (mode: string) => mode !== 'view'
            },
            { name: 'shipping_address', label: t('Shipping Address'), type: 'textarea', placeholder: 'Enter shipping address' },
            { name: 'shipping_city', label: t('Shipping City'), type: 'text', placeholder: 'Enter shipping city' },
            { name: 'shipping_state', label: t('Shipping State'), type: 'text', placeholder: 'Enter shipping state' },
            { name: 'shipping_postal_code', label: t('Shipping Postal Code'), type: 'text', placeholder: 'Enter shipping postal code' },
            { name: 'shipping_country', label: t('Shipping Country'), type: 'text', placeholder: 'Enter shipping country' },
            {
              name: 'status',
              label: t('Status'),
              type: 'select',
              options: [
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' }
              ],
              defaultValue: 'active'
            },
            { name: 'notes', label: t('Notes'), type: 'textarea', placeholder: 'Enter note' }
          ],
          modalSize: 'xl'
        }}
        initialData={currentItem}
        title={
          formMode === 'create'
            ? t('Add New Customer')
            : formMode === 'edit'
              ? t('Edit Customer')
              : t('View Customer')
        }
        mode={formMode}
      />

      {/* Delete Modal */}
      <CrudDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        itemName={currentItem?.name || ''}
        entityName="customer"
      />

      {/* Import Modal */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title={t('Import Customers')}
        importRoute="customers.import-data"
        parseRoute="customers.parse"
        samplePath={route('customer.download.template')}
        importNotes={t('Please ensure your CSV file contains the required columns. Name is required. Duplicate entries (same email or phone) will be skipped.')}
        databaseFields={getCustomerFields()}
      />
    </PageTemplate>
  );
}
