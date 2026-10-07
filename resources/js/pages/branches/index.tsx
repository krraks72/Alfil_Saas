import { useState } from 'react';
import { PageTemplate } from '@/components/page-template';
import { usePage, router } from '@inertiajs/react';
import { Edit, Trash2, Search, X, Lock, GitBranch, ChevronDown, ChevronUp } from 'lucide-react';
import { hasPermission } from '@/utils/authorization';
import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import { Dialog } from '@/components/ui/dialog';
import ViewPopup from './view';
import { toast } from '@/components/custom-toast';
import { useTranslation } from 'react-i18next';
import { Pagination } from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';

export default function Branches() {
  const { t } = useTranslation();
  const { auth, branches, managers, filters: pageFilters = {} } = usePage().props as any;
  const permissions = auth?.permissions || [];
  const getInitials = useInitials();

  const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
  const [selectedStatus, setSelectedStatus] = useState(pageFilters.status || '_empty_');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [formData, setFormData] = useState({ name: '', address: '', phone: '', email: '', manager_id: '', status: 'active' });
  const [formErrors, setFormErrors] = useState<any>({});
  const [expandedAddresses, setExpandedAddresses] = useState<Set<number>>(new Set());

  const toggleAddress = (id: number) => {
    const next = new Set(expandedAddresses);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpandedAddresses(next);
  };

  const ADDR_LIMIT = 60;

  const canCreate = hasPermission(permissions, 'create-branches');
  const canEdit = hasPermission(permissions, 'edit-branches');
  const canDelete = hasPermission(permissions, 'delete-branches');
  const canView = hasPermission(permissions, 'view-branches');
  const canToggleStatus = hasPermission(permissions, 'manage-branch-status');

  const resetForm = () => {
    setFormData({ name: '', address: '', phone: '', email: '', manager_id: '', status: 'active' });
    setFormErrors({});
    setFormMode('create');
    setCurrentItem(null);
  };

  const loadItemForEdit = (item: any) => {
    setFormData({
      name: item.name || '',
      address: item.address || '',
      phone: item.phone || '',
      email: item.email || '',
      manager_id: item.manager_id ? String(item.manager_id) : '',
      status: item.status || 'active',
    });
    setFormMode('edit');
    setCurrentItem(item);
    setFormErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const validate = (): boolean => {
    const errors: any = {};
    if (!formData.name.trim()) errors.name = t('Name is required');
    else if (formData.name.trim().length > 255) errors.name = t('Name must not exceed 255 characters');
    if (!formData.address.trim()) errors.address = t('Address is required');
    if (!formData.manager_id) errors.manager_id = t('Manager is required');
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const hasActiveFilters = () => {
    return selectedStatus !== '_empty_' || searchTerm !== '';
  };

  const applyFilters = (overrides: Record<string, any> = {}) => {
    router.get(route('branches.index'), {
      page: 1,
      search: searchTerm || undefined,
      status: selectedStatus !== '_empty_' ? selectedStatus : undefined,
      per_page: pageFilters.per_page || 10,
      sort_field: pageFilters.sort_field || undefined,
      sort_direction: pageFilters.sort_direction || undefined,
      ...overrides,
    }, { preserveState: true, preserveScroll: true });
  };

  const handleSearch = (e?: React.FormEvent) => { if (e) e.preventDefault(); applyFilters(); };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedStatus('_empty_');
    router.get(route('branches.index'), { page: 1, per_page: pageFilters.per_page || 10 }, { preserveState: true, preserveScroll: true });
  };

  const handleSort = (field: string) => {
    const direction = pageFilters.sort_field === field && pageFilters.sort_direction === 'asc' ? 'desc' : 'asc';
    applyFilters({ sort_field: field, sort_direction: direction });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = { ...formData, manager_id: formData.manager_id ? parseInt(formData.manager_id) : '' };

    if (formMode === 'create') {
      toast.loading(t('Creating branch...'));
      router.post(route('branches.store'), payload, {
        onSuccess: (page) => {
          toast.dismiss();
          const flash = page.props.flash as any;
          if (flash?.success) { toast.success(t(flash.success)); resetForm(); }
          else if (flash?.error) toast.error(t(flash.error));
        },
        onError: (errors) => {
          toast.dismiss();
          setFormErrors(errors);
          toast.error(t('Please check the form for errors'));
        },
      });
    } else {
      toast.loading(t('Updating branch...'));
      router.put(route('branches.update', currentItem.id), payload, {
        onSuccess: (page) => {
          toast.dismiss();
          const flash = page.props.flash as any;
          if (flash?.success) { toast.success(t(flash.success)); resetForm(); }
          else if (flash?.error) toast.error(t(flash.error));
        },
        onError: (errors) => {
          toast.dismiss();
          setFormErrors(errors);
          toast.error(t('Please check the form for errors'));
        },
      });
    }
  };

  const handleDeleteConfirm = () => {
    toast.loading(t('Deleting branch...'));
    router.delete(route('branches.destroy', currentItem.id), {
      onSuccess: (page) => {
        setIsDeleteModalOpen(false);
        toast.dismiss();
        const flash = page.props.flash as any;
        if (flash?.success) toast.success(t(flash.success));
        else if (flash?.error) toast.error(t(flash.error));
      },
      onError: (errors) => {
        toast.dismiss();
        toast.error(typeof errors === 'string' ? t(errors) : t('Failed to delete branch') + `: ${Object.values(errors).join(', ')}`);
      },
    });
  };

  const handleToggleStatus = (branch: any) => {
    const newStatus = branch.status === 'active' ? 'inactive' : 'active';
    toast.loading(`${newStatus === 'active' ? t('Activating') : t('Deactivating')} branch...`);
    router.put(route('branches.toggle-status', branch.id), {}, {
      onSuccess: (page) => {
        toast.dismiss();
        const flash = page.props.flash as any;
        if (flash?.success) toast.success(t(flash.success));
        else if (flash?.error) toast.error(t(flash.error));
      },
      onError: (errors) => {
        toast.dismiss();
        toast.error(typeof errors === 'string' ? t(errors) : t('Failed to update branch status') + `: ${Object.values(errors).join(', ')}`);
      },
    });
  };

  const breadcrumbs = [
    { title: t('Dashboard'), href: route('dashboard') },
    { title: t('POS Management'), href: route('branches.index') },
    { title: t('Branches') },
  ];



  const SortIcon = ({ field }: { field: string }) =>
    pageFilters.sort_field === field
      ? <span>{pageFilters.sort_direction === 'asc' ? ' ↑' : ' ↓'}</span>
      : <span className="opacity-40">↕</span>;

  return (
    <PageTemplate title={t('Branches')} description={t('Manage your business branch offices.')} url="/hr/branches" breadcrumbs={breadcrumbs} noPadding>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: Form */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 sticky top-4">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {formMode === 'create' ? t('Add New Branch') : t('Edit Branch')}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {formMode === 'create'
                  ? t('Fill in the details to create a new branch')
                  : t('Update the branch details below')}
              </p>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              {/* Name */}
              <div className="space-y-2">
                <Label required htmlFor="name">{t('Branch Name')}</Label>
                <Input
                  required
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t('Enter branch name')}
                  className={formErrors.name ? 'border-red-500' : ''}
                  disabled={!canCreate && !canEdit}
                />
                {formErrors.name && <p className="text-sm text-red-500">{formErrors.name}</p>}
              </div>

              {/* Address */}
              <div className="space-y-2">
                <Label required htmlFor="address">{t('Address')}</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder={t('Enter address')}
                  rows={3}
                  className={formErrors.address ? 'border-red-500' : ''}
                  disabled={!canCreate && !canEdit}
                />
                {formErrors.address && <p className="text-sm text-red-500">{formErrors.address}</p>}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">{t('Phone')}</Label>
                <Input
                  id="phone"
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder={t('Enter phone')}
                  disabled={!canCreate && !canEdit}
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">{t('Email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder={t('Enter email')}
                  disabled={!canCreate && !canEdit}
                />
              </div>

              {/* Manager */}
              <div className="space-y-2">
                <Label required htmlFor="manager_id">{t('Manager')}</Label>
                <Select
                  value={formData.manager_id}
                  onValueChange={(val) => setFormData({ ...formData, manager_id: val })}
                  disabled={!canCreate && !canEdit}
                >
                  <SelectTrigger id="manager_id" className={formErrors.manager_id ? 'border-red-500' : ''}>
                    <SelectValue placeholder={t('Select manager')} />
                  </SelectTrigger>
                  <SelectContent searchable>
                    {(managers || []).map((manager: any) => (
                      <SelectItem key={manager.id} value={String(manager.id)}>{manager.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.manager_id && <p className="text-sm text-red-500">{formErrors.manager_id}</p>}
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">{t('Status')}</Label>
                <Select
                  value={formData.status}
                  onValueChange={(val) => setFormData({ ...formData, status: val })}
                  disabled={!canCreate && !canEdit}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{t('Active')}</SelectItem>
                    <SelectItem value="inactive">{t('Inactive')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                {(formMode === 'create' ? canCreate : canEdit) && (
                  <Button type="submit" className="flex-1">
                    {formMode === 'create' ? t('Add Branch') : t('Update Branch')}
                  </Button>
                )}
                {formMode === 'edit' && (
                  <Button type="button" variant="outline" onClick={resetForm}>
                    {t('Cancel')}
                  </Button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Right: Table */}
        <div className="lg:col-span-2 space-y-4">

          {/* Search and Filter */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder={t('Search branches...')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
                    className="pl-10"
                  />
                </div>
                <Button onClick={() => handleSearch()} variant="default">{t('Search')}</Button>
                {hasActiveFilters() && (
                  <Button onClick={handleResetFilters} variant="outline">
                    <X className="h-4 w-4 mr-2" />{t('Reset')}
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('All Statuses')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_empty_">{t('All Statuses')}</SelectItem>
                    <SelectItem value="active">{t('Active')}</SelectItem>
                    <SelectItem value="inactive">{t('Inactive')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            {(branches?.data || []).length > 0 ? (
              <>

                {/* Desktop table */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-[#F0F0F1] dark:bg-gray-800">
                      <tr>
                        <th
                          className="px-4 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-300 tracking-wider cursor-pointer select-none"
                          onClick={() => handleSort('name')}
                        >
                          <div className="flex items-center gap-1">{t('Name')} <SortIcon field="name" /></div>
                        </th>
                        <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-300 tracking-wider">
                          {t('Contact')}
                        </th>
                        <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-300 tracking-wider">
                          {t('Manager')}
                        </th>
                        <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-300 tracking-wider">
                          {t('Status')}
                        </th>
                        <th className="px-4 py-3 ltr:pr-[55px] rtl:pl-[55px] text-end text-xs font-medium text-gray-500 dark:text-gray-300 tracking-wider">
                          {t('Actions')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {(branches?.data || []).map((item: any) => (
                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <td className="px-4 py-4 text-start">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</div>
                            {item.address && (
                              <div className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                                <div className={expandedAddresses.has(item.id) ? '' : 'line-clamp-2'}>
                                  {item.address}
                                </div>
                                {item.address.length > ADDR_LIMIT && (
                                  <button
                                    onClick={() => toggleAddress(item.id)}
                                    className="inline-flex items-center mt-1 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                  >
                                    {expandedAddresses.has(item.id)
                                      ? <><ChevronUp className="h-3 w-3 ltr:mr-1 rtl:ml-1" />{t('Show less')}</>
                                      : <><ChevronDown className="h-3 w-3 ltr:mr-1 rtl:ml-1" />{t('Show more')}</>}
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-4 text-start text-sm text-gray-700 dark:text-gray-300">
                            <div>{item.phone || '-'}</div>
                            {item.email && <div>{item.email}</div>}
                          </td>
                          <td className="px-4 py-4 text-start text-sm text-gray-700 dark:text-gray-300">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10 shrink-0">
                                <AvatarImage src={item.manager?.avatar} />
                                <AvatarFallback>{getInitials(item.manager?.name)}</AvatarFallback>
                              </Avatar>
                              <div className="text-start">
                                <div className="font-medium">{item.manager?.name}</div>
                                <div className="text-xs text-gray-500">{item.manager?.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-start">
                            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${item.status === 'active'
                              ? 'bg-green-50 text-green-700 ring-green-600/20'
                              : 'bg-red-50 text-red-700 ring-red-600/20'}`}>
                              {item.status === 'active' ? t('Active') : t('Inactive')}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-end">
                            <div className="flex items-center justify-end space-x-2 rtl:space-x-reverse">
                              {canToggleStatus && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => handleToggleStatus(item)} 
                                    className="h-8 w-8 p-0 text-gray-500"
                                    // className={`h-8 w-8 p-0 ${item.status === 'active' ? 'text-orange-500' : 'text-green-600'}`}
                                    >
                                      <Lock className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>{t('Toggle Status')}</TooltipContent>
                                </Tooltip>
                              )}
                              {canEdit && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => loadItemForEdit(item)} 
                                    className="h-8 w-8 p-0 text-gray-500"
                                    // className="h-8 w-8 p-0 text-amber-500"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>{t('Edit')}</TooltipContent>
                                </Tooltip>
                              )}
                              {canDelete && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => { setCurrentItem(item); setIsDeleteModalOpen(true); }} 
                                    className="h-8 w-8 p-0 text-gray-500"
                                    // className="h-8 w-8 p-0 text-red-500"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>{t('Delete')}</TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="lg:hidden space-y-4 p-4">
                  {(branches?.data || []).map((item: any) => (
                    <div key={item.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</h3>
                          {item.address && (
                            <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                              <div className={expandedAddresses.has(item.id) ? '' : 'line-clamp-2'}>
                                {item.address}
                              </div>
                              {item.address.length > ADDR_LIMIT && (
                                <button
                                  onClick={() => toggleAddress(item.id)}
                                  className="inline-flex items-center mt-1 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                >
                                  {expandedAddresses.has(item.id)
                                    ? <><ChevronUp className="h-3 w-3 mr-1" />{t('Show less')}</>
                                    : <><ChevronDown className="h-3 w-3 mr-1" />{t('Show more')}</>}
                                </button>
                              )}
                            </div>
                          )}
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{item.phone || '-'}</p>
                          {item.email && <p className="text-sm text-gray-500 dark:text-gray-400">{item.email}</p>}
                          {item.manager?.name && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{item.manager.name}</p>
                          )}
                          <span className={`mt-2 inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${item.status === 'active'
                            ? 'bg-green-50 text-green-700 ring-green-600/20'
                            : 'bg-red-50 text-red-700 ring-red-600/20'}`}>
                            {item.status === 'active' ? t('Active') : t('Inactive')}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1 ml-2">
                          {canToggleStatus && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" onClick={() => handleToggleStatus(item)} 
                                className="h-8 w-8 p-0 text-gray-500"
                                // className={`h-8 w-8 p-0 ${item.status === 'active' ? 'text-orange-500' : 'text-green-600'}`}
                                >
                                  <Lock className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>{t('Toggle Status')}</TooltipContent>
                            </Tooltip>
                          )}
                          {canEdit && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" onClick={() => loadItemForEdit(item)} 
                                className="h-8 w-8 p-0 text-gray-500"
                                // className="h-8 w-8 p-0 text-amber-500"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>{t('Edit')}</TooltipContent>
                            </Tooltip>
                          )}
                          {canDelete && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" onClick={() => { setCurrentItem(item); setIsDeleteModalOpen(true); }} 
                                className="h-8 w-8 p-0 text-gray-500"
                                // className="h-8 w-8 p-0 text-red-500"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>{t('Delete')}</TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {branches?.total > (branches?.per_page || 10) && (
                  <div className="border-t border-gray-200 dark:border-gray-700">
                    <Pagination
                      from={branches?.from || 0}
                      to={branches?.to || 0}
                      total={branches?.total || 0}
                      links={branches?.links}
                      entityName={t('branches')}
                      onPageChange={(url) => {
                        const page = new URL(url).searchParams.get('page');
                        router.get(route('branches.index'), {
                          page,
                          per_page: pageFilters.per_page || 10,
                          search: searchTerm || undefined,
                          status: selectedStatus !== '_empty_' ? selectedStatus : undefined,
                          sort_field: pageFilters.sort_field || undefined,
                          sort_direction: pageFilters.sort_direction || undefined,
                        }, { preserveState: true, preserveScroll: true });
                      }}
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="p-12 text-center">
                <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                  <GitBranch className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {t('No branches found')}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                  {hasActiveFilters()
                    ? t('No branches match your search criteria. Try adjusting your filters.')
                    : t('Create branches to manage your business locations.')}
                </p>
                {!hasActiveFilters() && canCreate && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('Use the form on the left to add your first branch.')}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        {currentItem && <ViewPopup record={currentItem} />}
      </Dialog>

      <CrudDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        itemName={currentItem?.name || ''}
        entityName="branch"
      />
    </PageTemplate>
  );
}
