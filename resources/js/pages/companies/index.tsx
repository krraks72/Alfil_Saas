// pages/companies/index.tsx
import { useState, useEffect, useRef } from 'react';
import { PageTemplate } from '@/components/page-template';
import { usePage, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { CrudTable } from '@/components/CrudTable';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ViewPopup from './view';
import { Plus, Edit, Trash2, KeyRound, Lock, Unlock, Info, ArrowUpRight, CreditCard, History, UserCheck, UserX, List } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/components/custom-toast';
import { useInitials } from '@/hooks/use-initials';
import { useTranslation } from 'react-i18next';
import { DatePicker } from '@/components/ui/date-picker';
import { CrudFormModal } from '@/components/CrudFormModal';
import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import { UpgradePlanModal } from '@/components/UpgradePlanModal';
import { Badge } from '@/components/ui/badge';

export default function Companies() {
    const { t } = useTranslation();
    const { auth, companies, plans, statusCounts, filters: pageFilters = {} } = usePage().props as any;
    const permissions = auth?.permissions || [];
    const getInitials = useInitials();

    // State - Initialize activeView from URL params or localStorage, fallback to 'list'
    const [activeView, setActiveView] = useState(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const viewFromUrl = urlParams.get('view');
        if (viewFromUrl && ['list', 'grid'].includes(viewFromUrl)) {
            return viewFromUrl as 'list' | 'grid';
        }
        const savedView = localStorage.getItem('companies_view');
        if (savedView && ['list', 'grid'].includes(savedView)) {
            return savedView as 'list' | 'grid';
        }
        return 'list';
    });
    const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
    const [startDate, setStartDate] = useState<Date | undefined>(pageFilters.start_date ? new Date(pageFilters.start_date) : undefined);
    const [endDate, setEndDate] = useState<Date | undefined>(pageFilters.end_date ? new Date(pageFilters.end_date) : undefined);
    const [selectedStatus, setSelectedStatus] = useState(pageFilters.status || 'all');
    const [activeStatusTab, setActiveStatusTab] = useState(pageFilters.status || 'all');
    const [showFilters, setShowFilters] = useState(false);

    // Modal state
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
    const [isUpgradePlanModalOpen, setIsUpgradePlanModalOpen] = useState(false);

    const [currentCompany, setCurrentCompany] = useState<any>(null);
    const [availablePlans, setAvailablePlans] = useState<any[]>([]);
    const [currentBillingCycle, setCurrentBillingCycle] = useState<string>('monthly');
    const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');

    // Check if any filters are active
    const hasActiveFilters = () => {
        return activeStatusTab !== 'all' || searchTerm !== '' || startDate !== undefined || endDate !== undefined;
    };

    // Count active filters
    const activeFilterCount = () => {
        return (activeStatusTab !== 'all' ? 1 : 0) +
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
        if (searchTerm) params.search = searchTerm;
        if (activeStatusTab !== 'all') params.status = activeStatusTab;
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;
        if (pageFilters.per_page) params.per_page = pageFilters.per_page;
        params.view = activeView;
        if (pageFilters.sort_field) {
            params.sort_field = pageFilters.sort_field;
            params.sort_direction = pageFilters.sort_direction;
        }
        router.get(route('companies.index'), params, { preserveState: true, preserveScroll: true });
    };

    const handleStatusTabChange = (status: string) => {
        setActiveStatusTab(status);
        setSelectedStatus(status);
        const params: any = { page: 1, view: activeView, status: status === 'all' ? undefined : status };
        if (searchTerm) params.search = searchTerm;
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;
        if (pageFilters.per_page) params.per_page = pageFilters.per_page;
        if (pageFilters.sort_field) { params.sort_field = pageFilters.sort_field; params.sort_direction = pageFilters.sort_direction; }
        router.get(route('companies.index'), params, { preserveState: true, preserveScroll: true });
    };

    const handleSort = (field: string) => {
        const direction = pageFilters.sort_field === field && pageFilters.sort_direction === 'asc' ? 'desc' : 'asc';
        const params: any = { sort_field: field, sort_direction: direction, page: 1, view: activeView };
        if (searchTerm) params.search = searchTerm;
        if (activeStatusTab !== 'all') params.status = activeStatusTab;
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;
        if (pageFilters.per_page) params.per_page = pageFilters.per_page;
        router.get(route('companies.index'), params, { preserveState: true, preserveScroll: true });
    };

    const handleAction = (action: string, company: any) => {
        setCurrentCompany(company);

        switch (action) {
            case 'login-as':
                router.get(route("impersonate.start", company.id));
                break;
            case 'company-info':
                setIsViewModalOpen(true);
                break;
            case 'upgrade-plan':
                handleUpgradePlan(company);
                break;

            case 'reset-password':
                setIsResetPasswordModalOpen(true);
                break;
            case 'toggle-status':
                handleToggleStatus(company);
                break;
            case 'edit':
                setFormMode('edit');
                setIsFormModalOpen(true);
                break;
            case 'delete':
                setIsDeleteModalOpen(true);
                break;
            default:
                break;
        }
    };

    const handleAddNew = () => {
        setCurrentCompany(null);
        setFormMode('create');
        setIsFormModalOpen(true);
    };

    const handleFormSubmit = (formData: any) => {
        if (formMode === 'create') {
            toast.loading(t('Creating company...'));

            router.post(route('companies.store'), formData, {
                onSuccess: (page) => {
                    setIsFormModalOpen(false);
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
                        toast.error(`Failed to create company: ${Object.values(errors).join(', ')}`);
                    }
                }
            });
        } else if (formMode === 'edit') {
            toast.loading(t('Updating company...'));

            router.put(route('companies.update', currentCompany.id), formData, {
                onSuccess: (page) => {
                    setIsFormModalOpen(false);
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
                        toast.error(`Failed to update company: ${Object.values(errors).join(', ')}`);
                    }
                }
            });
        }
    };

    const handleDeleteConfirm = () => {
        toast.loading(t('Deleting company...'));

        router.delete(route("companies.destroy", currentCompany.id), {
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
                    toast.error(`Failed to delete company: ${Object.values(errors).join(', ')}`);
                }
            }
        });
    };

    const handleResetPasswordConfirm = (data: { password: string }) => {
        toast.loading(t('Resetting password...'));

        router.put(route('companies.reset-password', currentCompany.id), data, {
            onSuccess: (page) => {
                setIsResetPasswordModalOpen(false);
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
                    toast.error(`Failed to reset password: ${Object.values(errors).join(', ')}`);
                }
            }
        });
    };

    const handleToggleStatus = (company: any) => {
        toast.loading(t('Updating status...'));

        router.put(route('companies.toggle-status', company.id), {}, {
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
                    toast.error(`Failed to update status: ${Object.values(errors).join(', ')}`);
                }
            }
        });
    };

    const handleResetFilters = () => {
        isInitialMount.current = true;
        setSelectedStatus('all');
        setActiveStatusTab('all');
        setSearchTerm('');
        setStartDate(undefined);
        setEndDate(undefined);
        setShowFilters(false);
        router.get(route('companies.index'), { view: activeView }, { preserveState: true, preserveScroll: true });
    };

    const handleUpgradePlan = (company: any) => {
        setCurrentCompany(company);

        toast.loading(t('Loading plans...'));
        fetch(route('companies.plans', company.id))
            .then(res => res.json())
            .then(data => {
                setAvailablePlans(data.plans);
                setCurrentBillingCycle(data.company?.current_billing_cycle || 'monthly');
                setIsUpgradePlanModalOpen(true);
                toast.dismiss();
            })
            .catch(err => {
                toast.dismiss();
                toast.error(t('Failed to load plans'));
            });
    };

    const handleUpgradePlanConfirm = (planId: number, duration: string) => {
        toast.loading(t('Upgrading plan...'));

        router.put(route('companies.upgrade-plan', currentCompany.id), {
            plan_id: planId,
            duration: duration
        }, {
            onSuccess: (page) => {
                setIsUpgradePlanModalOpen(false);
                toast.dismiss();
                if (page.props.flash.success) {
                    toast.success(t(page.props.flash.success));
                } else if (page.props.flash.error) {
                    toast.error(t(page.props.flash.error));
                }
                router.reload();
            },
            onError: (errors) => {
                toast.dismiss();
                if (typeof errors === 'string') {
                    toast.error(errors);
                } else {
                    toast.error(`Failed to upgrade plan: ${Object.values(errors).join(', ')}`);
                }
            }
        });
    };

    const isInitialMount = useRef(true);

    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
        } else {
            applyFilters();
        }
    }, [startDate, endDate]);

    // Define page actions
    const pageActions = [
        ...(permissions.includes('manage-login-history') ? [{
            icon: <History className="h-4 w-4 mx-auto" />,
            variant: 'outline',
            tooltip: t('Login History'),
            onClick: () => router.get(route('users.all-logs'))
        }] : []),
        {
            label: t('Add Company'),
            icon: <Plus className="h-4 w-4" />,
            variant: 'default',
            onClick: () => handleAddNew()
        }
    ];
    const breadcrumbs = [
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Companies') }
    ];
    const getAvatarUrl = (company: any) => {
        if (company?.avatar) {
            return window.storage ? window.storage(company.avatar) : company.avatar;
        }
        return '/images/avatar/avatar.png';
    };

    // Define table columns for list view
    const columns = [
        {
            key: 'name',
            label: t('Name'),
            sortable: true,
            render: (value: any, row: any) => {
                return (
                    <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={row.avatar} />
                            <AvatarFallback>{getInitials(row.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="font-medium">{row.name}</div>
                            <div className="text-sm text-muted-foreground">{row.email}</div>
                        </div>
                    </div>
                );
            }
        },
        {
            key: 'plan_name',
            label: t('Plan'),
            render: (value: string) => (
                <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 capitalize">
                    {value}
                </span>
            )
        },
        {
            key: 'status',
            label: t('Status'),
            sortable: true,
            render: (value: string) => (
                <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${value === 'active' ? 'bg-green-50 text-green-700 ring-green-600/20' : 'bg-red-50 text-red-700 ring-red-600/20'}`}>
                    {value === 'active' ? t('Active') : t('Inactive')}
                </span>
            )
        },
        {
            key: 'created_at',
            label: t('Created At'),
            type: 'date',
            sortable: true,
            // render: (value: string) => window.appSettings?.formatDateTime(value, false) || new Date(value).toLocaleDateString()
        }
    ];

    return (
        <PageTemplate
            title={t("Companies")}
            url="/companies"
            actions={pageActions}
            breadcrumbs={breadcrumbs}
            noPadding
            description={t('Manage your companies.')}
        >
            {/* Search and filters section */}
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
                        if (startDate) params.set('start_date', startDate);
                        if (endDate) params.set('end_date', endDate);
                        if (pageFilters.per_page) params.set('per_page', pageFilters.per_page.toString());
                        if (pageFilters.page) params.set('page', pageFilters.page.toString());
                        if (pageFilters.sort_field) params.set('sort_field', pageFilters.sort_field);
                        if (pageFilters.sort_direction) params.set('sort_direction', pageFilters.sort_direction);
                        router.get(route('companies.index'), Object.fromEntries(params), { preserveState: true, preserveScroll: true });
                    }}
                />
                {/* Horizontal Separator */}
                <div className="border-t border-gray-200 dark:border-gray-700 mb-1"></div>
                {/* Status Tabs */}
                <div className="bg-white dark:bg-gray-900 ml-2 mr-2">
                    <div className="flex space-x-0 overflow-x-auto">
                        {[
                            { key: 'all', label: t('All Companies'), count: statusCounts?.total ?? (companies?.total || 0), icon: List },
                            { key: 'active', label: t('Active'), count: statusCounts?.active || 0, icon: UserCheck },
                            { key: 'inactive', label: t('Inactive'), count: statusCounts?.inactive || 0, icon: UserX },
                        ].map((tab) => {
                            const IconComponent = tab.icon;
                            return (
                                <div key={tab.key} className="relative">
                                    <button
                                        onClick={() => handleStatusTabChange(tab.key)}
                                        className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
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

            {/* Content section */}
            {activeView === 'list' ? (
                <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden">
                    <CrudTable
                        columns={columns}
                        actions={[
                            { label: t('Login as Company'), icon: 'ArrowUpRight', action: 'login-as', className: 'text-blue-500' },
                            { label: t('Upgrade Plan'), icon: 'CreditCard', action: 'upgrade-plan', className: 'text-amber-500' },
                            { label: t('Reset Password'), icon: 'KeyRound', action: 'reset-password', className: 'text-blue-500' },
                            { label: t('Toggle Status'), icon: (row: any) => row.status === 'active' ? 'Lock' : 'Unlock', action: 'toggle-status', className: 'text-amber-500' },
                            { label: t('Company Info'), icon: 'Info', action: 'company-info', className: 'text-blue-500' },
                            { label: t('Edit'), icon: 'Edit', action: 'edit', className: 'text-amber-500' },
                            { label: t('Delete'), icon: 'Trash2', action: 'delete', className: 'text-red-500' },
                        ] as any}
                        data={companies?.data || []}
                        from={companies?.from || 1}
                        onAction={handleAction}
                        sortField={pageFilters.sort_field}
                        sortDirection={pageFilters.sort_direction as 'asc' | 'desc'}
                        onSort={handleSort}
                        permissions={permissions}
                    />

                    {/* Pagination section */}
                    <Pagination
                        from={companies?.from || 0}
                        to={companies?.to || 0}
                        total={companies?.total || 0}
                        links={companies?.links}
                        entityName={t("companies")}
                        onPageChange={(url) => {
                            const urlObj = new URL(url, window.location.origin);
                            urlObj.searchParams.set('view', activeView);
                            if (searchTerm) urlObj.searchParams.set('search', searchTerm);
                            if (activeStatusTab !== 'all') urlObj.searchParams.set('status', activeStatusTab);
                            if (startDate) urlObj.searchParams.set('start_date', startDate);
                            if (endDate) urlObj.searchParams.set('end_date', endDate);
                            if (pageFilters.per_page) urlObj.searchParams.set('per_page', pageFilters.per_page.toString());
                            if (pageFilters.sort_field) urlObj.searchParams.set('sort_field', pageFilters.sort_field);
                            if (pageFilters.sort_direction) urlObj.searchParams.set('sort_direction', pageFilters.sort_direction);
                            router.get(urlObj.toString(), {}, { preserveState: true, preserveScroll: true });
                        }}
                        currentPerPage={pageFilters.per_page?.toString() || "10"}
                        onPerPageChange={(value) => {
                            const params: any = { page: 1, per_page: parseInt(value) };
                            if (searchTerm) params.search = searchTerm;
                            if (activeStatusTab !== 'all') params.status = activeStatusTab;
                            if (startDate) params.start_date = startDate;
                            if (endDate) params.end_date = endDate;
                            params.view = activeView;
                            if (pageFilters.sort_field) {
                                params.sort_field = pageFilters.sort_field;
                                params.sort_direction = pageFilters.sort_direction;
                            }
                            router.get(route('companies.index'), params, { preserveState: true, preserveScroll: true });
                        }}
                    />
                </div>
            ) : (
                <div>
                    {/* Grid View */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {companies?.data?.map((company: any) => (
                            <Card key={company.id} className="group relative overflow-hidden bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300">
                                {/* Status Badge */}
                                <div className="absolute top-4 right-4 z-10">
                                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                                        company.status === 'active'
                                            ? 'bg-green-50 text-green-700 ring-green-600/20'
                                            : 'bg-red-50 text-red-700 ring-red-600/20'
                                    }`}>
                                        {company.status === 'active' ? t('Active') : t('Inactive')}
                                    </span>
                                </div>

                                {/* Card Content */}
                                <div className="p-6">
                                    {/* Company Header */}
                                    <div className="flex items-start space-x-4 mb-6">
                                        <div className="relative">
                                            <Avatar className="h-14 w-14">
                                                <AvatarImage src={company.avatar} className="object-cover" />
                                                <AvatarFallback>{getInitials(company.name)}</AvatarFallback>
                                            </Avatar>
                                        </div>
                                        <div className="flex-1 min-w-0 pr-16">
                                            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1 truncate">
                                                {company.name}
                                            </h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                                {company.email}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Plan Information */}
                                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 mb-6">
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center">
                                                <CreditCard className="h-4 w-4 text-primary mr-2" />
                                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {company.plan_name}
                                                </span>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleAction('upgrade-plan', company)}
                                                className="h-6 px-2 text-xs text-primary hover:text-primary hover:bg-primary/10"
                                            >
                                                {t("Upgrade")}
                                            </Button>
                                        </div>
                                        {company.plan_expiry_date && (
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                {t("Expires")}: {window.appSettings?.formatDateTime(company.plan_expiry_date, false) || new Date(company.plan_expiry_date).toLocaleDateString()}
                                            </div>
                                        )}
                                    </div>

                                    {/* Quick Actions */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex space-x-1">
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleAction('login-as', company)}
                                                        className="h-8 w-8 p-0 text-gray-500"
                                                        // className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                                    >
                                                        <ArrowUpRight className="h-4 w-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>{t("Login as Company")}</TooltipContent>
                                            </Tooltip>

                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleAction('company-info', company)}
                                                        className="h-8 w-8 p-0 text-gray-500"
                                                        // className="h-8 w-8 p-0 text-gray-600 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                                                    >
                                                        <Info className="h-4 w-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>{t("Company Info")}</TooltipContent>
                                            </Tooltip>

                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleAction('edit', company)}
                                                        className="h-8 w-8 p-0 text-gray-500"
                                                        // className="h-8 w-8 p-0 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>{t("Edit")}</TooltipContent>
                                            </Tooltip>
                                        </div>

                                        {/* More Actions Dropdown */}
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <circle cx="12" cy="12" r="1"></circle>
                                                        <circle cx="12" cy="5" r="1"></circle>
                                                        <circle cx="12" cy="19" r="1"></circle>
                                                    </svg>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48 z-50" sideOffset={5}>
                                                <DropdownMenuItem onClick={() => handleAction('reset-password', company)}>
                                                    <KeyRound className="h-4 w-4 mr-2" />
                                                    <span>{t("Reset Password")}</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleAction('toggle-status', company)}>
                                                    {company.status === 'active' ?
                                                        <Lock className="h-4 w-4 mr-2" /> :
                                                        <Unlock className="h-4 w-4 mr-2" />
                                                    }
                                                    <span>{company.status === 'active' ? t("Disable Login") : t("Enable Login")}</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => handleAction('delete', company)} className="text-red-600 focus:text-red-600">
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    <span>{t("Delete")}</span>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            </Card>
                        ))}

                        {(!companies?.data || companies.data.length === 0) && (
                            <div className="col-span-full">
                                <div className="text-center py-12">
                                    <div className="mx-auto h-24 w-24 text-gray-300 dark:text-gray-600 mb-4">
                                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-full h-full">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{t("No companies found")}</h3>
                                    <p className="text-gray-500 dark:text-gray-400 mb-6">{t("Get started by creating your first company")}</p>
                                    <Button onClick={handleAddNew} className="inline-flex items-center">
                                        <Plus className="h-4 w-4 mr-2" />
                                        {t("Add Company")}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Pagination for grid view */}
                    <div className="mt-6 bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden">
                        <Pagination
                            from={companies?.from || 0}
                            to={companies?.to || 0}
                            total={companies?.total || 0}
                            links={companies?.links}
                            entityName={t("companies")}
                            onPageChange={(url) => {
                                const urlObj = new URL(url, window.location.origin);
                                urlObj.searchParams.set('view', activeView);
                                if (searchTerm) urlObj.searchParams.set('search', searchTerm);
                                if (activeStatusTab !== 'all') urlObj.searchParams.set('status', activeStatusTab);
                                if (startDate) urlObj.searchParams.set('start_date', startDate);
                                if (endDate) urlObj.searchParams.set('end_date', endDate);
                                if (pageFilters.per_page) urlObj.searchParams.set('per_page', pageFilters.per_page.toString());
                                if (pageFilters.sort_field) urlObj.searchParams.set('sort_field', pageFilters.sort_field);
                                if (pageFilters.sort_direction) urlObj.searchParams.set('sort_direction', pageFilters.sort_direction);
                                router.get(urlObj.toString(), {}, { preserveState: true, preserveScroll: true });
                            }}
                            currentPerPage={pageFilters.per_page?.toString() || "10"}
                            onPerPageChange={(value) => {
                                const params: any = { page: 1, per_page: parseInt(value) };
                                if (searchTerm) params.search = searchTerm;
                                if (activeStatusTab !== 'all') params.status = activeStatusTab;
                                if (startDate) params.start_date = startDate;
                                if (endDate) params.end_date = endDate;
                                params.view = activeView;
                                if (pageFilters.sort_field) {
                                    params.sort_field = pageFilters.sort_field;
                                    params.sort_direction = pageFilters.sort_direction;
                                }
                                router.get(route('companies.index'), params, { preserveState: true, preserveScroll: true });
                            }}
                        />
                    </div>
                </div>
            )}

            {/* View Modal */}
            <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
                {currentCompany && <ViewPopup record={currentCompany} />}
            </Dialog>

            {/* Form Modal */}
            <CrudFormModal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                onSubmit={(data) => {
                    if (formMode === 'create') {
                        // Create mode logic
                        if (data.login_enabled === false) {
                            delete data.password;
                        }
                        data.status = data.login_enabled ? 'active' : 'inactive';
                        delete data.login_enabled;
                    }
                    // For edit mode, data is passed as-is
                    handleFormSubmit(data);
                }}
                formConfig={{
                    fields: [
                        { name: 'name', label: t('Company Name'), type: 'text', required: true, placeholder: 'e.g. Acme Corporation' },
                        { name: 'email', label: t('Email'), type: 'email', required: true, placeholder: 'e.g. admin@acmecorp.com' },
                        {
                            name: 'login_enabled',
                            label: t('Enable Login'),
                            placeholder: '', // Empty placeholder to prevent duplicate label
                            type: 'switch',
                            defaultValue: true,
                            conditional: (mode) => mode === 'create'
                        },
                        {
                            name: 'password',
                            label: t('Password'),
                            type: 'password',
                            placeholder: 'Enter password',
                            required: (mode) => mode === 'create',
                            conditional: (mode, data) => {
                                return mode === 'create' && data?.login_enabled === true;
                            }
                        }
                    ],
                    modalSize: 'lg'
                }}
                initialData={formMode === 'create' ? {} : currentCompany}
                title={
                    formMode === 'create'
                        ? t('Add New Company')
                        : formMode === 'edit'
                            ? t('Edit Company')
                            : t('View Company')
                }
                mode={formMode}
            />

            {/* Delete Modal */}
            <CrudDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                itemName={currentCompany?.name || ''}
                entityName="company"
            />

            {/* Reset Password Modal */}
            <CrudFormModal
                isOpen={isResetPasswordModalOpen}
                onClose={() => setIsResetPasswordModalOpen(false)}
                onSubmit={handleResetPasswordConfirm}
                formConfig={{
                    fields: [
                        { name: 'password', label: t('New Password'), type: 'password', required: true, placeholder: 'Enter password', }
                    ],
                    modalSize: 'sm'
                }}
                initialData={{}}
                title={`Reset Password for ${currentCompany?.name || 'Company'}`}
                mode="edit"
            />

            {/* Upgrade Plan Modal */}
            <UpgradePlanModal
                isOpen={isUpgradePlanModalOpen}
                onClose={() => setIsUpgradePlanModalOpen(false)}
                onConfirm={handleUpgradePlanConfirm}
                plans={availablePlans}
                currentPlanId={currentCompany?.plan_id}
                currentBillingCycle={currentBillingCycle}
                companyName={currentCompany?.name || ''}
            />


        </PageTemplate>
    );
}
