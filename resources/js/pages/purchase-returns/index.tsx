import { useState, useEffect, useRef } from 'react';
import { PageTemplate } from '@/components/page-template';
import { usePage, router } from '@inertiajs/react';
import { Plus, CheckCircle, XCircle, FileText, Clock, List, Hourglass, DollarSign } from 'lucide-react';
import { hasPermission } from '@/utils/authorization';
import { CrudTable } from '@/components/CrudTable';
import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import { toast } from '@/components/custom-toast';
import { useTranslation } from 'react-i18next';
import { Pagination } from '@/components/ui/pagination';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';
import { useInitials } from '@/hooks/use-initials';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function PurchaseReturns() {
    const { t } = useTranslation();
    const { auth, purchaseReturns, purchases, vendors, branches, statusCounts, filters: pageFilters = {} } = usePage().props as any;
    const permissions = auth?.permissions || [];
    const getInitials = useInitials();

    const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
    const [filterValues, setFilterValues] = useState<Record<string, any>>({
        status: pageFilters.status || 'all',
        branch_id: pageFilters.branch_id || 'all',
        vendor_id: pageFilters.vendor_id || 'all',
        return_date_from: pageFilters.return_date_from || '',
        return_date_to: pageFilters.return_date_to || ''
    });
    const [sortField, setSortField] = useState(pageFilters.sort_field || '');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(pageFilters.sort_direction || 'desc');
    const [activeStatusTab, setActiveStatusTab] = useState(pageFilters.status || 'all');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<any>(null);

    const hasActiveFilters = () => {
        return Object.values(filterValues).some(value => {
            return value && value !== '' && value !== 'all';
        }) || searchTerm !== ''|| activeStatusTab !== 'all';
    };

    const handleFilterChange = (key: string, value: any) => {
        setFilterValues(prev => ({ ...prev, [key]: value }));
    };

    const handleStatusTabChange = (status: string) => {
        setActiveStatusTab(status);
        const params: any = { page: 1, status: status === 'all' ? undefined : status };
        if (searchTerm) params.search = searchTerm;
        if (filterValues.branch_id && filterValues.branch_id !== 'all') params.branch_id = filterValues.branch_id;
        if (filterValues.vendor_id && filterValues.vendor_id !== 'all') params.vendor_id = filterValues.vendor_id;
        if (filterValues.return_date_from) params.return_date_from = filterValues.return_date_from;
        if (filterValues.return_date_to) params.return_date_to = filterValues.return_date_to;
        if (pageFilters.per_page) params.per_page = pageFilters.per_page;
        if (sortField) { params.sort_field = sortField; params.sort_direction = sortDirection; }
        router.get(route('purchase-returns.index'), params, { preserveState: true, preserveScroll: true });
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
        if (activeStatusTab && activeStatusTab !== 'all') params.status = activeStatusTab;
        if (filterValues.branch_id && filterValues.branch_id !== 'all') params.branch_id = filterValues.branch_id;
        if (filterValues.vendor_id && filterValues.vendor_id !== 'all') params.vendor_id = filterValues.vendor_id;
        if (filterValues.return_date_from) params.return_date_from = filterValues.return_date_from;
        if (filterValues.return_date_to) params.return_date_to = filterValues.return_date_to;
        if (pageFilters.per_page) params.per_page = pageFilters.per_page;
        if (sortField) {
            params.sort_field = sortField;
            params.sort_direction = sortDirection;
        }
        router.get(route('purchase-returns.index'), params, { preserveState: true, preserveScroll: true });
    };

    const handleSort = (field: string) => {
        const newDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(newDirection);
        
        const params: any = { sort_field: field, sort_direction: newDirection, page: 1 };
        if (searchTerm) params.search = searchTerm;
        if (activeStatusTab && activeStatusTab !== 'all') params.status = activeStatusTab;
        if (filterValues.branch_id && filterValues.branch_id !== 'all') params.branch_id = filterValues.branch_id;
        if (filterValues.vendor_id && filterValues.vendor_id !== 'all') params.vendor_id = filterValues.vendor_id;
        if (filterValues.return_date_from) params.return_date_from = filterValues.return_date_from;
        if (filterValues.return_date_to) params.return_date_to = filterValues.return_date_to;
        if (pageFilters.per_page) params.per_page = pageFilters.per_page;
        Object.entries(filterValues).forEach(([key, value]) => {
            if (value && value !== '' && value !== 'all') {
                params[key] = value;
            }
        });
        router.get(route('purchase-returns.index'), params, { preserveState: true, preserveScroll: true });
    };

    const handleAction = (action: string, item: any) => {
        setCurrentItem(item);
        switch (action) {
            case 'view':
                router.visit(route('purchase-returns.show', item.id));
                break;
            case 'edit':
                router.visit(route('purchase-returns.edit', item.id));
                break;
            case 'delete':
                setIsDeleteModalOpen(true);
                break;
            case 'approve':
                handleApprove(item);
                break;
            case 'reject':
                handleReject(item);
                break;
        }
    };

    const handleAddNew = () => {
        router.visit(route('purchase-returns.create'));
    };

    const handleDeleteConfirm = () => {
        toast.loading(t('Deleting purchase return...'));
        router.delete(route('purchase-returns.destroy', currentItem.id), {
            onSuccess: (page) => {
                toast.dismiss();
                setIsDeleteModalOpen(false);
                if (page.props.flash?.success) {
                    toast.success(page.props.flash.success);
                }
                router.reload();
            },
            onError: (errors) => {
                toast.dismiss();
                setIsDeleteModalOpen(false);
                if (typeof errors === 'string') {
                    toast.error(errors);
                } else {
                    toast.error(t('Network error occurred'));
                }
            }
        });
    };

    const handleApprove = (item: any) => {
        toast.loading(t('Approving purchase return...'));
        router.post(route('purchase-returns.approve', item.id), {}, {
            onSuccess: (page) => {
                toast.dismiss();
                if (page.props.flash?.error) {
                    toast.error(page.props.flash.error);
                } else if (page.props.flash?.success) {
                    toast.success(t(page.props.flash.success));
                } else {
                    toast.success(t('Product return Approve successfully'));
                }
                router.reload();
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

    const handleReject = (item: any) => {
        toast.loading(t('Rejecting purchase return...'));
        router.post(route('purchase-returns.reject', item.id), {}, {
            onSuccess: (page) => {
                toast.dismiss();
                if (page.props.flash?.error) {
                    toast.error(page.props.flash.error);
                } else if (page.props.flash?.success) {
                    toast.success(t(page.props.flash.success));
                } else {
                    toast.success(t('Product return Reject successfully'));
                }
                router.reload();
            },
            onError: (errors) => {
                toast.dismiss();
                if (errors.response?.data?.error) {
                    toast.error(errors.response.data.error);
                } else if (errors.response?.data?.message) {
                    toast.error(errors.response.data.message);
                } else if (typeof errors === 'string') {
                    toast.error(errors);
                } else if (errors.message) {
                    toast.error(errors.message);
                } else {
                    toast.error(t('Failed to reject purchase return'));
                }
            }
        });
    };

    const handleResetFilters = () => {
        setSearchTerm('');
        isInitialMount.current = true;
        setFilterValues({
            status: 'all',
            branch_id: 'all',
            vendor_id: 'all',
            return_date_from: '',
            return_date_to: ''
        });
        setSortField('');
        setSortDirection('desc');
        setActiveStatusTab('all');
        // Preserve activeStatusTab when resetting other filters
        
        router.get(route('purchase-returns.index'), {}, { preserveState: true, preserveScroll: true });
    };

    const pageActions = [];
    if (hasPermission(permissions, 'create-purchase-returns')) {
        pageActions.push({
            label: t('Add Purchase Return'),
            icon: <Plus className="h-4 w-4" />,
            variant: 'default',
            onClick: () => handleAddNew()
        });
    }

    const summaryStats = {
        totalReturns: purchaseReturns?.stats?.total_returns || 0,
        pendingReturns: purchaseReturns?.stats?.pending_returns || 0,
        approvedReturns: purchaseReturns?.stats?.approved_returns || 0,
        rejectedReturns: purchaseReturns?.stats?.rejected_returns || 0,
        totalReturnAmount: purchaseReturns?.stats?.total_return_amount || 0
    };

    const breadcrumbs = [
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Purchase Management'), href: route('purchases.index') },
        { title: t('Purchase Returns') }
    ];

    const columns = [
        {
            key: 'return_number',
            label: t('Return Number'),
            sortable: true,
            render: (value: string, row: any) => (
                <button
                    onClick={() => handleAction('view', row)}
                    className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20 whitespace-nowrap"
                >
                    {value}
                </button>
            )
        },
        { key: 'purchase', label: t('Purchase Number'), render: (value: any) => (
            <button
                onClick={() => value?.id && router.visit(route('purchases.show', value.id))}
                className='inline-flex items-center rounded-md px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20 whitespace-nowrap'
            >
                {value?.purchase_number || '-'}
            </button>
        )},
        { key: 'vendor', label: t('Vendor'), render: (value: any) =>(
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
        { key: 'branch', label: t('Branch'), render: (value: any) => value?.name || '-' },
        { key: 'return_date', label: t('Return Date'), sortable: true, type: 'date'
            // render: (value: string) => window.appSettings?.formatDateTime(value, false) || new Date(value).toLocaleDateString() 
        },
        {
            key: 'status',
            label: t('Status'),
            render: (value: string) => (
                <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${value === 'approved' ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20' :
                    value === 'rejected' ? 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20' :
                        'bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-600/20'
                    }`}>
                    {value === 'approved' ? t('Approved') : value === 'rejected' ? t('Rejected') : t('Pending')}
                </span>
            )
        },
        { key: 'grand_total', label: t('Total Amount'), sortable: true, render: (value: number) => <span className="font-mono">{window.appSettings.formatCurrency(value || 0)}</span> },
    ];

    const actions = [
        {
            label: t('Approve'),
            icon: 'Check',
            action: 'approve',
            className: 'text-green-500',
            requiredPermission: 'approve-purchase-returns',
            condition: (item: any) => item.status === 'pending'
        },
        {
            label: t('Reject'),
            icon: 'X',
            action: 'reject',
            className: 'text-red-500',
            requiredPermission: 'reject-purchase-returns',
            condition: (item: any) => item.status === 'pending'
        },
        { label: t('View'), icon: 'Eye', action: 'view', className: 'text-blue-500', requiredPermission: 'view-purchase-returns' },
        {
            label: t('Edit'),
            icon: 'Edit',
            action: 'edit',
            className: 'text-amber-500',
            requiredPermission: 'edit-purchase-returns',
            condition: (item: any) => item.status === 'pending' || item.status === 'rejected' || item.status === 'approved'
        },
        {
            label: t('Delete'),
            icon: 'Trash2',
            action: 'delete',
            className: 'text-red-500',
            requiredPermission: 'delete-purchase-returns'
        }
    ];

    const statusTabs = [
        { key: 'all', label: t('All Returns'), count: statusCounts?.total || 0, icon: FileText },
        { key: 'pending', label: t('Pending'), count: statusCounts?.pending || 0, icon: Clock },
        { key: 'approved', label: t('Approved'), count: statusCounts?.approved || 0, icon: CheckCircle },
        { key: 'rejected', label: t('Rejected'), count: statusCounts?.rejected || 0, icon: XCircle }
    ];

    const filterOptions = [
        {
            name: 'branch_id',
            label: t('Branch'),
            type: 'select',
            value: filterValues.branch_id,
            onChange: (value: any) => handleFilterChange('branch_id', value),
            options: [
                { value: 'all', label: t('All Branches') },
                ...(branches?.map((branch: any) => ({
                    value: branch.id.toString(),
                    label: branch.name
                })) || [])
            ]
        },
        {
            name: 'vendor_id',
            label: t('Vendor'),
            type: 'select', 
            value: filterValues.vendor_id,
            onChange: (value: any) => handleFilterChange('vendor_id', value),
            options: [
                { value: 'all', label: t('All Vendors') },
                ...(vendors?.map((vendor: any) => ({
                    value: vendor.id.toString(),
                    label: vendor.name
                })) || [])
            ]
        },
        {
            name: 'return_date_from',
            label: t('Return Date From'),
            type: 'date',
            value: filterValues.return_date_from,
            onChange: (value: any) => handleFilterChange('return_date_from', value)
        },
        {
            name: 'return_date_to',
            label: t('Return Date To'),
            type: 'date',
            value: filterValues.return_date_to,
            onChange: (value: any) => handleFilterChange('return_date_to', value)
        }
    ];

    return (
        <PageTemplate title={t("Purchase Returns")} description={t('Handle and track product returns from vendors.')} url="/purchase-returns" actions={pageActions} breadcrumbs={breadcrumbs} noPadding>
            <style>{`
            main {
            max-width: 100vw;
            overflow-x: hidden !important;
            }
            body {
            overflow-x: hidden !important;
            }
        `}</style>

            {/* Summary KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                <div className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-blue-50 dark:bg-blue-700/20 rounded-bl-full"></div>
                    <div className="p-4 relative">
                        <div className="flex items-start justify-between mb-3">
                            <div className="text-left">
                                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 capitalize tracking-wide mb-1">{t('Total Returns')}</p>
                                <p className="text-xl font-bold text-gray-900 dark:text-white">{summaryStats.totalReturns}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('All time returns')}</p>
                            </div>
                            <div className="relative z-10 p-2.5 bg-blue-50 dark:bg-blue-700/20 rounded-xl mt-0.5">
                                <List className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-50 dark:bg-yellow-700/20 rounded-bl-full"></div>
                    <div className="p-4 relative">
                        <div className="flex items-start justify-between mb-3">
                            <div className="text-left">
                                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 capitalize tracking-wide mb-1">{t('Pending Returns')}</p>
                                <p className="text-xl font-bold text-gray-900 dark:text-white">{summaryStats.pendingReturns}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {summaryStats.totalReturns > 0
                                        ? `${((summaryStats.pendingReturns / summaryStats.totalReturns) * 100).toFixed(1)}% ${t('of total')}`
                                        : '0% of total'
                                    }
                                </p>
                            </div>
                            <div className="relative z-10 p-2.5 bg-yellow-50 dark:bg-yellow-700/20 rounded-xl mt-0.5">
                                <Hourglass className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-green-50 dark:bg-green-700/20 rounded-bl-full"></div>
                    <div className="p-4 relative">
                        <div className="flex items-start justify-between mb-3">
                            <div className="text-left">
                                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 capitalize tracking-wide mb-1">{t('Approved Returns')}</p>
                                <p className="text-xl font-bold text-gray-900 dark:text-white">{summaryStats.approvedReturns}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {summaryStats.totalReturns > 0
                                        ? `${((summaryStats.approvedReturns / summaryStats.totalReturns) * 100).toFixed(1)}% ${t('of total')}`
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
                                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 capitalize tracking-wide mb-1">{t('Rejected Returns')}</p>
                                <p className="text-xl font-bold text-gray-900 dark:text-white">{summaryStats.rejectedReturns}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {summaryStats.totalReturns > 0
                                        ? `${((summaryStats.rejectedReturns / summaryStats.totalReturns) * 100).toFixed(1)}% ${t('of total')}`
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
                    <div className="absolute top-0 right-0 w-20 h-20 bg-purple-50 dark:bg-purple-700/20 rounded-bl-full"></div>
                    <div className="p-4 relative">
                        <div className="flex items-start justify-between mb-3">
                            <div className="text-left">
                                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 capitalize tracking-wide mb-1">{t('Total Return Amount')}</p>
                                <p className="text-xl font-mono text-gray-900 dark:text-white">
                                    {window.appSettings?.formatCurrency
                                        ? window.appSettings.formatCurrency(summaryStats.totalReturnAmount)
                                        : `$${summaryStats.totalReturnAmount.toFixed(2)}`
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
                    data={purchaseReturns?.data || []}
                    from={purchaseReturns?.from || 1}
                    onAction={handleAction}
                    sortField={sortField}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                    permissions={permissions}
                    entityPermissions={{
                        view: 'view-purchase-returns',
                        create: 'create-purchase-returns',
                        edit: 'edit-purchase-returns',
                        delete: 'delete-purchase-returns'
                    }}
                />

                <Pagination
                    from={purchaseReturns?.from || 0}
                    to={purchaseReturns?.to || 0}
                    total={purchaseReturns?.total || 0}
                    links={purchaseReturns?.links || []}
                    entityName={t("purchase returns")}
                    onPageChange={(url) => {
                        if (url) {
                            const urlObj = new URL(url, window.location.origin);
                            if (pageFilters.per_page) urlObj.searchParams.set('per_page', pageFilters.per_page.toString());
                            if (searchTerm) urlObj.searchParams.set('search', searchTerm);
                            if (activeStatusTab && activeStatusTab !== 'all') urlObj.searchParams.set('status', activeStatusTab);
                            if (filterValues.branch_id && filterValues.branch_id !== 'all') urlObj.searchParams.set('branch_id', filterValues.branch_id);
                            if (filterValues.vendor_id && filterValues.vendor_id !== 'all') urlObj.searchParams.set('vendor_id', filterValues.vendor_id);
                            if (filterValues.return_date_from) urlObj.searchParams.set('return_date_from', filterValues.return_date_from);
                            if (filterValues.return_date_to) urlObj.searchParams.set('return_date_to', filterValues.return_date_to);
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
                        if (activeStatusTab && activeStatusTab !== 'all') params.status = activeStatusTab;
                        if (filterValues.branch_id && filterValues.branch_id !== 'all') params.branch_id = filterValues.branch_id;
                        if (filterValues.vendor_id && filterValues.vendor_id !== 'all') params.vendor_id = filterValues.vendor_id;
                        if (filterValues.return_date_from) params.return_date_from = filterValues.return_date_from;
                        if (filterValues.return_date_to) params.return_date_to = filterValues.return_date_to;
                        Object.entries(filterValues).forEach(([key, val]) => {
                            if (val && val !== '' && val !== 'all') params[key] = val;
                        });
                        if (sortField) {
                            params.sort_field = sortField;
                            params.sort_direction = sortDirection;
                        }
                        router.get(route('purchase-returns.index'), params, { preserveState: true, preserveScroll: true });
                    }}
                />
            </div>

            <CrudDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                itemName={currentItem?.return_number || ''}
                entityName="purchase return"
            />
        </PageTemplate>
    );
}
