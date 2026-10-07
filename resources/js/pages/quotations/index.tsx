import { useState, useEffect, useRef } from 'react';
import { PageTemplate } from '@/components/page-template';
import { usePage, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { Plus, Eye, CheckCircle, XCircle, Send, ArrowRight, Download, FileText, DollarSign, Clock } from 'lucide-react';
import { hasPermission } from '@/utils/authorization';
import { CrudTable } from '@/components/CrudTable';
import { CrudFormModal } from '@/components/CrudFormModal';
import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import { toast } from '@/components/custom-toast';
import { useTranslation } from 'react-i18next';
import { Pagination } from '@/components/ui/pagination';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';

export default function Quotations() {
  const { t } = useTranslation();
  const { auth, quotations, customers, branches, products, statusCounts, filters: pageFilters = {}, flash } = usePage().props as any;
  const summaryStats = {
    totalQuotations: quotations?.stats?.total_quotations ?? (quotations?.total || 0),
    approvedQuotations: quotations?.stats?.approved_quotations || 0,
    rejectedQuotations: quotations?.stats?.rejected_quotations || 0,
    convertedQuotations: quotations?.stats?.converted_quotations || 0,
    totalQuotationAmount: quotations?.stats?.total_quotation_amount || 0,
  };
  const permissions = auth?.permissions || [];
  const getInitials = useInitials();

  useEffect(() => {
    if (flash?.error) {
      toast.error(flash.error);
    }
  }, [flash]);

  const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
  const [filterValues, setFilterValues] = useState<Record<string, any>>({
    status: pageFilters.status || 'all',
    customer_id: pageFilters.customer_id || 'all',
    quotation_date_from: pageFilters.quotation_date_from || '',
    quotation_date_to: pageFilters.quotation_date_to || ''
  });
  const [sortField, setSortField] = useState(pageFilters.sort_field || '');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(pageFilters.sort_direction || 'desc');
  const [statusFilter, setStatusFilter] = useState(pageFilters.status || 'all');
  const [activeStatusTab, setActiveStatusTab] = useState(pageFilters.status || 'all');
  const [customerFilter, setCustomerFilter] = useState(pageFilters.customer_id || 'all');
  const [dateFromFilter, setDateFromFilter] = useState(pageFilters.quotation_date_from || '');
  const [dateToFilter, setDateToFilter] = useState(pageFilters.quotation_date_to || '');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');

  const hasActiveFilters = () => {
    return Object.values(filterValues).some(value => {
      return value && value !== '' && value !== 'all';
    }) || searchTerm !== '' || activeStatusTab !== 'all';
  };
  
  const handleFilterChange = (key: string, value: any) => {
    setFilterValues(prev => ({ ...prev, [key]: value }));
    // Also update individual state for backward compatibility
    if (key === 'status') setStatusFilter(value);
    if (key === 'customer_id') setCustomerFilter(value);
    if (key === 'quotation_date_from') setDateFromFilter(value);
    if (key === 'quotation_date_to') setDateToFilter(value);
  };

  const handleStatusTabChange = (status: string) => {
    setActiveStatusTab(status);
    setStatusFilter(status);
    const params: any = { page: 1, status: status === 'all' ? undefined : status };
    if (searchTerm) params.search = searchTerm;
    if (customerFilter && customerFilter !== 'all') params.customer_id = customerFilter;
    if (dateFromFilter) params.quotation_date_from = dateFromFilter;
    if (dateToFilter) params.quotation_date_to = dateToFilter;
    if (pageFilters.per_page) params.per_page = pageFilters.per_page;
    if (sortField) {
      params.sort_field = sortField;
      params.sort_direction = sortDirection;
    }
    router.get(route('quotations.index'), params, { preserveState: true, preserveScroll: true });
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
    if (activeStatusTab !== 'all') params.status = activeStatusTab;
    if (customerFilter && customerFilter !== 'all') params.customer_id = customerFilter;
    if (dateFromFilter) params.quotation_date_from = dateFromFilter;
    if (dateToFilter) params.quotation_date_to = dateToFilter;
    if (pageFilters.per_page) params.per_page = pageFilters.per_page;
    if (sortField) { params.sort_field = sortField; params.sort_direction = sortDirection; }
    router.get(route('quotations.index'), params, { preserveState: true, preserveScroll: true });
  };

  const handleSort = (field: string) => {
    const newDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(newDirection);
    
    const params: any = { sort_field: field, sort_direction: newDirection, page: 1 };
    if (searchTerm) params.search = searchTerm;
    if (activeStatusTab !== 'all') params.status = activeStatusTab;
    if (customerFilter && customerFilter !== 'all') params.customer_id = customerFilter;
    if (dateFromFilter) params.quotation_date_from = dateFromFilter;
    if (dateToFilter) params.quotation_date_to = dateToFilter;
    if (pageFilters.per_page) params.per_page = pageFilters.per_page;
    Object.entries(filterValues).forEach(([key, value]) => {
      if (value && value !== '' && value !== 'all') {
        params[key] = value;
      }
    });
    router.get(route('quotations.index'), params, { preserveState: true, preserveScroll: true });
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    isInitialMount.current = true;
    setFilterValues({ status: 'all', customer_id: 'all', quotation_date_from: '', quotation_date_to: '' });
    setStatusFilter('all');
    setActiveStatusTab('all');
    setCustomerFilter('all');
    setDateFromFilter('');
    setDateToFilter('');
    setSortField('');
    setSortDirection('desc');
    router.get(route('quotations.index'), {}, { preserveState: true, preserveScroll: true });
  };

  const handleAction = (action: string, item: any) => {
    setCurrentItem(item);
    switch (action) {
      case 'view':
        router.visit(route('quotations.show', item.id));
        break;
      case 'edit':
        router.visit(route('quotations.edit', item.id));
        break;
      case 'delete':
        setIsDeleteModalOpen(true);
        break;
    }
  };

  const handleAddNew = () => {
    router.visit(route('quotations.create'));
  };

  const handleFormSubmit = (formData: any) => {
    if (formMode === 'create') {
      toast.loading(t('Creating quotation...'));
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
      fetch(route('quotations.store'), {
        method: 'POST',
        headers: {
          'X-CSRF-TOKEN': csrfToken,
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(formData)
      })
        .then(async response => {
          toast.dismiss();
          const data = await response.json();
          if (response.ok) {
            setIsFormModalOpen(false);
            toast.success(data.message);
            router.reload();
          } else {
            toast.error(data.message);
          }
        })
        .catch(error => {
          toast.dismiss();
          toast.error(t('Network error occurred'));
        });
    }
  };

  const handleDeleteConfirm = () => {
    toast.loading(t('Deleting quotation...'));
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
    fetch(route('quotations.destroy', currentItem.id), {
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
          toast.success(data.message);
          router.reload();
        } else {
          if (data.demo_mode && data.error) {
            toast.error(t(data.error));
          } else {
            toast.error(data.message);
          }
        }
      })
      .catch(error => {
        toast.dismiss();
        setIsDeleteModalOpen(false);
        toast.error(t('Network error occurred'));
      });
  };

  const handleExport = () => {
    if (hasPermission(permissions, 'export-quotations')) {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (activeStatusTab !== 'all') params.append('status', activeStatusTab);
      if (customerFilter && customerFilter !== 'all') params.append('customer_id', customerFilter);
      if (dateFromFilter) params.append('quotation_date_from', dateFromFilter);
      if (dateToFilter) params.append('quotation_date_to', dateToFilter);
      
      const url = route('quotation.export') + (params.toString() ? '?' + params.toString() : '');
      window.location.href = url;
    }
  };

  const pageActions = [];
   if (hasPermission(permissions, 'export-quotations')) {
    pageActions.push({
      label: t('Export'),
      icon: <Download className="h-4 w-4" />,
      variant: 'outline',
      onClick: handleExport
    });
  }
  if (hasPermission(permissions, 'create-quotations')) {
    pageActions.push({
      label: t('Add Quotation'),
      icon: <Plus className="h-4 w-4" />,
      variant: 'default',
      onClick: () => handleAddNew()
    });
  }
 

  const breadcrumbs = [
    { title: t('Dashboard'), href: route('dashboard') },
    { title: t('Quotations') }
  ];

  const filterOptions = [
    {
      name: 'customer_id',
      label: t('Customer'),
      type: 'select',
      value: customerFilter,
      onChange: (value: any) => handleFilterChange('customer_id', value),
      options: [
        { value: 'all', label: t('All Customers') },
        ...(customers?.map((customer: any) => ({
          value: customer.id.toString(),
          label: customer.name
        })) || [])
      ]
    },
    {
      name: 'quotation_date_from',
      label: t('Date From'),
      type: 'date',
      value: dateFromFilter,
      onChange: (value: any) => handleFilterChange('quotation_date_from', value)
    },
    {
      name: 'quotation_date_to',
      label: t('Date To'),
      type: 'date',
      value: dateToFilter,
      onChange: (value: any) => handleFilterChange('quotation_date_to', value)
    }
  ];

  // Status tabs configuration
  const statusTabs = [
    { key: 'all', label: t('All Quotations'), count: statusCounts?.total || 0, icon: FileText },
    { key: 'draft', label: t('Draft'), count: statusCounts?.draft || 0, icon: Clock },
    { key: 'sent', label: t('Sent'), count: statusCounts?.sent || 0, icon: Send },
    { key: 'approved', label: t('Approved'), count: statusCounts?.approved || 0, icon: CheckCircle },
    { key: 'rejected', label: t('Rejected'), count: statusCounts?.rejected || 0, icon: XCircle },
    { key: 'converted', label: t('Converted'), count: statusCounts?.converted || 0, icon: ArrowRight }
  ];

  const columns = [
    {
      key: 'quotation_number',
      label: t('Quotation Number'),
      sortable: true,
      render: (value: string, row: any) => (
        <button
          onClick={() => router.visit(route('quotations.show', row.id))}
          className="inline-flex items-center text-nowrap rounded-md px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20"
        >
          {value}
        </button>
      )
    },
    { key: 'customer', label: t('Customer'), render: (value: any) => (
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
    { key: 'quotation_date', label: t('Date'), type: 'date'
      // render: (value: string) => window.appSettings.formatDateTime(new Date(value),false) 
    },
    { key: 'total_amount', label: t('Total Amount'),sortable: true, render: (value: number) => <span className="font-mono">{window.appSettings.formatCurrency(value || 0)}</span> },
     {
      key: 'status',
      label: t('Status'),
      render: (value: string) => {
        const statusColors = {
          draft: 'bg-gray-50 text-gray-700 ring-gray-600/20',
          sent: 'bg-blue-50 text-blue-700 ring-blue-600/20',
          approved: 'bg-green-50 text-green-700 ring-green-600/20',
          rejected: 'bg-red-50 text-red-700 ring-red-600/20',
          converted: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20'
        };

        return (
          <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${statusColors[value as keyof typeof statusColors] || statusColors.draft}`}>
            {t(value?.charAt(0).toUpperCase() + value?.slice(1)) || t('Draft')}
          </span>
        );
      }
    },
  ];

  const actions = [
    { label: t('View'), icon: 'Eye', action: 'view', className: 'text-blue-500', requiredPermission: 'view-quotations' },
    { label: t('Edit'), icon: 'Edit', action: 'edit', className: 'text-amber-500', requiredPermission: 'edit-quotations', condition: (row: any) => row.status !== 'converted' },
    { label: t('Delete'), icon: 'Trash2', action: 'delete', className: 'text-red-500', requiredPermission: 'delete-quotations' }
  ];

  return (
    <PageTemplate title={t("Quotations")} description={t('Create and manage sales quotations for your customers.')} url="/quotations" actions={pageActions} breadcrumbs={breadcrumbs} noPadding>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-50 dark:bg-blue-700/20 rounded-bl-full"></div>
          <div className="p-4 relative">
            <div className="flex items-start justify-between mb-3">
              <div className="text-left">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 capitalize tracking-wide mb-1">{t('Total Quotations')}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{summaryStats.totalQuotations}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('All time quotations')}</p>
              </div>
              <div className="relative z-10 p-2.5 bg-blue-50 dark:bg-blue-700/20 rounded-xl mt-0.5">
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-green-50 dark:bg-green-700/20 rounded-bl-full"></div>
          <div className="p-4 relative">
            <div className="flex items-start justify-between mb-3">
              <div className="text-left">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 capitalize tracking-wide mb-1">{t('Approved Quotations')}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{summaryStats.approvedQuotations}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {summaryStats.totalQuotations > 0
                    ? `${((summaryStats.approvedQuotations / summaryStats.totalQuotations) * 100).toFixed(1)}% ${t('of total')}`
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
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 capitalize tracking-wide mb-1">{t('Rejected Quotations')}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{summaryStats.rejectedQuotations}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {summaryStats.totalQuotations > 0
                    ? `${((summaryStats.rejectedQuotations / summaryStats.totalQuotations) * 100).toFixed(1)}% ${t('of total')}`
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
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-50 dark:bg-amber-700/20 rounded-bl-full"></div>
          <div className="p-4 relative">
            <div className="flex items-start justify-between mb-3">
              <div className="text-left">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 capitalize tracking-wide mb-1">{t('Converted Quotations')}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{summaryStats.convertedQuotations}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {summaryStats.totalQuotations > 0
                    ? `${((summaryStats.convertedQuotations / summaryStats.totalQuotations) * 100).toFixed(1)}% ${t('of total')}`
                    : '0% of total'
                  }
                </p>
              </div>
              <div className="relative z-10 p-2.5 bg-amber-50 dark:bg-amber-700/20 rounded-xl mt-0.5">
                <ArrowRight className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-50 dark:bg-purple-700/20 rounded-bl-full"></div>
          <div className="p-4 relative">
            <div className="flex items-start justify-between mb-3">
              <div className="text-left">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 capitalize tracking-wide mb-1">{t('Total Quotation Value')}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {window.appSettings?.formatCurrency
                    ? <span className="font-mono">{window.appSettings.formatCurrency(summaryStats.totalQuotationAmount)}</span>
                    : <span className="font-mono">{`$${summaryStats.totalQuotationAmount.toFixed(2)}`}</span>
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
                    className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors clickable ${activeStatusTab === tab.key
                      ? 'text-primary'
                      : 'text-gray-500 hover:text-gray-700'
                      }`}
                  >
                    <IconComponent className="h-4 w-4" />
                    <span>{tab.label}</span>
                    <span className={`inline-flex items-center justify-center px-2 py-1 text-xs font-bold rounded-full ${activeStatusTab === tab.key
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-600'
                      }`}>
                      {tab.count}
                    </span>
                  </button>
                  {/* Custom border that matches text width */}
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
          data={quotations?.data || []}
          from={quotations?.from || 1}
          onAction={handleAction}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
          permissions={permissions}
          entityPermissions={{
            view: 'view-quotations',
            create: 'create-quotations',
            edit: 'edit-quotations',
            delete: 'delete-quotations'
          }}
        />

        <Pagination
          from={quotations?.from || 0}
          to={quotations?.to || 0}
          total={quotations?.total || 0}
          links={quotations?.links || []}
          entityName={t("quotations")}
          onPageChange={(url) => {
            if (url) {
              const urlObj = new URL(url, window.location.origin);
              if (pageFilters.per_page) urlObj.searchParams.set('per_page', pageFilters.per_page.toString());
              if (pageFilters.search) urlObj.searchParams.set('search', pageFilters.search);
              if (activeStatusTab !== 'all') urlObj.searchParams.set('status', activeStatusTab);
              if (customerFilter && customerFilter !== 'all') urlObj.searchParams.set('customer_id', customerFilter);
              if (dateFromFilter) urlObj.searchParams.set('quotation_date_from', dateFromFilter);
              if (dateToFilter) urlObj.searchParams.set('quotation_date_to', dateToFilter);
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
            if (activeStatusTab !== 'all') params.status = activeStatusTab;
            if (customerFilter && customerFilter !== 'all') params.customer_id = customerFilter;
            if (dateFromFilter) params.quotation_date_from = dateFromFilter;
            if (dateToFilter) params.quotation_date_to = dateToFilter;
            Object.entries(filterValues).forEach(([key, val]) => {
              if (val && val !== '' && val !== 'all') params[key] = val;
            });
            if (sortField) {
              params.sort_field = sortField;
              params.sort_direction = sortDirection;
            }
            router.get(route('quotations.index'), params, { preserveState: true, preserveScroll: true });
          }}
        />
      </div>

      <CrudFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleFormSubmit}
        formConfig={{
          fields: [
            { name: 'customer_id', label: t('Customer'), type: 'select', required: true, options: customers?.map((customer: any) => ({ value: customer.id, label: customer.name })) || [] },
            { name: 'branch_id', label: t('Branch'), type: 'select', required: true, options: branches?.map((branch: any) => ({ value: branch.id, label: branch.name })) || [] },
            { name: 'quotation_date', label: t('Quotation Date'), type: 'date', required: true },
            { name: 'valid_until', label: t('Valid Until'), type: 'date', required: true },
            {
              name: 'items',
              label: t('Items'),
              type: 'custom',
              render: (field: any, formData: any, handleChange: any) => {
                const items = formData.items || [];

                const addItem = () => {
                  handleChange('items', [...items, { product_id: '', quantity: 1, unit_price: 0, discount_amount: 0, tax_rate: 0 }]);
                };

                const updateItem = (index: number, field: string, value: any) => {
                  const updatedItems = [...items];
                  updatedItems[index][field] = value;
                  handleChange('items', updatedItems);
                };

                const removeItem = (index: number) => {
                  handleChange('items', items.filter((_: any, i: number) => i !== index));
                };

                return (
                  <div className="space-y-2">
                    {items.map((item: any, index: number) => (
                      <div key={index} className="grid grid-cols-6 gap-2 p-2 border rounded">
                        <select
                          value={item.product_id}
                          onChange={(e) => updateItem(index, 'product_id', e.target.value)}
                          className="px-2 py-1 border rounded text-sm"
                        >
                          <option value="">{t('Select Product')}</option>
                          {products?.map((product: any) => (
                            <option key={product.id} value={product.id}>{product.name}</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                          className="px-2 py-1 border rounded text-sm"
                          placeholder={t('Qty')}
                        />
                        <input
                          type="number"
                          value={item.unit_price}
                          onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                          className="px-2 py-1 border rounded text-sm"
                          placeholder={t('Price')}
                        />
                        <input
                          type="number"
                          value={item.discount_amount}
                          onChange={(e) => updateItem(index, 'discount_amount', parseFloat(e.target.value) || 0)}
                          className="px-2 py-1 border rounded text-sm"
                          placeholder={t('Discount')}
                        />
                        <input
                          type="number"
                          value={item.tax_rate}
                          onChange={(e) => updateItem(index, 'tax_rate', parseFloat(e.target.value) || 0)}
                          className="px-2 py-1 border rounded text-sm"
                          placeholder={t('Tax %')}
                        />
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="px-2 py-1 bg-red-500 text-white rounded text-sm"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addItem}
                      className="w-full px-4 py-2 bg-blue-500 text-white rounded"
                    >
                      {t('Add Item')}
                    </button>
                  </div>
                );
              }
            },
            { name: 'notes', label: t('Notes'), type: 'textarea' }
          ],
          modalSize: 'xl'
        }}
        initialData={currentItem}
        title={formMode === 'create' ? t('Add Quotation') : formMode === 'edit' ? t('Edit Quotation') : t('View Quotation')}
        mode={formMode}
      />

      <CrudDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        itemName={currentItem?.quotation_number || ''}
        entityName="quotation"
      />
    </PageTemplate>
  );
}
