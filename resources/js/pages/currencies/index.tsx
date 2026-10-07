// pages/currencies/index.tsx
import { useState, useRef, useEffect } from 'react';
import { PageTemplate } from '@/components/page-template';
import { usePage, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { Plus } from 'lucide-react';
import { hasPermission } from '@/utils/authorization';
import { CrudTable } from '@/components/CrudTable';
import { CrudFormModal } from '@/components/CrudFormModal';
import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import { toast } from '@/components/custom-toast';
import { useTranslation } from 'react-i18next';
import { Pagination } from '@/components/ui/pagination';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';
import { Dialog } from '@/components/ui/dialog';
import ViewPopup from './view';

export default function Currencies() {
    const { t } = useTranslation();
    const { auth, currencies, filters: pageFilters = {}, globalSettings } = usePage().props as any;
    const permissions = auth?.permissions || [];

    // State
    const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
    const [filterValues, setFilterValues] = useState<Record<string, any>>({});
    const [sortField, setSortField] = useState(pageFilters.sort_by || '');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(pageFilters.sort_order || 'desc');
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<any>(null);
    const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');

    const applyFilters = () => {
        const params: any = { page: 1 };
        if (searchTerm) params.search = searchTerm;
        if (pageFilters.per_page) params.per_page = pageFilters.per_page;
        if (sortField) {
            params.sort_by = sortField;
            params.sort_order = sortDirection;
        }
        Object.entries(filterValues).forEach(([key, value]) => {
            if (value && value !== '' && value !== 'all') {
                params[key] = value;
            }
        });
        router.get(route('currencies.index'), params, { preserveState: true, preserveScroll: true });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters();
    };

    const handleSort = (field: string) => {
        const newDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(newDirection);

        const params: any = { page: 1 };
        if (searchTerm) params.search = searchTerm;
        params.sort_by = field;
        params.sort_order = newDirection;
        if (pageFilters.per_page) params.per_page = pageFilters.per_page;
        Object.entries(filterValues).forEach(([key, value]) => {
            if (value && value !== '' && value !== 'all') {
                params[key] = value;
            }
        });
        router.get(route('currencies.index'), params, { preserveState: true, preserveScroll: true });
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

    const hasActiveFilters = () => {
        return Object.values(filterValues).some(value => {
            return value && value !== '' && value !== 'all';
        }) || searchTerm !== '';
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
        }
    };

    const handleAddNew = () => {
        setCurrentItem(null);
        setFormMode('create');
        setIsFormModalOpen(true);
    };

    const handleFormSubmit = (formData: any) => {
        if (formMode === 'create') {
            if (!globalSettings?.is_demo) toast.loading(t('Creating currency...'));

            router.post(route('currencies.store'), formData, {
                onSuccess: (page) => {
                    setIsFormModalOpen(false);
                    if (!globalSettings?.is_demo) toast.dismiss();
                    if (page.props.flash.success) toast.success(t(page.props.flash.success));
                    else if (page.props.flash.error) toast.error(t(page.props.flash.error));
                },
                onError: (errors) => {
                    if (!globalSettings?.is_demo) toast.dismiss();
                    toast.error(typeof errors === 'string' ? t(errors) : t('Failed to create currency: {{errors}}', { errors: Object.values(errors).join(', ') }));
                }
            });
        } else if (formMode === 'edit') {
            if (!globalSettings?.is_demo) toast.loading(t('Updating currency...'));

            router.put(route('currencies.update', currentItem.id), formData, {
                onSuccess: (page) => {
                    setIsFormModalOpen(false);
                    if (!globalSettings?.is_demo) toast.dismiss();
                    if (page.props.flash.success) toast.success(t(page.props.flash.success));
                    else if (page.props.flash.error) toast.error(t(page.props.flash.error));
                },
                onError: (errors) => {
                    if (!globalSettings?.is_demo) toast.dismiss();
                    toast.error(typeof errors === 'string' ? t(errors) : t('Failed to update currency: {{errors}}', { errors: Object.values(errors).join(', ') }));
                }
            });
        }
    };

    const handleDeleteConfirm = () => {
        if (!globalSettings?.is_demo) toast.loading(t('Deleting currency...'));

        router.delete(route('currencies.destroy', currentItem.id), {
            onSuccess: (page) => {
                setIsDeleteModalOpen(false);
                if (!globalSettings?.is_demo) toast.dismiss();
                if (page.props.flash.success) toast.success(t(page.props.flash.success));
                else if (page.props.flash.error) toast.error(t(page.props.flash.error));
            },
            onError: (errors) => {
                if (!globalSettings?.is_demo) toast.dismiss();
                toast.error(typeof errors === 'string' ? t(errors) : t('Failed to delete currency: {{errors}}', { errors: Object.values(errors).join(', ') }));
            }
        });
    };

    const handleResetFilters = () => {
        setSearchTerm('');
        setFilterValues({});
        setSortField('');
        setSortDirection('desc');
        router.get(route('currencies.index'), { page: 1 }, { preserveState: true, preserveScroll: true });
    };

    const pageActions: any[] = [];
    if (hasPermission(permissions, 'manage-currencies')) {
        pageActions.push({
            label: t('Add Currency'),
            icon: <Plus className="h-4 w-4" />,
            variant: 'default',
            onClick: () => handleAddNew()
        });
    }

    const breadcrumbs = [
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Currency') }
    ];

    const columns = [
        { key: 'name', label: t('Name'), sortable: true },
        { key: 'code', label: t('Code'), sortable: true },
        { key: 'symbol', label: t('Symbol'), sortable: true },
        {
            key: 'is_default',
            label: t('Default'),
            render: (value: boolean) => (
                <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                    value
                        ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20'
                        : 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20'
                }`}>
                    {value ? t('Yes') : t('No')}
                </span>
            )
        }
    ];

    const actions = [
        { label: t('View'), icon: 'Eye', action: 'view', className: 'text-blue-500', requiredPermission: 'manage-currencies' },
        { label: t('Edit'), icon: 'Edit', action: 'edit', className: 'text-amber-500', requiredPermission: 'manage-currencies' },
        { label: t('Delete'), icon: 'Trash2', action: 'delete', className: 'text-red-500', requiredPermission: 'manage-currencies', condition: (row: any) => !row.is_default }
    ];

    return (
        <PageTemplate
            title={t('Currency')}
            url="/currencies"
            actions={pageActions}
            breadcrumbs={breadcrumbs}
            noPadding
            description={t('Manage your currencies.')}
        >
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow mb-4 border">
                <SearchAndFilterBar
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    onSearch={handleSearch}
                    filters={[]}
                    hasActiveFilters={hasActiveFilters}
                    activeFilterCount={() => {
                        return Object.values(filterValues).filter(v => v && v !== '' && v !== 'all').length + (searchTerm ? 1 : 0);
                    }}
                    onResetFilters={handleResetFilters}
                />
            </div>

            {/* Content section */}
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden">
                <CrudTable
                    columns={columns}
                    actions={actions}
                    data={currencies?.data || []}
                    from={currencies?.from || 1}
                    onAction={handleAction}
                    sortField={sortField}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                    permissions={permissions}
                    entityPermissions={{
                        view: 'manage-currencies',
                        create: 'manage-currencies',
                        edit: 'manage-currencies',
                        delete: 'manage-currencies'
                    }}
                />

                <Pagination
                    from={currencies?.from || 0}
                    to={currencies?.to || 0}
                    total={currencies?.total || 0}
                    links={currencies?.links}
                    entityName={t('currencies')}
                    onPageChange={(url) => {
                        if (url) {
                            const urlObj = new URL(url, window.location.origin);
                            if (pageFilters.per_page) urlObj.searchParams.set('per_page', pageFilters.per_page.toString());
                            if (pageFilters.search) urlObj.searchParams.set('search', pageFilters.search);
                            if (sortField) {
                                urlObj.searchParams.set('sort_by', sortField);
                                urlObj.searchParams.set('sort_order', sortDirection);
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
                        Object.entries(filterValues).forEach(([key, val]) => {
                            if (val && val !== '' && val !== 'all') params[key] = val;
                        });
                        if (sortField) {
                            params.sort_by = sortField;
                            params.sort_order = sortDirection;
                        }
                        router.get(route('currencies.index'), params, { preserveState: true, preserveScroll: true });
                    }}
                />
            </div>

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
                        { name: 'name', label: t('Currency Name'), type: 'text', required: true, placeholder: t('e.g. US Dollar, Euro, British Pound') },
                        { name: 'code', label: t('Currency Code'), type: 'text', required: true, placeholder: t('e.g. USD, EUR, GBP') },
                        { name: 'symbol', label: t('Currency Symbol'), type: 'text', required: true, placeholder: t('e.g. $, €, £') },
                        { name: 'description', label: t('Description'), type: 'textarea', placeholder: t('Enter currency description...') },
                        { name: 'is_default', label: t('Set as Default Currency'), type: 'checkbox' }
                    ],
                    modalSize: 'lg'
                }}
                initialData={currentItem}
                title={
                    formMode === 'create'
                        ? t('Add New Currency')
                        : formMode === 'edit'
                            ? t('Edit Currency')
                            : t('View Currency')
                }
                mode={formMode}
            />

            {/* Delete Modal */}
            <CrudDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                itemName={currentItem?.name || ''}
                entityName="currency"
            />
        </PageTemplate>
    );
}
