import { PageTemplate } from '@/components/page-template';
import { CrudTable } from '@/components/CrudTable';
import { couponsConfig } from '@/config/crud/coupons';
import { useEffect, useState, useRef } from 'react';
import { usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Pagination } from '@/components/ui/pagination';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';
import { CrudFormModal } from '@/components/CrudFormModal';
import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import { toast } from '@/components/custom-toast';
import { Plus, List, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function CouponsPage() {
  const { t } = useTranslation();
  const { auth, globalSettings, coupons, statusCounts, filters: pageFilters = {} } = usePage().props as any;
  const permissions = auth?.permissions || [];

  const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
  const [filterValues, setFilterValues] = useState<Record<string, any>>({
    type: pageFilters.type || 'all',
  });
  const [dateFrom, setDateFrom] = useState<Date | undefined>(pageFilters.date_from ? new Date(pageFilters.date_from) : undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(pageFilters.date_to ? new Date(pageFilters.date_to) : undefined);
  const [activeStatus, setActiveStatus] = useState(pageFilters.status || 'all');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');

  const isInitialMount = useRef(true);

  const applyFilters = (status?: string) => {
    const params: any = { page: 1 };
    if (searchTerm) params.search = searchTerm;
    Object.entries(filterValues).forEach(([key, value]) => {
      if (value && value !== '' && value !== 'all') params[key] = value;
    });
    if (dateFrom) params.date_from = format(dateFrom, 'yyyy-MM-dd');
    if (dateTo) params.date_to = format(dateTo, 'yyyy-MM-dd');
    const currentStatus = status !== undefined ? status : activeStatus;
    if (currentStatus && currentStatus !== 'all') params.status = currentStatus;
    if (pageFilters.sort_by) {
      params.sort_by = pageFilters.sort_by;
      params.sort_order = pageFilters.sort_order;
    }
    if (pageFilters.per_page) params.per_page = pageFilters.per_page;
    router.get(route('coupons.index'), params, { preserveState: true, preserveScroll: true });
  };

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    applyFilters();
  }, [filterValues, dateFrom, dateTo]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters();
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilterValues(prev => ({ ...prev, [key]: value }));
  };

  const handleStatusTabChange = (status: string) => {
    setActiveStatus(status);
    applyFilters(status);
  };

  const handleSort = (field: string) => {
    const direction = pageFilters.sort_by === field && pageFilters.sort_order === 'asc' ? 'desc' : 'asc';
    const params: any = { sort_by: field, sort_order: direction, page: 1 };
    if (searchTerm) params.search = searchTerm;
    Object.entries(filterValues).forEach(([key, value]) => {
      if (value && value !== '' && value !== 'all') params[key] = value;
    });
    if (dateFrom) params.date_from = format(dateFrom, 'yyyy-MM-dd');
    if (dateTo) params.date_to = format(dateTo, 'yyyy-MM-dd');
    if (activeStatus !== 'all') params.status = activeStatus;
    if (pageFilters.per_page) params.per_page = pageFilters.per_page;
    router.get(route('coupons.index'), params, { preserveState: true, preserveScroll: true });
  };

  const handleAction = (action: string, item: any) => {
    setCurrentItem(item);
    if (action === 'edit') { setFormMode('edit'); setIsFormModalOpen(true); }
    else if (action === 'delete') setIsDeleteModalOpen(true);
    else if (action === 'view') { setFormMode('view'); setIsFormModalOpen(true); }
  };

  const handleFormSubmit = (formData: any) => {
    const processed = { ...formData };
    if (couponsConfig.hooks?.beforeCreate && formMode === 'create') couponsConfig.hooks.beforeCreate(processed);
    if (couponsConfig.hooks?.beforeUpdate && formMode === 'edit') couponsConfig.hooks.beforeUpdate(processed);

    if (formMode === 'create') {
      if (!globalSettings?.is_demo) toast.loading(t('Creating...'));
      router.post(route('coupons.store'), processed, {
        onSuccess: (page) => {
          setIsFormModalOpen(false);
          if (!globalSettings?.is_demo) toast.dismiss();
          if (page.props.flash?.success) toast.success(t(page.props.flash.success));
          else if (page.props.flash?.error) toast.error(t(page.props.flash.error));
        },
        onError: (errors) => {
          if (!globalSettings?.is_demo) toast.dismiss();
          toast.error(typeof errors === 'string' ? t(errors) : Object.values(errors).join(', '));
        }
      });
    } else if (formMode === 'edit') {
      if (!globalSettings?.is_demo) toast.loading(t('Updating...'));
      router.put(route('coupons.update', currentItem.id), processed, {
        onSuccess: (page) => {
          setIsFormModalOpen(false);
          if (!globalSettings?.is_demo) toast.dismiss();
          if (page.props.flash?.success) toast.success(t(page.props.flash.success));
          else if (page.props.flash?.error) toast.error(t(page.props.flash.error));
        },
        onError: (errors) => {
          if (!globalSettings?.is_demo) toast.dismiss();
          toast.error(typeof errors === 'string' ? t(errors) : Object.values(errors).join(', '));
        }
      });
    }
  };

  const handleDeleteConfirm = () => {
    if (!globalSettings?.is_demo) toast.loading(t('Deleting...'));
    router.delete(route('coupons.destroy', currentItem.id), {
      onSuccess: (page) => {
        setIsDeleteModalOpen(false);
        if (!globalSettings?.is_demo) toast.dismiss();
        if (page.props.flash?.success) toast.success(t(page.props.flash.success));
        else if (page.props.flash?.error) toast.error(t(page.props.flash.error));
      },
      onError: (errors) => {
        if (!globalSettings?.is_demo) toast.dismiss();
        toast.error(typeof errors === 'string' ? t(errors) : Object.values(errors).join(', '));
      }
    });
  };

  const hasActiveFilters = () =>
    Object.values(filterValues).some(v => v && v !== '' && v !== 'all') ||
    !!dateFrom || !!dateTo || searchTerm !== '' || activeStatus !== 'all';

  const activeFilterCount = () =>
    Object.values(filterValues).filter(v => v && v !== '' && v !== 'all').length +
    (dateFrom ? 1 : 0) + (dateTo ? 1 : 0) +
    (searchTerm ? 1 : 0) + (activeStatus !== 'all' ? 1 : 0);

  const translatedColumns = couponsConfig.table.columns.map(col => ({ ...col, label: t(col.label) }));
  const translatedActions = couponsConfig.table.actions?.map(action => ({ ...action, label: t(action.label) }));

  const translatedForm = {
    ...couponsConfig.form,
    fields: couponsConfig.form.fields.map(field => ({
      ...field,
      label: t(field.label),
      placeholder: field.placeholder ? t(field.placeholder) : undefined,
      options: field.options ? field.options.map(opt => ({ ...opt, label: t(opt.label) })) : undefined,
    })),
  };

  const breadcrumbs = [
    { title: t('Dashboard'), href: route('dashboard') },
    { title: t('Coupons') },
  ];

  const nonStatusFilters = couponsConfig.filters?.filter(f => f.key !== 'status') || [];

  return (
    <PageTemplate
      title={t('Coupons')}
      url="/coupons"
      breadcrumbs={breadcrumbs}
      noPadding
      description={t('Manage your coupons and discounts.')}
      actions={
        permissions.includes(couponsConfig.entity.permissions.create) ? [{
          label: t('Add Coupon'),
          icon: <Plus className="h-4 w-4" />,
          variant: 'default',
          onClick: () => { setCurrentItem(null); setFormMode('create'); setIsFormModalOpen(true); }
        }] : []
      }
    >
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow mb-4 border">
        <SearchAndFilterBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onSearch={handleSearch}
          filters={[
            ...nonStatusFilters.map(filter => ({
              name: filter.key,
              label: t(filter.label),
              type: 'select' as const,
              value: filterValues[filter.key] || '',
              onChange: (value: any) => handleFilterChange(filter.key, value),
              options: filter.options?.map(opt => ({ value: opt.value, label: t(opt.label) })) || [],
            })),
            {
              name: 'date_from',
              label: t('Date From'),
              type: 'date' as const,
              value: dateFrom,
              onChange: (date: Date | undefined) => setDateFrom(date),
            },
            {
              name: 'date_to',
              label: t('Date To'),
              type: 'date' as const,
              value: dateTo,
              onChange: (date: Date | undefined) => setDateTo(date),
            },
          ]}
          hasActiveFilters={hasActiveFilters}
          activeFilterCount={activeFilterCount}
          onResetFilters={() => {
            isInitialMount.current = true;
            setSearchTerm('');
            setFilterValues({ type: 'all' });
            setDateFrom(undefined);
            setDateTo(undefined);
            setActiveStatus('all');
            router.get(route('coupons.index'), {}, { preserveState: true, preserveScroll: true });
          }}
        />
        <div className="border-t border-gray-200 dark:border-gray-700 mb-1"></div>
        <div className="bg-white dark:bg-gray-900 ml-2 mr-2">
          <div className="flex space-x-0 overflow-x-auto">
            {[
              { key: 'all',      label: t('All Coupons'), count: statusCounts?.total    ?? (coupons?.total || 0), icon: List },
              { key: '1',        label: t('Active'),      count: statusCounts?.active   || 0,                     icon: CheckCircle },
              { key: '0',        label: t('Inactive'),    count: statusCounts?.inactive || 0,                     icon: XCircle },
            ].map((tab) => {
              const IconComponent = tab.icon;
              return (
                <div key={tab.key} className="relative">
                  <button
                    onClick={() => handleStatusTabChange(tab.key)}
                    className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                      activeStatus === tab.key ? 'text-primary' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <IconComponent className="h-4 w-4" />
                    <span>{tab.label}</span>
                    <span className={`inline-flex items-center justify-center px-2 py-1 text-xs font-bold rounded-full ${
                      activeStatus === tab.key ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                  {activeStatus === tab.key && (
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
          columns={translatedColumns}
          actions={translatedActions}
          data={coupons?.data || []}
          from={coupons?.from || 1}
          onAction={handleAction}
          sortField={pageFilters.sort_by}
          sortDirection={pageFilters.sort_order}
          onSort={handleSort}
          permissions={permissions}
          entityPermissions={couponsConfig.entity.permissions}
        />

        <Pagination
          from={coupons?.from || 0}
          to={coupons?.to || 0}
          total={coupons?.total || 0}
          links={coupons?.links}
          entityName={t('coupons')}
          onPageChange={(url) => {
            if (url) {
              const urlObj = new URL(url, window.location.origin);
              if (pageFilters.per_page) urlObj.searchParams.set('per_page', pageFilters.per_page.toString());
              if (searchTerm) urlObj.searchParams.set('search', searchTerm);
              if (pageFilters.sort_by) {
                urlObj.searchParams.set('sort_by', pageFilters.sort_by);
                urlObj.searchParams.set('sort_order', pageFilters.sort_order);
              }
              if (activeStatus !== 'all') urlObj.searchParams.set('status', activeStatus);
              if (dateFrom) urlObj.searchParams.set('date_from', format(dateFrom, 'yyyy-MM-dd'));
              if (dateTo) urlObj.searchParams.set('date_to', format(dateTo, 'yyyy-MM-dd'));
              Object.entries(filterValues).forEach(([key, val]) => {
                if (val && val !== '' && val !== 'all') urlObj.searchParams.set(key, val);
              });
              router.get(urlObj.toString(), {}, { preserveState: true, preserveScroll: true });
            }
          }}
          currentPerPage={pageFilters.per_page?.toString() || '10'}
          onPerPageChange={(value) => {
            const params: any = { page: 1, per_page: parseInt(value) };
            if (searchTerm) params.search = searchTerm;
            if (activeStatus !== 'all') params.status = activeStatus;
            if (dateFrom) params.date_from = format(dateFrom, 'yyyy-MM-dd');
            if (dateTo) params.date_to = format(dateTo, 'yyyy-MM-dd');
            Object.entries(filterValues).forEach(([key, val]) => {
              if (val && val !== '' && val !== 'all') params[key] = val;
            });
            if (pageFilters.sort_by) {
              params.sort_by = pageFilters.sort_by;
              params.sort_order = pageFilters.sort_order;
            }
            router.get(route('coupons.index'), params, { preserveState: true, preserveScroll: true });
          }}
        />
      </div>

      <CrudFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleFormSubmit}
        formConfig={{ ...translatedForm, modalSize: couponsConfig.modalSize || translatedForm.modalSize }}
        initialData={currentItem}
        title={
          formMode === 'create' ? t('Add New Coupon')
          : formMode === 'edit' ? t('Edit Coupon')
          : t('View Coupon')
        }
        mode={formMode}
      />

      <CrudDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        itemName={currentItem?.name || ''}
        entityName="coupon"
      />
    </PageTemplate>
  );
}
