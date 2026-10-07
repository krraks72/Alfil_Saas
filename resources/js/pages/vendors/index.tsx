import { useState, useEffect, useRef } from 'react';
import { PageTemplate } from '@/components/page-template';
import { usePage, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { Plus, Eye, Edit, Trash2, MoreHorizontal, Lock, Unlock, Download, Upload, Building2, CheckCircle2, XCircle, PackagePlus, List } from 'lucide-react';
import { hasPermission } from '@/utils/authorization';
import { CrudTable } from '@/components/CrudTable';
import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import { Dialog } from '@/components/ui/dialog';
import ViewPopup from './view';
import { ImportModal } from '@/components/ImportModal';
import { toast } from '@/components/custom-toast';
import { useTranslation } from 'react-i18next';
import { Pagination } from '@/components/ui/pagination';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export default function Vendors() {
  const { t } = useTranslation();
  const { auth, vendors, planLimits, statusCounts, kpiCounts, filters: pageFilters = {} } = usePage().props as any;
  const permissions = auth?.permissions || [];
  const getInitials = useInitials();

  // State - Initialize activeView from URL params or localStorage, fallback to 'list'
  const [activeView, setActiveView] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const viewFromUrl = urlParams.get('view');
    if (viewFromUrl && ['list', 'grid'].includes(viewFromUrl)) {
      return viewFromUrl as 'list' | 'grid';
    }
    const savedView = localStorage.getItem('vendors_view');
    if (savedView && ['list', 'grid'].includes(savedView)) {
      return savedView as 'list' | 'grid';
    }
    return 'list';
  });
  const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
  const [startDate, setStartDate] = useState<Date | undefined>(pageFilters.start_date ? new Date(pageFilters.start_date) : undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(pageFilters.end_date ? new Date(pageFilters.end_date) : undefined);
  const [activeStatusTab, setActiveStatusTab] = useState(pageFilters.status || 'all');
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);

  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
    } else {
      applyFilters();
    }
  }, [startDate, endDate]);

  const hasActiveFilters = () => {
    return activeStatusTab !== 'all' || searchTerm !== '' || startDate !== undefined || endDate !== undefined;
  };

  const activeFilterCount = () => {
    return (activeStatusTab !== 'all' ? 1 : 0) +
      (searchTerm ? 1 : 0) +
      (startDate ? 1 : 0) +
      (endDate ? 1 : 0);
  };

  const handleStatusTabChange = (status: string) => {
    setActiveStatusTab(status);
    const params: any = { page: 1, view: activeView, status: status === 'all' ? undefined : status };
    if (searchTerm) params.search = searchTerm;
    if (startDate) params.start_date = startDate.toISOString().split('T')[0];
    if (endDate) params.end_date = endDate.toISOString().split('T')[0];
    if (pageFilters.per_page) params.per_page = pageFilters.per_page;
    if (pageFilters.sort_field) { params.sort_field = pageFilters.sort_field; params.sort_direction = pageFilters.sort_direction; }
    router.get(route('vendors.index'), params, { preserveState: true, preserveScroll: true });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters();
  };

  const applyFilters = () => {
    const params: any = { page: 1, view: activeView };
    if (searchTerm) params.search = searchTerm;
    if (activeStatusTab !== 'all') params.status = activeStatusTab;
    if (startDate) params.start_date = startDate.toISOString().split('T')[0];
    if (endDate) params.end_date = endDate.toISOString().split('T')[0];
    if (pageFilters.per_page) params.per_page = pageFilters.per_page;
    if (pageFilters.sort_field) {
      params.sort_field = pageFilters.sort_field;
      params.sort_direction = pageFilters.sort_direction;
    }
    router.get(route('vendors.index'), params, { preserveState: true, preserveScroll: true });
  };

  const handleSort = (field: string) => {
    const direction = pageFilters.sort_field === field && pageFilters.sort_direction === 'asc' ? 'desc' : 'asc';
    const params: any = { sort_field: field, sort_direction: direction, page: 1, view: activeView };
    if (searchTerm) params.search = searchTerm;
    if (activeStatusTab !== 'all') params.status = activeStatusTab;
    if (startDate) params.start_date = startDate.toISOString().split('T')[0];
    if (endDate) params.end_date = endDate.toISOString().split('T')[0];
    if (pageFilters.per_page) params.per_page = pageFilters.per_page;
    router.get(route('vendors.index'), params, { preserveState: true, preserveScroll: true });
  };

  const handleAction = (action: string, item: any) => {
    setCurrentItem(item);
    switch (action) {
      case 'view':
        setIsViewModalOpen(true);
        break;
      case 'edit':
        router.visit(route('vendors.edit', item.id));
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
    router.visit(route('vendors.create'));
  };

  const handleDeleteConfirm = () => {
    toast.loading(t('Deleting vendor...'));
    router.delete(route('vendors.destroy', currentItem.id), {
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
          toast.error(t('Failed to delete vendor') + `: ${Object.values(errors).join(', ')}`);
        }
      }
    });
  };

  const handleToggleStatus = (vendor: any) => {
    const newStatus = vendor.status === 'active' ? 'inactive' : 'active';
    toast.loading(`${newStatus === 'active' ? t('Activating') : t('Deactivating')} vendor...`);
    router.put(route('vendors.toggle-status', vendor.id), {}, {
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
          toast.error(t('Failed to update vendor status') + `: ${Object.values(errors).join(', ')}`);
        }
      }
    });
  };

  const handleResetFilters = () => {
    setActiveStatusTab('all');
    setSearchTerm('');
    isInitialMount.current = true;
    setStartDate(undefined);
    setEndDate(undefined);
    router.get(route('vendors.index'), {
      view: activeView
    }, { preserveState: true, preserveScroll: true });
  };

  const getVendorFields = () => {
    return [
      { key: 'name', required: true },
      { key: 'company_name', required: false },
      { key: 'email', required: true },
      { key: 'phone', required: false },
      { key: 'tax_number', required: false },
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

  const pageActions = [];

  // Add Export button
  if (hasPermission(permissions, 'export-vendors')) {
    pageActions.push({
      label: t('Export'),
      icon: <Download className="h-4 w-4" />,
      variant: 'outline',
      onClick: async () => {
        try {
          const params = new URLSearchParams();
          if (searchTerm) params.append('search', searchTerm);
          if (activeStatusTab && activeStatusTab !== 'all') params.append('status', activeStatusTab);
          if (startDate) params.append('start_date', startDate.toISOString().split('T')[0]);
          if (endDate) params.append('end_date', endDate.toISOString().split('T')[0]);
          if (pageFilters.sort_field) {
            params.append('sort_field', pageFilters.sort_field);
            params.append('sort_direction', pageFilters.sort_direction);
          }
          
          const url = route('vendors.export') + (params.toString() ? '?' + params.toString() : '');
          const response = await fetch(url);
          if (!response.ok) throw new Error('Export failed');
          const blob = await response.blob();
          const downloadUrl = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = downloadUrl;
          a.download = `vendors_export_${new Date().toISOString().split('T')[0]}.xlsx`;
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
  if (hasPermission(permissions, 'import-vendors')) {
    pageActions.push({
      label: t('Import'),
      icon: <Upload className="h-4 w-4" />,
      variant: 'outline',
      onClick: () => setIsImportModalOpen(true)
    });
  }

  // Add the "Add New Vendor" button if user has permission and within limits
  if (hasPermission(permissions, 'create-vendors')) {
    const canCreate = !planLimits || planLimits.can_create;
    pageActions.push({
      label: planLimits && !canCreate ? t('Vendor Limit Reached ({{current}}/{{max}})', { current: planLimits.current_vendors, max: planLimits.max_vendors }) : t('Add Vendor'),
      icon: <Plus className="h-4 w-4" />,
      variant: canCreate ? 'default' : 'outline',
      onClick: canCreate ? () => handleAddNew() : () => toast.error(t('Vendor limit exceeded. Your plan allows maximum {{max}} vendors. Please upgrade your plan.', { max: planLimits.max_vendors })),
      disabled: !canCreate
    });
  }

  const breadcrumbs = [
    { title: t('Dashboard'), href: route('dashboard') },
    { title: t('Contacts'), href: route('vendors.index') },
    { title: t('Vendors') }
  ];

  const columns = [
    {
      key: 'name', label: t('Name'), sortable: true, render: (value: string, row: any) => {
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback>{getInitials(row?.name)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{row?.name || '-'}</div>
              <div className="text-xs text-gray-500">{row?.email || ''}</div>
            </div>
          </div>
        );
      }
    },
    { key: 'company_name', label: t('Company'), sortable: true },
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
      label: t('Address'),
      render: (value: string, row: any) => {
        const parts = [row.billing_address, row.billing_city, row.billing_state].filter(Boolean);
        return parts.join(', ') || '-';
      }
    },
    {
      key: 'status',
      label: t('Status'),
      render: (value: string) => (
        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${value === 'active'
          ? 'bg-green-50 text-green-700 ring-green-600/20'
          : 'bg-red-50 text-red-700 ring-red-600/20'
          }`}>
          {value === 'active' ? t('Active') : t('Inactive')}
        </span>
      )
    },
    {
      key: 'created_at',
      label: t('Created At'),
      sortable: true,
      type: 'date',
      // render: (value: string) => window.appSettings?.formatDateTime(value, false) || new Date(value).toLocaleDateString()
    }
  ];

  const actions = [
    { label: t('Toggle Status'), icon: (item: any) => item.status === 'active' ? 'Lock' : 'Unlock', action: 'toggle-status', className: 'text-amber-500', requiredPermission: 'manage-vendor-status' },
    { label: t('View'), icon: 'Eye', action: 'view', className: 'text-blue-500', requiredPermission: 'view-vendors' },
    { label: t('Edit'), icon: 'Edit', action: 'edit', className: 'text-amber-500', requiredPermission: 'edit-vendors' },
    { label: t('Delete'), icon: 'Trash2', action: 'delete', className: 'text-red-500', requiredPermission: 'delete-vendors' }
  ];

  const totalVendors = kpiCounts?.total || 0;

  const statusTabs = [
    { key: 'all', label: t('All Vendors'), count: statusCounts?.total ?? (vendors?.total || 0), icon: List },
    { key: 'active', label: t('Active'), count: statusCounts?.active || 0, icon: CheckCircle2 },
    { key: 'inactive', label: t('Inactive'), count: statusCounts?.inactive || 0, icon: XCircle },
  ];

  return (
    <PageTemplate title={t("Vendors")} url="/vendors" actions={pageActions} breadcrumbs={breadcrumbs} noPadding description={t('Manage your vendor relationships and supplier information.')}>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

        {/* Total Vendors */}
        <div className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-50 dark:bg-blue-700/20 rounded-bl-full"></div>
          <div className="p-4 relative">
            <div className="flex items-start justify-between mb-3">
              <div className="text-left">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 capitalize tracking-wide mb-1">{t('Total Vendors')}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{totalVendors}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('All time vendors')}</p>
              </div>
              <div className="relative z-10 p-2.5 bg-blue-50 dark:bg-blue-700/20 rounded-xl mt-0.5">
                <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Active Vendors */}
        <div className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-green-50 dark:bg-green-700/20 rounded-bl-full"></div>
          <div className="p-4 relative">
            <div className="flex items-start justify-between mb-3">
              <div className="text-left">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 capitalize tracking-wide mb-1">{t('Active Vendors')}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{kpiCounts?.active || 0}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {totalVendors > 0
                    ? `${(((kpiCounts?.active || 0) / totalVendors) * 100).toFixed(1)}% ${t('of total')}`
                    : `0% ${t('of total')}`
                  }
                </p>
              </div>
              <div className="relative z-10 p-2.5 bg-green-50 dark:bg-green-700/20 rounded-xl mt-0.5">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Inactive Vendors */}
        <div className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-red-50 dark:bg-red-700/20 rounded-bl-full"></div>
          <div className="p-4 relative">
            <div className="flex items-start justify-between mb-3">
              <div className="text-left">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 capitalize tracking-wide mb-1">{t('Inactive Vendors')}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{kpiCounts?.inactive || 0}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {totalVendors > 0
                    ? `${(((kpiCounts?.inactive || 0) / totalVendors) * 100).toFixed(1)}% ${t('of total')}`
                    : `0% ${t('of total')}`
                  }
                </p>
              </div>
              <div className="relative z-10 p-2.5 bg-red-50 dark:bg-red-700/20 rounded-xl mt-0.5">
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
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
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('Added this month')}</p>
              </div>
              <div className="relative z-10 p-2.5 bg-purple-50 dark:bg-purple-700/20 rounded-xl mt-0.5">
                <PackagePlus className="h-5 w-5 text-purple-600 dark:text-purple-400" />
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
          filters={[
            {
              name: 'start_date',
              label: t('Start Date'),
              type: 'date',
              value: startDate,
              onChange: (date) => setStartDate(date)
            },
            {
              name: 'end_date',
              label: t('End Date'),
              type: 'date',
              value: endDate,
              onChange: (date) => setEndDate(date)
            }
          ]}
          hasActiveFilters={hasActiveFilters}
          activeFilterCount={activeFilterCount}
          onResetFilters={handleResetFilters}
          showViewToggle={true}
          activeView={activeView}
          onViewChange={(view) => {
            setActiveView(view);
            const currentUrl = new URL(window.location.href);
            const params = new URLSearchParams(currentUrl.search);
            params.set('view', view);
            if (searchTerm) params.set('search', searchTerm);
            if (activeStatusTab !== 'all') params.set('status', activeStatusTab);
            if (startDate) params.set('start_date', startDate.toISOString().split('T')[0]);
            if (endDate) params.set('end_date', endDate.toISOString().split('T')[0]);
            if (pageFilters.per_page) params.set('per_page', pageFilters.per_page.toString());
            if (pageFilters.page) params.set('page', pageFilters.page.toString());
            if (pageFilters.sort_field) params.set('sort_field', pageFilters.sort_field);
            if (pageFilters.sort_direction) params.set('sort_direction', pageFilters.sort_direction);
            router.get(route('vendors.index'), Object.fromEntries(params), {
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

      {activeView === 'list' ? (
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden">
          <CrudTable
            columns={columns}
            actions={actions}
            data={vendors?.data || []}
            from={vendors?.from || 1}
            onAction={handleAction}
            sortField={pageFilters.sort_field}
            sortDirection={pageFilters.sort_direction}
            onSort={handleSort}
            permissions={permissions}
            entityPermissions={{
              view: 'view-vendors',
              create: 'create-vendors',
              edit: 'edit-vendors',
              delete: 'delete-vendors'
            }}
          />

          <Pagination
            from={vendors?.from || 0}
            to={vendors?.to || 0}
            total={vendors?.total || 0}
            links={vendors?.links}
            entityName={t("vendors")}
            onPageChange={(url) => {
              const urlObj = new URL(url, window.location.origin);
              urlObj.searchParams.set('view', activeView);
              if (searchTerm) urlObj.searchParams.set('search', searchTerm);
              if (activeStatusTab !== 'all') urlObj.searchParams.set('status', activeStatusTab);
              if (startDate) urlObj.searchParams.set('start_date', startDate.toISOString().split('T')[0]);
              if (endDate) urlObj.searchParams.set('end_date', endDate.toISOString().split('T')[0]);
              if (pageFilters.per_page) urlObj.searchParams.set('per_page', pageFilters.per_page.toString());
              if (pageFilters.sort_field) urlObj.searchParams.set('sort_field', pageFilters.sort_field);
              if (pageFilters.sort_direction) urlObj.searchParams.set('sort_direction', pageFilters.sort_direction);
              router.get(urlObj.toString(), {}, { preserveState: true, preserveScroll: true });
            }}
            currentPerPage={pageFilters.per_page?.toString() || "10"}
            onPerPageChange={(value) => {
              const params: any = { page: 1, per_page: parseInt(value), view: activeView };
              if (searchTerm) params.search = searchTerm;
              if (activeStatusTab !== 'all') params.status = activeStatusTab;
              if (startDate) params.start_date = startDate.toISOString().split('T')[0];
              if (endDate) params.end_date = endDate.toISOString().split('T')[0];
              if (pageFilters.sort_field) {
                params.sort_field = pageFilters.sort_field;
                params.sort_direction = pageFilters.sort_direction;
              }
              router.get(route('vendors.index'), params, { preserveState: true, preserveScroll: true });
            }}
          />
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {vendors?.data?.map((vendor: any) => (
              <Card key={vendor.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm">
                {/* Top: Avatar + Name + Email */}
                <div className="p-4 flex items-center gap-3">
                  <Avatar className="h-12 w-12 shrink-0">
                    <AvatarFallback>{getInitials(vendor.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white truncate">{vendor.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{vendor.email || '-'}</p>
                    {vendor.company_name && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{vendor.company_name}</p>
                    )}
                  </div>
                </div>

                {/* Address */}
                {(vendor.billing_city || vendor.billing_state) && (
                  <div className="px-4 pb-2">
                    <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                      {[vendor.billing_city, vendor.billing_state, vendor.billing_country].filter(Boolean).join(', ')}
                    </p>
                  </div>
                )}

                {/* Divider */}
                <div className="border-t border-gray-100 dark:border-gray-700" />

                {/* Bottom: Action icons (left) + Status badge (right) */}
                <div className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {hasPermission(permissions, 'manage-vendor-status') && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-500" onClick={() => handleAction('toggle-status', vendor)}>
                            {vendor.status === 'active' ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t('Toggle Status')}</TooltipContent>
                      </Tooltip>
                    )}
                    {hasPermission(permissions, 'view-vendors') && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-500" onClick={() => handleAction('view', vendor)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t('View')}</TooltipContent>
                      </Tooltip>
                    )}
                    {hasPermission(permissions, 'edit-vendors') && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-500" onClick={() => handleAction('edit', vendor)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t('Edit')}</TooltipContent>
                      </Tooltip>
                    )}
                    {hasPermission(permissions, 'delete-vendors') && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-500" onClick={() => handleAction('delete', vendor)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t('Delete')}</TooltipContent>
                      </Tooltip>
                    )}
                  </div>

                  {/* Status badge */}
                  <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                    vendor.status === 'active'
                      ? 'bg-green-50 text-green-700 ring-green-600/20'
                      : 'bg-red-50 text-red-700 ring-red-600/20'
                  }`}>
                    {vendor.status === 'active' ? t('Active') : t('Inactive')}
                  </span>
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-6 bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden">
            <Pagination
              from={vendors?.from || 0}
              to={vendors?.to || 0}
              total={vendors?.total || 0}
              links={vendors?.links}
              entityName={t("vendors")}
              onPageChange={(url) => {
                const urlObj = new URL(url, window.location.origin);
                urlObj.searchParams.set('view', activeView);
                if (searchTerm) urlObj.searchParams.set('search', searchTerm);
                if (activeStatusTab !== 'all') urlObj.searchParams.set('status', activeStatusTab);
                if (startDate) urlObj.searchParams.set('start_date', startDate.toISOString().split('T')[0]);
                if (endDate) urlObj.searchParams.set('end_date', endDate.toISOString().split('T')[0]);
                if (pageFilters.per_page) urlObj.searchParams.set('per_page', pageFilters.per_page.toString());
                if (pageFilters.sort_field) urlObj.searchParams.set('sort_field', pageFilters.sort_field);
                if (pageFilters.sort_direction) urlObj.searchParams.set('sort_direction', pageFilters.sort_direction);
                router.get(urlObj.toString(), {}, { preserveState: true, preserveScroll: true });
              }}
              currentPerPage={pageFilters.per_page?.toString() || "10"}
              onPerPageChange={(value) => {
                const params: any = { page: 1, per_page: parseInt(value), view: activeView };
                if (searchTerm) params.search = searchTerm;
                if (activeStatusTab !== 'all') params.status = activeStatusTab;
                if (startDate) params.start_date = startDate.toISOString().split('T')[0];
                if (endDate) params.end_date = endDate.toISOString().split('T')[0];
                if (pageFilters.sort_field) {
                  params.sort_field = pageFilters.sort_field;
                  params.sort_direction = pageFilters.sort_direction;
                }
                router.get(route('vendors.index'), params, { preserveState: true, preserveScroll: true });
              }}
            />
          </div>
        </div>
      )}

      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        {currentItem && <ViewPopup record={currentItem} />}
      </Dialog>

      <CrudDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        itemName={currentItem?.name || ''}
        entityName="vendor"
      />

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title={t('Import Vendors')}
        importRoute="vendors.import-data"
        parseRoute="vendors.parse"
        samplePath={route('vendor.download.template')}
        importNotes={t('Please ensure your CSV file contains the required columns. Name is required. Duplicate entries (same email or phone) will be skipped.')}
        databaseFields={getVendorFields()}
      />
    </PageTemplate>
  );
}
