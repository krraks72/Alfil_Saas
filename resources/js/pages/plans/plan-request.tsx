import { PageTemplate } from '@/components/page-template';
import { CrudTable } from '@/components/CrudTable';
import { planRequestsConfig } from '@/config/crud/plan-requests';
import { useEffect, useState, useRef } from 'react';
import { usePage, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { toast } from '@/components/custom-toast';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';
import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import { List, Clock, CheckCircle, XCircle } from 'lucide-react';

export default function PlanRequestsPage() {
    const { t } = useTranslation();
    const { flash, planRequests, statusCounts, filters: pageFilters = {}, auth, isSuperAdmin = false } = usePage().props as any;
    const permissions = auth?.permissions || [];
    const getInitials = useInitials();

    const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
    const [filterValues, setFilterValues] = useState<Record<string, any>>({});
    const [activeStatus, setActiveStatus] = useState(pageFilters.status || 'all');
    const [showFilters, setShowFilters] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [currentPlanRequest, setCurrentPlanRequest] = useState<any>(null);
    const [sortField, setSortField] = useState(pageFilters.sort_by || '');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(pageFilters.sort_order || 'desc');

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    const handleAction = (action: string, item: any) => {
        if (action === 'approve') {
            router.post(route("plan-requests.approve", item.id), {}, {
                onSuccess: () => {},
                onError: () => {
                    toast.error(t('Failed to approve plan request'));
                }
            });
        } else if (action === 'reject') {
            router.post(route("plan-requests.reject", item.id), {}, {
                onSuccess: () => {},
                onError: () => {
                    toast.error(t('Failed to reject plan request'));
                }
            });
        } else if (action === 'delete') {
            setCurrentPlanRequest(item);
            setIsDeleteModalOpen(true);
        }
    };

    const handleDeleteConfirm = () => {
        toast.loading(t('Deleting plan request...'));

        router.delete(route("plan-requests.destroy", currentPlanRequest.id), {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                toast.dismiss();
            },
            onError: () => {
                toast.dismiss();
                toast.error(t('Failed to delete plan request'));
            }
        });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters();
    };

    const applyFilters = (status?: string) => {
        const params: any = { page: 1 };

        if (searchTerm) {
            params.search = searchTerm;
        }

        Object.entries(filterValues).forEach(([key, value]) => {
            if (value && value !== 'all') {
                params[key] = value;
            }
        });

        const currentStatus = status !== undefined ? status : activeStatus;
        if (currentStatus && currentStatus !== 'all') {
            params.status = currentStatus;
        }

        if (sortField) {
            params.sort_by = sortField;
            params.sort_order = sortDirection;
        }

        if (pageFilters.per_page) {
            params.per_page = pageFilters.per_page;
        }

        router.get(route("plan-requests.index"), params, { preserveState: true, preserveScroll: true });
    };

    const handleStatusTabChange = (status: string) => {
        setActiveStatus(status);
        applyFilters(status);
    };

    const handleSort = (field: string) => {
        const newDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(newDirection);

        const params: any = { page: 1 };

        if (searchTerm) {
            params.search = searchTerm;
        }

        Object.entries(filterValues).forEach(([key, value]) => {
            if (value && value !== 'all') {
                params[key] = value;
            }
        });

        const currentStatus = activeStatus;
        if (currentStatus && currentStatus !== 'all') {
            params.status = currentStatus;
        }

        params.sort_by = field;
        params.sort_order = newDirection;

        if (pageFilters.per_page) {
            params.per_page = pageFilters.per_page;
        }

        router.get(route("plan-requests.index"), params, { preserveState: true, preserveScroll: true });
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

    const breadcrumbs = [
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Plans'), href: route('plans.index') },
        { title: isSuperAdmin ? t('Plan Request') : t('My Plan Request') }
    ];

    const hasActiveFilters = () => {
        return Object.values(filterValues).some(value => {
            return value && value !== '' && value !== 'all';
        }) || searchTerm !== '' || activeStatus !== 'all';
    };

    const filteredActions = isSuperAdmin ? planRequestsConfig.table.actions?.map(action => ({
        ...action,
        label: t(action.label)
    })) : [];

    const customColumns = planRequestsConfig.table.columns
        .map(col => {
            if (col.key === 'user.name') {
                return {
                    ...col,
                    label: t('Company'),
                    render: (_, row) => {
                        return (
                            <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={row.user?.avatar} />
                                    <AvatarFallback>{getInitials(row.user?.name)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="font-medium">{row.user?.name || '-'}</div>
                                    <div className="text-xs text-gray-500">{row.user?.email || ''}</div>
                                </div>
                            </div>
                        );
                    }
                };
            } else if (col.key === 'plan.name') {
                return {
                    ...col,
                    label: t(col.label),
                    render: (_, row) => {
                        const planName = row.plan?.name;
                        if (!planName) return '-';
                        return (
                            <span className="inline-flex items-center px-2 py-1 ring-1 ring-inset rounded-md text-xs font-medium bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-600/20 dark:text-blue-400 capitalize">
                                {planName}
                            </span>
                        );
                    }
                };
            } else if (col.key === 'status') {
                return {
                    ...col,
                    label: t(col.label),
                    render: (value) => {
                        const statusColors: Record<string, string> = {
                            pending: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20',
                            approved: 'bg-green-50 text-green-700 ring-green-600/20',
                            rejected: 'bg-red-50 text-red-700 ring-red-600/20'
                        };
                        return (
                            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset capitalize ${statusColors[value] || 'bg-gray-50 text-gray-700 ring-gray-600/20'}`}>
                                {t(value)}
                            </span>
                        );
                    }
                };
            } else {
                return {
                    ...col,
                    label: t(col.label)
                };
            }
        });

    return (
        <PageTemplate
            title={isSuperAdmin ? t('Plan Request') : t('My Plan Request')}
            url="/plan-requests"
            breadcrumbs={breadcrumbs}
            noPadding
            description={isSuperAdmin ? t('View and manage all plan requests from companies.') : t('View your plan requests.')}
        >
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow mb-4 border">
                <SearchAndFilterBar
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    onSearch={handleSearch}
                    filters={planRequestsConfig.filters?.filter(f => f.key !== 'status').map(filter => ({
                        name: filter.key,
                        label: t(filter.label),
                        type: 'select',
                        value: filterValues[filter.key] || '',
                        onChange: (value) => handleFilterChange(filter.key, value),
                        options: filter.options?.map(option => ({
                            value: option.value,
                            label: t(option.label)
                        })) || []
                    })) || []}
                    hasActiveFilters={hasActiveFilters}
                    activeFilterCount={() => {
                        return Object.values(filterValues).filter(v => v && v !== '' && v !== 'all').length + (searchTerm ? 1 : 0) + (activeStatus !== 'all' ? 1 : 0);
                    }}
                    onResetFilters={() => {
                        isInitialMount.current = true;
                        setSearchTerm('');
                        setFilterValues({});
                        setActiveStatus('all');
                        setSortField('');
                        setSortDirection('desc');
                        router.get(route('plan-requests.index'), {}, { preserveState: true, preserveScroll: true });
                    }}
                />
                <div className="border-t border-gray-200 dark:border-gray-700 mb-1"></div>
                <div className="bg-white dark:bg-gray-900 ml-2 mr-2">
                    <div className="flex space-x-0 overflow-x-auto">
                        {[
                            { key: 'all', label: t('All Requests'), count: statusCounts?.total ?? (planRequests?.total || 0), icon: List },
                            { key: 'pending', label: t('Pending'), count: statusCounts?.pending || 0, icon: Clock },
                            { key: 'approved', label: t('Approved'), count: statusCounts?.approved || 0, icon: CheckCircle },
                            { key: 'rejected', label: t('Rejected'), count: statusCounts?.rejected || 0, icon: XCircle },
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
                    columns={customColumns}
                    actions={filteredActions}
                    data={planRequests?.data || []}
                    from={planRequests?.from || 1}
                    onAction={handleAction}
                    sortField={sortField}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                    permissions={permissions}
                    entityPermissions={planRequestsConfig.entity.permissions}
                />

                <Pagination
                    from={planRequests?.from || 0}
                    to={planRequests?.to || 0}
                    total={planRequests?.total || 0}
                    links={planRequests?.links}
                    entityName={t("plan requests")}
                    onPageChange={(url) => {
                        const urlObj = new URL(url, window.location.origin);
                        if (pageFilters.per_page) urlObj.searchParams.set('per_page', pageFilters.per_page.toString());
                        if (pageFilters.search) urlObj.searchParams.set('search', pageFilters.search);
                        if (sortField) {
                            urlObj.searchParams.set('sort_by', sortField);
                            urlObj.searchParams.set('sort_order', sortDirection);
                        }
                        if (activeStatus !== 'all') urlObj.searchParams.set('status', activeStatus);
                        Object.entries(filterValues).forEach(([key, val]) => {
                            if (val && val !== '' && val !== 'all') urlObj.searchParams.set(key, val);
                        });
                        router.get(urlObj.toString(), {}, { preserveState: true, preserveScroll: true });
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
                        if (activeStatus !== 'all') params.status = activeStatus;
                        router.get(route('plan-requests.index'), params, { preserveState: true, preserveScroll: true });
                    }}
                />
            </div>

            <CrudDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                itemName={`${currentPlanRequest?.plan?.name}` || ''}
                entityName="Plan request"
            />
        </PageTemplate>
    );
}



// Thank you so much, now in this file "main-file/resources/js/pages/plans/plan-request.tsx" same i want to add a status filter UI only and remove th status dropdown from the search and filter bar component, and make sure status filter is working properly without any issue or problem.