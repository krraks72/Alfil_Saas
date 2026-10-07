import { useState, useRef, useEffect } from 'react';
import { PageTemplate } from '@/components/page-template';
import { usePage, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { Plus, Eye, CheckCircle, XCircle, Download, List, Hourglass, DollarSign, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { hasPermission } from '@/utils/authorization';
import { CrudTable } from '@/components/CrudTable';
import { CrudFormModal } from '@/components/CrudFormModal';
import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import { toast } from '@/components/custom-toast';
import { useTranslation } from 'react-i18next';
import { Pagination } from '@/components/ui/pagination';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';

export default function SaleReturns() {
    const { t } = useTranslation();
    const { auth, saleReturns, sales, customers, branches, filters: pageFilters = {} } = usePage().props as any;
    const permissions = auth?.permissions || [];
    const getInitials = useInitials();

    const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
    const [filterValues, setFilterValues] = useState<Record<string, any>>({
        status: pageFilters.status || 'all',
        branch_id: pageFilters.branch_id || 'all',
        customer_id: pageFilters.customer_id || 'all'
    });
    const [sortField, setSortField] = useState(pageFilters.sort_field || '');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(pageFilters.sort_direction || 'desc');
    const [statusFilter, setStatusFilter] = useState(pageFilters.status || 'all');
    const [branchFilter, setBranchFilter] = useState(pageFilters.branch_id || 'all');
    const [customerFilter, setCustomerFilter] = useState(pageFilters.customer_id || 'all');
    const [selectedYear, setSelectedYear] = useState(pageFilters.year || '');
    const [selectedMonth, setSelectedMonth] = useState(pageFilters.month || '');
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<any>(null);
    const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');

    const hasActiveFilters = () => {
        return Object.values(filterValues).some(value => {
            return value && value !== '' && value !== 'all';
        }) || searchTerm !== '';
    };
    
    const handleFilterChange = (key: string, value: any) => {
        setFilterValues(prev => ({ ...prev, [key]: value }));
        // Also update individual state for backward compatibility
        if (key === 'status') setStatusFilter(value);
        if (key === 'branch_id') setBranchFilter(value);
        if (key === 'customer_id') setCustomerFilter(value);
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
        if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
        if (branchFilter && branchFilter !== 'all') params.branch_id = branchFilter;
        if (customerFilter && customerFilter !== 'all') params.customer_id = customerFilter;
        if (selectedYear) params.year = selectedYear;
        if (selectedMonth) params.month = selectedMonth;
        if (pageFilters.per_page) params.per_page = pageFilters.per_page;
        if (sortField) { params.sort_field = sortField; params.sort_direction = sortDirection; }
        router.get(route('sale-returns.index'), params, { preserveState: true, preserveScroll: true });
    };

    const handleSort = (field: string) => {
        const newDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(newDirection);
        
        const params: any = { sort_field: field, sort_direction: newDirection, page: 1 };
        if (searchTerm) params.search = searchTerm;
        if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
        if (branchFilter && branchFilter !== 'all') params.branch_id = branchFilter;
        if (customerFilter && customerFilter !== 'all') params.customer_id = customerFilter;
        if (selectedYear) params.year = selectedYear;
        if (selectedMonth) params.month = selectedMonth;
        if (pageFilters.per_page) params.per_page = pageFilters.per_page;
        router.get(route('sale-returns.index'), params, { preserveState: true, preserveScroll: true });
    };

    const handleAction = (action: string, item: any) => {
        setCurrentItem(item);
        switch (action) {
            case 'view':
                router.visit(route('sale-returns.show', item.id));
                break;
            case 'edit':
                router.visit(route('sale-returns.edit', item.id));
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
        router.visit(route('sale-returns.create'));
    };

    const handleFormSubmit = (formData: any) => {
        // Client-side validation for items
        if (!formData.items || formData.items.length === 0) {
            toast.error(t('Please select at least one item to return'));
            return;
        }

        if (formMode === 'create') {
            toast.loading(t('Creating sale return...'));
            router.post(route('sale-returns.store'), formData, {
                onSuccess: (page) => {
                    toast.dismiss();
                    setIsFormModalOpen(false);
                    if (page.props.flash?.success) {
                        toast.success(page.props.flash.success);
                    }
                    router.reload();
                },
                onError: (errors) => {
                    toast.dismiss();
                    // Handle validation errors properly
                    if (errors.items) {
                        toast.error(t('Please select at least one item to return'));
                    } else if (errors.message) {
                        toast.error(errors.message);
                    } else if (typeof errors === 'string') {
                        toast.error(errors);
                    } else {
                        // Show first validation error
                        const firstError = Object.values(errors)[0];
                        if (Array.isArray(firstError)) {
                            toast.error(firstError[0]);
                        } else {
                            toast.error(firstError || t('Failed to create sale return'));
                        }
                    }
                }
            });
        } else if (formMode === 'edit') {
            toast.loading(t('Updating sale return...'));
            router.put(route('sale-returns.update', currentItem.id), formData, {
                onSuccess: (page) => {
                    toast.dismiss();
                    setIsFormModalOpen(false);
                    if (page.props.flash?.success) {
                        toast.success(page.props.flash.success);
                    } else {
                        toast.success(t('Sale return updated successfully'));
                    }
                    router.reload();
                },
                onError: (errors) => {
                    toast.dismiss();
                    // Handle demo mode error specifically
                    if (errors.response?.status === 403 && errors.response?.data?.demo_mode) {
                        toast.error(errors.response.data.error || t('This action is disabled in demo mode'));
                    } else if (errors.items) {
                        toast.error(t('Please select at least one item to return'));
                    } else if (errors.response?.data?.error) {
                        toast.error(errors.response.data.error);
                    } else if (errors.response?.data?.message) {
                        toast.error(errors.response.data.message);
                    } else if (typeof errors === 'string') {
                        toast.error(errors);
                    } else if (errors.message) {
                        toast.error(errors.message);
                    } else {
                        // Show first validation error
                        const firstError = Object.values(errors)[0];
                        if (Array.isArray(firstError)) {
                            toast.error(firstError[0]);
                        } else {
                            toast.error(firstError || t('Failed to update sale return'));
                        }
                    }
                }
            });
        }
    };

    const handleDeleteConfirm = () => {
        toast.loading(t('Deleting sale return...'));
        router.delete(route('sale-returns.destroy', currentItem.id), {
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
        toast.loading(t('Approving sale return...'));
        router.post(route('sale-returns.approve', item.id), {}, {
            onSuccess: (page) => {
                toast.dismiss();
                if (page.props.flash?.error) {
                    toast.error(page.props.flash.error);
                } else if (page.props.flash?.success) {
                    toast.success(t(page.props.flash.success));
                } else {
                    toast.success(t('Sales return Approve successfully'));
                }
                router.reload();
            },
            onError: (errors) => {
                toast.dismiss();
                // Handle field validation errors
                const firstError = Object.values(errors)[0];
                if (Array.isArray(firstError)) {
                    toast.error(firstError[0]);
                } else {
                    toast.error(firstError[0]);
                }
            }
        });
    }

    const handleReject = (item: any) => {
        toast.loading(t('Rejecting sale return...'));
        router.post(route('sale-returns.reject', item.id), {}, {
            onSuccess: (page) => {
                toast.dismiss();
                if (page.props.flash?.error) {
                    toast.error(page.props.flash.error);
                } else if (page.props.flash?.success) {
                    toast.success(t(page.props.flash.success));
                } else {
                    toast.success(t('Sales purchase Reject successfully'));
                }
                router.reload();;
            },
            onError: (errors) => {
                toast.dismiss();
                // Handle field validation errors
                const firstError = Object.values(errors)[0];
                if (Array.isArray(firstError)) {
                    toast.error(firstError[0]);
                } else {
                    toast.error(firstError[0]);
                }
            }
        });
    };

    const handleYearChange = (year: string) => {
        setSelectedYear(year);
        const params: any = { page: 1 };
        if (searchTerm) params.search = searchTerm;
        if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
        if (branchFilter && branchFilter !== 'all') params.branch_id = branchFilter;
        if (customerFilter && customerFilter !== 'all') params.customer_id = customerFilter;
        if (year && year !== 'all') params.year = year;
        if (selectedMonth) params.month = selectedMonth;
        if (pageFilters.per_page) params.per_page = pageFilters.per_page;
        if (sortField) { params.sort_field = sortField; params.sort_direction = sortDirection; }
        router.get(route('sale-returns.index'), params, { preserveState: true, preserveScroll: true });
    };

    const handleMonthChange = (month: string) => {
        setSelectedMonth(month);
        const params: any = { page: 1 };
        if (searchTerm) params.search = searchTerm;
        if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
        if (branchFilter && branchFilter !== 'all') params.branch_id = branchFilter;
        if (customerFilter && customerFilter !== 'all') params.customer_id = customerFilter;
        if (selectedYear) params.year = selectedYear;
        if (month && month !== 'all') params.month = month;
        if (pageFilters.per_page) params.per_page = pageFilters.per_page;
        if (sortField) { params.sort_field = sortField; params.sort_direction = sortDirection; }
        router.get(route('sale-returns.index'), params, { preserveState: true, preserveScroll: true });
    };

    // Generate years (current year and all previous years back to a reasonable limit)
    const generateYears = () => {
        const currentYear = new Date().getFullYear();
        const years = [];
        const startYear = 2000; // You can adjust this starting year as needed
        for (let year = currentYear; year >= startYear; year--) {
            years.push(year.toString());
        }
        return years;
    };

    // Generate months
    const generateMonths = () => {
        return [
            { value: '01', label: t('January') },
            { value: '02', label: t('February') },
            { value: '03', label: t('March') },
            { value: '04', label: t('April') },
            { value: '05', label: t('May') },
            { value: '06', label: t('June') },
            { value: '07', label: t('July') },
            { value: '08', label: t('August') },
            { value: '09', label: t('September') },
            { value: '10', label: t('October') },
            { value: '11', label: t('November') },
            { value: '12', label: t('December') }
        ];
    };

    const handleResetFilters = () => {
        setSearchTerm('');
        setStatusFilter('all');
        setBranchFilter('all');
        setCustomerFilter('all');
        // Don't reset year and month - keep current selections
        setShowFilters(false);
        
        const params: any = {
            page: 1,
            per_page: pageFilters.per_page
        };
        
        // Keep existing year and month selections
        if (selectedYear) params.year = selectedYear;
        if (selectedMonth) params.month = selectedMonth;
        
        router.get(route('sale-returns.index'), params, { preserveState: true, preserveScroll: true });
    };

    const handleExport = () => {
        if (hasPermission(permissions, 'export-sale-returns')) {
            // Build URL with current filters including year and month
            const params = new URLSearchParams();
            if (selectedYear) params.append('year', selectedYear);
            if (selectedMonth) params.append('month', selectedMonth);
            if (searchTerm) params.append('search', searchTerm);
            if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
            if (branchFilter && branchFilter !== 'all') params.append('branch_id', branchFilter);
            if (customerFilter && customerFilter !== 'all') params.append('customer_id', customerFilter);
            
            const exportUrl = route('sale-return.export') + (params.toString() ? '?' + params.toString() : '');
            window.location.href = exportUrl;
        }
    };

    const pageActions = [];
    if (hasPermission(permissions, 'export-sale-returns')) {
        pageActions.push({
            label: t('Export'),
            icon: <Download className="h-4 w-4" />,
            variant: 'outline',
            onClick: handleExport
        });
    }
    if (hasPermission(permissions, 'create-sale-returns')) {
        pageActions.push({
            label: t('Add Sale Return'),
            icon: <Plus className="h-4 w-4" />,
            variant: 'default',
            onClick: () => handleAddNew()
        });
    }

    const breadcrumbs = [
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Sales Management'), href: route('sales.index') },
        { title: t('Sale Returns') }
    ];

    const columns = [
        {
            key: 'return_number',
            label: t('Return Number'),
            sortable: true,
            render: (value: string, row: any) => (
                <button
                    onClick={() => router.visit(route('sale-returns.show', row.id))}
                    className="inline-flex items-center text-nowrap rounded-md px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20"
                >
                    {value}
                </button>
            )
        },
        { key: 'customer', label: t('Customer'), render: (value: any) => (
            <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                    <AvatarImage src={value?.avatar} />
                    <AvatarFallback>{value ? getInitials(value?.name) : 'WC'}</AvatarFallback>
                </Avatar>
                <div>
                    <div className="font-medium">{value?.name || t('Walk-in Customer')}</div>
                    <div className="text-xs text-gray-500">{value?.email || null}</div>
                </div>
            </div>
        ) },
        { key: 'branch', label: t('Branch'), render: (value: any) => value?.name || '-' },
        { key: 'return_date', label: t('Return Date'), sortable: true, type: 'date',
            // render: (value: string) => window.appSettings?.formatDateTime(value, false) || new Date(value).toLocaleDateString() 
        },
        { key: 'total_amount', label: t('Total Amount'), sortable: true, render: (value: number) => <span className="font-mono">{window.appSettings.formatCurrency(value || 0)}</span> },
        { key: 'items', label: t('Items'), render: (value: any) => {
            if (!value?.length) return null;
            const visible = value.slice(0, 2);
            const remaining = value.length - 2;
            return (
                <div className="w-[200px]">
                    {visible.map((item: any, index: number) => (
                        <div key={index} className="flex items-center">
                            <span className="text-sm text-gray-900 dark:text-white truncate w-[120px]">{item.product?.name}</span>
                            <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap w-[40px] text-right">x {item.quantity}</span>
                        </div>
                    ))}
                    {remaining > 0 && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">+{remaining} {t('more items')}</span>
                    )}
                </div>
            );
        } },
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
    ];

    const actions = [
        {
            label: t('Approve'),
            icon: 'Check',
            action: 'approve',
            className: 'text-green-500',
            requiredPermission: 'approve-sale-returns',
            condition: (item: any) => item.status === 'pending'
        },
        {
            label: t('Reject'),
            icon: 'X',
            action: 'reject',
            className: 'text-red-500',
            requiredPermission: 'reject-sale-returns',
            condition: (item: any) => item.status === 'pending'
        },
        { label: t('View'), icon: 'Eye', action: 'view', className: 'text-blue-500', requiredPermission: 'view-sale-returns' },
        {
            label: t('Edit'),
            icon: 'Edit',
            action: 'edit',
            className: 'text-amber-500',
            requiredPermission: 'edit-sale-returns',
            condition: (item: any) => item.status === 'pending' || item.status === 'rejected' || item.status === 'approved'
        },
        {
            label: t('Delete'),
            icon: 'Trash2',
            action: 'delete',
            className: 'text-red-500',
            requiredPermission: 'delete-sale-returns'
        }
    ];

    const filterOptions = [
        {
            name: 'branch_id',
            label: t('Branch'),
            type: 'select',
            value: branchFilter,
            onChange: setBranchFilter,
            options: [
                { value: 'all', label: t('All Branches') },
                ...(branches?.map((branch: any) => ({ value: branch.id.toString(), label: branch.name })) || [])
            ]
        },
        {
            name: 'customer_id',
            label: t('Customer'),
            type: 'select',
            value: customerFilter,
            onChange: setCustomerFilter,
            options: [
                { value: 'all', label: t('All Customers') },
                ...(customers?.map((customer: any) => ({ value: customer.id.toString(), label: customer.name })) || [])
            ]
        },
        {
            name: 'status',
            label: t('Status'),
            type: 'select',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
                { value: 'all', label: t('All Status') },
                { value: 'pending', label: t('Pending') },
                { value: 'approved', label: t('Approved') },
                { value: 'rejected', label: t('Rejected') }
            ]
        }
    ];

    // Get summary statistics from controller (proper corporate approach)
    const summaryStats = {
        totalReturns: saleReturns?.stats?.total_returns || 0,
        pendingReturns: saleReturns?.stats?.pending_returns || 0,
        approvedReturns: saleReturns?.stats?.approved_returns || 0,
        rejectedReturns: saleReturns?.stats?.rejected_returns || 0,
        totalReturnAmount: saleReturns?.stats?.total_return_amount || 0
    };

    return (
        <PageTemplate title={t("Sale Returns")} description={t('Process and manage customer product returns.')} url="/sale-returns" actions={pageActions} breadcrumbs={breadcrumbs} noPadding>
        <style>{`
            main {
            max-width: 100vw;
            overflow-x: hidden !important;
            }
            body {
            overflow-x: hidden !important;
            }
        `}</style>
            {/* Summary Cards */}
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
                                <p className="text-xl font-bold text-gray-900 dark:text-white font-mono">
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

            {/* Quick Date Filters */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow mb-4 p-4">
                {/* Year Navigation */}
                <div className="flex items-center justify-center gap-4 mb-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            const currentYear = parseInt(selectedYear || new Date().getFullYear().toString());
                            const prevYear = (currentYear - 1).toString();
                            handleYearChange(prevYear);
                        }}
                        className="h-8 w-8 p-0"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    <div className="text-lg font-semibold text-gray-900 dark:text-white min-w-[80px] text-center">
                        {selectedYear || new Date().getFullYear()}
                    </div>
                    
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            const currentYear = parseInt(selectedYear || new Date().getFullYear().toString());
                            const nextYear = (currentYear + 1).toString();
                            handleYearChange(nextYear);
                        }}
                        className="h-8 w-8 p-0"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            const now = new Date();
                            const currentYear = now.getFullYear().toString();
                            const currentMonth = (now.getMonth() + 1).toString().padStart(2, '0');

                            setSelectedYear(currentYear);
                            setSelectedMonth(currentMonth);

                            const params: any = { page: 1 };
                            if (searchTerm) params.search = searchTerm;
                            if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
                            if (branchFilter && branchFilter !== 'all') params.branch_id = branchFilter;
                            if (customerFilter && customerFilter !== 'all') params.customer_id = customerFilter;
                            params.year = currentYear;
                            params.month = currentMonth;
                            if (pageFilters.per_page) params.per_page = pageFilters.per_page;
                            if (sortField) { params.sort_field = sortField; params.sort_direction = sortDirection; }
                            router.get(route('sale-returns.index'), params, { preserveState: true, preserveScroll: true });
                        }}
                        // className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset bg-green-50 text-green-700 ring-green-600/20 cursor-pointer"
                    >
                        {t('Current')}
                    </Button>
                </div>
                
                {/* Month Selection */}
                <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
                    {generateMonths().map(month => (
                        <Button
                            key={month.value}
                            variant={selectedMonth === month.value ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleMonthChange(month.value)}
                            className={`text-xs h-8 px-2 ${
                                selectedMonth === month.value 
                                    ? 'bg-primary text-primary-foreground border-primary hover:bg-primary/90' 
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}
                        >
                            {month.label.substring(0, 3)}
                        </Button>
                    ))}
                </div>
            </div>

            <div className="bg-white dark:bg-gray-900 border rounded-lg shadow mb-4">
                <SearchAndFilterBar
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    onSearch={handleSearch}
                    filters={filterOptions.map(filter => ({
                        ...filter,
                        onChange: (value: any) => handleFilterChange(filter.name, value)
                    }))}
                    hasActiveFilters={hasActiveFilters}
                    activeFilterCount={() => {
                        return Object.values(filterValues).filter(v => v && v !== '' && v !== 'all').length + (searchTerm ? 1 : 0);
                    }}
                    onResetFilters={() => {
                        setSearchTerm('');
                        isInitialMount.current = true;
                        setFilterValues({ status: 'all', branch_id: 'all', customer_id: 'all' });
                        setStatusFilter('all');
                        setBranchFilter('all');
                        setCustomerFilter('all');
                        setSortField('');
                        setSortDirection('desc');
                        // Don't reset year and month - keep current selections
                        
                        const params: any = {};
                        
                        // Keep existing year and month selections
                        if (selectedYear) params.year = selectedYear;
                        if (selectedMonth) params.month = selectedMonth;
                        
                        router.get(route('sale-returns.index'), params, { preserveState: true, preserveScroll: true });
                    }}
                />
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden">
                <CrudTable
                    columns={columns}
                    actions={actions}
                    data={saleReturns?.data || []}
                    from={saleReturns?.from || 1}
                    onAction={handleAction}
                    sortField={sortField}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                    permissions={permissions}
                    entityPermissions={{
                        view: 'view-sale-returns',
                        create: 'create-sale-returns',
                        edit: 'edit-sale-returns',
                        delete: 'delete-sale-returns'
                    }}
                />

                <Pagination
                    from={saleReturns?.from || 0}
                    to={saleReturns?.to || 0}
                    total={saleReturns?.total || 0}
                    links={saleReturns?.links || []}
                    entityName={t("sale returns")}
                    onPageChange={(url) => {
                        if (url) {
                            const urlObj = new URL(url, window.location.origin);
                            if (pageFilters.per_page) urlObj.searchParams.set('per_page', pageFilters.per_page.toString());
                            if (pageFilters.search) urlObj.searchParams.set('search', pageFilters.search);
                            if (statusFilter && statusFilter !== 'all') urlObj.searchParams.set('status', statusFilter);
                            if (branchFilter && branchFilter !== 'all') urlObj.searchParams.set('branch_id', branchFilter);
                            if (customerFilter && customerFilter !== 'all') urlObj.searchParams.set('customer_id', customerFilter);
                            if (selectedYear) urlObj.searchParams.set('year', selectedYear);
                            if (selectedMonth) urlObj.searchParams.set('month', selectedMonth);
                            if (sortField) {
                                urlObj.searchParams.set('sort_field', sortField);
                                urlObj.searchParams.set('sort_direction', sortDirection);
                            }
                            router.get(urlObj.toString(), {}, { preserveState: true, preserveScroll: true });
                        }
                    }}
                    currentPerPage={pageFilters.per_page?.toString() || "10"}
                    onPerPageChange={(value) => {
                        const params: any = { page: 1, per_page: parseInt(value) };
                        if (searchTerm) params.search = searchTerm;
                        if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
                        if (branchFilter && branchFilter !== 'all') params.branch_id = branchFilter;
                        if (customerFilter && customerFilter !== 'all') params.customer_id = customerFilter;
                        if (selectedYear) params.year = selectedYear;
                        if (selectedMonth) params.month = selectedMonth;
                        if (sortField) {
                            params.sort_field = sortField;
                            params.sort_direction = sortDirection;
                        }
                        router.get(route('sale-returns.index'), params, { preserveState: true, preserveScroll: true });
                    }}
                />
            </div>

            <CrudFormModal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                onSubmit={handleFormSubmit}
                formConfig={{
                    fields: (formMode === 'edit' && (currentItem?.status === 'rejected' || currentItem?.status === 'approved')) ? [
                        {
                            name: 'status', label: t('Status'), type: 'select', required: true, options: [
                                { value: 'approved', label: t('Approved') },
                                { value: 'rejected', label: t('Rejected') }
                            ]
                        }
                    ] : [
                        {
                            name: 'branch_id',
                            label: t('Branch'),
                            type: 'select',
                            required: true,
                            searchable: true,
                            options: branches?.map((branch: any) => ({ value: branch.id, label: branch.name })) || []
                        },
                        {
                            name: 'sale_id',
                            label: t('Sale'),
                            type: 'custom',
                            required: true,
                            render: (field: any, formData: any, handleChange: any, mode: string) => {
                                if (mode === 'view') {
                                    const sale = sales?.find((s: any) => s.id == formData.sale_id);
                                    return (
                                        <div className="p-2 border rounded-md bg-gray-50">
                                            {sale ? `${sale.sale_number} - ${sale.customer?.name}` : formData.sale_id || '-'}
                                        </div>
                                    );
                                }

                                const filteredSales = formData.branch_id
                                    ? sales?.filter((sale: any) => sale.branch_id == formData.branch_id) || []
                                    : [];

                                return (
                                    <Select
                                        value={formData.sale_id?.toString() || ''}
                                        onValueChange={(value) => handleChange('sale_id', value)}
                                        disabled={!formData.branch_id}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder={formData.branch_id ? t('Select Sale') : t('Select Branch First')} />
                                        </SelectTrigger>
                                        <SelectContent searchable className="z-[70000]">
                                            {filteredSales.map((sale: any) => (
                                                <SelectItem key={sale.id} value={sale.id.toString()}>
                                                    {sale.sale_number} - {sale.customer?.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                );
                            }
                        },
                        {
                            name: 'return_date',
                            label: t('Return Date'),
                            type: 'date',
                            required: true,
                            render: formMode === 'view' ? (field: any, formData: any) => {
                                const formattedDate = currentItem?.return_date
                                    ? (window.appSettings?.formatDateTime
                                        ? window.appSettings.formatDateTime(currentItem.return_date, false)
                                        : new Date(currentItem.return_date).toLocaleDateString())
                                    : '-';
                                return (
                                    <div className="p-2 border rounded-md bg-gray-50">
                                        {formattedDate}
                                    </div>
                                );
                            } : undefined
                        },
                        { name: 'reason', label: t('Reason'), type: 'text', placeholder: t('Enter reason for return') },
                        {
                            name: 'items',
                            label: t('Return Items'),
                            type: 'custom',
                            required: true,
                            validation: {
                                required: true,
                            },
                            render: (field: any, formData: any, handleChange: any, mode: string) => {
                                const selectedSale = sales?.find((s: any) => s.id == formData.sale_id);
                                const items = (formData.items || []).map((item: any) => {
                                    if (item.max_quantity != null) return item;
                                    const saleItem = selectedSale?.items?.find((si: any) => si.id == item.sale_item_id);
                                    return { ...item, max_quantity: saleItem?.quantity ?? item.quantity };
                                });

                                if (!selectedSale) {
                                    return <div className="text-gray-500 text-sm">{t('Select a sale first to add items')}</div>;
                                }

                                const addItem = (saleItem: any) => {
                                    const existingIndex = items.findIndex((item: any) => item.sale_item_id === saleItem.id);
                                    if (existingIndex >= 0) return;

                                    const newItem = {
                                        product_id: saleItem.product_id,
                                        sale_item_id: saleItem.id,
                                        product_name: saleItem.product?.name || 'Unknown Product',
                                        quantity: 1,
                                        max_quantity: saleItem.quantity,
                                        unit_price: saleItem.unit_price,
                                        tax_rate: saleItem.tax_rate || 0
                                    };

                                    handleChange('items', [...items, newItem]);
                                };

                                const updateItem = (index: number, field: string, value: any) => {
                                    const updatedItems = [...items];
                                    updatedItems[index][field] = value;
                                    handleChange('items', updatedItems);
                                };

                                const removeItem = (index: number) => {
                                    const updatedItems = items.filter((_: any, i: number) => i !== index);
                                    handleChange('items', updatedItems);
                                };

                                return (
                                    <div className="space-y-4">
                                        {selectedSale.items && selectedSale.items.length > 0 && mode !== 'view' && (
                                            <div>
                                                <h4 className="font-medium mb-2">
                                                    {t('Available Items')}
                                                </h4>
                                                <div className="space-y-2 max-h-32 overflow-y-auto">
                                                    {selectedSale.items.map((saleItem: any) => (
                                                        <div key={saleItem.id} className="flex items-center justify-between p-2 border rounded text-sm">
                                                            <div>
                                                                <span className="font-medium">{saleItem.product?.name || 'Unknown'}</span>
                                                                <span className="text-gray-500 ml-2">Qty: {saleItem.quantity}</span>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => addItem(saleItem)}
                                                                disabled={items.some((item: any) => item.sale_item_id === saleItem.id)}
                                                                className={`px-2 py-1 rounded text-xs transition-colors ${
                                                                    items.some((item: any) => item.sale_item_id === saleItem.id)
                                                                        ? 'bg-white text-gray-500 border border-gray-300 cursor-not-allowed'
                                                                        : 'bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer'
                                                                }`}
                                                            >
                                                                {t('Add')}
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {items.length > 0 && (
                                            <div>
                                                <h4 className="font-medium mb-2">{t('Return Items')}</h4>
                                                <div className="space-y-2">
                                                    {items.map((item: any, index: number) => (
                                                        <div key={index} className="flex items-center gap-2 p-2 border rounded">
                                                            <div className="flex-1">
                                                                <div className="font-medium text-sm">{item.product_name}</div>
                                                                <div className="text-xs text-gray-500">Max: {item.max_quantity}</div>
                                                            </div>
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                max={item.max_quantity}
                                                                value={item.quantity}
                                                                onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                                                onBlur={(e) => {
                                                                    const val = Math.min(Math.max(parseInt(e.target.value) || 1, 1), item.max_quantity);
                                                                    updateItem(index, 'quantity', val);
                                                                }}
                                                                className="w-16 px-2 py-1 border rounded text-sm"
                                                                disabled={mode === 'view'}
                                                            />
                                                            <div className="text-sm w-16 text-right font-mono">
                                                                {(window.appSettings.formatCurrency(item.quantity * item.unit_price))}
                                                            </div>
                                                            {mode !== 'view' && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeItem(index)}
                                                                    className="px-2 py-1 bg-red-500 text-white rounded text-xs"
                                                                >
                                                                    {t('Remove')}
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                    <div className="border-t pt-2">
                                                        <div className="flex justify-between font-medium">
                                                            <span>{t('Total')}:</span>
                                                            <span className="font-mono">{window.appSettings.formatCurrency(items.reduce((sum: number, item: any) => sum + (item.quantity * item.unit_price), 0).toFixed(2))}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            }
                        },
                        { name: 'notes', label: t('Notes'), type: 'textarea', placeholder: t('Enter notes') }
                    ],
                    modalSize: 'xl'
                }}
                initialData={currentItem}
                title={formMode === 'create' ? t('Add New Sale Return') : formMode === 'edit' ? t('Edit Sale Return') : t('View Sale Return')}
                mode={formMode}
            />

            <CrudDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                itemName={currentItem?.return_number || ''}
                entityName="sale return"
            />
        </PageTemplate>
    );
}
