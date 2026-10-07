import { useState } from 'react';
import { PageTemplate } from '@/components/page-template';
import { usePage, router } from '@inertiajs/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign, ShoppingCart, Users, Download } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { hasPermission } from '@/utils/authorization';

export default function SalesReport() {
  const { t } = useTranslation();
  const { filters, summary, chartData, topProducts, branches, cashRegisters, customers, auth } = usePage().props as any;
  const permissions = auth?.permissions || [];
  const isDemo = window.appSettings?.is_demo;
  
  const [dateFrom, setDateFrom] = useState(filters.date_from);
  const [dateTo, setDateTo] = useState(filters.date_to);
  const [branchId, setBranchId] = useState(filters.branch_id || 'all');
  const [cashRegisterId, setCashRegisterId] = useState(filters.cash_register_id || 'all');
  const [customerId, setCustomerId] = useState(filters.customer_id || 'all');
  const [chartView, setChartView] = useState(filters.chart_view || 'daily');

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (router.processing) return;
    router.get(window.location.pathname, {
      date_from: dateFrom,
      date_to: dateTo,
      branch_id: branchId === 'all' ? undefined : branchId,
      cash_register_id: cashRegisterId === 'all' ? undefined : cashRegisterId,
      customer_id: customerId === 'all' ? undefined : customerId,
      chart_view: chartView,
    });
  };

  const handleChartViewChange = (view: string) => {
    setChartView(view);
    router.get(window.location.pathname, {
      date_from: dateFrom,
      date_to: dateTo,
      branch_id: branchId === 'all' ? undefined : branchId,
      cash_register_id: cashRegisterId === 'all' ? undefined : cashRegisterId,
      customer_id: customerId === 'all' ? undefined : customerId,
      chart_view: view,
    });
  };

  const breadcrumbs = [
    { title: t('Dashboard'), href: '/dashboard' },
    { title: t('Reports'), href: '#' },
    { title: t('Sales Report') }
  ];

  const handleExport = async () => {
    const params = new URLSearchParams({
      date_from: dateFrom,
      date_to: dateTo,
      ...(branchId !== 'all' && { branch_id: branchId }),
      ...(cashRegisterId !== 'all' && { cash_register_id: cashRegisterId }),
      ...(customerId !== 'all' && { customer_id: customerId }),
    });
    window.location.href = `${route('reports.sales.export')}?${params.toString()}`;
  };





  return (
    <PageTemplate 
      title={t("Sales Report")} 
      breadcrumbs={breadcrumbs} 
      description={t('Track sales and revenue.')}
      noPadding
      actions={hasPermission(permissions, 'export-reports') ? [
        {
          label: t('Export'),
          icon: <Download className="h-4 w-4" />,
          onClick: handleExport
        }
      ] : []}
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-green-50 dark:bg-green-700/20 rounded-bl-full"></div>
          <div className="p-4 relative">
            <div className="flex items-start justify-between mb-3">
              <div className="text-left">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 capitalize tracking-wide mb-1">{t('Total Sales')}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {window.appSettings?.formatCurrency
                    ? <span className="font-mono">{window.appSettings.formatCurrency(summary.total_sales)}</span>
                    : <span className="font-mono">{`$${summary.total_sales.toLocaleString()}`}</span>
                  }
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('All time sales')}</p>
              </div>
              <div className="relative z-10 p-2.5 bg-green-50 dark:bg-green-700/20 rounded-xl mt-0.5">
                <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-50 dark:bg-blue-700/20 rounded-bl-full"></div>
          <div className="p-4 relative">
            <div className="flex items-start justify-between mb-3">
              <div className="text-left">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 capitalize tracking-wide mb-1">{t('Total Transactions')}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{summary.total_transactions}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('All time transactions')}</p>
              </div>
              <div className="relative z-10 p-2.5 bg-blue-50 dark:bg-blue-700/20 rounded-xl mt-0.5">
                <ShoppingCart className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-50 dark:bg-purple-700/20 rounded-bl-full"></div>
          <div className="p-4 relative">
            <div className="flex items-start justify-between mb-3">
              <div className="text-left">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 capitalize tracking-wide mb-1">{t('Avg Transaction')}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {window.appSettings?.formatCurrency
                    ? <span className="font-mono">{window.appSettings.formatCurrency(summary.avg_transaction_value)}</span>
                    : <span className="font-mono">{`$${summary.avg_transaction_value.toLocaleString()}`}</span>
                  }
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('Average per transaction')}</p>
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
        <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
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
            <Label htmlFor="branch">{t('Branch')}</Label>
            <Select value={branchId} onValueChange={setBranchId}>
              <SelectTrigger>
                <SelectValue placeholder={t('All Branches')} />
              </SelectTrigger>
              <SelectContent searchable>
                <SelectItem value="all">{t('All Branches')}</SelectItem>
                {branches?.map((branch: any) => (
                  <SelectItem key={branch.id} value={branch.id.toString()}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="cash_register">{t('Cash Register')}</Label>
            <Select value={cashRegisterId} onValueChange={setCashRegisterId}>
              <SelectTrigger>
                <SelectValue placeholder={t('All Cash Registers')} />
              </SelectTrigger>
              <SelectContent searchable>
                <SelectItem value="all">{t('All Cash Registers')}</SelectItem>
                {cashRegisters?.map((register: any) => (
                  <SelectItem key={register.id} value={register.id.toString()}>
                    {register.name} ({register.branch?.name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="customer">{t('Customer')}</Label>
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger>
                <SelectValue placeholder={t('All Customers')} />
              </SelectTrigger>
              <SelectContent searchable>
                <SelectItem value="all">{t('All Customers')}</SelectItem>
                {customers?.map((customer: any) => (
                  <SelectItem key={customer.id} value={customer.id.toString()}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={router.processing}>{t('Apply Filters')}</Button>
        </form>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 mb-6">
        {/* Sales Trend Chart */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{t('Sales Trend')}</h3>
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
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="period" 
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
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
                formatter={(value) => [window.appSettings?.formatCurrency(Number(value)) || `$${Number(value).toLocaleString()}`, t('Sales')]}
                labelFormatter={(value) => {
                  if (!value) return '';
                  return value; // Show raw date format
                }}
              />
              <Line 
                type="monotone" 
                dataKey="total" 
                stroke="#8884d8" 
                strokeWidth={2}
                dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Top Products Table */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-start">{t('Top Selling Products')}</h3>
        <div className="max-h-115 overflow-auto border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-start">{t('Product')}</TableHead>
                <TableHead className="text-start">{t('Qty Sold')}</TableHead>
                <TableHead className="text-start">{t('Revenue')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topProducts && topProducts.length > 0 ? (
                topProducts.map((product: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell className="text-start">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={`${window.appSettings?.baseUrl || ''}${product?.image}`}
                          alt={product.name}
                          className="w-9 h-9 sm:w-10 sm:h-10 object-cover rounded shrink-0 cursor-pointer"
                          onClick={() => window.open(`${window.appSettings?.baseUrl || ''}${product?.image}` || `${window.appSettings?.baseUrl || ''}/images/default/image-not-found.jpg`, '_blank')}
                          onError={(e) => { (e.target as HTMLImageElement).src = `${window.appSettings?.baseUrl || ''}/images/default/image-not-found.jpg`; }}
                        />
                        <div className="min-w-0">
                          <p className="font-medium block w-full text-start truncate text-sm text-gray-900 dark:text-white">
                            {product.name}
                          </p>
                          {product.sku && (
                            <p className="flex items-center gap-1 text-xs text-gray-500 mt-0.5 min-w-0" title={`${product.name} | ${product.sku}`}>
                              <span className="truncate">{product.sku}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-start text-sm text-gray-500 dark:text-gray-400">
                      {Number(product.total_quantity).toLocaleString()}{product.unit_name ? ` ${product.unit_name}` : ''}
                    </TableCell>
                    <TableCell className="text-start text-sm font-mono text-gray-500 dark:text-gray-400">
                      {window.appSettings?.formatCurrency(product.total_revenue) || `$${product.total_revenue.toLocaleString()}`}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-gray-500">
                    {t('No products found')}
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