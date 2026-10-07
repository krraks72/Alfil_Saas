import { useState } from 'react';
import { PageTemplate } from '@/components/page-template';
import { usePage, router } from '@inertiajs/react';
import { Plus, Bell, CheckCircle, XCircle } from 'lucide-react';
import { hasPermission } from '@/utils/authorization';
import { CrudTable } from '@/components/CrudTable';
import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import { toast } from '@/components/custom-toast';
import { useTranslation } from 'react-i18next';
import { Pagination } from '@/components/ui/pagination';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';
import { Dialog } from '@/components/ui/dialog';
import ViewNotification from './view';

export default function Notifications() {
  const { t } = useTranslation();
  const { auth, notifications, statusCounts, totalNotifications, filters: pageFilters = {} } = usePage().props as any;
  const permissions = auth?.permissions || [];

  const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
  const [activeStatusTab, setActiveStatusTab] = useState(pageFilters.status || 'all');
  const [dateFromFilter, setDateFromFilter] = useState(pageFilters.from_date || '');
  const [dateToFilter, setDateToFilter] = useState(pageFilters.to_date || '');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);

  const hasActiveFilters = () => searchTerm !== '' || (activeStatusTab !== '' && activeStatusTab !== 'all') || dateFromFilter !== '' || dateToFilter !== '';
  const activeFilterCount = () => (searchTerm ? 1 : 0) + (activeStatusTab && activeStatusTab !== 'all' ? 1 : 0) + (dateFromFilter ? 1 : 0) + (dateToFilter ? 1 : 0);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters();
  };

  const applyFilters = () => {
    const params: any = { page: 1 };
    if (searchTerm) params.search = searchTerm;
    if (activeStatusTab && activeStatusTab !== 'all') params.status = activeStatusTab;
    if (dateFromFilter) params.from_date = dateFromFilter;
    if (dateToFilter) params.to_date = dateToFilter;
    if (pageFilters.per_page) params.per_page = pageFilters.per_page;
    router.get(route('notifications.index'), params, { preserveState: true, preserveScroll: true });
  };

  const handleStatusTabChange = (status: string) => {
    setActiveStatusTab(status);
    const params: any = { page: 1, status: status === 'all' ? undefined : status };
    if (searchTerm) params.search = searchTerm;
    if (dateFromFilter) params.from_date = dateFromFilter;
    if (dateToFilter) params.to_date = dateToFilter;
    if (pageFilters.per_page) params.per_page = pageFilters.per_page;
    if (pageFilters.sort_by) params.sort_by = pageFilters.sort_by;
    if (pageFilters.sort_order) params.sort_order = pageFilters.sort_order;
    router.get(route('notifications.index'), params, { preserveState: true, preserveScroll: true });
  };

  const handleSort = (field: string) => {
    const direction = pageFilters.sort_by === field && pageFilters.sort_order === 'asc' ? 'desc' : 'asc';
    const params: any = { sort_by: field, sort_order: direction, page: 1 };
    if (searchTerm) params.search = searchTerm;
    if (activeStatusTab && activeStatusTab !== 'all') params.status = activeStatusTab;
    if (dateFromFilter) params.from_date = dateFromFilter;
    if (dateToFilter) params.to_date = dateToFilter;
    if (pageFilters.per_page) params.per_page = pageFilters.per_page;
    router.get(route('notifications.index'), params, { preserveState: true, preserveScroll: true });
  };

  const handleResetFilters = () => {
    router.get(route('notifications.index'));
  };

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<any>(null);

  const handleAction = (action: string, item: any) => {
    setCurrentItem(item);
    switch (action) {
      case 'view':
        setSelectedNotification(item);
        setIsViewModalOpen(true);
        break;
      case 'edit':
        router.visit(route('notifications.edit', item.id));
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
    router.visit(route('notifications.create'));
  };

  const handleToggleStatus = (notification: any) => {
    const newStatus = notification.status === 'active' ? 'inactive' : 'active';
    toast.loading(`${newStatus === 'active' ? t('Activating') : t('Deactivating')} notification...`);

    router.put(route('notifications.toggle-status', notification.id), {}, {
      onSuccess: (page) => {
        toast.dismiss();
        if (page.props.flash.success) {
          toast.success(page.props.flash.success);
        } else if (page.props.flash.error) {
          toast.error(page.props.flash.error);
        }
      },
      onError: (errors) => {
        toast.dismiss();
        if (typeof errors === 'string') {
          toast.error(errors);
        } else {
          toast.error(t('Network error occurred'));
        }
      }
    });
  };

  const handleDeleteConfirm = () => {
    toast.loading(t('Deleting notification...'));

    router.delete(route('notifications.destroy', currentItem.id), {
      onSuccess: (page) => {
        setIsDeleteModalOpen(false);
        toast.dismiss();
        if (page.props.flash.success) {
          toast.success(page.props.flash.success);
        } else if (page.props.flash.error) {
          toast.error(page.props.flash.error);
        }
      },
      onError: (errors) => {
        toast.dismiss();
        if (typeof errors === 'string') {
          toast.error(errors);
        } else {
          toast.error(t('Network error occurred'));
        }
      }
    });
  };

  const pageActions = [];
  if (hasPermission(permissions, 'create-notifications')) {
    pageActions.push({
      label: t('Add Notification'),
      icon: <Plus className="h-4 w-4" />,
      variant: 'default',
      onClick: () => handleAddNew()
    });
  }

  const breadcrumbs = [
    { title: t('Dashboard'), href: route('dashboard') },
    { title: t('Notifications') }
  ];

  const filterOptions = [
    {
      name: 'from_date',
      label: t('From Date'),
      type: 'date' as const,
      value: dateFromFilter ? new Date(dateFromFilter) : undefined,
      onChange: (date: Date | undefined) => {
        const val = date ? date.toISOString().split('T')[0] : '';
        setDateFromFilter(val);
        const params: any = { page: 1 };
        if (searchTerm) params.search = searchTerm;
        if (activeStatusTab && activeStatusTab !== 'all') params.status = activeStatusTab;
        if (val) params.from_date = val;
        if (dateToFilter) params.to_date = dateToFilter;
        if (pageFilters.per_page) params.per_page = pageFilters.per_page;
        if (pageFilters.sort_by) params.sort_by = pageFilters.sort_by;
        if (pageFilters.sort_order) params.sort_order = pageFilters.sort_order;
        router.get(route('notifications.index'), params, { preserveState: true, preserveScroll: true });
      }
    },
    {
      name: 'to_date',
      label: t('To Date'),
      type: 'date' as const,
      value: dateToFilter ? new Date(dateToFilter) : undefined,
      onChange: (date: Date | undefined) => {
        const val = date ? date.toISOString().split('T')[0] : '';
        setDateToFilter(val);
        const params: any = { page: 1 };
        if (searchTerm) params.search = searchTerm;
        if (activeStatusTab && activeStatusTab !== 'all') params.status = activeStatusTab;
        if (dateFromFilter) params.from_date = dateFromFilter;
        if (val) params.to_date = val;
        if (pageFilters.per_page) params.per_page = pageFilters.per_page;
        if (pageFilters.sort_by) params.sort_by = pageFilters.sort_by;
        if (pageFilters.sort_order) params.sort_order = pageFilters.sort_order;
        router.get(route('notifications.index'), params, { preserveState: true, preserveScroll: true });
      }
    }
  ];

  const statusTabs = [
    { key: 'all', label: t('All Notifications'), count: totalNotifications || 0, icon: Bell },
    { key: 'active', label: t('Active'), count: statusCounts?.active || 0, icon: CheckCircle },
    { key: 'inactive', label: t('Inactive'), count: statusCounts?.inactive || 0, icon: XCircle }
  ];

  const columns = [
    {
      key: 'title',
      label: t('Title'),
      sortable: true,
      render: (value: string, row: any) => (
        <div className="flex items-center">
          <button
            onClick={() => {
              setSelectedNotification(row);
              setIsViewModalOpen(true);
            }}
            className="text-blue-600 hover:text-primary font-medium text-left"
          >
            {value}
          </button>
        </div>
      )
    },
    {
      key: 'description',
      label: t('Description'),
      render: (value: string) => (
        <div className="max-w-xs truncate" title={value}>
          {value}
        </div>
      )
    },
    { key: 'from_date', label: t('From Date'), type: 'date' },
    // { key: 'from_date', label: t('From Date'), render: (value: string) => window.appSettings.formatDateTime(new Date(value),false) },
    // { key: 'to_date', label: t('To Date'), render: (value: string) => window.appSettings.formatDateTime(new Date(value),false) },
    { key: 'to_date', label: t('To Date'), type: 'date' },
    {
      key: 'status',
      label: t('Status'),
      render: (value: string) => (
        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${value === 'active' ? 'bg-green-50 text-green-700 ring-green-600/20' : 'bg-red-50 text-red-700 ring-red-600/20'
          }`}>
          {value === 'active' ? t('Active') : t('Inactive')}
        </span>
      )
    }
  ];

  const actions = [
    {
      label: t('Toggle Status'),
      icon: (item: any) => item.status === 'active' ? 'Lock' : 'Unlock',
      action: 'toggle-status',
      className: 'text-amber-500',
      requiredPermission: 'manage-notification-status'
    },
    { label: t('View'), icon: 'Eye', action: 'view', className: 'text-blue-500', requiredPermission: 'view-notifications' },
    { label: t('Edit'), icon: 'Edit', action: 'edit', className: 'text-amber-500', requiredPermission: 'edit-notifications' },
    { label: t('Delete'), icon: 'Trash2', action: 'delete', className: 'text-red-500', requiredPermission: 'delete-notifications' }
  ];

  return (
    <PageTemplate title={t("Notifications")} url="/notifications" description={t('Manage notifications for your business.')} actions={pageActions} breadcrumbs={breadcrumbs} noPadding>
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow mb-4 border">
        <SearchAndFilterBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onSearch={handleSearch}
          filters={filterOptions}
          hasActiveFilters={hasActiveFilters}
          activeFilterCount={activeFilterCount}
          onResetFilters={handleResetFilters}
        />
        <div className="border-t border-gray-200 dark:border-gray-700 mb-1"></div>
        <div className="bg-white dark:bg-gray-900 ml-2 mr-2">
          <div className="flex space-x-0 overflow-x-auto">
            {statusTabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <div key={tab.key} className="relative">
                  <button
                    onClick={() => handleStatusTabChange(tab.key)}
                    className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors clickable ${
                      activeStatusTab === tab.key ? 'text-primary' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <IconComponent className="h-4 w-4" />
                    <span>{tab.label}</span>
                    <span className={`inline-flex items-center justify-center px-2 py-1 text-xs font-bold rounded-full ${
                      activeStatusTab === tab.key ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
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
          data={notifications?.data || []}
          from={notifications?.from || 1}
          onAction={handleAction}
          sortField={pageFilters.sort_by}
          sortDirection={pageFilters.sort_order}
          onSort={handleSort}
          permissions={permissions}
          entityPermissions={{
            view: 'view-notifications',
            create: 'create-notifications',
            edit: 'edit-notifications',
            delete: 'delete-notifications'
          }}
        />

        <Pagination
          from={notifications?.from || 0}
          to={notifications?.to || 0}
          total={notifications?.total || 0}
          links={notifications?.links || []}
          entityName={t("notifications")}
          onPageChange={(url) => {
            if (url) {
              const urlObj = new URL(url, window.location.origin);
              if (pageFilters.per_page) urlObj.searchParams.set('per_page', pageFilters.per_page.toString());
              if (pageFilters.search) urlObj.searchParams.set('search', pageFilters.search);
              if (pageFilters.status && pageFilters.status !== 'all') urlObj.searchParams.set('status', pageFilters.status);
              if (pageFilters.from_date) urlObj.searchParams.set('from_date', pageFilters.from_date);
              if (pageFilters.to_date) urlObj.searchParams.set('to_date', pageFilters.to_date);
              if (pageFilters.sort_by) urlObj.searchParams.set('sort_by', pageFilters.sort_by);
              if (pageFilters.sort_order) urlObj.searchParams.set('sort_order', pageFilters.sort_order);
              router.get(urlObj.toString(), {}, { preserveState: true, preserveScroll: true });
            }
          }}
          currentPerPage={pageFilters.per_page?.toString() || "10"}
          onPerPageChange={(value) => {
            const params: any = { page: 1, per_page: parseInt(value) };
            if (searchTerm) params.search = searchTerm;
            if (activeStatusTab && activeStatusTab !== 'all') params.status = activeStatusTab;
            if (dateFromFilter) params.from_date = dateFromFilter;
            if (dateToFilter) params.to_date = dateToFilter;
            if (pageFilters.sort_by) params.sort_by = pageFilters.sort_by;
            if (pageFilters.sort_order) params.sort_order = pageFilters.sort_order;
            router.get(route('notifications.index'), params, { preserveState: true, preserveScroll: true });
          }}
        />
      </div>

      <CrudDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        itemName={currentItem?.title || ''}
        entityName="notification"
      />

      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <ViewNotification record={selectedNotification} />
      </Dialog>
    </PageTemplate>
  );
}