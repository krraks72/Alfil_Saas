import { useState } from 'react';
import { PageTemplate } from '@/components/page-template';
import { usePage, router } from '@inertiajs/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from 'react-i18next';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Receipt, Percent, DollarSign, TrendingUp, Download, Calendar } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { hasPermission } from '@/utils/authorization';

export default function TaxReport() {
  const { t } = useTranslation();
  const { filters, summary, dailyTaxCollection, branches, cashRegisters, auth } = usePage().props as any;
  const permissions = auth?.permissions || [];
  
  const [dateFrom, setDateFrom] = useState(filters.date_from);
  const [dateTo, setDateTo] = useState(filters.date_to);
  const [branchId, setBranchId] = useState(filters.branch_id || 'all');
  const [cashRegisterId, setCashRegisterId] = useState(filters.cash_register_id || 'all');
  const [chartView, setChartView] = useState(filters.chart_view || 'daily');

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.get(window.location.pathname, {
      date_from: dateFrom,
      date_to: dateTo,
      branch_id: branchId === 'all' ? undefined : branchId,
      cash_register_id: cashRegisterId === 'all' ? undefined : cashRegisterId,
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
      chart_view: view,
    });
  };

  const breadcrumbs = [
    { title: t('Dashboard'), href: '/dashboard' },
    { title: t('Reports'), href: '#' },
    { title: t('Tax Report') }
  ];

  const handleExport = () => {
    const params = new URLSearchParams({
      date_from: dateFrom,
      date_to: dateTo,
      ...(branchId !== 'all' && { branch_id: branchId }),
      ...(cashRegisterId !== 'all' && { cash_register_id: cashRegisterId }),
    });
    window.location.href = `${route('reports.tax.export')}?${params.toString()}`;
  };



  return (
    <PageTemplate 
      title={t("Tax Report")} 
      breadcrumbs={breadcrumbs} 
      noPadding
      actions={hasPermission(permissions, 'export-reports') ? [
        {
          label: t('Export'),
          icon: <Download className="h-4 w-4" />,
          onClick: handleExport
        }
      ] : []}
      description={t('Track and analyze your tax reports.')}
    >

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 overflow-hidden relative">
          <div className="absolute top-0 ltr:right-0 rtl:left-0 w-20 h-20 bg-green-50 dark:bg-green-700/20 ltr:rounded-bl-full rtl:rounded-br-full"></div>
          <div className="p-4 relative">
            <div className="flex items-start justify-between mb-3">
              <div className="text-start">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 capitalize tracking-wide mb-1">{t('Total Tax Collected')}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {window.appSettings?.formatCurrency
                    ? <span className="font-mono">{window.appSettings.formatCurrency(summary.total_tax_collected)}</span>
                    : <span className="font-mono">{`$${summary.total_tax_collected.toLocaleString()}`}</span>
                  }
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('All time tax collected')}</p>
              </div>
              <div className="relative z-10 p-2.5 bg-green-50 dark:bg-green-700/20 rounded-xl mt-0.5">
                <Receipt className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 overflow-hidden relative">
          <div className="absolute top-0 ltr:right-0 rtl:left-0 w-20 h-20 bg-blue-50 dark:bg-blue-700/20 ltr:rounded-bl-full rtl:rounded-br-full"></div>
          <div className="p-4 relative">
            <div className="flex items-start justify-between mb-3">
              <div className="text-start">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 capitalize tracking-wide mb-1">{t('Total Sales Amount')}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {window.appSettings?.formatCurrency
                    ? <span className="font-mono">{window.appSettings.formatCurrency(summary.total_sales_amount)}</span>
                    : <span className="font-mono">{`$${summary.total_sales_amount.toLocaleString()}`}</span>
                  }
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('All time sales amount')}</p>
              </div>
              <div className="relative z-10 p-2.5 bg-blue-50 dark:bg-blue-700/20 rounded-xl mt-0.5">
                <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 overflow-hidden relative">
          <div className="absolute top-0 ltr:right-0 rtl:left-0 w-20 h-20 bg-purple-50 dark:bg-purple-700/20 ltr:rounded-bl-full rtl:rounded-br-full"></div>
          <div className="p-4 relative">
            <div className="flex items-start justify-between mb-3">
              <div className="text-start">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 capitalize tracking-wide mb-1">{t('Average Tax Rate')}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{summary.avg_tax_rate.toFixed(2)}%</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('Average across all sales')}</p>
              </div>
              <div className="relative z-10 p-2.5 bg-purple-50 dark:bg-purple-700/20 rounded-xl mt-0.5">
                <Percent className="h-5 w-5 text-purple-600 dark:text-purple-400" />
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
          <Button type="submit">{t('Apply Filters')}</Button>
        </form>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 mb-6">
        {/* Tax Collection Trend */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-start">{t('Tax Collection Trend')}</h3>
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
            <LineChart data={dailyTaxCollection}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
                tickFormatter={(value) => {
                  if (!value) return '';
                  return value;
                }}
              />
              <YAxis />
              <Tooltip 
                formatter={(value) => [window.appSettings?.formatCurrency(Number(value)) || `$${Number(value).toLocaleString()}`, t('Tax Collected')]}
                labelFormatter={(value) => {
                  if (!value) return '';
                  return value;
                }}
              />
              <Line type="monotone" dataKey="tax_collected" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Tax Summary Table */}
      <Card className="p-6 mt-6">
        <h3 className="text-lg font-semibold mb-6 text-start">{t('Tax Summary')}</h3>
        <div className="max-h-115 overflow-auto border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-start">{t('Description')}</TableHead>
                <TableHead className="text-start">{t('Amount')}</TableHead>
                <TableHead className="text-start">{t('Percentage')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="text-start text-sm font-medium text-gray-900 dark:text-gray-100">
                  {t('Total Sales (Including Tax)')}
                </TableCell>
                <TableCell className="text-start font-mono text-sm text-gray-500">
                  {window.appSettings?.formatCurrency(summary.total_sales_amount) || `$${summary.total_sales_amount.toLocaleString()}`}
                </TableCell>
                <TableCell className="text-start text-sm text-gray-500">
                  100.00%
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-start text-sm font-medium text-gray-900 dark:text-gray-100">
                  {t('Tax Collected')}
                </TableCell>
                <TableCell className="text-start text-sm text-green-600 font-mono">
                  {window.appSettings?.formatCurrency(summary.total_tax_collected) || `$${summary.total_tax_collected.toLocaleString()}`}
                </TableCell>
                <TableCell className="text-start text-sm text-green-600 font-semibold">
                  {summary.avg_tax_rate.toFixed(2)}%
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-start text-sm font-medium text-gray-900 dark:text-gray-100">
                  {t('Sales (Excluding Tax)')}
                </TableCell>
                <TableCell className="text-start font-mono text-sm text-gray-500">
                  {window.appSettings?.formatCurrency(summary.total_sales_amount - summary.total_tax_collected) || `$${(summary.total_sales_amount - summary.total_tax_collected).toLocaleString()}`}
                </TableCell>
                <TableCell className="text-start text-sm text-gray-500">
                  {(100 - summary.avg_tax_rate).toFixed(2)}%
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Tax Collection Details */}
      <Card className="p-6 mt-6">
        <h3 className="text-lg font-semibold mb-6 text-start">{t('Daily Tax Collection Details')}</h3>
        <div className="max-h-115 overflow-auto border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-start">{t('Date')}</TableHead>
                <TableHead className="text-start">{t('Total Sales')}</TableHead>
                <TableHead className="text-start">{t('Tax Collected')}</TableHead>
                <TableHead className="text-start">{t('Tax Rate')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dailyTaxCollection && dailyTaxCollection.length > 0 ? (
                dailyTaxCollection.map((day: any, index: number) => {
                  const taxRate = day.total_sales > 0 ? (day.tax_collected / day.total_sales) * 100 : 0;
                  
                  return (
                    <TableRow key={index}>
                      <TableCell className="text-start text-sm font-medium text-gray-900">
                        <div className="flex items-center gap-2 text-gray-500 min-w-[110px]">
                          <Calendar className="h-4 w-4" />
                          <span>{window.appSettings.formatDateTime(day.date,false)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-start font-mono text-sm text-gray-500">
                        {window.appSettings?.formatCurrency(day.total_sales) || `$${day.total_sales.toLocaleString()}`}
                      </TableCell>
                      <TableCell className="text-start text-sm text-green-600 font-mono">
                        {window.appSettings?.formatCurrency(day.tax_collected) || `$${day.tax_collected.toLocaleString()}`}
                      </TableCell>
                      <TableCell className="text-start text-sm text-gray-500">
                        {taxRate.toFixed(2)}%
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-gray-500">
                    {t('No tax data found')}
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