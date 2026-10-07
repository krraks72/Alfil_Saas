import { useState } from 'react';
import { PageTemplate } from '@/components/page-template';
import { usePage, router } from '@inertiajs/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from 'react-i18next';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, UserPlus, TrendingUp, ShoppingCart, Download } from 'lucide-react';
import { hasPermission } from '@/utils/authorization';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function CustomerAnalytics() {
  const { t } = useTranslation();
  const { filters, summary, topCustomers, customerAcquisition, auth } = usePage().props as any;
  const permissions = auth?.permissions || [];
  const getInitials = useInitials();
  
  const [dateFrom, setDateFrom] = useState(filters.date_from);
  const [dateTo, setDateTo] = useState(filters.date_to);
  const [chartView, setChartView] = useState(filters.chart_view || 'daily');

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.get(window.location.pathname, {
      date_from: dateFrom,
      date_to: dateTo,
      chart_view: chartView,
    });
  };

  const handleChartViewChange = (view: string) => {
    setChartView(view);
    router.get(window.location.pathname, {
      date_from: dateFrom,
      date_to: dateTo,
      chart_view: view,
    });
  };

  const breadcrumbs = [
    { title: t('Dashboard'), href: route('dashboard') },
    { title: t('Reports'), href: '#' },
    { title: t('Customer Report') }
  ];

  const handleExport = () => {
    const params = new URLSearchParams({
      date_from: dateFrom,
      date_to: dateTo,
    });
    window.location.href = `${route('reports.customer-analytics.export')}?${params.toString()}`;
  };



  return (
    <PageTemplate 
      title={t("Customer Report")} 
      breadcrumbs={breadcrumbs} 
      noPadding
      actions={hasPermission(permissions, 'export-reports') ? [
        {
          label: t('Export'),
          icon: <Download className="h-4 w-4" />,
          onClick: handleExport
        }
      ] : []}
      description={t('Customer acquisition and revenue analytics.')}
    >

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 overflow-hidden relative">
          <div className="absolute top-0 ltr:right-0 rtl:left-0 w-20 h-20 bg-blue-50 dark:bg-blue-700/20 ltr:rounded-bl-full rtl:rounded-br-full"></div>
          <div className="p-4 relative">
            <div className="flex items-start justify-between mb-3">
              <div className="text-start">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 capitalize tracking-wide mb-1">{t('Total Customers')}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{summary.total_customers}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('All time customers')}</p>
              </div>
              <div className="relative z-10 p-2.5 bg-blue-50 dark:bg-blue-700/20 rounded-xl mt-0.5">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 overflow-hidden relative">
          <div className="absolute top-0 ltr:right-0 rtl:left-0 w-20 h-20 bg-green-50 dark:bg-green-700/20 ltr:rounded-bl-full rtl:rounded-br-full"></div>
          <div className="p-4 relative">
            <div className="flex items-start justify-between mb-3">
              <div className="text-start">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 capitalize tracking-wide mb-1">{t('New Customers')}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{summary.new_customers}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('New in selected period')}</p>
              </div>
              <div className="relative z-10 p-2.5 bg-green-50 dark:bg-green-700/20 rounded-xl mt-0.5">
                <UserPlus className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 overflow-hidden relative">
          <div className="absolute top-0 ltr:right-0 rtl:left-0 w-20 h-20 bg-purple-50 dark:bg-purple-700/20 ltr:rounded-bl-full rtl:rounded-br-full"></div>
          <div className="p-4 relative">
            <div className="flex items-start justify-between mb-3">
              <div className="text-start">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 capitalize tracking-wide mb-1">{t('Repeat Customers')}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{summary.repeat_customers || 0}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('Returning customers')}</p>
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
        <form onSubmit={handleFilterSubmit} className="flex items-end gap-4">
          <div className="flex-1">
            <Label htmlFor="date_from">{t('From Date')}</Label>
            <Input
              id="date_from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <Label htmlFor="date_to">{t('To Date')}</Label>
            <Input
              id="date_to"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={router.processing}>{t('Apply Filters')}</Button>
        </form>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 mb-6">
        {/* Customer Acquisition Trend */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-start">{t('Customer Acquisition Trend')}</h3>
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
            <LineChart data={customerAcquisition}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                interval={customerAcquisition?.length > 10 ? Math.ceil(customerAcquisition.length / 8) : 0}
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
                labelFormatter={(value) => {
                  if (!value) return '';
                  return value; // Show raw date format
                }}
              />
              <Line type="monotone" dataKey="new_customers" stroke="#8884d8" strokeWidth={2} name="New Customers" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Top Customers Table */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-start">{t('Top Customers by Revenue')}</h3>
        <div className="max-h-115 overflow-auto border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-start">{t('Customer')}</TableHead>
                <TableHead className="text-start">{t('Phone')}</TableHead>
                <TableHead className="text-start">{t('Total Orders')}</TableHead>
                <TableHead className="text-start">{t('Total Spent')}</TableHead>
                <TableHead className="text-start">{t('Avg Order Value')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topCustomers && topCustomers.length > 0 ? (
                topCustomers.map((customer: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell className="text-start text-sm font-medium text-gray-900">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 shrink-0">
                          <AvatarFallback>{getInitials(customer.name)}</AvatarFallback>
                        </Avatar>
                        <div className="text-start">
                          <div className="font-medium text-gray-900 dark:text-gray-100">{customer.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{customer.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-start text-sm text-gray-500">
                      {customer.phone || '-'}
                    </TableCell>
                    <TableCell className="text-start text-sm text-gray-500">
                      {customer.total_orders}
                    </TableCell>
                    <TableCell className="text-start font-mono text-sm text-gray-500">
                      {window.appSettings?.formatCurrency(customer.total_spent) || `$${customer.total_spent.toLocaleString()}`}
                    </TableCell>
                    <TableCell className="text-start font-mono text-sm text-gray-500">
                      {window.appSettings?.formatCurrency(customer.avg_order_value) || `$${customer.avg_order_value.toLocaleString()}`}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-500">
                    {t('No customers found')}
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