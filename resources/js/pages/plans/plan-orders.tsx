import { PageTemplate } from '@/components/page-template';
import { CrudTable } from '@/components/CrudTable';
import { planOrdersConfig } from '@/config/crud/plan-orders';
import { useEffect, useState, useRef } from 'react';
import { usePage, router } from '@inertiajs/react';
import { toast } from '@/components/custom-toast';
import { useTranslation } from 'react-i18next';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Eye, FileText, List, Clock, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import ViewPopup from './view';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';

export default function PlanOrdersPage() {
  const { t } = useTranslation();
  const { flash, planOrders, statusCounts, filters: pageFilters = {}, auth, isSuperAdmin = false } = usePage().props as any;
  const permissions = auth?.permissions || [];
  const getInitials = useInitials();

  const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
  const [filterValues, setFilterValues] = useState<Record<string, any>>({});
  const [dateFrom, setDateFrom] = useState<Date | undefined>(pageFilters.date_from ? new Date(pageFilters.date_from) : undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(pageFilters.date_to ? new Date(pageFilters.date_to) : undefined);
  const [activeStatus, setActiveStatus] = useState(pageFilters.status || 'all');
  const [showFilters, setShowFilters] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [sortField, setSortField] = useState(pageFilters.sort_by || '');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(pageFilters.sort_order || 'desc');

  const [isChatGptOpen, setIsChatGptOpen] = useState(false);
  useEffect(() => {
    const checkChatGpt = () => {
      const chatGptModal = document.querySelector('[data-chatgpt-modal]');
      setIsChatGptOpen(!!chatGptModal);
    };
    const observer = new MutationObserver(checkChatGpt);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (flash?.success) toast.success(flash.success);
    if (flash?.error) toast.error(flash.error);
  }, [flash]);

  const handleAction = (action: string, item: any) => {
    if (action === 'approve') {
      router.post(route("plan-orders.approve", item.id), {}, {
        onSuccess: () => {
        },
        onError: () => {
          toast.error(t('Failed to approve plan order'));
        }
      });
    } else if (action === 'reject') {
      setSelectedOrder(item);
      setIsRejectDialogOpen(true);
    } else if (action === 'view_details') {
      setSelectedOrder(item);
      setShowDetailsModal(true);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters();
  };

  const applyFilters = (status?: string) => {
    const params: any = { page: 1 };

    if (searchTerm) params.search = searchTerm;

    Object.entries(filterValues).forEach(([key, value]) => {
      if (value && value !== 'all') params[key] = value;
    });

    if (dateFrom) params.date_from = format(dateFrom, 'yyyy-MM-dd');
    if (dateTo) params.date_to = format(dateTo, 'yyyy-MM-dd');

    const currentStatus = status !== undefined ? status : activeStatus;
    if (currentStatus && currentStatus !== 'all') params.status = currentStatus;

    if (sortField) {
      params.sort_by = sortField;
      params.sort_order = sortDirection;
    }

    if (pageFilters.per_page) params.per_page = pageFilters.per_page;

    router.get(route("plan-orders.index"), params, { preserveState: true, preserveScroll: true });
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

    if (activeStatus && activeStatus !== 'all') {
      params.status = activeStatus;
    }

    params.sort_by = field;
    params.sort_order = newDirection;

    if (pageFilters.per_page) {
      params.per_page = pageFilters.per_page;
    }

    router.get(route("plan-orders.index"), params, { preserveState: true, preserveScroll: true });
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilterValues(prev => ({ ...prev, [key]: value }));
  };

  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    applyFilters();
  }, [filterValues, dateFrom, dateTo]);

  const breadcrumbs = [
    { title: t('Dashboard'), href: route('dashboard') },
    { title: t('Plans'), href: route('plans.index') },
    { title: t('Plan Orders') }
  ];

  const hasActiveFilters = () => {
    return Object.values(filterValues).some(value => value && value !== '' && value !== 'all') ||
      !!dateFrom || !!dateTo || searchTerm !== '' || activeStatus !== 'all';
  };

  const handleRejectConfirm = () => {
    if (selectedOrder) {
      router.post(route("plan-orders.reject", selectedOrder.id), { notes: rejectionReason }, {
        onSuccess: () => {
          setIsRejectDialogOpen(false);
          setRejectionReason('');
          setSelectedOrder(null);
        },
        onError: () => {
          toast.error(t('Failed to reject plan order'));
        }
      });
    }
  };

  const filteredActions = isSuperAdmin ? [
    {
      label: t('View'),
      icon: 'Eye',
      action: 'view_details',
      className: 'text-blue-600',
      requiredPermission: null,
    },
    ...(planOrdersConfig.table.actions?.map(action => ({
      ...action,
      label: t(action.label)
    })) || [])
  ] : [];

  const customColumns = planOrdersConfig.table.columns.map(col => {
    if (col.key === 'user.name') {
      return {
        ...col,
        label: t(col.label),
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
    } else if(col.key === 'order_number') {
      return {
        ...col,
        label: t(col.label),
        render: (_, row) => {
          return (
            <div className="flex items-center gap-3 text-nowrap">
              <span>{row.order_number || '-'}</span>
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
            pending:   'bg-yellow-50 text-yellow-700 ring-yellow-600/20',
            approved:  'bg-green-50 text-green-700 ring-green-600/20',
            rejected:  'bg-red-50 text-red-700 ring-red-600/20',
            completed: 'bg-blue-50 text-blue-700 ring-blue-600/20',
          };
          return (
            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset capitalize ${statusColors[value] || 'bg-gray-50 text-gray-700 ring-gray-600/20'}`}>
              {t(value)}
            </span>
          );
        }
      };
    } else if (col.key === 'receipt_url') {
      return {
        ...col,
        label: t(col.label),
        render: (value) => {
          if (!value) return '-';
          return (
            <a href={value} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-primary hover:text-primary-800">
              <FileText className="w-4 h-4" />
            </a>
          );
        }
      };
    } else if (col.key === 'original_price') {
      return {
        ...col,
        label: t(col.label),
        render: (value, row) => <span className='font-mono'>{row.formatted_original_price}</span>
      };
    } else if (col.key === 'final_price') {
      return {
        ...col,
        label: t(col.label),
        render: (value, row) => <span className='font-mono'>{row.formatted_final_price}</span>
      };
    } else if (col.key === 'discount_amount') {
      return {
        ...col,
        label: t(col.label),
        render: (value, row) => row.discount_amount > 0 ? <span className='font-mono'>{row.formatted_discount_amount}</span> : '-'
      };
    } else {
      return { ...col, label: t(col.label) };
    }
  });

  return (
    <PageTemplate
      title={t('Plan Orders')}
      url="/plan-orders"
      breadcrumbs={breadcrumbs}
      noPadding
      description={isSuperAdmin ? t('View and manage all plan orders from companies.') : t('View your plan orders.')}
    >
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow mb-4 border">
        <SearchAndFilterBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onSearch={handleSearch}
          filters={[
            ...planOrdersConfig.filters?.filter(f => f.key !== 'status').map(filter => ({
              name: filter.key,
              label: t(filter.label),
              type: 'select' as const,
              value: filterValues[filter.key] || '',
              onChange: (value) => handleFilterChange(filter.key, value),
              options: filter.options?.map(option => ({
                value: option.value,
                label: t(option.label)
              })) || []
            })) || [],
            {
              name: 'date_from',
              label: t('Date From'),
              type: 'date' as const,
              value: dateFrom,
              onChange: (date: Date | undefined) => setDateFrom(date),
            },
            {
              name: 'date_to',
              label: t('Date To'),
              type: 'date' as const,
              value: dateTo,
              onChange: (date: Date | undefined) => setDateTo(date),
            },
          ]}
          hasActiveFilters={hasActiveFilters}
          activeFilterCount={() => {
            return Object.values(filterValues).filter(v => v && v !== '' && v !== 'all').length + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0) + (searchTerm ? 1 : 0) + (activeStatus !== 'all' ? 1 : 0);
          }}
          onResetFilters={() => {
            isInitialMount.current = true;
            setSearchTerm('');
            setFilterValues({});
            setDateFrom(undefined);
            setDateTo(undefined);
            setActiveStatus('all');
            setSortField('');
            setSortDirection('desc');
            router.get(route('plan-orders.index'), {}, { preserveState: true, preserveScroll: true });
          }}
        />
        <div className="border-t border-gray-200 dark:border-gray-700 mb-1"></div>
        <div className="bg-white dark:bg-gray-900 ml-2 mr-2">
          <div className="flex space-x-0 overflow-x-auto">
            {[
              { key: 'all',      label: t('All Orders'), count: statusCounts?.total    ?? (planOrders?.total || 0), icon: List },
              { key: 'pending',  label: t('Pending'),    count: statusCounts?.pending  || 0, icon: Clock },
              { key: 'approved', label: t('Approved'),   count: statusCounts?.approved || 0, icon: CheckCircle },
              { key: 'rejected', label: t('Rejected'),   count: statusCounts?.rejected || 0, icon: XCircle },
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
          data={planOrders?.data || []}
          from={planOrders?.from || 1}
          onAction={handleAction}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
          permissions={permissions}
          entityPermissions={planOrdersConfig.entity.permissions}
        />

        <Pagination
          from={planOrders?.from || 0}
          to={planOrders?.to || 0}
          total={planOrders?.total || 0}
          links={planOrders?.links}
          entityName={t("plan orders")}
          onPageChange={(url) => {
            if (url) {
              const urlObj = new URL(url, window.location.origin);
              if (pageFilters.per_page) urlObj.searchParams.set('per_page', pageFilters.per_page.toString());
              if (pageFilters.search) urlObj.searchParams.set('search', pageFilters.search);
              if (sortField) {
                urlObj.searchParams.set('sort_by', sortField);
                urlObj.searchParams.set('sort_order', sortDirection);
              }
              if (activeStatus !== 'all') urlObj.searchParams.set('status', activeStatus);
              if (dateFrom) urlObj.searchParams.set('date_from', format(dateFrom, 'yyyy-MM-dd'));
              if (dateTo) urlObj.searchParams.set('date_to', format(dateTo, 'yyyy-MM-dd'));
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
            if (dateFrom) params.date_from = format(dateFrom, 'yyyy-MM-dd');
            if (dateTo) params.date_to = format(dateTo, 'yyyy-MM-dd');
            Object.entries(filterValues).forEach(([key, val]) => {
              if (val && val !== '' && val !== 'all') params[key] = val;
            });
            if (sortField) {
              params.sort_by = sortField;
              params.sort_order = sortDirection;
            }
            if (activeStatus !== 'all') params.status = activeStatus;
            router.get(route('plan-orders.index'), params, { preserveState: true, preserveScroll: true });
          }}
        />
      </div>

      {/* Order Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        {selectedOrder && !isRejectDialogOpen && <ViewPopup record={selectedOrder} />}
      </Dialog>

      <Dialog open={isRejectDialogOpen} onOpenChange={(open) => { if (!open) setIsRejectDialogOpen(false); }} modal={!isChatGptOpen}>
        <DialogContent className="pl-0 pr-0">
          <DialogHeader className="px-6">
            <DialogTitle>{t('Reject Plan Order')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 px-6">
            <div>
              <Label htmlFor="rejection-reason">{t('Rejection Reason (Optional)')}</Label>
              <Textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder={t('Enter reason for rejection...')}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter className="px-6">
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
              {t('Cancel')}
            </Button>
            <Button variant="destructive" onClick={handleRejectConfirm}>
              {t('Reject Order')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTemplate>
  );
}
