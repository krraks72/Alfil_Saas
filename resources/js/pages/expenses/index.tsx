import { useState, useEffect, useRef } from 'react';
import { PageTemplate } from '@/components/page-template';
import { usePage, router } from '@inertiajs/react';
import { Plus, Download, FileText, Clock, CheckCircle, XCircle, ArrowUpRight, Search, Filter, Check, X } from 'lucide-react';
import { hasPermission } from '@/utils/authorization';
import { CrudTable } from '@/components/CrudTable';
import { CrudFormModal } from '@/components/CrudFormModal';
import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import { Dialog } from '@/components/ui/dialog';
import ViewPopup from './view';
import { toast } from '@/components/custom-toast';
import { useTranslation } from 'react-i18next';
import { Pagination } from '@/components/ui/pagination';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

// Summary Cards Component
const SummaryCards = ({ statusCounts, totalExpenses, t }: { statusCounts: any, totalExpenses: number, t: any }) => {
  const cards = [
    {
      title: t('Total Expenses'),
      value: totalExpenses || 0,
      icon: FileText,
      description: t('All expenses'),
      iconColor: 'text-blue-600 dark:text-blue-400',
      iconBg: 'bg-blue-50 dark:bg-blue-700/20',
      cardBg: 'bg-blue-50 dark:bg-blue-700/20'
    },
    {
      title: t('Pending Expenses'),
      value: statusCounts?.pending || 0,
      icon: Clock,
      description: t('Awaiting approval'),
      iconColor: 'text-orange-600 dark:text-orange-400',
      iconBg: 'bg-orange-50 dark:bg-orange-700/20',
      cardBg: 'bg-orange-50 dark:bg-orange-700/20'
    },
    {
      title: t('Approved Expenses'),
      value: statusCounts?.approved || 0,
      icon: CheckCircle,
      description: t('Approved expenses'),
      iconColor: 'text-green-600 dark:text-green-400',
      iconBg: 'bg-green-50 dark:bg-green-700/20',
      cardBg: 'bg-green-50 dark:bg-green-700/20'
    },
    {
      title: t('Rejected Expenses'),
      value: statusCounts?.rejected || 0,
      icon: XCircle,
      description: t('Rejected expenses'),
      iconColor: 'text-red-600 dark:text-red-400',
      iconBg: 'bg-red-50 dark:bg-red-700/20',
      cardBg: 'bg-red-50 dark:bg-red-700/20'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, index) => {
        const IconComponent = card.icon;
        return (
          <div key={index} className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 overflow-hidden relative">
            <div className={`absolute top-0 right-0 w-20 h-20 ${card.cardBg} rounded-bl-full`}></div>
            <div className="p-4 relative">
              <div className="flex items-start justify-between mb-3">
                <div className="text-left">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 capitalize tracking-wide mb-1">{card.title}</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{card.value.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{card.description}</p>
                </div>
                <div className={`relative z-10 p-2.5 ${card.iconBg} rounded-xl mt-0.5`}>
                  <IconComponent className={`h-5 w-5 ${card.iconColor}`} />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default function Expenses() {
  const { t } = useTranslation();
  const { auth, expenses, branches, expenseCategories, categoriesCount, statusCounts, kpiStatusCounts, totalExpenses, allCategoriesTotal, filters: pageFilters = {} } = usePage().props as any;
  const categoryRows: any[] = expenseCategories?.data || [];
  const [allCategoryRows, setAllCategoryRows] = useState<any[]>(categoryRows);

  useEffect(() => {
    if ((pageFilters.cat_page || 1) > 1) {
      setAllCategoryRows(prev => {
        const existingIds = new Set(prev.map((c: any) => c.id));
        const newOnes = categoryRows.filter((c: any) => !existingIds.has(c.id));
        return newOnes.length > 0 ? [...prev, ...newOnes] : prev;
      });
    } else if (allCategoryRows.length <= 10) {
      setAllCategoryRows(categoryRows);
    }
  }, [expenseCategories]);
  const permissions = auth?.permissions || [];

  const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
  const [filterValues, setFilterValues] = useState<Record<string, any>>({
    branch_id: pageFilters.branch_id || 'all',
    expense_category_id: pageFilters.expense_category_id || 'all',
    expense_date_from: pageFilters.expense_date_from || '',
    expense_date_to: pageFilters.expense_date_to || ''
  });
  const [sortField, setSortField] = useState(pageFilters.sort_field || '');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(pageFilters.sort_direction || 'desc');
  const [activeStatusTab, setActiveStatusTab] = useState(pageFilters.status || 'all');
  const [branchFilter, setBranchFilter] = useState(pageFilters.branch_id || 'all');
  const [categoryFilter, setCategoryFilter] = useState(pageFilters.expense_category_id || 'all');
  const [dateFromFilter, setDateFromFilter] = useState(pageFilters.expense_date_from || '');
  const [dateToFilter, setDateToFilter] = useState(pageFilters.expense_date_to || '');
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(pageFilters.expense_category_id || null);
  const [categorySearchTerm, setCategorySearchTerm] = useState('');
  const [isMobileCategorySheetOpen, setIsMobileCategorySheetOpen] = useState(false);

  const hasActiveFilters = () => {
    const { expense_category_id, ...otherFilters } = filterValues;
    return Object.values(otherFilters).some(value => {
      return value && value !== '' && value !== 'all';
    }) || searchTerm !== '' || activeStatusTab !== 'all';
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilterValues(prev => ({ ...prev, [key]: value }));
    if (key === 'branch_id') setBranchFilter(value);
    if (key === 'expense_category_id') setCategoryFilter(value);
    if (key === 'expense_date_from') setDateFromFilter(value);
    if (key === 'expense_date_to') setDateToFilter(value);
  };

  const selectCategory = (categoryId: string) => {
    const newCategoryId = selectedCategoryId === categoryId ? null : categoryId;
    setSelectedCategoryId(newCategoryId);
    setCategoryFilter(newCategoryId || 'all');
    setFilterValues(prev => ({ ...prev, expense_category_id: newCategoryId || 'all' }));
    const params: any = { page: 1 };
    if (searchTerm) params.search = searchTerm;
    if (activeStatusTab !== 'all') params.status = activeStatusTab;
    if (branchFilter && branchFilter !== 'all') params.branch_id = branchFilter;
    if (newCategoryId) params.expense_category_id = newCategoryId;
    if (dateFromFilter) params.expense_date_from = dateFromFilter;
    if (dateToFilter) params.expense_date_to = dateToFilter;
    if (pageFilters.per_page) params.per_page = pageFilters.per_page;
    if (pageFilters.cat_page && pageFilters.cat_page > 1) params.cat_page = pageFilters.cat_page;
    if (sortField) { params.sort_field = sortField; params.sort_direction = sortDirection; }
    router.get(route('expenses.index'), params, { preserveState: true, preserveScroll: true });
  };

  const handleStatusTabChange = (status: string) => {
    setActiveStatusTab(status);
    const params: any = { page: 1, status: status === 'all' ? undefined : status };
    if (searchTerm) params.search = searchTerm;
    if (branchFilter && branchFilter !== 'all') params.branch_id = branchFilter;
    if (categoryFilter && categoryFilter !== 'all') params.expense_category_id = categoryFilter;
    if (dateFromFilter) params.expense_date_from = dateFromFilter;
    if (dateToFilter) params.expense_date_to = dateToFilter;
    if (pageFilters.per_page) params.per_page = pageFilters.per_page;
    if (sortField) {
      params.sort_field = sortField;
      params.sort_direction = sortDirection;
    }
    router.get(route('expenses.index'), params, { preserveState: true, preserveScroll: true });
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
    if (activeStatusTab !== 'all') params.status = activeStatusTab;
    if (branchFilter && branchFilter !== 'all') params.branch_id = branchFilter;
    if (categoryFilter && categoryFilter !== 'all') params.expense_category_id = categoryFilter;
    if (dateFromFilter) params.expense_date_from = dateFromFilter;
    if (dateToFilter) params.expense_date_to = dateToFilter;
    if (pageFilters.per_page) params.per_page = pageFilters.per_page;
    if (sortField) { params.sort_field = sortField; params.sort_direction = sortDirection; }
    router.get(route('expenses.index'), params, { preserveState: true, preserveScroll: true });
  };

  const handleSort = (field: string) => {
    const newDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(newDirection);

    const params: any = { sort_field: field, sort_direction: newDirection, page: 1 };
    if (searchTerm) params.search = searchTerm;
    if (activeStatusTab !== 'all') params.status = activeStatusTab;
    if (branchFilter && branchFilter !== 'all') params.branch_id = branchFilter;
    if (categoryFilter && categoryFilter !== 'all') params.expense_category_id = categoryFilter;
    if (dateFromFilter) params.expense_date_from = dateFromFilter;
    if (dateToFilter) params.expense_date_to = dateToFilter;
    if (pageFilters.per_page) params.per_page = pageFilters.per_page;
    Object.entries(filterValues).forEach(([key, value]) => {
      if (value && value !== '' && value !== 'all') {
        params[key] = value;
      }
    });
    router.get(route('expenses.index'), params, { preserveState: true, preserveScroll: true });
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
      case 'approve':
        handleApprove(item);
        break;
      case 'reject':
        handleReject(item);
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
      toast.loading(t('Creating expense...'));
      router.post(route('expenses.store'), formData, {
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
            toast.error(t('Failed to create expense') + `: ${Object.values(errors).join(', ')}`);
          }
        }
      });
    } else if (formMode === 'edit') {
      toast.loading(t('Updating expense...'));
      router.put(route('expenses.update', currentItem.id), formData, {
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
            toast.error(t('Failed to update expense') + `: ${Object.values(errors).join(', ')}`);
          }
        }
      });
    }
  };

  const handleDeleteConfirm = () => {
    toast.loading(t('Deleting expense...'));
    router.delete(route('expenses.destroy', currentItem.id), {
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
          toast.error(t('Failed to delete expense') + `: ${Object.values(errors).join(', ')}`);
        }
      }
    });
  };

  const handleApprove = (expense: any) => {
    toast.loading(t('Approving expense...'));
    router.put(route('expenses.approve', expense.id), {}, {
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
          toast.error(t('Failed to approve expense') + `: ${Object.values(errors).join(', ')}`);
        }
      }
    });
  };

  const handleReject = (expense: any) => {
    toast.loading(t('Rejecting expense...'));
    router.put(route('expenses.reject', expense.id), {}, {
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
          toast.error(t('Failed to reject expense') + `: ${Object.values(errors).join(', ')}`);
        }
      }
    });
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    isInitialMount.current = true;
    setFilterValues(prev => ({ ...prev, branch_id: 'all', expense_date_from: '', expense_date_to: '' }));
    setBranchFilter('all');
    setDateFromFilter('');
    setDateToFilter('');
    setSortField('');
    setSortDirection('desc');
    setActiveStatusTab('all');
    const params: any = {};
    if (selectedCategoryId) params.expense_category_id = selectedCategoryId;
    router.get(route('expenses.index'), params, { preserveState: true, preserveScroll: true });
  };

  const pageActions = [];

  // Add Export button
  if (hasPermission(permissions, 'export-expenses')) {
    pageActions.push({
      label: t('Export'),
      icon: <Download className="h-4 w-4" />,
      variant: 'outline',
      onClick: async () => {
        try {
          const params = new URLSearchParams();
          if (searchTerm) params.append('search', searchTerm);
          if (activeStatusTab !== 'all') params.append('status', activeStatusTab);
          if (branchFilter && branchFilter !== 'all') params.append('branch_id', branchFilter);
          if (categoryFilter && categoryFilter !== 'all') params.append('expense_category_id', categoryFilter);
          if (dateFromFilter) params.append('expense_date_from', dateFromFilter);
          if (dateToFilter) params.append('expense_date_to', dateToFilter);

          const url = route('expenses.export') + (params.toString() ? '?' + params.toString() : '');
          const response = await fetch(url);
          if (!response.ok) throw new Error('Export failed');
          const blob = await response.blob();
          const downloadUrl = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = downloadUrl;
          a.download = `expenses_export_${new Date().toISOString().split('T')[0]}.xlsx`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(downloadUrl);
          document.body.removeChild(a);
          toast.success(t('Export completed successfully'));
        } catch (error) {
          toast.error(t('Export failed'));
        }
      }
    });
  }

  if (hasPermission(permissions, 'create-expenses')) {
    pageActions.push({
      label: t('Add Expense'),
      icon: <Plus className="h-4 w-4" />,
      variant: 'default',
      onClick: () => handleAddNew()
    });
  }

  const breadcrumbs = [
    { title: t('Dashboard'), href: route('dashboard') },
    { title: t('Expense Management'), href: route('expenses.index') },
    { title: t('Expenses') }
  ];

  const filterOptions = [
    {
      name: 'branch_id',
      label: t('Branch'),
      type: 'select',
      value: branchFilter,
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
      name: 'expense_date_from',
      label: t('Date From'),
      type: 'date',
      value: dateFromFilter,
      onChange: (value: any) => handleFilterChange('expense_date_from', value)
    },
    {
      name: 'expense_date_to',
      label: t('Date To'),
      type: 'date',
      value: dateToFilter,
      onChange: (value: any) => handleFilterChange('expense_date_to', value)
    }
  ];

  // Status tabs configuration
  const statusTabs = [
    { key: 'all', label: t('All Expenses'), count: statusCounts?.total || 0, icon: FileText },
    { key: 'pending', label: t('Pending'), count: statusCounts?.pending || 0, icon: Clock },
    { key: 'approved', label: t('Approved'), count: statusCounts?.approved || 0, icon: CheckCircle },
    { key: 'rejected', label: t('Rejected'), count: statusCounts?.rejected || 0, icon: XCircle }
  ];

  const columns = [
    {
      key: 'title',
      label: t('Title'),
      sortable: true,
      render: (value: string, row: any) => (
        <div className="flex flex-col items-start gap-1 min-w-[200px]">
          <button
            onClick={() => handleAction('view', row)}
            className="text-blue-600 dark:text-blue-400 hover:text-primary dark:hover:text-primary font-medium text-left leading-snug"
          >
            {value}
          </button>
          {row.branch?.name ? (
            <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              {/* <Building2 className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500 shrink-0" /> */}
              {row.branch.name}
            </span>
          ) : null}
        </div>
      )
    },
    // { key: 'branch', label: t('Branch'), render: (value: any) => value?.name || '-' },
    // { key: 'expense_category', label: t('Category'), render: (value: any) => value?.name || '-' },
    { key: 'amount', label: t('Amount'), sortable: true, render: (value: number) => <span className="font-mono">{window.appSettings.formatCurrency(value)}</span> },
    {
      key: 'expense_date', label: t('Date'), sortable: true, type: 'date',
      // render: (value: string) => window.appSettings?.formatDateTime(value, false) || new Date(value).toLocaleDateString() 
    },
    {
      key: 'status',
      label: t('Status'),
      render: (value: string) => {
        const statusColors = {
          pending: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20',
          approved: 'bg-green-50 text-green-700 ring-green-600/20',
          rejected: 'bg-red-50 text-red-700 ring-red-600/20'
        };
        return (
          <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${statusColors[value as keyof typeof statusColors]}`}>
            {value.charAt(0).toUpperCase() + value.slice(1)}
          </span>
        );
      }
    }
  ];

  const actions = [
    { label: t('Approve'), icon: 'Check', action: 'approve', className: 'text-green-500', requiredPermission: 'approve-expenses', condition: (item: any) => item.status === 'pending' },
    { label: t('Reject'), icon: 'X', action: 'reject', className: 'text-red-500', requiredPermission: 'reject-expenses', condition: (item: any) => item.status === 'pending' },
    { label: t('View'), icon: 'Eye', action: 'view', className: 'text-blue-500', requiredPermission: 'view-expenses' },
    { label: t('Edit'), icon: 'Edit', action: 'edit', className: 'text-amber-500', requiredPermission: 'edit-expenses' },
    { label: t('Delete'), icon: 'Trash2', action: 'delete', className: 'text-red-500', requiredPermission: 'delete-expenses' }
  ];

  return (
    <PageTemplate title={t("Expenses")} url="/expenses" actions={pageActions} breadcrumbs={breadcrumbs} noPadding description={t('Track and manage business expenses.')}>
      {/* Summary Cards */}
      <SummaryCards statusCounts={kpiStatusCounts} totalExpenses={totalExpenses} t={t} />
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow mb-4 border">
        <SearchAndFilterBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onSearch={handleSearch}
          filters={filterOptions}
          hasActiveFilters={hasActiveFilters}
          activeFilterCount={() => {
            const { expense_category_id, ...otherFilters } = filterValues;
            return Object.values(otherFilters).filter(v => v && v !== '' && v !== 'all').length + (searchTerm ? 1 : 0) + (activeStatusTab !== 'all' ? 1 : 0);
          }}
          onResetFilters={handleResetFilters}
        />
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
                    className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors clickable ${activeStatusTab === tab.key
                      ? 'text-primary'
                      : 'text-gray-500 hover:text-gray-700'
                      }`}
                  >
                    <IconComponent className="h-4 w-4" />
                    <span>{tab.label}</span>
                    <span className={`inline-flex items-center justify-center px-2 py-1 text-xs font-bold rounded-full ${activeStatusTab === tab.key
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

      {/* Mobile Category Trigger & Drawer (Visible on screens < lg) */}
      <div className="block lg:hidden mb-4">
        <Sheet open={isMobileCategorySheetOpen} onOpenChange={setIsMobileCategorySheetOpen}>
          <div className="flex items-center justify-between bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3 shadow-sm">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Filter className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 block tracking-wider">{t('Active Category')}</span>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {selectedCategoryId 
                    ? (allCategoryRows.find((c: any) => c.id.toString() === selectedCategoryId)?.name || t('Selected Category'))
                    : t('All Categories')}
                </p>
              </div>
            </div>
            <SheetTrigger asChild>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold shadow-sm hover:bg-primary/90 transition-colors shrink-0">
                <span>{t('Change')}</span>
              </button>
            </SheetTrigger>
          </div>

          <SheetContent side="bottom" className="h-[80vh] sm:h-[70vh] rounded-t-2xl px-4 py-4 flex flex-col">
            <SheetHeader className="pb-3 border-b border-gray-100 dark:border-gray-800 shrink-0 text-left">
              <div className="flex items-center justify-between">
                <SheetTitle className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  {t('Select Category')}
                </SheetTitle>
              </div>
              <div className="relative mt-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder={t('Search category by name...')}
                  value={categorySearchTerm}
                  onChange={(e) => setCategorySearchTerm(e.target.value)}
                  className="pl-9 pr-8 h-10 text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-lg"
                />
                {categorySearchTerm && (
                  <button 
                    onClick={() => setCategorySearchTerm('')} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800 py-2">
              {/* All Categories Option */}
              <button
                onClick={() => {
                  selectCategory('');
                  setIsMobileCategorySheetOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors ${
                  !selectedCategoryId ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${!selectedCategoryId ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-800'}`}>
                  <FileText className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{t('All Categories')}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${!selectedCategoryId ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600'}`}>
                  {allCategoriesTotal ?? totalExpenses ?? 0}
                </span>
              </button>

              {/* Filtered Category Items */}
              {allCategoryRows
                .filter((cat: any) => cat.name.toLowerCase().includes(categorySearchTerm.toLowerCase()))
                .map((category: any) => {
                  const isActive = selectedCategoryId === category.id.toString();
                  return (
                    <button
                      key={category.id}
                      onClick={() => {
                        selectCategory(category.id.toString());
                        setIsMobileCategorySheetOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors ${
                        isActive ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${isActive ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-800'}`}>
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{category.name}</p>
                        {category.expenses_sum_amount != null && (
                          <p className="text-[11px] font-mono text-gray-500 dark:text-gray-400">
                            {window.appSettings.formatCurrency(parseFloat(category.expenses_sum_amount || 0))}
                          </p>
                        )}
                      </div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isActive ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600'}`}>
                        {category.expenses_count ?? 0}
                      </span>
                    </button>
                  );
                })}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] xl:grid-cols-[280px_1fr] gap-4 items-start min-w-0">

        {/* Left: Category List (Desktop Only) */}
        <div className="hidden lg:block bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden lg:sticky lg:top-4 shrink-0">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wide">{t('Categories')}</p>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800 h-[550px] overflow-auto flex flex-col">
            {/* All Categories option */}
            <button
              onClick={() => selectCategory('')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors cursor-pointer ${
                !selectedCategoryId ? 'bg-primary/5 dark:bg-primary/10' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
              }`}
            >
              <div className={`h-8 w-8 shrink-0 rounded-lg flex items-center justify-center ${
                !selectedCategoryId ? 'bg-primary/10' : 'bg-gray-100 dark:bg-gray-800'
              }`}>
                <FileText className={`h-4 w-4 ${!selectedCategoryId ? 'text-primary' : 'text-gray-400 dark:text-gray-500'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate leading-tight ${
                  !selectedCategoryId ? 'text-primary' : 'text-gray-900 dark:text-gray-100'
                }`}>
                  {t('All Categories')}
                </p>
              </div>
              <span className={`shrink-0 text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${
                !selectedCategoryId ? 'bg-primary/10 text-primary' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
              }`}>
                {allCategoriesTotal ?? totalExpenses ?? 0}
              </span>
            </button>
            {allCategoryRows.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 py-10 px-4 text-center h-full">
                <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                  <FileText className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('No categories available')}</p>
              </div>
            ) : (
              <>
                {allCategoryRows.map((category: any) => {
              const isActive = selectedCategoryId === category.id.toString();
              return (
                <button
                  key={category.id}
                  onClick={() => selectCategory(category.id.toString())}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors cursor-pointer ${
                    isActive ? 'bg-primary/5 dark:bg-primary/10' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`}
                >
                  <div className={`h-8 w-8 shrink-0 rounded-lg flex items-center justify-center ${
                    isActive ? 'bg-primary/10' : 'bg-gray-100 dark:bg-gray-800'
                  }`}>
                    <FileText className={`h-4 w-4 ${isActive ? 'text-primary' : 'text-gray-400 dark:text-gray-500'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate leading-tight ${
                      isActive ? 'text-primary' : 'text-gray-900 dark:text-gray-100'
                    }`}>
                      {category.name}
                    </p>
                    {/* {category.expenses_sum_amount != null && ( */}
                      <p className="text-[11px] font-mono text-gray-400 dark:text-gray-500 mt-0.5">
                        {window.appSettings.formatCurrency(parseFloat(category.expenses_sum_amount || 0))}
                      </p>
                    {/* )} */}
                  </div>
                  <span className={`shrink-0 text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-primary/10 text-primary' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                  }`}>
                    {category.expenses_count ?? ''}
                  </span>
                </button>
              );
            })}
            {categoriesCount > allCategoryRows.length && (
              <button
                onClick={() => {
                  const params: any = { cat_page: (pageFilters.cat_page || 1) + 1 };
                  if (searchTerm) params.search = searchTerm;
                  if (activeStatusTab !== 'all') params.status = activeStatusTab;
                  if (branchFilter && branchFilter !== 'all') params.branch_id = branchFilter;
                  if (selectedCategoryId) params.expense_category_id = selectedCategoryId;
                  if (dateFromFilter) params.expense_date_from = dateFromFilter;
                  if (dateToFilter) params.expense_date_to = dateToFilter;
                  if (pageFilters.per_page) params.per_page = pageFilters.per_page;
                  if (sortField) { params.sort_field = sortField; params.sort_direction = sortDirection; }
                  router.get(route('expenses.index'), params, { preserveState: true, preserveScroll: true });
                }}
                className="w-full flex items-center justify-center px-4 py-3 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
              >
                {t('Load More...')}
              </button>
            )}
              </>
            )}
          </div>
        </div>

        {/* Right: Expenses Table */}
        <div className="min-w-0 flex-1">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden">
            <CrudTable
              columns={columns}
              actions={actions}
              data={expenses?.data || []}
              from={expenses?.from || 1}
              onAction={handleAction}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
              permissions={permissions}
              entityPermissions={{
                view: 'view-expenses',
                create: 'create-expenses',
                edit: 'edit-expenses',
                delete: 'delete-expenses'
              }}
            />

            <Pagination
              from={expenses?.from || 0}
              to={expenses?.to || 0}
              total={expenses?.total || 0}
              links={expenses?.links || []}
              entityName={t("expenses")}
              onPageChange={(url) => {
                if (url) {
                  const urlObj = new URL(url, window.location.origin);
                  if (pageFilters.per_page) urlObj.searchParams.set('per_page', pageFilters.per_page.toString());
                  if (pageFilters.search) urlObj.searchParams.set('search', pageFilters.search);
                  if (activeStatusTab !== 'all') urlObj.searchParams.set('status', activeStatusTab);
                  if (branchFilter && branchFilter !== 'all') urlObj.searchParams.set('branch_id', branchFilter);
                  if (selectedCategoryId) urlObj.searchParams.set('expense_category_id', selectedCategoryId);
                  if (dateFromFilter) urlObj.searchParams.set('expense_date_from', dateFromFilter);
                  if (dateToFilter) urlObj.searchParams.set('expense_date_to', dateToFilter);
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
                if (activeStatusTab !== 'all') params.status = activeStatusTab;
                if (branchFilter && branchFilter !== 'all') params.branch_id = branchFilter;
                if (selectedCategoryId) params.expense_category_id = selectedCategoryId;
                if (dateFromFilter) params.expense_date_from = dateFromFilter;
                if (dateToFilter) params.expense_date_to = dateToFilter;
                if (sortField) {
                  params.sort_field = sortField;
                  params.sort_direction = sortDirection;
                }
                router.get(route('expenses.index'), params, { preserveState: true, preserveScroll: true });
              }}
            />
          </div>
        </div>
      </div>

      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        {currentItem && <ViewPopup record={currentItem} />}
      </Dialog>

      <CrudFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleFormSubmit}
        formConfig={{
          fields: [
            { name: 'branch_id', label: t('Branch'), type: 'select', searchable: true, required: true, options: branches?.map((branch: any) => ({ value: branch.id, label: branch.name })) || [] },
            { name: 'expense_category_id', label: t('Category'), searchable: true, type: 'select', required: true, options: allCategoryRows.map((cat: any) => ({ value: cat.id, label: cat.name })) },
            { name: 'title', label: t('Title'), type: 'text', required: true, placeholder: 'Enter title' },
            { name: 'description', label: t('Description'), type: 'textarea', placeholder: 'Enter description' },
            { name: 'amount', label: t('Amount'), type: 'number', required: true, step: '0.01', min: '0', placeholder: '0.00' },
            {
              name: 'expense_date', label: t('Expense Date'), type: 'date', required: true,
              render: (field: any, formData: any, onChange: any, mode: any) => {
                if (mode === 'view') {
                  const formattedDate = currentItem?.expense_date
                    ? (window.appSettings?.formatDateTime
                      ? window.appSettings.formatDateTime(currentItem.expense_date, false)
                      : new Date(currentItem.expense_date).toLocaleDateString())
                    : '-';
                  return <div className="p-2 border rounded-md bg-gray-50">{formattedDate}</div>;
                }
                const dateValue = formData[field.name]
                  ? (typeof formData[field.name] === 'string' && formData[field.name].includes('T')
                    ? formData[field.name].split('T')[0]
                    : formData[field.name])
                  : '';
                return (
                  <Input
                    id={field.name}
                    name={field.name}
                    type="date"
                    max={new Date().toISOString().split('T')[0]}
                    value={dateValue}
                    onChange={(e) => onChange(field.name, e.target.value)}
                    required={field.required}
                  />
                );
              }
            },
            { name: 'receipt', label: t('Receipt'), type: 'media-picker' },
            { name: 'status', label: t('Status'), type: 'select', options: [{ value: 'pending', label: 'Pending' }, { value: 'approved', label: 'Approved' }, { value: 'rejected', label: 'Rejected' }], defaultValue: 'pending' }
          ],
          modalSize: 'xl'
        }}
        initialData={currentItem}
        title={formMode === 'create' ? t('Add New Expense') : formMode === 'edit' ? t('Edit Expense') : t('View Expense')}
        mode={formMode}
      />

      <CrudDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        itemName={currentItem?.title || ''}
        entityName="expense"
      />
    </PageTemplate>
  );
}
