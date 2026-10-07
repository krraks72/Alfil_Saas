import React, { useState, useEffect, useRef } from 'react';
import { Head, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { CrudTable } from '@/components/CrudTable';
import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import { Pagination } from '@/components/ui/pagination';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Trash2, Edit, Plus, Target, MoreHorizontal, Calendar, Building2, TrendingUp, TrendingDown, Banknote, CheckCircle2, AlertTriangle, XCircle, Target as TargetIcon, Gauge, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from '@/components/custom-toast';
import { PageTemplate } from '@/components/page-template';
import { useTranslation } from 'react-i18next';

interface Branch {
    id: number;
    name: string;
    manager?: string;
}

interface BranchSalesTarget {
    id: number;
    branch: Branch;
    month: string;
    target_amount: number;
    actual_sales: number;
    progress_percentage: number;
    progress_color: string;
    created_by: string;
}

interface SummaryStats {
    totalTargets: number;
    totalTargetAmount: number;
    totalActualSales: number;
    avgProgress: number;
    onTrack: number;
    atRisk: number;
    behind: number;
}

interface Props {
    targets: any;
    branches: Branch[];
    summary: SummaryStats;
    filters: {
        year?: string;
        month?: string;
        search?: string;
        branch?: string;
        per_page?: number;
        page?: number;
        sort_field?: string;
        sort_direction?: string;
    };
    can: {
        create: boolean;
        edit: boolean;
        delete: boolean;
    };
}

export default function Index({ targets, branches, summary, filters, can }: Props) {
    const { t } = useTranslation();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [editingTarget, setEditingTarget] = useState<BranchSalesTarget | null>(null);
    const [currentItem, setCurrentItem] = useState<any>(null);
    const [selectedYear, setSelectedYear] = useState(filters.year || new Date().getFullYear().toString());
    const [selectedMonth, setSelectedMonth] = useState(filters.month || (new Date().getMonth() + 1).toString().padStart(2, '0'));
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedBranch, setSelectedBranch] = useState(filters.branch || 'all');
    // State - Initialize activeView from URL params or localStorage, fallback to 'list'
    const [activeView, setActiveView] = useState(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const viewFromUrl = urlParams.get('view');
        if (viewFromUrl && ['list', ''].includes(viewFromUrl)) {
            return viewFromUrl as 'list' | '';
        }
        const savedView = localStorage.getItem('branch_sales_targets_view');
        if (savedView && ['list', ''].includes(savedView)) {
            return savedView as 'list' | '';
        }
        return 'list';
    });
    const [showFilters, setShowFilters] = useState(false);
    const [targetData, setTargetData] = useState({
        month: new Date().toISOString().slice(0, 7),
        targets: [{ branch_id: '', target_amount: '' }]
    });
    const [createErrors, setCreateErrors] = useState<Record<string, string>>({});
    const [editErrors, setEditErrors] = useState<Record<string, string>>({});

    const isInitialMount = useRef(true);

    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
        } else {
            applyFilters();
        }
    }, [selectedBranch]);

    // ===== SUMMARY STATS (from controller) =====
    const summaryStats = summary;

    const formatCurrency = (value: number) => {
        return window.appSettings?.formatCurrency ? window.appSettings.formatCurrency(value) : `$${value.toLocaleString()}`;
    };

    const getProgressColor = (color: string) => {
        const colors = {
            red: 'bg-red-500',
            orange: 'bg-orange-500',
            blue: 'bg-blue-500',
            green: 'bg-green-500'
        };
        return colors[color as keyof typeof colors] || 'bg-gray-500';
    };

    const getBadgeVariant = (color: string) => {
        const variants = {
            red: 'destructive',
            orange: 'secondary',
            blue: 'default',
            green: 'default'
        };
        return variants[color as keyof typeof variants] || 'secondary';
    };

    const getStatusBadge = (percentage: number) => {
        if (percentage >= 100) {
            return {
                label: t('Achieved'),
                className: 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/30 dark:text-green-400',
                icon: <CheckCircle2 className="h-3 w-3 mr-1" />
            };
        }
        if (percentage >= 75) {
            return {
                label: t('On Track'),
                className: 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-900/30 dark:text-blue-400',
                icon: <TrendingUp className="h-3 w-3 mr-1" />
            };
        }
        if (percentage >= 40) {
            return {
                label: t('At Risk'),
                className: 'bg-orange-50 text-orange-700 ring-orange-600/20 dark:bg-orange-900/30 dark:text-orange-400',
                icon: <AlertTriangle className="h-3 w-3 mr-1" />
            };
        }
        return {
            label: t('Behind'),
            className: 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-900/30 dark:text-red-400',
            icon: <XCircle className="h-3 w-3 mr-1" />
        };
    };

    const getProgressIcon = (color: string) => {
        const icons = {
            red: <XCircle className="h-4 w-4 text-red-500" />,
            orange: <AlertTriangle className="h-4 w-4 text-orange-500" />,
            blue: <TrendingUp className="h-4 w-4 text-blue-500" />,
            green: <CheckCircle2 className="h-4 w-4 text-green-500" />
        };
        return icons[color as keyof typeof icons] || <Target className="h-4 w-4 text-gray-500" />;
    };

    const hasActiveFilters = () => {
        return searchTerm !== '' || selectedBranch !== 'all';
    };

    const activeFilterCount = () => {
        return (searchTerm ? 1 : 0) +
               (selectedBranch !== 'all' ? 1 : 0);
    };

    const generateMonths = () => [
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
        { value: '12', label: t('December') },
    ];

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters();
    };

    const applyFilters = (overrides: Record<string, any> = {}) => {
        const params: any = { page: 1 };

        if (overrides.search !== undefined ? overrides.search : searchTerm) {
            params.search = overrides.search !== undefined ? overrides.search : searchTerm;
        }

        const year = overrides.year !== undefined ? overrides.year : selectedYear;
        const month = overrides.month !== undefined ? overrides.month : selectedMonth;

        if (year) params.year = year;
        if (month) params.month = month;

        const branch = overrides.branch !== undefined ? overrides.branch : selectedBranch;
        if (branch !== 'all') params.branch = branch;

        if (filters.per_page) params.per_page = filters.per_page;
        params.view = activeView;

        router.get(route('branch-sales-targets.index'), params, {
            preserveState: true,
            preserveScroll: true
        });
    };

    const handleYearChange = (year: string) => {
        setSelectedYear(year);
        applyFilters({ year });
    };

    const handleMonthChange = (month: string) => {
        setSelectedMonth(month);
        applyFilters({ month });
    };

    const handleResetFilters = () => {
        isInitialMount.current = true;
        setSearchTerm('');
        setSelectedBranch('all');
        setShowFilters(false);

        const params: any = { view: activeView };
        if (selectedYear) params.year = selectedYear;
        if (selectedMonth) params.month = selectedMonth;

        router.get(route('branch-sales-targets.index'), params, { preserveState: true, preserveScroll: true });
    };

    const handleBranchFilter = (value: string) => {
        setSelectedBranch(value);
    };

    const handleCreateTarget = () => {
        // Frontend validation
        const errors: Record<string, string> = {};
        if (!targetData.month) errors['month'] = t('Month is required');
        targetData.targets.forEach((target, index) => {
            if (!target.branch_id) errors[`targets.${index}.branch_id`] = t('Branch is required');
            if (!target.target_amount) errors[`targets.${index}.target_amount`] = t('Target amount is required');
        });
        if (Object.keys(errors).length > 0) {
            setCreateErrors(errors);
            return;
        }
        setCreateErrors({});
        const formData = {
            targets: targetData.targets.map(target => ({
                ...target,
                month: targetData.month
            }))
        };
        toast.loading(t('Creating targets...'));
        router.post(route('branch-sales-targets.store'), formData, {
            onSuccess: (page) => {
                setIsCreateModalOpen(false);
                setTargetData({
                    month: new Date().toISOString().slice(0, 7),
                    targets: [{ branch_id: '', target_amount: '' }]
                });
                setCreateErrors({});
                toast.dismiss();
                if (page.props.flash?.error) {
                    toast.error(page.props.flash.error);
                } else if (page.props.flash?.success) {
                    toast.success(t(page.props.flash.success));
                } else {
                    toast.success(t('Sales targets created successfully'));
                }
            },
            onError: (errors) => {
                toast.dismiss();
                const mapped: Record<string, string> = {};
                Object.entries(errors).forEach(([key, val]) => {
                    mapped[key] = Array.isArray(val) ? val[0] : val;
                });
                setCreateErrors(mapped);
            }
        });
    };

    const handleEditTarget = () => {
        if (!editingTarget) return;
        const errors: Record<string, string> = {};
        if (!editingTarget.target_amount && editingTarget.target_amount !== 0) {
            errors['target_amount'] = t('Target amount is required');
        }
        if (Object.keys(errors).length > 0) {
            setEditErrors(errors);
            return;
        }
        setEditErrors({});
        router.put(route('branch-sales-targets.update', editingTarget.id), {
            target_amount: editingTarget.target_amount
        }, {
            onSuccess: () => {
                setIsEditModalOpen(false);
                setEditingTarget(null);
                toast.success(t('Target updated successfully'));
            },
            onError: (errors) => {
                const mapped: Record<string, string> = {};
                Object.entries(errors).forEach(([key, val]) => {
                    mapped[key] = Array.isArray(val) ? val[0] : val;
                });
                setEditErrors(mapped);
            }
        });
    };

    const handleDeleteTarget = (target: BranchSalesTarget) => {
        setCurrentItem(target);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteConfirm = () => {
        toast.loading(t('Deleting target...'));
        router.delete(route('branch-sales-targets.destroy', currentItem.id), {
            onSuccess: (page) => {
                setIsDeleteModalOpen(false);
                toast.dismiss();
                if (page.props.flash.success) {
                    toast.success(t(page.props.flash.success));
                } else {
                    toast.success(t('Target deleted successfully'));
                }
            },
            onError: (errors) => {
                toast.dismiss();
                if (typeof errors === 'string') {
                    toast.error(errors);
                } else {
                    toast.error(t('Failed to delete target'));
                }
            }
        });
    };

    const addTargetRow = () => {
        setTargetData(prev => ({
            ...prev,
            targets: [...prev.targets, { branch_id: '', target_amount: '' }]
        }));
    };

    const removeTargetRow = (index: number) => {
        setTargetData(prev => ({
            ...prev,
            targets: prev.targets.filter((_, i) => i !== index)
        }));
    };

    const updateTargetRow = (index: number, field: string, value: string) => {
        setTargetData(prev => ({
            ...prev,
            targets: prev.targets.map((target, i) =>
                i === index ? { ...target, [field]: value } : target
            )
        }));
    };

    const pageActions = [];
    if (can.create) {
        pageActions.push({
            label: t('Create Target'),
            icon: <Plus className="h-4 w-4" />,
            variant: 'default',
            onClick: () => setIsCreateModalOpen(true)
        });
    }

    const breadcrumbs = [
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('POS Management'), href: route('branch-sales-targets.index') },
        { title: t('Branch Sales Targets') }
    ];

    return (
        <PageTemplate
            title={t("Branch Sales Targets")}
            url="/branch-sales-targets"
            actions={pageActions}
            breadcrumbs={breadcrumbs}
            noPadding
            description={t('Set monthly sales targets for each branch and track performance against goals.')}
        >
            <Head title="Branch Sales Targets" />

            {/* ═══ SUMMARY STATS CARDS ═══ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                <div className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-blue-50 dark:bg-blue-700/20 rounded-bl-full"></div>
                    <div className="p-4 relative">
                        <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="text-left min-w-0 flex-1">
                                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 capitalize tracking-wide mb-1 truncate">{t('Total Targets')}</p>
                                <p className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 dark:text-white break-words">{summaryStats.totalTargets}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">{t('Current view')}</p>
                            </div>
                            <div className="relative z-10 p-2.5 bg-blue-50 dark:bg-blue-700/20 rounded-xl mt-0.5 shrink-0">
                                <TargetIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-violet-50 dark:bg-violet-700/20 rounded-bl-full"></div>
                    <div className="p-4 relative">
                        <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="text-left min-w-0 flex-1">
                                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 capitalize tracking-wide mb-1 truncate">{t('Total Target Amount')}</p>
                                <p className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 dark:text-white font-mono break-words">{formatCurrency(summaryStats.totalTargetAmount)}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">{t('Combined monthly goals')}</p>
                            </div>
                            <div className="relative z-10 p-2.5 bg-violet-50 dark:bg-violet-700/20 rounded-xl mt-0.5 shrink-0">
                                <Banknote className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-50 dark:bg-emerald-700/20 rounded-bl-full"></div>
                    <div className="p-4 relative">
                        <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="text-left min-w-0 flex-1">
                                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 capitalize tracking-wide mb-1 truncate">{t('Total Actual Sales')}</p>
                                <p className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 dark:text-white font-mono break-words">{formatCurrency(summaryStats.totalActualSales)}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">{t('Combined achievement')}</p>
                            </div>
                            <div className="relative z-10 p-2.5 bg-emerald-50 dark:bg-emerald-700/20 rounded-xl mt-0.5 shrink-0">
                                <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-orange-50 dark:bg-orange-700/20 rounded-bl-full"></div>
                    <div className="p-4 relative">
                        <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="text-left min-w-0 flex-1">
                                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 capitalize tracking-wide mb-1 truncate">{t('Average Achievement')}</p>
                                <p className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 dark:text-white break-words">{summaryStats.avgProgress}%</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">{t('Average progress')}</p>
                            </div>
                            <div className="relative z-10 p-2.5 bg-orange-50 dark:bg-orange-700/20 rounded-xl mt-0.5 shrink-0">
                                <Gauge className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══ YEAR / MONTH PICKER ═══ */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow mb-4 p-4">
                {/* Year Navigation */}
                <div className="flex items-center justify-center gap-4 mb-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleYearChange((parseInt(selectedYear) - 1).toString())}
                        className="h-8 w-8 p-0"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <div className="text-lg font-semibold text-gray-900 dark:text-white min-w-[80px] text-center">
                        {selectedYear}
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleYearChange((parseInt(selectedYear) + 1).toString())}
                        className="h-8 w-8 p-0"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            const now = new Date();
                            const year = now.getFullYear().toString();
                            const month = (now.getMonth() + 1).toString().padStart(2, '0');
                            setSelectedYear(year);
                            setSelectedMonth(month);
                            applyFilters({ year, month });
                        }}
                    >
                        {t('Current')}
                    </Button>
                </div>

                {/* Month Selection */}
                <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-12 gap-1.5 sm:gap-2">
                    {generateMonths().map(month => (
                        <Button
                            key={month.value}
                            variant={selectedMonth === month.value ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleMonthChange(month.value)}
                            className={`text-xs h-8 px-1.5 sm:px-2 ${
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

            {/* ═══ SEARCH & FILTER BAR ═══ */}
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow mb-4 border border-gray-200 dark:border-gray-700">
                <SearchAndFilterBar
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    onSearch={handleSearch}
                    filters={[
                        {
                            name: 'branch',
                            label: t('Branch'),
                            type: 'select',
                            value: selectedBranch,
                            onChange: handleBranchFilter,
                            options: [
                                { value: 'all', label: t('All Branches') },
                                ...branches?.map((branch: any) => ({ value: branch.id.toString(), label: branch.name })) || []
                            ]
                        }
                    ]}
                    hasActiveFilters={hasActiveFilters}
                    activeFilterCount={activeFilterCount}
                    onResetFilters={handleResetFilters}
                    showViewToggle={false}
                    activeView={activeView}
                    onViewChange={(view) => {
                        setActiveView(view);
                        const params: any = { view, page: 1 };
                        if (searchTerm) params.search = searchTerm;
                        if (selectedYear) params.year = selectedYear;
                        if (selectedMonth) params.month = selectedMonth;
                        if (selectedBranch !== 'all') params.branch = selectedBranch;
                        if (filters.per_page) params.per_page = filters.per_page;
                        if (filters.sort_field) params.sort_field = filters.sort_field;
                        if (filters.sort_direction) params.sort_direction = filters.sort_direction;
                        router.get(route('branch-sales-targets.index'), params, {
                            preserveState: true,
                            preserveScroll: true
                        });
                    }}
                />
            </div>

            {can.create && (
                <Dialog open={isCreateModalOpen} onOpenChange={(open) => { setIsCreateModalOpen(open); if (!open) setCreateErrors({}); }}>
                    <DialogTrigger asChild>
                        <Button style={{display: 'none'}}>
                            <Plus className="w-4 h-4 mr-2" />
                            {t('Create Target')}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="w-[calc(100%-2rem)] sm:max-w-lg md:max-w-2xl p-0 rounded-lg overflow-hidden" onOpenAutoFocus={(e) => e.preventDefault()}>
                        <DialogHeader className="px-6 pt-6 pb-4 border-b">
                            <DialogTitle className="text-lg font-semibold">{t('Add New Sales Targets')}</DialogTitle>
                        </DialogHeader>

                        <div className="max-h-[65vh] overflow-y-auto px-6 py-0 space-y-4">
                            <div>
                                <Label required htmlFor="month">{t('Month')}</Label>
                                <Input
                                    id="month"
                                    type="month"
                                    value={targetData.month}
                                    onChange={(e) => { setTargetData(prev => ({ ...prev, month: e.target.value })); setCreateErrors(prev => ({ ...prev, month: '' })); }}
                                    className={`mt-1.5 ${createErrors['month'] ? 'border-red-500' : ''}`}
                                />
                                {createErrors['month'] && <p className="text-xs text-red-500 mt-1">{createErrors['month']}</p>}
                            </div>

                            <div>
                                <Label required>{t('Branch Targets')}</Label>
                                <div className="space-y-3 mt-1.5">
                                    {targetData.targets.map((target, index) => (
                                        <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800 space-y-2 sm:space-y-0">
                                            <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                                                <div className="flex-1">
                                                    <Select
                                                        value={target.branch_id}
                                                        onValueChange={(value) => { updateTargetRow(index, 'branch_id', value); setCreateErrors(prev => ({ ...prev, [`targets.${index}.branch_id`]: '' })); }}
                                                    >
                                                        <SelectTrigger className={createErrors[`targets.${index}.branch_id`] ? 'border-red-500' : ''}>
                                                            <SelectValue placeholder={t('Select branch')} />
                                                        </SelectTrigger>
                                                        <SelectContent className="z-[60000]" searchable>
                                                            {branches && branches.filter(branch => {
                                                                const selectedIds = targetData.targets
                                                                    .map((t, idx) => idx !== index ? t.branch_id : null)
                                                                    .filter(Boolean);
                                                                return !selectedIds.includes(String(branch.id));
                                                            }).map(branch => (
                                                                <SelectItem key={branch.id} value={String(branch.id)}>{branch.name}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    {createErrors[`targets.${index}.branch_id`] && <p className="text-xs text-red-500 mt-1">{createErrors[`targets.${index}.branch_id`]}</p>}
                                                </div>
                                                <div className="flex-1 flex gap-2 items-center">
                                                    <Input
                                                        type="number"
                                                        placeholder={t('Target amount')}
                                                        value={target.target_amount}
                                                        onChange={(e) => { updateTargetRow(index, 'target_amount', e.target.value); setCreateErrors(prev => ({ ...prev, [`targets.${index}.target_amount`]: '' })); }}
                                                        className={createErrors[`targets.${index}.target_amount`] ? 'border-red-500' : ''}
                                                    />
                                                    {targetData.targets.length > 1 && (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => removeTargetRow(index)}
                                                            className="text-gray-500 hover:text-red-600 shrink-0"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                            {createErrors[`targets.${index}.target_amount`] && <p className="text-xs text-red-500 mt-1">{createErrors[`targets.${index}.target_amount`]}</p>}
                                        </div>
                                    ))}
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={addTargetRow}
                                    className="mt-3"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    {t('Add Branch')}
                                </Button>
                            </div>

                        </div>
                        <DialogFooter className="px-6 py-4 border-t bg-gray-50/50 dark:bg-gray-900/50">
                            <div className="flex justify-end gap-2 w-full sm:w-auto">
                                <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                                    {t('Cancel')}
                                </Button>
                                <Button onClick={handleCreateTarget}>
                                    {t('Save')}
                                </Button>
                            </div>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {/* ═══ TARGETS DISPLAY ═══ */}
            {(() => {
                const groupedTargets = (targets?.data || []).reduce((acc, target) => {
                    if (!acc[target.month]) acc[target.month] = [];
                    acc[target.month].push(target);
                    return acc;
                }, {} as Record<string, any>);

                if (activeView === 'list') {
                    const columns = [
                        {
                            key: 'branch',
                            label: t('Branch'),
                            render: (value: any, row: any) => (
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                                        <Building2 className="h-4 w-4 text-primary" />
                                    </div>
                                    <div className="min-w-0">
                                        <span className="font-medium">{value?.name || '-'}</span>
                                        <span className="text-xs text-gray-500 truncate block">{value?.manager || '-'}</span>
                                    </div>
                                </div>
                            )
                        },
                        {
                            key: 'month',
                            label: t('Month'),
                            render: (value: string) => (
                                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 min-w-[110px]">
                                    <Calendar className="h-4 w-4 shrink-0" />
                                    <span>{value ? new Date(value + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '-'}</span>
                                </div>
                            )
                        },
                        {
                            key: 'target_amount',
                            label: t('Target'),
                            render: (value: number) => (
                                <span className="font-mono font-medium text-gray-900 dark:text-white">{formatCurrency(value || 0)}</span>
                            )
                        },
                        {
                            key: 'actual_sales',
                            label: t('Actual'),
                            render: (value: number) => (
                                <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400">{formatCurrency(value || 0)}</span>
                            )
                        },
                        {
                            key: 'variance',
                            label: t('Variance'),
                            render: (_: any, row: any) => {
                                const diff = (row.actual_sales || 0) - (row.target_amount || 0);
                                const isPositive = diff >= 0;
                                return (
                                    <span className={`inline-flex items-center gap-1 font-medium font-mono ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                        {isPositive ? '+' : ''}{formatCurrency(diff)}
                                    </span>
                                );
                            }
                        },
                        {
                            key: 'progress_percentage',
                            label: t('Progress'),
                            render: (value: number, row: any) => {
                                const status = getStatusBadge(value);
                                return (
                                    <div className="flex items-center gap-2 min-w-[140px]">
                                        <div className="relative flex-1">
                                            <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                                                <div
                                                    className={`h-full bg-primary rounded-full transition-all duration-500`}
                                                    style={{ width: `${Math.min(value, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset shrink-0 ${status.className}`}>
                                            {value}%
                                        </span>
                                    </div>
                                );
                            }
                        }
                    ];

                    const actions = [
                        { label: 'Edit', icon: 'Edit', action: 'edit', className: 'text-amber-500', requiredPermission: 'edit-branch-sales-target' },
                        { label: 'Delete', icon: 'Trash2', action: 'delete', className: 'text-red-500', requiredPermission: 'delete-branch-sales-target' }
                    ];

                    const handleTableAction = (action: string, item: any) => {
                        if (action === 'edit') {
                            setEditingTarget(item);
                            setIsEditModalOpen(true);
                        } else if (action === 'delete') {
                            handleDeleteTarget(item);
                        }
                    };

                    return (
                        <div className="bg-white dark:bg-gray-900 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <CrudTable
                                columns={columns}
                                actions={actions}
                                data={targets?.data || []}
                                from={targets?.from || 1}
                                onAction={handleTableAction}
                                permissions={Object.keys(can).filter(key => can[key as keyof typeof can]).map(key => {
                                    if (key === 'edit') return 'edit-branch-sales-target';
                                    if (key === 'delete') return 'delete-branch-sales-target';
                                    if (key === 'create') return 'create-branch-sales-target';
                                    return `${key}-branch-sales-target`;
                                })}
                                entityPermissions={{
                                    view: 'view-branch-sales-target',
                                    edit: 'edit-branch-sales-target',
                                    delete: 'delete-branch-sales-target'
                                }}
                            />
                            <Pagination
                                from={targets?.from || 0}
                                to={targets?.to || 0}
                                total={targets?.total || 0}
                                links={targets?.links}
                                entityName={t("targets")}
                                onPageChange={(url) => {
                                    const urlObj = new URL(url, window.location.origin);
                                    urlObj.searchParams.set('view', activeView);
                                    if (searchTerm) urlObj.searchParams.set('search', searchTerm);
                                    if (selectedYear) urlObj.searchParams.set('year', selectedYear);
                                    if (selectedMonth) urlObj.searchParams.set('month', selectedMonth);
                                    if (selectedBranch !== 'all') urlObj.searchParams.set('branch', selectedBranch);
                                    if (filters.per_page) urlObj.searchParams.set('per_page', filters.per_page.toString());
                                    if (filters.sort_field) urlObj.searchParams.set('sort_field', filters.sort_field);
                                    if (filters.sort_direction) urlObj.searchParams.set('sort_direction', filters.sort_direction);
                                    router.get(urlObj.toString(), {}, { preserveState: true, preserveScroll: true });
                                }}
                                currentPerPage={filters.per_page?.toString() || "10"}
                                onPerPageChange={(value) => {
                                    const params: any = { page: 1, per_page: parseInt(value), view: activeView };
                                    if (searchTerm) params.search = searchTerm;
                                    if (selectedYear) params.year = selectedYear;
                                    if (selectedMonth) params.month = selectedMonth;
                                    if (selectedBranch !== 'all') params.branch = selectedBranch;
                                    router.get(route('branch-sales-targets.index'), params, { preserveState: true, preserveScroll: true });
                                }}
                            />
                        </div>
                    );
                }

                // ═══ GRID VIEW ═══
                return Object.entries(groupedTargets)
                    .sort(([a], [b]) => b.localeCompare(a))
                    .map(([month, monthTargets]) => {
                        // Calculate month aggregate
                        const monthTotalTarget = monthTargets.reduce((sum: number, t: any) => sum + (t.target_amount || 0), 0);
                        const monthTotalActual = monthTargets.reduce((sum: number, t: any) => sum + (t.actual_sales || 0), 0);
                        const monthProgress = monthTotalTarget > 0 ? Math.round((monthTotalActual / monthTotalTarget) * 100) : 0;
                        const monthColor = monthProgress >= 75 ? 'green' : monthProgress >= 40 ? 'orange' : 'red';
                        const monthBarColor = getProgressColor(monthColor);
                        const monthStatus = getStatusBadge(monthProgress);

                        return (
                            <div key={month} className="mb-8">
                                {/* Month Header with Overall Progress */}
                                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-50 dark:bg-blue-700/20 rounded-lg flex items-center justify-center">
                                            <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                {new Date(month + '-01').toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long'
                                                })}
                                            </h2>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {monthTargets.length} {monthTargets.length === 1 ? t('branch') : t('branches')} · {formatCurrency(monthTotalTarget)} {t('target')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 min-w-[200px]">
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs text-gray-500 dark:text-gray-400">{t('Overall')}</span>
                                                <span className={`text-xs font-semibold ${monthProgress >= 75 ? 'text-emerald-600 dark:text-emerald-400' : monthProgress >= 40 ? 'text-orange-600 dark:text-orange-400' : 'text-red-600 dark:text-red-400'}`}>
                                                    {monthProgress}%
                                                </span>
                                            </div>
                                            <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                                                <div
                                                    className={`h-full ${monthBarColor} rounded-full transition-all duration-500`}
                                                    style={{ width: `${Math.min(monthProgress, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset shrink-0 ${monthStatus.className}`}>
                                            {monthStatus.icon}
                                            {monthStatus.label}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {monthTargets.map((target) => {
                                        const status = getStatusBadge(target.progress_percentage);
                                        const variance = (target.actual_sales || 0) - (target.target_amount || 0);
                                        const isPositive = variance >= 0;
                                        const barColor = getProgressColor(target.progress_color);

                                        return (
                                            <div
                                                key={target.id}
                                                className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 overflow-hidden"
                                            >
                                                {/* Top accent bar */}
                                                <div className={`h-1 w-full ${barColor}`} />

                                                <div className="p-5">
                                                    {/* Header */}
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                                                                target.progress_color === 'green'
                                                                    ? 'bg-emerald-50 dark:bg-emerald-700/20'
                                                                    : target.progress_color === 'orange'
                                                                        ? 'bg-orange-50 dark:bg-orange-700/20'
                                                                        : target.progress_color === 'red'
                                                                            ? 'bg-red-50 dark:bg-red-700/20'
                                                                            : 'bg-blue-50 dark:bg-blue-700/20'
                                                            }`}>
                                                                {getProgressIcon(target.progress_color)}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <h3 className="font-semibold text-gray-900 dark:text-white truncate">{target.branch.name}</h3>
                                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                                    {target.branch.manager ?? t('No Manager')}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-1 shrink-0">
                                                            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${status.className}`}>
                                                                {status.icon}
                                                                {status.label}
                                                            </span>
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                                                        <MoreHorizontal className="h-4 w-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end" className="w-48 z-50" sideOffset={5}>
                                                                    {can.edit && (
                                                                        <DropdownMenuItem onClick={() => {
                                                                            setEditingTarget(target);
                                                                            setIsEditModalOpen(true);
                                                                        }} className="text-amber-600">
                                                                            <Edit className="h-4 w-4 mr-2" />
                                                                            <span>{t('Edit')}</span>
                                                                        </DropdownMenuItem>
                                                                    )}
                                                                    {can.delete && (
                                                                        <DropdownMenuItem onClick={() => handleDeleteTarget(target)} className="text-rose-600">
                                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                                            <span>{t('Delete')}</span>
                                                                        </DropdownMenuItem>
                                                                    )}
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </div>
                                                    </div>

                                                    {/* Amounts */}
                                                    <div className="grid grid-cols-3 gap-2 mb-4">
                                                        <div className="rounded-lg bg-gray-50 dark:bg-gray-700/50 p-2.5">
                                                            <p className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">{t('Target')}</p>
                                                            <p className="text-sm font-mono font-semibold text-gray-900 dark:text-white truncate">{formatCurrency(target.target_amount || 0)}</p>
                                                        </div>
                                                        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-700/20 p-2.5">
                                                            <p className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">{t('Actual')}</p>
                                                            <p className="text-sm font-mono font-semibold text-emerald-600 dark:text-emerald-400 truncate">{formatCurrency(target.actual_sales || 0)}</p>
                                                        </div>
                                                        <div className="rounded-lg bg-gray-50 dark:bg-gray-700/50 p-2.5">
                                                            <p className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">{t('Gap')}</p>
                                                            <p className={`text-sm font-mono font-semibold truncate ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                                                {isPositive ? '+' : ''}{formatCurrency(Math.abs(variance))}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Progress */}
                                                    <div>
                                                        <div className="flex items-center justify-between mb-1.5">
                                                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('Achievement')}</span>
                                                            <span className={`text-sm font-bold font-mono ${target.progress_color === 'green' ? 'text-emerald-600 dark:text-emerald-400' : target.progress_color === 'orange' ? 'text-orange-600 dark:text-orange-400' : target.progress_color === 'red' ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>
                                                                {target.progress_percentage}%
                                                            </span>
                                                        </div>
                                                        <div className="h-2.5 w-full rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                                                            <div
                                                                className={`h-full ${barColor} rounded-full transition-all duration-500`}
                                                                style={{ width: `${Math.min(target.progress_percentage, 100)}%` }}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                                                        {can.edit && (
                                                            <Button variant="outline" size="sm" onClick={() => {
                                                                setEditingTarget(target);
                                                                setIsEditModalOpen(true);
                                                            }} className="flex-1 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30 border-amber-200 dark:border-amber-800">
                                                                <Edit className="h-3.5 w-3.5 mr-1.5" />
                                                                {t('Edit')}
                                                            </Button>
                                                        )}
                                                        {can.delete && (
                                                            <Button variant="outline" size="sm" onClick={() => handleDeleteTarget(target)} className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200 dark:border-red-800">
                                                                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                                                                {t('Delete')}
                                                            </Button>
                                                        )}
                                                        {!can.edit && !can.delete && (
                                                            <div className="flex-1 text-center text-xs text-gray-400 dark:text-gray-500 py-1.5">
                                                                {t('No actions available')}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    });
            })()}

            {/* ═══ GRID VIEW PAGINATION ═══ */}
            {activeView === 'grid' && targets?.links && targets.links.length > 3 && (
                <div className="mt-4 bg-white dark:bg-gray-900 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                    <Pagination
                        from={targets?.from || 0}
                        to={targets?.to || 0}
                        total={targets?.total || 0}
                        links={targets?.links}
                        entityName={t("targets")}
                        onPageChange={(url) => {
                            const urlObj = new URL(url, window.location.origin);
                            urlObj.searchParams.set('view', activeView);
                            if (searchTerm) urlObj.searchParams.set('search', searchTerm);
                            if (selectedYear) urlObj.searchParams.set('year', selectedYear);
                            if (selectedMonth) urlObj.searchParams.set('month', selectedMonth);
                            if (selectedBranch !== 'all') urlObj.searchParams.set('branch', selectedBranch);
                            if (filters.per_page) urlObj.searchParams.set('per_page', filters.per_page.toString());
                            if (filters.sort_field) urlObj.searchParams.set('sort_field', filters.sort_field);
                            if (filters.sort_direction) urlObj.searchParams.set('sort_direction', filters.sort_direction);
                            router.get(urlObj.toString(), {}, { preserveState: true, preserveScroll: true });
                        }}
                        currentPerPage={filters.per_page?.toString() || "10"}
                        onPerPageChange={(value) => {
                            const params: any = { page: 1, per_page: parseInt(value), view: activeView };
                            if (searchTerm) params.search = searchTerm;
                            if (selectedYear) params.year = selectedYear;
                            if (selectedMonth) params.month = selectedMonth;
                            if (selectedBranch !== 'all') params.branch = selectedBranch;
                            router.get(route('branch-sales-targets.index'), params, { preserveState: true, preserveScroll: true });
                        }}
                    />
                </div>
            )}

            {/* ═══ EDIT MODAL ═══ */}
            <Dialog open={isEditModalOpen} onOpenChange={(open) => { setIsEditModalOpen(open); if (!open) setEditErrors({}); }}>
                <DialogContent className="w-[calc(100%-2rem)] sm:max-w-md p-0 rounded-lg overflow-hidden" onOpenAutoFocus={(e) => e.preventDefault()}>
                    <DialogHeader className="px-6 pt-6 pb-4 border-b">
                        <DialogTitle className="text-lg font-semibold">{t('Edit Sales Target')}</DialogTitle>
                    </DialogHeader>
                    {editingTarget && (
                        <>
                            <div className="max-h-[65vh] overflow-y-auto px-6 py-4 space-y-4">
                                <div>
                                    <Label>{t('Branch')}</Label>
                                    <Input value={editingTarget.branch.name} disabled className="mt-1.5 bg-gray-50 dark:bg-gray-800" />
                                </div>
                                <div>
                                    <Label>{t('Month')}</Label>
                                    <Input value={editingTarget.month} disabled className="mt-1.5 bg-gray-50 dark:bg-gray-800" />
                                </div>
                                <div>
                                    <Label required htmlFor="edit-target-amount">{t('Target Amount')}</Label>
                                    <Input
                                        id="edit-target-amount"
                                        type="number"
                                        value={editingTarget.target_amount}
                                        onChange={(e) => { setEditingTarget(prev => prev ? { ...prev, target_amount: parseFloat(e.target.value) || 0 } : null); setEditErrors(prev => ({ ...prev, target_amount: '' })); }}
                                        className={`mt-1.5 ${editErrors['target_amount'] ? 'border-red-500' : ''}`}
                                    />
                                    {editErrors['target_amount'] && <p className="text-xs text-red-500 mt-1">{editErrors['target_amount']}</p>}
                                </div>
                            </div>
                            <DialogFooter className="px-6 py-4 border-t bg-gray-50/50 dark:bg-gray-900/50">
                                <div className="flex justify-end gap-2 w-full sm:w-auto">
                                    <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                                        {t('Cancel')}
                                    </Button>
                                    <Button onClick={handleEditTarget}>
                                        {t('Save')}
                                    </Button>
                                </div>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* ═══ DELETE MODAL ═══ */}
            <CrudDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                itemName={currentItem?.branch?.name || ''}
                entityName="target"
            />
        </PageTemplate>
    );
}