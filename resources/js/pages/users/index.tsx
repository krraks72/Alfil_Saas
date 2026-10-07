// pages/users/index.tsx
import { useState, useEffect, useRef } from 'react';
import { usersConfig } from '@/config/crud/users';
import { PageTemplate } from '@/components/page-template';
import { usePage, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Filter, Search, Plus, Eye, Edit, Trash2, KeyRound, Lock, Unlock, LayoutGrid, List, MoreHorizontal, History, UserCheck, UserX } from 'lucide-react';
import { hasPermission } from '@/utils/authorization';
import { CrudTable } from '@/components/CrudTable';
import { CrudFormModal } from '@/components/CrudFormModal';
import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import { Dialog } from '@/components/ui/dialog';
import ViewPopup from './view';
import { toast } from '@/components/custom-toast';
import { useInitials } from '@/hooks/use-initials';
import { useTranslation } from 'react-i18next';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function Users() {
  const { t } = useTranslation();
  const { auth, users, roles, planLimits, statusCounts, filters: pageFilters = {} } = usePage().props as any;
  const permissions = auth?.permissions || [];
  const getInitials = useInitials();

  // State - Initialize activeView from URL params or localStorage, fallback to 'list'
  const [activeView, setActiveView] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const viewFromUrl = urlParams.get('view');
    if (viewFromUrl && ['list', 'grid'].includes(viewFromUrl)) {
      return viewFromUrl as 'list' | 'grid';
    }
    const savedView = localStorage.getItem('users_view');
    if (savedView && ['list', 'grid'].includes(savedView)) {
      return savedView as 'list' | 'grid';
    }
    return 'list';
  });
  const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
  const [startDate, setStartDate] = useState<Date | undefined>(pageFilters.start_date ? new Date(pageFilters.start_date) : undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(pageFilters.end_date ? new Date(pageFilters.end_date) : undefined);
  const [selectedRole, setSelectedRole] = useState(pageFilters.role || 'all');
  const [selectedStatus, setSelectedStatus] = useState(pageFilters.status || 'all');
  const [showFilters, setShowFilters] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');

  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
    } else {
      applyFilters();
    }
  }, [selectedRole, selectedStatus, startDate, endDate]);

  // Check if any filters are active
  const hasActiveFilters = () => {
    return selectedRole !== 'all' || selectedStatus !== 'all' || searchTerm !== '' || startDate !== undefined || endDate !== undefined;
  };

  // Count active filters
  const activeFilterCount = () => {
    return (selectedRole !== 'all' ? 1 : 0) +
      (selectedStatus !== 'all' ? 1 : 0) +
      (searchTerm ? 1 : 0) +
      (startDate ? 1 : 0) +
      (endDate ? 1 : 0);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters();
  };

  const applyFilters = () => {
    const params: any = { page: 1 };

    if (searchTerm) {
      params.search = searchTerm;
    }

    if (selectedRole !== 'all') {
      params.role = selectedRole;
    }

    if (selectedStatus !== 'all') {
      params.status = selectedStatus;
    }

    if (startDate) {
      params.start_date = startDate.toISOString().split('T')[0];
    }

    if (endDate) {
      params.end_date = endDate.toISOString().split('T')[0];
    }

    // Add per_page if it exists
    if (pageFilters.per_page) {
      params.per_page = pageFilters.per_page;
    }

    // Preserve current view
    params.view = activeView;

    if (pageFilters.sort_field) {
      params.sort_field = pageFilters.sort_field;
      params.sort_direction = pageFilters.sort_direction;
    }

    router.get(route('users.index'), params, { preserveState: true, preserveScroll: true });
  };

  const handleRoleFilter = (value: string) => {
    setSelectedRole(value);
  };

  const handleStatusTabChange = (status: string) => {
    setSelectedStatus(status);
    const params: any = { page: 1, view: activeView };
    if (searchTerm) params.search = searchTerm;
    if (selectedRole !== 'all') params.role = selectedRole;
    if (status !== 'all') params.status = status;
    if (startDate) params.start_date = startDate.toISOString().split('T')[0];
    if (endDate) params.end_date = endDate.toISOString().split('T')[0];
    if (pageFilters.per_page) params.per_page = pageFilters.per_page;
    if (pageFilters.sort_field) { params.sort_field = pageFilters.sort_field; params.sort_direction = pageFilters.sort_direction; }
    router.get(route('users.index'), params, { preserveState: true, preserveScroll: true });
  };

  const handleSort = (field: string) => {
    const direction = pageFilters.sort_field === field && pageFilters.sort_direction === 'asc' ? 'desc' : 'asc';

    const params: any = {
      sort_field: field,
      sort_direction: direction,
      page: 1
    };

    // Add search and filters
    if (searchTerm) {
      params.search = searchTerm;
    }

    if (selectedRole !== 'all') {
      params.role = selectedRole;
    }

    if (selectedStatus !== 'all') {
      params.status = selectedStatus;
    }

    if (startDate) {
      params.start_date = startDate.toISOString().split('T')[0];
    }

    if (endDate) {
      params.end_date = endDate.toISOString().split('T')[0];
    }

    // Add per_page if it exists
    if (pageFilters.per_page) {
      params.per_page = pageFilters.per_page;
    }

    // Preserve current view
    params.view = activeView;

    router.get(route('users.index'), params, { preserveState: true, preserveScroll: true });
  };

  const handleAction = (action: string, item: any) => {
    setCurrentItem(item);

    switch (action) {
      case 'view':
        setIsViewModalOpen(true);
        break;
      case 'edit':
        setFormMode('edit');
        setIsFormModalOpen(true);
        break;
      case 'delete':
        setIsDeleteModalOpen(true);
        break;
      case 'reset-password':
        setIsResetPasswordModalOpen(true);
        break;
      case 'toggle-status':
        handleToggleStatus(item);
        break;
      default:
        break;
    }
  };

  const handleAddNew = () => {
    setCurrentItem(null);
    setFormMode('create');
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = (formData: any) => {
    // Keep roles as single string value, not array
    if (formData.roles && Array.isArray(formData.roles)) {
      formData.roles = formData.roles[0];
    }

    if (formMode === 'create') {
      toast.loading(t('Creating user...'));

      router.post(route('users.store'), formData, {
        onSuccess: (page) => {
          setIsFormModalOpen(false);
          toast.dismiss();
          if (page.props.flash?.success) {
            toast.success(t(page.props.flash.success));
          } else if (page.props.flash?.error) {
            toast.error(t(page.props.flash.error));
          } else if (page.props.flash?.warning) {
            toast.warning(page.props.flash.warning);
          } else {
            toast.success(t('User created successfully'));
          }
        },
        onError: (errors) => {

          toast.dismiss();
          if (typeof errors === 'string') {
            toast.error(errors);
          } else {
            toast.error(t('Failed to create user') + `: ${Object.values(errors).join(', ')}`);
          }
        }
      });


    } else if (formMode === 'edit') {
      toast.loading(t('Updating user...'));

      router.put(route("users.update", currentItem.id), formData, {
        onSuccess: (page) => {
          setIsFormModalOpen(false);
          toast.dismiss();
          if (page.props.flash?.success) {
            toast.success(t(page.props.flash.success));
          } else if (page.props.flash?.error) {
            toast.error(t(page.props.flash.error));
          } else {
            toast.success(t('User updated successfully'));
          }
        },
        onError: (errors) => {
          toast.dismiss();
          if (typeof errors === 'string') {
            toast.error(errors);
          } else {
            toast.error(t('Failed to update user') + `: ${Object.values(errors).join(', ')}`);
          }
        }
      });
    }
  };

  const handleDeleteConfirm = () => {
    toast.loading(t('Deleting user...'));

    router.delete(route("users.destroy", currentItem.id), {
      onSuccess: (page) => {
        setIsDeleteModalOpen(false);
        toast.dismiss();
        if (page.props.flash?.success) {
          toast.success(t(page.props.flash.success));
        } else if (page.props.flash?.error) {
          toast.error(t(page.props.flash.error));
        } else {
          toast.success(t('User deleted successfully'));
        }
      },
      onError: (errors) => {
        toast.dismiss();
        if (typeof errors === 'string') {
          toast.error(errors);
        } else {
          toast.error(t('Failed to delete user') + `: ${Object.values(errors).join(', ')}`);
        }
      }
    });
  };

  const handleResetPasswordConfirm = (data: { password: string, password_confirmation: string }) => {
    toast.loading(t('Resetting password...'));

    router.put(route('users.reset-password', currentItem.id), data, {
      onSuccess: (page) => {
        setIsResetPasswordModalOpen(false);
        toast.dismiss();
        if (page.props.flash?.success) {
          toast.success(t(page.props.flash.success));
        } else if (page.props.flash?.error) {
          toast.error(t(page.props.flash.error));
        } else {
          toast.success(t('Password reset successfully'));
        }
      },
      onError: (errors) => {
        toast.dismiss();
        if (typeof errors === 'string') {
          toast.error(errors);
        } else {
          toast.error(t('Failed to reset password') + `: ${Object.values(errors).join(', ')}`);
        }
      }
    });
  };

  const handleToggleStatus = (user: any) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    toast.loading(`${newStatus === 'active' ? t('Activating') : t('Deactivating')} user...`);

    router.put(route('users.toggle-status', user.id), {}, {
      onSuccess: (page) => {
        toast.dismiss();
        if (page.props.flash?.success) {
          toast.success(t(page.props.flash.success));
        } else if (page.props.flash?.error) {
          toast.error(t(page.props.flash.error));
        } else {
          toast.success(`User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
        }
      },
      onError: (errors) => {
        toast.dismiss();
        if (typeof errors === 'string') {
          toast.error(errors);
        } else {
          toast.error(t('Failed to update user status') + `: ${Object.values(errors).join(', ')}`);
        }
      }
    });
  };

  const handleResetFilters = () => {
    isInitialMount.current = true;
    setSelectedRole('all');
    setSelectedStatus('all');
    setSearchTerm('');
    setStartDate(undefined);
    setEndDate(undefined);
    setShowFilters(false);

    router.get(route('users.index'), {
      view: activeView // Preserve current view
    }, { preserveState: true, preserveScroll: true });
  };

  // Define page actions
  const pageActions = [];

  // Add User Logs button
   if (hasPermission(permissions, 'manage-login-history')) {
      pageActions.push({
        icon: <History className="h-4 w-4" />,
        variant: 'outline',
        iconOnly: true,
        tooltip: t('Login History'),
        onClick: () => router.get(route('users.all-logs'))
      });
    }
  // Add the "Add New User" button if user has permission and within limits
  if (hasPermission(permissions, 'create-users')) {
    const canCreate = !planLimits || planLimits.can_create;
    pageActions.push({
      label: planLimits && !canCreate ? t('User Limit Reached ({{current}}/{{max}})', { current: planLimits.current_users, max: planLimits.max_users }) : t('Add User'),
      icon: <Plus className="h-4 w-4" />,
      variant: canCreate ? 'default' : 'outline',
      onClick: canCreate ? () => handleAddNew() : () => toast.error(t('User limit exceeded. Your plan allows maximum {{max}} users. Please upgrade your plan.', { max: planLimits.max_users })),
      disabled: !canCreate
    });
  }

  const breadcrumbs = [
    { title: t('Dashboard'), href: route('dashboard') },
    { title: t('Staff Management'), href: route('users.index') },
    { title: t('Users') }
  ];

  // Define table columns
  const columns = [
    {
      key: 'name',
      label: t('Name'),
      sortable: true,
      render: (value: any, row: any) => {
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white">
              <Avatar className="h-10 w-10">
                  <AvatarImage src={row.avatar} />
                  <AvatarFallback>{getInitials(row.name)}</AvatarFallback>
              </Avatar>
            </div>
            <div>
              <div className="font-medium">{row.name}</div>
              <div className="text-sm text-muted-foreground">{row.email}</div>
            </div>
          </div>
        );
      }
    },
    {
      key: 'roles',
      label: t('Roles'),
      render: (value: any) => {
        if (!value || !value.length) return <span className="text-muted-foreground">No roles assigned</span>;

        return value.map((role: any) => {
          return <span key={role.id} className="inline-flex items-center rounded-md px-2 py-1 text-xs text-nowrap font-medium ring-1 ring-inset bg-blue-50 text-blue-700 ring-blue-600/20 mr-1">{role.label || role.name}</span>;
        });
      }
    },
    {
      key: 'status',
      label: t('Status'),
      sortable: true,
      render: (value: string) => {
        if (value === 'active') {
          return <span className='inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset bg-green-50 text-green-700 ring-green-600/20 capitalize'>{t('Active')}</span>;
        } else {
          return <span className='inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset bg-red-50 text-red-700 ring-red-600/20 capitalize'>{t('Inactive')}</span>;
        }
      }
    },
    {
      key: 'created_at',
      label: t('Joined'),
      sortable: true,
      type: 'date',
      // render: (value: string) => window.appSettings?.formatDateTime(value, false) || new Date(value).toLocaleDateString()
    }
  ];

  // Define table actions
  const actions = [
   
    {
      label: t('Reset Password'),
      icon: 'KeyRound',
      action: 'reset-password',
      className: 'text-blue-500',
      requiredPermission: 'reset-password-users'
    },
    {
      label: t('Toggle Status'),
      icon: (item: any) => item.status === 'active' ? 'Lock' : 'Unlock',
      action: 'toggle-status',
      className: 'text-amber-500',
      requiredPermission: 'toggle-status-users'
    },
     {
      label: t('View'),
      icon: 'Eye',
      action: 'view',
      className: 'text-blue-500',
      requiredPermission: 'view-users'
    },
    {
      label: t('Edit'),
      icon: 'Edit',
      action: 'edit',
      className: 'text-amber-500',
      requiredPermission: 'edit-users'
    },
    {
      label: t('Delete'),
      icon: 'Trash2',
      action: 'delete',
      className: 'text-red-500',
      requiredPermission: 'delete-users'
    }
  ];

  return (
    <PageTemplate
      title={t("Users")}
      url="/users"
      actions={pageActions}
      breadcrumbs={breadcrumbs}
      noPadding
      description={t('Manage your staff members and user accounts.')}
    >
      {/* Search and filters section */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow mb-4 border">
        <SearchAndFilterBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onSearch={handleSearch}
          filters={[
            {
              name: 'role',
              label: t('Role'),
              type: 'select',
              value: selectedRole,
              onChange: handleRoleFilter,
              options: [
                { value: 'all', label: t('All Roles') },
                ...(roles || []).map((role: any) => ({
                  value: role.id.toString(),
                  label: role.label || role.name
                }))
              ]
            },
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
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          hasActiveFilters={hasActiveFilters}
          activeFilterCount={activeFilterCount}
          onResetFilters={handleResetFilters}
          onApplyFilters={applyFilters}
          currentPerPage={pageFilters.per_page?.toString() || "10"}
          
          showViewToggle={true}
          activeView={activeView}
          onViewChange={(view) => {
            setActiveView(view);
            
            // Update URL with current view
            const currentUrl = new URL(window.location.href);
            const params = new URLSearchParams(currentUrl.search);
            params.set('view', view);
            
            // Preserve all current filters and pagination
            if (searchTerm) params.set('search', searchTerm);
            if (selectedRole !== 'all') params.set('role', selectedRole);
            if (selectedStatus !== 'all') params.set('status', selectedStatus);
            if (startDate) params.set('start_date', startDate.toISOString().split('T')[0]);
            if (endDate) params.set('end_date', endDate.toISOString().split('T')[0]);
            if (pageFilters.per_page) params.set('per_page', pageFilters.per_page.toString());
            if (pageFilters.page) params.set('page', pageFilters.page.toString());
            if (pageFilters.sort_field) params.set('sort_field', pageFilters.sort_field);
            if (pageFilters.sort_direction) params.set('sort_direction', pageFilters.sort_direction);
            
            router.get(route('users.index'), Object.fromEntries(params), { 
              preserveState: true, 
              preserveScroll: true 
            });
          }}
        />
        <div className="border-t border-gray-200 dark:border-gray-700 mb-1"></div>
        <div className="bg-white dark:bg-gray-900 ml-2 mr-2">
          <div className="flex space-x-0 overflow-x-auto">
            {[
              { key: 'all',      label: t('All Users'), count: statusCounts?.total    ?? (users?.total || 0), icon: List },
              { key: 'active',   label: t('Active'),    count: statusCounts?.active   || 0,                   icon: UserCheck },
              { key: 'inactive', label: t('Inactive'),  count: statusCounts?.inactive || 0,                   icon: UserX },
            ].map((tab) => {
              const IconComponent = tab.icon;
              return (
                <div key={tab.key} className="relative">
                  <button
                    onClick={() => handleStatusTabChange(tab.key)}
                    className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                      selectedStatus === tab.key ? 'text-primary' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <IconComponent className="h-4 w-4" />
                    <span>{tab.label}</span>
                    <span className={`inline-flex items-center justify-center px-2 py-1 text-xs font-bold rounded-full ${
                      selectedStatus === tab.key ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                  {selectedStatus === tab.key && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 bg-primary rounded-full transition-all duration-200"
                      style={{ width: 'calc(100% - 2rem)' }} />
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
            data={users?.data || []}
            from={users?.from || 1}
            onAction={handleAction}
            sortField={pageFilters.sort_field}
            sortDirection={pageFilters.sort_direction}
            onSort={handleSort}
            permissions={permissions}
            entityPermissions={{
              view: 'view-users',
              create: 'create-users',
              edit: 'edit-users',
              delete: 'delete-users'
            }}
          />

          {/* Pagination section */}
          <Pagination
            from={users?.from || 0}
            to={users?.to || 0}
            total={users?.total || 0}
            links={users?.links}
            entityName={t("users")}
            onPageChange={(url) => {
              const urlObj = new URL(url, window.location.origin);
              urlObj.searchParams.set('view', activeView);
              if (searchTerm) urlObj.searchParams.set('search', searchTerm);
              if (selectedRole !== 'all') urlObj.searchParams.set('role', selectedRole);
              if (selectedStatus !== 'all') urlObj.searchParams.set('status', selectedStatus);
              if (startDate) urlObj.searchParams.set('start_date', startDate.toISOString().split('T')[0]);
              if (endDate) urlObj.searchParams.set('end_date', endDate.toISOString().split('T')[0]);
              if (pageFilters.per_page) urlObj.searchParams.set('per_page', pageFilters.per_page.toString());
              if (pageFilters.sort_field) urlObj.searchParams.set('sort_field', pageFilters.sort_field);
              if (pageFilters.sort_direction) urlObj.searchParams.set('sort_direction', pageFilters.sort_direction);
              router.get(urlObj.toString(), {}, { preserveState: true, preserveScroll: true });
            }}
            currentPerPage={pageFilters.per_page?.toString() || "10"}
            onPerPageChange={(value) => {
              const params: any = { page: 1, per_page: parseInt(value) };
              if (searchTerm) params.search = searchTerm;
              if (selectedRole !== 'all') params.role = selectedRole;
              if (selectedStatus !== 'all') params.status = selectedStatus;
              if (startDate) params.start_date = startDate.toISOString().split('T')[0];
              if (endDate) params.end_date = endDate.toISOString().split('T')[0];
              params.view = activeView;
              if (pageFilters.sort_field) {
                params.sort_field = pageFilters.sort_field;
                params.sort_direction = pageFilters.sort_direction;
              }
              router.get(route('users.index'), params, { preserveState: true, preserveScroll: true });
            }}
          />
        </div>
      ) : (
        <div>
          {/* Grid View */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {users?.data?.map((user: any) => (
              <Card key={user.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm">
                {/* Top: Avatar + Name + Email */}
                <div className="p-4 flex items-center gap-3">
                  <Avatar className="h-12 w-12 shrink-0">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white truncate">{user.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-100 dark:border-gray-700" />

                {/* Bottom: Action icons (left) + Role badge (right) */}
                <div className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {hasPermission(permissions, 'view-users') && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm" 
                          className="h-8 w-8 p-0 text-gray-500"
                          // className="h-8 w-8 p-0 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20" 
                          onClick={() => handleAction('view', user)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t('View')}</TooltipContent>
                      </Tooltip>
                    )}
                    {hasPermission(permissions, 'edit-users') && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm" 
                          className="h-8 w-8 p-0 text-gray-500"
                          // className="h-8 w-8 p-0 text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                          onClick={() => handleAction('edit', user)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t('Edit')}</TooltipContent>
                      </Tooltip>
                    )}
                    {hasPermission(permissions, 'edit-users') && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm" 
                          className="h-8 w-8 p-0 text-gray-500"
                          // className="h-8 w-8 p-0 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20" 
                          onClick={() => handleAction('reset-password', user)}>
                            <KeyRound className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t('Reset Password')}</TooltipContent>
                      </Tooltip>
                    )}
                    {hasPermission(permissions, 'edit-users') && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm" 
                          className="h-8 w-8 p-0 text-gray-500"
                          // className="h-8 w-8 p-0 text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20" 
                          onClick={() => handleAction('toggle-status', user)}>
                            {user.status === 'active' ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{user.status === 'active' ? t('Disable User') : t('Enable User')}</TooltipContent>
                      </Tooltip>
                    )}
                    {hasPermission(permissions, 'delete-users') && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm" 
                          className="h-8 w-8 p-0 text-gray-500"
                          // className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" 
                          onClick={() => handleAction('delete', user)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t('Delete')}</TooltipContent>
                      </Tooltip>
                    )}
                  </div>

                  {/* Role badge */}
                  <div>
                    {user.roles && user.roles.length > 0 ? (
                      <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset bg-blue-50 text-blue-700 ring-blue-600/20 capitalize">
                        {user.roles[0].label || user.roles[0].name}
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset bg-gray-50 text-gray-700 ring-gray-600/20">
                        -
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination for grid view */}
          <div className="mt-6 bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden">
            <Pagination
              from={users?.from || 0}
              to={users?.to || 0}
              total={users?.total || 0}
              links={users?.links}
              entityName={t("users")}
              onPageChange={(url) => {
                const urlObj = new URL(url, window.location.origin);
                urlObj.searchParams.set('view', activeView);
                if (searchTerm) urlObj.searchParams.set('search', searchTerm);
                if (selectedRole !== 'all') urlObj.searchParams.set('role', selectedRole);
                if (selectedStatus !== 'all') urlObj.searchParams.set('status', selectedStatus);
                if (startDate) urlObj.searchParams.set('start_date', startDate.toISOString().split('T')[0]);
                if (endDate) urlObj.searchParams.set('end_date', endDate.toISOString().split('T')[0]);
                if (pageFilters.per_page) urlObj.searchParams.set('per_page', pageFilters.per_page.toString());
                if (pageFilters.sort_field) urlObj.searchParams.set('sort_field', pageFilters.sort_field);
                if (pageFilters.sort_direction) urlObj.searchParams.set('sort_direction', pageFilters.sort_direction);
                router.get(urlObj.toString(), {}, { preserveState: true, preserveScroll: true });
              }}
              currentPerPage={pageFilters.per_page?.toString() || "10"}
              onPerPageChange={(value) => {
                const params: any = { page: 1, per_page: parseInt(value) };
                if (searchTerm) params.search = searchTerm;
                if (selectedRole !== 'all') params.role = selectedRole;
                if (selectedStatus !== 'all') params.status = selectedStatus;
                if (startDate) params.start_date = startDate.toISOString().split('T')[0];
                if (endDate) params.end_date = endDate.toISOString().split('T')[0];
                params.view = activeView;
                if (pageFilters.sort_field) {
                  params.sort_field = pageFilters.sort_field;
                  params.sort_direction = pageFilters.sort_direction;
                }
                router.get(route('users.index'), params, { preserveState: true, preserveScroll: true });
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
            { name: 'name', label: t('Name'), type: 'text', required: true, placeholder: 'e.g. John' },
            { name: 'email', label: t('Email'), type: 'email', required: true, placeholder: 'e.g. john@example.com' },
            {
              name: 'password',
              label: t('Password'),
              type: 'password',
              placeholder: 'enter password',
              required: true,
              conditional: (mode) => mode === 'create'
            },
            {
              name: 'password_confirmation',
              label: t('Confirm Password'),
              type: 'password',
              placeholder: 'enter confirm password',
              required: true,
              conditional: (mode) => mode === 'create'
            },
            {
              name: 'roles',
              label: t('Role'),
              type: 'select',
              options: roles ? roles.map((role: any) => ({
                value: role.id.toString(),
                label: role.label || role.name
              })) : [],
              required: true
            }
          ],
          modalSize: 'lg'
        }}
        initialData={currentItem ? {
          ...currentItem,
          roles: currentItem.roles && currentItem.roles.length > 0 ? currentItem.roles[0].id.toString() : ''
        } : null}
        title={
          formMode === 'create'
            ? t('Add New User')
            : formMode === 'edit'
              ? t('Edit User')
              : t('View User')
        }
        mode={formMode}
      />

      {/* Delete Modal */}
      <CrudDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        itemName={currentItem?.name || ''}
        entityName="user"
      />

      {/* Reset Password Modal */}
      <CrudFormModal
        isOpen={isResetPasswordModalOpen}
        onClose={() => setIsResetPasswordModalOpen(false)}
        onSubmit={handleResetPasswordConfirm}
        formConfig={{
          fields: [
            { name: 'password', label: t('New Password'), type: 'password', required: true, placeholder: 'Enter password' },
            { name: 'password_confirmation', label: t('Confirm Password'), type: 'password', required: true, placeholder: 'Enter confirm password' }
          ],
          modalSize: 'sm'
        }}
        initialData={{}}
        title={`Reset Password for ${currentItem?.name || 'User'}`}
        mode="edit"
      />
    </PageTemplate>
  );
}
