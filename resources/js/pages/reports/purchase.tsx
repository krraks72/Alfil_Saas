import { useState } from 'react';
import { PageTemplate } from '@/components/page-template';
import { usePage, router, Link } from '@inertiajs/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from 'react-i18next';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ShoppingBag, DollarSign, TrendingUp, Users, Download, Calendar } from 'lucide-react';
import { hasPermission } from '@/utils/authorization';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function PurchaseReport() {
  const { t } = useTranslation();
  const { filters, summary, purchases, monthlyTrend, vendors, auth } = usePage().props as any;
  const permissions = auth?.permissions || [];
  const getInitials = useInitials();
  
  const [dateFrom, setDateFrom] = useState(filters.date_from);
  const [dateTo, setDateTo] = useState(filters.date_to);
  const [vendorId, setVendorId] = useState(filters.vendor_id || 'all');
  const [status, setStatus] = useState(filters.status || 'all');
  const [chartView, setChartView] = useState(filters.chart_view || 'daily');

  const canViewPurchases = hasPermission(permissions, 'view-purchases');

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.get(window.location.pathname, {
      date_from: dateFrom,
      date_to: dateTo,
      vendor_id: vendorId === 'all' ? undefined : vendorId,
      status: status === 'all' ? undefined : status,
      chart_view: chartView,
    });
  };

  const handleChartViewChange = (view: string) => {
    setChartView(view);
    router.get(window.location.pathname, {
      date_from: dateFrom,
      date_to: dateTo,
      vendor_id: vendorId === 'all' ? undefined : vendorId,
      status: status === 'all' ? undefined : status,
      chart_view: view,
    });
  };

  const breadcrumbs = [
    { title: t('Dashboard'), href: '/dashboard' },
    { title: t('Reports'), href: '#' },
    { title: t('Purchase Report') }
  ];

  const handleExport = () => {
    const params = new URLSearchParams({
      date_from: dateFrom,
      date_to: dateTo,
      ...(vendorId !== 'all' && { vendor_id: vendorId }),
      ...(status !== 'all' && { status: status }),
    });
    window.location.href = `${route('reports.purchase.export')}?${params.toString()}`;
  };



  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: t('Active'), color: 'bg-green-50 text-green-700 ring-green-600/20' },
      inactive: { label: t('Inactive'), color: 'bg-red-50 text-red-700 ring-red-600/20' },
    };
    return statusConfig[status as keyof typeof statusConfig] || { label: status, color: 'bg-gray-50 text-gray-700 ring-gray-600/20' };
  };



  return (
    <PageTemplate 
      title={t("Purchase Report")} 
      breadcrumbs={breadcrumbs} 
      noPadding
      actions={hasPermission(permissions, 'export-reports') ? [
        {
          label: t('Export'),
          icon: <Download className="h-4 w-4" />,
          onClick: handleExport
        }
      ] : []}
      description={t('View purchase orders analytics.')}
    >
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 overflow-hidden relative">
          <div className="absolute top-0 ltr:right-0 rtl:left-0 w-20 h-20 bg-blue-50 dark:bg-blue-700/20 ltr:rounded-bl-full rtl:rounded-br-full"></div>
          <div className="p-4 relative">
            <div className="flex items-start justify-between mb-3">
              <div className="text-start">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 capitalize tracking-wide mb-1">{t('Total Purchases')}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{summary.total_purchases}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('All time purchases')}</p>
              </div>
              <div className="relative z-10 p-2.5 bg-blue-50 dark:bg-blue-700/20 rounded-xl mt-0.5">
                <ShoppingBag className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 overflow-hidden relative">
          <div className="absolute top-0 ltr:right-0 rtl:left-0 w-20 h-20 bg-green-50 dark:bg-green-700/20 ltr:rounded-bl-full rtl:rounded-br-full"></div>
          <div className="p-4 relative">
            <div className="flex items-start justify-between mb-3">
              <div className="text-start">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 capitalize tracking-wide mb-1">{t('Total Amount')}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {window.appSettings?.formatCurrency
                    ? <span className="font-mono">{window.appSettings.formatCurrency(summary.total_amount)}</span>
                    : <span className="font-mono">{`$${summary.total_amount.toLocaleString()}`}</span>
                  }
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('All time amount')}</p>
              </div>
              <div className="relative z-10 p-2.5 bg-green-50 dark:bg-green-700/20 rounded-xl mt-0.5">
                <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 overflow-hidden relative">
          <div className="absolute top-0 ltr:right-0 rtl:left-0 w-20 h-20 bg-purple-50 dark:bg-purple-700/20 ltr:rounded-bl-full rtl:rounded-br-full"></div>
          <div className="p-4 relative">
            <div className="flex items-start justify-between mb-3">
              <div className="text-start">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 capitalize tracking-wide mb-1">{t('Avg Purchase Value')}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {window.appSettings?.formatCurrency
                    ? <span className="font-mono">{window.appSettings.formatCurrency(summary.avg_purchase_value)}</span>
                    : <span className="font-mono">{`$${summary.avg_purchase_value.toLocaleString()}`}</span>
                  }
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('Average per purchase')}</p>
              </div>
              <div className="relative z-10 p-2.5 bg-purple-50 dark:bg-purple-700/20 rounded-xl mt-0.5">
                <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Filters */}
      <Card className="mb-6 p-4">
        <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div>
            <Label htmlFor="date_from">{t('From Date')}</Label>
            <Input
              id="date_from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="date_to">{t('To Date')}</Label>
            <Input
              id="date_to"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="vendor">{t('Vendor')}</Label>
            <Select value={vendorId} onValueChange={setVendorId}>
              <SelectTrigger>
                <SelectValue placeholder={t('All Vendors')} />
              </SelectTrigger>
              <SelectContent searchable>
                <SelectItem value="all">{t('All Vendors')}</SelectItem>
                {vendors?.map((vendor: any) => (
                  <SelectItem key={vendor.id} value={vendor.id.toString()}>
                    {vendor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="status">{t('Status')}</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder={t('All Status')} />
              </SelectTrigger>
              <SelectContent searchable>
                <SelectItem value="all">{t('All Status')}</SelectItem>
                <SelectItem value="active">{t('Active')}</SelectItem>
                <SelectItem value="inactive">{t('Inactive')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit">{t('Apply Filters')}</Button>
        </form>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 mb-6">
        {/* Purchase Trend */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-start">{t('Purchase Trend')}</h3>
            <div className="flex gap-2">
              <Button
                variant={chartView === 'daily' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleChartViewChange('daily')}
              >
                {t('Daily')}
              </Button>
              <Button
                variant={chartView === 'monthly' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleChartViewChange('monthly')}
              >
                {t('Monthly')}
              </Button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12 }}
                interval={monthlyTrend?.length > 10 ? Math.ceil(monthlyTrend.length / 8) : 0}
                tickFormatter={(value) => {
                  if (!value) return '';
                  if (chartView === 'monthly') {
                    return value; // Show as 2025-01
                  }
                  return value; // Show as 2025-01-15
                }}
              />
              <YAxis />
              <Tooltip 
                formatter={(value) => [window.appSettings?.formatCurrency(Number(value)) || `$${Number(value).toLocaleString()}`, t('Amount')]}
                labelFormatter={(value) => {
                  if (!value) return '';
                  return value; // Show raw date format
                }}
              />
              <Line type="monotone" dataKey="total_amount" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Purchases Table */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-start">{t('Purchase Orders')}</h3>
        <div className="max-h-115 overflow-auto border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-start">{t('Purchase Number')}</TableHead>
                <TableHead className="text-start">{t('Vendor')}</TableHead>
                <TableHead className="text-start">{t('Purchase Date')}</TableHead>
                <TableHead className="text-start">{t('Total Items')}</TableHead>
                <TableHead className="text-start">{t('Total Amount')}</TableHead>
                <TableHead className="text-start">{t('Status')}</TableHead>
                <TableHead className="text-start">{t('Notes')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchases && purchases.length > 0 ? (
                purchases.map((purchase: any, index: number) => {
                  const statusBadge = getStatusBadge(purchase.status);
                  
                  return (
                    <TableRow key={index}>
                      <TableCell className="text-start text-sm font-medium text-gray-900">
                        {canViewPurchases ? (
                          <button
                            onClick={() => router.visit(route('purchases.show', purchase.id))}
                            className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20 whitespace-nowrap"
                          >
                            {purchase.purchase_number}
                          </button>
                        ) : (
                          <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20 whitespace-nowrap">
                            {purchase.purchase_number}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-start text-sm text-gray-500">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 shrink-0">
                            <AvatarFallback>{getInitials(purchase.vendor?.name || '-')}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{purchase.vendor?.name || '-'}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{purchase.vendor?.email || ''}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-start text-sm text-gray-500">
                        <div className="flex items-center gap-2 text-gray-500 min-w-[110px]">
                          <Calendar className="h-4 w-4" />
                          <span>{window.appSettings?.formatDateTime(purchase.purchase_date, false) || new Date(purchase.purchase_date).toLocaleDateString()}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-start text-sm text-gray-500">
                        {/* this is showing like this value 010, 020, 015 so please remove the 0 from the starting. */}
                        {purchase.items?.reduce((sum: number, item: any) => sum + (Number(item.quantity) || 0), 0) || 0}
                      </TableCell>
                      <TableCell className="text-start font-mono text-sm text-gray-500">
                        {window.appSettings?.formatCurrency(purchase.total_amount) || `$${purchase.total_amount.toLocaleString()}`}
                      </TableCell>
                      <TableCell className="text-start">
                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${statusBadge.color}`}>
                          {statusBadge.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-start text-sm text-gray-500">
                        {purchase.notes || '-'}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500">
                    {t('No purchases found')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </PageTemplate>
  );
}