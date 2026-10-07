import { useState, useRef, useEffect } from 'react';
import { PageTemplate } from '@/components/page-template';
import { usePage, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { Eye, Edit, Trash2, MoreHorizontal, Printer, Download, DollarSign, Users, ChartNoAxesCombined, ShoppingBag, Banknote, CreditCard, Smartphone, Building2, Shuffle, TrendingUp, TrendingDown, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { hasPermission } from '@/utils/authorization';
import { CrudTable } from '@/components/CrudTable';
import { CrudFormModal } from '@/components/CrudFormModal';
import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import { toast } from '@/components/custom-toast';
import { useTranslation } from 'react-i18next';
import { Pagination } from '@/components/ui/pagination';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ReceiptModal from '@/components/receipt-modal';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';


export default function Sales() {
  const { t } = useTranslation();
  const { auth, sales, branches, customers, filters: pageFilters = {}, salesStats } = usePage().props as any;
  const permissions = auth?.permissions || [];
  const getInitials = useInitials();

  // State - Initialize activeView from URL params or localStorage, fallback to 'list'
  const [activeView, setActiveView] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const viewFromUrl = urlParams.get('view');
    if (viewFromUrl && ['list', 'grid'].includes(viewFromUrl)) {
      return viewFromUrl as 'list' | 'grid';
    }
    const savedView = localStorage.getItem('sales_view');
    if (savedView && ['list', 'grid'].includes(savedView)) {
      return savedView as 'list' | 'grid';
    }
    return 'list';
  });
  const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
  const [filterValues, setFilterValues] = useState<Record<string, any>>({
    payment_method: pageFilters.payment_method || 'all',
    branch_id: pageFilters.branch_id || 'all',
    customer_id: pageFilters.customer_id || 'all'
  });
  const [sortField, setSortField] = useState(pageFilters.sort_field || '');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(pageFilters.sort_direction || 'desc');
  const [activePaymentTab, setActivePaymentTab] = useState(pageFilters.payment_method || 'all');
  const [branchFilter, setBranchFilter] = useState(pageFilters.branch_id || 'all');
  const [customerFilter, setCustomerFilter] = useState(pageFilters.customer_id || 'all');
  const [selectedYear, setSelectedYear] = useState(pageFilters.year || '');
  const [selectedMonth, setSelectedMonth] = useState(pageFilters.month || '');
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState<any>(null);

  // Payment method helper function
  const getPaymentMethodDetails = (method: string) => {
    const methodMap = {
      'cash': { label: t('Cash'), icon: Banknote, bgColor: 'bg-green-50', textColor: 'text-green-700', ringColor: 'ring-green-600/20' },
      'card': { label: t('Card'), icon: CreditCard, bgColor: 'bg-blue-50', textColor: 'text-blue-700', ringColor: 'ring-blue-600/20' },
      'digital_wallet': { label: t('Digital Wallet'), icon: Smartphone, bgColor: 'bg-purple-50', textColor: 'text-purple-700', ringColor: 'ring-purple-600/20' },
      'bank_transfer': { label: t('Bank Transfer'), icon: Building2, bgColor: 'bg-orange-50', textColor: 'text-orange-700', ringColor: 'ring-orange-600/20' },
      'mixed': { label: t('Mixed'), icon: Shuffle, bgColor: 'bg-gray-50', textColor: 'text-gray-700', ringColor: 'ring-gray-600/20' }
    };
    return methodMap[method as keyof typeof methodMap] || { label: method?.replace('_', ' ').toUpperCase(), icon: CreditCard, bgColor: 'bg-gray-50', textColor: 'text-gray-700', ringColor: 'ring-gray-600/20' };
  }
  const hasActiveFilters = () => {
    return Object.values(filterValues).some(value => {
      return value && value !== '' && value !== 'all';
    }) || searchTerm !== '';
  };
  
  const handleFilterChange = (key: string, value: any) => {
    setFilterValues(prev => ({ ...prev, [key]: value }));
    // Also update individual state for backward compatibility
    if (key === 'payment_method') setActivePaymentTab(value);
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
    const params: any = { page: 1, view: activeView };
    if (searchTerm) params.search = searchTerm;
    if (activePaymentTab && activePaymentTab !== 'all') params.payment_method = activePaymentTab;
    if (branchFilter && branchFilter !== 'all') params.branch_id = branchFilter;
    if (customerFilter && customerFilter !== 'all') params.customer_id = customerFilter;
    if (selectedYear) params.year = selectedYear;
    if (selectedMonth) params.month = selectedMonth;
    if (pageFilters.per_page) params.per_page = pageFilters.per_page;
    if (sortField) { params.sort_field = sortField; params.sort_direction = sortDirection; }
    router.get(route('sales.index'), params, { preserveState: true, preserveScroll: true });
  };

  const handleSort = (field: string) => {
    const direction = pageFilters.sort_field === field && pageFilters.sort_direction === 'asc' ? 'desc' : 'asc';
    const params: any = { sort_field: field, sort_direction: direction, page: 1, view: activeView };
    if (searchTerm) params.search = searchTerm;
    if (activePaymentTab && activePaymentTab !== 'all') params.payment_method = activePaymentTab;
    if (branchFilter && branchFilter !== 'all') params.branch_id = branchFilter;
    if (customerFilter && customerFilter !== 'all') params.customer_id = customerFilter;
    if (selectedYear) params.year = selectedYear;
    if (selectedMonth) params.month = selectedMonth;
    if (pageFilters.per_page) params.per_page = pageFilters.per_page;
    router.get(route('sales.index'), params, { preserveState: true, preserveScroll: true });
  };

  const handleAction = (action: string, item: any) => {
    setCurrentItem(item);
    switch (action) {
      case 'print':
        // Fetch full sale data with creator relationship
        fetch(route('sales.show', item.id), {
          headers: {
            'Accept': 'application/json',
          }
        })
          .then(res => res.json())
          .then(data => {
            setSelectedSale(data);
            setShowReceiptModal(true);
          })
          .catch(err => {

            toast.error(t('Failed to load sale details'));
          });
        break;
    }
  };





  const handleResetFilters = () => {
    setSearchTerm('');
    setActivePaymentTab('all');
    setBranchFilter('all');
    setCustomerFilter('all');
    // Don't reset year and month - keep current selections
    setShowFilters(false);
    
    const params: any = {
      page: 1,
      per_page: pageFilters.per_page,
      view: activeView
    };
    
    // Keep existing year and month selections
    if (selectedYear) params.year = selectedYear;
    if (selectedMonth) params.month = selectedMonth;
    
    router.get(route('sales.index'), params, { preserveState: true, preserveScroll: true });
  };

  const handleExport = () => {
    if (hasPermission(permissions, 'export-sales')) {
      // Build URL with current filters including year and month
      const params = new URLSearchParams();
      if (selectedYear) params.append('year', selectedYear);
      if (selectedMonth) params.append('month', selectedMonth);
      if (searchTerm) params.append('search', searchTerm);
      if (activePaymentTab && activePaymentTab !== 'all') params.append('payment_method', activePaymentTab);
      if (branchFilter && branchFilter !== 'all') params.append('branch_id', branchFilter);
      if (customerFilter && customerFilter !== 'all') params.append('customer_id', customerFilter);
      
      const exportUrl = route('sale.export') + (params.toString() ? '?' + params.toString() : '');
      window.location.href = exportUrl;
    }
  };

  const pageActions = [];
  if (hasPermission(permissions, 'export-sales')) {
    // Generate export label based on current filters
    const getExportLabel = () => {
      let label = t('Export');
      if (selectedYear && selectedMonth) {
        const monthNames = {
          '01': t('January'), '02': t('February'), '03': t('March'),
          '04': t('April'), '05': t('May'), '06': t('June'),
          '07': t('July'), '08': t('August'), '09': t('September'),
          '10': t('October'), '11': t('November'), '12': t('December')
        };
        label = `${t('Export')} (${monthNames[selectedMonth]} ${selectedYear})`;
      } else if (selectedYear) {
        label = `${t('Export')} (${selectedYear})`;
      }
      return label;
    };
    
    pageActions.push({
      label: t('Export'),
      icon: <Download className="h-4 w-4" />,
      variant: 'outline',
      onClick: handleExport
    });
  }

  const breadcrumbs = [
    { title: t('Dashboard'), href: route('dashboard') },
    { title: t('Sales Management'), href: route('sales.index') },
    { title: t('Sales') }
  ];

  const columns = [
    { 
      key: 'sale_number', 
      label: t('Sale Number'), 
      sortable: true,
      render: (value: string, row: any) => (
        <button
          onClick={() => handleAction('print', row)}
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
    { key: 'branch', label: t('Branch'), render: (value: any, row: any) => (
      <div className="text-sm text-gray-900 dark:text-white">
        {value?.name || row?.cashRegister?.branch?.name || '-'}
      </div>
    ) },
    { key: 'total_amount', label: t('Total'), sortable: true, render: (value: number, row: any) => (
      <div>
        <div className="font-medium text-gray-900 dark:text-white font-mono">
          {window.appSettings.formatCurrency(value)}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {row.items?.length || 0} {t('items')}
        </div>
      </div>
    ) },
    // { key: 'payment_method', label: t('Payment Method'), render: (value: string) => {
    //   const methodDetails = getPaymentMethodDetails(value);
    //   const IconComponent = methodDetails.icon;
    //   return (
    //     <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${methodDetails.bgColor} ${methodDetails.textColor} ${methodDetails.ringColor}`}>
    //       {/* <IconComponent className="h-4 w-4 mr-1" /> */}
    //       {methodDetails.label}
    //     </span>
    //   );
    // } },
    { key: 'sale_date', label: t('Date'), sortable: true, type: 'date',
      // render: (value: string) => window.appSettings?.formatDateTime(value, false) || new Date(value).toLocaleDateString() 
    }
  ];

  const actions = [
    { label: t('Print Receipt'), icon: 'Printer', action: 'print', className: 'text-green-500', requiredPermission: 'view-sales' }
  ];

  const handleTabChange = (value: string) => {
    setActivePaymentTab(value);
    const params: any = { page: 1, view: activeView };
    if (searchTerm) params.search = searchTerm;
    if (value && value !== 'all') params.payment_method = value;
    if (branchFilter && branchFilter !== 'all') params.branch_id = branchFilter;
    if (customerFilter && customerFilter !== 'all') params.customer_id = customerFilter;
    if (selectedYear) params.year = selectedYear;
    if (selectedMonth) params.month = selectedMonth;
    if (pageFilters.per_page) params.per_page = pageFilters.per_page;
    if (sortField) { params.sort_field = sortField; params.sort_direction = sortDirection; }
    router.get(route('sales.index'), params, { preserveState: true, preserveScroll: true });
  };

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    const params: any = { page: 1, view: activeView };
    if (searchTerm) params.search = searchTerm;
    if (activePaymentTab && activePaymentTab !== 'all') params.payment_method = activePaymentTab;
    if (branchFilter && branchFilter !== 'all') params.branch_id = branchFilter;
    if (customerFilter && customerFilter !== 'all') params.customer_id = customerFilter;
    if (year && year !== 'all') params.year = year;
    if (selectedMonth) params.month = selectedMonth;
    if (pageFilters.per_page) params.per_page = pageFilters.per_page;
    if (sortField) { params.sort_field = sortField; params.sort_direction = sortDirection; }
    router.get(route('sales.index'), params, { preserveState: true, preserveScroll: true });
  };

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    const params: any = { page: 1, view: activeView };
    if (searchTerm) params.search = searchTerm;
    if (activePaymentTab && activePaymentTab !== 'all') params.payment_method = activePaymentTab;
    if (branchFilter && branchFilter !== 'all') params.branch_id = branchFilter;
    if (customerFilter && customerFilter !== 'all') params.customer_id = customerFilter;
    if (selectedYear) params.year = selectedYear;
    if (month && month !== 'all') params.month = month;
    if (pageFilters.per_page) params.per_page = pageFilters.per_page;
    if (sortField) { params.sort_field = sortField; params.sort_direction = sortDirection; }
    router.get(route('sales.index'), params, { preserveState: true, preserveScroll: true });
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

  const filterOptions: any[] = [
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
    // {
    //   name: 'payment_method',
    //   label: t('Payment Method'),
    //   type: 'select',
    //   value: activePaymentTab,
    //   onChange: setActivePaymentTab,
    //   options: [
    //     { value: 'all', label: t('All Methods') },
    //     { value: 'cash', label: t('Cash') },
    //     { value: 'card', label: t('Card') },
    //     { value: 'digital_wallet', label: t('Digital Wallet') },
    //     { value: 'bank_transfer', label: t('Bank Transfer') },
    //     { value: 'mixed', label: t('Mixed') }
    //   ]
    // }
  ];

  return (
    <PageTemplate title={t("Sales")} url="/sales" actions={pageActions} breadcrumbs={breadcrumbs} noPadding description={t('Track and manage all your sales transactions.')}>
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-50 dark:bg-blue-700/20 rounded-bl-full"></div>
          <div className="p-4 relative">
            <div className="flex items-start justify-between mb-3">
              <div className="text-left">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 capitalize tracking-wide mb-1">{t('Total Sales')}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{salesStats?.totalSales || 0}</p>
              </div>
              <div className="relative z-10 p-2.5 bg-blue-50 dark:bg-blue-700/20 rounded-xl mt-0.5">
                <ChartNoAxesCombined className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
        </div>
        
        <div className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-50 dark:bg-emerald-700/20 rounded-bl-full"></div>
          <div className="p-4 relative">
            <div className="flex items-start justify-between mb-3">
              <div className="text-left">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 capitalize tracking-wide mb-1">{t('Total Revenue')}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white font-mono">{salesStats?.totalRevenue ? window.appSettings.formatCurrency(salesStats.totalRevenue) : window.appSettings.formatCurrency(0)}</p>
              </div>
              <div className="relative z-10 p-2.5 bg-emerald-50 dark:bg-emerald-700/20 rounded-xl mt-0.5">
                <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </div>
        </div>
        
        <div className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-50 dark:bg-purple-700/20 rounded-bl-full"></div>
          <div className="p-4 relative">
            <div className="flex items-start justify-between mb-3">
              <div className="text-left">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 capitalize tracking-wide mb-1">{t('Total Customers')}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{salesStats?.totalCustomers || 0}</p>
              </div>
              <div className="relative z-10 p-2.5 bg-purple-50 dark:bg-purple-700/20 rounded-xl mt-0.5">
                <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </div>
        
        <div className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-orange-50 dark:bg-orange-700/20 rounded-bl-full"></div>
          <div className="p-4 relative">
            <div className="flex items-start justify-between mb-3">
              <div className="text-left">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 capitalize tracking-wide mb-1">{t('Avg Order Value')}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white font-mono">{salesStats?.avgOrderValue ? window.appSettings.formatCurrency(salesStats.avgOrderValue) : window.appSettings.formatCurrency(0)}</p>
              </div>
              <div className="relative z-10 p-2.5 bg-orange-50 dark:bg-orange-700/20 rounded-xl mt-0.5">
                <ShoppingBag className="h-5 w-5 text-orange-600 dark:text-orange-400" />
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

              const params: any = { page: 1, view: activeView };
              if (searchTerm) params.search = searchTerm;
              if (activePaymentTab && activePaymentTab !== 'all') params.payment_method = activePaymentTab;
              if (branchFilter && branchFilter !== 'all') params.branch_id = branchFilter;
              if (customerFilter && customerFilter !== 'all') params.customer_id = customerFilter;
              params.year = currentYear;
              params.month = currentMonth;
              if (pageFilters.per_page) params.per_page = pageFilters.per_page;
              if (sortField) { params.sort_field = sortField; params.sort_direction = sortDirection; }
              router.get(route('sales.index'), params, { preserveState: true, preserveScroll: true });
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
              className={`text-xs h-8 px-2 ${selectedMonth === month.value
                  ? 'bg-primary text-primary-foreground border-primary hover:bg-primary/90'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
            >
              {month.label.substring(0, 3)}
            </Button>
          ))}
        </div>
      </div>

      <div className="border bg-white dark:bg-gray-900 rounded-lg shadow mb-4">
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
            setFilterValues({ payment_method: 'all', branch_id: 'all', customer_id: 'all' });
            setActivePaymentTab('all');
            setBranchFilter('all');
            setCustomerFilter('all');
            setSortField('');
            setSortDirection('desc');
            // Don't reset year and month - keep current selections
            
            const params: any = {
              view: activeView
            };
            
            // Keep existing year and month selections
            if (selectedYear) params.year = selectedYear;
            if (selectedMonth) params.month = selectedMonth;
            
            router.get(route('sales.index'), params, { preserveState: true, preserveScroll: true });
          }}
          showViewToggle={false}
          activeView={activeView}
          onViewChange={(view) => {
            setActiveView(view);
            
            const currentUrl = new URL(window.location.href);
            const params = new URLSearchParams(currentUrl.search);
            params.set('view', view);
            
            if (searchTerm) params.set('search', searchTerm);
            if (activePaymentTab && activePaymentTab !== 'all') params.set('payment_method', activePaymentTab);
            if (branchFilter && branchFilter !== 'all') params.set('branch_id', branchFilter);
            if (customerFilter && customerFilter !== 'all') params.set('customer_id', customerFilter);
            if (selectedYear) params.set('year', selectedYear);
            if (selectedMonth) params.set('month', selectedMonth);
            if (pageFilters.per_page) params.set('per_page', pageFilters.per_page.toString());
            if (pageFilters.page) params.set('page', pageFilters.page.toString());
            if (pageFilters.sort_field) params.set('sort_field', pageFilters.sort_field);
            if (pageFilters.sort_direction) params.set('sort_direction', pageFilters.sort_direction);
            
            router.get(route('sales.index'), Object.fromEntries(params), {
              preserveState: true,
              preserveScroll: true
            });
          }}
        />
      </div>

      {activeView === 'list' ? (
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden">
          <CrudTable
            columns={columns}
            actions={actions}
            data={sales?.data || []}
            from={sales?.from || 1}
            onAction={handleAction}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={(field: string) => {
              const newDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
              setSortField(field);
              setSortDirection(newDirection);
              handleSort(field);
            }}
            permissions={permissions}
            entityPermissions={{
              view: 'view-sales',
              edit: 'edit-sales',
              delete: 'delete-sales'
            }}
          />

          <Pagination
            from={sales?.from || 0}
            to={sales?.to || 0}
            total={sales?.total || 0}
            links={sales?.links}
            entityName={t("sales")}
            onPageChange={(url) => {
              if (url) {
                const urlObj = new URL(url, window.location.origin);
                urlObj.searchParams.set('view', activeView);
                if (pageFilters.per_page) urlObj.searchParams.set('per_page', pageFilters.per_page.toString());
                if (pageFilters.search) urlObj.searchParams.set('search', pageFilters.search);
                if (activePaymentTab && activePaymentTab !== 'all') urlObj.searchParams.set('payment_method', activePaymentTab);
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
              const params: any = { page: 1, per_page: parseInt(value), view: activeView };
              if (searchTerm) params.search = searchTerm;
              if (activePaymentTab && activePaymentTab !== 'all') params.payment_method = activePaymentTab;
              if (branchFilter && branchFilter !== 'all') params.branch_id = branchFilter;
              if (customerFilter && customerFilter !== 'all') params.customer_id = customerFilter;
              if (selectedYear) params.year = selectedYear;
              if (selectedMonth) params.month = selectedMonth;
              if (sortField) {
                params.sort_field = sortField;
                params.sort_direction = sortDirection;
              }
              router.get(route('sales.index'), params, { preserveState: true, preserveScroll: true });
            }}
          />
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {sales?.data?.map((sale: any) => {
              const methodDetails = getPaymentMethodDetails(sale.payment_method);
              const IconComponent = methodDetails.icon;
              
              return (
                <Card key={sale.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <div className="p-4">
                    {/* Customer Info */}
                    <div className="flex items-center mb-3">
                      <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center mr-2">
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          {sale.customer?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'WC'}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {sale.customer?.name || t('Walk-in Customer')}
                        </p>
                        {sale.customer && sale.customer.email && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {sale.customer.email}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Horizontal Line */}
                    <div className="border-b border-gray-200 dark:border-gray-700 mb-3"></div>

                    {/* Header with Sale Number and Status */}
                    <div className="flex items-center justify-between mb-3">
                      <button
                        onClick={() => handleAction('print', sale)}
                        className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20"
                      >
                        {sale.sale_number}
                      </button>
                      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                          sale.status === 'completed' ? 'bg-green-50 text-green-700 ring-green-600/20' :
                          sale.status === 'cancelled' ? 'bg-red-50 text-red-700 ring-red-600/20' :
                          'bg-yellow-50 text-yellow-700 ring-yellow-600/20'
                        }`}>
                          {sale.status?.charAt(0).toUpperCase() + sale.status?.slice(1)}
                        </span>
                    </div>

                    {/* Sale Details */}
                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500 dark:text-gray-400">{t('Amount')}:</span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white font-mono">
                          {window.appSettings.formatCurrency(sale.total_amount)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500 dark:text-gray-400">{t('Payment method')}:</span>
                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${methodDetails.bgColor} ${methodDetails.textColor} ${methodDetails.ringColor}`}>
                          {/* <IconComponent className="h-3 w-3 mr-1" /> */}
                          {methodDetails.label}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500 dark:text-gray-400">{t('Branch')}:</span>
                        <span className="text-xs text-gray-700 dark:text-gray-300">
                          {sale.branch?.name || sale.cashRegister?.branch?.name || '-'}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500 dark:text-gray-400">{t('Item')}:</span>
                        <span className="text-xs text-gray-700 dark:text-gray-300">
                          {sale.items?.length || 0} {t('items')}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500 dark:text-gray-400">{t('Date')}:</span>
                        <span className="text-xs text-gray-700 dark:text-gray-300">
                          {window.appSettings?.formatDateTime ? window.appSettings.formatDateTime(sale.sale_date, false) : new Date(sale.sale_date).toLocaleDateString()}
                        </span>
                      </div>
                      
                    </div>

                    {/* Print Receipt Button */}
                    <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                      {hasPermission(permissions, 'view-sales') && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleAction('print', sale)} 
                          className="w-full justify-center text-xs py-1.5 h-auto"
                        >
                          <Printer className="h-3 w-3 mr-1" />
                          {t('Print Receipt')}
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
          
          <div className="mt-6 bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden">
            <Pagination
              from={sales?.from || 0}
              to={sales?.to || 0}
              total={sales?.total || 0}
              links={sales?.links}
              entityName={t("sales")}
              onPageChange={(url) => {
                if (url) {
                  const urlObj = new URL(url, window.location.origin);
                  urlObj.searchParams.set('view', activeView);
                  if (pageFilters.per_page) urlObj.searchParams.set('per_page', pageFilters.per_page.toString());
                  if (pageFilters.search) urlObj.searchParams.set('search', pageFilters.search);
                  if (activePaymentTab && activePaymentTab !== 'all') urlObj.searchParams.set('payment_method', activePaymentTab);
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
                const params: any = { page: 1, per_page: parseInt(value), view: activeView };
                if (searchTerm) params.search = searchTerm;
                if (activePaymentTab && activePaymentTab !== 'all') params.payment_method = activePaymentTab;
                if (branchFilter && branchFilter !== 'all') params.branch_id = branchFilter;
                if (customerFilter && customerFilter !== 'all') params.customer_id = customerFilter;
                if (selectedYear) params.year = selectedYear;
                if (selectedMonth) params.month = selectedMonth;
                if (sortField) {
                  params.sort_field = sortField;
                  params.sort_direction = sortDirection;
                }
                router.get(route('sales.index'), params, { preserveState: true, preserveScroll: true });
              }}
            />
          </div>
        </div>
      )}



      {/* Receipt Modal */}
      {selectedSale && (
        <ReceiptModal
          isOpen={showReceiptModal}
          onClose={() => {
            setShowReceiptModal(false);
            setSelectedSale(null);
          }}
          sale={selectedSale}
          companyInfo={{
            name: (() => {
              if (selectedSale?.creator?.type === 'company') {
                return selectedSale.creator.name;
              }
              if (selectedSale?.creator?.creator?.type === 'company') {
                return selectedSale.creator.creator.name;
              }
              return auth?.user?.name || 'Company Name';
            })(),
            address: window.appSettings?.get('companyAddress') || '',
            phone: window.appSettings?.get('companyTelephone') || '',
            email: selectedSale?.creator?.email || auth?.user?.email || ''
          }}
        />
      )}
    </PageTemplate>
  );
}