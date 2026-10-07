import { useState } from 'react';
import { PageTemplate } from '@/components/page-template';
import { usePage, router } from '@inertiajs/react';
import { Edit, Trash2, Search, X, Lock, ChevronDown, ChevronUp, FolderOpen } from 'lucide-react';
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

export default function ExpenseCategories() {
  const { t } = useTranslation();
  const { auth, expenseCategories, filters: pageFilters = {} } = usePage().props as any;
  const permissions = auth?.permissions || [];

  const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
  const [selectedStatus, setSelectedStatus] = useState(pageFilters.status || '_empty_');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [formData, setFormData] = useState({ name: '', description: '', status: 'active' });
  const [formErrors, setFormErrors] = useState<any>({});
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<number>>(new Set());

  const toggleDescription = (id: number) => {
    const next = new Set(expandedDescriptions);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpandedDescriptions(next);
  };

  const DESC_LIMIT = 60;

  const canCreate = hasPermission(permissions, 'create-expense-categories');
  const canEdit = hasPermission(permissions, 'edit-expense-categories');
  const canDelete = hasPermission(permissions, 'delete-expense-categories');
  const canView = hasPermission(permissions, 'view-expense-categories');
  const canToggleStatus = hasPermission(permissions, 'manage-expense-category-status');

  const resetForm = () => {
    setFormData({ name: '', description: '', status: 'active' });
    setFormErrors({});
    setFormMode('create');
    setCurrentItem(null);
  };

  const loadItemForEdit = (item: any) => {
    setFormData({
      name: item.name || '',
      description: item.description || '',
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
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const hasActiveFilters = () => {
    return selectedStatus !== '_empty_' || searchTerm !== '';
  };

  const applyFilters = (overrides: Record<string, any> = {}) => {
    router.get(route('expense-categories.index'), {
      page: 1,
      search: searchTerm || undefined,
      status: selectedStatus !== '_empty_' ? selectedStatus : undefined,
      per_page: pageFilters.per_page || 10,
      sort_field: pageFilters.sort_field || undefined,
      sort_direction: pageFilters.sort_direction || undefined,
      ...overrides,
    }, { preserveState: true, preserveScroll: true });
  };

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    applyFilters();
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedStatus('_empty_');
    router.get(route('expense-categories.index'), { page: 1, per_page: pageFilters.per_page || 10 }, { preserveState: true, preserveScroll: true });
  };

  const handleSort = (field: string) => {
    const direction = pageFilters.sort_field === field && pageFilters.sort_direction === 'asc' ? 'desc' : 'asc';
    applyFilters({ sort_field: field, sort_direction: direction });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (formMode === 'create') {
      toast.loading(t('Creating expense category...'));
      router.post(route('expense-categories.store'), formData, {
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
      toast.loading(t('Updating expense category...'));
      router.put(route('expense-categories.update', currentItem.id), formData, {
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
    toast.loading(t('Deleting expense category...'));
    router.delete(route('expense-categories.destroy', currentItem.id), {
      onSuccess: (page) => {
        setIsDeleteModalOpen(false);
        toast.dismiss();
        const flash = page.props.flash as any;
        if (flash?.success) toast.success(t(flash.success));
        else if (flash?.error) toast.error(t(flash.error));
      },
      onError: (errors) => {
        toast.dismiss();
        toast.error(typeof errors === 'string' ? t(errors) : t('Failed to delete expense category') + `: ${Object.values(errors).join(', ')}`);
      },
    });
  };

  const handleToggleStatus = (category: any) => {
    const newStatus = category.status === 'active' ? 'inactive' : 'active';
    toast.loading(`${newStatus === 'active' ? t('Activating') : t('Deactivating')} expense category...`);
    router.put(route('expense-categories.toggle-status', category.id), {}, {
      onSuccess: (page) => {
        toast.dismiss();
        const flash = page.props.flash as any;
        if (flash?.success) toast.success(t(flash.success));
        else if (flash?.error) toast.error(t(flash.error));
      },
      onError: (errors) => {
        toast.dismiss();
        toast.error(typeof errors === 'string' ? t(errors) : t('Failed to update expense category status') + `: ${Object.values(errors).join(', ')}`);
      },
    });
  };

  const breadcrumbs = [
    { title: t('Dashboard'), href: route('dashboard') },
    { title: t('Expense Management'), href: route('expense-categories.index') },
    { title: t('Expense Categories') },
  ];

  const SortIcon = ({ field }: { field: string }) =>
    pageFilters.sort_field === field
      ? <span>{pageFilters.sort_direction === 'asc' ? ' ↑' : ' ↓'}</span>
      : <span className="opacity-40">↕</span>;

  return (
    <PageTemplate title={t('Expense Categories')} description={t('Manage your expense categories.')} url="/expense-categories" breadcrumbs={breadcrumbs} noPadding>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: Form */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 sticky top-4">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {formMode === 'create' ? t('Add New Expense Category') : t('Edit Expense Category')}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {formMode === 'create'
                  ? t('Fill in the details to create a new expense category')
                  : t('Update the expense category details below')}
              </p>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              {/* Name */}
              <div className="space-y-2">
                <Label required htmlFor="name">{t('Category Name')}</Label>
                <Input
                  required
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t('Enter category name')}
                  className={formErrors.name ? 'border-red-500' : ''}
                  disabled={!canCreate && !canEdit}
                />
                {formErrors.name && <p className="text-sm text-red-500">{formErrors.name}</p>}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">{t('Description')}</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={t('Enter description')}
                  rows={3}
                  disabled={!canCreate && !canEdit}
                />
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
                    {formMode === 'create' ? t('Add Expense Category') : t('Update Expense Category')}
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
                    placeholder={t('Search expense categories...')}
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
            {(expenseCategories?.data || []).length > 0 ? (
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
                          {t('Status')}
                        </th>
                        <th className="px-4 py-3 ltr:pr-[55px] rtl:pl-[55px] text-end text-xs font-medium text-gray-500 dark:text-gray-300 tracking-wider">
                          {t('Actions')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {(expenseCategories?.data || []).map((item: any) => (
                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <td className="px-4 py-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</div>
                            {item.description && (
                              <div className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                                <div className={expandedDescriptions.has(item.id) ? '' : 'line-clamp-2'}>
                                  {item.description}
                                </div>
                                {item.description.length > DESC_LIMIT && (
                                  <button
                                    onClick={() => toggleDescription(item.id)}
                                    className="inline-flex items-center mt-1 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                  >
                                    {expandedDescriptions.has(item.id)
                                      ? <><ChevronUp className="h-3 w-3 ltr:mr-1 rtl:ml-1" />{t('Show less')}</>
                                      : <><ChevronDown className="h-3 w-3 ltr:mr-1 rtl:ml-1" />{t('Show more')}</>}
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${item.status === 'active'
                              ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20'
                              : 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20'}`}>
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
                  {(expenseCategories?.data || []).map((item: any) => (
                    <div key={item.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</h3>
                          {item.description && (
                            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              <div className={expandedDescriptions.has(item.id) ? '' : 'line-clamp-2'}>
                                  {item.description}
                              </div>
                              {item.description.length > DESC_LIMIT && (
                                <button
                                  onClick={() => toggleDescription(item.id)}
                                  className="inline-flex items-center mt-1 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                >
                                  {expandedDescriptions.has(item.id)
                                    ? <><ChevronUp className="h-3 w-3 mr-1" />{t('Show less')}</>
                                    : <><ChevronDown className="h-3 w-3 mr-1" />{t('Show more')}</>}
                                </button>
                              )}
                            </div>
                          )}
                          <span className={`mt-2 inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${item.status === 'active'
                            ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20'
                            : 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20'}`}>
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
                {expenseCategories?.total > (expenseCategories?.per_page || 10) && (
                  <div className="border-t border-gray-200 dark:border-gray-700">
                    <Pagination
                      from={expenseCategories?.from || 0}
                      to={expenseCategories?.to || 0}
                      total={expenseCategories?.total || 0}
                      links={expenseCategories?.links}
                      entityName={t('expense categories')}
                      onPageChange={(url) => {
                        const page = new URL(url).searchParams.get('page');
                        router.get(route('expense-categories.index'), {
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
                  <FolderOpen className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {t('No expense categories found')}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                  {hasActiveFilters()
                    ? t('No expense categories match your search criteria. Try adjusting your filters.')
                    : t('Create expense categories to organize your expenses.')}
                </p>
                {!hasActiveFilters() && canCreate && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('Use the form on the left to add your first expense category.')}
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
        entityName="expense category"
      />
    </PageTemplate>
  );
}
