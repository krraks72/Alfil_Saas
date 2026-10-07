import { useState } from 'react';
import { PageTemplate } from '@/components/page-template';
import { usePage, router } from '@inertiajs/react';
import { Edit, Trash2, Search, X, Lock, ChevronDown, ChevronUp, Tag } from 'lucide-react';
import { hasPermission } from '@/utils/authorization';
import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import { toast } from '@/components/custom-toast';
import { useTranslation } from 'react-i18next';
import { Pagination } from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import MediaPicker from '@/components/MediaPicker';

export default function Brands() {
  const { t } = useTranslation();
  const { auth, brands, filters: pageFilters = {} } = usePage().props as any;
  const permissions = auth?.permissions || [];

  const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
  const [selectedStatus, setSelectedStatus] = useState(pageFilters.status || '_empty_');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [formData, setFormData] = useState({ name: '', description: '', logo: '', website: '', status: 'active' });
  const [formErrors, setFormErrors] = useState<any>({});
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<number>>(new Set());

  const toggleDescription = (id: number) => {
    const next = new Set(expandedDescriptions);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpandedDescriptions(next);
  };

  const defaultImage = `${window.appSettings?.imageUrl || ''}/images/default/image-not-found.jpg`;
  const getImageUrl = (image: string | null) =>
    image ? window.appSettings.getImageUrl(image) : defaultImage;

  const canCreate = hasPermission(permissions, 'create-brands');
  const canEdit = hasPermission(permissions, 'edit-brands');
  const canDelete = hasPermission(permissions, 'delete-brands');
  const canToggleStatus = hasPermission(permissions, 'manage-brand-status');

  const resetForm = () => {
    setFormData({ name: '', description: '', logo: '', website: '', status: 'active' });
    setFormErrors({});
    setFormMode('create');
    setCurrentItem(null);
  };

  const loadItemForEdit = (item: any) => {
    setFormData({
      name: item.name || '',
      description: item.description || '',
      logo: item.logo ? (item.logo.startsWith('http') ? item.logo : `${window.appSettings?.baseUrl || window.location.origin}${item.logo}`) : '',
      website: item.website || '',
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
    router.get(route('brands.index'), {
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
    router.get(route('brands.index'), { page: 1, per_page: pageFilters.per_page || 10 }, { preserveState: true, preserveScroll: true });
  };

  const handleSort = (field: string) => {
    const direction = pageFilters.sort_field === field && pageFilters.sort_direction === 'asc' ? 'desc' : 'asc';
    applyFilters({ sort_field: field, sort_direction: direction });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (formMode === 'create') {
      toast.loading(t('Creating brand...'));
      router.post(route('brands.store'), formData, {
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
      toast.loading(t('Updating brand...'));
      router.put(route('brands.update', currentItem.id), formData, {
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
    toast.loading(t('Deleting brand...'));
    router.delete(route('brands.destroy', currentItem.id), {
      onSuccess: (page) => {
        setIsDeleteModalOpen(false);
        toast.dismiss();
        const flash = page.props.flash as any;
        if (flash?.success) toast.success(t(flash.success));
        else if (flash?.error) toast.error(t(flash.error));
      },
      onError: (errors) => {
        toast.dismiss();
        toast.error(typeof errors === 'string' ? t(errors) : t('Failed to delete brand') + `: ${Object.values(errors).join(', ')}`);
      },
    });
  };

  const handleToggleStatus = (brand: any) => {
    const newStatus = brand.status === 'active' ? 'inactive' : 'active';
    toast.loading(`${newStatus === 'active' ? t('Activating') : t('Deactivating')} brand...`);
    router.put(route('brands.toggle-status', brand.id), {}, {
      onSuccess: (page) => {
        toast.dismiss();
        const flash = page.props.flash as any;
        if (flash?.success) toast.success(t(flash.success));
        else if (flash?.error) toast.error(t(flash.error));
      },
      onError: (errors) => {
        toast.dismiss();
        toast.error(typeof errors === 'string' ? t(errors) : t('Failed to update brand status') + `: ${Object.values(errors).join(', ')}`);
      },
    });
  };

  const breadcrumbs = [
    { title: t('Dashboard'), href: route('dashboard') },
    { title: t('Product Management'), href: route('brands.index') },
    { title: t('Brands') },
  ];

  const SortIcon = ({ field }: { field: string }) =>
    pageFilters.sort_field === field
      ? <span>{pageFilters.sort_direction === 'asc' ? ' ↑' : ' ↓'}</span>
      : <span className="opacity-40">↕</span>;

  const DESC_LIMIT = 60;

  return (
    <PageTemplate title={t('Brands')} description={t('Manage product brands information.')} url="/brands" breadcrumbs={breadcrumbs} noPadding>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: Form */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 sticky top-4">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {formMode === 'create' ? t('Add New Brand') : t('Edit Brand')}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {formMode === 'create'
                  ? t('Fill in the details to create a new brand')
                  : t('Update the brand details below')}
              </p>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              {/* Name */}
              <div className="space-y-2">
                <Label required htmlFor="name">{t('Brand Name')}</Label>
                <Input
                  required
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t('Enter brand name')}
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

              {/* Logo */}
              <div className="space-y-2">
                <Label htmlFor="logo">{t('Logo')}</Label>
                <MediaPicker
                  value={formData.logo}
                  onChange={(val) => setFormData({ ...formData, logo: val })}
                  placeholder={t('Select logo...')}
                />
                {formErrors.logo && <p className="text-sm text-red-500">{formErrors.logo}</p>}
              </div>

              {/* Website */}
              <div className="space-y-2">
                <Label htmlFor="website">{t('Website')}</Label>
                <Input
                  id="website"
                  type="text"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="e.g. https://example.com"
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
                    {formMode === 'create' ? t('Add Brand') : t('Update Brand')}
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
                    placeholder={t('Search brands...')}
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
            {(brands?.data || []).length > 0 ? (
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
                          {t('Website')}
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
                      {(brands?.data || []).map((item: any) => (
                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <td className="px-4 py-4 text-start">
                            <div className="flex items-center gap-3 min-w-0">
                              <img src={getImageUrl(item.logo)} alt={item.name} className="w-10 h-10 object-cover rounded shrink-0" />
                              <div className="min-w-0">
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
                            </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-start">
                            {item.website
                              ? <a href={item.website} target="_blank" className="text-sm text-blue-500 hover:underline">{item.website}</a>
                              : <span className="text-sm text-gray-400">-</span>}
                          </td>
                          <td className="px-4 py-4 text-start">
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
                                    <Button
                                      variant="ghost" size="sm"
                                      onClick={() => handleToggleStatus(item)}
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
                                    <Button
                                      variant="ghost" size="sm"
                                      onClick={() => loadItemForEdit(item)}
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
                                    <Button
                                      variant="ghost" size="sm"
                                      onClick={() => { setCurrentItem(item); setIsDeleteModalOpen(true); }}
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
                  {(brands?.data || []).map((item: any) => (
                    <div key={item.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start space-x-3">
                          <img src={getImageUrl(item.logo)} alt={item.name} className="w-10 h-10 object-cover rounded flex-shrink-0" />
                          <div className="flex-1">
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</h3>
                            {item.website && (
                              <a href={item.website} target="_blank" className="text-xs text-blue-500 hover:underline">{item.website}</a>
                            )}
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
                        </div>
                        <div className="flex items-center space-x-1">
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
                {brands?.total > (brands?.per_page || 10) && (
                  <div className="border-t border-gray-200 dark:border-gray-700">
                    <Pagination
                      from={brands?.from || 0}
                      to={brands?.to || 0}
                      total={brands?.total || 0}
                      links={brands?.links}
                      entityName={t('brands')}
                      onPageChange={(url) => {
                        const page = new URL(url).searchParams.get('page');
                        router.get(route('brands.index'), {
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
                  <Tag className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {t('No brands found')}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                  {hasActiveFilters()
                    ? t('No brands match your search criteria. Try adjusting your filters.')
                    : t('Create brands to organize your products.')}
                </p>
                {!hasActiveFilters() && canCreate && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('Use the form on the left to add your first brand.')}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <CrudDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        itemName={currentItem?.name || ''}
        entityName="brand"
      />
    </PageTemplate>
  );
}
